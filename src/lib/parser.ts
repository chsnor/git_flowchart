// src/lib/parser.ts
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
];

const BLACKLIST_FILES = new Set([
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  'bun.lockb',
  'tsconfig.json',
  'readme.md',
  '.gitignore',
  'package.json',
]);

const VALID_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

/**
 * คัดกรองเฉพาะไฟล์โค้ดสำคัญ โดยกรองไฟล์คอนฟิก, ไฟล์ทดสอบ, ไฟล์ประเภท .d.ts และโฟลเดอร์ที่ไม่เกี่ยวข้องออก
 */
export function filterTreeFiles(items: GitHubTreeItem[], maxLimit = 150): GitHubTreeItem[] {
  if (!Array.isArray(items)) return [];

  const filtered: GitHubTreeItem[] = [];

  for (let i = 0; i < items.length; i++) {
    if (filtered.length >= maxLimit) break;

    const item = items[i];
    if (!item || item.type !== 'blob' || !item.path) continue;

    const path = item.path.toLowerCase();
    const lastSlash = path.lastIndexOf('/');
    const fileName = lastSlash !== -1 ? path.slice(lastSlash + 1) : path;

    // 1. ข้ามไฟล์ซ่อน (เช่น .env, .gitignore)
    if (fileName.startsWith('.')) continue;

    // 2. ข้ามไฟล์ที่อยู่ใน Blacklist
    if (BLACKLIST_FILES.has(fileName)) continue;

    // 3. ข้ามโฟลเดอร์ที่ไม่เกี่ยวข้อง
    if (BLACKLIST_FOLDERS.some((folder) => path.includes(folder))) continue;

    // 4. ข้ามไฟล์ declaration (.d.ts), config (*.config.*), และ test (*.test.*, *.spec.*)
    if (
      fileName.endsWith('.d.ts') ||
      fileName.includes('.config.') ||
      fileName.includes('.test.') ||
      fileName.includes('.spec.')
    ) {
      continue;
    }

    // 5. ต้องมีนามสกุลไฟล์ซอร์สโค้ดที่ถูกต้อง (.ts, .tsx, .js, .jsx)
    if (VALID_EXTENSIONS.some((ext) => fileName.endsWith(ext))) {
      filtered.push(item);
    }
  }

  return filtered;
}

/**
 * จำแนกประเภทของไฟล์ตามสถาปัตยกรรม Next.js
 */
export function detectNextFileType(filePath: string): NextFileType {
  if (!filePath || typeof filePath !== 'string') return 'other';

  const normalizedPath = filePath.replace(/\\/g, '/');
  const lastSlash = normalizedPath.lastIndexOf('/');
  const fileName = lastSlash !== -1 ? normalizedPath.slice(lastSlash + 1) : normalizedPath;

  if (
    fileName === 'middleware.ts' ||
    fileName === 'middleware.js' ||
    fileName === 'proxy.ts' ||
    fileName === 'proxy.js'
  ) {
    return 'middleware';
  }

  if (/^page\.(tsx|ts|jsx|js)$/.test(fileName)) return 'page';
  if (/^layout\.(tsx|ts|jsx|js)$/.test(fileName)) return 'layout';

  if (
    /^actions?\.(tsx|ts|jsx|js)$/.test(fileName) ||
    normalizedPath.includes('/actions/') ||
    normalizedPath.startsWith('actions/')
  ) {
    return 'action';
  }

  if (
    normalizedPath.includes('/stores/') ||
    normalizedPath.includes('/context/') ||
    normalizedPath.includes('/state/') ||
    normalizedPath.startsWith('stores/') ||
    normalizedPath.startsWith('context/') ||
    normalizedPath.startsWith('state/')
  ) {
    return 'store';
  }

  if (
    /^route\.(tsx|ts|jsx|js)$/.test(fileName) ||
    normalizedPath.includes('/api/') ||
    normalizedPath.startsWith('api/')
  ) {
    return 'api';
  }

  if (
    normalizedPath.includes('/components/') ||
    normalizedPath.startsWith('components/')
  ) {
    return 'component';
  }

  return 'other';
}

/**
 * ดึงข้อมูลการ import และคัดกรองบรรทัดที่เป็น comment ออกก่อนประมวลผล
 */
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

    if (importPath && /^(\.|\.\.|\@|\~)\//.test(importPath)) {
      if (!seenTargets.has(importPath)) {
        seenTargets.add(importPath);
        relations.push({
          source: sourcePath,
          target: importPath,
          type: 'import',
        });
      }
    }
  }

  return relations;
}

/**
 * ดึงข้อมูล Event Triggers (onClick) และ Server Actions (action)
 */
export function extractActionTriggers(sourcePath: string, codeContent: string): CodeRelation[] {
  if (
    !codeContent ||
    typeof codeContent !== 'string' ||
    (!codeContent.includes('onClick') && !codeContent.includes('action'))
  ) {
    return [];
  }

  const cleanCode = codeContent.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
  const relations: CodeRelation[] = [];
  const seenKeys = new Set<string>();

  const RESERVED = new Set([
    'async', 'await', 'return', 'function', 'true', 'false',
    'null', 'undefined', 'e', 'event', 'evt', 'formData',
    'console', 'log', 'preventDefault', 'stopPropagation', 'void'
  ]);

  const extractTargetFn = (expr: string): string | null => {
    const tokens = expr
      .replace(/['"`]/g, '')
      .split(/[^a-zA-Z0-9_$]+/)
      .filter(Boolean);

    for (const token of tokens) {
      if (!RESERVED.has(token) && !/^\d+$/.test(token)) {
        return token;
      }
    }
    return null;
  };

  if (cleanCode.includes('onClick')) {
    const onClickRegex = /onClick=\{([^}]+)\}/g;
    let match: RegExpExecArray | null;

    while ((match = onClickRegex.exec(cleanCode)) !== null) {
      const targetFn = extractTargetFn(match[1]);
      if (targetFn) {
        const key = `${sourcePath}->${targetFn}:onClick`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          relations.push({
            source: sourcePath,
            target: targetFn,
            type: 'event',
            label: 'onClick',
          });
        }
      }
    }
  }

  if (cleanCode.includes('action')) {
    const actionRegex = /(?:form\s+)?action=\{([^}]+)\}/g;
    let match: RegExpExecArray | null;

    while ((match = actionRegex.exec(cleanCode)) !== null) {
      const targetFn = extractTargetFn(match[1]);
      if (targetFn) {
        const key = `${sourcePath}->${targetFn}:form action`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          relations.push({
            source: sourcePath,
            target: targetFn,
            type: 'action',
            label: 'form action',
          });
        }
      }
    }
  }

  return relations;
}