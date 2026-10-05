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
  const lowerInput = trimmed.toLowerCase();

  // TODO 4.2: ตรวจสอบความปลอดภัยเบื้องต้น (XSS / Suspicious Input Guard)
  // ตรวจสอบแบบ string search และการเช็คแท็กพื้นฐานอย่างปลอดภัย
  const containsXss = lowerInput.includes('<script') || 
                      lowerInput.includes('javascript:') || 
                      (lowerInput.includes('<') && lowerInput.includes('>'));

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
  const rawCount = Math.max(0, Number.isFinite(totalFiles) ? totalFiles : 0);
  const analyzedCount = Math.max(0, Number.isFinite(filteredFiles) ? filteredFiles : 0);
  const ignoredCount = Math.max(0, rawCount - analyzedCount);

  // TODO 4.6: สร้างข้อความสรุปผล (Summary Text Construction)
  const dropPercentage = rawCount > 0 ? Math.round((ignoredCount / rawCount) * 100) : 0;
  const summaryText = `วิเคราะห์โค้ดทั้งหมด ${analyzedCount} ไฟล์ จากทั้งหมด ${rawCount} ไฟล์ (ละเว้น ${ignoredCount} ไฟล์ คิดเป็น ${dropPercentage}%)`;

  // TODO 4.7: ส่งคืนค่าในรูปแบบ Object
  return {
    rawCount,
    analyzedCount,
    ignoredCount,
    summaryText,
  };
}

/**
 * ฟังก์ชันคำนวณคะแนนสุขภาพสถาปัตยกรรม (Architecture Health Score)
 */
export function calculateHealthScore(totalRelations: number, filteredFiles: number): {
  grade: 'A' | 'B' | 'C' | 'N/A';
  ratio: number;
  description: string;
} {
  if (!filteredFiles || filteredFiles <= 0) {
    return {
      grade: 'N/A',
      ratio: 0,
      description: 'ไม่พบไฟล์ที่วิเคราะห์ได้ หรือไม่มีข้อมูลไฟล์',
    };
  }

  const validRelations = Math.max(0, Number.isFinite(totalRelations) ? totalRelations : 0);
  const computedRatio = validRelations / filteredFiles;
  const ratio = Math.round(computedRatio * 100) / 100;

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
 * ฟังก์ชันเข้ารหัส State ของหน้าจอเพื่อสร้าง URL ที่สามารถแชร์ได้
 */
export function encodeShareableState(url: string, activeNode?: string): string {
  if (!url) return '';

  try {
    const payload = { url, activeNode: activeNode || null };
    const jsonString = JSON.stringify(payload);
    
    if (typeof window !== 'undefined' && typeof window.btoa === 'function') {
      return window.btoa(encodeURIComponent(jsonString));
    }
    
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(encodeURIComponent(jsonString), 'utf-8').toString('base64');
    }

    return '';
  } catch {
    return '';
  }
}

/**
 * ฟังก์ชันถอดรหัส State จาก URL query string
 */
export function decodeShareableState(encodedStr: string): { url: string; activeNode?: string } | null {
  if (!encodedStr || typeof encodedStr !== 'string') return null;

  try {
    let rawDecoded = '';
    
    if (typeof window !== 'undefined' && typeof window.atob === 'function') {
      rawDecoded = window.atob(encodedStr);
    } else if (typeof Buffer !== 'undefined') {
      rawDecoded = Buffer.from(encodedStr, 'base64').toString('utf-8');
    } else {
      return null;
    }

    let jsonString = rawDecoded;
    try {
      jsonString = decodeURIComponent(rawDecoded);
    } catch {
      // If rawDecoded is already valid JSON without percent-encoding, keep it
    }

    const parsed = JSON.parse(jsonString);
    if (parsed && typeof parsed === 'object' && typeof parsed.url === 'string') {
      return {
        url: parsed.url,
        activeNode: typeof parsed.activeNode === 'string' ? parsed.activeNode : undefined,
      };
    }
    return null;
  } catch {
    return null;
  }
}