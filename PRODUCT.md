# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
นักพัฒนาซอฟต์แวร์, นักศึกษา CS, และผู้ตรวจสอบสถาปัตยกรรมโค้ดที่ต้องการทำความเข้าใจโครงสร้างของ GitHub Repository หรือโปรเจกต์ Next.js App Router อย่างรวดเร็ว

## Product Purpose
แปลงโครงสร้างโฟลเดอร์และไฟล์จาก GitHub ให้กลายเป็น Interactive Architecture Flowchart ด้วย React Flow และ Mermaid Syntax เพื่อให้เห็นภาพความสัมพันธ์ของ Component, Server Action, Store และ Event Flow ได้ทันที โดยไม่ต้องติดตั้ง Database หรือโปรแกรมเสริม

## Positioning
วิเคราะห์ AST และความสัมพันธ์ของโค้ด Next.js App Router พร้อมสร้าง Interactive Flow Diagram ระดับไฟล์และ Event แบบเรียลไทม์ผ่าน In-Memory Pipeline น้ำหนักเบา

## Operating Context
ใช้งานบนเว็บเบราว์เซอร์ โดยผู้ใช้กรอก GitHub URL ของโปรเจกต์ จากนั้นระบบจะดึงโครงสร้างไฟล์ วิเคราะห์ชนิดไฟล์ (page, action, component, store) และแสดงผลเป็นไดอะแกรมที่คลิกสำรวจและปรับแต่งตำแหน่งได้

## Capabilities and Constraints
- รองรับ Next.js App Router และไฟล์ TypeScript/JavaScript (.tsx, .jsx, .ts, .js)
- วิเคราะห์ความสัมพันธ์ของโค้ด: Import dependencies, Server Actions (form action), UI triggers (onClick)
- แสดงผล 2 รูปแบบ: Interactive Node Graph (React Flow) และ Mermaid Diagram
- มีระบบ In-Memory Cache ใน RAM ลดการยิง GitHub API ซ้ำ
- ไม่มีการใช้งาน Database ภายนอก ทำงานทั้งหมดผ่าน Memory และ REST API

## Brand Commitments
- ชื่อระบบ: GitFlow Visualizer
- บุคลิก: เครื่องมือระดับวิศวกรรมซอฟต์แวร์ (Developer-first, Clean, Minimalist, Precision)
- โทนเสียง: ตรงไปตรงมา ชัดเจน ไร้สิ่งประดับตกแต่งที่เกินจำเป็น (Zero AI Slop)

## Evidence on Hand
- โค้ดระบบหลักสมบูรณ์ใน `src/lib/pipeline.ts`, `src/lib/github.ts`, `src/lib/parser.ts`, `src/lib/generator.ts`
- ชุดทดสอบ Vitest ครอบคลุมฟังก์ชัน 100% (`npm run test`)
- หน้าเว็บ Code Inspector พอร์ทัลสำหรับการเรียนรู้ที่ `D:\gitflow_learning_portal`

## Product Principles
1. ความเร็วและประสิทธิภาพต้องมาก่อน (Latency ต่ำด้วย In-Memory Caching)
2. โครงสร้างข้อมูลโปร่งใส ตรวจสอบความถูกต้องได้ทุกขั้นตอน
3. อินเทอร์เฟซสะอาด ชัดเจน ไม่ใช้ของตกแต่งที่ไร้ประโยชน์ (Zero AI Slop)
4. ทำงานได้ทันทีแบบ Zero-Config ไม่ต้องติดตั้ง Database เพิ่มเติม
