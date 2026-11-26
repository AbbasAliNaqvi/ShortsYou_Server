"use client";

import { useEffect } from "react";
import { CheckCircle2, Redo2, Undo2, X } from "lucide-react";

export interface EditorHeaderBannerProps {
  title: string;
  duration: number;
  clipLength: number;
  rendering: boolean;
  notice?: string;
  saveStatus?: "saved" | "saving";
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  onRender: () => void;
  onClearNotice?: () => void;
}

/**
 * Slim status & undo/redo strip placed right below the platform header row.
 * Auto-dismisses notices after 4 seconds without a permanent yellow banner.
 */
export function EditorHeaderBanner({
  notice,
  saveStatus = "saved",
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  onClearNotice,
}: EditorHeaderBannerProps) {
  useEffect(() => {
    if (!notice || !onClearNotice) return;
    const timer = setTimeout(() => {
      onClearNotice();
    }, 4000);
    return () => clearTimeout(timer);
  }, [notice, onClearNotice]);

  const isError = Boolean(
    notice && /fail|error|invalid|unable|couldn't/i.test(notice)
  );

  return (
    <div className="ss-header-tools" style={{ justifyContent: "space-between", width: "100%", flexWrap: "wrap" }}>
      <div className="ss-header-tools">
        <span className={`ss-save-chip ${saveStatus === "saved" ? "is-saved" : ""}`} aria-live="polite">
          <CheckCircle2 size={14} />
          <span>{saveStatus === "saving" ? "Saving…" : "Saved just now"}</span>
        </span>

        {notice && (
          <div className={`ss-inline-status ${isError ? "is-error" : ""}`} role="status" aria-live="polite">
            <span>{notice}</span>
            {onClearNotice && (
              <button
                type="button"
                className="ss-icon-btn"
                onClick={onClearNotice}
                aria-label="Dismiss status"
                style={{ width: 24, height: 24 }}
              >
                <X size={13} />
              </button>
            )}
          </div>
        )}
      </div>

      {(onUndo || onRedo) && (
        <div className="ss-icon-group" role="group" aria-label="History controls">
          <button
            type="button"
            className="ss-icon-btn"
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            aria-label="Undo"
          >
            <Undo2 size={15} />
          </button>
          <button
            type="button"
            className="ss-icon-btn"
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Shift+Z)"
            aria-label="Redo"
          >
            <Redo2 size={15} />
          </button>
        </div>
      )}
    </div>
  );
}
