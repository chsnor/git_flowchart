import { describe, it, expect } from 'vitest';
import { filterTreeFiles, detectNextFileType, extractImportsFromCode } from '../src/lib/parser';
import { GitHubTreeItem } from '../src/types';

const createMockItem = (path: string): GitHubTreeItem => ({
  path,
  mode: '100644',
  type: 'blob',
  sha: 'mocksha123',
});

describe('Parser Engine (src/lib/parser.ts)', () => {
  describe('filterTreeFiles', () => {
    it('กรองไฟล์ขยะและโฟลเดอร์ที่ไม่เกี่ยวข้องออก (node_modules, .git, lock files)', () => {
      const mockTree: GitHubTreeItem[] = [
        createMockItem('node_modules/react/index.js'),
        createMockItem('.git/config'),
        createMockItem('package-lock.json'),
        createMockItem('readme.md'),
        createMockItem('src/app/page.tsx'),
        createMockItem('src/components/Header.tsx'),
        createMockItem('src/utils.test.ts'),
      ];

      const result = filterTreeFiles(mockTree);
      expect(result.map((r) => r.path)).toEqual([
        'src/app/page.tsx',
        'src/components/Header.tsx',
      ]);
    });

    it('จำกัดจำนวนไฟล์ไม่เกิน maxLimit', () => {
      const mockTree: GitHubTreeItem[] = Array.from({ length: 50 }, (_, i) =>
        createMockItem(`src/components/Comp${i}.tsx`)
      );

      const result = filterTreeFiles(mockTree, 10);
      expect(result.length).toBe(10);
    });
  });

  describe('detectNextFileType', () => {
    it('จำแนกประเภทไฟล์ Next.js ได้อย่างถูกต้องแม่นยำ', () => {
      expect(detectNextFileType('src/app/page.tsx')).toBe('page');
      expect(detectNextFileType('src/app/layout.tsx')).toBe('layout');
      expect(detectNextFileType('src/middleware.ts')).toBe('middleware');
      expect(detectNextFileType('src/app/api/auth/route.ts')).toBe('api');
      expect(detectNextFileType('src/actions/submitForm.ts')).toBe('action');
      expect(detectNextFileType('src/stores/userStore.ts')).toBe('store');
      expect(detectNextFileType('src/hooks/useUser.ts')).toBe('hook');
      expect(detectNextFileType('src/components/Navbar.tsx')).toBe('component');
      expect(detectNextFileType('src/utils/math.ts')).toBe('other');
    });
  });

  describe('extractImportsFromCode', () => {
    it('สกัดคำสั่ง import ภายในโปรเจกต์และไม่รวม third-party libraries', () => {
      const code = `
        import React from 'react';
        import { useState } from 'react';
        import Navbar from '@/components/Navbar';
        import { getUser } from '../actions/user';
      `;

      const relations = extractImportsFromCode('src/app/page.tsx', code);
      const targets = relations.map((r) => r.target);
      expect(targets).toContain('@/components/Navbar');
      expect(targets).toContain('../actions/user');
      expect(targets).not.toContain('react');
    });
  });
});

