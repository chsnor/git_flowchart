'use client';

//import React from 'react';
//import { AnalysisResult, NextFileType, SideDrawerState } from '../types';
//import { FlowCanvas } from '../components/FlowCanvas';
//import { SideDrawer } from '../components/SideDrawer';
import React, { useEffect, useRef, useState } from 'react';
import { AnalysisResult, NextFileType, SideDrawerState } from '../types';
import { FlowCanvas } from '../components/FlowCanvas';
import { SideDrawer } from '../components/SideDrawer';
import { buildGitHubRawUrl, parseGitHubUrl } from '../lib/github';
import {
  calculateHealthScore,
  decodeShareableState,
  encodeShareableState,
  formatRepoStats,
  validateUrlInput,
} from '../lib/ui-helper';

interface OptionalResultMeta {
  totalFiles?: number;
  executionTimeMs?: number;
  isCached?: boolean;
}

interface DrawerViewState extends SideDrawerState {
  loading: boolean;
  error: string | null;
}

/** รูปร่างของ node ที่ใช้อ่าน filePath/type ตอนเปิดจากลิงก์แชร์ */
interface NodeLike {
  id: string;
  data?: { filePath?: string; type?: NextFileType };
}

const INITIAL_DRAWER: DrawerViewState = {
  isOpen: false,
  filePath: null,
  fileContent: null,
  fileType: null,
  githubRawUrl: null,
  loading: false,
  error: null,
};

/** สีตามสถาปัตยกรรม — ต้องตรงกับ getNodeColorConfig ของคนที่ 3 */
const LEGEND = [
  { label: 'Middleware', color: '#a855f7' },
  { label: 'Page', color: '#38bdf8' },
  { label: 'Server Action', color: '#fb923c' },
  { label: 'Store', color: '#4ade80' },
  { label: 'Component', color: '#2dd4bf' },
];

const GRADE_STYLE: Record<'A' | 'B' | 'C' | 'N/A', string> = {
  A: 'text-green-400',
  B: 'text-orange-400',
  C: 'text-red-400',
  'N/A': 'text-slate-400',
};

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
  const [url, setUrl] = useState('');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [drawerState, setDrawerState] = useState<DrawerViewState>(INITIAL_DRAWER);
  const [shareCopied, setShareCopied] = useState(false);

  // URL ที่วิเคราะห์สำเร็จล่าสุด (ใช้สร้าง raw URL / ลิงก์แชร์ แม้ผู้ใช้แก้ช่อง input ต่อ)
  const [analyzedUrl, setAnalyzedUrl] = useState('');
  const latestFileRequest = useRef(0); // กัน response เก่าทับไฟล์ที่เพิ่งคลิก
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoLoaded = useRef(false);

  // TODO 4.12: เขียนฟังก์ชัน handleSubmit(e: React.FormEvent)
  // 1. เรียก validateUrlInput(url) จาก lib/ui-helper
  // 2. ถ้าไม่ถูกต้อง ให้ตั้ง errorMessage แล้วหยุดทำงาน
  // 3. ยิง POST ไปที่ /api/analyze พร้อมแนบ { url, token }
  // 4. เมื่อได้ผลลัพธ์ นำมาบันทึกใน State result
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void runAnalysis(url);
  };

  async function runAnalysis(targetUrl: string, preselectNodeId?: string) {
    // 1-2. ตรวจ input ถ้าไม่ผ่านให้แจ้งแล้วหยุด
    const check = validateUrlInput(targetUrl);
    if (!check.isValid) {
      setErrorMessage(check.errorMessage);
      return;
    }
    const cleanUrl = targetUrl.trim();

    setLoading(true);
    setErrorMessage(null);
    setDrawerState(INITIAL_DRAWER);

    try {
      // 3. POST /api/analyze พร้อม { url, token }
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: cleanUrl, token: token.trim() || undefined }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(body?.error ?? `วิเคราะห์ไม่สำเร็จ (HTTP ${res.status})`);
      }

      // 4. บันทึกผลลัพธ์
      const data = body as AnalysisResult;
      setResult(data);
      setAnalyzedUrl(cleanUrl);

      // เปิดจากลิงก์แชร์: เปิดไฟล์ที่เพื่อนกำลังดูอยู่ทันที
      if (preselectNodeId) {
        const node = (data.nodes as unknown as NodeLike[]).find((n) => n.id === preselectNodeId);
        if (node) {
          const filePath = node.data?.filePath ?? node.id;
          void handleSelectNode(filePath, (node.data?.type ?? 'other') as NextFileType, cleanUrl);
        }
      }
    } catch (err) {
      setResult(null);
      setErrorMessage(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ');
    } finally {
      setLoading(false);
    }
  }

  // TODO 4.13: เขียนฟังก์ชัน handleSelectNode(filePath: string, fileType: NextFileType)
  // 1. สร้าง raw URL ด้วย buildGitHubRawUrl(owner, repo, filePath) จาก lib/github
  // 2. อัปเดต drawerState ให้ isOpen: true และเริ่มดึงเนื้อหาไฟล์มาแสดง
  async function handleSelectNode(
    filePath: string,
    fileType: NextFileType,
    repoUrl: string = analyzedUrl,
  ) {
    const repo = parseGitHubUrl(repoUrl);
    if (!repo) {
      setDrawerState({
        ...INITIAL_DRAWER,
        isOpen: true,
        filePath,
        fileType,
        error: 'ไม่สามารถอ่านชื่อ repo จากลิงก์ได้',
      });
      return;
    }

    // 1. สร้าง raw URL
    const rawUrl = buildGitHubRawUrl(repo.owner, repo.repo, filePath);

    // 2. เปิด Drawer ทันที (แสดง loading) แล้วค่อยดึงเนื้อหาไฟล์
    const requestId = ++latestFileRequest.current;
    setDrawerState({
      ...INITIAL_DRAWER,
      isOpen: true,
      filePath,
      fileType,
      githubRawUrl: rawUrl,
      loading: true,
    });

    try {
      const res = await fetch(rawUrl);
      if (!res.ok) throw new Error(`ดึงไฟล์ไม่สำเร็จ (HTTP ${res.status})`);
      const content = await res.text();
      if (requestId !== latestFileRequest.current) return; // มีการคลิกไฟล์อื่นแล้ว
      setDrawerState((prev) => ({ ...prev, fileContent: content, loading: false, error: null }));
    } catch (err) {
      if (requestId !== latestFileRequest.current) return;
      setDrawerState((prev) => ({
        ...prev,
        fileContent: null,
        loading: false,
        error: err instanceof Error ? err.message : 'ดึงไฟล์ไม่สำเร็จ',
      }));
    }
  }

  function handleCloseDrawer() {
    latestFileRequest.current++; // ยกเลิกผลของคำขอที่ยังค้างอยู่
    setDrawerState(INITIAL_DRAWER);
  }

  // TODO 4.14: เขียนฟังก์ชัน handleShare()
  // 1. เรียก encodeShareableState(url, activeFilePath) จาก lib/ui-helper
  // 2. สร้าง query string ?state=... แล้วคัดลอกลง Clipboard ด้วย navigator.clipboard.writeText
  async function handleShare() {
    if (!analyzedUrl) return;

    // 1. เข้ารหัส state (ไม่รวม token เด็ดขาด)
    const encoded = encodeShareableState(analyzedUrl, drawerState.filePath ?? undefined);
    // 2. สร้าง ?state=... แล้วคัดลอกลง Clipboard
    const link = `${window.location.origin}${window.location.pathname}?state=${encoded}`;

    try {
      await navigator.clipboard.writeText(link);
      setShareCopied(true);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setShareCopied(false), 2200);
    } catch {
      // clipboard ใช้ไม่ได้ (เช่น ไม่ใช่ HTTPS) → ให้ผู้ใช้คัดลอกเอง
      window.prompt('คัดลอกลิงก์นี้เพื่อแชร์', link);
    }
  }

  // เปิดลิงก์แชร์ (?state=...) ครั้งเดียวตอนโหลดหน้า
  useEffect(() => {
    if (autoLoaded.current) return;
    autoLoaded.current = true;

    const shared = decodeShareableState(
      new URLSearchParams(window.location.search).get('state') ?? '',
    );
    if (!shared) return;

    setUrl(shared.url);
    void runAnalysis(shared.url, shared.activeNode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(
    () => () => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
    },
    [],
  );

  // ค่าที่คำนวณจากผลลัพธ์ (ถูกเรียกเฉพาะตอนมี result)
  const meta = (result ?? {}) as OptionalResultMeta;
  const filteredCount = result?.nodes.length ?? 0;
  const relationCount = result?.edges.length ?? 0;
  const stats = formatRepoStats(meta.totalFiles ?? filteredCount, filteredCount);
  const health = calculateHealthScore(relationCount, filteredCount);
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
        {/* Search & Token Section */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <form onSubmit={handleSubmit} className="flex flex-col gap-3 lg:flex-row" noValidate>
            <label className="flex-3">
              <span className="sr-only">ลิงก์ GitHub repository</span>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://github.com/vercel/commerce"
                autoComplete="off"
                spellCheck={false}
                aria-invalid={errorMessage !== null}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus-visible:border-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
              />
            </label>

            <label className="flex-2">
              <span className="sr-only">GitHub Token (ไม่บังคับ)</span>
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="GitHub Token (ไม่บังคับ) — เพิ่มโควตาเป็น 5,000 ครั้ง/ชม."
                autoComplete="off"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus-visible:border-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-blue-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:cursor-wait disabled:opacity-60"
            >
              {loading ? 'กำลังวิเคราะห์…' : 'วิเคราะห์ repo'}
            </button>
          </form>

          {errorMessage && (
            <p role="alert" className="text-sm text-red-400">
              {errorMessage}
            </p>
          )}
        </section>


        {/* Dashboard & Canvas Container (Wireframe) */}
        <section className="space-y-6">
          {result ? (
            <>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                  <p className="text-xs text-slate-400">ไฟล์ทั้งหมดใน repo</p>
                  <p className="mt-1 text-3xl font-bold tabular-nums">
                    {stats.rawCount.toLocaleString('en-US')}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                  <p className="text-xs text-slate-400">ไฟล์ที่วิเคราะห์</p>
                  <p className="mt-1 text-3xl font-bold tabular-nums">
                    {stats.analyzedCount.toLocaleString('en-US')}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">{stats.summaryText}</p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                  <p className="text-xs text-slate-400">คะแนนสถาปัตยกรรม</p>
                  <div className="mt-1 flex items-baseline gap-3">
                    <span
                      className={`text-4xl font-extrabold ${GRADE_STYLE[health.grade]}`}
                      aria-label={`เกรด ${health.grade}`}
                    >
                      {health.grade}
                    </span>
                    <span className="text-xs text-slate-500">Coupling {health.ratio}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">{health.description}</p>
                </div>

                <div className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900 p-5">
                  <div>
                    <p className="text-xs text-slate-400">
                      ความสัมพันธ์ {relationCount.toLocaleString('en-US')} เส้น
                    </p>
                    <p role="status" aria-live="polite" className="mt-1 text-xs text-slate-500">
                      {meta.isCached ? 'ผลจากแคช' : ''}
                      {meta.isCached && meta.executionTimeMs != null ? ' · ' : ''}
                      {meta.executionTimeMs != null ? `${Math.round(meta.executionTimeMs)} ms` : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleShare}
                    className="mt-3 rounded-xl border border-slate-700 px-4 py-2 text-sm font-medium transition-colors hover:border-blue-500 hover:text-blue-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60"
                  >
                    {shareCopied ? 'คัดลอกลิงก์แล้ว' : 'Share link'}
                  </button>
                </div>
              </div>

              <ul aria-label="คำอธิบายสี" className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-400">
                {LEGEND.map((item) => (
                  <li key={item.label} className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: item.color }}
                      aria-hidden
                    />
                    {item.label}
                  </li>
                ))}
              </ul>

              <div className="h-150 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40">
                <FlowCanvas
                  nodes={result.nodes}
                  edges={result.edges}
                  onSelectNode={handleSelectNode}
                />
              </div>
            </>
          ) : (
            <div className="flex min-h-112.5 items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-8 text-center">
              <p className="max-w-md text-sm leading-relaxed text-slate-400">
                {loading
                  ? 'กำลังดึงโครงสร้างไฟล์จาก GitHub และวิเคราะห์ความสัมพันธ์…'
                  : 'ยังไม่มีไดอะแกรม วางลิงก์ repo ด้านบนแล้วกด “วิเคราะห์ repo” เพื่อเริ่มต้น'}
              </p>
            </div>
          )}
        </section>

        {/* Side Inspector Drawer (Wireframe placeholder) */}
        {/* TODO 4.16: นำคอมโพเนนต์ SideDrawer (คนที่ 5) มาวาง และผูกค่ากับ drawerState */}
        <SideDrawer
          isOpen={drawerState.isOpen}
          filePath={drawerState.filePath ?? undefined}
          fileContent={drawerState.fileContent ?? undefined}
          fileType={drawerState.fileType ?? undefined}
          githubRawUrl={drawerState.githubRawUrl ?? undefined}
          onClose={handleCloseDrawer}
        />
      </div>
    </main>
  );
}
