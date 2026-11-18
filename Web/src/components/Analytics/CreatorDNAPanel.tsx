"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Dna,
  Flame,
  RefreshCw,
} from "lucide-react";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
} from "recharts";
import type { CreatorDNA } from "@/lib/api";
import { CardSpotlight } from "@/components/ui/card-spotlight";

interface CreatorDNAPanelProps {
  dna: CreatorDNA | null;
  busy: boolean;
  onGenerate: (sync: boolean) => void;
}

export function CreatorDNAPanel({ dna, busy, onGenerate }: CreatorDNAPanelProps) {
  // Check if real DNA data exists
  const isReady = Boolean(
    dna &&
      ((dna.topicDistribution && dna.topicDistribution.length > 0) ||
        (dna.vocabularyProfile?.topWords && dna.vocabularyProfile.topWords.length > 0) ||
        dna.avgHookScore)
  );

  // Radar Data for Recharts
  const radarData = useMemo(() => {
    if (!dna?.topicDistribution?.length) return [];
    return dna.topicDistribution.map((t) => ({
      subject: t.label || t.topic.replace(/_/g, " "),
      weight: Math.round(t.weight * 100),
      fullMark: 100,
    }));
  }, [dna]);

  const words = dna?.vocabularyProfile?.topWords ?? [];
  const dominantEmotion = dna?.emotionalRange?.dominantEmotion;
  const wpm = dna?.speechProfile?.avgWpm ? Math.round(dna.speechProfile.avgWpm) : null;
  const avgHook = dna?.avgHookScore ? Math.round(dna.avgHookScore) : null;
  const contentGaps = dna?.contentGaps ?? [];

  return (
    <CardSpotlight
      radius={450}
      color="rgba(16, 185, 129, 0.07)"
      className="ca-dna-panel ca-glass my-6 relative overflow-hidden"
    >
      {/* Background ambient lighting */}
      <div
        className="pointer-events-none absolute -top-32 -left-32 w-[400px] h-[400px] rounded-full blur-[100px] opacity-20"
        style={{ background: "radial-gradient(circle, #38bdf8 0%, #10b981 60%, transparent 80%)" }}
      />
      <div
        className="pointer-events-none absolute -bottom-32 -right-32 w-[400px] h-[400px] rounded-full blur-[100px] opacity-15"
        style={{ background: "radial-gradient(circle, #8b5cf6 0%, #ec4899 60%, transparent 80%)" }}
      />

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 border border-emerald-200">
              <Dna size={12} />
              Algorithmic Genome Engine
            </span>
            {isReady && (
              <span className="inline-flex items-center gap-1 rounded-full bg-cyan-50 px-2 py-0.5 text-[11px] font-semibold text-cyan-800 border border-cyan-200">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-500 animate-pulse" />
                CALCULATED FROM TRANSCRIPTS
              </span>
            )}
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Creator DNA &amp; Content Architecture
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Multi-dimensional behavioral fingerprint extracted from your spoken vocabulary, hook cadence, and emotional shifts.
          </p>
        </div>

        <motion.button
          type="button"
          disabled={busy}
          onClick={() => onGenerate(true)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:brightness-105 disabled:opacity-60"
        >
          <RefreshCw size={13} className={busy ? "animate-spin" : ""} />
          <span>{busy ? "Synthesizing Genome..." : isReady ? "Re-calculate Genome" : "Synthesize Creator DNA"}</span>
        </motion.button>
      </div>

      {isReady ? (
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Radar Chart (Recharts) */}
          <div className="lg:col-span-5 rounded-2xl border border-slate-200/80 bg-white/70 p-4 shadow-sm backdrop-blur-md">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-slate-800">
                Topic &amp; Format Radar
              </h3>
              <span className="text-[10px] text-emerald-700 font-semibold">Recharts Polar</span>
            </div>

            {radarData.length > 0 ? (
              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                    <PolarGrid stroke="rgba(15, 23, 42, 0.08)" />
                    <PolarAngleAxis dataKey="subject" stroke="#475569" fontSize={11} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#94a3b8" fontSize={9} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const data = payload[0].payload;
                        return (
                          <div className="rounded-xl border border-slate-200 bg-white/95 p-2.5 shadow-xl text-xs text-slate-800">
                            <span className="block font-bold text-slate-900">{data.subject}</span>
                            <span className="text-emerald-700 font-semibold">Weight: {data.weight}%</span>
                          </div>
                        );
                      }}
                    />
                    <Radar
                      name="Topic Density"
                      dataKey="weight"
                      stroke="#059669"
                      fill="#10b981"
                      fillOpacity={0.25}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-[260px] items-center justify-center text-xs text-slate-500">
                Awaiting category tag diversity
              </div>
            )}
          </div>

          {/* Right Metrics & Vocabulary */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            {/* 3 Metric Pills */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-3.5 shadow-sm">
                <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block mb-1">
                  Dominant Emotion
                </span>
                <strong className="text-xs font-bold text-cyan-800 block truncate">
                  {dominantEmotion || "Measured from clips"}
                </strong>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-3.5 shadow-sm">
                <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block mb-1">
                  Speech Velocity
                </span>
                <strong className="text-xs font-bold text-emerald-800 block">
                  {wpm ? `${wpm} WPM` : "—"}
                </strong>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-3.5 shadow-sm">
                <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block mb-1">
                  Avg Hook Score
                </span>
                <strong className="text-xs font-bold text-purple-800 block">
                  {avgHook ? `${avgHook} / 100` : "—"}
                </strong>
              </div>
            </div>

            {/* Transcript Keywords Cloud */}
            <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-4 shadow-sm">
              <span className="text-xs font-bold text-slate-800 block mb-2">
                Characteristic Spoken Vocabulary
              </span>
              {words.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {words.map((w, idx) => (
                    <span
                      key={idx}
                      className="rounded-xl border border-slate-200 bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-emerald-300 hover:text-emerald-700"
                    >
                      {w}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-slate-500">
                  Transcripts will populate high-frequency words once audio is processed.
                </span>
              )}
            </div>

            {/* Real Content Gaps if detected */}
            {contentGaps.length > 0 && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 shadow-sm">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 mb-1.5">
                  <Flame size={13} className="text-emerald-600" />
                  <span>Detected Content Gaps</span>
                </div>
                <div className="space-y-1.5">
                  {contentGaps.slice(0, 2).map((gap, i) => (
                    <div key={i} className="flex items-center justify-between text-xs text-slate-700">
                      <span className="font-medium">{gap.topic}</span>
                      <span className="text-emerald-700 font-bold">
                        {Math.round(gap.opportunityScore * 100)}% Opportunity
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Zero-State: Prompt to run real DNA generation */
        <div className="flex flex-col items-center justify-center py-10 px-4 text-center relative z-10">
          <div className="relative mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-200">
            <Dna className="h-7 w-7 text-emerald-600 animate-pulse" />
            <div className="absolute inset-0 rounded-2xl bg-emerald-500/10 blur-lg" />
          </div>

          <h3 className="text-base font-bold text-slate-900">
            Creator DNA Genome Awaiting Calculation
          </h3>
          <p className="mt-1 max-w-md text-xs text-slate-600 leading-relaxed">
            Your creative genome evaluates word frequency across your clip transcripts, cadence tempo, and audience resonance. Click below to compute your unique signature.
          </p>

          <button
            type="button"
            disabled={busy}
            onClick={() => onGenerate(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:brightness-105 disabled:opacity-60"
          >
            <RefreshCw size={13} className={busy ? "animate-spin" : ""} />
            <span>{busy ? "Analyzing Video Transcripts..." : "Calculate Creator DNA"}</span>
          </button>
        </div>
      )}
    </CardSpotlight>
  );
}
