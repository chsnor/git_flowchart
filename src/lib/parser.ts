import { GitHubTreeItem, CodeRelation, NextFileType } from '../types';

const BLACKLIST_FOLDERS = [
  'node_modules/',
  '.next/',
  'dist/',
  'build/',
  'public/',
  '.git/',
  '.github/',
  'coverage/',
  '__tests__/',
  'tests/',
  'test/',
  'docs/',
  'scripts/',
  'config/',
  'configs/',
  'cypress/',
  'e2e/',
];

const BLACKLIST_FILES = new Set([
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  'bun.lockb',
  'tsconfig.json',
  'jsconfig.json',
  'readme.md',
  '.gitignore',
  'package.json',
  'next.config.js',
  'next.config.mjs',
  'next.config.ts',
  'tailwind.config.js',
  'tailwind.config.ts',
  'postcss.config.js',
  'postcss.config.mjs',
  'vite.config.ts',
  'vite.config.js',
  'vitest.config.ts',
  'vitest.config.js',
  'jest.config.js',
  'jest.config.ts',
]);

const ALLOWED_ROOT_FILES = new Set([
  'middleware.ts',
  'middleware.js',
  'proxy.ts',
  'proxy.js',
]);

const VALID_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

const COMPONENT_FOLDER_REGEX = /(^|\/)_?(components?|ui|widgets?|views?)\//i;
const ACTION_FOLDER_REGEX = /(^|\/)actions?\//i;
const STORE_FOLDER_REGEX = /(^|\/)(stores?|contexts?|state)\//i;
const HOOK_FOLDER_REGEX = /(^|\/)hooks?\//i;
const API_FOLDER_REGEX = /(^|\/)api\//i;
const PAGES_ROUTER_REGEX = /(^|\/)pages\//i;

const STORE_FILE_REGEX = /(?:[a-zA-Z0-9]*[Ss]tore|[-_.]stores?|^stores?)\.(tsx?|jsx?)$/;
const HOOK_FILE_REGEX = /^use[A-Z][\w-]*\.(tsx?|jsx?)$/;

function shouldIgnorePath(lowerPath: string, fileName: string, isRootFile: boolean): boolean {
  if (fileName.startsWith('.')) return true;
  if (BLACKLIST_FILES.has(fileName)) return true;
  if (BLACKLIST_FOLDERS.some((folder) => lowerPath.includes(folder))) return true;

  if (
    fileName.endsWith('.d.ts') ||
    fileName.includes('.config.') ||
    fileName.includes('.test.') ||
    fileName.includes('.spec.') ||
    fileName.includes('.cy.') ||
    fileName.includes('.min.')
  ) {
    return true;
  }

  if (!VALID_EXTENSIONS.some((ext) => fileName.endsWith(ext))) return true;
  if (isRootFile && !ALLOWED_ROOT_FILES.has(fileName)) return true;

  return false;
}

export function filterTreeFiles(items: GitHubTreeItem[], maxLimit = 250): GitHubTreeItem[] {
  if (!Array.isArray(items)) return [];

  const filtered: GitHubTreeItem[] = [];

  for (const item of items) {
    if (filtered.length >= maxLimit) break;
    if (!item || item.type !== 'blob' || !item.path) continue;

    const normalizedPath = item.path.replace(/\\/g, '/');
    const lowerPath = normalizedPath.toLowerCase();
    const lastSlash = lowerPath.lastIndexOf('/');
    const fileName = lastSlash !== -1 ? lowerPath.slice(lastSlash + 1) : lowerPath;
    const isRootFile = lastSlash === -1;

    if (shouldIgnorePath(lowerPath, fileName, isRootFile)) {
      continue;
    }

    filtered.push(item);
  }

  return filtered;
}

export function detectNextFileType(filePath: string): NextFileType {
  if (!filePath || typeof filePath !== 'string') return 'other';

  const normalizedPath = filePath.replace(/\\/g, '/');
  const lowerPath = normalizedPath.toLowerCase();
  const lastSlash = normalizedPath.lastIndexOf('/');
  const fileName = lastSlash !== -1 ? normalizedPath.slice(lastSlash + 1) : normalizedPath;

  if (ALLOWED_ROOT_FILES.has(fileName)) {
    return 'middleware';
  }

  if (/^page\.(tsx|ts|jsx|js)$/.test(fileName)) return 'page';
  if (/^layout\.(tsx|ts|jsx|js)$/.test(fileName)) return 'layout';
  if (/^route\.(tsx|ts|jsx|js)$/.test(fileName)) return 'api';

  if (PAGES_ROUTER_REGEX.test(lowerPath)) {
    return API_FOLDER_REGEX.test(normalizedPath) ? 'api' : 'page';
  }

  if (API_FOLDER_REGEX.test(normalizedPath)) return 'api';
  if (ACTION_FOLDER_REGEX.test(normalizedPath)) return 'action';
  if (STORE_FOLDER_REGEX.test(normalizedPath)) return 'store';
  if (HOOK_FOLDER_REGEX.test(normalizedPath)) return 'hook';
  if (COMPONENT_FOLDER_REGEX.test(normalizedPath)) return 'component';

  if (/^actions?\.(tsx|ts|jsx|js)$/.test(fileName)) return 'action';
  if (STORE_FILE_REGEX.test(fileName)) return 'store';
  if (HOOK_FILE_REGEX.test(fileName)) return 'hook';

  return 'other';
}

export function extractImportsFromCode(sourcePath: string, codeContent: string): CodeRelation[] {
  if (!codeContent || typeof codeContent !== 'string' || !codeContent.includes('import')) {
    return [];
  }

  const cleanCode = codeContent.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
  const relations: CodeRelation[] = [];
  const seenTargets = new Set<string>();
  const importRegex = /import(?:\s+type)?(?:\s+[\s\S]*?\s+from)?\s+['"]([^'"]+)['"]/g;

  let match: RegExpExecArray | null;
  while ((match = importRegex.exec(cleanCode)) !== null) {
    const importPath = match[1];

    if (importPath && /^(\.|\.\.|\@|\~)\//.test(importPath) && !seenTargets.has(importPath)) {
      seenTargets.add(importPath);
      relations.push({
        source: sourcePath,
        target: importPath,
        type: 'import',
      });
    }
  }

  return relations;
}

