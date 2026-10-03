# ข้อกำหนดความต้องการและขอบเขตงานของทั้ง 6 คน (Software Requirements Specification)

โปรเจกต์: **GitFlow Visualizer (Next.js App Router Architecture Flowchart)**  
เวอร์ชัน: 2.0 (ขยายเป็นทีม 6 คน รองรับ React Flow Canvas, Side Inspector ไฮไลต์โค้ดจริง, และการตรวจจับ Event / Server Action)

---

## 👤 คนที่ 1: Data Ingestion & GitHub Service
**ไฟล์ที่รับผิดชอบ:** `src/lib/github.ts`  
**ไฟล์เทส:** `src/tests/1_github.test.ts` (13 ข้อ)

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
   - ถ้าผู้ใช้ระบุ Token มา ให้แนบ `Authorization: Bearer <token>` เพื่อปลดล็อกโควตา 5,000 ครั้ง/ชม.
4. **การสร้าง URL ดึงโค้ดจริง (Function: `buildGitHubRawUrl`):**
   - สร้าง URL สำหรับส่งให้แถบ Side Inspector นำไปดึงไฟล์จริง: `https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{filePath}`

---

## 👤 คนที่ 2: AST & Event Parser Engine
**ไฟล์ที่รับผิดชอบ:** `src/lib/parser.ts`  
**ไฟล์เทส:** `src/tests/2_parser.test.ts` (13 ข้อ)

### ขอบเขตงาน (Requirements):
1. **การคัดกรองขยะ (Function: `filterTreeFiles`):**
   - เอาเฉพาะไฟล์ที่เป็น `blob` (ไม่เอาโฟลเดอร์ที่เป็น `tree`)
   - กรองโฟลเดอร์ขยะทิ้ง: `node_modules/`, `.next/`, `dist/`, `build/`, `public/`
   - กรองไฟล์ระบบทิ้ง: lockfiles, `.env*`, `.gitignore`, `tsconfig.json`, `README.md`
   - เก็บเฉพาะไฟล์โค้ดนามสกุล: `.ts`, `.tsx`, `.js`, `.jsx`
   - **ระบบจำกัดจำนวน (Safety Cap):** ตัดทอนจำนวนไฟล์ไม่ให้เกิน `maxLimit = 150` เพื่อป้องกันเบราว์เซอร์ค้างหากเจอ Repo ขนาดมหึมา
2. **การจำแนกประเภทไฟล์ Next.js (Function: `detectNextFileType`):**
   - **โครงสร้างยืดหยุ่น:** รองรับทั้งโปรเจกต์ที่มี `src/` (เช่น `src/app/page.tsx`) และแบบไม่มี `src/` (เช่น `app/page.tsx`)
   - `middleware`: ไฟล์ `middleware.ts` หรือ `proxy.ts` (จุดคัดกรองความปลอดภัย)
   - `page`: ไฟล์ `page.tsx` หรือ `page.js` (หน้าจอแสดงผล)
   - `layout`: ไฟล์ `layout.tsx` (โครงหน้าเว็บ)
   - `action`: ไฟล์ `actions.ts` หรือไฟล์ในโฟลเดอร์ `actions/` (Server Action)
   - `store`: ไฟล์ในโฟลเดอร์ `stores/`, `context/` หรือ state
   - `api`: ไฟล์ `route.ts` หรือในโฟลเดอร์ `api/`
   - `component`: ไฟล์ในโฟลเดอร์ `components/`
   - `other`: ไฟล์ยูทิลิตี้อื่นๆ เช่น `lib/`
3. **การแกะความสัมพันธ์การ Import (Function: `extractImportsFromCode`):**
   - กรองบรรทัดที่คอมเมนต์ทิ้ง (`//`) ไม่นำมาคิด
   - สกัดคำสั่ง `import` ทั้ง Single-line และ Multi-line รวมถึง TypeScript `import type`
   - เอาเฉพาะ Local / Alias Path (`./`, `../`, `@/`) และตัดความสัมพันธ์ซ้ำซ้อน
4. **การตรวจจับ Event และ Server Action (Function: `extractActionTriggers`):**
   - สแกนหาคำสั่ง Event ของปุ่ม เช่น `onClick={handler}`
   - สแกนหาคำสั่งส่งฟอร์มของ Next.js Server Action เช่น `<form action={actionHandler}>`
   - เชื่อมโยงจากหน้า Page ไปยังฟังก์ชัน Action ปลายทาง พร้อมใส่ Label บอกประเภท Event

---

## 👤 คนที่ 3: Interactive Flow Visualizer & Diagram Engine
**ไฟล์ที่รับผิดชอบ:** `src/lib/generator.ts`, `src/components/FlowCanvas.tsx`  
**ไฟล์เทส:** `src/tests/3_generator.test.ts` (7 ข้อ)

### ขอบเขตงาน (Requirements):
1. **การทำความสะอาดชื่อโหนด (Function: `sanitizeNodeId`):**
   - ตัดเครื่องหมายพิเศษ (`/`, `.`, `-`, `@`) และวงเล็บ Route Groups เช่น `(auth)` ให้กลายเป็น `_`
   - ตัด `_` ที่อยู่หัวท้ายสตริงทิ้ง
2. **ระบบชุดสีตามสถาปัตยกรรม (Function: `getNodeColorConfig` & `getNodeStyle`):**
   - `middleware`: สีม่วง (`#a855f7`)
   - `page`: สีฟ้า (`#38bdf8`)
   - `action`: สีส้ม (`#fb923c`)
   - `store`: สีเขียว (`#4ade80`)
   - `component`: สีคราม/มิ้นท์ (`#2dd4bf`)
3. **การแปลงข้อมูลเป็น React Flow Elements (Function: `buildFlowElements`):**
   - แปลงไฟล์เป็น Flow Nodes พร้อมคำนวณพิกัด X, Y แบ่งคอลัมน์อัตโนมัติ (Layout Structure)
   - แปลงความสัมพันธ์เป็น Flow Edges พร้อมใส่ลูกศร, label ของ Event และเส้นขยับได้ (animated) สำหรับ Action
4. **ผืนผ้าใบแบบ Interactive (`src/components/FlowCanvas.tsx`):**
   - เรนเดอร์บนผืนผ้าใบ **React Flow (`@xyflow/react`)**
   - รองรับ Zoom, Pan, Dragging, แถบเครื่องมือควบคุม (Controls) และ MiniMap นำทาง
   - ส่ง Event เมื่อผู้ใช้คลิกโหนด เพื่อส่งต่อให้ Side Inspector ดึงโค้ดมาแสดง

---

## 👤 คนที่ 4: Dashboard UI & State Orchestrator
**ไฟล์ที่รับผิดชอบ:** `src/lib/ui-helper.ts`, `src/app/page.tsx`  
**ไฟล์เทส:** `src/tests/4_frontend_ui.test.ts` (12 ข้อ)

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
4. **ระบบแชร์สถานะไดอะแกรม (Function: `encodeShareableState`, `decodeShareableState`):**
   - เข้ารหัส URL และโหนดที่กำลังเปิดดูเป็น Base64 string ใน URL Query Parameter (`?state=...`)
   - ถอดรหัสกลับมาเมื่อเปิดลิงก์ เพื่อให้เพื่อนในทีมเปิดดูมุมมองเดียวกันได้ทันที
5. **หน้าจอหลัก Dashboard (`src/app/page.tsx`):**
   - กล่อง Input รองรับ URL และ GitHub Token ตัวเลือกเสริม
   - การ์ดสถิติแสดงจำนวนไฟล์ และคะแนนสถาปัตยกรรม
   - ปุ่ม Share Link พร้อมสถานะแจ้งเตือนเมื่อคัดลอกสำเร็จ

---

## 👤 คนที่ 5: Side Inspector & PrismJS Code Viewer
**ไฟล์ที่รับผิดชอบ:** `src/lib/code-viewer.ts`, `src/components/SideDrawer.tsx`  
**ไฟล์เทส:** `src/tests/5_side_drawer.test.ts` (7 ข้อ)

### ขอบเขตงาน (Requirements):
1. **การตรวจสอบภาษาจากนามสกุล (Function: `getLanguageFromPath`):**
   - แมปนามสกุลไฟล์ `.tsx`, `.ts`, `.jsx`, `.js`, `.json`, `.css` ให้ตรงกับชื่อภาษาของ PrismJS
   - มี fallback ไปยังภาษาพื้นฐานกรณีไม่ทราบนามสกุล ป้องกันข้อผิดพลาด
2. **การตัดทอนและนับบรรทัด (Function: `formatCodeSnippet`):**
   - นับจำนวนบรรทัดของโค้ดจริง
   - ป้องกันหน้าเว็บหน่วงด้วยการจำกัดบรรทัดสูงสุด (เช่น 300 บรรทัด) พร้อมขึ้นสถานะแจ้งเตือนการตัดทอน
3. **การทำ Syntax Highlighting (Function: `highlightCodeWithPrism`):**
   - เรียกใช้ Prism.js แปลงโค้ดดิบเป็น HTML พร้อมคลาสสี token
   - ปลอดภัยต่อการเรนเดอร์ใน Next.js ทั้งฝั่ง Server และ Client
4. **แถบเลื่อนดูโค้ด Side Drawer (`src/components/SideDrawer.tsx`):**
   - แถบเลื่อนเปิด-ปิดจากขอบขวาอย่างนุ่มนวล (Slide-over drawer)
   - แสดง Tag สีบอกประเภทไฟล์ และชื่อ Path เต็ม
   - หน้าต่างแสดงโค้ดพร้อม Scrollbar แนวนอน/แนวตั้ง
   - ปุ่ม Copy Code และปุ่มกระโดดไปเปิดดูไฟล์จริงบน GitHub ด้วยแท็บใหม่

---

## 👤 คนที่ 6: Integration Pipeline, QA & Deployment
**ไฟล์ที่รับผิดชอบ:** `src/lib/pipeline.ts`, `src/tests/6_integration_pipeline.test.ts` (4 ข้อ), Dockerfile, CI/CD  
**ไฟล์เทส:** `src/tests/6_integration_pipeline.test.ts`

### ขอบเขตงาน (Requirements):
1. **การประกอบ Pipeline ครบวงจร (Function: `runAnalysisPipeline`):**
   - รวบรวมฟังก์ชันของคนที่ 1 (Fetch API), คนที่ 2 (Filter, Classify, Action Parser), และคนที่ 3 (Flow Elements Builder) ให้ทำงานต่อกันอย่างลื่นไหล
   - รองรับการรับทั้ง URL จริงจากภายนอก และ Mock Data สำหรับการรันเทสออฟไลน์
2. **ระบบ In-Memory Cache (`pipelineCache` & `clearPipelineCache`):**
   - ใช้ `Map<string, AnalysisResult>` จัดเก็บผลลัพธ์ของ URL ที่เคยวิเคราะห์แล้ว
   - หากมีการเรียก URL ซ้ำ ให้ส่งผลลัพธ์จากแคชกลับทันทีพร้อมป้าย `isCached: true` ลดภาระ Network และแก้ปัญหา GitHub Rate Limit
   - วัดเวลาประมวลผลจริงด้วย `performance.now()` และแนบค่า `executionTimeMs`
3. **การทดสอบความเร็วและ Performance Benchmark:**
   - ทดสอบ Stress Test กับคลังขนาด 500 ไฟล์ ต้องประมวลผลเสร็จในเวลาไม่เกิน 150ms
4. **การจัดการ Container และ CI/CD:**
   - ดูแลคอนฟิก `Dockerfile` และ `compose.yaml` ให้รันแอปได้บนทุกเครื่อง
   - ตรวจสอบ GitHub Actions CI ให้รัน `npm test` และ `npm run build` ผ่าน 100% ทุกครั้งที่มี Pull Request
5. **รายงานการทดสอบ:**
   - ควบคุมการรันเทสทั้งหมด 73 ข้อจากสมาชิกทั้ง 6 คนให้ผ่านครบถ้วนก่อนส่งงาน
