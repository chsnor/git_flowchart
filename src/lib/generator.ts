// src/lib/generator.ts
import { CodeRelation } from '../types';

/**
 * ฟังก์ชันสำหรับแปลงชื่อ path ให้เป็น Node ID ที่ปลอดภัยตามไวยากรณ์ของ Mermaid
 */
export function sanitizeNodeId(pathStr: string): string {
  // TODO 3.1: กำจัดวงเล็บของ Next.js Route Groups ออก
  // TODO 3.2: แทนที่อักขระพิเศษด้วยเครื่องหมาย Underscore (_)
  // TODO 3.3: ทำความสะอาดหัวท้ายสตริง (Trimming Underscores)
  throw new Error('ยังไม่ได้เขียนฟังก์ชัน sanitizeNodeId');
}

/**
 * ฟังก์ชันกำหนดสีขอบและพื้นหลังของกล่องตามประเภทของโฟลเดอร์ (Color Coding)
 * - หน้าเว็บใน app/ -> สีกรอบฟ้า (fill:#1e293b,stroke:#38bdf8,stroke-width:2px)
 * - คอมโพเนนต์ใน components/ -> สีกรอบเขียว (fill:#1e293b,stroke:#4ade80,stroke-width:2px)
 * - ไลบรารีหรือฟังก์ชันใน lib/ หรือ api/ -> สีกรอบส้ม (fill:#1e293b,stroke:#fb923c,stroke-width:2px)
 * - อื่นๆ -> สีเทามาตรฐาน (fill:#1e293b,stroke:#94a3b8)
 */
export function getNodeStyle(nodeId: string, originalPath: string): string {
  // TODO 3.8: ตรวจสอบ path แล้วส่งคืนคำสั่ง style ของ Mermaid เช่น `style nodeId fill:#1e293b,stroke:#38bdf8`
  throw new Error('ยังไม่ได้เขียนฟังก์ชัน getNodeStyle');
}

/**
 * ฟังก์ชันสร้าง Mermaid Graph Syntax จากรายการความสัมพันธ์ของโค้ด
 */
export function generateMermaidSyntax(relations: CodeRelation[]): string {
  // TODO 3.4: จัดการกรณีไม่มีความสัมพันธ์ (Empty State Handling)
  // TODO 3.5: กำหนดหัวตารางของ Mermaid Diagram (graph TD)
  // TODO 3.6: แปลงคู่ความสัมพันธ์เป็นเส้นเชื่อมโยง (Edges Generation)
  // TODO 3.7: รวมบรรทัดทั้งหมดเข้าด้วยกัน
  // TODO 3.9: เพิ่มสไตล์สีให้แต่ละโหนดด้วย getNodeStyle (Color-Coded Nodes)
  throw new Error('ยังไม่ได้เขียนฟังก์ชัน generateMermaidSyntax');
}
