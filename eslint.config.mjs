import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "make_report_docx.js",
    "capture_code_snippets.js",
    "generate_canva_slides.js",
    "learning-web/**",
    "dist/**",
    "node_modules/**",
    ".agents/**",
  ]),
]);

export default eslintConfig;
