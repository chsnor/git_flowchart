// src/lib/github.ts
import { ParsedGitHubUrl } from '../types';

/**
 * ฟังก์ชันสำหรับแยกค่า owner และชื่อ repo ออกจาก URL ของ GitHub
 */
export function parseGitHubUrl(url: string): ParsedGitHubUrl | null {
  // TODO 1.1: ตรวจสอบความถูกต้องเบื้องต้น (Input Validation)
  // TODO 1.2: ทำความสะอาดข้อความ URL (Sanitization)
  // TODO 1.3: ลบส่วนเกินที่ไม่เกี่ยวข้องออก (Cleanup)
  // TODO 1.4: สกัดค่า owner และ repo
  throw new Error('ยังไม่ได้เขียนฟังก์ชัน parseGitHubUrl');
}

/**
 * ฟังก์ชันสร้าง URL สำหรับเรียก GitHub REST API (Tree API แบบ Recursive)
 */
export function buildGitHubApiUrl(owner: string, repo: string, branch = 'main'): string {
  // TODO 1.5: ประกอบ URL สำหรับเรียก GitHub Tree API
  throw new Error('ยังไม่ได้เขียนฟังก์ชัน buildGitHubApiUrl');
}

/**
 * ฟังก์ชันประกอบ HTTP Headers สำหรับยิงเรียก GitHub API
 * รองรับ Personal Access Token (PAT) เป็นตัวเลือกเสริม
 */
export function buildGitHubHeaders(token?: string): Record<string, string> {
  // TODO 1.6: สร้าง headers พื้นฐานที่มี User-Agent: 'GitFlow-Visualizer'
  // TODO 1.7: ถ้ามี token ส่งเข้ามา (และไม่ใช่สตริงว่าง) ให้แนบ Authorization: `Bearer ${token.trim()}`
  throw new Error('ยังไม่ได้เขียนฟังก์ชัน buildGitHubHeaders');
}
