# GitFlow Visualizer

เว็บช่วยแปลงโครงสร้างโฟลเดอร์และไฟล์จาก GitHub ให้กลายเป็น Interactive Architecture Flowchart ด้วย Next.js App Router, React Flow และ PrismJS สำหรับนักพัฒนาสำรวจความสัมพันธ์ของโค้ด Event และ Server Action ได้ทันทีโดยไม่ต้องใช้ Database

---

## สารบัญ
1. [วิธีเปิดโปรเจกต์ครั้งแรก](#1-วิธีเปิดโปรเจกต์ครั้งแรก)
2. [ขั้นตอนการทำงานด้วย Git & ส่ง Pull Request (ทุกคนต้องทำตามนี้)](#2-ขั้นตอนการทำงานด้วย-git--ส่ง-pull-request-ทุกคนต้องทำตามนี้)
3. [ตารางหน้าที่และคำสั่งรันเทสประจำตัวทั้ง 6 คน](#3-ตารางหน้าที่และคำสั่งรันเทสประจำตัวทั้ง-6-คน)
4. [ตัวเลือกเสริม: รันผ่าน Docker](#4-ตัวเลือกเสริม-รันผ่าน-docker)

---

## 1. วิธีเปิดโปรเจกต์ครั้งแรก

หลังจากที่โคลนโค้ดลงมาในเครื่องตัวเองแล้ว ให้ทำตาม 3 ขั้นตอนนี้:

1. โคลนโค้ดลงเครื่อง:
   ```bash
   git clone <URL_REPO_ของกลุ่ม>
   cd git_flowcahrt
   ```
2. โหลดไลบรารีที่ต้องใช้:
   ```bash
   npm install
   ```
3. รันหน้าเว็บทดสอบ:
   ```bash
   npm run dev
   ```
   เปิดเบราว์เซอร์ไปที่: `http://localhost:3000`

---

## 2. ขั้นตอนการทำงานด้วย Git & ส่ง Pull Request (ทุกคนต้องทำตามนี้)

> ข้อห้ามสำคัญ: ห้าม push ตรงเข้า branch main เด็ดขาด ให้ทุกคนแยกไปทำใน branch ตัวเอง แล้วค่อยส่ง PR มารวมกัน เพื่อไม่ให้โค้ดพังหรือตีกัน

### สเต็ป 1: สร้าง branch ของตัวเองก่อนเริ่มเขียนโค้ด
ก่อนจะพิมพ์โค้ดอะไร ให้เปิด Terminal แล้วพิมพ์คำสั่งสร้าง branch ตามหน้าที่ของตัวเอง:

- คนที่ 1:
  ```bash
  git checkout -b feat/person-1-github
  ```
- คนที่ 2:
  ```bash
  git checkout -b feat/person-2-parser
  ```
- คนที่ 3:
  ```bash
  git checkout -b feat/person-3-visualizer
  ```
- คนที่ 4:
  ```bash
  git checkout -b feat/person-4-dashboard
  ```
- คนที่ 5:
  ```bash
  git checkout -b feat/person-5-inspector
  ```
- คนที่ 6:
  ```bash
  git checkout -b feat/person-6-pipeline-qa
  ```

---

### สเต็ป 2: ลงมือเขียนโค้ดและรันเทสให้ผ่าน
เปิดดู TODO ในคอมเมนต์ของไฟล์ตัวเอง แล้วเขียนฟังก์ชันไปเรื่อยๆ จนกว่าคำสั่งรันเทสของตัวเองจะขึ้นสีเขียว (PASS) ครบทุกข้อ

---

### สเต็ป 3: เซฟงานและส่งขึ้น GitHub
พอเทสของตัวเองผ่านครบแล้ว ให้เซฟงานขึ้น GitHub ตามนี้:

```bash
# เช็กว่าเราแก้ไฟล์อะไรไปบ้าง
git status

# แอดไฟล์ทั้งหมดเตรียมเซฟ
git add .

# บันทึกข้อความว่าเราทำอะไรไป
git commit -m "feat: implement my part"

# ส่งโค้ดขึ้น GitHub (ใส่ชื่อ branch ของตัวเอง)
git push -u origin <ชื่อ_branch_ของตัวเอง>
```

---

### สเต็ป 4: กดยื่น Pull Request (PR) บนหน้าเว็บ GitHub
1. เปิดเข้าไปที่หน้า Repo บน GitHub
2. จะเห็นแถบสีเหลืองแจ้งเตือนขึ้นมา ให้กดปุ่ม **"Compare & pull request"**
3. ติ๊กช่องยืนยันว่ารันเทสในเครื่องผ่านแล้ว
4. กดปุ่ม **"Create pull request"**
5. บอท GitHub Actions จะช่วยรันเทสบนคลาวด์ให้อัตโนมัติ:
   - ถ้าขึ้นเครื่องหมายถูกสีเขียว แปลว่าผ่าน พร้อมเอางานเข้า main
   - ถ้าขึ้นกากบาทสีแดง ให้กดดูว่าติดข้อไหน แล้วกลับไปแก้ในเครื่อง จากนั้น commit และ push อีกรอบ

---

## 3. ตารางหน้าที่และคำสั่งรันเทสประจำตัวทั้ง 6 คน

แต่ละคนมีไฟล์ที่ต้องรับผิดชอบ และคำสั่งรันเทสเฉพาะของตัวเองตามนี้:

| คนที่ | บทบาท / ตำแหน่ง | ไฟล์ที่ต้องรับผิดชอบ | คำสั่งรันเทสเฉพาะคน |
| :---: | :--- | :--- | :--- |
| **1** | Data Ingestion & GitHub Service | `src/lib/github.ts` | `npx vitest run src/tests/1_github.test.ts` |
| **2** | AST & Event Parser Engine | `src/lib/parser.ts` | `npx vitest run src/tests/2_parser.test.ts` |
| **3** | Interactive Flow Visualizer | `src/lib/generator.ts`, `src/components/FlowCanvas.tsx` | `npx vitest run src/tests/3_generator.test.ts` |
| **4** | Dashboard & State Orchestrator | `src/lib/ui-helper.ts`, `src/app/page.tsx` | `npx vitest run src/tests/4_frontend_ui.test.ts` |
| **5** | Side Inspector & Code Viewer | `src/lib/code-viewer.ts`, `src/components/SideDrawer.tsx` | `npx vitest run src/tests/5_side_drawer.test.ts` |
| **6** | Integration Pipeline, QA & Deployment | `src/lib/pipeline.ts`, Docker, CI/CD | `npx vitest run src/tests/6_integration_pipeline.test.ts` |

หากต้องการรันตรวจเทสพร้อมกันทุกคนทีเดียว (ทั้งหมด 61 ข้อ):
```bash
npm test
```

---

## 4. ตัวเลือกเสริม: รันผ่าน Docker

ถ้าเครื่องใครลง Docker ไว้และอยากลองรันแบบคอนเทนเนอร์:
```bash
docker compose up --build
```
แล้วเปิดที่: `http://localhost:3000`
