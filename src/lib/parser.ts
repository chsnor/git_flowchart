// src/lib/parser.ts
import { GitHubTreeItem, CodeRelation, NextFileType } from '../types';

/**
 * ฟังก์ชันสำหรับคัดกรองเฉพาะไฟล์โค้ดสำคัญ และตัดไฟล์ที่ไม่เกี่ยวข้องทิ้ง
 * รองรับการจำกัดจำนวนไฟล์สูงสุด (maxLimit) เพื่อป้องกันไม่ให้เบราว์เซอร์ค้างหากเป็น Repo ขนาดใหญ่
 */
export function filterTreeFiles(items: GitHubTreeItem[], maxLimit = 150): GitHubTreeItem[] {
  const blacklistFolders = ['node_modules/', '.next/', 'dist/', 'build/', 'public/'];
  const blacklistFiles = [
    'package-lock.json',
    'yarn.lock',
    'pnpm-lock.yaml',
    'bun.lockb',
    'tsconfig.json',
    'readme.md',
    '.gitignore',
  ];

  const validExtensions = ['.ts', '.tsx', '.js', '.jsx'];

  const filtered = items.filter((item) => {
    if (item.type !== 'blob') return false;

    const path = item.path.toLowerCase();
    const fileName = path.split('/').pop() || '';

    if (blacklistFolders.some((folder) => path.includes(folder))) return false;
    if (fileName.startsWith('.env')) return false;
    if (blacklistFiles.includes(fileName)) return false;

    return validExtensions.some((ext) => fileName.endsWith(ext));
  });

  return filtered.slice(0, maxLimit);
}

/**
 * ฟังก์ชันจำแนกประเภทไฟล์ในสถาปัตยกรรม Next.js (App Router Architecture)
 * รองรับทั้งกรณีมีโฟลเดอร์ src/ (เช่น src/app/page.tsx) และไม่มี src/ (เช่น app/page.tsx)
 */
export function detectNextFileType(filePath: string): NextFileType {
  const normalizedPath = filePath.replace(/\\/g, '/');
  const pathParts = normalizedPath.split('/');
  const fileName = pathParts[pathParts.length - 1];

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
    pathParts.includes('actions')
  ) {
    return 'action';
  }

  if (
    pathParts.includes('stores') ||
    pathParts.includes('context') ||
    pathParts.includes('state')
  ) {
    return 'store';
  }

  if (
    /^route\.(tsx|ts|jsx|js)$/.test(fileName) ||
    pathParts.includes('api')
  ) {
    return 'api';
  }

  if (pathParts.includes('components')) {
    return 'component';
  }

  return 'other';
}

/**
 * ฟังก์ชันสำหรับสกัดความสัมพันธ์การ import ไฟล์ภายในโปรเจกต์
 */
export function extractImportsFromCode(sourcePath: string, codeContent: string): CodeRelation[] {
  // ลบคอมเมนต์ทั้งหมด (ทั้ง /* ... */ และ //)
  let cleanCode = codeContent.replace(/\/\*[\s\S]*?\*\//g, '');
  cleanCode = cleanCode
    .split('\n')
    .map((line) => {
      const idx = line.indexOf('//');
      return idx !== -1 ? line.slice(0, idx) : line;
    })
    .join('\n');

  const relations: CodeRelation[] = [];
  const seenTargets = new Set<string>();

  // Regex สกัด import (รองรับแบบ single-line, multi-line และ import type)
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
  // ลบคอมเมนต์ออกทั้งหมด
  let cleanCode = codeContent.replace(/\/\*[\s\S]*?\*\//g, '');
  cleanCode = cleanCode
    .split('\n')
    .map((line) => {
      const idx = line.indexOf('//');
      return idx !== -1 ? line.slice(0, idx) : line;
    })
    .join('\n');

  const relations: CodeRelation[] = [];
  const seenKeys = new Set<string>();

  const extractTargetFn = (expr: string): string | null => {
    const reserved = new Set([
      'async', 'await', 'return', 'function', 'true', 'false',
      'null', 'undefined', 'e', 'event', 'evt', 'formData',
      'console', 'log', 'preventDefault', 'stopPropagation', 'void'
    ]);

    const tokens = expr
      .replace(/['"`]/g, '')
      .split(/[^a-zA-Z0-9_$]+/)
      .filter(Boolean);

    for (const token of tokens) {
      if (!reserved.has(token) && !/^\d+$/.test(token)) {
        return token;
      }
    }
    return null;
  };

  // 1. ตรวจจับ onClick={...} -> type: 'event', label: 'onClick'
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

  // 2. ตรวจจับ form action={...} -> type: 'action', label: 'form action'
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