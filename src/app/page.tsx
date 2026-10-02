'use client';

import React from 'react';
import { AnalysisResult, NextFileType, SideDrawerState } from '../types';
import { FlowCanvas } from '../components/FlowCanvas';
import { SideDrawer } from '../components/SideDrawer';

export default function HomePage() {
  // =========================================================================
  // พื้นที่ทำงานของ คนที่ 4: Dashboard & State Orchestrator
  // =========================================================================
  
  // TODO 4.11: สร้าง State สำหรับจัดการหน้าจอ
  // - url: string (เก็บค่าที่พิมพ์ในช่องค้นหา)
  // - token: string (เก็บ GitHub PAT ทางเลือก)
  // - loading: boolean (สถานะกำลังประมวลผล)
  // - errorMessage: string | null (ข้อความเตือนเมื่อมีข้อผิดพลาด)
  // - result: AnalysisResult | null (ข้อมูลผลลัพธ์จากการวิเคราะห์)
  // - drawerState: SideDrawerState (สถานะการเปิด/ปิด Drawer และไฟล์ที่เลือก)
  // - shareCopied: boolean (สถานะการแจ้งเตือนเมื่อคัดลอกลิงก์แชร์)

  // TODO 4.12: เขียนฟังก์ชัน handleSubmit(e: React.FormEvent)
  // 1. เรียก validateUrlInput(url) จาก lib/ui-helper
  // 2. ถ้าไม่ถูกต้อง ให้ตั้ง errorMessage แล้วหยุดทำงาน
  // 3. ยิง POST ไปที่ /api/analyze พร้อมแนบ { url, token }
  // 4. เมื่อได้ผลลัพธ์ นำมาบันทึกใน State result

  // TODO 4.13: เขียนฟังก์ชัน handleSelectNode(filePath: string, fileType: NextFileType)
  // 1. สร้าง raw URL ด้วย buildGitHubRawUrl(owner, repo, filePath) จาก lib/github
  // 2. อัปเดต drawerState ให้ isOpen: true และเริ่มดึงเนื้อหาไฟล์มาแสดง

  // TODO 4.14: เขียนฟังก์ชัน handleShare()
  // 1. เรียก encodeShareableState(url, activeFilePath) จาก lib/ui-helper
  // 2. สร้าง query string ?state=... แล้วคัดลอกลง Clipboard ด้วย navigator.clipboard.writeText

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs font-medium">
            Next.js App Router Architecture Analyzer
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white">
            Git<span className="text-blue-500">Flow</span> Visualizer
          </h1>
          <p className="text-slate-400 text-sm md:text-base max-w-2xl mx-auto">
            แปลงโครงสร้างโค้ดและโฟลเดอร์จาก GitHub ให้เป็น Interactive Flowchart สแกน Event และ Server Actions
          </p>
        </header>

        {/* Search & Token Section (Wireframe) */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="border border-dashed border-slate-700 rounded-xl p-6 text-center text-slate-400 text-sm space-y-2">
            <p className="font-semibold text-slate-300">
              [พื้นที่ทำงาน คนที่ 4: ฟอร์มค้นหาและช่อง Token ทางเลือก]
            </p>
            <p className="text-xs text-slate-500">
              TODO 4.15: ใส่ input สำหรับรับ URL, input รหัส Token ทางเลือก และปุ่ม Submit พร้อมผูก event กับ handleSubmit
            </p>
          </div>
        </section>

        {/* Dashboard & Canvas Container (Wireframe) */}
        <section className="space-y-6">
          <div className="border border-dashed border-slate-800 rounded-2xl p-8 text-center text-slate-500 space-y-4 min-h-[450px] flex flex-col items-center justify-center bg-slate-900/40">
            <p className="text-base font-medium text-slate-300">
              [พื้นที่ทำงาน คนที่ 4 & คนที่ 3: แถบสถิติ, ปุ่มแชร์ และผืนผ้าใบ React Flow]
            </p>
            <p className="text-xs max-w-lg leading-relaxed text-slate-400">
              - คนที่ 4: ทำการ์ดแสดงสถิติไฟล์, คำนวณเกรดสุขภาพโค้ดด้วย calculateHealthScore, และปุ่มแชร์สถานะ<br/>
              - คนที่ 3: นำคอมโพเนนต์ FlowCanvas มาวางเชื่อมต่อกับ result.nodes และ result.edges
            </p>
          </div>
        </section>

        {/* Side Inspector Drawer (Wireframe placeholder) */}
        {/* TODO 4.16: นำคอมโพเนนต์ SideDrawer (คนที่ 5) มาวาง และผูกค่ากับ drawerState */}

      </div>
    </main>
  );
}
