// src/tests/6_integration_pipeline.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { runAnalysisPipeline, clearPipelineCache, pipelineCache } from '../lib/pipeline';
import { GitHubTreeItem } from '../types';

describe('คนที่ 6: pipeline.ts (Integration Pipeline, QA & Deployment)', () => {
  beforeEach(() => {
    clearPipelineCache();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==========================================
  // ส่วนที่ 1: Unit & Functional Flow Tests
  // ==========================================
  it('ทดสอบโฟลว์ครบวงจร: URL -> กรองไฟล์ -> สกัด Action/Event -> สร้าง React Flow Nodes/Edges และ Mermaid', async () => {
    const inputUrl = 'https://github.com/chsnor/testauth.git';

    const mockTree: GitHubTreeItem[] = [
      { path: 'node_modules/next/package.json', mode: '100644', type: 'blob', sha: '1' },
      { path: '.next/types/routes.d.ts', mode: '100644', type: 'blob', sha: '2' },
      { path: 'src/middleware.ts', mode: '100644', type: 'blob', sha: '3' },
      { path: 'src/app/products/page.tsx', mode: '100644', type: 'blob', sha: '4' },
      { path: 'src/app/products/actions.ts', mode: '100644', type: 'blob', sha: '5' },
      { path: 'src/stores/cartStore.ts', mode: '100644', type: 'blob', sha: '6' },
      { path: 'public/banner.png', mode: '100644', type: 'blob', sha: '7' }
    ];

    const mockContents: Record<string, string> = {
      'src/app/products/page.tsx': `
        import { updateProductAction } from './actions';
        export default function ProductsPage() {
          return (
            <form action={updateProductAction}>
              <button type="submit">Save</button>
            </form>
          );
        }
      `
    };

    const result = await runAnalysisPipeline(inputUrl, undefined, mockTree, mockContents);

    expect(result.owner).toBe('chsnor');
    expect(result.repoName).toBe('testauth');
    expect(result.totalFiles).toBe(7);
    expect(result.filteredFilesCount).toBe(4);

    // ตรวจสอบว่าโหนด React Flow ถูกสร้างขึ้นครบตามประเภทไฟล์
    const pageNode = result.nodes.find(n => n.path === 'src/app/products/page.tsx');
    expect(pageNode).toBeDefined();
    expect(pageNode?.fileType).toBe('page');

    const actionNode = result.nodes.find(n => n.path === 'src/app/products/actions.ts');
    expect(actionNode).toBeDefined();
    expect(actionNode?.fileType).toBe('action');

    const middlewareNode = result.nodes.find(n => n.path === 'src/middleware.ts');
    expect(middlewareNode).toBeDefined();
    expect(middlewareNode?.fileType).toBe('middleware');

    // ตรวจสอบเส้น Edge ที่เชื่อมโยง Event/Action
    const actionEdge = result.edges.find(e => e.label === 'form action' || e.animated === true);
    expect(actionEdge).toBeDefined();

    // ตรวจสอบ Mermaid Syntax ว่ามีข้อมูล
    expect(result.mermaidSyntax).toContain('graph TD');
  });

  it('ทดสอบระบบ In-Memory Cache: วิเคราะห์ซ้ำ URL เดิมต้องดึงจากแคชทันทีโดยไม่ต้องคำนวณใหม่', async () => {
    const inputUrl = 'https://github.com/chsnor/testauth';
    const mockTree: GitHubTreeItem[] = [
      { path: 'src/app/page.tsx', mode: '100644', type: 'blob', sha: '1' }
    ];

    // ครั้งแรก: ต้องประมวลผลใหม่ และบันทึกลงแคช (isCached เป็น false)
    const firstResult = await runAnalysisPipeline(inputUrl, undefined, mockTree);
    expect(firstResult.isCached).toBe(false);
    expect(pipelineCache.has(inputUrl)).toBe(true);

    // ครั้งที่สอง: ต้องดึงผลลัพธ์จากแคชทันที (isCached เป็น true)
    const secondResult = await runAnalysisPipeline(inputUrl, undefined, mockTree);
    expect(secondResult.isCached).toBe(true);
    expect(secondResult.repoName).toBe('testauth');
  });

  it('ทดสอบความเร็วและ Performance Benchmark: ทดสอบกับ 500 ไฟล์ ต้องประมวลผลเสร็จในเสี้ยววินาที', async () => {
    const startTime = performance.now();

    const largeTree: GitHubTreeItem[] = Array.from({ length: 500 }, (_, i) => ({
      path: i % 2 === 0 ? `node_modules/pkg-${i}/index.js` : `src/components/Comp${i}.tsx`,
      mode: '100644',
      type: 'blob',
      sha: `sha-${i}`
    }));

    const result = await runAnalysisPipeline('https://github.com/chsnor/bigrepo', undefined, largeTree);
    expect(result.filteredFilesCount).toBe(250);
    expect(result.nodes.length).toBe(250);

    const duration = performance.now() - startTime;
    expect(duration).toBeLessThan(150);
  });

  // ==========================================
  // ส่วนที่ 2: Boundary Value & Negative Tests (Red Team QA)
  // ==========================================
  it('BVA: รองรับกรณีคลังไฟล์ว่างเปล่า (Empty Tree 0 ไฟล์) ได้อย่างปลอดภัยโดยไม่ Crash', async () => {
    const result = await runAnalysisPipeline('https://github.com/chsnor/empty-repo', undefined, []);
    expect(result.totalFiles).toBe(0);
    expect(result.filteredFilesCount).toBe(0);
    expect(result.nodes).toEqual([]);
    expect(result.edges).toEqual([]);
    expect(result.mermaidSyntax).toBeDefined();
  });

  it('Negative: จัดการกรณี URL ไม่ถูกต้องโดย Throw ข้อผิดพลาดที่อ่านเข้าใจง่าย', async () => {
    await expect(runAnalysisPipeline('https://gitlab.com/invalid/repo')).rejects.toThrow(
      'URL ต้องมาจาก github.com เท่านั้น'
    );
  });

  it('Adversarial: จำลองกรณีติด Rate Limit 403 Forbidden ต้อง Throw ข้อผิดพลาดแจ้งเตือน Token', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: async () => ({ message: 'API rate limit exceeded' })
    } as Response);

    await expect(runAnalysisPipeline('https://github.com/chsnor/rate-limited-repo')).rejects.toThrow(
      '❌ GitHub API Rate Limit หรือ Access Denied. กรุณาเพิ่ม GitHub Token ในไฟล์ .env'
    );

    expect(fetchSpy).toHaveBeenCalled();
  });

  it('Adversarial: จำลองกรณีระบบ Network ล่ม (Fetch Reject) ต้องโยนข้อผิดพลาดการเชื่อมต่อ', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Network connection aborted'));

    await expect(runAnalysisPipeline('https://github.com/chsnor/offline-repo')).rejects.toThrow(
      'ไม่สามารถเชื่อมต่อ GitHub ได้ กรุณาตรวจสอบอินเทอร์เน็ตหรือแนบ Token'
    );

    expect(fetchSpy).toHaveBeenCalled();
  });

  it('API Route POST /api/analyze: ถ้าไม่ส่ง URL มาต้องตอบกลับ status 400', async () => {
    const { POST } = await import('../app/api/analyze/route');
    const fakeReq = {
      json: async () => ({})
    };
    const res = await POST(fakeReq as unknown as import('next/server').NextRequest);
    expect(res.status).toBe(400);
  });

  // ==========================================
  // ส่วนที่ 3: Integration Tests
  // ==========================================
  describe('เฟสที่ 1: Integration Test เชื่อมต่อ Person 1 (GitHub) + Person 6 (Pipeline & API)', () => {
    it('1. ส่ง URL รูปแบบซับซ้อน (มี .git และ Slash ท้าย) เข้า Pipeline ต้องเชื่อมต่อกับ parseGitHubUrl ของคนที่ 1 ได้ถูกต้อง', async () => {
      const complexUrl = 'https://github.com/chsnor/real-next-project.git/';
      const mockTree: GitHubTreeItem[] = [
        { path: 'src/app/page.tsx', mode: '100644', type: 'blob', sha: '101' },
        { path: 'src/middleware.ts', mode: '100644', type: 'blob', sha: '102' }
      ];

      const result = await runAnalysisPipeline(complexUrl, undefined, mockTree);

      expect(result.owner).toBe('chsnor');
      expect(result.repoName).toBe('real-next-project');
      expect(result.totalFiles).toBe(2);
      expect(result.filteredFilesCount).toBe(2);
    });

    it('2. ตรวจสอบการส่งต่อ Token และการเรียก buildGitHubApiUrl + buildGitHubHeaders ของคนที่ 1 ผ่าน vi.spyOn(fetch)', async () => {
      const testToken = 'ghp_mockIntegrationSecretToken999';

      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          tree: [
            { path: 'src/app/page.tsx', mode: '100644', type: 'blob', sha: '1' }
          ]
        })
      } as Response);

      const result = await runAnalysisPipeline('https://github.com/chsnor/secure-app', testToken);

      expect(fetchSpy).toHaveBeenCalledWith(
        'https://api.github.com/repos/chsnor/secure-app/git/trees/main?recursive=1',
        {
          headers: expect.objectContaining({
            'User-Agent': 'GitFlow-Visualizer',
            'Authorization': `Bearer ${testToken}`
          })
        }
      );

      expect(result.owner).toBe('chsnor');
      expect(result.repoName).toBe('secure-app');
    });

    it('3. Integration เต็มรูปแบบ: API Route POST -> runAnalysisPipeline -> parseGitHubUrl (คน 1) -> ส่งผลลัพธ์ HTTP 200', async () => {
      const { POST } = await import('../app/api/analyze/route');
      const mockReq = {
        json: async () => ({
          url: 'https://github.com/chsnor/api-integrated-repo'
        })
      };

      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          tree: [{ path: 'src/app/page.tsx', mode: '100644', type: 'blob', sha: '1' }]
        })
      } as Response);

      const response = await POST(mockReq as unknown as import('next/server').NextRequest);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.owner).toBe('chsnor');
      expect(data.repoName).toBe('api-integrated-repo');
      expect(data.totalFiles).toBe(1);
    });
  });

  // ==========================================
  // ส่วนที่ 4: Future Integration Tests (เตรียมพร้อมสำหรับสมาชิกคนที่ 2 ถึง 5)
  // ==========================================
  describe.skip('เฟสที่ 2: Integration Test (คนที่ 2: Parser Engine)', () => {
    it('1. filterTreeFiles: ต้องคัดกรอง node_modules, .next, .d.ts ออกอย่างถูกต้อง และเคารพ maxLimit', async () => {
      const { filterTreeFiles } = await import('../lib/parser');
      const sampleItems: GitHubTreeItem[] = [
        { path: 'node_modules/react/index.js', mode: '100644', type: 'blob', sha: '1' },
        { path: '.next/types/routes.d.ts', mode: '100644', type: 'blob', sha: '2' },
        { path: 'dist/bundle.js', mode: '100644', type: 'blob', sha: '3' },
        { path: 'public/favicon.ico', mode: '100644', type: 'blob', sha: '4' },
        { path: 'src/app/page.tsx', mode: '100644', type: 'blob', sha: '5' },
        { path: 'src/app/actions.ts', mode: '100644', type: 'blob', sha: '6' },
        { path: 'src/middleware.ts', mode: '100644', type: 'blob', sha: '7' }
      ];

      const filtered = filterTreeFiles(sampleItems, 150);
      expect(filtered.length).toBe(3);
      expect(filtered.map(f => f.path)).toEqual([
        'src/app/page.tsx',
        'src/app/actions.ts',
        'src/middleware.ts'
      ]);
    });

    it('2. detectNextFileType: ต้องจำแนก page, action, middleware, store, component ได้ถูกต้องทั้งมีและไม่มี src/', async () => {
      const { detectNextFileType } = await import('../lib/parser');
      
      // กรณีมี src/
      expect(detectNextFileType('src/app/page.tsx')).toBe('page');
      expect(detectNextFileType('src/app/products/actions.ts')).toBe('action');
      expect(detectNextFileType('src/middleware.ts')).toBe('middleware');
      expect(detectNextFileType('src/stores/authStore.ts')).toBe('store');
      expect(detectNextFileType('src/components/Header.tsx')).toBe('component');

      // กรณีไม่มี src/ (Root App Router)
      expect(detectNextFileType('app/dashboard/page.tsx')).toBe('page');
      expect(detectNextFileType('app/login/actions.ts')).toBe('action');
      expect(detectNextFileType('middleware.ts')).toBe('middleware');
    });

    it('3. extractImportsFromCode: ต้องสกัดเฉพาะ Local / Alias Imports และตัดโมดูลภายนอกทิ้ง', async () => {
      const { extractImportsFromCode } = await import('../lib/parser');
      const codeSnippet = `
        import React, { useState } from 'react';
        import { updateItem } from './actions';
        import { useCartStore } from '@/stores/cartStore';
        // import { oldFeature } from './legacy';
      `;

      const relations = extractImportsFromCode('src/app/page.tsx', codeSnippet);
      const targets = relations.map(r => r.target);

      expect(targets).toContain('./actions');
      expect(targets).toContain('@/stores/cartStore');
      expect(targets).not.toContain('react');
      expect(targets).not.toContain('./legacy');
    });

    it('4. extractActionTriggers: ต้องตรวจจับ form action และ onClick ส่งต่อเป็น CodeRelation', async () => {
      const { extractActionTriggers } = await import('../lib/parser');
      const codeSnippet = `
        export default function Page() {
          return (
            <form action={handleSubmitAction}>
              <button onClick={handleReset}>Reset</button>
            </form>
          );
        }
      `;

      const relations = extractActionTriggers('src/app/page.tsx', codeSnippet);
      expect(relations.length).toBeGreaterThanOrEqual(1);
      
      const formAction = relations.find(r => r.label === 'form action');
      expect(formAction).toBeDefined();
    });
  });

  describe.skip('เฟสที่ 3: Integration Test (คนที่ 3: Flow & Mermaid Generator)', () => {
    it('1. sanitizeNodeId: ลบวงเล็บ Next.js Route Groups และแทนที่อักขระพิเศษด้วย Underscore', async () => {
      const { sanitizeNodeId } = await import('../lib/generator');
      expect(sanitizeNodeId('src/app/(auth)/login/page.tsx')).toBe('src_app_auth_login_page_tsx');
      expect(sanitizeNodeId('src/components/Button.tsx')).toBe('src_components_Button_tsx');
    });

    it('2. getNodeColorConfig: คืนค่าสีตรงตามประเภทไฟล์ Next.js', async () => {
      const { getNodeColorConfig } = await import('../lib/generator');
      expect(getNodeColorConfig('page').border).toBe('#38bdf8'); // ฟ้า
      expect(getNodeColorConfig('action').border).toBe('#fb923c'); // ส้ม
      expect(getNodeColorConfig('middleware').border).toBe('#a855f7'); // ม่วง
      expect(getNodeColorConfig('store').border).toBe('#4ade80'); // เขียว
    });

    it('3. buildFlowElements: คำนวณพิกัด {x, y} ของ Nodes อย่างเป็นระเบียบ และสร้าง Edges พร้อม Animation สำหรับ Action', async () => {
      const { buildFlowElements } = await import('../lib/generator');
      const files = [
        { path: 'src/app/page.tsx', fileType: 'page' as const },
        { path: 'src/app/actions.ts', fileType: 'action' as const }
      ];
      const relations = [
        { source: 'src/app/page.tsx', target: 'src/app/actions.ts', type: 'action' as const, label: 'form action' }
      ];

      const elements = buildFlowElements(files, relations);
      expect(elements.nodes.length).toBe(2);
      expect(elements.nodes[0].position).toHaveProperty('x');
      expect(elements.nodes[0].position).toHaveProperty('y');
      
      expect(elements.edges.length).toBe(1);
      expect(elements.edges[0].animated).toBe(true);
      expect(elements.edges[0].label).toBe('form action');
    });

    it('4. generateMermaidSyntax: ส่งออกไวยากรณ์ graph TD ที่ถูกต้อง พร้อม Style สีของโหนด', async () => {
      const { generateMermaidSyntax } = await import('../lib/generator');
      const relations = [
        { source: 'src/app/page.tsx', target: 'src/app/actions.ts', type: 'action' as const, label: 'submit' }
      ];

      const syntax = generateMermaidSyntax(relations);
      expect(syntax).toContain('graph TD');
      expect(syntax).toContain('-->|submit|');
    });
  });

  describe.skip('เฟสที่ 4 และ 5: Contract Test (คนที่ 4: Dashboard UI & คนที่ 5: Side Inspector)', () => {
    it('ตรวจสอบโครงสร้าง AnalysisResult ว่าส่งต่อฟิลด์ที่ SideDrawer และ FlowCanvas ต้องใช้ครบ 100%', async () => {
      const mockTree: GitHubTreeItem[] = [
        { path: 'src/app/page.tsx', mode: '100644', type: 'blob', sha: '1' }
      ];
      const result = await runAnalysisPipeline('https://github.com/chsnor/contract-check', undefined, mockTree);

      // ตรวจสอบฟิลด์ที่ Dashboard ของคนที่ 4 ต้องแสดงบนหัวจอ
      expect(result).toHaveProperty('repoName');
      expect(result).toHaveProperty('owner');
      expect(result).toHaveProperty('totalFiles');
      expect(result).toHaveProperty('filteredFilesCount');
      expect(result).toHaveProperty('executionTimeMs');
      expect(result).toHaveProperty('isCached');

      // ตรวจสอบฟิลด์ที่ SideDrawer ของคนที่ 5 ต้องใช้เปิดส่องโค้ด
      result.nodes.forEach(node => {
        expect(node).toHaveProperty('id');
        expect(node).toHaveProperty('path');
        expect(node).toHaveProperty('fileType');
      });
    });
  });

  // ==========================================
  // ส่วนที่ 5: System Test / End-to-End User Scenarios (ระบบโดยรวม)
  // ==========================================
  describe.skip('ระบบโดยรวม: System Test / End-to-End User Scenarios', () => {
    it('Scenario 1 (Happy Path E2E): ผู้ใช้งานกรอก URL โปรเจกต์ Next.js จริง -> รับแผนผัง Flow ครบ 100%', async () => {
      const { POST } = await import('../app/api/analyze/route');
      const userRequest = {
        json: async () => ({
          url: 'https://github.com/chsnor/ecommerce-next'
        })
      };

      // จำลองโครงสร้างไฟล์ของโปรเจกต์ Next.js ของจริง
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          tree: [
            { path: 'node_modules/react/index.js', mode: '100644', type: 'blob', sha: '1' },
            { path: 'src/middleware.ts', mode: '100644', type: 'blob', sha: '2' },
            { path: 'src/app/page.tsx', mode: '100644', type: 'blob', sha: '3' },
            { path: 'src/app/actions.ts', mode: '100644', type: 'blob', sha: '4' },
            { path: 'src/stores/cart.ts', mode: '100644', type: 'blob', sha: '5' }
          ]
        })
      } as Response);

      const response = await POST(userRequest as unknown as import('next/server').NextRequest);
      expect(response.status).toBe(200);

      const result = await response.json();
      expect(result.owner).toBe('chsnor');
      expect(result.repoName).toBe('ecommerce-next');
      expect(result.totalFiles).toBe(5);
      expect(result.filteredFilesCount).toBe(4);
      expect(result.nodes.length).toBe(4);
      expect(result.mermaidSyntax).toContain('graph TD');
    });

    it('Scenario 2 (Cache Acceleration E2E): ร้องขอซ้ำด้วย URL เดิม ต้องได้ความเร็วระดับ < 10ms', async () => {
      const testUrl = 'https://github.com/chsnor/fast-cached-app';
      const mockTree: GitHubTreeItem[] = [
        { path: 'src/app/page.tsx', mode: '100644', type: 'blob', sha: '1' }
      ];

      // ยิงครั้งแรก: ประมวลผลและแคช
      const firstRun = await runAnalysisPipeline(testUrl, undefined, mockTree);
      expect(firstRun.isCached).toBe(false);

      // ยิงครั้งที่สอง: ดึงแคชใน RAM ทันที
      const secondRun = await runAnalysisPipeline(testUrl, undefined, mockTree);
      expect(secondRun.isCached).toBe(true);
      expect(secondRun.executionTimeMs).toBeLessThan(10);
      expect(secondRun.nodes).toEqual(firstRun.nodes);
    });

    it('Scenario 3 (Adversarial Error Boundary E2E): ส่ง URL แปลกปลอมหรือ XSS -> ระบบตัดจบด้วย HTTP 400/500 ปลอดภัย', async () => {
      const { POST } = await import('../app/api/analyze/route');
      const maliciousRequest = {
        json: async () => ({
          url: 'https://evil-phishing.com/<script>alert(1)</script>'
        })
      };

      const response = await POST(maliciousRequest as unknown as import('next/server').NextRequest);
      expect(response.status).toBeGreaterThanOrEqual(400);

      const body = await response.json();
      expect(body.error).toBeDefined();
    });

    it('Scenario 4 (Stress Scalability E2E): คลังขนาดใหญ่ 1,000 ไฟล์ ต้องประมวลผลเสร็จในเวลาน้อยกว่า 500ms', async () => {
      const massiveTree: GitHubTreeItem[] = Array.from({ length: 1000 }, (_, i) => ({
        path: i % 2 === 0 ? `node_modules/pkg-${i}/index.js` : `src/app/page-${i}.tsx`,
        mode: '100644',
        type: 'blob',
        sha: `sha-${i}`
      }));

      const startTime = performance.now();
      const result = await runAnalysisPipeline('https://github.com/chsnor/massive-repo', undefined, massiveTree);
      const duration = performance.now() - startTime;

      expect(result.totalFiles).toBe(1000);
      expect(result.filteredFilesCount).toBe(500);
      expect(duration).toBeLessThan(500);
    });
  });
});
