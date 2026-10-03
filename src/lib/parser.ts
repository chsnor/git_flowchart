// src/lib/parser.ts
import { GitHubTreeItem, CodeRelation, NextFileType } from '../types';

/**
 * ฟังก์ชันสำหรับคัดกรองเฉพาะไฟล์โค้ดสำคัญ และตัดไฟล์ที่ไม่เกี่ยวข้องทิ้ง
 * รองรับการจำกัดจำนวนไฟล์สูงสุด (maxLimit) เพื่อป้องกันไม่ให้เบราว์เซอร์ค้างหากเป็น Repo ขนาดใหญ่
 */
export function filterTreeFiles(items: GitHubTreeItem[], maxLimit = 150): GitHubTreeItem[] {
  // TODO 2.1: กำหนดรายการ Blacklist ที่ต้องคัดทิ้ง (node_modules, .next, dist, build, public, lockfiles, configs)
  // TODO 2.2: กำหนดรายการ Whitelist นามสกุลไฟล์ที่ต้องการเก็บไว้ (.ts, .tsx, .js, .jsx)
  // TODO 2.3: คัดเฉพาะไฟล์ที่เป็นประเภท blob และไม่ตรงกับ Blacklist
  // TODO 2.4 (Safety Guard): หากจำนวนไฟล์ที่กรองได้เกิน maxLimit ให้ตัดทอนด้วย .slice(0, maxLimit)
  throw new Error('ยังไม่ได้เขียนฟังก์ชัน filterTreeFiles');
}

/**
 * ฟังก์ชันจำแนกประเภทไฟล์ในสถาปัตยกรรม Next.js (App Router Architecture)
 * รองรับทั้งกรณีมีโฟลเดอร์ src/ (เช่น src/app/page.tsx) และไม่มี src/ (เช่น app/page.tsx)
 * - 'middleware': middleware.ts หรือ proxy.ts (คัดกรองความปลอดภัย)
 * - 'page': page.tsx (หน้าจอแสดงผล)
 * - 'layout': layout.tsx (โครงหน้าเว็บ)
 * - 'action': actions.ts หรือไฟล์ในโฟลเดอร์ actions/ (Server Action)
 * - 'store': ไฟล์ในโฟลเดอร์ stores/, context/ หรือ state
 * - 'api': route.ts หรือไฟล์ใน api/
 * - 'component': ไฟล์ใน components/
 * - 'other': ไฟล์อื่นๆ เช่น lib/ หรือ utils/
 */
export function detectNextFileType(filePath: string): NextFileType {
  // TODO 2.5: ตรวจสอบ path ของไฟล์ (รองรับทั้งแบบมี 'src/' นำหน้า และแบบวางที่ root เช่น 'app/page.tsx')
  // TODO 2.6: ส่งคืน NextFileType ตามประเภทโฟลเดอร์หรือชื่อไฟล์
  throw new Error('ยังไม่ได้เขียนฟังก์ชัน detectNextFileType');
}

/**
 * ฟังก์ชันสำหรับสกัดความสัมพันธ์การ import ไฟล์ภายในโปรเจกต์
 */
export function extractImportsFromCode(sourcePath: string, codeContent: string): CodeRelation[] {
  // TODO 2.7: จัดการกรองบรรทัดที่ถูกคอมเมนต์ทิ้ง (Comment Stripping)
  // TODO 2.8: สร้าง Regular Expression สกัดคำสั่ง import (ทั้งบรรทัดเดียวและหลายบรรทัด)
  // TODO 2.9: คัดกรองเฉพาะ Local / Alias Imports (ขึ้นต้นด้วย ./, ../, @/, ~/)
  // TODO 2.10: ตัดความสัมพันธ์ซ้ำซ้อน (Deduplication)
  throw new Error('ยังไม่ได้เขียนฟังก์ชัน extractImportsFromCode');
}

/**
 * ฟังก์ชันสกัดการเรียกใช้ Event และ Server Action (เช่น onClick, form action)
 * เพื่อลากเส้นความสัมพันธ์ที่มี Label แสดงการกระทำของผู้ใช้
 */
export function extractActionTriggers(sourcePath: string, codeContent: string): CodeRelation[] {
  // TODO 2.11: ค้นหาแพทเทิร์น onClick={handler} หรือ form action={actionHandler} ในโค้ด JSX/TSX
  // TODO 2.12: สกัดชื่อฟังก์ชันปลายทาง และสร้าง CodeRelation พร้อม label เช่น "onClick", "form action"
  throw new Error('ยังไม่ได้เขียนฟังก์ชัน extractActionTriggers');
}
