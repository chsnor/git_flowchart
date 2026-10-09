export type NextFileType = 'page' | 'layout' | 'action' | 'middleware' | 'store' | 'component' | 'hook' | 'api' | 'other';

export interface GitHubTreeItem {
  path: string;
  mode: string;
  type: 'blob' | 'tree';
  sha: string;
  size?: number;
  url?: string;
}

export interface ParsedGitHubUrl {
  owner: string;
  repo: string;
  branch?: string;
}

export interface CodeRelation {
  source: string;
  target: string;
  type?: 'import' | 'action' | 'event' | 'middleware';
  label?: string;
}

export interface FlowNodeItem {
  id: string;
  label: string;
  fileType: NextFileType;
  path: string;
  position: { x: number; y: number };
}

export interface FlowEdgeItem {
  id: string;
  source: string;
  target: string;
  label?: string;
  animated?: boolean;
  style?: { stroke?: string; [key: string]: unknown };
}

export interface AnalysisResult {
  repoName: string;
  owner: string;
  branch?: string;
  totalFiles: number;
  filteredFilesCount: number;
  relations: CodeRelation[];
  nodes: FlowNodeItem[];
  edges: FlowEdgeItem[];
  mermaidSyntax?: string;
  isCached?: boolean;
  cachedAt?: number;
  commitSha?: string;
  executionTimeMs?: number;
}

export interface SideDrawerState {
  isOpen: boolean;
  filePath: string | null;
  fileContent: string | null;
  fileType: NextFileType | null;
  githubRawUrl: string | null;
}

