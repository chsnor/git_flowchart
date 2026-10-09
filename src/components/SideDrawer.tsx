'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { X, ExternalLink, Copy, Check, Loader2 } from 'lucide-react';
import { getLanguageFromPath, formatCodeSnippet, highlightCodeWithPrism } from '@/lib/code-viewer';
import 'prismjs/themes/prism-tomorrow.css';

export interface SideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filePath?: string;
  fileType?: string;
  rawCode?: string;
  githubRawUrl?: string;
  isLoading?: boolean;
}

export function SideDrawer({
  isOpen,
  onClose,
  filePath = '',
  fileType = 'other',
  rawCode = '',
  githubRawUrl = '',
  isLoading = false,
}: SideDrawerProps) {
  const [copied, setCopied] = useState(false);
  const [fullCodeFilePath, setFullCodeFilePath] = useState<string | null>(null);
  const showFullCode = Boolean(filePath && fullCodeFilePath === filePath);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const { formattedCode, totalLines, isTruncated, language, highlightedHtml } = useMemo(() => {
    const lang = getLanguageFromPath(filePath);
    const lineLimit = showFullCode ? 20000 : 300;
    const snippet = formatCodeSnippet(rawCode, lineLimit);
    return {
      formattedCode: snippet.code,
      totalLines: snippet.totalLines,
      isTruncated: !showFullCode && snippet.isTruncated,
      language: lang,
      highlightedHtml: highlightCodeWithPrism(snippet.code, lang),
    };
  }, [filePath, rawCode, showFullCode]);

  const handleCopy = async () => {
    if (!rawCode) return;
    try {
      await navigator.clipboard.writeText(rawCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">

      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity cursor-pointer"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Code Inspector Drawer"
        className="relative z-10 flex w-full max-w-2xl flex-col bg-[#000000] border-l border-[#262626] text-[#ededed] shadow-2xl animate-in slide-in-from-right duration-150"
      >

        <div className="flex items-center justify-between border-b border-[#262626] px-6 py-4 bg-[#0a0a0a]">
          <div className="flex flex-col gap-1 overflow-hidden">
            <div className="flex items-center gap-2">
              <span data-testid="file-type-badge" className="rounded px-2 py-0.5 text-xs font-mono font-semibold uppercase bg-white text-black">
                {fileType}
              </span>
              <span className="text-xs text-zinc-400 font-mono">({language})</span>
            </div>
            <h2 title={filePath} className="truncate text-sm font-mono text-zinc-200">
              {filePath || 'ไม่ได้เลือกไฟล์'}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close drawer"
            className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-[#171717] transition-colors cursor-pointer"
            title="ปิดหน้าต่าง (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center justify-between border-b border-[#262626] bg-[#000000] px-6 py-2.5 text-xs text-zinc-400 font-mono">
          <div className="flex items-center gap-2">
            <span>{totalLines} บรรทัด</span>
            {isTruncated && (
              <span className="text-amber-400 font-mono text-[11px]">(แสดง 300 บรรทัดแรก)</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isTruncated && (
              <button
                type="button"
                onClick={() => setFullCodeFilePath(filePath || null)}
                className="rounded bg-[#171717] hover:bg-[#262626] px-2.5 py-1 text-white text-xs transition-colors cursor-pointer border border-[#262626]"
              >
                ดูโค้ดทั้งหมด
              </button>
            )}
            {githubRawUrl && (
              <a
                href={githubRawUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded bg-[#171717] hover:bg-[#262626] px-2.5 py-1 text-zinc-300 transition-colors cursor-pointer border border-[#262626]"
              >
                <span>เปิดบน GitHub</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
            <button
              onClick={handleCopy}
              disabled={isLoading || !rawCode}
              className="flex items-center gap-1.5 rounded bg-[#171717] hover:bg-[#262626] disabled:opacity-50 px-2.5 py-1 text-zinc-300 transition-colors cursor-pointer border border-[#262626]"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">คัดลอกแล้ว</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>คัดลอกโค้ด</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="relative flex-1 overflow-auto p-6 font-mono text-sm bg-[#000000]">
          {isLoading ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-sky-400" />
              <span className="text-xs">กำลังโหลดซอร์สโค้ดจาก GitHub...</span>
            </div>
          ) : rawCode ? (
            <pre className={`language-${language} m-0 overflow-x-auto !bg-transparent !p-0`}>
              <code className={`language-${language} !bg-transparent font-mono`} dangerouslySetInnerHTML={{ __html: highlightedHtml || formattedCode }} />
            </pre>
          ) : (
            <div className="flex h-full items-center justify-center text-slate-500 text-xs">
              ไม่พบเนื้อหาโค้ดในไฟล์นี้
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
