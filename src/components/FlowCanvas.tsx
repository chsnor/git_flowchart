'use client';

import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  MarkerType,
  Position,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { FlowNodeItem, FlowEdgeItem, NextFileType } from '../types';
import { getNodeColorConfig } from '../lib/generator';
import { Search, Code2, X, SlidersHorizontal, Map as MapIcon, Layers } from 'lucide-react';

export interface FlowCanvasProps {
  nodes: FlowNodeItem[];
  edges: FlowEdgeItem[];
  onSelectNode?: (path: string, fileType: NextFileType) => void;
}

type NodeData = {
  label: React.ReactNode;
  path: string;
  fileType: NextFileType;
  [key: string]: unknown;
};

type TraceMode = 'full' | 'direct';

const COLUMNS = 4;
const COL_WIDTH = 320;
const ROW_HEIGHT = 120;

function computeTracePath(
  selectedNodeId: string | null,
  edges: FlowEdgeItem[],
  traceMode: TraceMode = 'full'
): { connectedNodeIds: Set<string>; connectedEdgeIds: Set<string> } {
  if (!selectedNodeId) {
    return { connectedNodeIds: new Set(), connectedEdgeIds: new Set() };
  }

  const connectedEdgeIds = new Set<string>();
  const visitedNodes = new Set<string>([selectedNodeId]);

  if (traceMode === 'direct') {
    for (const edge of edges) {
      if (edge.source === selectedNodeId || edge.target === selectedNodeId) {
        connectedEdgeIds.add(edge.id);
        visitedNodes.add(edge.source);
        visitedNodes.add(edge.target);
      }
    }
    return { connectedNodeIds: visitedNodes, connectedEdgeIds };
  }

  const downstreamQueue: string[] = [selectedNodeId];
  while (downstreamQueue.length > 0) {
    const current = downstreamQueue.shift()!;
    for (const edge of edges) {
      if (edge.source === current) {
        connectedEdgeIds.add(edge.id);
        if (!visitedNodes.has(edge.target)) {
          visitedNodes.add(edge.target);
          downstreamQueue.push(edge.target);
        }
      }
    }
  }

  const upstreamQueue: string[] = [selectedNodeId];
  while (upstreamQueue.length > 0) {
    const current = upstreamQueue.shift()!;
    for (const edge of edges) {
      if (edge.target === current) {
        connectedEdgeIds.add(edge.id);
        if (!visitedNodes.has(edge.source)) {
          visitedNodes.add(edge.source);
          upstreamQueue.push(edge.source);
        }
      }
    }
  }

  return { connectedNodeIds: visitedNodes, connectedEdgeIds };
}

function toRfNodes(
  items: FlowNodeItem[],
  selectedNodeId: string | null,
  connectedNodeIds: Set<string>,
  onInspectNode?: (path: string, fileType: NextFileType) => void
): Node<NodeData>[] {
  return (items ?? []).map((item, index) => {
    const pos = (item as unknown as { position?: { x: number; y: number } }).position ?? {
      x: (index % COLUMNS) * COL_WIDTH,
      y: Math.floor(index / COLUMNS) * ROW_HEIGHT,
    };
    const colors = getNodeColorConfig(item.fileType);

    const parts = item.path.split('/');
    const fileName = parts.pop() || item.path;
    const folderPath = parts.join('/');

    const isSelected = selectedNodeId === item.id;
    const isConnected = selectedNodeId ? isSelected || connectedNodeIds.has(item.id) : true;
    const opacity = isConnected ? 1 : 0.35;

    const nodeLabel = (
      <div className="flex flex-col gap-1.5 text-left select-none relative group">
        <div className="flex items-center justify-between">
          <span
            className="text-[9px] font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded"
            style={{ background: `${colors.border}15`, color: colors.border, border: `1px solid ${colors.border}30` }}
          >
            {item.fileType}
          </span>
          <div className="flex items-center gap-1.5">
            {onInspectNode && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onInspectNode(item.path, item.fileType);
                }}
                className="opacity-0 group-hover:opacity-100 hover:scale-105 p-1 rounded bg-slate-800 text-slate-300 hover:text-white transition-all border border-slate-700 cursor-pointer"
                title="คลิกเพื่อดูโค้ดไฟล์นี้"
              >
                <Code2 className="w-3 h-3" />
              </button>
            )}
            <span
              className="w-1.5 h-1.5 rounded-full transition-transform"
              style={{
                background: colors.border,
                transform: isSelected ? 'scale(1.4)' : 'scale(1)',
              }}
            />
          </div>
        </div>
        <div
          className={`font-medium text-xs truncate transition-colors ${
            isSelected ? 'text-white font-semibold' : isConnected ? 'text-slate-200' : 'text-slate-400'
          }`}
          title={item.path}
        >
          {fileName}
        </div>
        {folderPath && (
          <div className="text-[10px] text-slate-400 truncate font-mono" title={folderPath}>
            {folderPath}
          </div>
        )}
      </div>
    );

    return {
      id: item.id,
      position: pos,
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      data: { label: nodeLabel, path: item.path, fileType: item.fileType },
      style: {
        border: isSelected
          ? `2px solid ${colors.border}`
          : isConnected && selectedNodeId
          ? `1.5px solid ${colors.border}99`
          : `1px solid ${colors.border}45`,
        background: '#0a0a0a',
        color: '#ededed',
        borderRadius: 6,
        padding: '12px 14px',
        fontSize: 12,
        width: 260,
        opacity,
        transition: 'all 0.15s ease',
        boxShadow: isSelected
          ? `0 0 0 1px ${colors.border}, 0 8px 28px ${colors.border}35`
          : '0 2px 8px rgba(0, 0, 0, 0.8)',
      },
    };
  });
}

function toRfEdges(
  items: FlowEdgeItem[],
  selectedNodeId: string | null,
  connectedEdgeIds: Set<string>
): Edge[] {
  return (items ?? []).map((item) => {
    const isConnected = selectedNodeId ? connectedEdgeIds.has(item.id) : true;

    const displayLabel = selectedNodeId && isConnected ? item.label : undefined;

    const strokeColor = item.style?.stroke || '#737373';
    const isHighlighted = selectedNodeId && isConnected;
    const isDimmed = selectedNodeId && !isConnected;

    return {
      id: item.id,
      source: item.source,
      target: item.target,
      label: displayLabel,
      animated: isHighlighted ? true : Boolean(item.animated),
      type: 'default',
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 14,
        height: 14,
        color: isHighlighted ? (strokeColor as string) : isDimmed ? '#1c1c1c' : '#525252',
      },
      style: {
        stroke: isHighlighted ? (strokeColor as string) : isDimmed ? '#1c1c1c' : '#525252',
        strokeWidth: isHighlighted ? 2 : 1.2,
        opacity: isDimmed ? 0.2 : 0.85,
        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      labelStyle: {
        fill: isHighlighted ? '#ffffff' : '#a1a1aa',
        fontSize: 10,
        fontWeight: isHighlighted ? 600 : 500,
        fontFamily: 'var(--font-sans)',
      },
      labelBgStyle: {
        fill: '#0a0a0a',
        fillOpacity: 0.95,
        stroke: isHighlighted ? strokeColor : '#262626',
        strokeWidth: 1,
      },
      labelBgPadding: [6, 3] as [number, number],
      labelBgBorderRadius: 6,
    };
  });
}

function FlowCanvasInner({ nodes, edges, onSelectNode }: FlowCanvasProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [traceMode, setTraceMode] = useState<TraceMode>('full');
  const [showMiniMap, setShowMiniMap] = useState<boolean>(false);
  const [autoInspect, setAutoInspect] = useState<boolean>(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState<boolean>(false);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const settingsMenuRef = useRef<HTMLDivElement>(null);

  const { setCenter, fitView } = useReactFlow();

  const { connectedNodeIds, connectedEdgeIds } = useMemo(
    () => computeTracePath(selectedNodeId, edges, traceMode),
    [selectedNodeId, edges, traceMode]
  );

  const handleInspect = useCallback(
    (path: string, fileType: NextFileType) => {
      onSelectNode?.(path, fileType);
    },
    [onSelectNode]
  );

  const initialNodes = useMemo(
    () => toRfNodes(nodes, selectedNodeId, connectedNodeIds, handleInspect),
    [nodes, selectedNodeId, connectedNodeIds, handleInspect]
  );

  const initialEdges = useMemo(
    () => toRfEdges(edges, selectedNodeId, connectedEdgeIds),
    [edges, selectedNodeId, connectedEdgeIds]
  );

  const [rfNodes, setRfNodes, onNodesChange] = useNodesState<Node<NodeData>>(initialNodes);
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState<Edge>(initialEdges);

  useEffect(() => {
    setRfNodes((prevNodes) => {
      const prevPositions = new Map(prevNodes.map((n) => [n.id, n.position]));
      return initialNodes.map((node) => {
        const prevPosition = prevPositions.get(node.id);
        return prevPosition ? { ...node, position: prevPosition } : node;
      });
    });
  }, [initialNodes, setRfNodes]);

  useEffect(() => {
    setRfEdges(initialEdges);
  }, [initialEdges, setRfEdges]);

  const handleClearFocus = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  const focusAndPanToNode = useCallback(
    (nodeItem: FlowNodeItem) => {
      setSelectedNodeId(nodeItem.id);
      setIsSearchOpen(false);
      setSearchQuery('');

      const pos = (nodeItem as unknown as { position?: { x: number; y: number } }).position;
      if (pos) {
        void setCenter(pos.x + 130, pos.y + 40, { zoom: 1.2, duration: 500 });
      }

      if (autoInspect) {
        onSelectNode?.(nodeItem.path, nodeItem.fileType);
      }
    },
    [setCenter, autoInspect, onSelectNode]
  );

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchOpen(true);
      } else if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchOpen(true);
      } else if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setShowSettingsMenu(false);
        if (selectedNodeId) {
          handleClearFocus();
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [selectedNodeId, handleClearFocus]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.trim().toLowerCase();
    return nodes.filter((n) => n.path.toLowerCase().includes(query)).slice(0, 10);
  }, [nodes, searchQuery]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as globalThis.Node;
      if (!searchContainerRef.current?.contains(target)) setIsSearchOpen(false);
      if (!settingsMenuRef.current?.contains(target)) setShowSettingsMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!nodes || nodes.length === 0) {
    return (
      <div className="h-[550px] w-full rounded-2xl border border-dashed border-slate-800 bg-slate-950 flex items-center justify-center text-sm text-slate-500 font-sans">
        ยังไม่มีข้อมูลโหนดให้แสดง
      </div>
    );
  }

  return (
    <div className="h-[620px] w-full rounded-lg border border-[#262626] bg-[#000000] overflow-hidden relative font-sans shadow-2xl">

      <div className="absolute top-3.5 right-3.5 z-20 flex items-center gap-2 max-w-[90%]">

        <div ref={searchContainerRef} className="relative">
          <div className="flex items-center gap-2 bg-[#000000]/90 backdrop-blur-md border border-[#262626] rounded-md px-2.5 py-1.5 text-zinc-300 shadow-md focus-within:border-white focus-within:ring-1 focus-within:ring-white/20 transition">
            <Search className="w-3.5 h-3.5 text-zinc-400" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="ค้นหาโหนด... (Ctrl+K)"
              value={searchQuery}
              onFocus={() => setIsSearchOpen(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              className="w-28 sm:w-36 bg-transparent text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none font-sans"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setIsSearchOpen(false);
                }}
                className="text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            ) : (
              <kbd className="hidden sm:inline-block text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#171717] text-zinc-400 border border-[#262626]">
                /
              </kbd>
            )}
          </div>

          {isSearchOpen && searchResults.length > 0 && (
            <div className="absolute right-0 top-full mt-1.5 w-72 max-h-64 overflow-y-auto bg-[#0a0a0a] border border-[#262626] rounded-md shadow-2xl z-50 p-1.5 flex flex-col gap-1">
              <div className="px-2 py-1 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                ผลการค้นหา ({searchResults.length})
              </div>
              {searchResults.map((item) => {
                const color = getNodeColorConfig(item.fileType).border;
                const fileName = item.path.split('/').pop() || item.path;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => focusAndPanToNode(item)}
                    className="flex items-center justify-between gap-2 px-2 py-1.5 rounded hover:bg-[#171717] text-left transition cursor-pointer group"
                  >
                    <div className="flex flex-col truncate">
                      <span className="text-xs font-semibold text-zinc-200 group-hover:text-white truncate">
                        {fileName}
                      </span>
                      <span className="text-[10px] text-zinc-400 font-mono truncate">
                        {item.path}
                      </span>
                    </div>
                    <span
                      className="text-[9px] font-mono px-1.5 py-0.5 rounded uppercase font-semibold shrink-0"
                      style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}
                    >
                      {item.fileType}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {selectedNodeId && (
          <div className="flex items-center gap-1 bg-[#000000]/90 backdrop-blur-md border border-[#262626] rounded-md p-1 shadow-md text-xs">
            <button
              type="button"
              onClick={handleClearFocus}
              className="px-2 py-1 rounded bg-[#171717] hover:bg-[#262626] text-zinc-300 hover:text-white transition flex items-center gap-1 cursor-pointer font-medium text-[11px]"
              title="ยกเลิกการ Focus โหนด (Esc)"
            >
              <X className="w-3 h-3 text-rose-400" />
              <span>ล้าง Focus</span>
            </button>
            <div className="h-3 w-[1px] bg-[#262626]" />
            <div className="flex items-center bg-[#0a0a0a] rounded p-0.5 border border-[#262626]">
              <button
                type="button"
                onClick={() => setTraceMode('full')}
                className={`px-2 py-0.5 rounded text-[10px] font-medium transition cursor-pointer ${
                  traceMode === 'full'
                    ? 'bg-white text-black font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title="เรืองแสงสืบย้อนต้นทางและปลายทางครบทั้งสาย"
              >
                ทั้งสาย
              </button>
              <button
                type="button"
                onClick={() => setTraceMode('direct')}
                className={`px-2 py-0.5 rounded text-[10px] font-medium transition cursor-pointer ${
                  traceMode === 'direct'
                    ? 'bg-white text-black font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title="เรืองแสงเฉพาะโหนดที่เชื่อมต่อติดกันโดยตรง"
              >
                1-Step
              </button>
            </div>
          </div>
        )}

        <div ref={settingsMenuRef} className="relative">
          <div className="flex items-center gap-1 bg-[#000000]/90 backdrop-blur-md border border-[#262626] rounded-md p-1 shadow-md text-xs">
            <button
              type="button"
              onClick={() => setShowMiniMap((prev) => !prev)}
              className={`p-1.5 rounded transition cursor-pointer ${
                showMiniMap ? 'bg-white text-black' : 'text-zinc-400 hover:text-white hover:bg-[#171717]'
              }`}
              title="เปิด/ปิด แผนที่ย่อ MiniMap"
            >
              <MapIcon className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setShowSettingsMenu((prev) => !prev)}
              className={`p-1.5 rounded transition cursor-pointer flex items-center gap-1 ${
                showSettingsMenu ? 'bg-[#262626] text-white' : 'text-zinc-400 hover:text-white hover:bg-[#171717]'
              }`}
              title="ตัวเลือกการแสดงผลเพิ่มเติม"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>
          </div>

          {showSettingsMenu && (
            <div className="absolute right-0 top-full mt-1.5 w-56 bg-[#0a0a0a] border border-[#262626] rounded-md shadow-2xl z-50 p-2 flex flex-col gap-2 text-xs">

              <div>
                <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
                  พฤติกรรมการคลิก
                </span>
                <button
                  type="button"
                  onClick={() => setAutoInspect((prev) => !prev)}
                  className="w-full flex items-center justify-between p-1.5 rounded hover:bg-[#171717] transition cursor-pointer"
                >
                  <span className="text-zinc-300 text-[11px]">ดูโค้ดอัตโนมัติ</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold ${
                      autoInspect ? 'bg-white text-black' : 'bg-[#171717] text-zinc-400'
                    }`}
                  >
                    {autoInspect ? 'เปิด' : 'ปิด'}
                  </span>
                </button>
              </div>

              <div className="h-[1px] bg-[#262626]" />

              <button
                type="button"
                onClick={() => {
                  void fitView({ padding: 0.2, duration: 400 });
                  setShowSettingsMenu(false);
                }}
                className="w-full flex items-center gap-1.5 p-1.5 rounded hover:bg-[#171717] text-zinc-300 hover:text-white transition cursor-pointer text-[11px]"
              >
                <Layers className="w-3.5 h-3.5 text-zinc-400" />
                <span>จัดมุมมองพอดีจอ (Fit View)</span>
              </button>
            </div>
          )}
        </div>

      </div>

      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={(_, node) => {
          setSelectedNodeId((prev) => (prev === node.id ? null : node.id));
          const data = node.data as NodeData;
          if (autoInspect) {
            onSelectNode?.(data.path, data.fileType);
          }
        }}
        onPaneClick={handleClearFocus}
        colorMode="dark"
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        onlyRenderVisibleElements={true}
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#262626" />
        <Controls position="bottom-left" />
        {showMiniMap && (
          <MiniMap
            pannable
            zoomable
            position="bottom-right"
            maskColor="rgba(0, 0, 0, 0.85)"
            style={{
              background: '#0a0a0a',
              border: '1px solid #262626',
              borderRadius: '6px',
              width: 170,
              height: 110,
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.9)',
            }}
            nodeColor={(node) => getNodeColorConfig((node.data as NodeData).fileType).border}
          />
        )}
      </ReactFlow>
    </div>
  );
}

export function FlowCanvas(props: FlowCanvasProps) {
  return (
    <ReactFlowProvider>
      <FlowCanvasInner {...props} />
    </ReactFlowProvider>
  );
}
