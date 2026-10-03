// src/app/api/analyze/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { runAnalysisPipeline } from '@/lib/pipeline';

/**
 * API Route สำหรับการวิเคราะห์โครงสร้างคลังโค้ด (คนที่ 6 รับผิดชอบ)
 * ทำหน้าที่เป็น Endpoint หลังบ้านรับคำขอจากหน้าเว็บ (คนที่ 4) เพื่อส่งเข้าสู่ Pipeline
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  // =========================================================================
  // พื้นที่ทำงานของ คนที่ 6: API Route Handler
  // =========================================================================

  // TODO 6.12: ครอบด้วย try-catch เพื่อป้องกันไม่ให้ API Server แครชเมื่อมี Error
  // TODO 6.13: แกะข้อมูล JSON จาก request body ด้วย await req.json() เพื่อดึง url และ token
  // TODO 6.14: ตรวจสอบว่ามี url ส่งมาหรือไม่ หากไม่มี ให้ส่งคืน NextResponse.json({ error: '...' }, { status: 400 })
  // TODO 6.15: เรียกใช้งาน runAnalysisPipeline(url, token)
  // TODO 6.16: ส่งคืนข้อมูลผลลัพธ์ด้วย NextResponse.json(result, { status: 200 })
  // TODO 6.17: ในบล็อก catch ให้ส่งคืนข้อความ error พร้อม status 500

  throw new Error('ยังไม่ได้เขียน API Handler ใน src/app/api/analyze/route.ts');
}
