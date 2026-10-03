// src/app/api/analyze/route.ts
import { NextRequest, NextResponse } from "next/server";
import { runAnalysisPipeline } from "../../../lib/pipeline";

/**
 * API Route สำหรับการวิเคราะห์โครงสร้างคลังโค้ด (คนที่ 6 รับผิดชอบ)
 * ทำหน้าที่เป็น Endpoint หลังบ้านรับคำขอจากหน้าเว็บ (คนที่ 4) เพื่อส่งเข้าสู่ Pipeline
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // 6.13: รับ body จากคำขอ
    const body = await req.json();
    const { url, token } = body;

    // 6.14: ตรวจสอบ URL
    if (!url) {
      return NextResponse.json(
        { error: "กรุณาระบุ URL ของ GitHub Repository" },
        { status: 400 },
      );
    }

    // 6.15: เรียก Pipeline รันการวิเคราะห์
    const result = await runAnalysisPipeline(url, token);

    // 6.16: ส่งผลลัพธ์กลับ
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    // 6.17: จัดการ Error
    const errorMessage =
      error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการประมวลผล";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 },
    );
  }
}
