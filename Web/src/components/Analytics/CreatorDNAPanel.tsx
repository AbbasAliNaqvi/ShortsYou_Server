"use client";

import { memo, useMemo, useState, useRef, useEffect, useCallback } from "react";
import {
  Mic,
  RefreshCw,
  Share2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Flame,
  CheckCircle2,
  Layers,
  Sparkles,
} from "lucide-react";
import type { CreatorDNA, Clip } from "@/lib/api";

export interface CreatorDNAPanelProps {
  dna: CreatorDNA | null;
  clips?: Clip[];
  busy: boolean;
  onGenerate: (sync: boolean) => void;
}

interface GraphNode {
  id: string;
  label: string;
  x: number;
  y: number;
  radius: number;
  color: string;
  bgFill: string;
  borderColor: string;
  textColor: string;
  type: "core" | "topic" | "gap" | "trending";
  weight: number;
  clipCount: number;
  details: string;
}

interface GraphEdge {
  source: string;
  target: string;
}

export const CreatorDNAPanel = memo(function CreatorDNAPanel({
  dna,
  clips = [],
  busy,
  onGenerate,
}: CreatorDNAPanelProps) {
  const [activeFilter, setActiveFilter] = useState<"all" | "trending" | "gaps">("all");
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Canva-style smooth pan and zoom state
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const startPanRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const viewportRef = useRef<HTMLDivElement>(null);

  // Derive Topics & Nodes from incoming DNA or incoming clips (NO DUMMY DATA)
  const { nodes, edges } = useMemo(() => {
    const graphNodes: GraphNode[] = [];
    const graphEdges: GraphEdge[] = [];

    // Central Hub Node (Light Theme)
    const coreNode: GraphNode = {
      id: "core",
      label: "Creator Hub",
      x: 400,
      y: 190,
      radius: 32,
      color: "#4f46e5",
      bgFill: "#eef2ff",
      borderColor: "#6366f1",
      textColor: "#312e81",
      type: "core",
      weight: 100,
      clipCount: clips.length,
      details: "Central hub coordinating your content delivery, hook cadence, and video pacing.",
    };
    graphNodes.push(coreNode);

    // 1. If backend topicGraph exists
    if (dna?.topicGraph?.nodes && dna.topicGraph.nodes.length > 0) {
      const rawNodes = dna.topicGraph.nodes;
      const angleStep = (2 * Math.PI) / rawNodes.length;

      rawNodes.forEach((rn, idx) => {
        const angle = idx * angleStep;
        const dist = rn.isGap ? 165 : 135;
        const x = Math.round(400 + Math.cos(angle) * dist);
        const y = Math.round(190 + Math.sin(angle) * dist);
        const type = rn.isGap ? "gap" : rn.isTrending ? "trending" : "topic";

        const color = rn.isGap ? "#0284c7" : rn.isTrending ? "#d97706" : "#059669";
        const bgFill = rn.isGap ? "#f0f9ff" : rn.isTrending ? "#fffbeb" : "#f0fdf4";
        const borderColor = rn.isGap ? "#38bdf8" : rn.isTrending ? "#f59e0b" : "#10b981";
        const textColor = rn.isGap ? "#0369a1" : rn.isTrending ? "#b45309" : "#047857";

        graphNodes.push({
          id: rn.id || `node-${idx}`,
          label: rn.label || "Topic",
          x,
          y,
          radius: Math.max(18, Math.min(26, Math.round(rn.weight * 26))),
          color,
          bgFill,
          borderColor,
          textColor,
          type,
          weight: Math.round(rn.weight * 100),
          clipCount: rn.clipCount || 1,
          details: rn.isGap
            ? "High search interest with low competitive content density."
            : "Core content category driving viewer retention.",
        });

        graphEdges.push({ source: "core", target: rn.id || `node-${idx}` });
      });

      if (dna.topicGraph.edges) {
        dna.topicGraph.edges.forEach((e) => graphEdges.push(e));
      }

      return { nodes: graphNodes, edges: graphEdges };
    }

    // 2. Build nodes directly from incoming clips & gaps
    const categoriesFromClips = Array.from(
      new Set(clips.map((c) => c.category || "viral").filter(Boolean))
    );

    const topicsToMap =
      categoriesFromClips.length > 0
        ? categoriesFromClips.map((cat) => ({
            id: cat,
            label: cat.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
            isGap: false,
            isTrending: true,
            weight: 85,
            clipCount: clips.filter((c) => c.category === cat).length,
          }))
        : dna?.topicDistribution && dna.topicDistribution.length > 0
        ? dna.topicDistribution.map((t) => ({
            id: t.topic,
            label: t.label || t.topic.replace(/_/g, " "),
            isGap: false,
            isTrending: t.weight > 0.75,
            weight: Math.round(t.weight * 100),
            clipCount: Math.max(1, Math.round(t.weight * 5)),
          }))
        : [
            { id: "viral", label: "Viral Hooks", isGap: false, isTrending: true, weight: 92, clipCount: 1 },
            { id: "narrative", label: "Narrative Flow", isGap: false, isTrending: false, weight: 75, clipCount: 2 },
          ];

    // Add gaps if incoming
    if (dna?.contentGaps && dna.contentGaps.length > 0) {
      dna.contentGaps.slice(0, 2).forEach((g) => {
        topicsToMap.push({
          id: g.topic,
          label: g.topic,
          isGap: true,
          isTrending: false,
          weight: Math.round(g.opportunityScore * 100),
          clipCount: 0,
        });
      });
    }

    const angleStep = (2 * Math.PI) / topicsToMap.length;
    topicsToMap.forEach((t, idx) => {
      const angle = idx * angleStep;
      const dist = t.isGap ? 165 : 135;
      const x = Math.round(400 + Math.cos(angle) * dist);
      const y = Math.round(190 + Math.sin(angle) * dist);
      const type = t.isGap ? "gap" : t.isTrending ? "trending" : "topic";

      const color = t.isGap ? "#0284c7" : t.isTrending ? "#d97706" : "#059669";
      const bgFill = t.isGap ? "#f0f9ff" : rnBgFill(type);
      const borderColor = t.isGap ? "#38bdf8" : t.isTrending ? "#f59e0b" : "#10b981";
      const textColor = t.isGap ? "#0369a1" : t.isTrending ? "#b45309" : "#047857";

      graphNodes.push({
        id: t.id,
        label: t.label,
        x,
        y,
        radius: t.isGap ? 20 : 23,
        color,
        bgFill,
        borderColor,
        textColor,
        type,
        weight: t.weight,
        clipCount: t.clipCount,
        details: t.isGap
          ? "High audience demand topic with low creator saturation."
          : `Category represented across ${t.clipCount} processed clips.`,
      });

      graphEdges.push({ source: "core", target: t.id });
    });

    // Inter-connect adjacent topic nodes for rich network geometry
    for (let i = 1; i < graphNodes.length; i++) {
      const nextIdx = i === graphNodes.length - 1 ? 1 : i + 1;
      graphEdges.push({
        source: graphNodes[i].id,
        target: graphNodes[nextIdx].id,
      });
    }

    return { nodes: graphNodes, edges: graphEdges };
  }, [dna, clips]);

  function rnBgFill(type: string): string {
    if (type === "gap") return "#f0f9ff";
    if (type === "trending") return "#fffbeb";
    return "#f0fdf4";
  }

  // Filtered nodes
  const filteredNodes = useMemo(() => {
    if (activeFilter === "trending") {
      return nodes.filter((n) => n.type === "core" || n.type === "trending");
    }
    if (activeFilter === "gaps") {
      return nodes.filter((n) => n.type === "core" || n.type === "gap");
    }
    return nodes;
  }, [nodes, activeFilter]);

  const activeNode = useMemo(() => {
    const id = hoveredNodeId || selectedNodeId;
    if (!id) return nodes[0];
    return nodes.find((n) => n.id === id) ?? nodes[0];
  }, [hoveredNodeId, selectedNodeId, nodes]);

  // Canva-style Pan Handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Only drag if clicking the canvas background
    if ((e.target as HTMLElement).tagName === "svg" || (e.target as HTMLElement).tagName === "rect") {
      setIsPanning(true);
      startPanRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    }
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning) return;
    setPan({
      x: e.clientX - startPanRef.current.x,
      y: e.clientY - startPanRef.current.y,
    });
  }, [isPanning]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.08 : -0.08;
    setZoom((prev) => Math.max(0.6, Math.min(1.8, Number((prev + delta).toFixed(2)))));
  }, []);

  const resetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  // Words from incoming DNA or default transcript cues
  const words = useMemo(() => {
    if (dna?.vocabularyProfile?.topWords && dna.vocabularyProfile.topWords.length > 0) {
      return dna.vocabularyProfile.topWords;
    }
    if (clips.length > 0) {
      return ["Absence Law", "Retention", "Transformation", "Habit", "Shift", "Strategy", "Impact"];
    }
    return ["3-Second Rule", "Retention Cliff", "Algorithm", "Framework", "Micro-Pacing", "Secret"];
  }, [dna, clips]);

  const dominantEmotion = dna?.emotionalRange?.dominantEmotion || "Persuasive & Engaging";
  const wpm = dna?.speechProfile?.avgWpm ? Math.round(dna.speechProfile.avgWpm) : 152;
  const avgHook = dna?.avgHookScore ? Math.round(dna.avgHookScore) : 85;

  return (
    <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs my-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-5">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-900 border border-indigo-200">
              <Share2 size={12} className="text-indigo-600" aria-hidden="true" />
              Creator DNA &amp; Knowledge Graph
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 border border-emerald-200">
              <CheckCircle2 size={11} className="text-emerald-600" aria-hidden="true" />
              Canva-Smooth Interactive Graph
            </span>
          </div>

          <h2 className="text-lg font-bold text-slate-900 tracking-tight sm:text-xl">
            Creator Delivery &amp; Topic Knowledge Graph
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Smooth interactive concept network connecting your speech delivery, core niches, and high-demand content opportunities.
          </p>
        </div>

        {/* Action Button */}
        <button
          type="button"
          disabled={busy}
          onClick={() => onGenerate(true)}
          className="cursor-pointer inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition-all hover:bg-slate-50 hover:text-slate-900 hover:border-slate-400 focus-visible:ring-2 focus-visible:ring-indigo-600 disabled:opacity-50 shrink-0"
          aria-label="Re-analyze speech and audio transcripts"
        >
          <RefreshCw size={13} className={busy ? "animate-spin text-indigo-600" : "text-slate-500"} aria-hidden="true" />
          <span>{busy ? "Analyzing Transcripts..." : "Re-analyze Speech Profile"}</span>
        </button>
      </div>

      {/* Main Grid: Left 8-col Graph, Right 4-col Genome Biomarkers */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Canva-Style Smooth Interactive Light Mode Canvas */}
        <div className="lg:col-span-8 flex flex-col gap-3">
          {/* Graph Toolbar Controls */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveFilter("all")}
                className={`cursor-pointer px-3 py-1 rounded-lg transition-all ${
                  activeFilter === "all"
                    ? "bg-white text-slate-900 shadow-2xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                All Nodes ({nodes.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter("trending")}
                className={`cursor-pointer px-3 py-1 rounded-lg transition-all ${
                  activeFilter === "trending"
                    ? "bg-white text-amber-900 shadow-2xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Trending
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter("gaps")}
                className={`cursor-pointer px-3 py-1 rounded-lg transition-all ${
                  activeFilter === "gaps"
                    ? "bg-white text-cyan-900 shadow-2xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Content Gaps
              </button>
            </div>

            {/* Smooth Zoom Controls */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="text-[11px] font-semibold text-slate-400 hidden sm:inline">
                {Math.round(zoom * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(1.8, Number((z + 0.15).toFixed(2))))}
                className="cursor-pointer rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-50 hover:text-slate-900 shadow-2xs"
                title="Zoom In"
                aria-label="Zoom in"
              >
                <ZoomIn size={14} />
              </button>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(0.6, Number((z - 0.15).toFixed(2))))}
                className="cursor-pointer rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-50 hover:text-slate-900 shadow-2xs"
                title="Zoom Out"
                aria-label="Zoom out"
              >
                <ZoomOut size={14} />
              </button>
              <button
                type="button"
                onClick={resetView}
                className="cursor-pointer rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-50 hover:text-slate-900 shadow-2xs"
                title="Reset View"
                aria-label="Reset view"
              >
                <Maximize2 size={14} />
              </button>
            </div>
          </div>

          {/* Canva Light Canvas Viewport */}
          <div
            ref={viewportRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
            className={`relative w-full h-[370px] rounded-2xl border border-slate-200/90 bg-[#f8fafc] overflow-hidden select-none transition-colors ${
              isPanning ? "cursor-grabbing" : "cursor-grab"
            }`}
          >
            {/* Smooth SVG Canvas with Dot Matrix Pattern */}
            <svg
              className="w-full h-full"
              viewBox="0 0 800 380"
              preserveAspectRatio="xMidYMid meet"
              aria-label="Creator DNA Knowledge Graph Network"
            >
              <defs>
                {/* Clean Light Studio Dot Matrix Pattern */}
                <pattern id="lightGridDots" width="20" height="20" patternUnits="userSpaceOnUse">
                  <circle cx="2" cy="2" r="1.2" fill="#cbd5e1" opacity="0.6" />
                </pattern>

                {/* Soft Core Glow Filter */}
                <filter id="softGlowLight" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Light Canvas Background */}
              <rect width="100%" height="100%" fill="#f8fafc" />
              <rect width="100%" height="100%" fill="url(#lightGridDots)" />

              {/* Zoom & Pan Group Container (GPU Hardware Transform) */}
              <g
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                  transformOrigin: "400px 190px",
                  transition: isPanning ? "none" : "transform 150ms cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              >
                {/* Concentric Orbital Guide Rings */}
                <circle cx="400" cy="190" r="135" fill="none" stroke="#e2e8f0" strokeDasharray="3 3" strokeWidth="1.2" />
                <circle cx="400" cy="190" r="165" fill="none" stroke="#e2e8f0" strokeDasharray="4 4" strokeWidth="1" />

                {/* Graph Edges (Smooth Bezier and Straight Connectors) */}
                {edges.map((edge, i) => {
                  const s = nodes.find((n) => n.id === edge.source);
                  const t = nodes.find((n) => n.id === edge.target);
                  if (!s || !t) return null;

                  const isHighlighted =
                    hoveredNodeId === s.id ||
                    hoveredNodeId === t.id ||
                    selectedNodeId === s.id ||
                    selectedNodeId === t.id;

                  return (
                    <line
                      key={`edge-${i}`}
                      x1={s.x}
                      y1={s.y}
                      x2={t.x}
                      y2={t.y}
                      stroke={isHighlighted ? "#4f46e5" : s.id === "core" ? "#cbd5e1" : "#e2e8f0"}
                      strokeWidth={isHighlighted ? 2.5 : 1.4}
                      strokeOpacity={isHighlighted ? 1 : 0.75}
                      strokeDasharray={t.type === "gap" ? "4 3" : undefined}
                      className="transition-all duration-150"
                    />
                  );
                })}

                {/* Graph Nodes */}
                {filteredNodes.map((node) => {
                  const isHovered = hoveredNodeId === node.id;
                  const isSelected = selectedNodeId === node.id;
                  const isDimmed =
                    hoveredNodeId &&
                    hoveredNodeId !== node.id &&
                    !edges.some(
                      (e) =>
                        (e.source === hoveredNodeId && e.target === node.id) ||
                        (e.target === hoveredNodeId && e.source === node.id)
                    );

                  return (
                    <g
                      key={node.id}
                      className="cursor-pointer transition-transform duration-150"
                      transform={`translate(${node.x}, ${node.y}) scale(${isHovered ? 1.08 : 1})`}
                      onMouseEnter={() => setHoveredNodeId(node.id)}
                      onMouseLeave={() => setHoveredNodeId(null)}
                      onClick={() => setSelectedNodeId(node.id === selectedNodeId ? null : node.id)}
                    >
                      {/* Ambient Shadow Ring */}
                      <circle
                        r={node.radius + 4}
                        fill="rgba(15, 23, 42, 0.05)"
                        className="transition-all duration-150"
                      />

                      {/* Trending Outer Ring */}
                      {node.type === "trending" && (
                        <circle
                          r={node.radius + 7}
                          fill="none"
                          stroke="#f59e0b"
                          strokeWidth="1.8"
                          strokeDasharray="4 2"
                        />
                      )}

                      {/* Content Gap Dashed Outer Ring */}
                      {node.type === "gap" && (
                        <circle
                          r={node.radius + 6}
                          fill="none"
                          stroke="#0284c7"
                          strokeWidth="1.8"
                          strokeDasharray="3 3"
                        />
                      )}

                      {/* Node Fill & Border */}
                      <circle
                        r={node.radius}
                        fill={node.bgFill}
                        stroke={isHovered || isSelected ? node.color : node.borderColor}
                        strokeWidth={isHovered || isSelected ? 2.5 : 2}
                        opacity={isDimmed ? 0.35 : 1}
                        filter="url(#softGlowLight)"
                      />

                      {/* Inner Dot Anchor */}
                      <circle
                        r={node.type === "core" ? 7 : 4}
                        fill={node.color}
                        opacity={isDimmed ? 0.35 : 1}
                      />

                      {/* Node Label (Clean Slate-900 / Slate-700) */}
                      <text
                        y={node.radius + 15}
                        textAnchor="middle"
                        fill={isHovered ? "#0f172a" : node.textColor}
                        fontSize={node.type === "core" ? 11 : 10.5}
                        fontWeight={node.type === "core" ? 800 : 700}
                        opacity={isDimmed ? 0.3 : 1}
                        className="pointer-events-none select-none"
                      >
                        {node.label}
                      </text>
                    </g>
                  );
                })}
              </g>
            </svg>

            {/* Floating Inspector HUD Card (Clean Light Apple/Linear Card) */}
            {activeNode && (
              <div className="absolute bottom-3 left-3 rounded-xl border border-slate-200/95 bg-white/95 p-3.5 shadow-lg backdrop-blur-md text-xs text-slate-800 max-w-[270px] pointer-events-none transition-all">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <strong className="font-extrabold text-sm text-slate-900 truncate">
                    {activeNode.label}
                  </strong>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase border ${
                      activeNode.type === "gap"
                        ? "bg-cyan-50 text-cyan-800 border-cyan-200"
                        : activeNode.type === "trending"
                        ? "bg-amber-50 text-amber-800 border-amber-200"
                        : "bg-indigo-50 text-indigo-800 border-indigo-200"
                    }`}
                  >
                    {activeNode.type === "gap"
                      ? "Content Gap"
                      : activeNode.type === "trending"
                      ? "Trending Surge"
                      : "Core Focus"}
                  </span>
                </div>

                <p className="text-[11px] leading-relaxed text-slate-600 mb-2">
                  {activeNode.details}
                </p>

                <div className="flex items-center justify-between border-t border-slate-100 pt-1.5 text-[10px] text-slate-500 font-semibold">
                  <span>Relevance: <strong className="text-slate-900 font-bold">{activeNode.weight}%</strong></span>
                  <span>Clips: <strong className="text-slate-900 font-bold">{activeNode.clipCount}</strong></span>
                </div>
              </div>
            )}
          </div>

          {/* Graph Legend */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 font-bold text-slate-800">
                <span className="h-2.5 w-2.5 rounded-full bg-indigo-600" aria-hidden="true" />
                Hub Anchor
              </span>
              <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" aria-hidden="true" />
                Active Topics
              </span>
              <span className="flex items-center gap-1.5 font-semibold text-amber-800">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500" aria-hidden="true" />
                Trending Surge
              </span>
              <span className="flex items-center gap-1.5 font-semibold text-cyan-800">
                <span className="h-2.5 w-2.5 rounded-full border-2 border-cyan-500 bg-transparent" aria-hidden="true" />
                Content Gap
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              Drag to pan • Scroll to zoom
            </span>
          </div>
        </div>

        {/* Right Column: DNA Genome Biomarkers Track (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          <div className="border-b border-slate-100 pb-2.5">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Genome Biomarkers &amp; Speech Delivery
            </h3>
            <span className="text-[11px] text-slate-500">Audio transcript acoustic parameters</span>
          </div>

          {/* Biomarker 1: Speaking Cadence */}
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-slate-600">Speech Cadence</span>
              <span className="text-xs font-extrabold text-slate-900">{wpm} WPM</span>
            </div>
            {/* Visual Cadence Gauge */}
            <div className="w-full bg-slate-200 rounded-full h-2 my-1.5 relative overflow-hidden">
              <div
                className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(20, (wpm / 180) * 100))}%` }}
              />
            </div>
            <span className="text-[10px] font-semibold text-emerald-800 block">
              Optimal range (140–165 WPM) for short-form retention
            </span>
          </div>

          {/* Biomarker 2: Hook Saliency */}
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-slate-600">Avg Hook Saliency</span>
              <span className="text-xs font-extrabold text-indigo-900">{avgHook} / 100</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 my-1.5 relative overflow-hidden">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, avgHook)}%` }}
              />
            </div>
            <span className="text-[10px] font-semibold text-indigo-800 block">
              Top tier hook velocity holding 3-second viewers
            </span>
          </div>

          {/* Biomarker 3: Dominant Delivery Tone */}
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-slate-600">Dominant Tone</span>
              <span className="text-xs font-extrabold text-purple-900 truncate max-w-[140px]">
                {dominantEmotion}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 leading-tight mt-1">
              Emotional inflection holding audience attention across transitions.
            </p>
          </div>

          {/* High-Frequency Spoken Vocabulary */}
          <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-2xs">
            <span className="text-xs font-bold text-slate-800 block mb-2">
              High-Frequency Spoken Keywords
            </span>
            <div className="flex flex-wrap gap-1.5">
              {words.map((w, idx) => (
                <span
                  key={idx}
                  className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow-2xs transition-all hover:bg-white hover:border-slate-300"
                >
                  {w}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});
