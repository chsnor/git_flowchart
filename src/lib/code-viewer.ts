import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-markup';

const EXTENSION_LANGUAGE_MAP: Record<string, string> = {
  ts: 'typescript',
  tsx: 'tsx',
  js: 'javascript',
  mjs: 'javascript',
  cjs: 'javascript',
  jsx: 'jsx',
  json: 'json',
  css: 'css',
  html: 'markup',
  xml: 'markup',
  svg: 'markup',
};

export function getLanguageFromPath(filePath: string): string {
  if (!filePath || typeof filePath !== 'string') return 'clike';

  const lastDot = filePath.lastIndexOf('.');
  if (lastDot === -1 || lastDot === filePath.length - 1) {
    return 'clike';
  }

  const extension = filePath.slice(lastDot + 1).toLowerCase();
  return EXTENSION_LANGUAGE_MAP[extension] ?? 'clike';
}

export interface FormattedCodeResult {
  snippet: string;
  code: string;
  totalLines: number;
  isTruncated: boolean;
  displayedLines: number;
}

export function formatCodeSnippet(rawCode: string, maxLines: number = 300): FormattedCodeResult {
  if (typeof rawCode !== 'string') {
    return {
      snippet: '',
      code: '',
      totalLines: 0,
      isTruncated: false,
      displayedLines: 0,
    };
  }

  const lines = rawCode.split('\n');
  const totalLines = lines.length;
  const isTruncated = totalLines > maxLines;
  const code = isTruncated ? lines.slice(0, maxLines).join('\n') : rawCode;

  return {
    snippet: code,
    code,
    totalLines,
    isTruncated,
    displayedLines: isTruncated ? maxLines : totalLines,
  };
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function highlightCodeWithPrism(code: string, language: string): string {
  if (!code) return '';

  const grammar = Prism.languages[language];
  if (!grammar) {
    return escapeHtml(code);
  }

  try {
    return Prism.highlight(code, grammar, language);
  } catch {
    return escapeHtml(code);
  }
}
