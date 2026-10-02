// src/lib/generator.ts
import { CodeRelation, NextFileType, FlowNodeItem, FlowEdgeItem } from '../types';

/**
 * ฟังก์ชันสำหรับแปลงชื่อ path ให้เป็น Node ID ที่ปลอดภัยตามไวยากรณ์ของ Flow และ Mermaid
 */
export function sanitizeNodeId(pathStr: string): string {
  // TODO 3.1: กำจัดวงเล็บของ Next.js Route Groups ออก เช่น (auth)
  // TODO 3.2: แทนที่อักขระพิเศษด้วยเครื่องหมาย Underscore (_)
  // TODO 3.3: ทำความสะอาดหัวท้ายสตริง (Trimming Underscores)
  throw new Error('ยังไม่ได้เขียนฟังก์ชัน sanitizeNodeId');
}

/**
 * ฟังก์ชันคืนค่าการกำหนดสีตามประเภทไฟล์ของ Next.js
 * - middleware: สีม่วง (#a855f7)
 * - page: สีฟ้า (#38bdf8)
 * - action: สีส้ม (#fb923c)
 * - store: สีเขียว (#4ade80)
 * - component: สีคราม/เขียวมิ้นท์ (#2dd4bf)
 * - api: สีเหลือง (#facc15)
 * - other: สีเทา (#94a3b8)
 */
export function getNodeColorConfig(fileType: NextFileType): { border: string; bg: string; text: string } {
  // TODO 3.4: คืนค่า color palette ตาม fileType ที่กำหนด
  throw new Error('ยังไม่ได้เขียนฟังก์ชัน getNodeColorConfig');
}

/**
 * ฟังก์ชันกำหนดสีขอบและพื้นหลังสำหรับ Mermaid Syntax (Backward Compatibility)
 */
export function getNodeStyle(nodeId: string, originalPath: string, fileType: NextFileType = 'other'): string {
  // TODO 3.5: ตรวจสอบประเภทและส่งคืนคำสั่ง style ของ Mermaid เช่น `style nodeId fill:#1e293b,stroke:#38bdf8`
  throw new Error('ยังไม่ได้เขียนฟังก์ชัน getNodeStyle');
}

/**
 * ฟังก์ชันสร้าง Nodes และ Edges สำหรับ React Flow (@xyflow/react)
 * พร้อมคำนวณพิกัด X, Y จัดวางเลเยอร์เบื้องต้น
 */
export function buildFlowElements(
  files: Array<{ path: string; fileType: NextFileType }>,
  relations: CodeRelation[]
): { nodes: FlowNodeItem[]; edges: FlowEdgeItem[] } {
  // TODO 3.6: แปลงรายการไฟล์เป็น FlowNodeItem โดยคำนวณพิกัด position {x, y} ตามประเภทไฟล์
  // TODO 3.7: แปลง relations เป็น FlowEdgeItem พร้อมใส่ label เช่น 'onClick', 'form action' และ animated ถ้าเป็น action
  throw new Error('ยังไม่ได้เขียนฟังก์ชัน buildFlowElements');
}

/**
 * ฟังก์ชันสร้าง Mermaid Graph Syntax จากรายการความสัมพันธ์ของโค้ด
 */
export function generateMermaidSyntax(relations: CodeRelation[]): string {
  // TODO 3.8: จัดการกรณีไม่มีความสัมพันธ์ (Empty State Handling)
  // TODO 3.9: กำหนดหัวตารางของ Mermaid Diagram (graph TD)
  // TODO 3.10: แปลงคู่ความสัมพันธ์เป็นเส้นเชื่อมโยง พร้อม label (ถ้ามี)
  // TODO 3.11: ตัดความสัมพันธ์ซ้ำซ้อน
  throw new Error('ยังไม่ได้เขียนฟังก์ชัน generateMermaidSyntax');
}
