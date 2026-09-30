// src/lib/parser.ts
import { GitHubTreeItem, CodeRelation } from '../types';

/**
 * ฟังก์ชันสำหรับคัดกรองเฉพาะไฟล์โค้ดสำคัญ และตัดไฟล์ที่ไม่เกี่ยวข้องทิ้ง
 */
export function filterTreeFiles(items: GitHubTreeItem[]): GitHubTreeItem[] {
  // TODO 2.1: กำหนดรายการ Blacklist ที่ต้องคัดทิ้ง (Ignore Patterns)
  // TODO 2.2: กำหนดรายการ Whitelist นามสกุลไฟล์ที่ต้องการเก็บไว้
  // TODO 2.3: กรองรายการไฟล์ด้วย .filter()
  throw new Error('ยังไม่ได้เขียนฟังก์ชัน filterTreeFiles');
}

/**
 * ฟังก์ชันสำหรับสกัดความสัมพันธ์การ import ไฟล์ภายในโปรเจกต์
 */
export function extractImportsFromCode(sourcePath: string, codeContent: string): CodeRelation[] {
  // TODO 2.4: จัดการกรองบรรทัดที่ถูกคอมเมนต์ทิ้ง (Comment Stripping)
  // TODO 2.5: สร้าง Regular Expression สกัดคำสั่ง import
  // TODO 2.6: คัดกรองเฉพาะ Local / Alias Imports
  // TODO 2.7: ป้องกันความสัมพันธ์ซ้ำซ้อน (Deduplication)
  throw new Error('ยังไม่ได้เขียนฟังก์ชัน extractImportsFromCode');
}
