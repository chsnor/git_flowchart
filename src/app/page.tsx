'use client';

export default function HomePage() {
  // TODO 4.8: ทำ state สำหรับรับค่า url, token (ทางเลือกเสริม), loading, error, resultData
  // TODO 4.9: ทำฟังก์ชัน handleSubmit ยิงเรียก api /api/analyze พร้อมส่ง url และ token (ถ้ามี) ไปด้วย

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* TODO 4.10: ทำส่วนหัวหน้าเว็บ */}
        <header className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-blue-400">
            GitFlow Visualizer
          </h1>
          <p className="text-slate-400">
            แปลงโครงสร้างโค้ดและโฟลเดอร์จาก GitHub ให้เป็น Interactive Diagram
          </p>
        </header>

        {/* TODO 4.11: ทำกล่องค้นหา input, ช่องใส่ GitHub Token ทางเลือก (Optional), กับปุ่มกด Analyze */}
        <section className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <p className="text-slate-500 text-center text-sm">
            [พื้นที่สำหรับวาง input URL, ช่อง Token ทางเลือก, และปุ่มกด]
          </p>
        </section>

        {/* TODO 4.12: ทำพื้นที่แสดงผล แบ่งฝั่งซ้าย (สถิติ + เกรดสุขภาพโค้ด) ฝั่งขวา (รูปกราฟไดอะแกรม + ปุ่ม Copy/Export) */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* ฝั่งซ้าย: สถิติจำนวนไฟล์ และการ์ดแสดงเกรด Architecture Health (A/B/C) จาก calculateHealthScore */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center text-slate-500 text-sm">
            [ฝั่งซ้าย: กล่องสถิติ และเกรดสุขภาพโค้ด A/B/C]
          </div>
          
          {/* ฝั่งขวา: แสดงกราฟจาก Mermaid พร้อมปุ่ม Copy Mermaid Syntax และปุ่ม Export SVG */}
          <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 text-center text-slate-500 text-sm min-h-[300px] flex flex-col items-center justify-center space-y-4">
            <p>[ฝั่งขวา: แสดงกราฟจาก Mermaid (แยกสีกล่องตามโฟลเดอร์)]</p>
            <p className="text-xs text-slate-600">[TODO: ปุ่ม Copy Mermaid Syntax และ ปุ่ม Export SVG]</p>
          </div>
        </section>

      </div>
    </main>
  );
}
