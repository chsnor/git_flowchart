import dagre from '@dagrejs/dagre';
import { CodeRelation, NextFileType, FlowNodeItem, FlowEdgeItem } from '../types';

function sanitizeNodeId(pathStr: string): string {
  const id = pathStr
    .replace(/[()]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  return id || 'node';
}

const COLOR_PALETTE: Record<string, { border: string; bg: string; text: string }> = {
  middleware: { border: '#a855f7', bg: '#0e1118', text: '#e9d5ff' },
  page: { border: '#38bdf8', bg: '#0e1118', text: '#e0f2fe' },
  action: { border: '#fb923c', bg: '#0e1118', text: '#ffedd5' },
  store: { border: '#4ade80', bg: '#0e1118', text: '#dcfce7' },
  component: { border: '#f43f5e', bg: '#0e1118', text: '#ffe4e6' },
  hook: { border: '#818cf8', bg: '#0e1118', text: '#e0e7ff' },
  api: { border: '#facc15', bg: '#0e1118', text: '#fef9c3' },
  other: { border: '#94a3b8', bg: '#0e1118', text: '#e2e8f0' },
};

export function getNodeColorConfig(fileType: NextFileType): { border: string; bg: string; text: string } {
  return COLOR_PALETTE[fileType] ?? COLOR_PALETTE.other;
}

const NODE_WIDTH = 260;
const NODE_HEIGHT = 80;

function applyDagreLayout(nodes: FlowNodeItem[], edges: FlowEdgeItem[], seenIds: Set<string>): void {
  try {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({
      rankdir: 'LR',
      align: 'UL',
      nodesep: 55,
      ranksep: 170,
      edgesep: 35,
      marginx: 60,
      marginy: 60,
    });

    for (const node of nodes) {
      dagreGraph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
    }

    for (const edge of edges) {
      if (seenIds.has(edge.source) && seenIds.has(edge.target)) {
        dagreGraph.setEdge(edge.source, edge.target);
      }
    }

    dagre.layout(dagreGraph);

    for (const node of nodes) {
      const pos = dagreGraph.node(node.id);
      if (pos) {
        node.position = {
          x: Math.round(pos.x - NODE_WIDTH / 2),
          y: Math.round(pos.y - NODE_HEIGHT / 2),
        };
      }
    }
  } catch (err) {
    console.warn('Dagre layout fallback:', err);
    nodes.forEach((node, idx) => {
      node.position = {
        x: (idx % 4) * 300,
        y: Math.floor(idx / 4) * 120,
      };
    });
  }
}

export function buildFlowElements(
  files: Array<{ path: string; fileType: NextFileType }>,
  relations: CodeRelation[]
): { nodes: FlowNodeItem[]; edges: FlowEdgeItem[] } {
  const typeById = new Map<string, string>();
  const seenIds = new Set<string>();
  const idByPath = new Map<string, string>();
  const nodes: FlowNodeItem[] = [];

  for (const file of files) {
    let id = sanitizeNodeId(file.path);
    if (seenIds.has(id)) {
      let suffix = 2;
      while (seenIds.has(`${id}_${suffix}`)) suffix++;
      id = `${id}_${suffix}`;
    }
    seenIds.add(id);
    idByPath.set(file.path, id);

    typeById.set(id, file.fileType);
    nodes.push({
      id,
      label: file.path,
      path: file.path,
      fileType: file.fileType,
      position: { x: 0, y: 0 },
    });
  }

  const seenEdges = new Set<string>();
  const edges: FlowEdgeItem[] = [];

  relations.forEach((rel, i) => {
    const source = idByPath.get(rel.source) ?? sanitizeNodeId(rel.source);
    const target = idByPath.get(rel.target) ?? sanitizeNodeId(rel.target);
    const label = rel.label ?? '';
    const key = `${source}|${target}|${label}`;
    if (seenEdges.has(key)) return;
    seenEdges.add(key);

    const isAction = typeById.get(target) === 'action' || typeById.get(source) === 'action';
    const targetType = (typeById.get(target) ?? 'other') as NextFileType;

    edges.push({
      id: `e_${source}_${target}_${i}`,
      source,
      target,
      label: label || undefined,
      animated: isAction,
      style: { stroke: getNodeColorConfig(targetType).border },
    } as FlowEdgeItem);
  });

  applyDagreLayout(nodes, edges, seenIds);

  return { nodes, edges };
}
