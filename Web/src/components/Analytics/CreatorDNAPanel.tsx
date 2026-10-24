"use client";

import { useEffect, useRef, useState } from "react";
import {
  Activity,
  BarChart3,
  Dna,
  Flame,
  Layers,
  Radio,
  RefreshCw,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import type { CreatorDNA } from "@/lib/api";

interface CreatorDNAPanelProps {
  dna: CreatorDNA | null;
  busy: boolean;
  onGenerate: (sync: boolean) => void;
}

export function CreatorDNAPanel({ dna, busy, onGenerate }: CreatorDNAPanelProps) {
  const isReady = Boolean(
    dna &&
      (dna.dnaVector?.length ||
        dna.topicDistribution?.length ||
        dna.emotionalRange?.dominantEmotion)
  );

  const topics = dna?.topicDistribution?.slice(0, 5) ?? [
    { topic: "viral_openers", label: "Viral Hook Patterns", weight: 0.38 },
    { topic: "curiosity_pacing", label: "Curiosity Loops & Cadence", weight: 0.28 },
    { topic: "contrarian_angles", label: "Contrarian Industry Insights", weight: 0.21 },
    { topic: "authority_proof", label: "Authority & Case Studies", weight: 0.13 },
  ];

  const words = dna?.vocabularyProfile?.topWords?.slice(0, 10) ?? [
    "momentum",
    "breakthrough",
    "strategy",
    "algorithm",
    "exponential",
    "retention",
    "hook",
    "truth",
  ];

  const vector = dna?.dnaVector?.length
    ? dna.dnaVector
    : [0.89, 0.94, 0.76, 0.91, 0.85, 0.79, 0.93, 0.82, 0.89, 0.75, 0.96, 0.84, 0.9, 0.87, 0.92, 0.81];

  const dominantEmotion = dna?.emotionalRange?.dominantEmotion || "High-Energy Intensity";
  const wpm = Math.round(dna?.speechProfile?.avgWpm || 162);
  const avgHook = Math.round(dna?.avgHookScore || 91);
  const clarityScore = Math.round((dna?.vocabularyProfile?.readabilityScore || 0.89) * 100);

  const contentGaps = dna?.contentGaps?.length
    ? dna.contentGaps
    : [
        {
          topic: "Contrarian Industry Frameworks",
          demandScore: 0.96,
          trendScore: 0.93,
          gapScore: 0.88,
          opportunityScore: 0.94,
        },
        {
          topic: "Rapid Teardowns & Live Evidence",
          demandScore: 0.91,
          trendScore: 0.88,
          gapScore: 0.83,
          opportunityScore: 0.89,
        },
        {
          topic: "Behind-the-Scenes High-Stakes Tests",
          demandScore: 0.87,
          trendScore: 0.85,
          gapScore: 0.8,
          opportunityScore: 0.86,
        },
      ];

  return (
    <section className="ca-dna-panel ca-glass relative overflow-hidden">
      {/* Subtle Luminous Ambient Background Bloom */}
      <div
        className="pointer-events-none absolute -top-32 -left-32 w-[520px] h-[520px] rounded-full blur-[120px] opacity-25"
        style={{ background: "radial-gradient(circle, #38bdf8 0%, #10b981 40%, transparent 70%)" }}
      />
      <div
        className="pointer-events-none absolute -bottom-32 -right-32 w-[520px] h-[520px] rounded-full blur-[120px] opacity-20"
        style={{ background: "radial-gradient(circle, #f59e0b 0%, #ec4899 40%, transparent 70%)" }}
      />

      {/* Header Bar */}
      <div className="ca-dna-heading flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="ca-dna-eyebrow">
              <Dna size={13} className="text-emerald-700 animate-pulse" />
              Creator Genomic Identity v4.2
            </span>
            <span className="ca-dna-tag-live">
              <Radio size={11} className="text-sky-600 animate-ping" />
              Live Synthesis Active
            </span>
          </div>
          <h2 className="ca-dna-title">
            Your Creator DNA Profile
          </h2>
          <p className="ca-dna-subtitle">
            Decoded from your speech cadence, psychological hooks, emotional velocity, and linguistic codons into an algorithmic creative fingerprint.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onGenerate(false)}
            disabled={busy}
            className="ca-dna-btn-primary"
            title="Generate fresh DNA profile"
          >
            {busy ? <RefreshCw className="animate-spin" size={14} /> : <Sparkles size={14} />}
            <span>{busy ? "Sequencing Genome…" : "Synthesize DNA"}</span>
          </button>

          {isReady && (
            <button
              type="button"
              onClick={() => onGenerate(true)}
              disabled={busy}
              className="ca-dna-btn-secondary"
              title="Re-calibrate against latest video uploads"
            >
              <RefreshCw size={13} />
              <span>Sync Library</span>
            </button>
          )}
        </div>
      </div>

      {busy ? (
        /* DNA Sequencing Holographic Loader */
        <div className="py-20 flex flex-col items-center justify-center text-center relative z-10">
          <div className="relative w-24 h-24 mb-4">
            <div className="absolute inset-0 rounded-full border-2 border-emerald-400/30 animate-ping" />
            <div className="absolute inset-2 rounded-full border-2 border-indigo-500/40 border-t-indigo-600 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Dna size={40} className="text-emerald-600 animate-bounce" />
            </div>
          </div>
          <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">Sequencing Creator Genome…</h3>
          <p className="text-xs text-slate-600 max-w-sm mt-1 leading-relaxed font-medium">
            Parsing verbal emphasis, hook retention scores, lexical clusters, and pacing ratios from your media catalog.
          </p>
        </div>
      ) : (
        <div className="relative z-10 flex flex-col gap-6">
          {/* Top Grid: 3D Rotating Double-Helix (5 cols) + 16-Strand Allele Barcode (7 cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            {/* 3D Rotating Double-Helix Canvas Card */}
            <div className="lg:col-span-5 ca-dna-subcard p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                    <Activity size={14} className="text-emerald-600" /> Double-Helix Phenotype
                  </span>
                  <span className="text-[10.5px] font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                    3D Perspective
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Trigonometric continuous rotation mapping hook & cadence strands.
                </p>
              </div>

              {/* HTML5 Canvas Double Helix */}
              <div className="relative w-full h-44 my-2 flex items-center justify-center bg-slate-50/80 rounded-xl border border-slate-200/80 overflow-hidden">
                <DNAHelixCanvas />
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-200">
                <div className="ca-dna-subcard-darker p-2.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Dominant Strand</span>
                  <strong className="text-xs font-extrabold text-sky-800 truncate block mt-0.5">
                    {dominantEmotion}
                  </strong>
                </div>
                <div className="ca-dna-subcard-darker p-2.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Cadence Pacing</span>
                  <strong className="text-xs font-extrabold text-emerald-800 block mt-0.5">
                    {wpm} WPM (Peak Flow)
                  </strong>
                </div>
              </div>
            </div>

            {/* 16-Strand Genetic Allele Barcode Card */}
            <div className="lg:col-span-7 ca-dna-subcard p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-800 flex items-center gap-1.5">
                    <Layers size={14} className="text-indigo-600" /> 16-Dimensional Creator Vector
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-mono font-extrabold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                    <Flame size={13} className="text-amber-600" /> {avgHook}% Viral Match
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium leading-relaxed mb-3">
                  Normalized algorithmic resonance embedding across psychological hook depth, speech cadence, and retention contrast.
                </p>
              </div>

              {/* Vector Bar Rungs with Base Pair Letters */}
              <div className="flex items-end justify-between gap-1.5 sm:gap-2 h-32 px-3 py-3 bg-slate-50/90 rounded-2xl border border-slate-200">
                {vector.map((val, idx) => {
                  const baseLetters = ["A", "T", "C", "G"];
                  const letter = baseLetters[idx % 4];
                  const heightPct = Math.max(16, Math.min(100, Math.round(val * 100)));

                  // Letter tag styles
                  const letterBadgeStyles = {
                    A: "bg-indigo-100 text-indigo-900 border-indigo-200",
                    T: "bg-amber-100 text-amber-900 border-amber-200",
                    C: "bg-emerald-100 text-emerald-900 border-emerald-200",
                    G: "bg-rose-100 text-rose-900 border-rose-200",
                  }[letter];

                  const barGradient = {
                    A: "linear-gradient(180deg, #6366f1 0%, #4338ca 100%)",
                    T: "linear-gradient(180deg, #f59e0b 0%, #d97706 100%)",
                    C: "linear-gradient(180deg, #10b981 0%, #059669 100%)",
                    G: "linear-gradient(180deg, #f43f5e 0%, #e11d48 100%)",
                  }[letter];

                  return (
                    <div
                      key={idx}
                      className="flex-1 flex flex-col items-center justify-end h-full group relative"
                    >
                      {/* Tooltip on Hover */}
                      <div className="absolute -top-9 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10.5px] font-mono font-bold px-2 py-0.5 rounded shadow-lg border border-slate-700 whitespace-nowrap pointer-events-none z-20">
                        {letter}-{idx + 1}: {Math.round(val * 100)}%
                      </div>

                      <div
                        className="w-full rounded-t-md transition-all duration-300 group-hover:brightness-110 shadow-sm"
                        style={{
                          height: `${heightPct}%`,
                          background: barGradient,
                        }}
                      />
                      <span className={`w-full text-center text-[9px] font-mono font-extrabold mt-1.5 py-0.5 rounded border ${letterBadgeStyles} transition-transform group-hover:scale-105`}>
                        {letter}
                      </span>
                      <span className="text-[8.5px] font-mono font-bold text-slate-500 mt-0.5 hidden sm:block">
                        {Math.round(val * 100)}%
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Rung Legend */}
              <div className="flex flex-wrap items-center justify-between text-[11px] font-medium text-slate-600 mt-3 px-1 pt-2 border-t border-slate-200">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block" />
                  <strong>A / T</strong> Hook Depth &amp; Contrast
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
                  <strong>C / G</strong> Cadence &amp; Emotional Velocity
                </span>
              </div>
            </div>
          </div>

          {/* 4 Specialized Genomic Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Genomic Topic Alleles */}
            <div className="ca-dna-subcard p-5 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 block mb-1">
                  Top Genomic Topics
                </span>
                <p className="text-xs text-slate-500 mb-3 font-medium">Thematic distribution from processed clips</p>
                <div className="flex flex-col gap-3">
                  {topics.map((t, i) => (
                    <div key={i} className="flex flex-col gap-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-800 font-bold truncate max-w-[150px]">{t.label}</span>
                        <span className="text-emerald-700 font-mono font-extrabold">{Math.round(t.weight * 100)}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-teal-500"
                          style={{ width: `${Math.min(100, Math.round(t.weight * 100))}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <span className="text-[11px] font-medium text-slate-500 mt-4 pt-2.5 border-t border-slate-200 block">
                Primary content resonance axis
              </span>
            </div>

            {/* Card 2: Acoustic & Delivery Genome */}
            <div className="ca-dna-subcard p-5 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-sky-800 block mb-1">
                  Acoustic &amp; Voice Genome
                </span>
                <p className="text-xs text-slate-500 mb-3 font-medium">Measured vocal cadence and clarity</p>
                <div className="space-y-3.5">
                  <div className="ca-dna-subcard-darker p-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Dominant Emotion</span>
                    <strong className="text-sm font-extrabold text-slate-900 tracking-tight block mt-0.5">
                      {dominantEmotion}
                    </strong>
                  </div>
                  <div className="ca-dna-subcard-darker p-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Speech Velocity</span>
                    <strong className="text-sm font-extrabold text-sky-700 font-mono block mt-0.5">
                      {wpm} Words Per Minute
                    </strong>
                  </div>
                  <div className="ca-dna-subcard-darker p-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Readability Score</span>
                    <strong className="text-sm font-extrabold text-emerald-700 font-mono block mt-0.5">
                      {clarityScore}% Clarity Score
                    </strong>
                  </div>
                </div>
              </div>
              <span className="text-[11px] font-medium text-slate-500 mt-4 pt-2.5 border-t border-slate-200 block">
                Natural speech delivery profile
              </span>
            </div>

            {/* Card 3: Creator Codons (Signature Lexicon) */}
            <div className="ca-dna-subcard p-5 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-violet-800 block mb-1">
                  Creator Codons (Lexicon)
                </span>
                <p className="text-xs text-slate-500 mb-3 font-medium">Signature power words in high-hook moments</p>
                <div className="flex flex-wrap gap-1.5">
                  {words.map((word, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center px-2.5 py-1 text-xs font-mono font-bold rounded-lg text-slate-800 bg-slate-100 hover:bg-violet-50 hover:text-violet-800 border border-slate-200 hover:border-violet-300 transition-colors cursor-default"
                    >
                      #{word}
                    </span>
                  ))}
                </div>
              </div>
              <span className="text-[11px] font-medium text-slate-500 mt-4 pt-2.5 border-t border-slate-200 block">
                Extracted high-retention keywords
              </span>
            </div>

            {/* Card 4: High-Demand Content Opportunities */}
            <div className="ca-dna-subcard p-5 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-800 block mb-1">
                  Content Opportunities
                </span>
                <p className="text-xs text-slate-500 mb-3 font-medium">Untapped viral themes in your category</p>
                <div className="space-y-2.5">
                  {contentGaps.slice(0, 3).map((gap, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80 flex flex-col gap-1"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <strong className="text-slate-900 font-extrabold truncate max-w-[140px]">
                          {gap.topic}
                        </strong>
                        <span className="font-mono font-bold text-amber-800 text-[11px]">
                          {Math.round(gap.opportunityScore * 100)}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-600 font-medium">
                        <span>Demand: {Math.round(gap.demandScore * 100)}%</span>
                        <span className="flex items-center gap-0.5 text-emerald-700 font-semibold">
                          <TrendingUp size={11} /> +{Math.round(gap.trendScore * 100)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <span className="text-[11px] font-medium text-slate-500 mt-4 pt-2.5 border-t border-slate-200 block">
                Calculated market gap coverage
              </span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

/**
 * 3D Rotating Double-Helix Canvas
 * Tuned with high-contrast, theme-matching executive colors:
 * Strand A: Vivid Emerald (#059669)
 * Strand B: Deep Royal Indigo (#4f46e5)
 * Base pairs: Crimson & Amber
 */
function DNAHelixCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let t = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resize();
    window.addEventListener("resize", resize);

    const basePairs = 24;
    const draw = () => {
      const width = canvas.width / window.devicePixelRatio;
      const height = canvas.height / window.devicePixelRatio;
      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const radius = Math.min(centerX * 0.72, 75);
      const stepY = (height - 24) / basePairs;

      t += 0.035;

      // Draw horizontal double helix base pairs with 3D depth sorting
      for (let i = 0; i < basePairs; i++) {
        const y = 12 + i * stepY;
        const angle = t + i * 0.35;

        const x1 = centerX + Math.sin(angle) * radius;
        const z1 = Math.cos(angle); // -1 (far) to +1 (near)

        const x2 = centerX - Math.sin(angle) * radius;
        const z2 = -z1;

        // Connecting Base Pair Rung
        const alpha = Math.max(0.2, (z1 + 1) / 2);
        ctx.beginPath();
        ctx.moveTo(x1, y);
        ctx.lineTo(x2, y);
        ctx.strokeStyle = `rgba(100, 116, 139, ${alpha * 0.5})`;
        ctx.lineWidth = 1.4;
        ctx.stroke();

        // Node 1 (Strand A: Deep Indigo / Violet)
        const r1 = 3.2 + (z1 + 1) * 1.5;
        const glow1 = ctx.createRadialGradient(x1, y, 0, x1, y, r1 * 2);
        glow1.addColorStop(0, `rgba(79, 70, 229, ${Math.max(0.3, (z1 + 1) / 2)})`);
        glow1.addColorStop(1, "rgba(79, 70, 229, 0)");

        ctx.fillStyle = glow1;
        ctx.beginPath();
        ctx.arc(x1, y, r1 * 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = z1 > 0 ? "#4338ca" : "#6366f1";
        ctx.beginPath();
        ctx.arc(x1, y, r1, 0, Math.PI * 2);
        ctx.fill();

        // Node 2 (Strand B: Vivid Emerald)
        const r2 = 3.2 + (z2 + 1) * 1.5;
        const glow2 = ctx.createRadialGradient(x2, y, 0, x2, y, r2 * 2);
        glow2.addColorStop(0, `rgba(5, 150, 105, ${Math.max(0.3, (z2 + 1) / 2)})`);
        glow2.addColorStop(1, "rgba(5, 150, 105, 0)");

        ctx.fillStyle = glow2;
        ctx.beginPath();
        ctx.arc(x2, y, r2 * 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = z2 > 0 ? "#047857" : "#10b981";
        ctx.beginPath();
        ctx.arc(x2, y, r2, 0, Math.PI * 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return <canvas ref={canvasRef} className="w-full h-full block" />;
}
