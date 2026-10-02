// src/lib/code-viewer.ts
import Prism from 'prismjs';

// ให้สิทธิ์การเข้าถึง Prism บนโกลบอลเพื่อป้องกัน SSR / Turbopack Prerender error
if (typeof globalThis !== 'undefined' && !(globalThis as any).Prism) {
  (globalThis as any).Prism = Prism;
}

try {
  require('prismjs/components/prism-clike');
  require('prismjs/components/prism-javascript');
  require('prismjs/components/prism-typescript');
  require('prismjs/components/prism-jsx');
  require('prismjs/components/prism-tsx');
  require('prismjs/components/prism-json');
  require('prismjs/components/prism-css');
} catch (e) {
  // รองรับกรณีสภาพแวดล้อมที่ไม่สามารถ require แบบ dynamic ได้
}

/**
 * ฟังก์ชันตรวจสอบภาษาโปรแกรมจากนามสกุลของไฟล์ สำหรับ PrismJS
 */
export function getLanguageFromPath(filePath: string): string {
  // TODO 5.1: แยกนามสกุลไฟล์ และจับคู่กับชื่อภาษาของ PrismJS (เช่น tsx, typescript, javascript, json)
  throw new Error('ยังไม่ได้เขียนฟังก์ชัน getLanguageFromPath');
}

/**
 * ฟังก์ชันตัดทอนและนับจำนวนบรรทัดของโค้ด เพื่อป้องกันไม่ให้หน้าเว็บกระตุกถ้าไฟล์มีขนาดใหญ่เกินไป
 */
export function formatCodeSnippet(rawCode: string, maxLines = 300): { totalLines: number; snippet: string; isTruncated: boolean } {
  // TODO 5.2: นับจำนวนบรรทัดทั้งหมดของ rawCode
  // TODO 5.3: หากบรรทัดเกิน maxLines ให้ตัดเฉพาะบรรทัดแรกถึง maxLines และตั้งค่า isTruncated เป็น true
  throw new Error('ยังไม่ได้เขียนฟังก์ชัน formatCodeSnippet');
}

/**
 * ฟังก์ชันทำ Syntax Highlighting ด้วย PrismJS และส่งคืน HTML String
 */
export function highlightCodeWithPrism(code: string, language: string): string {
  // TODO 5.4: เรียกใช้ Prism.highlight ร่วมกับ grammar ของภาษานั้นๆ
  // TODO 5.5: หากไม่พบ grammar ของภาษา ให้ fallback กลับไปแสดงเป็นข้อความธรรมดาอย่างปลอดภัย
  throw new Error('ยังไม่ได้เขียนฟังก์ชัน highlightCodeWithPrism');
}
