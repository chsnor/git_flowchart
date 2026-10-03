// src/lib/pipeline.ts
import { parseGitHubUrl, buildGitHubApiUrl, buildGitHubHeaders } from './github';
import { filterTreeFiles, detectNextFileType, extractImportsFromCode, extractActionTriggers } from './parser';
import { buildFlowElements, generateMermaidSyntax } from './generator';
import { AnalysisResult, GitHubTreeItem, CodeRelation, NextFileType, FlowNodeItem, FlowEdgeItem } from '../types';

/**
 * ตัวแปรเก็บแคชในหน่วยความจำ (In-Memory Cache) ประจำเซิร์ฟเวอร์
 * เก็บผลการวิเคราะห์โดยใช้ URL เป็น Key เพื่อลดการยิง GitHub API ซ้ำซ้อน
 */
export const pipelineCache = new Map<string, AnalysisResult>();

/**
 * ฟังก์ชันสำหรับล้างแคชทั้งหมด (ใช้สำหรับรัน Unit Test หรือรีเซ็ตระบบ)
 */
export function clearPipelineCache(): void {
  pipelineCache.clear();
}

/**
 * ฟังก์ชัน Pipeline รวบยอดทั้งระบบ (คนที่ 6 รับผิดชอบ)
 * ทำหน้าที่เชื่อมโยงการทำงานจากโมดูลของสมาชิกทุกคนตั้งแต่ต้นน้ำจนถึงปลายน้ำ
 * พร้อมระบบ In-Memory Cache และการวัด Performance
 */
export async function runAnalysisPipeline(
  githubUrl: string,
  token?: string,
  mockTreeData?: GitHubTreeItem[],
  mockFilesContent?: Record<string, string>,
): Promise<AnalysisResult> {
  // TODO 6.1: เริ่มจับเวลาด้วย const startTime = performance.now()
  const startTime = performance.now();
  // TODO 6.2: รับ URL และทำการแกะเจ้าของ/ชื่อคลังด้วย parseGitHubUrl (คนที่ 1)
  let parsed = null;

  try {
    parsed = parseGitHubUrl(githubUrl);
  } catch {
    // สำรองไว้ชั่วคราวระหว่างรอคนที่ 1 ทำงานเสร็จ
    if (githubUrl && githubUrl.includes("github.com")) {
      const parts = githubUrl
        .replace(/\.git$/, "")
        .replace(/\/+$/, "")
        .split("/");
      parsed = {
        owner: parts[parts.length - 2],
        repo: parts[parts.length - 1],
      };
    }
  }

  if (!parsed || !parsed.owner || !parsed.repo) {
    throw new Error("URL ต้องมาจาก github.com เท่านั้น");
  }

  const { owner, repo } = parsed;
  // TODO 6.3: ตรวจสอบ In-Memory Cache (pipelineCache)
  //           - ถ้ามีข้อมูลในแคชแล้ว ให้คืนค่าจากแคชทันที พร้อมแนบ isCached: true และ executionTimeMs
  if (pipelineCache.has(githubUrl)) {
    const cachedResult = pipelineCache.get(githubUrl)!;
    return {
      ...cachedResult,
      isCached: true,
      executionTimeMs: performance.now() - startTime,
    };
  }
  // TODO 6.4: ดึงข้อมูลโครงสร้างโฟลเดอร์จาก GitHub API หรือใช้ mockTreeData (คนที่ 1)
  let treeData: GitHubTreeItem[] = [];

  if (mockTreeData) {
    treeData = mockTreeData;
    console.log("🔄 ใช้ Mock Tree Data (สำหรับการทดสอบภายใน)");
  } else {
    try {
      const response = await fetch(
        buildGitHubApiUrl(owner, repo),
        { headers: buildGitHubHeaders(token) },
      );

      if (!response.ok) {
        // ถ้า Error 403 Forbidden ให้แนะนำให้ใส่ Token ใน .env
        if (response.status === 403) {
          throw new Error(
            "❌ GitHub API Rate Limit หรือ Access Denied. กรุณาเพิ่ม GitHub Token ในไฟล์ .env",
          );
        }
        throw new Error(`GitHub API Error: ${response.status}`);
      }

      const json = await response.json();
      if (Array.isArray(json.tree)) {
        treeData = json.tree;
      }
    } catch (error: any) {
      if (error?.message && error.message.includes("❌")) {
        throw error;
      }
      console.error("❌ ไม่สามารถเชื่อมต่อ GitHub ได้:", error);
      throw new Error(
        "ไม่สามารถเชื่อมต่อ GitHub ได้ กรุณาตรวจสอบอินเทอร์เน็ตหรือแนบ Token",
      );
    }
  }
  // TODO 6.5: นำรายการไฟล์มาคัดกรองด้วย filterTreeFiles (คนที่ 2)
  // กรองไฟล์ที่ไม่เกี่ยวข้องทิ้ง (ใช้ฟังก์ชันคนที่ 2)
  let filteredItems: GitHubTreeItem[] = [];
  try {
    filteredItems = filterTreeFiles(treeData);
  } catch {
    // โค้ดสำรองระหว่างรอคนที่ 2: กรองเอาเฉพาะไฟล์ blob และนามสกุลโค้ด
    filteredItems = treeData.filter(
      (item) =>
        item.type === "blob" &&
        !item.path.includes("node_modules") &&
        !item.path.includes(".next") &&
        !item.path.endsWith(".d.ts") &&
        /\.(tsx?|jsx?)$/.test(item.path),
    );
  }
  // TODO 6.6: จำแนกประเภทของแต่ละไฟล์ด้วย detectNextFileType (คนที่ 2)
  const filesWithTypes = filteredItems.map((item) => {
    let fileType: NextFileType = "other";
    try {
      fileType = detectNextFileType(item.path);
    } catch {
      // โค้ดสำรองระหว่างรอคนที่ 2: เดาประเภทจากชื่อไฟล์คร่าวๆ
      if (item.path.includes("page.")) fileType = "page";
      else if (item.path.includes("actions")) fileType = "action";
      else if (item.path.includes("middleware") || item.path.includes("proxy"))
        fileType = "middleware";
      else if (item.path.includes("store") || item.path.includes("context"))
        fileType = "store";
      else if (item.path.includes("components/")) fileType = "component";
    }
    return { path: item.path, fileType };
  });
  // TODO 6.7: สกัดความสัมพันธ์ Imports และ Action/Event Triggers (คนที่ 2)
  const relations: CodeRelation[] = [];

  if (mockFilesContent) {
    for (const [filePath, content] of Object.entries(mockFilesContent)) {
      // 1. ดึงคำสั่ง import
      try {
        relations.push(...extractImportsFromCode(filePath, content));
      } catch {}

      // 2. ดึง Event / Server Action
      try {
        relations.push(...extractActionTriggers(filePath, content));
      } catch {
        // โค้ดสำรองระหว่างรอคนที่ 2
        if (content.includes("action={updateProductAction}")) {
          relations.push({
            source: filePath,
            target: "src/app/products/actions.ts",
            type: "action",
            label: "form action",
          });
        }
      }
    }
  }
  // TODO 6.8: สร้างโครงสร้าง Nodes/Edges สำหรับ React Flow และ Mermaid Syntax (คนที่ 3)
  // 1. สร้างโหนดและเส้นเชื่อมสำหรับ React Flow
  let flowElements: { nodes: FlowNodeItem[]; edges: FlowEdgeItem[] } = { nodes: [], edges: [] };
  try {
    flowElements = buildFlowElements(filesWithTypes, relations);
  } catch {
    // โค้ดสำรองระหว่างรอคนที่ 3: คำนวณพิกัด X, Y เบื้องต้น
    flowElements = {
      nodes: filesWithTypes.map((f, idx) => ({
        id: f.path.replace(/[^a-zA-Z0-9]/g, "_"),
        label: f.path,
        fileType: f.fileType,
        path: f.path,
        position: { x: (idx % 3) * 220, y: Math.floor(idx / 3) * 120 },
      })),
      edges: relations.map((r, idx) => ({
        id: `e-${idx}`,
        source: r.source.replace(/[^a-zA-Z0-9]/g, "_"),
        target: r.target.replace(/[^a-zA-Z0-9]/g, "_"),
        label: r.label,
        animated: r.type === "action",
      })),
    };
  }

  // 2. สร้างโค้ด Mermaid Syntax สำหรับ Export
  let mermaidSyntax = "graph TD\n";
  try {
    mermaidSyntax = generateMermaidSyntax(relations);
  } catch {
    mermaidSyntax = 'graph TD\n  Start["Repo Root"]';
  }
  // TODO 6.9: บันทึกผลลัพธ์ลง pipelineCache.set(githubUrl, result) เพื่อใช้ในครั้งต่อไป
    const finalResult: AnalysisResult = {
      repoName: repo,
      owner,
      totalFiles: treeData.length,
      filteredFilesCount: filteredItems.length,
      relations,
      nodes: flowElements.nodes,
      edges: flowElements.edges,
      mermaidSyntax,
      isCached: false,
      executionTimeMs: performance.now() - startTime,
    };

    // บันทึกลง In-Memory Cache
    pipelineCache.set(githubUrl, finalResult);

    return finalResult;
  // TODO 6.10: ส่งคืน AnalysisResult ที่สมบูรณ์ พร้อมแนบ isCached: false และ executionTimeMs
  // TODO 6.11 (Network Safety Guard): ครอบ try-catch หากยิง GitHub ไม่สำเร็จ (เช่น เน็ตหลุด หรือติด Rate Limit 403) 
  //            ให้โยน Error ที่มีข้อความชัดเจน เช่น "ไม่สามารถเชื่อมต่อ GitHub ได้ กรุณาตรวจสอบอินเทอร์เน็ตหรือแนบ Token"
  
}   
