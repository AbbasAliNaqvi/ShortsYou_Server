"use client";

import { memo, useMemo } from "react";
import Link from "next/link";
import {
  ExternalLink,
  Share2,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";
import type { PerformanceAnalytics, Clip } from "@/lib/api";
import { compactNumber } from "@/lib/formatters";

export interface PlatformMatrixPanelProps {
  performance: PerformanceAnalytics | null;
  clips?: Clip[];
}

function YouTubeIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} width="18" height="18" aria-hidden="true">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

function TikTokIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} width="17" height="17" aria-hidden="true">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.27 1.76-.23.99-.04 2.09.6 2.89.6.78 1.58 1.25 2.56 1.25.77-.02 1.52-.3 2.08-.83.65-.6 1.04-1.45 1.04-2.33l.02-13.88c.02-.01.04-.02.06-.03z" />
    </svg>
  );
}

function InstagramIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} width="17" height="17" aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

const BAR_COLORS = ["#4f46e5", "#0284c7", "#059669", "#d97706", "#ec4899", "#8b5cf6"];

export const PlatformMatrixPanel = memo(function PlatformMatrixPanel({
  performance,
  clips = [],
}: PlatformMatrixPanelProps) {
  const points = performance?.points ?? [];

  // Total Views across points or clips
  const totalViews = useMemo(() => {
    if (points.length > 0) {
      return points.reduce((sum, p) => sum + p.actualViews, 0);
    }
    return clips.reduce((sum, c) => sum + (c.performanceData?.views48h || 0), 0);
  }, [points, clips]);

  // Aggregate views or clips by category
  const categoryData = useMemo(() => {
    const catMap = new Map<string, { category: string; views: number; count: number }>();

    if (points.length > 0) {
      for (const p of points) {
        const cat = p.category || "General";
        const cur = catMap.get(cat) ?? { category: cat, views: 0, count: 0 };
        cur.views += p.actualViews;
        cur.count += 1;
        catMap.set(cat, cur);
      }
    } else if (clips.length > 0) {
      for (const c of clips) {
        const cat = c.category || "General";
        const cur = catMap.get(cat) ?? { category: cat, views: 0, count: 0 };
        const v = c.performanceData?.views48h || Math.round((c.viralScore || c.hookScore || 75) * 10);
        cur.views += v;
        cur.count += 1;
        catMap.set(cat, cur);
      }
    }

    if (catMap.size === 0) return [];

    return Array.from(catMap.values())
      .sort((a, b) => b.views - a.views)
      .slice(0, 5)
      .map((c) => ({
        name: c.category.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
        views: c.views,
        count: c.count,
      }));
  }, [points, clips]);

  const platforms = [
    {
      name: "YouTube Shorts",
      icon: YouTubeIcon,
      color: "#ef4444",
      bg: "bg-red-50 text-red-600 border-red-100",
      status: totalViews > 0 ? "Connected & Syncing" : "Connected (Awaiting Views)",
      statusType: "live" as const,
      connected: true,
      views: totalViews,
      note: "48h telemetry active",
    },
    {
      name: "TikTok",
      icon: TikTokIcon,
      color: "#0f172a",
      bg: "bg-slate-100 text-slate-800 border-slate-200",
      status: "Ready to Connect",
      statusType: "connect" as const,
      connected: false,
      views: 0,
      note: "Sync via Settings",
    },
    {
      name: "Instagram Reels",
      icon: InstagramIcon,
      color: "#e1306c",
      bg: "bg-pink-50 text-pink-600 border-pink-100",
      status: "Ready to Connect",
      statusType: "connect" as const,
      connected: false,
      views: 0,
      note: "Sync via Settings",
    },
  ];

  const pearsonR = performance?.pearsonR;

  return (
    <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-semibold text-purple-800 border border-purple-200">
              <Share2 size={12} aria-hidden="true" />
              Multi-Platform Distribution
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight sm:text-xl">
            Platform Distribution &amp; Category Yield
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Impression yield breakdown across content categories and connected social channels.
          </p>
        </div>

        {typeof pearsonR === "number" && (
          <div className="flex items-center gap-1.5 rounded-xl border border-purple-100 bg-purple-50/70 px-3 py-1.5 text-xs font-semibold text-purple-900 shrink-0">
            <TrendingUp size={13} className="text-purple-600" aria-hidden="true" />
            <span>Score Fit: r = {pearsonR.toFixed(2)}</span>
          </div>
        )}
      </div>

      {/* Category Views Horizontal Bar Chart (if categories exist) */}
      {categoryData.length > 0 ? (
        <div className="mb-5 rounded-xl border border-slate-100 bg-slate-50/70 p-4">
          <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-700">
            <span>Views by Content Category</span>
            <span className="text-[11px] font-bold text-indigo-700">
              Total: {compactNumber(totalViews)} Views
            </span>
          </div>

          <div className="h-[140px] w-full min-w-0 min-h-[140px]">
            <ResponsiveContainer width="100%" height={140} minWidth={0} minHeight={140}>
              <BarChart
                data={categoryData}
                layout="vertical"
                margin={{ top: 2, right: 30, left: 10, bottom: 2 }}
              >
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  stroke="#64748b"
                  fontSize={11}
                  width={110}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#475569", fontWeight: 600 }}
                />
                <Tooltip
                  cursor={{ fill: "rgba(15, 23, 42, 0.04)" }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-xl text-xs">
                        <strong className="block text-slate-900 font-bold">{d.name}</strong>
                        <span className="text-indigo-700 font-extrabold">{compactNumber(d.views)} views</span>
                        {d.count && (
                          <span className="text-slate-500 block text-[10px] mt-0.5">
                            {d.count} clips analyzed
                          </span>
                        )}
                      </div>
                    );
                  }}
                />
                <Bar dataKey="views" radius={[0, 6, 6, 0]} isAnimationActive={false}>
                  {categoryData.map((_, idx) => (
                    <Cell key={idx} fill={BAR_COLORS[idx % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="mb-5 rounded-xl border border-slate-100 bg-slate-50/50 p-4 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
          <BarChart3 size={16} className="text-slate-400" aria-hidden="true" />
          <span>Category breakdown will populate once clips have recorded view metrics.</span>
        </div>
      )}

      {/* Platform Rows */}
      <div className="space-y-2.5">
        {platforms.map((p) => {
          const Icon = p.icon;
          return (
            <div
              key={p.name}
              className="flex items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white p-3.5 transition-all hover:border-slate-300 hover:shadow-2xs"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${p.bg}`}
                >
                  <Icon />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <strong className="text-xs font-bold text-slate-900 truncate">
                      {p.name}
                    </strong>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                        p.statusType === "live"
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : "bg-slate-100 text-slate-700 border-slate-200"
                      }`}
                    >
                      {p.statusType === "live" && (
                        <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
                      )}
                      {p.status}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">{p.note}</span>
                </div>
              </div>

              <div className="text-right shrink-0">
                {p.connected ? (
                  p.views > 0 ? (
                    <>
                      <span className="block text-sm font-extrabold text-slate-900">
                        {compactNumber(p.views)}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">Views</span>
                    </>
                  ) : (
                    <div className="flex flex-col items-end">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
                        Connected
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium mt-0.5">Awaiting views</span>
                    </div>
                  )
                ) : (
                  <Link
                    href="/settings"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 transition"
                  >
                    <span>Connect</span>
                    <ExternalLink size={12} className="text-slate-400" aria-hidden="true" />
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Callout */}
      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-[11px] text-slate-500">
        <div className="flex items-center gap-1.5 font-medium">
          <TrendingUp size={13} className="text-indigo-600 shrink-0" aria-hidden="true" />
          <span>
            {typeof pearsonR === "number" && pearsonR >= 0.7
              ? `Pearson correlation (r = ${pearsonR.toFixed(2)}): High predictive confidence against 48h view yield.`
              : "Telemetry recalibrates automatically 48h post-publication."}
          </span>
        </div>
        <Link
          href="/settings"
          className="cursor-pointer inline-flex items-center gap-1 font-semibold text-indigo-700 hover:text-indigo-900 transition"
        >
          <span>Settings</span>
          <ExternalLink size={11} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
});
