// src/tests/5_side_drawer.test.ts
import { describe, it, expect } from 'vitest';
import { getLanguageFromPath, formatCodeSnippet, highlightCodeWithPrism } from '../lib/code-viewer';

describe('คนที่ 5: code-viewer.ts (Side Inspector & PrismJS Code Viewer)', () => {
  describe('getLanguageFromPath', () => {
    it('ระบุภาษา tsx สำหรับไฟล์คอมโพเนนต์ React TSX ได้', () => {
      expect(getLanguageFromPath('src/components/Header.tsx')).toBe('tsx');
    });

    it('ระบุภาษา typescript สำหรับไฟล์ .ts ทั่วไปได้', () => {
      expect(getLanguageFromPath('src/lib/auth.ts')).toBe('typescript');
    });

    it('ระบุภาษา javascript สำหรับไฟล์ .js ได้', () => {
      expect(getLanguageFromPath('server.js')).toBe('javascript');
    });

    it('ระบุภาษา json สำหรับไฟล์คอนฟิกได้', () => {
      expect(getLanguageFromPath('package.json')).toBe('json');
    });

    it('ถ้าไม่ทราบนามสกุล ให้ fallback เป็น clike หรือ markup', () => {
      const lang = getLanguageFromPath('Dockerfile');
      expect(['clike', 'markup', 'text', 'none']).toContain(lang);
    });
  });

  describe('formatCodeSnippet (การตัดทอนโค้ดไฟล์ใหญ่)', () => {
    it('นับจำนวนบรรทัดของโค้ดสั้นได้ถูกต้อง และไม่ขึ้นสถานะ isTruncated', () => {
      const code = "console.log('line 1');\nconsole.log('line 2');\nconsole.log('line 3');";
      const result = formatCodeSnippet(code, 10);
      expect(result.totalLines).toBe(3);
      expect(result.isTruncated).toBe(false);
      expect(result.snippet).toBe(code);
    });

    it('ถ้าบรรทัดเกิน maxLines ให้ตัดทอนเฉพาะส่วนแรก และขึ้น isTruncated เป็น true', () => {
      const lines = Array.from({ length: 50 }, (_, i) => `line ${i + 1}`).join('\n');
      const result = formatCodeSnippet(lines, 20);
      expect(result.totalLines).toBe(50);
      expect(result.isTruncated).toBe(true);
      expect(result.snippet.split('\n')).toHaveLength(20);
    });
  });

  describe('highlightCodeWithPrism (แปลงโค้ดเป็น HTML ที่มีสี)', () => {
    it('สามารถแปลงโค้ด TypeScript เป็น HTML ที่มีคลาส token ของ Prism ได้', () => {
      const code = `const greeting: string = "Hello World";`;
      const html = highlightCodeWithPrism(code, 'typescript');
      expect(html).toContain('token');
      expect(html).toContain('const');
    });

    it('ถ้าส่งภาษาที่ไม่รองรับมา ต้องไม่ crash และส่งคืนข้อความที่ escape ปลอดภัย', () => {
      const code = `<div>test</div>`;
      const html = highlightCodeWithPrism(code, 'unknown_language');
      expect(typeof html).toBe('string');
      expect(html).toContain('test');
    });
  });
});
