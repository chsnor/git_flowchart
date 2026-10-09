import { parseGitHubUrl } from './github';

export function validateUrlInput(input: string): { isValid: boolean; errorMessage: string | null } {
  if (!input || !input.trim()) {
    return { isValid: false, errorMessage: 'กรุณากรอก GitHub URL' };
  }

  const parsed = parseGitHubUrl(input.trim());
  if (!parsed || !parsed.owner || !parsed.repo) {
    return { isValid: false, errorMessage: 'URL ต้องมาจาก github.com และระบุเจ้าของกับคลังโค้ด (เช่น https://github.com/owner/repo)' };
  }

  return { isValid: true, errorMessage: null };
}

export function formatRepoStats(totalFiles: number, filteredFiles: number): {
  rawCount: number;
  analyzedCount: number;
  ignoredCount: number;
} {
  const rawCount = Math.max(0, Number.isFinite(totalFiles) ? totalFiles : 0);
  const analyzedCount = Math.max(0, Number.isFinite(filteredFiles) ? filteredFiles : 0);
  const ignoredCount = Math.max(0, rawCount - analyzedCount);

  return {
    rawCount,
    analyzedCount,
    ignoredCount,
  };
}

export function encodeShareableState(url: string, activeNode?: string): string {
  if (!url) return '';
  const params = new URLSearchParams();
  params.set('url', url);
  if (activeNode) params.set('node', activeNode);
  return params.toString();
}

export function decodeShareableState(paramStr: string): { url: string; activeNode?: string } | null {
  if (!paramStr || typeof paramStr !== 'string') return null;

  try {

    if (paramStr.includes('url=')) {
      const params = new URLSearchParams(paramStr.startsWith('?') ? paramStr.slice(1) : paramStr);
      const url = params.get('url');
      if (url) {
        return {
          url,
          activeNode: params.get('node') || undefined,
        };
      }
    }

    const raw = typeof window !== 'undefined' ? window.atob(paramStr) : Buffer.from(paramStr, 'base64').toString('utf-8');
    const parsed = JSON.parse(decodeURIComponent(raw));
    if (parsed && typeof parsed.url === 'string') {
      return { url: parsed.url, activeNode: parsed.activeNode || undefined };
    }
  } catch {}

  return null;
}
