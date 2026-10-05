import { url } from "inspector/promises";

// src/lib/ui-helper.ts
// src/lib/ui-helper.ts

/**
 * สมมติฐานที่ SRS ไม่ได้ระบุ:
 *  - ขอบเขตเกรด: A = 0.8 ≤ r ≤ 2.5, B = 2.5 < r ≤ 4.0, นอกเหนือจากนั้น = C
 *  - filteredFiles ≤ 0 → เกรด 'N/A' (ratio = 0)
 *  - Base64 เป็นแบบ URL-safe (แทน + / ด้วย - _ และตัด =) และรองรับภาษาไทย
 *  - Token ของผู้ใช้ไม่ถูกใส่ในลิงก์แชร์
 */

/* ------------------------------------------------------------------ */
/* ฟังก์ชันภายใน                                                        */
/* ------------------------------------------------------------------ */

const XSS_PATTERN = /<\s*\/?\s*[a-z!]|javascript:|data:\s*text\/html/i;
const ALLOWED_HOSTS = new Set(['github.com', 'www.github.com']);

/** แปลงเป็นจำนวนเต็มไม่ติดลบ (NaN / Infinity / ติดลบ / ไม่ใช่ตัวเลข → 0) */
const toSafeCount = (n: unknown): number =>
  typeof n === 'number' && Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(encoded: string): string {
  const b64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
  const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/* ------------------------------------------------------------------ */
/* 4.1 – 4.4  validateUrlInput                                         */
/* ------------------------------------------------------------------ */

/**
 * ฟังก์ชันช่วยตรวจสอบความถูกต้องและความปลอดภัยของ URL ก่อนส่งคำขอ
 */
export function validateUrlInput(input: string): { isValid: boolean; errorMessage: string | null } {
  // 4.1 ค่าว่าง / ช่องว่างล้วน (trim หัวท้ายก่อนตรวจ)
  const url = (typeof input === 'string' ? input : '').trim();
  if (url === '') {
    return { isValid: false, errorMessage: 'กรุณากรอก GitHub URL' };
  }

  // 4.2 XSS / อินพุตน่าสงสัย
  if (XSS_PATTERN.test(url)) {
    return { isValid: false, errorMessage: 'URL ต้องมาจาก github.com เท่านั้น' };
  }

  // 4.3 โดเมนต้องเป็น github.com — เทียบ host ตรง ๆ กัน evil.com/github.com
  const hostMatch = url.match(/^(?:https?:\/\/)?([^/?#\s]+)/i);
  const host = hostMatch ? hostMatch[1].toLowerCase() : '';
  if (!ALLOWED_HOSTS.has(host)) {
    return { isValid: false, errorMessage: 'URL ต้องมาจาก github.com เท่านั้น' };
  }

  // 4.4 ผ่านทั้งหมด
  return { isValid: true, errorMessage: null };
}

/* ------------------------------------------------------------------ */
/* 4.5 – 4.7  formatRepoStats                                          */
/* ------------------------------------------------------------------ */

/**
 * ฟังก์ชันคำนวณและจัดรูปแบบตัวเลขสถิติสำหรับนำไปแสดงบนหน้าจอ Dashboard
 */
export function formatRepoStats(
  totalFiles: number,
  filteredFiles: number,
): {
  rawCount: number;
  analyzedCount: number;
  ignoredCount: number;
  summaryText: string;
} {
  // 4.5 Math Safety: ไม่ติดลบ ไม่ NaN และ ignoredCount ไม่ติดลบ
  const rawCount = toSafeCount(totalFiles);
  const analyzedCount = toSafeCount(filteredFiles);
  const ignoredCount = Math.max(0, rawCount - analyzedCount);

  // 4.6 ข้อความสรุป
  const summaryText = `วิเคราะห์โค้ดทั้งหมด ${analyzedCount.toLocaleString('en-US')} ไฟล์ (ตัดทิ้ง ${ignoredCount.toLocaleString('en-US')} ไฟล์จากทั้งหมด ${rawCount.toLocaleString('en-US')} ไฟล์)`;

  // 4.7
  return { rawCount, analyzedCount, ignoredCount, summaryText };
}

/* ------------------------------------------------------------------ */
/* 4.8  calculateHealthScore                                           */
/* ------------------------------------------------------------------ */

/**
 * ฟังก์ชันคำนวณคะแนนสุขภาพสถาปัตยกรรม (Architecture Health Score)
 * Coupling Ratio = totalRelations / filteredFiles
 * - 0.8 ≤ r ≤ 2.5  → A (โครงสร้างแยกส่วนกำลังพอดี ไม่ซับซ้อนเกินไป)
 * - 2.5 < r ≤ 4.0  → B (เริ่มมีความผูกพันกันค่อนข้างแน่น)
 * - r > 4.0 หรือ r < 0.8 → C (ผูกกันแน่นเกินไป หรือแทบไม่มีการแยกส่วนคอมโพเนนต์)
 * - filteredFiles เป็น 0 → N/A
 */
export function calculateHealthScore(
  totalRelations: number,
  filteredFiles: number,
): {
  grade: 'A' | 'B' | 'C' | 'N/A';
  ratio: number;
  description: string;
} {
  const relations = toSafeCount(totalRelations);
  const files = toSafeCount(filteredFiles);

  if (files === 0) {
    return { grade: 'N/A', ratio: 0, description: 'ยังไม่มีไฟล์ให้ประเมินโครงสร้าง' };
  }

  const rawRatio = relations / files;
  const ratio = Math.round(rawRatio * 100) / 100; // ปัด 2 ตำแหน่งเพื่อแสดงผล (เกรดตัดจากค่าจริง)

  if (rawRatio >= 0.8 && rawRatio <= 2.5) {
    return { grade: 'A', ratio, description: 'โครงสร้างดี มีการแยกโมดูลเหมาะสม' };
  }
  if (rawRatio > 2.5 && rawRatio <= 4.0) {
    return { grade: 'B', ratio, description: 'เริ่มมีความผูกพันกันค่อนข้างแน่น' };
  }
  return { grade: 'C', ratio, description: 'ผูกกันแน่นเกินไป หรือแทบไม่มีการแยกส่วน' };
}

/* ------------------------------------------------------------------ */
/* 4.9 – 4.10  Shareable state                                         */
/* ------------------------------------------------------------------ */

/**
 * เข้ารหัส State ของหน้าจอเป็น Base64 (URL-safe) สำหรับใช้เป็นค่าของ ?state=
 */
export function encodeShareableState(url: string, activeNode?: string): string {
  const payload: { url: string; activeNode?: string } = { url };
  if (activeNode) payload.activeNode = activeNode;
  return toBase64Url(JSON.stringify(payload));
}

/**
 * ถอดรหัส State จาก query string — คืน null ถ้าข้อมูลเสียหายหรือรูปแบบไม่ถูกต้อง
 */
export function decodeShareableState(
  encodedStr: string,
): { url: string; activeNode?: string } | null {
  if (!encodedStr || typeof encodedStr !== 'string') return null;

  try {
    const parsed: unknown = JSON.parse(fromBase64Url(encodedStr));
    if (typeof parsed !== 'object' || parsed === null) return null;

    const { url, activeNode } = parsed as Record<string, unknown>;
    if (typeof url !== 'string' || url.trim() === '') return null;

    return typeof activeNode === 'string' ? { url, activeNode } : { url };
  } catch {
    return null;
  }
}

/**
 * (เสริม) สร้างลิงก์แชร์เต็ม เช่น https://app.example/?state=eyJ1cmwi...
 */
export function buildShareUrl(baseUrl: string, url: string, activeNode?: string): string {
  return `${baseUrl}?state=${encodeShareableState(url, activeNode)}`;
}