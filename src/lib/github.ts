// src/lib/github.ts
import { ParsedGitHubUrl } from '../types';

/**
 * ฟังก์ชันสำหรับแยกค่า owner และชื่อ repo ออกจาก URL ของ GitHub
 */
export function parseGitHubUrl(url: string): ParsedGitHubUrl | null {
  // TODO 1.1: ตรวจสอบความถูกต้องเบื้องต้น (Input Validation) - ตัดช่องว่าง และเช็คค่าว่าง
  if (!url || typeof url !== 'string') return null;
  const trimmedUrl = url.trim();
  if (!trimmedUrl) return null;

  try {
    // เติม protocol ชั่วคราวกรณีที่ใส่มาแบบไม่มี https:// นำหน้า เพื่อให้ constructor ของ URL ทำงานได้
    let fullUrl = trimmedUrl;
    if (!/^https?:\/\//i.test(fullUrl)) {
      fullUrl = 'https://' + fullUrl;
    }

    const parsed = new URL(fullUrl);

    // TODO 1.2: ตรวจสอบว่าเป็นโดเมน github.com หรือไม่
    if (!parsed.hostname.toLowerCase().endsWith('github.com')) {
      return null;
    }

    // TODO 1.3: ลบส่วนเกินที่ไม่เกี่ยวข้องออก (เช่น .git, query string, hash, /tree/main)
    // ดึง pathname มาแยก segment โดยกรองค่าว่างออก
    const segments = parsed.pathname.split('/').filter(Boolean);

    // TODO 1.4: สกัดค่า owner และ repo ส่งกลับเป็น Object
    if (segments.length < 2) {
      return null;
    }

    const owner = segments[0];
    let repo = segments[1];

    // ตัดนามสกุล .git ท้าย repo ออก (ถ้ามี)
    if (repo.toLowerCase().endsWith('.git')) {
      repo = repo.slice(0, -4);
    }

    if (!owner || !repo) {
      return null;
    }

    return { owner, repo };
  } catch {
    return null;
  }
}

/**
 * ฟังก์ชันสร้าง URL สำหรับเรียก GitHub REST API (Tree API แบบ Recursive)
 */
export function buildGitHubApiUrl(owner: string, repo: string, branch = 'main'): string {
  // TODO 1.5: ประกอบ URL สำหรับเรียก GitHub Tree API ในรูปแบบ https://api.github.com/repos/{owner}/{repo}/git/trees/{branch}?recursive=1
  return `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;
}

/**
 * ฟังก์ชันประกอบ HTTP Headers สำหรับยิงเรียก GitHub API
 * รองรับ Personal Access Token (PAT) เป็นตัวเลือกเสริม
 */
export function buildGitHubHeaders(token?: string): Record<string, string> {
  // TODO 1.6: สร้าง headers พื้นฐานที่มี User-Agent: 'GitFlow-Visualizer'
  const headers: Record<string, string> = {
    'User-Agent': 'GitFlow-Visualizer',
  };

  // TODO 1.7: ถ้ามี token ส่งเข้ามา (และไม่ใช่สตริงว่าง) ให้แนบ Authorization: `Bearer ${token.trim()}`
  if (token && typeof token === 'string') {
    const trimmedToken = token.trim();
    if (trimmedToken.length > 0) {
      headers['Authorization'] = `Bearer ${trimmedToken}`;
    }
  }

  return headers;
}

/**
 * ฟังก์ชันสร้าง URL สำหรับดึง Raw Code ของไฟล์จริงเพื่อใช้ใน Side Inspector
 */
export function buildGitHubRawUrl(owner: string, repo: string, filePath: string, branch = 'main'): string {
  // TODO 1.8: ประกอบ URL ในรูปแบบ https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{filePath}
  return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}`;
}