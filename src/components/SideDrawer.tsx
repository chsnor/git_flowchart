'use client';

import React, { useState, useMemo } from 'react';
import { getLanguageFromPath, formatCodeSnippet, highlightCodeWithPrism } from '@/lib/code-viewer';

export interface SideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filePath?: string;
  fileType?: string;
  rawCode?: string;
  githubRawUrl?: string;
}

export default function SideDrawer({
  isOpen,
  onClose,
  filePath = '',
  fileType = 'other',
  rawCode = '',
  githubRawUrl = '',
}: SideDrawerProps) {
  const [copied, setCopied] = useState(false);

  const { formattedCode, totalLines, isTruncated, language, highlightedHtml } = useMemo(() => {
    const lang = getLanguageFromPath(filePath);
    const snippet = formatCodeSnippet(rawCode, 300);
    return {
      formattedCode: snippet.code,
      totalLines: snippet.totalLines,
      isTruncated: snippet.isTruncated,
      language: lang,
      highlightedHtml: highlightCodeWithPrism(snippet.code, lang),
    };
  }, [filePath, rawCode]);

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
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Code Inspector Drawer"
      className="fixed inset-y-0 right-0 z-50 flex w-full max-w-2xl flex-col bg-slate-900 border-l border-slate-700 text-slate-100 shadow-2xl"
    >
      <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
        <div className="flex flex-col gap-1 overflow-hidden">
          <div className="flex items-center gap-2">
            <span data-testid="file-type-badge" className="rounded px-2 py-0.5 text-xs font-semibold uppercase bg-sky-500/20 text-sky-400 border border-sky-500/30">
              {fileType}
            </span>
            <span className="text-xs text-slate-400">({language})</span>
          </div>
          <h2 title={filePath} className="truncate text-sm font-mono text-slate-200">
            {filePath || 'No file selected'}
          </h2>
        </div>
        <button onClick={onClose} aria-label="Close drawer" className="p-2 text-slate-400 hover:text-white">✕</button>
      </div>

      <div className="flex items-center justify-between border-b border-slate-800/80 bg-slate-950/40 px-6 py-2 text-xs text-slate-400">
        <div>
          <span>{totalLines} lines</span>
          {isTruncated && <span className="ml-2 text-amber-400">(Truncated to first 300 lines)</span>}
        </div>
        <div className="flex items-center gap-2">
          {githubRawUrl && (
            <a href={githubRawUrl} target="_blank" rel="noopener noreferrer" className="rounded bg-slate-800 px-2.5 py-1 text-slate-300">
              Open on GitHub ↗
            </a>
          )}
          <button onClick={handleCopy} className="rounded bg-slate-800 px-2.5 py-1 text-slate-300">
            {copied ? '✓ Copied' : 'Copy Code'}
          </button>
        </div>
      </div>

      <div className="relative flex-1 overflow-auto p-6 font-mono text-sm bg-slate-950">
        <pre className="m-0 overflow-x-auto">
          <code className={`language-${language}`} dangerouslySetInnerHTML={{ __html: highlightedHtml || formattedCode }} />
        </pre>
      </div>
    </div>
  );
}