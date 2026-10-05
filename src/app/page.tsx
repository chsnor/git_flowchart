'use client';

import React, { useState, useEffect } from 'react';
import { AnalysisResult, NextFileType, SideDrawerState } from '../types';
import { FlowCanvas } from '../components/FlowCanvas';
import { SideDrawer } from '../components/SideDrawer';
import { 
  validateUrlInput, 
  formatRepoStats, 
  calculateHealthScore, 
  encodeShareableState, 
  decodeShareableState 
} from '../lib/ui-helper';
import { buildGitHubRawUrl, parseGitHubUrl } from '../lib/github';

export default function HomePage() {
  // =========================================================================
  // พื้นที่ทำงานของ คนที่ 4: Dashboard & State Orchestrator
  // =========================================================================

  // TODO 4.11: สร้าง State สำหรับจัดการหน้าจอ
  const [url, setUrl] = useState<string>('');
  const [token, setToken] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [shareCopied, setShareCopied] = useState<boolean>(false);

  const [drawerState, setDrawerState] = useState<SideDrawerState>({
    isOpen: false,
    filePath: null,
    fileContent: null,
    fileType: null,
    githubRawUrl: null,
  });

  // TODO 4.13: ฟังก์ชัน handleSelectNode(filePath: string, fileType: NextFileType)
  async function handleSelectNode(
    filePath: string, 
    fileType: NextFileType,
    overrideOwner?: string,
    overrideRepo?: string,
    overrideBranch?: string
  ) {
    const targetUrl = url;
    const parsed = parseGitHubUrl(targetUrl);
    const owner = overrideOwner || parsed?.owner || '';
    const repo = overrideRepo || parsed?.repo || '';
    const branch = overrideBranch || parsed?.branch || 'main';

    if (!owner || !repo) {
      setErrorMessage('ไม่พบข้อมูล Repository หรือ Owner สำหรับดึงโค้ด');
      return;
    }

    const rawUrl = buildGitHubRawUrl(owner, repo, branch, filePath);

    setDrawerState({
      isOpen: true,
      filePath,
      fileType,
      fileContent: null,
      githubRawUrl: rawUrl,
    });

    try {
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(rawUrl, { headers });
      if (!res.ok) {
        throw new Error(`ไม่สามารถดึงไฟล์ได้ (HTTP ${res.status})`);
      }
      const code = await res.text();

      setDrawerState((prev) => ({
        ...prev,
        fileContent: code,
      }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการโหลดโค้ด';
      setDrawerState((prev) => ({
        ...prev,
        fileContent: null,
      }));
      setErrorMessage(msg);
    }
  }

  // ฟังก์ชันกลางสำหรับการยิง API วิเคราะห์ข้อมูล
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
        body: JSON.stringify({ url: cleanUrl, token: githubToken }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'ไม่สามารถวิเคราะห์ข้อมูลจาก GitHub ได้');
      }

      const data: AnalysisResult = await response.json();
      setResult(data);

      // ถ้ามี activeFilePath จากการแชร์ ให้เปิด SideDrawer ดึงโค้ดอัตโนมัติ
      if (activeFilePath) {
        const parsed = parseGitHubUrl(cleanUrl);
        if (parsed) {
          void handleSelectNode(activeFilePath, 'other', parsed.owner, parsed.repo, parsed.branch);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  // โหลด state จาก Query Parameter (?state=...) เมื่อโหลดหน้าเว็บครั้งแรก
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stateParam = new URLSearchParams(window.location.search).get('state');
    if (stateParam) {
      const decoded = decodeShareableState(stateParam);
      if (decoded?.url) {
        setUrl(decoded.url);
        void executeAnalysis(decoded.url, '', decoded.activeNode);
      }
    }
  }, []);

  // TODO 4.12: ฟังก์ชัน handleSubmit(e: React.FormEvent)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void executeAnalysis(url, token);
  };

  // TODO 4.14: ฟังก์ชัน handleShare()
  const handleShare = () => {
    if (!url || typeof window === 'undefined') return;
    const shareCode = encodeShareableState(
      url,
      drawerState.isOpen ? drawerState.filePath ?? undefined : undefined,
    );
    
    const shareUrl = `${window.location.origin}${window.location.pathname}?state=${shareCode}`;

    if (navigator?.clipboard?.writeText) {
      void navigator.clipboard.writeText(shareUrl).then(() => {
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 3000);
      }).catch(() => {
        // Fallback / ignore clipboard failure
      });
    }
  };

  // คำนวณสถิติและคะแนนสุขภาพโค้ดล่วงหน้าถ้ามีผลลัพธ์
  const stats = result ? formatRepoStats(result.totalFiles, result.filteredFilesCount) : null;
  const health = result ? calculateHealthScore(result.relations.length, result.filteredFilesCount) : null;

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

        {/* Search & Token Section (TODO 4.15) */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-1">
                <label htmlFor="github-url" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  GitHub Repository URL *
                </label>
                <input
                  id="github-url"
                  type="text"
                  placeholder="https://github.com/owner/repo"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 transition"
                  required
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="github-token" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Personal Access Token (ทางเลือก)
                </label>
                <input
                  id="github-token"
                  type="password"
                  placeholder="ghp_xxxxxxxxxxxx"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 transition"
                />
              </div>
            </div>

            {errorMessage && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl text-sm flex items-center justify-between">
                <span>{errorMessage}</span>
                <button 
                  type="button" 
                  onClick={() => setErrorMessage(null)} 
                  className="text-red-400 hover:text-white text-xs underline"
                >
                  ปิด
                </button>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="w-full md:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white font-semibold text-sm rounded-xl transition shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    กำลังประมวลผล...
                  </>
                ) : (
                  'เริ่มวิเคราะห์สถาปัตยกรรม'
                )}
              </button>
            </div>
          </form>
        </section>

        {/* Dashboard & Canvas Container */}
        {result && (
          <section className="space-y-6">
            {/* แถบสถิติ + คะแนนสุขภาพสถาปัตยกรรม + ปุ่มแชร์ */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Card 1: Stats */}
              {stats && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">สถิติไฟล์</span>
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">ไฟล์วิเคราะห์ได้:</span>
                      <span className="font-mono font-bold text-blue-400">{stats.analyzedCount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">ไฟล์ที่ตัดออก:</span>
                      <span className="font-mono text-slate-500">
                        {stats.ignoredCount} ({stats.rawCount > 0 ? Math.round((stats.ignoredCount / stats.rawCount) * 100) : 0}%)
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Card 2: Health Grade */}
              {health && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                      คะแนนสถาปัตยกรรม
                    </span>
                    <p className="text-xs text-slate-400 max-w-45">
                      {health.description}
                    </p>
                    <span className="text-xs font-mono text-slate-500 mt-1 block">
                      Coupling Ratio: {health.ratio}
                    </span>
                  </div>
                  <div className={`text-4xl font-black px-4 py-2 rounded-xl border ${
                    health.grade === 'A' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                    health.grade === 'B' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                    'bg-rose-500/10 text-rose-400 border-rose-500/30'
                  }`}>
                    {health.grade}
                  </div>
                </div>
              )}

              {/* Card 3: Actions & Share */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">แชร์มุมมอง</span>
                <p className="text-xs text-slate-500 mt-1">
                  คัดลอกลิงก์พร้อมสถานะการเลือกโหนดเพื่อให้เพื่อนร่วมทีมเข้าดูได้ทันที
                </p>
                <button
                  type="button"
                  onClick={handleShare}
                  className="mt-3 w-full py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition flex items-center justify-center gap-2"
                >
                  {shareCopied ? 'คัดลอกลิงก์เรียบร้อย!' : 'คัดลอก Share Link'}
                </button>
              </div>
            </div>

            {/* Interactive Flow Canvas Container */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden h-150 relative shadow-2xl">
              <FlowCanvas
                nodes={result.nodes}
                edges={result.edges}
                onSelectNode={(filePath, fileType) => {
                  void handleSelectNode(filePath, fileType);
                }}
              />
            </div>
          </section>
        )}

        {/* Side Inspector Drawer (TODO 4.16) */}
        <SideDrawer
          isOpen={drawerState.isOpen}
          onClose={() => setDrawerState((prev) => ({ ...prev, isOpen: false }))}
          filePath={drawerState.filePath ?? ''}
          fileType={drawerState.fileType ?? 'other'}
          rawCode={drawerState.fileContent ?? ''}
          githubRawUrl={drawerState.githubRawUrl ?? ''}
        />

      </div>
    </main>
  );
}