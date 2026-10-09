import { NextRequest, NextResponse } from "next/server";
import { runAnalysisPipeline } from "../../../lib/pipeline";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const { url, token } = body;

    if (!url) {
      return NextResponse.json(
        { error: "กรุณาระบุ URL ของ GitHub Repository" },
        { status: 400 },
      );
    }

    const result = await runAnalysisPipeline(url, token);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการประมวลผล";

    let status = 500;
    if (errorMessage.includes('401') || errorMessage.includes('Token ไม่ถูกต้อง')) {
      status = 401;
    } else if (errorMessage.includes('404') || errorMessage.includes('ไม่พบคลังโค้ด')) {
      status = 404;
    } else if (errorMessage.includes('403') || errorMessage.includes('Rate Limit')) {
      status = 403;
    } else if (errorMessage.includes('URL ต้องมาจาก') || errorMessage.includes('กรุณาระบุ')) {
      status = 400;
    }

    return NextResponse.json(
      { error: errorMessage },
      { status },
    );
  }
}

