"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Download, Loader2, Sparkles, Wand2, X } from "lucide-react";
import { api } from "@/lib/api";
import { notify } from "@/components/Notifications/NotificationCenter";

function YouTubeIcon({ size = 14, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

export interface VideosQuickIngestProps {
  onIngestSuccess: (video: { id: string; title: string }) => void;
  busy?: boolean;
}

export function VideosQuickIngest({
  onIngestSuccess,
  busy = false,
}: VideosQuickIngestProps) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [autoCreate, setAutoCreate] = useState(true);

  async function handleIngest(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) {
      notify("URL Required", "Please paste a valid YouTube video or Short URL.", "error");
      return;
    }

    const token = localStorage.getItem("shortsyou_jwt");
    if (!token) {
      notify("Authentication Required", "Please log in to import videos.", "error");
      return;
    }

    setLoading(true);
    try {
      if (autoCreate) {
        const res = await api.autoCreateIngest(token, trimmed);
        notify(
          "Video Added & Queued!",
          `"${res.title || "Video"}" was added. AI is analyzing and creating shorts.`,
          "success"
        );
        setUrl("");
        onIngestSuccess({ id: res.videoId, title: res.title });
      } else {
        const res = await api.ingest(token, trimmed, true);
        notify(
          "Video Ingested!",
          `"${res.title || "Video"}" was imported to your studio library.`,
          "success"
        );
        setUrl("");
        onIngestSuccess({ id: res.videoId, title: res.title });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to import YouTube video.";
      notify("Import Error", msg, "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      className="ca-quick-ingest-panel ca-glass"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="ca-quick-ingest-header">
        <div className="ca-quick-ingest-title-wrap">
          <span className="ca-quick-ingest-badge">
            <YouTubeIcon size={14} className="text-red-500" />
            <span>Instant Ingest</span>
          </span>
          <h2 className="ca-quick-ingest-title">Add Video by YouTube Link</h2>
        </div>
        <p className="ca-quick-ingest-desc">
          Paste any YouTube watch link, Short, or youtu.be URL. Newly added videos appear
          at the top of your library instantly.
        </p>
      </div>

      <form onSubmit={handleIngest} className="ca-quick-ingest-form">
        <div className="ca-quick-ingest-input-wrap">
          <YouTubeIcon size={18} className="ca-input-yt-icon" />
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
            className="ca-quick-ingest-input"
            disabled={loading || busy}
          />
          {url && (
            <button
              type="button"
              className="ca-input-clear-btn"
              onClick={() => setUrl("")}
              disabled={loading || busy}
              aria-label="Clear URL"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="ca-quick-ingest-actions">
          <label className="ca-quick-ingest-toggle" title="Automatically detect viral clips and generate shorts">
            <input
              type="checkbox"
              checked={autoCreate}
              onChange={(e) => setAutoCreate(e.target.checked)}
              disabled={loading || busy}
            />
            <span className="ca-toggle-label">
              <Sparkles size={13} className="text-amber-500" />
              <span>Auto-Generate Shorts</span>
            </span>
          </label>

          <motion.button
            type="submit"
            className="ca-quick-ingest-submit-btn"
            disabled={loading || busy || !url.trim()}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
          >
            {loading ? (
              <>
                <Loader2 size={15} className="spin" />
                <span>Importing Video…</span>
              </>
            ) : autoCreate ? (
              <>
                <Wand2 size={15} />
                <span>Import & Auto-Create</span>
              </>
            ) : (
              <>
                <Download size={15} />
                <span>Import Video</span>
              </>
            )}
          </motion.button>
        </div>
      </form>
    </motion.div>
  );
}
