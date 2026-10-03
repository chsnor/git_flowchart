// src/tests/6_integration_pipeline.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { runAnalysisPipeline, clearPipelineCache, pipelineCache } from '../lib/pipeline';
import { GitHubTreeItem } from '../types';

describe('คนที่ 6: pipeline.ts (Integration Pipeline, QA & Deployment)', () => {
  beforeEach(() => {
    clearPipelineCache();
  });

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

  it('จัดการกรณี URL ไม่ถูกต้องโดย Throw ข้อผิดพลาดที่อ่านเข้าใจง่าย', async () => {
    await expect(runAnalysisPipeline('https://gitlab.com/invalid/repo')).rejects.toThrow(
      'URL ต้องมาจาก github.com เท่านั้น'
    );
  });
});
