"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, ExternalLink, Loader2, X } from "lucide-react";

export interface RenderProgressDrawerProps {
  open: boolean;
  rendering: boolean;
  success: boolean;
  onClose: () => void;
}

const STAGES = ["Rendering", "Captions", "Mixing"] as const;

export function RenderProgressDrawer({
  open,
  rendering,
  success,
  onClose,
}: RenderProgressDrawerProps) {
  const [stageIdx, setStageIdx] = useState(0);

  useEffect(() => {
    if (!open || !rendering) {
      if (success) setStageIdx(STAGES.length);
      return;
    }
    setStageIdx(0);
    const id = setInterval(() => {
      setStageIdx((prev) => (prev < STAGES.length - 1 ? prev + 1 : prev));
    }, 800);
    return () => clearInterval(id);
  }, [open, rendering, success]);

  if (!open) return null;

  return (
    <aside className="ss-drawer ss-enter" role="dialog" aria-label="Short creation progress">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {success ? (
            <CheckCircle2 size={18} color="#047857" />
          ) : (
            <Loader2 size={18} className="ss-spin" />
          )}
          <h3 className="ss-card-title">
            {success ? "Short Queued" : "Creating Short…"}
          </h3>
        </div>
        <button type="button" className="ss-icon-btn" onClick={onClose} aria-label="Close drawer">
          <X size={15} />
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {STAGES.map((label, idx) => {
          const done = success || idx < stageIdx;
          const active = !success && idx === stageIdx;
          return (
            <div
              key={label}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 12px",
                borderRadius: 12,
                border: "1px solid var(--ss-border)",
                background: "var(--ss-bg)",
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              <span>{label}</span>
              {done ? (
                <CheckCircle2 size={15} color="#047857" />
              ) : active ? (
                <Loader2 size={15} className="ss-spin" />
              ) : (
                <span className="ss-meta-mono">Pending</span>
              )}
            </div>
          );
        })}
      </div>

      {success && (
        <div style={{ marginTop: 14, display: "flex", justifyContent: "flex-end" }}>
          <Link href="/clips" className="ss-btn-primary" style={{ minHeight: 38, padding: "8px 16px", textDecoration: "none" }}>
            <span>View in Clips</span>
            <ExternalLink size={14} />
          </Link>
        </div>
      )}
    </aside>
  );
}
