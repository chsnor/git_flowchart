// src/tests/5_integration_pipeline.test.ts
import { describe, it, expect } from 'vitest';
import { parseGitHubUrl } from '../lib/github';
import { filterTreeFiles, extractImportsFromCode } from '../lib/parser';
import { generateMermaidSyntax } from '../lib/generator';
import { GitHubTreeItem, CodeRelation } from '../types';

describe('คนที่ 5: pipeline รวมทั้งระบบ', () => {
  it('ทดสอบโฟลว์ตั้งแต่แกะ URL -> กรองไฟล์ -> แกะ import -> เจน mermaid ต้องทำงานต่อกันได้ครบ', () => {
    // 1. รับ URL
    const inputUrl = 'https://github.com/chsnor/testauth.git';
    const parsed = parseGitHubUrl(inputUrl);
    expect(parsed).toEqual({ owner: 'chsnor', repo: 'testauth' });

    // 2. กรองไฟล์
    const mockTree: GitHubTreeItem[] = [
      { path: 'node_modules/next/package.json', mode: '100644', type: 'blob', sha: '1' },
      { path: '.next/types/routes.d.ts', mode: '100644', type: 'blob', sha: '2' },
      { path: 'src/app/(auth)/login/page.tsx', mode: '100644', type: 'blob', sha: '3' },
      { path: 'src/app/(dashboard)/layout.tsx', mode: '100644', type: 'blob', sha: '4' },
      { path: 'src/components/LoginForm.tsx', mode: '100644', type: 'blob', sha: '5' },
      { path: 'src/lib/auth.ts', mode: '100644', type: 'blob', sha: '6' },
      { path: 'public/hero.jpg', mode: '100644', type: 'blob', sha: '7' },
      { path: 'README.md', mode: '100644', type: 'blob', sha: '8' }
    ];

    const filtered = filterTreeFiles(mockTree);
    expect(filtered).toHaveLength(4);

    // 3. แกะ import จากไฟล์
    const mockLoginCode = `
      // import { OldForm } from '@/components/Old';
      import {
        LoginForm
      } from '@/components/LoginForm';
      import { getSession } from '../../../lib/auth';
      import axios from 'axios';
    `;

    const relations = extractImportsFromCode('src/app/(auth)/login/page.tsx', mockLoginCode);
    expect(relations).toHaveLength(2);
    expect(relations).toContainEqual({
      source: 'src/app/(auth)/login/page.tsx',
      target: '@/components/LoginForm'
    });
    expect(relations).toContainEqual({
      source: 'src/app/(auth)/login/page.tsx',
      target: '../../../lib/auth'
    });

    // 4. แปลงเป็นข้อความ mermaid
    const mermaidDiagram = generateMermaidSyntax(relations);

    // 5. เช็กผลลัพธ์
    expect(mermaidDiagram).toContain('graph TD');
    expect(mermaidDiagram).not.toContain('(auth)');
    expect(mermaidDiagram).toContain('src_app_auth_login_page_tsx');
    expect(mermaidDiagram).toContain('components_LoginForm');
  });

  it('ทดสอบความเร็ว: ลองเทสกับไฟล์ 500 ไฟล์ ต้องรันเสร็จไว ไม่ค้าง', () => {
    const startTime = performance.now();

    const largeTree: GitHubTreeItem[] = Array.from({ length: 500 }, (_, i) => ({
      path: i % 2 === 0 ? `node_modules/lib-${i}/index.js` : `src/components/Comp${i}.tsx`,
      mode: '100644',
      type: 'blob',
      sha: `sha-${i}`
    }));

    const filtered = filterTreeFiles(largeTree);
    expect(filtered).toHaveLength(250);

    const mockRelations: CodeRelation[] = filtered.map(item => ({
      source: 'src/app/page.tsx',
      target: item.path
    }));

    const diagram = generateMermaidSyntax(mockRelations);
    expect(diagram).toContain('graph TD');

    const duration = performance.now() - startTime;
    expect(duration).toBeLessThan(100);
  });
});
