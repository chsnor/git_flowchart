// src/app/api/analyze/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { runAnalysisPipeline } from '@/lib/pipeline';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, token } = body;

    if (!url) {
      return NextResponse.json({ error: 'กรุณาระบุ URL ของ GitHub' }, { status: 400 });
    }

    const result = await runAnalysisPipeline(url, token);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: error.message || 'เกิดข้อผิดพลาดในการประมวลผล' },
      { status: 500 }
    );
  }
}
