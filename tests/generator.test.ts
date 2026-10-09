import { describe, it, expect } from 'vitest';
import { buildFlowElements, getNodeColorConfig } from '../src/lib/generator';
import { CodeRelation, NextFileType } from '../src/types';

describe('Flow Generator (src/lib/generator.ts)', () => {
  it('สร้าง Nodes และ Edges สำหรับ React Flow ได้อย่างถูกต้อง', () => {
    const files: Array<{ path: string; fileType: NextFileType }> = [
      { path: 'src/app/page.tsx', fileType: 'page' },
      { path: 'src/components/Button.tsx', fileType: 'component' },
    ];

    const relations: CodeRelation[] = [
      {
        source: 'src/app/page.tsx',
        target: 'src/components/Button.tsx',
        type: 'import',
        label: 'renders',
      },
    ];

    const { nodes, edges } = buildFlowElements(files, relations);

    expect(nodes.length).toBe(2);
    expect(edges.length).toBe(1);

    expect(nodes[0].path).toBe('src/app/page.tsx');
    expect(nodes[0].position).toHaveProperty('x');
    expect(nodes[0].position).toHaveProperty('y');

    expect(edges[0].label).toBe('renders');
  });

  it('ส่งคืนชุดสีตามประเภทไฟล์อย่างถูกต้อง', () => {
    const pageColor = getNodeColorConfig('page');
    expect(pageColor.border).toBe('#38bdf8');

    const actionColor = getNodeColorConfig('action');
    expect(actionColor.border).toBe('#fb923c');
  });
});

