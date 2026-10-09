import { describe, it, expect } from 'vitest';
import {
  getLanguageFromPath,
  formatCodeSnippet,
  highlightCodeWithPrism,
} from '../src/lib/code-viewer';

describe('Code Viewer (src/lib/code-viewer.ts)', () => {
  describe('getLanguageFromPath', () => {
    it('ระบุภาษาของไฟล์ตามนามสกุลได้ถูกต้อง', () => {
      expect(getLanguageFromPath('src/app/page.tsx')).toBe('tsx');
      expect(getLanguageFromPath('src/utils.ts')).toBe('typescript');
      expect(getLanguageFromPath('src/index.js')).toBe('javascript');
      expect(getLanguageFromPath('package.json')).toBe('json');
      expect(getLanguageFromPath('styles.css')).toBe('css');
      expect(getLanguageFromPath('unknown.xyz')).toBe('clike');
    });
  });

  describe('formatCodeSnippet', () => {
    it('ตัดทอนโค้ดเมื่อมีจำนวนบรรทัดเกินขีดจำกัด', () => {
      const longCode = Array.from({ length: 400 }, (_, i) => `line ${i + 1}`).join('\n');
      const result = formatCodeSnippet(longCode, 300);

      expect(result.totalLines).toBe(400);
      expect(result.isTruncated).toBe(true);
      expect(result.displayedLines).toBe(300);
      expect(result.code.split('\n').length).toBe(300);
    });

    it('ไม่ตัดทอนโค้ดเมื่อความยาวไม่เกินขีดจำกัด', () => {
      const shortCode = 'const a = 1;\nconst b = 2;';
      const result = formatCodeSnippet(shortCode, 300);

      expect(result.totalLines).toBe(2);
      expect(result.isTruncated).toBe(false);
      expect(result.displayedLines).toBe(2);
    });
  });

  describe('highlightCodeWithPrism', () => {
    it('แปลงซอร์สโค้ดเป็น HTML ที่มี syntax token span', () => {
      const code = 'const hello = "world";';
      const html = highlightCodeWithPrism(code, 'typescript');
      expect(html).toContain('token');
      expect(html).toContain('hello');
    });

    it('แปลงอักขระพิเศษเพื่อป้องกัน XSS เมื่อภาษาไม่รองรับ', () => {
      const unsafeCode = '<script>alert("xss")</script>';
      const html = highlightCodeWithPrism(unsafeCode, 'nonexistent-lang');
      expect(html).toContain('&lt;script&gt;');
      expect(html).not.toContain('<script>');
    });
  });
});

