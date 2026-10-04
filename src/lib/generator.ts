// src/lib/generator.ts
import { CodeRelation, NextFileType, FlowNodeItem, FlowEdgeItem } from '../types';

/**
 * ฟังก์ชันสำหรับแปลงชื่อ path ให้เป็น Node ID ที่ปลอดภัยตามไวยากรณ์ของ Flow และ Mermaid
 */
export function sanitizeNodeId(pathStr: string): string {
  const id = pathStr
    // 3.1: กำจัดวงเล็บของ Next.js Route Groups เช่น (auth) -> auth
    .replace(/[()]/g, '')
    // 3.2: แทนที่อักขระพิเศษทุกตัวด้วย underscore
    .replace(/[^a-zA-Z0-9]+/g, '_')
    // 3.3: ตัด underscore หัวท้าย
    .replace(/^_+|_+$/g, '');

  return id || 'node';
}

const COLOR_PALETTE: Record<string, { border: string; bg: string; text: string }> = {
  middleware: { border: '#a855f7', bg: '#1e293b', text: '#e9d5ff' },
  page: { border: '#38bdf8', bg: '#1e293b', text: '#e0f2fe' },
  action: { border: '#fb923c', bg: '#1e293b', text: '#ffedd5' },
  store: { border: '#4ade80', bg: '#1e293b', text: '#dcfce7' },
  component: { border: '#2dd4bf', bg: '#1e293b', text: '#ccfbf1' },
  api: { border: '#facc15', bg: '#1e293b', text: '#fef9c3' },
  other: { border: '#94a3b8', bg: '#1e293b', text: '#e2e8f0' },
};

/**
 * ฟังก์ชันคืนค่าการกำหนดสีตามประเภทไฟล์ของ Next.js
 */
export function getNodeColorConfig(fileType: NextFileType): { border: string; bg: string; text: string } {
  // 3.4
  return COLOR_PALETTE[fileType] ?? COLOR_PALETTE.other;
}

/**
 * ฟังก์ชันกำหนดสีขอบและพื้นหลังสำหรับ Mermaid Syntax (Backward Compatibility)
 */
export function getNodeStyle(nodeId: string, originalPath: string, fileType: NextFileType = 'other'): string {
  // 3.5: ถ้า fileType ยังเป็น 'other' ให้เดาจากชื่อ path เพื่อรองรับโค้ดเก่า
  let type: NextFileType = fileType;
  if (type === 'other') {
    const p = originalPath.toLowerCase();
    if (/(^|\/)middleware\.[jt]sx?$/.test(p)) type = 'middleware' as NextFileType;
    else if (/(^|\/)page\.[jt]sx?$/.test(p)) type = 'page' as NextFileType;
    else if (/(^|\/)route\.[jt]s$/.test(p) || p.includes('/api/')) type = 'api' as NextFileType;
    else if (/action/.test(p)) type = 'action' as NextFileType;
    else if (/(store|zustand|redux)/.test(p)) type = 'store' as NextFileType;
    else if (/components?\//.test(p)) type = 'component' as NextFileType;
  }

  const { border, bg } = getNodeColorConfig(type);
  return `style ${nodeId} fill:${bg},stroke:${border},stroke-width:2px`;
}

// คอลัมน์ของแต่ละประเภทไฟล์ (ซ้าย -> ขวา ตามลำดับการไหลของข้อมูล)
const COLUMN_ORDER: string[] = ['middleware', 'page', 'component', 'action', 'api', 'store', 'other'];
const COL_WIDTH = 280;
const ROW_HEIGHT = 120;

/**
 * ฟังก์ชันสร้าง Nodes และ Edges สำหรับ React Flow (@xyflow/react)
 * พร้อมคำนวณพิกัด X, Y จัดวางเลเยอร์เบื้องต้น
 */
export function buildFlowElements(
  files: Array<{ path: string; fileType: NextFileType }>,
  relations: CodeRelation[]
): { nodes: FlowNodeItem[]; edges: FlowEdgeItem[] } {
  // 3.6: สร้าง nodes โดยจัดคอลัมน์ตามประเภท และเรียงแถวภายในคอลัมน์
  const rowCounter: Record<string, number> = {};
  const typeById = new Map<string, string>();
  const seenIds = new Set<string>();
  const nodes: FlowNodeItem[] = [];

  for (const file of files) {
    const id = sanitizeNodeId(file.path);
    if (seenIds.has(id)) continue; // กัน id ซ้ำ
    seenIds.add(id);

    const typeKey = COLUMN_ORDER.includes(file.fileType) ? file.fileType : 'other';
    const col = COLUMN_ORDER.indexOf(typeKey);
    const row = rowCounter[typeKey] ?? 0;
    rowCounter[typeKey] = row + 1;

    const colors = getNodeColorConfig(file.fileType);
    typeById.set(id, file.fileType);

    nodes.push({
      id,
      label: file.path,
      path: file.path,
      fileType: file.fileType,
      position: { x: col * COL_WIDTH, y: row * ROW_HEIGHT },
    });
  }

  // 3.7: สร้าง edges พร้อม label และ animated ถ้าปลายทางเป็น action
  const seenEdges = new Set<string>();
  const edges: FlowEdgeItem[] = [];

  relations.forEach((rel, i) => {
    const source = sanitizeNodeId(rel.source);
    const target = sanitizeNodeId(rel.target);
    const label = rel.label ?? '';
    const key = `${source}|${target}|${label}`;
    if (seenEdges.has(key)) return;
    seenEdges.add(key);

    edges.push({
      id: `e_${source}_${target}_${i}`,
      source,
      target,
      label: label || undefined,
      animated: typeById.get(target) === 'action' || typeById.get(source) === 'action',
      style: { stroke: getNodeColorConfig((typeById.get(target) ?? 'other') as NextFileType).border },
    } as FlowEdgeItem);
  });

  return { nodes, edges };
}

/**
 * ฟังก์ชันสร้าง Mermaid Graph Syntax จากรายการความสัมพันธ์ของโค้ด
 */
export function generateMermaidSyntax(relations: CodeRelation[]): string {
  // 3.8: Empty State
  if (!relations || relations.length === 0) {
    return 'graph TD\n  Empty["No local relations found"]';
  }

  // 3.9: หัว diagram
  const lines: string[] = ['graph TD'];
  const seen = new Set<string>();

  const esc = (s: string) => s.replace(/"/g, '#quot;');

  for (const rel of relations) {
    const from = sanitizeNodeId(rel.source);
    const to = sanitizeNodeId(rel.target);
    const label = rel.label ? esc(rel.label) : '';

    // 3.11: ตัดความสัมพันธ์ซ้ำ
    const key = `${from}|${to}|${label}`;
    if (seen.has(key)) continue;
    seen.add(key);

    // 3.10: เส้นเชื่อมพร้อม label (ถ้ามี)
    const arrow = label ? `-->|"${label}"|` : '-->';
    lines.push(`  ${from}["${esc(rel.source)}"] ${arrow} ${to}["${esc(rel.target)}"]`);
  }

  return lines.join('\n');
}