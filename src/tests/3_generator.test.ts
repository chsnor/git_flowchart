// src/tests/3_generator.test.ts
import { describe, it, expect } from 'vitest';
import { sanitizeNodeId, getNodeColorConfig, buildFlowElements, generateMermaidSyntax } from '../lib/generator';
import { CodeRelation, NextFileType } from '../types';

describe('คนที่ 3: generator.ts (Interactive Flow Visualizer)', () => {
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

  describe('getNodeColorConfig (ชุดสีแยกตามบทบาทไฟล์ใน Next.js)', () => {
    it('middleware และ proxy ต้องได้สีม่วง (#a855f7)', () => {
      const config = getNodeColorConfig('middleware');
      expect(config.border).toBe('#a855f7');
    });

    it('หน้าเพจ page ต้องได้สีฟ้า (#38bdf8)', () => {
      const config = getNodeColorConfig('page');
      expect(config.border).toBe('#38bdf8');
    });

    it('server action ต้องได้สีส้ม (#fb923c)', () => {
      const config = getNodeColorConfig('action');
      expect(config.border).toBe('#fb923c');
    });

    it('data store หรือ context ต้องได้สีเขียว (#4ade80)', () => {
      const config = getNodeColorConfig('store');
      expect(config.border).toBe('#4ade80');
    });
  });

  describe('buildFlowElements (สร้างโหนดและเส้นเชื่อมสำหรับ React Flow)', () => {
    it('แปลงรายการไฟล์และ relations เป็น Nodes และ Edges พร้อมพิกัด position ได้', () => {
      const mockFiles: Array<{ path: string; fileType: NextFileType }> = [
        { path: 'src/app/page.tsx', fileType: 'page' },
        { path: 'src/actions/auth.ts', fileType: 'action' }
      ];
      const mockRelations: CodeRelation[] = [
        {
          source: 'src/app/page.tsx',
          target: 'src/actions/auth.ts',
          type: 'action',
          label: 'form action'
        }
      ];

      const elements = buildFlowElements(mockFiles, mockRelations);
      expect(elements.nodes).toHaveLength(2);
      expect(elements.edges).toHaveLength(1);

      expect(elements.nodes[0].id).toBe('src_app_page_tsx');
      expect(elements.nodes[0].position).toHaveProperty('x');
      expect(elements.nodes[0].position).toHaveProperty('y');

      expect(elements.edges[0].source).toBe('src_app_page_tsx');
      expect(elements.edges[0].target).toBe('src_actions_auth_ts');
      expect(elements.edges[0].label).toBe('form action');
      expect(elements.edges[0].animated).toBe(true);
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

    it('ถ้าไม่มี relation เลย ให้ส่งโหนดเริ่มต้นกลับไป จะได้ไม่ error', () => {
      const output = generateMermaidSyntax([]);
      expect(output).toBe('graph TD\n  Empty["No local relations found"]');
    });
  });
});
