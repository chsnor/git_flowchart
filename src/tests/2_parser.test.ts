// src/tests/2_parser.test.ts
import { describe, it, expect } from 'vitest';
import { filterTreeFiles, detectNextFileType, extractImportsFromCode, extractActionTriggers } from '../lib/parser';
import { GitHubTreeItem } from '../types';

describe('คนที่ 2: parser.ts (AST & Event Parser Engine)', () => {
  describe('filterTreeFiles', () => {
    it('กรองพวก node_modules, lockfile, รูปภาพ, config ทิ้ง เอาเฉพาะไฟล์โค้ด', () => {
      const items: GitHubTreeItem[] = [
        { path: 'node_modules/@types/react/index.d.ts', mode: '100644', type: 'blob', sha: '1' },
        { path: '.next/server/pages/index.js', mode: '100644', type: 'blob', sha: '2' },
        { path: 'dist/bundle.js', mode: '100644', type: 'blob', sha: '3' },
        { path: 'build/index.html', mode: '100644', type: 'blob', sha: '4' },
        { path: 'public/images/logo.png', mode: '100644', type: 'blob', sha: '5' },
        { path: 'package-lock.json', mode: '100644', type: 'blob', sha: '6' },
        { path: 'pnpm-lock.yaml', mode: '100644', type: 'blob', sha: '7' },
        { path: '.env.local', mode: '100644', type: 'blob', sha: '8' },
        { path: '.gitignore', mode: '100644', type: 'blob', sha: '9' },
        { path: 'tsconfig.json', mode: '100644', type: 'blob', sha: '10' },
        { path: 'src/app/page.tsx', mode: '100644', type: 'blob', sha: '11' },
        { path: 'src/components/Button.tsx', mode: '100644', type: 'blob', sha: '12' },
        { path: 'src/lib/auth.ts', mode: '100644', type: 'blob', sha: '13' },
      ];

      const filtered = filterTreeFiles(items);
      const paths = filtered.map(i => i.path);

      expect(paths).toEqual([
        'src/app/page.tsx',
        'src/components/Button.tsx',
        'src/lib/auth.ts'
      ]);
    });

    it('ไม่เอาโฟลเดอร์มาคิด เอาเฉพาะไฟล์ที่เป็น blob', () => {
      const items: GitHubTreeItem[] = [
        { path: 'src', mode: '040000', type: 'tree', sha: '100' },
        { path: 'src/app', mode: '040000', type: 'tree', sha: '101' },
        { path: 'src/app/page.tsx', mode: '100644', type: 'blob', sha: '102' }
      ];

      const filtered = filterTreeFiles(items);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].path).toBe('src/app/page.tsx');
    });
  });

  describe('detectNextFileType (จำแนกเลเยอร์สถาปัตยกรรม Next.js)', () => {
    it('ตรวจจับหน้าจอ page.tsx เป็น page', () => {
      expect(detectNextFileType('src/app/dashboard/page.tsx')).toBe('page');
    });

    it('ตรวจจับ layout.tsx เป็น layout', () => {
      expect(detectNextFileType('src/app/(auth)/layout.tsx')).toBe('layout');
    });

    it('ตรวจจับ middleware.ts หรือ proxy.ts เป็น middleware', () => {
      expect(detectNextFileType('src/middleware.ts')).toBe('middleware');
      expect(detectNextFileType('src/proxy.ts')).toBe('middleware');
    });

    it('ตรวจจับ Server Action เช่น actions.ts หรือ โฟลเดอร์ actions/ เป็น action', () => {
      expect(detectNextFileType('src/app/products/actions.ts')).toBe('action');
      expect(detectNextFileType('src/actions/user.ts')).toBe('action');
    });

    it('ตรวจจับ data store หรือ context เป็น store', () => {
      expect(detectNextFileType('src/stores/cartStore.ts')).toBe('store');
      expect(detectNextFileType('src/context/AuthContext.tsx')).toBe('store');
    });

    it('ตรวจจับ API Route เป็น api', () => {
      expect(detectNextFileType('src/app/api/auth/route.ts')).toBe('api');
    });

    it('ตรวจจับ components เป็น component', () => {
      expect(detectNextFileType('src/components/Header.tsx')).toBe('component');
    });
  });

  describe('extractImportsFromCode', () => {
    it('แกะ import บรรทัดเดียวปกติได้', () => {
      const code = `import { Navbar } from '@/components/Navbar';`;
      const res = extractImportsFromCode('src/app/page.tsx', code);
      expect(res).toEqual([{ source: 'src/app/page.tsx', target: '@/components/Navbar', type: 'import' }]);
    });

    it('แกะ import หลายบรรทัดที่มีการเคาะขึ้นบรรทัดใหม่ได้', () => {
      const code = `
        import {
          Button,
          Modal,
          Card
        } from '@/components/ui';
      `;
      const res = extractImportsFromCode('src/app/page.tsx', code);
      expect(res).toEqual([{ source: 'src/app/page.tsx', target: '@/components/ui', type: 'import' }]);
    });

    it('แกะ type import ของ typescript ได้', () => {
      const code = `import type { UserSession } from '../types/session';`;
      const res = extractImportsFromCode('src/lib/auth.ts', code);
      expect(res).toEqual([{ source: 'src/lib/auth.ts', target: '../types/session', type: 'import' }]);
    });

    it('ไม่ไปแกะบรรทัดที่คอมเมนต์ทิ้งไว้', () => {
      const code = `
        // import { OldComp } from '@/components/OldComp';
        import { NewComp } from '@/components/NewComp';
      `;
      const res = extractImportsFromCode('src/app/page.tsx', code);
      expect(res).toEqual([{ source: 'src/app/page.tsx', target: '@/components/NewComp', type: 'import' }]);
    });

    it('ตัดตัวซ้ำถ้าในไฟล์เดียวกัน import ซ้ำที่เดิม', () => {
      const code = `
        import { A } from './utils';
        import { B } from './utils';
      `;
      const res = extractImportsFromCode('src/app/page.tsx', code);
      expect(res).toHaveLength(1);
      expect(res[0].target).toBe('./utils');
    });
  });

  describe('extractActionTriggers (ตรวจจับ Event และ Server Action)', () => {
    it('ตรวจจับ onClick event และดึงชื่อฟังก์ชันเป้าหมายได้', () => {
      const code = `
        <button onClick={handleDeleteProduct}>Delete</button>
      `;
      const relations = extractActionTriggers('src/components/ProductCard.tsx', code);
      expect(relations).toContainEqual({
        source: 'src/components/ProductCard.tsx',
        target: 'handleDeleteProduct',
        type: 'event',
        label: 'onClick'
      });
    });

    it('ตรวจจับ form action สำหรับ Next.js Server Action ได้', () => {
      const code = `
        <form action={updateProductAction}>
          <input name="name" />
          <button type="submit">Save</button>
        </form>
      `;
      const relations = extractActionTriggers('src/app/products/page.tsx', code);
      expect(relations).toContainEqual({
        source: 'src/app/products/page.tsx',
        target: 'updateProductAction',
        type: 'action',
        label: 'form action'
      });
    });
  });
});
