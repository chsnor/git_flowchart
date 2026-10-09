import { parseGitHubUrl, buildGitHubApiUrl, buildGitHubHeaders } from './github';
import { filterTreeFiles, detectNextFileType, extractImportsFromCode } from './parser';
import { buildFlowElements } from './generator';
import { AnalysisResult, GitHubTreeItem, CodeRelation, NextFileType } from '../types';

const MAX_FILTERED_FILES = 500;
const MAX_RAW_FETCH_FILES = 45;
const FETCH_TIMEOUT_MS = 4000;

const pipelineCache = new Map<string, AnalysisResult>();

const COMMON_EXTENSIONS = ['', '.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx', '/index.js'];

function resolveAliasImport(rawTarget: string, allFilePaths: string[]): string | null {
  const clean = rawTarget.slice(2);
  for (const prefix of ['src/', '']) {
    for (const ext of COMMON_EXTENSIONS) {
      const candidate = `${prefix}${clean}${ext}`.toLowerCase();
      const match = allFilePaths.find((p) => p.toLowerCase() === candidate);
      if (match) return match;
    }
  }
  return null;
}

function resolveRelativeImport(cleanTarget: string, sourcePath: string, allFilePaths: string[]): string | null {
  const sourceDir = sourcePath.includes('/') ? sourcePath.slice(0, sourcePath.lastIndexOf('/')) : '';
  const parts = sourceDir ? sourceDir.split('/') : [];

  for (const seg of cleanTarget.split('/')) {
    if (seg === '.' || !seg) continue;
    if (seg === '..') parts.pop();
    else parts.push(seg);
  }

  const resolvedBase = parts.join('/');
  for (const ext of COMMON_EXTENSIONS) {
    const candidate = `${resolvedBase}${ext}`.toLowerCase();
    const match = allFilePaths.find((p) => p.toLowerCase() === candidate);
    if (match) return match;
  }
  return null;
}

function resolveImportToFilePath(
  importTarget: string,
  sourcePath: string,
  allFilePaths: string[]
): string | null {
  if (!importTarget) return null;
  const cleanTarget = importTarget.replace(/['"]/g, '').trim();

  if (cleanTarget.startsWith('@/') || cleanTarget.startsWith('~/')) {
    return resolveAliasImport(cleanTarget, allFilePaths);
  }

  if (cleanTarget.startsWith('.')) {
    return resolveRelativeImport(cleanTarget, sourcePath, allFilePaths);
  }

  const baseName = cleanTarget.split('/').pop()?.toLowerCase();
  if (baseName) {
    return allFilePaths.find((p) => {
      const fName = p.split('/').pop()?.replace(/\.[^.]+$/, '').toLowerCase();
      return fName === baseName;
    }) || null;
  }

  return null;
}

function inferStructuralRelations(
  files: Array<{ path: string; fileType: NextFileType }>
): CodeRelation[] {
  const relations: CodeRelation[] = [];
  const uniqueKeys = new Set<string>();

  const addRelation = (rel: CodeRelation) => {
    if (!rel.source || !rel.target || rel.source === rel.target) return;
    const key = `${rel.source}->${rel.target}`;
    if (!uniqueKeys.has(key)) {
      uniqueKeys.add(key);
      relations.push(rel);
    }
  };

  const middlewareFile = files.find((f) => f.fileType === 'middleware');
  const rootLayout =
    files.find((f) => /(^|\/)(src\/)?app\/layout\.[jt]sx?$/.test(f.path)) ||
    files.find((f) => /(^|\/)layout\.[jt]sx?$/.test(f.path));
  const rootPage =
    files.find((f) => /(^|\/)(src\/)?app\/page\.[jt]sx?$/.test(f.path)) ||
    files.find((f) => /(^|\/)page\.[jt]sx?$/.test(f.path));
  const rootEntry = rootLayout || rootPage || files.find((f) => f.fileType === 'page');

  if (middlewareFile && rootEntry) {
    addRelation({
      source: middlewareFile.path,
      target: rootEntry.path,
      type: 'import',
      label: 'routes to',
    });
  }

  const routeFiles = files.filter((f) => /(^|\/)(app|pages)\//.test(f.path));
  const otherFiles = files.filter((f) => !/(^|\/)(app|pages)\//.test(f.path));

  const routeDirMap = new Map<string, Array<{ path: string; fileType: NextFileType }>>();
  for (const file of routeFiles) {
    const lastSlash = file.path.lastIndexOf('/');
    const dir = lastSlash === -1 ? '' : file.path.substring(0, lastSlash);
    if (!routeDirMap.has(dir)) routeDirMap.set(dir, []);
    routeDirMap.get(dir)!.push(file);
  }

  for (const [dir, dirFiles] of routeDirMap.entries()) {
    const pageInDir = dirFiles.find((f) => f.fileType === 'page');
    const layoutInDir = dirFiles.find((f) => /(^|\/)layout\.[jt]sx?$/.test(f.path));
    const mainAnchor = pageInDir || layoutInDir;

    if (layoutInDir && pageInDir && layoutInDir.path !== pageInDir.path) {
      addRelation({
        source: layoutInDir.path,
        target: pageInDir.path,
        type: 'import',
        label: 'renders',
      });
    }

    for (const f of dirFiles) {
      if (!mainAnchor || f.path === mainAnchor.path) continue;
      if (f.fileType === 'action') {
        addRelation({
          source: mainAnchor.path,
          target: f.path,
          type: 'action',
          label: 'server action',
        });
      } else if (/(loading|error|not-found)\.[jt]sx?$/.test(f.path)) {
        addRelation({
          source: mainAnchor.path,
          target: f.path,
          type: 'import',
          label: 'route state',
        });
      }
    }

    if (dir && mainAnchor) {
      const lastSlash = dir.lastIndexOf('/');
      const parentDir = lastSlash === -1 ? '' : dir.substring(0, lastSlash);
      const parentFiles = routeDirMap.get(parentDir);

      if (parentFiles) {
        const parentAnchor = parentFiles.find((f) => /(^|\/)layout\.[jt]sx?$/.test(f.path)) || parentFiles.find((f) => f.fileType === 'page');
        if (parentAnchor && parentAnchor.path !== mainAnchor.path) {
          addRelation({
            source: parentAnchor.path,
            target: mainAnchor.path,
            type: 'import',
            label: 'sub-route',
          });
        }
      } else if (rootEntry && rootEntry.path !== mainAnchor.path) {
        addRelation({
          source: rootEntry.path,
          target: mainAnchor.path,
          type: 'import',
          label: 'sub-route',
        });
      }
    }
  }

  const allPages = routeFiles.filter((f) => f.fileType === 'page');
  for (const item of otherFiles) {
    const itemName = item.path.split('/').pop()?.replace(/\.[^.]+$/, '').toLowerCase() || '';

    const matchedPage = allPages.find((p) => {
      const pageDir = p.path.toLowerCase().split('/').slice(0, -1).pop() || '';
      return pageDir && pageDir !== 'app' && pageDir !== 'src' && itemName.includes(pageDir);
    }) || rootEntry || allPages[0];

    if (matchedPage) {
      addRelation({
        source: matchedPage.path,
        target: item.path,
        type: 'import',
        label: matchedPage !== rootEntry ? 'uses component' : 'shared UI',
      });
    }

    if (item.fileType === 'store') {
      const stem = itemName.replace(/store$/, '');
      if (stem.length >= 3) {
        for (const comp of otherFiles) {
          if (comp.fileType === 'component' && comp.path.toLowerCase().includes(stem)) {
            addRelation({
              source: comp.path,
              target: item.path,
              type: 'import',
              label: 'uses store',
            });
          }
        }
      }
    }
  }

  return relations;
}

async function fetchGitHubTree(
  owner: string,
  repo: string,
  initialBranch: string,
  token?: string
): Promise<{ treeData: GitHubTreeItem[]; activeBranch: string; treeSha?: string }> {
  let activeBranch = initialBranch;

  try {
    let response = await fetch(
      buildGitHubApiUrl(owner, repo, activeBranch),
      { headers: buildGitHubHeaders(token) }
    );

    if (response.status === 404 && activeBranch === 'main') {
      const fallbackResponse = await fetch(
        buildGitHubApiUrl(owner, repo, 'master'),
        { headers: buildGitHubHeaders(token) }
      );
      if (fallbackResponse.ok) {
        response = fallbackResponse;
        activeBranch = 'master';
      }
    }

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('❌ GitHub Token ไม่ถูกต้อง (401 Bad credentials) กรุณาตรวจสอบ Token อีกครั้ง หรือเว้นว่างไว้เพื่อใช้งานแบบสาธารณะ');
      }
      if (response.status === 404) {
        throw new Error('❌ ไม่พบคลังโค้ดนี้บน GitHub หรือไม่พบ Branch');
      }
      if (response.status === 403) {
        throw new Error('❌ GitHub API ติด Rate Limit หรือ Access Denied กรุณาแนบ Personal Access Token เพื่อเพิ่มโควต้า');
      }
      throw new Error(`GitHub API Error: ${response.status}`);
    }

    const json = await response.json();
    return {
      treeData: Array.isArray(json.tree) ? json.tree : [],
      activeBranch,
      treeSha: typeof json.sha === 'string' ? json.sha : undefined,
    };
  } catch (error: unknown) {
    const err = error as { message?: string };
    if (err?.message && (err.message.includes('❌') || err.message.includes('401') || err.message.includes('Rate Limit'))) {
      throw error;
    }
    throw new Error('ไม่สามารถเชื่อมต่อ GitHub ได้ กรุณาตรวจสอบการเชื่อมต่อหรือแนบ Token');
  }
}

function extractRelationsFromContent(
  filesContent: Record<string, string>,
  filesWithTypes: Array<{ path: string; fileType: NextFileType }>,
  allPaths: string[]
): CodeRelation[] {
  const relations: CodeRelation[] = [];
  const seenKeys = new Set<string>();

  for (const [filePath, content] of Object.entries(filesContent)) {
    try {
      const rawImports = extractImportsFromCode(filePath, content);
      for (const imp of rawImports) {
        const target = resolveImportToFilePath(imp.target, filePath, allPaths) || imp.target;
        if (target && target !== filePath) {
          const key = `${filePath}->${target}`;
          if (!seenKeys.has(key)) {
            seenKeys.add(key);
            const targetType = filesWithTypes.find((f) => f.path === target)?.fileType ?? 'other';
            const label =
              targetType === 'store'
                ? 'uses store'
                : targetType === 'action'
                ? 'server action'
                : targetType === 'component'
                ? 'uses component'
                : 'imports';

            relations.push({
              source: filePath,
              target,
              type: targetType === 'store' ? 'import' : targetType === 'action' ? 'action' : 'import',
              label,
            });
          }
        }
      }
    } catch {}
  }

  return relations;
}

export async function runAnalysisPipeline(
  githubUrl: string,
  token?: string,
  mockTreeData?: GitHubTreeItem[],
  mockFilesContent?: Record<string, string>
): Promise<AnalysisResult> {
  const startTime = performance.now();

  const parsed = parseGitHubUrl(githubUrl);
  if (!parsed || !parsed.owner || !parsed.repo) {
    throw new Error('URL ต้องมาจาก github.com เท่านั้น (เช่น https://github.com/owner/repo)');
  }

  const { owner, repo } = parsed;
  let activeBranch = parsed.branch || 'main';
  const effectiveToken = token?.trim() || process.env.GITHUB_TOKEN?.trim() || undefined;
  const cacheKey = githubUrl.trim().toLowerCase();

  if (pipelineCache.has(cacheKey)) {
    const cached = pipelineCache.get(cacheKey)!;
    return {
      ...cached,
      isCached: true,
      executionTimeMs: performance.now() - startTime,
    };
  }

  let treeData: GitHubTreeItem[] = [];
  let treeSha: string | undefined = undefined;
  if (mockTreeData) {
    treeData = mockTreeData;
  } else {
    const fetched = await fetchGitHubTree(owner, repo, activeBranch, effectiveToken);
    treeData = fetched.treeData;
    activeBranch = fetched.activeBranch;
    treeSha = fetched.treeSha;
  }

  const filteredItems = filterTreeFiles(treeData, MAX_FILTERED_FILES);

  const filesWithTypes = filteredItems.map((item) => ({
    path: item.path,
    fileType: detectNextFileType(item.path),
  }));

  const allPaths = filesWithTypes.map((f) => f.path);
  let relations: CodeRelation[] = [];
  let filesContentToProcess: Record<string, string> | null = mockFilesContent || null;

  if (!filesContentToProcess && !mockTreeData && filesWithTypes.length > 0) {
    try {
      const candidates = filesWithTypes.slice(0, MAX_RAW_FETCH_FILES);
      const fetchPromises = candidates.map(async (f) => {
        try {
          const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${activeBranch}/${f.path}`;
          const headers: Record<string, string> = {};
          if (effectiveToken) headers['Authorization'] = `Bearer ${effectiveToken}`;
          const res = await fetch(rawUrl, { headers, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
          return res.ok ? { path: f.path, text: await res.text() } : { path: f.path, text: '' };
        } catch {
          return { path: f.path, text: '' };
        }
      });

      const fetchedResults = await Promise.all(fetchPromises);
      const contentMap: Record<string, string> = {};
      let hasValidContent = false;
      for (const item of fetchedResults) {
        if (item.text) {
          contentMap[item.path] = item.text;
          hasValidContent = true;
        }
      }
      if (hasValidContent) filesContentToProcess = contentMap;
    } catch {}
  }

  if (filesContentToProcess) {
    relations = extractRelationsFromContent(filesContentToProcess, filesWithTypes, allPaths);
  }

  if (relations.length === 0 && filesWithTypes.length > 0) {
    relations.push(...inferStructuralRelations(filesWithTypes));
  }

  const flowElements = buildFlowElements(filesWithTypes, relations);

  const finalResult: AnalysisResult = {
    repoName: repo,
    owner,
    branch: activeBranch,
    commitSha: treeSha,
    totalFiles: treeData.length,
    filteredFilesCount: filteredItems.length,
    relations,
    nodes: flowElements.nodes,
    edges: flowElements.edges,
    isCached: false,
    cachedAt: Date.now(),
    executionTimeMs: performance.now() - startTime,
  };

  pipelineCache.set(cacheKey, finalResult);
  return finalResult;
}

