"use client";

import { memo, useMemo } from "react";
import Link from "next/link";
import {
  BarChart3,
  ExternalLink,
  Film,
  PlayCircle,
  Share2,
  TrendingUp,
  Video,
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
import type { PerformanceAnalytics } from "@/lib/api";
import { compactNumber } from "@/lib/formatters";
import { CardSpotlight } from "@/components/ui/card-spotlight";

export interface PlatformMatrixPanelProps {
  performance: PerformanceAnalytics | null;
}

// Inline Crisp SVG for YouTube
function YouTubeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} width="18" height="18">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

export const PlatformMatrixPanel = memo(function PlatformMatrixPanel({
  performance,
}: PlatformMatrixPanelProps) {
  const points = performance?.points ?? [];
  const hasPoints = points.length > 0;

  // Real YouTube Metrics from performance points
  const totalViews = useMemo(() => {
    return points.reduce((sum, p) => sum + p.actualViews, 0);
  }, [points]);

  // Aggregate by Category if available
  const categoryData = useMemo(() => {
    if (!points.length) return [];
    const catMap = new Map<string, { category: string; views: number; count: number }>();
    for (const p of points) {
      const cat = p.category || "General";
      const existing = catMap.get(cat) ?? { category: cat, views: 0, count: 0 };
      existing.views += p.actualViews;
      existing.count += 1;
      catMap.set(cat, existing);
    }
    return Array.from(catMap.values()).map((c) => ({
      name: c.category.replace(/_/g, " "),
      views: c.views,
      avg: Math.round(c.views / c.count),
    }));
  }, [points]);

  const platforms = [
    {
      name: "YouTube Shorts",
      icon: YouTubeIcon,
      color: "#ef4444",
      status: hasPoints ? "Connected & Measured" : "Connected (Awaiting 48h Window)",
      statusType: hasPoints ? "live" : "waiting",
      views: totalViews,
      note: hasPoints ? `${compactNumber(totalViews)} actual views` : "0 views logged",
    },
    {
      name: "TikTok",
      icon: PlayCircle,
      color: "#06b6d4",
      status: "Channel Unlinked",
      statusType: "unlinked",
      views: 0,
      note: "Connect TikTok in Settings",
    },
    {
      name: "Instagram Reels",
      icon: Video,
      color: "#ec4899",
      status: "Channel Unlinked",
      statusType: "unlinked",
      views: 0,
      note: "Connect Instagram in Settings",
    },
  ];

  const colors = ["#0284c7", "#7c3aed", "#db2777", "#2563eb", "#059669"];

  return (
    <CardSpotlight
      radius={380}
      color="rgba(124, 58, 237, 0.06)"
      className="ca-platform-panel ca-glass"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-semibold text-purple-700 border border-purple-200">
              <Share2 size={12} />
              Cross-Platform Distribution
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Platform Distribution &amp; Measured Yield
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Real performance telemetry collected from connected social channels.
          </p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 border border-purple-200 text-purple-600">
          <BarChart3 size={18} />
        </div>
      </div>

      {/* Category Views Bar Chart (if real points exist) */}
      {hasPoints && categoryData.length > 0 && (
        <div className="mb-5 rounded-2xl border border-slate-200/80 bg-white/70 p-4 shadow-sm backdrop-blur-md">
          <div className="mb-2 flex items-center justify-between text-xs text-slate-700">
            <span className="font-semibold">Measured Views by Content Category</span>
            <span className="text-[11px] font-bold text-cyan-600">Total: {compactNumber(totalViews)}</span>
          </div>
          <div className="h-[120px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} layout="vertical" margin={{ top: 0, right: 15, left: 10, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" stroke="#475569" fontSize={11} width={90} tickLine={false} />
                <Tooltip
                  cursor={{ fill: "rgba(15, 23, 42, 0.04)" }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="rounded-xl border border-slate-200 bg-white/95 p-2.5 shadow-xl text-xs text-slate-800">
                        <strong className="block text-slate-900 capitalize">{d.name}</strong>
                        <span className="text-cyan-700 font-semibold">{compactNumber(d.views)} views</span>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="views" radius={[0, 6, 6, 0]}>
                  {categoryData.map((_, idx) => (
                    <Cell key={idx} fill={colors[idx % colors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Platform Rows with Real Integration Status */}
      <div className="space-y-3">
        {platforms.map((p) => {
          const Icon = p.icon;
          return (
            <div
              key={p.name}
              className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white/70 p-3.5 transition hover:border-slate-300 hover:shadow-sm"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${p.color}14`, color: p.color }}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <strong className="text-xs font-bold text-slate-900 truncate">
                      {p.name}
                    </strong>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        p.statusType === "live"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : p.statusType === "waiting"
                          ? "bg-amber-50 text-amber-800 border border-amber-200"
                          : "bg-slate-100 text-slate-600 border border-slate-200"
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500">{p.note}</span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="block text-sm font-bold text-slate-900">
                  {p.views > 0 ? compactNumber(p.views) : "—"}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">Impressions</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Real Footer Notice */}
      <div className="mt-4 flex items-center justify-between border-t border-slate-200/80 pt-3 text-[11px] text-slate-500">
        <div className="flex items-center gap-1.5 font-medium">
          <TrendingUp size={13} className="text-purple-600" />
          <span>
            {hasPoints
              ? `Pearson Correlation: r = ${performance?.pearsonR.toFixed(2)}`
              : "Telemetry collects 48 hours post-publication via YouTube API."}
          </span>
        </div>
        <Link
          href="/settings"
          className="inline-flex items-center gap-1 text-cyan-700 hover:text-cyan-800 font-semibold transition"
        >
          <span>Integrations</span>
          <ExternalLink size={11} />
        </Link>
      </div>
    </CardSpotlight>
  );
});
