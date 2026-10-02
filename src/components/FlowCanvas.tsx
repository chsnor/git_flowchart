'use client';

import React from 'react';
import { FlowNodeItem, FlowEdgeItem, NextFileType } from '../types';

export interface FlowCanvasProps {
  nodes: FlowNodeItem[];
  edges: FlowEdgeItem[];
  onSelectNode?: (path: string, fileType: NextFileType) => void;
}

/**
 * คอมโพเนนต์ผืนผ้าใบ Interactive Flowchart (คนที่ 3 รับผิดชอบ)
 * รองรับการซูม แพน ย้ายโหนด และคลิกดูรายละเอียดไฟล์ผ่าน React Flow (@xyflow/react)
 */
export function FlowCanvas({ nodes, edges, onSelectNode }: FlowCanvasProps) {
  // =========================================================================
  // พื้นที่ทำงานของ คนที่ 3: Interactive Flow Visualizer & React Flow
  // =========================================================================

  // TODO 3.12: นำเข้าคอมโพเนนต์จาก '@xyflow/react' และ '@xyflow/react/dist/style.css'
  // เช่น ReactFlow, MiniMap, Controls, Background

  // TODO 3.13: แปลง nodes (FlowNodeItem[]) เป็นโหนดของ React Flow (Node[])
  // - กำหนด position { x, y }
  // - ผูกสี border/bg จาก getNodeColorConfig(fileType) ใน lib/generator.ts

  // TODO 3.14: แปลง edges (FlowEdgeItem[]) เป็นเส้นเชื่อมของ React Flow (Edge[])
  // - ผูก id, source, target, label, animated

  // TODO 3.15: ประกอบ JSX ของ ReactFlow พร้อมใส่ MiniMap, Controls, และดักจับ onNodeClick

  return (
    <div className="h-[550px] w-full rounded-2xl border border-dashed border-slate-800 bg-slate-950 p-6 flex flex-col items-center justify-center text-center space-y-3">
      <div className="p-3 bg-blue-500/10 rounded-full border border-blue-500/20 text-blue-400 text-xs font-semibold">
        ผืนผ้าใบ React Flow (Canvas)
      </div>
      <p className="text-sm font-medium text-slate-300">
        [พื้นที่ทำงาน คนที่ 3: ผืนผ้าใบ Interactive Flowchart]
      </p>
      <p className="text-xs max-w-md text-slate-500 leading-relaxed">
        เมื่อเขียน TODO 3.12 - 3.15 เรียบร้อย โหนดของโปรเจกต์จะถูกจัดวางเป็นผังที่สามารถคลิกลาก ซูม แพน และคลิกดูไฟล์ได้ที่นี่
      </p>
      <div className="text-[11px] text-slate-600 font-mono">
        (จำนวนโหนดปัจจุบัน: {nodes?.length || 0} | จำนวนเส้นเชื่อม: {edges?.length || 0})
      </div>
    </div>
  );
}
