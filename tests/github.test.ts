import { describe, it, expect } from 'vitest';
import {
  parseGitHubUrl,
  buildGitHubApiUrl,
  buildGitHubHeaders,
  buildGitHubRawUrl,
  buildGitHubBlobUrl,
} from '../src/lib/github';

describe('GitHub Service (src/lib/github.ts)', () => {
  describe('parseGitHubUrl', () => {
    it('แยก owner, repo และ branch จาก URL ได้ถูกต้อง', () => {
      const parsed = parseGitHubUrl('https://github.com/vercel/next.js');
      expect(parsed).toEqual({
        owner: 'vercel',
        repo: 'next.js',
        branch: undefined,
      });
    });

    it('ตัด .git ต่อท้ายออกได้ถูกต้อง', () => {
      const parsed = parseGitHubUrl('https://github.com/facebook/react.git');
      expect(parsed?.repo).toBe('react');
    });

    it('แยก branch ที่มี slash จาก /tree/ ได้ถูกต้อง', () => {
      const parsed = parseGitHubUrl('https://github.com/owner/repo/tree/feature/login');
      expect(parsed?.branch).toBe('feature/login');
    });

    it('คืนค่า null เมื่อ URL ไม่ถูกต้องหรือไม่ได้มาจาก github.com', () => {
      expect(parseGitHubUrl('https://gitlab.com/owner/repo')).toBeNull();
      expect(parseGitHubUrl('invalid-url')).toBeNull();
      expect(parseGitHubUrl('')).toBeNull();
    });
  });

  describe('URL & Header Builders', () => {
    it('สร้าง API URL ได้ถูกต้อง', () => {
      const url = buildGitHubApiUrl('owner', 'repo', 'main');
      expect(url).toBe('https://api.github.com/repos/owner/repo/git/trees/main?recursive=1');
    });

    it('สร้าง Raw content URL ได้ถูกต้อง', () => {
      const url = buildGitHubRawUrl('owner', 'repo', 'src/page.tsx', 'main');
      expect(url).toBe('https://raw.githubusercontent.com/owner/repo/main/src/page.tsx');
    });

    it('สร้าง Blob web URL ได้ถูกต้อง', () => {
      const url = buildGitHubBlobUrl('owner', 'repo', 'src/page.tsx', 'main');
      expect(url).toBe('https://github.com/owner/repo/blob/main/src/page.tsx');
    });

    it('แนบ Authorization header เมื่อมี Token', () => {
      const headersWithToken = buildGitHubHeaders('ghp_test123');
      expect(headersWithToken['Authorization']).toBe('Bearer ghp_test123');

      const headersWithoutToken = buildGitHubHeaders();
      expect(headersWithoutToken['Authorization']).toBeUndefined();
    });
  });
});

