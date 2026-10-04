'use client';

import React, { useEffect, useMemo } from 'react';
// TODO 3.12: นำเข้าคอมโพเนนต์จาก '@xyflow/react' และ CSS
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { FlowNodeItem, FlowEdgeItem, NextFileType } from '../types';
import { getNodeColorConfig } from '../lib/generator';

export interface FlowCanvasProps {
  nodes: FlowNodeItem[];
  edges: FlowEdgeItem[];
  onSelectNode?: (path: string, fileType: NextFileType) => void;
}

type NodeData = {
  label: string;
  path: string;
  fileType: NextFileType;
  [key: string]: unknown;
};

const COLUMNS = 4;
const COL_WIDTH = 280;
const ROW_HEIGHT = 120;

/**
 * แปลง FlowNodeItem[] เป็น Node[] ของ React Flow
 */
function toRfNodes(items: FlowNodeItem[]): Node<NodeData>[] {
  // TODO 3.13
  return (items ?? []).map((item, index) => {
    // position อาจมาจาก buildFlowElements; ถ้าไม่มีให้จัดเป็นตารางสำรอง
    const pos = (item as unknown as { position?: { x: number; y: number } }).position ?? {
      x: (index % COLUMNS) * COL_WIDTH,
      y: Math.floor(index / COLUMNS) * ROW_HEIGHT,
    };
    const colors = getNodeColorConfig(item.fileType);

    return {
      id: item.id,
      position: pos,
      data: { label: item.label, path: item.path, fileType: item.fileType },
      style: {
        border: `2px solid ${colors.border}`,
        background: colors.bg,
        color: colors.text,
        borderRadius: 8,
        padding: 10,
        fontSize: 12,
        width: 220,
      },
    };
  });
}

/**
 * แปลง FlowEdgeItem[] เป็น Edge[] ของ React Flow
 */
function toRfEdges(items: FlowEdgeItem[]): Edge[] {
  // TODO 3.14
  return (items ?? []).map((item) => ({
    id: item.id,
    source: item.source,
    target: item.target,
    label: item.label,
    animated: Boolean(item.animated),
    style: { stroke: '#64748b', strokeWidth: 1.5 },
    labelStyle: { fill: '#cbd5e1', fontSize: 11 },
    labelBgStyle: { fill: '#0f172a' },
  }));
}

/**
 * คอมโพเนนต์ผืนผ้าใบ Interactive Flowchart
 * รองรับการซูม แพน ย้ายโหนด และคลิกดูรายละเอียดไฟล์ผ่าน React Flow (@xyflow/react)
 */
export function FlowCanvas({ nodes, edges, onSelectNode }: FlowCanvasProps) {
  const initialNodes = useMemo(() => toRfNodes(nodes), [nodes]);
  const initialEdges = useMemo(() => toRfEdges(edges), [edges]);

  // ใช้ state ภายในเพื่อให้ลากย้ายโหนดได้ และ sync เมื่อ props เปลี่ยน
  const [rfNodes, setRfNodes, onNodesChange] = useNodesState<Node<NodeData>>(initialNodes);
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState<Edge>(initialEdges);

  useEffect(() => {
    setRfNodes(initialNodes);
  }, [initialNodes, setRfNodes]);

  useEffect(() => {
    setRfEdges(initialEdges);
  }, [initialEdges, setRfEdges]);

  if (!nodes || nodes.length === 0) {
    return (
      <div className="h-[550px] w-full rounded-2xl border border-dashed border-slate-800 bg-slate-950 flex items-center justify-center text-sm text-slate-500">
        ยังไม่มีข้อมูลโหนดให้แสดง
      </div>
    );
  }

  // TODO 3.15
  return (
    <div className="h-[550px] w-full rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden">
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={(_, node) => {
          const data = node.data as NodeData;
          onSelectNode?.(data.path, data.fileType);
        }}
        colorMode="dark"
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        proOptions={{ hideAttribution: true }}
        onlyRenderVisibleElements={true}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#1e293b" />
        <Controls />
        <MiniMap
          pannable
          zoomable
          maskColor="rgba(2, 6, 23, 0.7)"
          style={{ background: '#0f172a' }}
          nodeColor={(node) => getNodeColorConfig((node.data as NodeData).fileType).border}
        />
      </ReactFlow>
    </div>
  );
}