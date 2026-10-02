// src/tests/4_frontend_ui.test.ts
import { describe, it, expect } from 'vitest';
import {
  validateUrlInput,
  formatRepoStats,
  calculateHealthScore,
  encodeShareableState,
  decodeShareableState
} from '../lib/ui-helper';

describe('คนที่ 4: ui-helper.ts (Dashboard & State Orchestrator)', () => {
  describe('validateUrlInput', () => {
    it('ถ้าไม่พิมพ์อะไรเลย หรือเคาะ space มา ให้แจ้งเตือนว่ากรุณากรอก URL', () => {
      expect(validateUrlInput('')).toEqual({ isValid: false, errorMessage: 'กรุณากรอก GitHub URL' });
      expect(validateUrlInput('   ')).toEqual({ isValid: false, errorMessage: 'กรุณากรอก GitHub URL' });
    });

    it('ถ้าไม่ใช่ github ให้เตือนว่าต้องมาจาก github เท่านั้น', () => {
      expect(validateUrlInput('https://gitlab.com/repo')).toEqual({
        isValid: false,
        errorMessage: 'URL ต้องมาจาก github.com เท่านั้น'
      });
    });

    it('ดักจับแท็ก script แปลกๆ ในช่องกรอกได้', () => {
      const check = validateUrlInput('<script>alert("hacked")</script>');
      expect(check.isValid).toBe(false);
      expect(check.errorMessage).toBe('URL ต้องมาจาก github.com เท่านั้น');
    });

    it('ถ้ามี space หน้าหลัง ให้ trim ออกให้อัตโนมัติแล้วผ่านได้', () => {
      const check = validateUrlInput('   https://github.com/chsnor/testauth   ');
      expect(check.isValid).toBe(true);
      expect(check.errorMessage).toBeNull();
    });
  });

  describe('formatRepoStats', () => {
    it('คำนวณจำนวนไฟล์ที่กรองทิ้ง และจัดข้อความสรุปได้ถูกต้อง', () => {
      const stats = formatRepoStats(100, 20);
      expect(stats.rawCount).toBe(100);
      expect(stats.analyzedCount).toBe(20);
      expect(stats.ignoredCount).toBe(80);
      expect(stats.summaryText).toContain('วิเคราะห์โค้ดทั้งหมด 20 ไฟล์');
    });

    it('ถ้าไม่มีไฟล์เลย ต้องไม่บั๊ก ไม่เออเร่อเป็น NaN หรือติดลบ', () => {
      const stats = formatRepoStats(0, 0);
      expect(stats.rawCount).toBe(0);
      expect(stats.analyzedCount).toBe(0);
      expect(stats.ignoredCount).toBe(0);
      expect(stats.summaryText).toContain('0 ไฟล์');
    });

    it('ถ้าไฟล์ที่วิเคราะห์มีมากกว่าไฟล์ดิบ ตัวเลขที่ตัดทิ้งต้องเป็น 0 เสมอ ไม่ติดลบ', () => {
      const stats = formatRepoStats(10, 15);
      expect(stats.ignoredCount).toBe(0);
    });
  });

  describe('calculateHealthScore (ประเมินคะแนนสถาปัตยกรรมโค้ด)', () => {
    it('ถ้า ratio อยู่ระหว่าง 0.8 ถึง 2.5 ต้องได้เกรด A', () => {
      const score = calculateHealthScore(20, 15); // ratio = 1.33
      expect(score.grade).toBe('A');
    });

    it('ถ้า ratio อยู่ระหว่าง 2.5 ถึง 4.0 ต้องได้เกรด B', () => {
      const score = calculateHealthScore(30, 10); // ratio = 3.0
      expect(score.grade).toBe('B');
    });

    it('ถ้า ratio มากกว่า 4.0 หรือน้อยกว่า 0.8 ต้องได้เกรด C', () => {
      const scoreHigh = calculateHealthScore(50, 10); // ratio = 5.0
      expect(scoreHigh.grade).toBe('C');

      const scoreLow = calculateHealthScore(5, 10); // ratio = 0.5
      expect(scoreLow.grade).toBe('C');
    });

    it('ถ้าไม่มีไฟล์โค้ด (0 ไฟล์) ต้องได้เกรด N/A', () => {
      const score = calculateHealthScore(0, 0);
      expect(score.grade).toBe('N/A');
    });
  });

  describe('encodeShareableState และ decodeShareableState (ระบบแชร์สถานะไดอะแกรม)', () => {
    it('เข้ารหัสและถอดรหัส URL State กลับมาได้ถูกต้องครบถ้วน', () => {
      const originalUrl = 'https://github.com/chsnor/testauth';
      const activeNode = 'src/app/page.tsx';

      const encoded = encodeShareableState(originalUrl, activeNode);
      expect(typeof encoded).toBe('string');
      expect(encoded.length).toBeGreaterThan(0);

      const decoded = decodeShareableState(encoded);
      expect(decoded).toEqual({
        url: originalUrl,
        activeNode: activeNode
      });
    });

    it('ถ้าถอดรหัสข้อความที่ผิดรูปแบบ ให้ส่งค่ากลับเป็น null', () => {
      expect(decodeShareableState('invalid-base64-string!!')).toBeNull();
    });
  });
});
