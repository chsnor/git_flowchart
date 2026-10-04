import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-markup';

/**
 * 1. ตรวจสอบภาษาจากนามสกุลไฟล์
 */
export function getLanguageFromPath(filePath: string): string {
  if (!filePath || typeof filePath !== 'string') return 'clike';

  const cleanPath = filePath.split('?')[0].split('#')[0];
  const lastDot = cleanPath.lastIndexOf('.');

  // ถ้าไม่มีจุด หรือไม่มีนามสกุลไฟล์ (เช่น Dockerfile)
  if (lastDot === -1 || lastDot === cleanPath.length - 1) {
    return 'clike';
  }

  const extension = cleanPath.slice(lastDot + 1).toLowerCase();

  switch (extension) {
    case 'ts':
      return 'typescript';
    case 'tsx':
      return 'tsx';
    case 'js':
    case 'mjs':
    case 'cjs':
      return 'javascript';
    case 'jsx':
      return 'jsx';
    case 'json':
      return 'json';
    case 'css':
      return 'css';
    case 'html':
    case 'xml':
    case 'svg':
      return 'markup';
    default:
      return 'clike';
  }
}

export interface FormattedCodeResult {
  snippet: string;
  code: string;
  totalLines: number;
  isTruncated: boolean;
  displayedLines: number;
}

/**
 * 2. ตัดทอนและนับบรรทัดของโค้ด
 */
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

  if (totalLines > maxLines) {
    const truncatedCode = lines.slice(0, maxLines).join('\n');
    return {
      snippet: truncatedCode,
      code: truncatedCode,
      totalLines,
      isTruncated: true,
      displayedLines: maxLines,
    };
  }

  return {
    snippet: rawCode,
    code: rawCode,
    totalLines,
    isTruncated: false,
    displayedLines: totalLines,
  };
}

/**
 * 3. ทำ Syntax Highlighting ปลอดภัยต่อการเรนเดอร์
 */
export function highlightCodeWithPrism(code: string, language: string): string {
  if (!code) return '';

  const grammar = Prism.languages[language];

  if (!grammar) {
    // Escape HTML กรณีไม่รู้จักภาษา เพื่อความปลอดภัยและไม่ crash
    return code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  try {
    return Prism.highlight(code, grammar, language);
  } catch {
    return code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}