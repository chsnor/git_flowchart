// src/tests/3_generator.test.ts
import { describe, it, expect } from 'vitest';
import { sanitizeNodeId, generateMermaidSyntax, getNodeStyle } from '../lib/generator';
import { CodeRelation } from '../types';

describe('คนที่ 3: generator.ts', () => {
  describe('sanitizeNodeId', () => {
    it('เปลี่ยนพวก slash จุด ขีดกลาง @ ให้เป็น underscore ทั้งหมด', () => {
      expect(sanitizeNodeId('@/components/ui/nav-bar.tsx')).toBe('components_ui_nav_bar_tsx');
    });

    it('ตัดพวกวงเล็บ route group ของ next เช่น (auth) ทิ้งไป', () => {
      expect(sanitizeNodeId('src/app/(auth)/login/page.tsx')).toBe('src_app_auth_login_page_tsx');
    });

    it('ตัด underscore หัวท้ายที่เกินมาออก', () => {
      expect(sanitizeNodeId('///src/app/page.tsx///')).toBe('src_app_page_tsx');
    });
  });

  describe('getNodeStyle (ระบบแยกสีกล่องตามประเภทโฟลเดอร์)', () => {
    it('กล่องหน้าเว็บใน app/ ต้องได้สีกรอบฟ้า (#38bdf8)', () => {
      const style = getNodeStyle('src_app_page_tsx', 'src/app/page.tsx');
      expect(style).toContain('style src_app_page_tsx');
      expect(style).toContain('#38bdf8');
    });

    it('กล่องคอมโพเนนต์ใน components/ ต้องได้สีกรอบเขียว (#4ade80)', () => {
      const style = getNodeStyle('components_Navbar_tsx', '@/components/Navbar.tsx');
      expect(style).toContain('style components_Navbar_tsx');
      expect(style).toContain('#4ade80');
    });

    it('กล่องฟังก์ชันใน lib/ หรือ api/ ต้องได้สีกรอบส้ม (#fb923c)', () => {
      const style = getNodeStyle('src_lib_auth_ts', 'src/lib/auth.ts');
      expect(style).toContain('style src_lib_auth_ts');
      expect(style).toContain('#fb923c');
    });
  });

  describe('generateMermaidSyntax', () => {
    it('ต่อสตริง graph TD พร้อมใส่ label ชื่อไฟล์ได้ถูกต้อง', () => {
      const relations: CodeRelation[] = [
        { source: 'src/app/page.tsx', target: '@/components/Navbar.tsx' }
      ];
      const output = generateMermaidSyntax(relations);

      expect(output).toContain('graph TD');
      expect(output).toContain('src_app_page_tsx["src/app/page.tsx"] --> components_Navbar_tsx["@/components/Navbar.tsx"]');
    });

    it('ไม่สร้างเส้นโยงซ้ำซ้อนถ้ามี relation ซ้ำกัน', () => {
      const relations: CodeRelation[] = [
        { source: 'src/app/page.tsx', target: '@/components/Navbar.tsx' },
        { source: 'src/app/page.tsx', target: '@/components/Navbar.tsx' }
      ];
      const output = generateMermaidSyntax(relations);
      const occurrences = (output.match(/-->/g) || []).length;
      expect(occurrences).toBe(1);
    });

    it('รองรับกรณีไฟล์เดียวเรียกหลายไฟล์ต่อกันได้', () => {
      const relations: CodeRelation[] = [
        { source: 'src/app/page.tsx', target: '@/components/A.tsx' },
        { source: 'src/app/page.tsx', target: '@/components/B.tsx' },
        { source: 'src/app/page.tsx', target: '@/components/C.tsx' }
      ];
      const output = generateMermaidSyntax(relations);
      expect((output.match(/src_app_page_tsx/g) || []).length).toBe(3);
    });

    it('รองรับกรณี import วนหากันไปมา ไม่ติดลูปค้าง', () => {
      const relations: CodeRelation[] = [
        { source: 'src/lib/a.ts', target: './b' },
        { source: 'src/lib/b.ts', target: './a' }
      ];
      const output = generateMermaidSyntax(relations);
      expect(output).toContain('src_lib_a_ts');
      expect(output).toContain('src_lib_b_ts');
    });

    it('ถ้าไม่มี relation เลย ให้ส่งโหนดเริ่มต้นกลับไป จะได้ไม่ error', () => {
      const output = generateMermaidSyntax([]);
      expect(output).toBe('graph TD\n  Empty["No local relations found"]');
    });
  });
});
