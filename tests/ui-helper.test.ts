import { describe, it, expect } from 'vitest';
import {
  validateUrlInput,
  formatRepoStats,
  encodeShareableState,
  decodeShareableState,
} from '../src/lib/ui-helper';

describe('UI Helper (src/lib/ui-helper.ts)', () => {
  describe('validateUrlInput', () => {
    it('คืนค่า isValid = true สำหรับ GitHub URL ที่ถูกต้อง', () => {
      const result = validateUrlInput('https://github.com/chsnor/nextjs101');
      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeNull();
    });

    it('แจ้งเตือนเมื่อไม่ได้กรอก URL หรือ URL ไม่ใช่ github.com', () => {
      expect(validateUrlInput('').isValid).toBe(false);
      expect(validateUrlInput('https://google.com').isValid).toBe(false);
    });
  });

  describe('formatRepoStats', () => {
    it('คำนวณจำนวนไฟล์ที่วิเคราะห์และไฟล์ที่ถูกกรองออกอย่างถูกต้อง', () => {
      const stats = formatRepoStats(100, 25);
      expect(stats.rawCount).toBe(100);
      expect(stats.analyzedCount).toBe(25);
      expect(stats.ignoredCount).toBe(75);
    });

    it('จัดการค่าตัวเลขติดลบหรือค่าที่ไม่ใช่ตัวเลขให้ปลอดภัย', () => {
      const stats = formatRepoStats(NaN, -5);
      expect(stats.rawCount).toBe(0);
      expect(stats.analyzedCount).toBe(0);
      expect(stats.ignoredCount).toBe(0);
    });
  });

  describe('encodeShareableState & decodeShareableState', () => {
    it('เข้ารหัสและถอดรหัส URL query string ได้อย่างถูกต้อง', () => {
      const encoded = encodeShareableState('https://github.com/owner/repo', 'src/app/page.tsx');
      expect(encoded).toContain('url=https%3A%2F%2Fgithub.com%2Fowner%2Frepo');
      expect(encoded).toContain('node=src%2Fapp%2Fpage.tsx');

      const decoded = decodeShareableState(encoded);
      expect(decoded?.url).toBe('https://github.com/owner/repo');
      expect(decoded?.activeNode).toBe('src/app/page.tsx');
    });

    it('รองรับการถอดรหัส Base64 แบบเดิม (Legacy Fallback)', () => {
      const oldState = { url: 'https://github.com/owner/repo', activeNode: 'src/app/layout.tsx' };
      const base64Str = Buffer.from(encodeURIComponent(JSON.stringify(oldState))).toString('base64');

      const decoded = decodeShareableState(base64Str);
      expect(decoded?.url).toBe('https://github.com/owner/repo');
      expect(decoded?.activeNode).toBe('src/app/layout.tsx');
    });
  });
});

