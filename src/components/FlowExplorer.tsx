'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { AnalysisResult, NextFileType, SideDrawerState, FlowNodeItem } from '../types';
import { FlowCanvas } from './FlowCanvas';
import { SideDrawer } from './SideDrawer';
import {
  validateUrlInput,
  formatRepoStats,
  encodeShareableState,
  decodeShareableState
} from '../lib/ui-helper';
import { buildGitHubRawUrl, buildGitHubBlobUrl } from '../lib/github';
import { Share2, Check, Sparkles, AlertCircle, X } from 'lucide-react';

const SAMPLE_REPOSITORIES = [
  { label: 'Next.js 101 Course', url: 'https://github.com/chsnor/nextjs101' },
  { label: 'Next.js Commerce', url: 'https://github.com/vercel/commerce' },
  { label: 'Next.js Subscription', url: 'https://github.com/vercel/nextjs-subscription-payments' },
];

export function FlowExplorer() {
  const [url, setUrl] = useState<string>('');
  const [token, setToken] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [shareCopied, setShareCopied] = useState<boolean>(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [isCodeLoading, setIsCodeLoading] = useState<boolean>(false);

  const [drawerState, setDrawerState] = useState<SideDrawerState>({
    isOpen: false,
    filePath: null,
    fileContent: null,
    fileType: null,
    githubRawUrl: null,
  });

  async function handleSelectNode(
    filePath: string,
    fileType: NextFileType,
    owner = result?.owner,
    repo = result?.repoName,
    branch = result?.branch || 'main'
  ) {
    if (!owner || !repo) {
      setErrorMessage('ไม่พบข้อมูล Repository หรือ Owner สำหรับดึงโค้ด');
      return;
    }

    const rawUrl = buildGitHubRawUrl(owner, repo, filePath, branch);
    const blobUrl = buildGitHubBlobUrl(owner, repo, filePath, branch);

    setDrawerState({
      isOpen: true,
      filePath,
      fileType,
      fileContent: null,
      githubRawUrl: blobUrl,
    });
    setIsCodeLoading(true);

    try {
      const headers: Record<string, string> = {};
      if (token?.trim()) headers['Authorization'] = `Bearer ${token.trim()}`;

      const res = await fetch(rawUrl, { headers });
      if (!res.ok) throw new Error(`ไม่สามารถดึงไฟล์ได้ (HTTP ${res.status})`);
      const code = await res.text();

      setDrawerState((prev) => ({ ...prev, fileContent: code }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการโหลดโค้ด';
      setDrawerState((prev) => ({ ...prev, fileContent: null }));
      setErrorMessage(msg);
    } finally {
      setIsCodeLoading(false);
    }
  }

  const executeAnalysis = async (targetUrl: string, githubToken?: string, activeFilePath?: string | null) => {
    const validation = validateUrlInput(targetUrl);
    if (!validation.isValid) {
      setErrorMessage(validation.errorMessage || 'URL ไม่ถูกต้อง');
      return;
    }

    const cleanUrl = targetUrl.trim();
    setErrorMessage(null);
    setLoading(true);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: cleanUrl, token: githubToken?.trim() || undefined }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'ไม่สามารถวิเคราะห์ข้อมูลจาก GitHub ได้');
      }

      const data: AnalysisResult = await response.json();
      setResult(data);

      if (activeFilePath) {
        void handleSelectNode(activeFilePath, 'other', data.owner, data.repoName, data.branch);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const searchParams = new URLSearchParams(window.location.search);
    const decoded = decodeShareableState(searchParams.get('state') || '');
    const targetUrl = searchParams.get('url') || decoded?.url;
    const targetNode = searchParams.get('node') || decoded?.activeNode;

    if (targetUrl) {
      setTimeout(() => {
        setUrl(targetUrl);
        void executeAnalysis(targetUrl, token, targetNode || undefined);
      }, 0);
    }

  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void executeAnalysis(url, token);
  };

  const handleShare = () => {
    if (!url || typeof window === 'undefined') return;
    const shareQuery = encodeShareableState(
      url,
      drawerState.isOpen ? drawerState.filePath ?? undefined : undefined,
    );
    const shareUrl = `${window.location.origin}${window.location.pathname}?${shareQuery}`;

    if (navigator?.clipboard?.writeText) {
      void navigator.clipboard.writeText(shareUrl).then(() => {
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 3000);
      });
    }
  };

  const stats = result ? formatRepoStats(result.totalFiles, result.filteredFilesCount) : null;

  const counts = useMemo(() => {
    if (!result) return {};
    const map: Record<string, number> = { all: result.nodes.length };
    result.nodes.forEach((n) => {
      map[n.fileType] = (map[n.fileType] || 0) + 1;
    });
    return map;
  }, [result]);

  const displayedNodes = useMemo(() => {
    if (!result) return [];
    if (filterType === 'all') return result.nodes;
    if (filterType === 'page') {
      return result.nodes.filter((n) => n.fileType === 'page' || n.fileType === 'middleware');
    }
    if (filterType === 'action') {
      return result.nodes.filter((n) => n.fileType === 'action' || n.fileType === 'api');
    }
    return result.nodes.filter((n) => n.fileType === filterType);
  }, [result, filterType]);

  const displayedEdges = useMemo(() => {
    if (!result) return [];
    if (filterType === 'all') return result.edges;
    const activeIds = new Set(displayedNodes.map((n: FlowNodeItem) => n.id));
    return result.edges.filter((e) => activeIds.has(e.source) && activeIds.has(e.target));
  }, [result, displayedNodes, filterType]);

  return (
    <div className="max-w-7xl w-full mx-auto px-6 py-7 flex-1 flex flex-col gap-5">
      <section className="bg-[#0a0a0a] border border-[#262626] rounded-lg p-5 shadow-2xl">
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            <div className="md:col-span-8 space-y-1.5">
              <label htmlFor="github-url" className="block text-xs font-mono text-zinc-400 uppercase tracking-wider">
                GitHub Repository URL <span className="text-rose-400">*</span>
              </label>
              <input
                id="github-url"
                type="text"
                placeholder="https://github.com/chsnor/nextjs101"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                className={`w-full px-3.5 py-2.5 bg-[#000000] border rounded text-white font-mono text-xs placeholder:text-zinc-600 focus:outline-none transition ${
                  errorMessage
                    ? 'border-rose-500/80 focus:border-rose-400 focus:ring-1 focus:ring-rose-500/30'
                    : 'border-[#262626] focus:border-white'
                }`}
              />
            </div>

            <div className="md:col-span-4 space-y-1.5">
              <label htmlFor="github-token" className="block text-xs font-mono text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                <span>GitHub Token</span>
                <span className="text-[10px] text-zinc-500 lowercase">optional</span>
              </label>
              <input
                id="github-token"
                type="password"
                placeholder="ghp_xxxxxxxxxxxx"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#000000] border border-[#262626] rounded text-white font-mono text-xs placeholder:text-zinc-600 focus:outline-none focus:border-white transition"
              />
            </div>
          </div>

          {errorMessage && (
            <div className="flex items-start gap-2.5 px-3.5 py-2.5 rounded border border-rose-500/30 bg-rose-950/20 text-rose-300 text-xs font-mono animate-in fade-in slide-in-from-top-1 duration-200">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed text-[11px] sm:text-xs">
                {errorMessage}
              </div>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="text-zinc-500 hover:text-zinc-300 p-0.5 transition cursor-pointer shrink-0"
                aria-label="ปิดการแจ้งเตือน"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            <span className="text-[11px] font-mono text-zinc-500 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-zinc-400" />
              <span>ตัวอย่าง:</span>
            </span>
            {SAMPLE_REPOSITORIES.map((repo) => (
              <button
                key={repo.url}
                type="button"
                onClick={() => {
                  setUrl(repo.url);
                  setErrorMessage(null);
                  void executeAnalysis(repo.url, token);
                }}
                className="px-2.5 py-1 rounded text-[11px] font-mono bg-[#171717] hover:bg-[#262626] text-zinc-300 hover:text-white border border-[#262626] transition cursor-pointer"
              >
                {repo.label}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-zinc-500">
              รองรับ App Router, Server Actions, Client Components และ Stores
            </span>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-white hover:bg-zinc-200 disabled:bg-[#262626] disabled:text-zinc-600 text-black font-semibold text-xs rounded transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5 text-black" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  <span>กำลังวิเคราะห์...</span>
                </>
              ) : (
                <span>สร้าง Flowchart →</span>
              )}
            </button>
          </div>
        </form>
      </section>

      {result && (
        <section className="space-y-4 flex-1 flex flex-col">

          <div className="bg-[#0a0a0a] border border-[#262626] rounded-lg px-5 py-3.5 flex flex-wrap items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-white tracking-tight flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                {result.owner}/{result.repoName}
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#171717] text-zinc-300 border border-[#262626]">
                {result.branch || 'default'}
              </span>
            </div>

            {stats && (
              <div className="flex items-center gap-4 text-xs font-mono">
                <div className="flex items-center gap-1.5 text-zinc-400">
                  <span>วิเคราะห์ได้:</span>
                  <span className="text-white font-medium">
                    <span className="font-semibold">{stats.analyzedCount}</span> ไฟล์
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-zinc-400">
                  <span>คัดกรองออก:</span>
                  <span className="text-zinc-500 font-medium">
                    <span>{stats.ignoredCount}</span> ({stats.rawCount > 0 ? Math.round((stats.ignoredCount / stats.rawCount) * 100) : 0}%)
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-zinc-400">
                  <span>เส้นเชื่อม:</span>
                  <span className="text-zinc-300 font-medium">{result.relations.length}</span>
                </div>
                {result.executionTimeMs !== undefined && (
                  <div className="hidden lg:flex items-center gap-1 text-[11px] text-zinc-500">
                    <span>(<span>{Math.round(result.executionTimeMs)}</span>ms)</span>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleShare}
                className="px-3.5 py-1.5 bg-[#171717] hover:bg-[#262626] text-zinc-200 text-xs font-medium rounded border border-[#262626] transition flex items-center gap-1.5 cursor-pointer font-mono"
              >
                {shareCopied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Share2 className="w-3.5 h-3.5 text-zinc-400" />
                )}
                <span>{shareCopied ? 'Copied' : 'Share'}</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-zinc-400 px-1 overflow-x-auto pb-1 font-mono">
            <span className="font-medium text-zinc-500 mr-1 hidden sm:inline text-[11px]">FILTER:</span>

            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded border text-xs font-medium transition cursor-pointer flex items-center gap-2 ${
                filterType === 'all'
                  ? 'bg-white border-white text-black font-semibold'
                  : 'bg-[#0a0a0a] border-[#262626] text-zinc-400 hover:text-white hover:bg-[#171717]'
              }`}
            >
              <span>ALL</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded border ${
                filterType === 'all' ? 'bg-zinc-200 text-black border-zinc-300' : 'bg-[#171717] text-zinc-400 border-[#262626]'
              }`}>
                {counts.all ?? 0}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFilterType((prev) => (prev === 'page' ? 'all' : 'page'))}
              className={`px-3 py-1.5 rounded border text-xs font-medium transition cursor-pointer flex items-center gap-2 ${
                filterType === 'page'
                  ? 'bg-white border-white text-black font-semibold'
                  : 'bg-[#0a0a0a] border-[#262626] text-zinc-400 hover:text-white hover:bg-[#171717]'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8]" />
              <span>PAGE</span>
              {((counts.page ?? 0) + (counts.middleware ?? 0)) > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded border ${
                  filterType === 'page' ? 'bg-zinc-200 text-black border-zinc-300' : 'bg-[#171717] text-zinc-400 border-[#262626]'
                }`}>
                  {(counts.page ?? 0) + (counts.middleware ?? 0)}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setFilterType((prev) => (prev === 'component' ? 'all' : 'component'))}
              className={`px-3 py-1.5 rounded border text-xs font-medium transition cursor-pointer flex items-center gap-2 ${
                filterType === 'component'
                  ? 'bg-white border-white text-black font-semibold'
                  : 'bg-[#0a0a0a] border-[#262626] text-zinc-400 hover:text-white hover:bg-[#171717]'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#f43f5e]" />
              <span>COMPONENT</span>
              {(counts.component ?? 0) > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded border ${
                  filterType === 'component' ? 'bg-zinc-200 text-black border-zinc-300' : 'bg-[#171717] text-zinc-400 border-[#262626]'
                }`}>
                  {counts.component ?? 0}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setFilterType((prev) => (prev === 'action' ? 'all' : 'action'))}
              className={`px-3 py-1.5 rounded border text-xs font-medium transition cursor-pointer flex items-center gap-2 ${
                filterType === 'action'
                  ? 'bg-white border-white text-black font-semibold'
                  : 'bg-[#0a0a0a] border-[#262626] text-zinc-400 hover:text-white hover:bg-[#171717]'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#fb923c]" />
              <span>ACTION</span>
              {((counts.action ?? 0) + (counts.api ?? 0)) > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded border ${
                  filterType === 'action' ? 'bg-zinc-200 text-black border-zinc-300' : 'bg-[#171717] text-zinc-400 border-[#262626]'
                }`}>
                  {(counts.action ?? 0) + (counts.api ?? 0)}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setFilterType((prev) => (prev === 'store' ? 'all' : 'store'))}
              className={`px-3 py-1.5 rounded border text-xs font-medium transition cursor-pointer flex items-center gap-2 ${
                filterType === 'store'
                  ? 'bg-white border-white text-black font-semibold'
                  : 'bg-[#0a0a0a] border-[#262626] text-zinc-400 hover:text-white hover:bg-[#171717]'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80]" />
              <span>STORE</span>
              {(counts.store ?? 0) > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded border ${
                  filterType === 'store' ? 'bg-zinc-200 text-black border-zinc-300' : 'bg-[#171717] text-zinc-400 border-[#262626]'
                }`}>
                  {counts.store ?? 0}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setFilterType((prev) => (prev === 'hook' ? 'all' : 'hook'))}
              className={`px-3 py-1.5 rounded border text-xs font-medium transition cursor-pointer flex items-center gap-2 ${
                filterType === 'hook'
                  ? 'bg-white border-white text-black font-semibold'
                  : 'bg-[#0a0a0a] border-[#262626] text-zinc-400 hover:text-white hover:bg-[#171717]'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#818cf8]" />
              <span>HOOK</span>
              {(counts.hook ?? 0) > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded border ${
                  filterType === 'hook' ? 'bg-zinc-200 text-black border-zinc-300' : 'bg-[#171717] text-zinc-400 border-[#262626]'
                }`}>
                  {counts.hook ?? 0}
                </span>
              )}
            </button>
          </div>

          <div className="bg-[#000000] border border-[#262626] rounded-lg overflow-hidden h-[620px] relative shadow-2xl">
            <FlowCanvas
              nodes={displayedNodes}
              edges={displayedEdges}
              onSelectNode={(filePath, fileType) => {
                void handleSelectNode(filePath, fileType);
              }}
            />
          </div>
        </section>
      )}

      <SideDrawer
        isOpen={drawerState.isOpen}
        onClose={() => setDrawerState((prev) => ({ ...prev, isOpen: false }))}
        filePath={drawerState.filePath ?? ''}
        fileType={drawerState.fileType ?? 'other'}
        rawCode={drawerState.fileContent ?? ''}
        githubRawUrl={drawerState.githubRawUrl ?? ''}
        isLoading={isCodeLoading}
      />
    </div>
  );
}

