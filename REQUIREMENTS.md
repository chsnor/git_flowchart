# ข้อกำหนดความต้องการและขอบเขตงานของทั้ง 5 คน (Software Requirements Specification)

โปรเจกต์: **GitFlow Visualizer (Interactive Code Architecture Flowchart)**  
เวอร์ชัน: 1.1 (เพิ่มระบบ Token ทางเลือก, Color-Coded Diagram, และคะแนน Architecture Health)

---

## 👤 คนที่ 1: GitHub URL Parser & API Fetcher
**ไฟล์ที่รับผิดชอบ:** `src/lib/github.ts`  
**ไฟล์เทส:** `src/tests/1_github.test.ts` (17 ข้อ)

### ขอบเขตงาน (Requirements):
1. **การแกะ URL (Function: `parseGitHubUrl`):**
   - รองรับ URL ทุกแบบ เช่น `https://`, `http://`, `github.com/...`, หรือมี `www.`
   - ตัด `.git` ท้ายชื่อ repo ออกอัตโนมัติ
   - ตัดเครื่องหมาย slash (`/`) ซ้อนท้าย และตัด query string (`?...`), hash (`#...`) ทิ้ง
   - ตัด sub-paths เช่น `/tree/main` หรือ `/blob/...` ออก
   - ถ้าไม่ใช่เว็บ github หรือไม่มีชื่อ repo ต้องคืนค่า `null`
2. **การต่อ URL API (Function: `buildGitHubApiUrl`):**
   - สร้าง URL ปลายทาง: `https://api.github.com/repos/{owner}/{repo}/git/trees/{branch}?recursive=1`
3. **การจัดการ Headers & Token (Function: `buildGitHubHeaders`):**
   - ต้องมี Header `User-Agent: GitFlow-Visualizer` เสมอ
   - ถ้าผู้ใช้ระบุ Token มา ให้แนบ `Authorization: Bearer <token>` (เพื่อเพิ่มโควตาเป็น 5,000 ครั้ง/ชม.)

---

## 👤 คนที่ 2: Code Parser & Filter Logic
**ไฟล์ที่รับผิดชอบ:** `src/lib/parser.ts`  
**ไฟล์เทส:** `src/tests/2_parser.test.ts` (7 ข้อ)

### ขอบเขตงาน (Requirements):
1. **การคัดกรองขยะ (Function: `filterTreeFiles`):**
   - เอาเฉพาะไฟล์ที่เป็น `blob` (ไม่เอาโฟลเดอร์ที่เป็น `tree`)
   - กรองโฟลเดอร์ขยะทิ้ง: `node_modules/`, `.next/`, `dist/`, `build/`, `public/`
   - กรองไฟล์ระบบทิ้ง: lockfiles, `.env*`, `.gitignore`, `tsconfig.json`, `README.md`
   - เก็บเฉพาะไฟล์โค้ดนามสกุล: `.ts`, `.tsx`, `.js`, `.jsx`
2. **การแกะความสัมพันธ์ (Function: `extractImportsFromCode`):**
   - กรองบรรทัดที่คอมเมนต์ทิ้ง (`//`) ไม่นำมาคิด
   - สกัดคำสั่ง `import` ทั้งแบบบรรทัดเดียว (Single-line) และหลายบรรทัด (Multi-line)
   - สกัด TypeScript `import type { ... }`
   - เอาเฉพาะ Local / Alias Path ที่ขึ้นต้นด้วย `./`, `../` หรือ `@/` (ตัด package ภายนอกทิ้ง)
   - ตัดความสัมพันธ์ซ้ำซ้อนภายในไฟล์เดียวกัน

---

## 👤 คนที่ 3: Mermaid Engine & Color Styler
**ไฟล์ที่รับผิดชอบ:** `src/lib/generator.ts`  
**ไฟล์เทส:** `src/tests/3_generator.test.ts` (11 ข้อ)

### ขอบเขตงาน (Requirements):
1. **การทำความสะอาดชื่อโหนด (Function: `sanitizeNodeId`):**
   - ตัดเครื่องหมายพิเศษ (`/`, `.`, `-`, `@`) และวงเล็บ Route Groups เช่น `(auth)` ให้กลายเป็น `_`
   - ตัด `_` ที่อยู่หัวท้ายสตริงทิ้ง
2. **ระบบแยกสีกล่องตามโฟลเดอร์ (Function: `getNodeStyle`):**
   - ไฟล์ใน `app/` (หน้าเว็บ) -> สีกรอบฟ้า `#38bdf8`
   - ไฟล์ใน `components/` (UI) -> สีกรอบเขียว `#4ade80`
   - ไฟล์ใน `lib/` หรือ `api/` (ตรรกะ/หลังบ้าน) -> สีกรอบส้ม `#fb923c`
3. **การสร้าง Mermaid Syntax (Function: `generateMermaidSyntax`):**
   - เริ่มต้นบรรทัดแรกด้วย `graph TD`
   - แปลงคู่ความสัมพันธ์เป็น `sourceId["path"] --> targetId["path"]` โดยไม่สร้างเส้นซ้ำ
   - แนบคำสั่ง style สีของแต่ละโหนดเข้าไปด้วย
   - ถ้าไม่มีความสัมพันธ์เลย ให้คืนค่าโหนดว่างเริ่มต้น

---

## 👤 คนที่ 4: Frontend UI, Validation & Health Score
**ไฟล์ที่รับผิดชอบ:** `src/lib/ui-helper.ts` และ `src/app/page.tsx`  
**ไฟล์เทส:** `src/tests/4_frontend_ui.test.ts` (11 ข้อ)

### ขอบเขตงาน (Requirements):
1. **การตรวจสอบ Input (Function: `validateUrlInput`):**
   - ตัด trim ช่องว่างหัวท้ายอัตโนมัติ
   - ตรวจจับและปฏิเสธค่าว่าง หรือ XSS script tags
   - เช็กว่าต้องมีโดเมน `github.com`
2. **การจัดรูปแบบสถิติ (Function: `formatRepoStats`):**
   - คำนวณจำนวนไฟล์ดิบ, ไฟล์ที่วิเคราะห์, และไฟล์ที่ตัดทิ้ง (ป้องกันค่าติดลบ/หารศูนย์)
3. **การประเมินคะแนนสถาปัตยกรรม (Function: `calculateHealthScore`):**
   - คำนวณ Coupling Ratio = `totalRelations / filteredFiles`
   - Ratio 0.8 - 2.5 ได้ **เกรด A** (โครงสร้างดี มีการแยกโมดูลเหมาะสม)
   - Ratio 2.5 - 4.0 ได้ **เกรด B** (เริ่มมีความผูกพันกันค่อนข้างแน่น)
   - Ratio นอกเหนือจากนี้ได้ **เกรด C** (ผูกกันแน่นเกินไป หรือแทบไม่มีการแยกส่วน)
4. **หน้าจอ Dashboard (`src/app/page.tsx`):**
   - มีช่องวาง GitHub URL และช่องใส่ Token ทางเลือก (Optional)
   - มีปุ่ม Analyze และสถานะ Loading
   - ฝั่งซ้าย: แสดงการ์ดสถิติตัวเลข และการ์ดแสดงเกรดสุขภาพโค้ด (A/B/C)
   - ฝั่งขวา: แสดงแผนผัง Mermaid พร้อมปุ่ม **Copy Mermaid Syntax** และปุ่ม **Export SVG**

---

## 👤 คนที่ 5: QA Integration & System Verification
**ไฟล์ที่รับผิดชอบ:** `src/tests/5_integration_pipeline.test.ts` (2 ข้อ) และสไลด์นำเสนอ

### ขอบเขตงาน (Requirements):
1. **การตรวจสอบภาพรวม (End-to-End Pipeline):**
   - ทดสอบว่าเมื่อนำโค้ดของคนที่ 1, 2, 3, 4 มารวมกัน ข้อมูลไหลจาก URL -> Filter -> Import -> Mermaid ได้ครบ 100%
   - รันตรวจสอบ Performance Benchmark ให้ระบบประมวลผล 500 ไฟล์ได้เร็วกว่า 100ms
2. **คุมมาตรฐานคุณภาพของทีม:**
   - รันคำสั่ง `npm test` เพื่อตรวจสอบให้ครบทั้ง 48 ข้อต้องผ่าน 100% ก่อนส่งมอบงาน
   - จัดทำสไลด์และฝึกซ้อมพรีเซนต์ตามหัวข้อใน `FUTURE_IDEAS.md`
