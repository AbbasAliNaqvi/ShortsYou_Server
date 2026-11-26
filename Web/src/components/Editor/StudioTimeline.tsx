"use client";
/* eslint-disable @next/next/no-img-element */

import { useMemo, useRef, useState } from "react";
import { AlertCircle, Flame, Scissors } from "lucide-react";
import { formatDuration } from "@/lib/formatters";

export interface PeakMoment {
  id: string;
  label: string;
  start: number;
  end: number;
}

export interface StudioTimelineProps {
  duration: number;
  start: number;
  end: number;
  playhead: number;
  thumbnailUrl?: string;
  peaks: PeakMoment[];
  onSetStartBound: (val: number) => void;
  onSetEndBound: (val: number) => void;
  onSeek?: (val: number) => void;
  onSelectPeak?: (peak: PeakMoment) => void;
}

export function StudioTimeline({
  duration,
  start,
  end,
  playhead,
  thumbnailUrl,
  peaks,
  onSetStartBound,
  onSetEndBound,
  onSeek,
  onSelectPeak,
}: StudioTimelineProps) {
  const safeDuration = Math.max(duration || 60, 1);
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<"start" | "end" | null>(null);

  const clipLength = Math.max(0, end - start);
  const validationError =
    end <= start
      ? "End time must be greater than Start time."
      : clipLength > 60
      ? "Short duration cannot exceed 60 seconds."
      : null;

  const frames = useMemo(() => Array.from({ length: 10 }, (_, i) => i), []);

  function timeFromX(clientX: number): number {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect || rect.width <= 0) return 0;
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    return Number((ratio * safeDuration).toFixed(1));
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragging) return;
    const t = timeFromX(e.clientX);
    if (dragging === "start") onSetStartBound(Math.min(t, end - 0.5));
    else onSetEndBound(Math.max(t, start + 0.5));
  }

  const startPct = (start / safeDuration) * 100;
  const endPct = (end / safeDuration) * 100;
  const playheadPct = (Math.min(safeDuration, Math.max(0, playhead)) / safeDuration) * 100;

  return (
    <section className="ca-glass ss-panel ss-timeline-panel" aria-label="Timeline Editor">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 15, fontWeight: 800, color: "var(--ss-ink)" }}>
            <Scissors size={16} />
            <span>Timeline</span>
          </span>

          <div className="ss-blueprint-row" role="group" aria-label="Peak moments">
            {peaks.map((peak) => {
              const active = Math.abs(start - peak.start) < 0.8 && Math.abs(end - peak.end) < 0.8;
              return (
                <button
                  key={peak.id}
                  type="button"
                  className={`ss-chip-btn ${active ? "is-active" : ""}`}
                  onClick={() => onSelectPeak?.(peak)}
                >
                  <Flame size={13} />
                  <span>{peak.label}</span>
                  <span className="ss-meta-mono" style={{ color: active ? "#ffffff" : undefined }}>
                    {formatDuration(peak.start)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Secondary Start / End numeric controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <label style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: "var(--ss-ink-3)" }}>
            <span>Start</span>
            <input
              type="number"
              className="ss-input"
              style={{ width: 76, minHeight: 34, padding: "4px 8px", fontFamily: "var(--font-mono)", fontSize: 12 }}
              min={0}
              max={Math.max(0, end - 0.1)}
              step={0.1}
              value={Number(start.toFixed(1))}
              onChange={(e) => onSetStartBound(Number(e.target.value))}
            />
          </label>
          <span className="ss-meta-mono">→</span>
          <label style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: "var(--ss-ink-3)" }}>
            <span>End</span>
            <input
              type="number"
              className="ss-input"
              style={{ width: 76, minHeight: 34, padding: "4px 8px", fontFamily: "var(--font-mono)", fontSize: 12 }}
              min={0.1}
              max={safeDuration}
              step={0.1}
              value={Number(end.toFixed(1))}
              onChange={(e) => onSetEndBound(Number(e.target.value))}
            />
          </label>
        </div>
      </div>

      {/* Frame Strip + Draggable Handles + Playhead */}
      <div
        ref={trackRef}
        className="ss-timeline-track"
        onPointerMove={handlePointerMove}
        onPointerUp={() => setDragging(null)}
        onPointerLeave={() => setDragging(null)}
        onClick={(e) => {
          if (!dragging) onSeek?.(timeFromX(e.clientX));
        }}
      >
        <div className="ss-thumb-strip">
          {frames.map((i) =>
            thumbnailUrl ? (
              <img key={i} src={thumbnailUrl} alt="" loading="lazy" />
            ) : (
              <div key={i} style={{ background: "#1e293b", borderRight: "1px solid rgba(255,255,255,0.08)" }} />
            )
          )}
        </div>

        {peaks.map((p) => (
          <button
            key={p.id}
            type="button"
            className="ss-peak-pin"
            style={{ left: `${(p.start / safeDuration) * 100}%` }}
            onClick={(e) => {
              e.stopPropagation();
              onSelectPeak?.(p);
            }}
            title={`${p.label} (${formatDuration(p.start)})`}
          >
            {p.label}
          </button>
        ))}

        <div className="ss-range-mask" style={{ left: 0, width: `${startPct}%` }} />
        <div className="ss-range-mask" style={{ right: 0, width: `${Math.max(0, 100 - endPct)}%` }} />
        <div className="ss-range-active" style={{ left: `${startPct}%`, width: `${Math.max(0.5, endPct - startPct)}%` }} />

        <button
          type="button"
          className="ss-handle"
          aria-label="Drag In handle"
          style={{ left: `${startPct}%` }}
          onPointerDown={(e) => {
            e.stopPropagation();
            (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
            setDragging("start");
          }}
        />
        <button
          type="button"
          className="ss-handle"
          aria-label="Drag Out handle"
          style={{ left: `${endPct}%` }}
          onPointerDown={(e) => {
            e.stopPropagation();
            (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
            setDragging("end");
          }}
        />

        <div className="ss-playhead" style={{ left: `${playheadPct}%` }} />
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        {validationError ? (
          <span role="alert" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--ss-danger)", fontSize: 13, fontWeight: 700 }}>
            <AlertCircle size={15} />
            <span>{validationError}</span>
          </span>
        ) : (
          <span className="ss-meta-mono">
            Selected: {formatDuration(start)} → {formatDuration(end)} ({formatDuration(clipLength)})
          </span>
        )}
        <span className="ss-meta-mono">
          Playhead {formatDuration(playhead)} / {formatDuration(safeDuration)}
        </span>
      </div>
    </section>
  );
}
