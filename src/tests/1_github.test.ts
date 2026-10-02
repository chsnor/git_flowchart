// src/tests/1_github.test.ts
import { describe, it, expect } from 'vitest';
import { parseGitHubUrl, buildGitHubApiUrl, buildGitHubHeaders, buildGitHubRawUrl } from '../lib/github';

describe('คนที่ 1: github.ts (Data Ingestion & GitHub Service)', () => {
  describe('parseGitHubUrl', () => {
    it('แกะ url แบบ https ปกติได้', () => {
      expect(parseGitHubUrl('https://github.com/chsnor/testauth')).toEqual({
        owner: 'chsnor',
        repo: 'testauth'
      });
    });

    it('แกะ url แบบ http ได้', () => {
      expect(parseGitHubUrl('http://github.com/chsnor/testauth')).toEqual({
        owner: 'chsnor',
        repo: 'testauth'
      });
    });

    it('แกะ url ที่ไม่มี https นำหน้าได้', () => {
      expect(parseGitHubUrl('github.com/chsnor/testauth')).toEqual({
        owner: 'chsnor',
        repo: 'testauth'
      });
    });

    it('แกะ url ที่มี www ได้', () => {
      expect(parseGitHubUrl('https://www.github.com/chsnor/testauth')).toEqual({
        owner: 'chsnor',
        repo: 'testauth'
      });
    });

    it('ตัด .git ท้าย url ออกได้', () => {
      expect(parseGitHubUrl('https://github.com/chsnor/testauth.git')).toEqual({
        owner: 'chsnor',
        repo: 'testauth'
      });
    });

    it('ตัด slash ท้าย url หลายตัวได้', () => {
      expect(parseGitHubUrl('https://github.com/chsnor/testauth///')).toEqual({
        owner: 'chsnor',
        repo: 'testauth'
      });
    });

    it('ตัด query string กับ hash ออกได้', () => {
      expect(parseGitHubUrl('https://github.com/chsnor/testauth?tab=repositories#readme')).toEqual({
        owner: 'chsnor',
        repo: 'testauth'
      });
    });

    it('ตัด path ข้างหลัง เช่น /tree/main ออกได้', () => {
      expect(parseGitHubUrl('https://github.com/chsnor/testauth/tree/main/src')).toEqual({
        owner: 'chsnor',
        repo: 'testauth'
      });
    });

    it('ถ้าใส่ค่าว่างต้องได้ null', () => {
      expect(parseGitHubUrl('')).toBeNull();
      expect(parseGitHubUrl('    ')).toBeNull();
    });

    it('ถ้าไม่ใช่เว็บ github ต้องได้ null', () => {
      expect(parseGitHubUrl('https://gitlab.com/chsnor/testauth')).toBeNull();
      expect(parseGitHubUrl('https://google.com')).toBeNull();
    });

    it('ถ้าไม่มีชื่อ repo ต้องได้ null', () => {
      expect(parseGitHubUrl('https://github.com/chsnor')).toBeNull();
      expect(parseGitHubUrl('https://github.com/chsnor/')).toBeNull();
    });
  });

  describe('buildGitHubApiUrl', () => {
    it('ต่อ url ดึง tree เป็น main ตามปกติ', () => {
      expect(buildGitHubApiUrl('chsnor', 'testauth')).toBe(
        'https://api.github.com/repos/chsnor/testauth/git/trees/main?recursive=1'
      );
    });

    it('ต่อ url ดึง branch อื่นได้', () => {
      expect(buildGitHubApiUrl('chsnor', 'testauth', 'master')).toBe(
        'https://api.github.com/repos/chsnor/testauth/git/trees/master?recursive=1'
      );
    });
  });

  describe('buildGitHubHeaders (รองรับ Token ทางเลือก)', () => {
    it('ถ้าไม่ใส่ token มา ต้องมี header User-Agent ขั้นต่ำ', () => {
      const headers = buildGitHubHeaders();
      expect(headers['User-Agent']).toBe('GitFlow-Visualizer');
      expect(headers['Authorization']).toBeUndefined();
    });

    it('ถ้าใส่ token ว่างเปล่ามา ต้องไม่มี Authorization', () => {
      const headers = buildGitHubHeaders('   ');
      expect(headers['Authorization']).toBeUndefined();
    });

    it('ถ้าใส่ token มา ต้องแนบ Bearer Token ใน Authorization header ถูกต้อง', () => {
      const headers = buildGitHubHeaders('ghp_myfaketoken12345');
      expect(headers['User-Agent']).toBe('GitFlow-Visualizer');
      expect(headers['Authorization']).toBe('Bearer ghp_myfaketoken12345');
    });

    it('ถ้า token มีเว้นวรรคหัวท้าย ต้องตัด trim ให้อัตโนมัติ', () => {
      const headers = buildGitHubHeaders('  ghp_myfaketoken12345  ');
      expect(headers['Authorization']).toBe('Bearer ghp_myfaketoken12345');
    });
  });

  describe('buildGitHubRawUrl (ดึงโค้ดจริงสำหรับ Side Inspector)', () => {
    it('สร้าง URL ดึง raw code จาก GitHub ได้ถูกต้อง', () => {
      const url = buildGitHubRawUrl('chsnor', 'testauth', 'src/app/page.tsx', 'main');
      expect(url).toBe('https://raw.githubusercontent.com/chsnor/testauth/main/src/app/page.tsx');
    });

    it('ใช้ branch เริ่มต้นเป็น main หากไม่ระบุ branch', () => {
      const url = buildGitHubRawUrl('chsnor', 'testauth', 'src/actions/auth.ts');
      expect(url).toBe('https://raw.githubusercontent.com/chsnor/testauth/main/src/actions/auth.ts');
    });
  });
});
