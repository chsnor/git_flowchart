// src/tests/2_parser.test.ts
import { describe, it, expect } from 'vitest';
import { filterTreeFiles, extractImportsFromCode } from '../lib/parser';
import { GitHubTreeItem } from '../types';

describe('คนที่ 2: parser.ts', () => {
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

  describe('extractImportsFromCode', () => {
    it('แกะ import บรรทัดเดียวปกติได้', () => {
      const code = `import { Navbar } from '@/components/Navbar';`;
      const res = extractImportsFromCode('src/app/page.tsx', code);
      expect(res).toEqual([{ source: 'src/app/page.tsx', target: '@/components/Navbar' }]);
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
      expect(res).toEqual([{ source: 'src/app/page.tsx', target: '@/components/ui' }]);
    });

    it('แกะ type import ของ typescript ได้', () => {
      const code = `import type { UserSession } from '../types/session';`;
      const res = extractImportsFromCode('src/lib/auth.ts', code);
      expect(res).toEqual([{ source: 'src/lib/auth.ts', target: '../types/session' }]);
    });

    it('ไม่ไปแกะบรรทัดที่คอมเมนต์ทิ้งไว้', () => {
      const code = `
        // import { OldComp } from '@/components/OldComp';
        import { NewComp } from '@/components/NewComp';
      `;
      const res = extractImportsFromCode('src/app/page.tsx', code);
      expect(res).toEqual([{ source: 'src/app/page.tsx', target: '@/components/NewComp' }]);
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
});
