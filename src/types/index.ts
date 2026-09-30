// src/types/index.ts

export interface GitHubTreeItem {
  path: string;
  mode: string;
  type: 'blob' | 'tree';
  sha: string;
  size?: number;
  url?: string;
}

export interface CodeRelation {
  source: string;
  target: string;
}

export interface AnalysisResult {
  repoName: string;
  owner: string;
  totalFiles: number;
  filteredFilesCount: number;
  relations: CodeRelation[];
  mermaidSyntax: string;
}

export interface ParsedGitHubUrl {
  owner: string;
  repo: string;
}
