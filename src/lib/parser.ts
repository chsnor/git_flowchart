// src/lib/parser.ts
import { GitHubTreeItem, CodeRelation, NextFileType } from '../types';

const BLACKLIST_FOLDERS = ['node_modules/', '.next/', 'dist/', 'build/', 'public/'];
const BLACKLIST_FILES = new Set([
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  'bun.lockb',
  'tsconfig.json',
  'readme.md',
  '.gitignore',
]);
const VALID_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

/**
 * ฟังก์ชันสำหรับคัดกรองเฉพาะไฟล์โค้ดสำคัญ
 * หยุดการวนลูปทันทีเมื่อได้ไฟล์ครบตาม maxLimit (Early Exit) เพื่อความรวดเร็วสูงสุด
 */
export function filterTreeFiles(items: GitHubTreeItem[], maxLimit = 150): GitHubTreeItem[] {
  const filtered: GitHubTreeItem[] = [];

  for (let i = 0; i < items.length; i++) {
    if (filtered.length >= maxLimit) break;

    const item = items[i];
    if (item.type !== 'blob') continue;

    const path = item.path.toLowerCase();
    const lastSlash = path.lastIndexOf('/');
    const fileName = lastSlash !== -1 ? path.slice(lastSlash + 1) : path;

    if (fileName.startsWith('.env')) continue;
    if (BLACKLIST_FILES.has(fileName)) continue;
    if (BLACKLIST_FOLDERS.some((folder) => path.includes(folder))) continue;

    if (VALID_EXTENSIONS.some((ext) => fileName.endsWith(ext))) {
      filtered.push(item);
    }
  }

  return filtered;
}

/**
 * ฟังก์ชันจำแนกประเภทไฟล์ในสถาปัตยกรรม Next.js (App Router Architecture)
 */
export function detectNextFileType(filePath: string): NextFileType {
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

  if (/^page\.(tsx|ts|jsx|js)$/.test(fileName)) {
    return 'page';
  }

  if (/^layout\.(tsx|ts|jsx|js)$/.test(fileName)) {
    return 'layout';
  }

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
 * ฟังก์ชันสำหรับสกัดความสัมพันธ์การ import ไฟล์ภายในโปรเจกต์
 */
export function extractImportsFromCode(sourcePath: string, codeContent: string): CodeRelation[] {
  // ลบคอมเมนต์ทั้งหมด (ทั้ง /* ... */ และ // ...) ในรอบเดียวด้วย Regex เพื่อประสิทธิภาพสูงสุด
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
 * ฟังก์ชันสกัดการเรียกใช้ Event และ Server Action (เช่น onClick, form action)
 */
export function extractActionTriggers(sourcePath: string, codeContent: string): CodeRelation[] {
  // ลบคอมเมนต์ทั้งหมดในรอบเดียว
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

  // 1. ตรวจจับ onClick={...}
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

  // 2. ตรวจจับ form action={...} / action={...}
  const actionRegex = /(?:form\s+)?action=\{([^}]+)\}/g;

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

  return relations;
}