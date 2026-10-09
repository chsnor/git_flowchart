import { ParsedGitHubUrl } from '../types';

function parseBranchFromSegments(segments: string[]): string | undefined {
  const markerIndex = segments.findIndex((seg) => seg === 'tree' || seg === 'blob');
  if (markerIndex === -1 || markerIndex + 1 >= segments.length) return undefined;
  return segments.slice(markerIndex + 1).join('/') || undefined;
}

export function parseGitHubUrl(url: string): ParsedGitHubUrl | null {
  if (!url || typeof url !== 'string') return null;
  const trimmedUrl = url.trim();
  if (!trimmedUrl) return null;

  try {
    const fullUrl = /^https?:\/\//i.test(trimmedUrl) ? trimmedUrl : `https://${trimmedUrl}`;
    const parsed = new URL(fullUrl);

    const hostname = parsed.hostname.toLowerCase();
    if (hostname !== 'github.com' && hostname !== 'www.github.com') return null;

    const segments = parsed.pathname.split('/').filter(Boolean);
    if (segments.length < 2) return null;

    const branch = parseBranchFromSegments(segments);
    const owner = segments[0];
    let repo = segments[1];
    if (repo.toLowerCase().endsWith('.git')) repo = repo.slice(0, -4);

    return owner && repo ? { owner, repo, branch } : null;
  } catch {
    return null;
  }
}

export function buildGitHubApiUrl(owner: string, repo: string, branch = 'main'): string {
  return `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;
}

export function buildGitHubHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'User-Agent': 'GitFlow-Visualizer',
  };

  if (token && typeof token === 'string' && token.trim().length > 0) {
    headers['Authorization'] = `Bearer ${token.trim()}`;
  }

  return headers;
}

export function buildGitHubRawUrl(owner: string, repo: string, filePath: string, branch = 'main'): string {
  const cleanPath = filePath.replace(/^\/+/, '');
  return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${cleanPath}`;
}

export function buildGitHubBlobUrl(owner: string, repo: string, filePath: string, branch = 'main'): string {
  const cleanPath = filePath.replace(/^\/+/, '');
  return `https://github.com/${owner}/${repo}/blob/${branch}/${cleanPath}`;
}
