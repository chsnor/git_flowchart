// src/lib/ui-helper.ts

/**
 * ฟังก์ชันช่วยตรวจสอบความถูกต้องและความปลอดภัยของ URL ก่อนส่งคำขอ
 */
export function validateUrlInput(input: string): { isValid: boolean; errorMessage: string | null } {
  // TODO 4.1: ตรวจสอบความยาวและค่าว่าง (Empty & Whitespace Check)
  if (!input || !input.trim()) {
    return { isValid: false, errorMessage: 'กรุณากรอก GitHub URL' };
  }

  const trimmed = input.trim();

  // TODO 4.2: ตรวจสอบความปลอดภัยเบื้องต้น (XSS / Suspicious Input Guard)
  const containsXss = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi.test(trimmed) || 
                      /javascript:/gi.test(trimmed) ||
                      /<[^>]+>/g.test(trimmed);

  if (containsXss) {
    return { isValid: false, errorMessage: 'URL ต้องมาจาก github.com เท่านั้น' };
  }

  // TODO 4.3: ตรวจสอบโดเมน (Domain Verification) - ต้องมี github.com
  if (!trimmed.includes('github.com')) {
    return { isValid: false, errorMessage: 'URL ต้องมาจาก github.com เท่านั้น' };
  }

  // TODO 4.4: เมื่อผ่านการตรวจสอบทั้งหมด ให้ส่ง isValid: true
  return { isValid: true, errorMessage: null };
}

/**
 * ฟังก์ชันคำนวณและจัดรูปแบบตัวเลขสถิติสำหรับนำไปแสดงบนหน้าจอ Dashboard
 */
export function formatRepoStats(totalFiles: number, filteredFiles: number): {
  rawCount: number;
  analyzedCount: number;
  ignoredCount: number;
  summaryText: string;
} {
  // TODO 4.5: ป้องกันข้อผิดพลาดทางตัวเลข (Math Safety)
  const rawCount = Math.max(0, totalFiles);
  const analyzedCount = Math.max(0, filteredFiles);
  const ignoredCount = Math.max(0, rawCount - analyzedCount);

  // TODO 4.6: สร้างข้อความสรุปผล (Summary Text Construction)
  const dropPercentage = rawCount > 0 ? Math.round((ignoredCount / rawCount) * 100) : 0;
  const summaryText = `วิเคราะห์โค้ดทั้งหมด ${analyzedCount} ไฟล์ จากทั้งหมด ${rawCount} ไฟล์ (ละเว้น ${ignoredCount} ไฟล์ คิดเป็น ${dropPercentage}%)`;

  // TODO 4.7: ส่งคืนค่าในรูปแบบ Object { rawCount, analyzedCount, ignoredCount, summaryText }
  return {
    rawCount,
    analyzedCount,
    ignoredCount,
    summaryText,
  };
}

/**
 * ฟังก์ชันคำนวณคะแนนสุขภาพสถาปัตยกรรม (Architecture Health Score)
 * ประเมินจากความหนาแน่นของการเชื่อมโยงโค้ด (Coupling Ratio = totalRelations / filteredFiles)
 * - Ratio ระหว่าง 0.8 ถึง 2.5 -> เกรด A (โครงสร้างแยกส่วนกำลังพอดี ไม่ซับซ้อนเกินไป)
 * - Ratio ระหว่าง 2.5 ถึง 4.0 -> เกรด B (เริ่มมีความผูกพันกันค่อนข้างแน่น)
 * - Ratio มากกว่า 4.0 หรือน้อยกว่า 0.8 -> เกรด C (โค้ดผูกกันแน่นเกินไป หรือแทบไม่มีการแยกส่วนคอมโพเนนต์)
 * - ถ้า filteredFiles เป็น 0 -> เกรด N/A
 */
export function calculateHealthScore(totalRelations: number, filteredFiles: number): {
  grade: 'A' | 'B' | 'C' | 'N/A';
  ratio: number;
  description: string;
} {
  // TODO 4.8: คำนวณ ratio และตัดเกรด A, B, C ตามข้อกำหนด
  if (filteredFiles <= 0) {
    return {
      grade: 'N/A',
      ratio: 0,
      description: 'ไม่พบไฟล์ที่วิเคราะห์ได้ หรือไม่มีข้อมูลไฟล์',
    };
  }

  const validRelations = Math.max(0, totalRelations);
  const ratio = Number((validRelations / filteredFiles).toFixed(2));

  if (ratio >= 0.8 && ratio <= 2.5) {
    return {
      grade: 'A',
      ratio,
      description: 'โครงสร้างแยกส่วนกำลังพอดี ไม่ซับซ้อนเกินไป (Balanced Coupling)',
    };
  }

  if (ratio > 2.5 && ratio <= 4.0) {
    return {
      grade: 'B',
      ratio,
      description: 'เริ่มมีความผูกพันกันค่อนข้างแน่น (High Coupling)',
    };
  }

  return {
    grade: 'C',
    ratio,
    description: ratio < 0.8 
      ? 'แทบไม่มีการแยกส่วนคอมโพเนนต์ หรือการเชื่อมโยงต่ำเกินไป' 
      : 'โค้ดผูกติดกันแน่นเกินไป แก้ไขหรือดูแลรักษาได้ยาก (Tight Coupling)',
  };
}

/**
 * ฟังก์ชันเข้ารหัส State ของหน้าจอเพื่อสร้าง URL ที่สามารถแชร์ให้เพื่อนเปิดดูได้ทันที
 */
export function encodeShareableState(url: string, activeNode?: string): string {
  // TODO 4.9: แปลง Object { url, activeNode } ให้เป็น Base64 string ที่ปลอดภัยสำหรับ URL query string
  try {
    const payload = { url, activeNode: activeNode || null };
    const jsonString = JSON.stringify(payload);
    
    if (typeof window !== 'undefined') {
      return btoa(encodeURIComponent(jsonString));
    }
    return Buffer.from(jsonString).toString('base64');
  } catch {
    return '';
  }
}

/**
 * ฟังก์ชันถอดรหัส State จาก URL query string เมื่อเพื่อนกดเปิดลิงก์แชร์
 */
export function decodeShareableState(encodedStr: string): { url: string; activeNode?: string } | null {
  // TODO 4.10: ถอดรหัส Base64 string และแปลงกลับเป็น Object { url, activeNode }
  if (!encodedStr) return null;

  try {
    let jsonString = '';
    if (typeof window !== 'undefined') {
      jsonString = decodeURIComponent(atob(encodedStr));
    } else {
      jsonString = Buffer.from(encodedStr, 'base64').toString('utf-8');
    }

    const parsed = JSON.parse(jsonString);
    if (parsed && typeof parsed.url === 'string') {
      return {
        url: parsed.url,
        activeNode: parsed.activeNode || undefined,
      };
    }
    return null;
  } catch {
    return null;
  }
}