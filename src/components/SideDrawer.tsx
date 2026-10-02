'use client';

import React from 'react';
import { NextFileType } from '../types';

export interface SideDrawerProps {
  isOpen: boolean;
  filePath: string | null;
  fileContent: string | null;
  fileType: NextFileType | null;
  githubRawUrl?: string | null;
  onClose: () => void;
}

/**
 * คอมโพเนนต์แถบ Side Inspector ด้านข้าง (คนที่ 5 รับผิดชอบ)
 * จะเลื่อนออกมาจากขอบขวาเมื่อผู้ใช้คลิกเลือก Node ในผืนผ้าใบ React Flow
 */
export function SideDrawer({
  isOpen,
  filePath,
  fileContent,
  fileType,
  githubRawUrl,
  onClose,
}: SideDrawerProps) {
  // =========================================================================
  // พื้นที่ทำงานของ คนที่ 5: Side Inspector & Code Viewer
  // =========================================================================

  // TODO 5.6: จัดการสถานะการคัดลอกโค้ด (Copied State สำหรับแสดง feedback เมื่อผู้ใช้กดปุ่ม)

  // TODO 5.7: นำฟังก์ชันจาก lib/code-viewer.ts มาประมวลผลโค้ด:
  // 1. หาภาษาด้วย getLanguageFromPath(filePath)
  // 2. ตัดทอนและนับบรรทัดด้วย formatCodeSnippet(fileContent)
  // 3. แปลงเป็นข้อความสีด้วย highlightCodeWithPrism(snippet, lang)

  // TODO 5.8: ดึงชุดสีของโหนดด้วย getNodeColorConfig(fileType) จาก lib/generator.ts มาใส่เป็นขอบ Tag

  // TODO 5.9: ทำฟังก์ชันคัดลอกโค้ดลง Clipboard ด้วย navigator.clipboard.writeText

  if (!isOpen || !filePath) return null;

  return (
    <aside
      aria-label="Side Inspector"
      className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col p-6 space-y-4"
    >
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <h2 className="text-sm font-semibold text-slate-200">
          [Side Inspector - พื้นที่ทำงาน คนที่ 5]
        </h2>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 text-xs"
        >
          ✕ ปิด
        </button>
      </div>

      <div className="flex-1 border border-dashed border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center text-center text-slate-500 text-xs space-y-2">
        <p className="text-slate-300 font-mono font-medium">{filePath}</p>
        <p>TODO 5.10: เรนเดอร์กล่องแสดงโค้ดพร้อม Syntax Highlighting จาก PrismJS ตรงนี้</p>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-slate-800">
        <span className="text-xs text-slate-500">
          {githubRawUrl ? 'TODO: ทำปุ่มเปิด GitHub' : ''}
        </span>
        <span className="text-xs text-slate-500">
          TODO: ทำปุ่ม Copy Code
        </span>
      </div>
    </aside>
  );
}
