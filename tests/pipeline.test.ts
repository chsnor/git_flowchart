import { describe, it, expect } from 'vitest';
import { runAnalysisPipeline } from '../src/lib/pipeline';
import { GitHubTreeItem } from '../src/types';

const createMockItem = (path: string): GitHubTreeItem => ({
  path,
  mode: '100644',
  type: 'blob',
  sha: 'mocksha123',
});

describe('Integration Pipeline (src/lib/pipeline.ts)', () => {
  it('ประมวลผล Mock Tree Data และสร้างผลลัพธ์ Flowchart พร้อมสายสัมพันธ์ได้สมบูรณ์', async () => {
    const mockTree: GitHubTreeItem[] = [
      createMockItem('src/app/page.tsx'),
      createMockItem('src/components/Header.tsx'),
      createMockItem('package.json'),
    ];

    const mockContent: Record<string, string> = {
      'src/app/page.tsx': "import Header from '@/components/Header';",
      'src/components/Header.tsx': 'export default function Header() { return null; }',
    };

    const result = await runAnalysisPipeline(
      'https://github.com/mock-owner/mock-repo',
      undefined,
      mockTree,
      mockContent
    );

    expect(result.owner).toBe('mock-owner');
    expect(result.repoName).toBe('mock-repo');
    expect(result.nodes.length).toBe(2);
    expect(result.edges.length).toBe(1);
    expect(result.relations.length).toBe(1);

    expect(result.relations[0].source).toBe('src/app/page.tsx');
    expect(result.relations[0].target).toBe('src/components/Header.tsx');
    expect(result.edges[0].source).toBe(result.nodes[0].id);
    expect(result.edges[0].target).toBe(result.nodes[1].id);
  });

  it('ส่งคืนผลลัพธ์จาก Cache เมื่อเรียกซ้ำด้วย URL เดิม', async () => {
    const mockTree: GitHubTreeItem[] = [createMockItem('src/app/page.tsx')];

    const firstRun = await runAnalysisPipeline(
      'https://github.com/cache-owner/cache-repo',
      undefined,
      mockTree,
      {}
    );
    expect(firstRun.isCached).toBe(false);

    const secondRun = await runAnalysisPipeline('https://github.com/cache-owner/cache-repo');
    expect(secondRun.isCached).toBe(true);
  });

  it('ปฏิเสธ URL ที่ไม่ถูกต้อง', async () => {
    await expect(runAnalysisPipeline('invalid-url')).rejects.toThrow(
      'URL ต้องมาจาก github.com เท่านั้น'
    );
  });
});

