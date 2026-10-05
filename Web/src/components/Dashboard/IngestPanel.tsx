"use client";

import { FormEvent } from "react";
import { motion } from "framer-motion";
import { Copy, RefreshCw } from "lucide-react";

export interface IngestPanelProps {
  sourceUrl: string;
  notice: string;
  creating: boolean;
  onChange: (value: string) => void;
  onCopy: () => void;
  onSubmit: (event: FormEvent) => void;
}

export function IngestPanel({
  sourceUrl,
  notice,
  creating,
  onChange,
  onCopy,
  onSubmit,
}: IngestPanelProps) {
  return (
    <div className="ca-ingest-container">
      <form className="ca-ingest-form" onSubmit={onSubmit}>
        <div className="ca-ingest-input-shell">
          <input
            className="ca-ingest-input"
            value={sourceUrl}
            onChange={(event) => onChange(event.target.value)}
            placeholder="Paste YouTube URL to generate shorts..."
          />
          <button
            type="button"
            onClick={onCopy}
            aria-label="Copy source URL"
            className="ca-ingest-copy-btn"
          >
            <Copy size={13} />
          </button>
        </div>
        <motion.button
          className="ca-hero-start-btn"
          type="submit"
          disabled={creating || !sourceUrl.trim()}
          whileHover={{ scale: 1.03, y: -1 }}
          whileTap={{ scale: 0.97 }}
        >
          {creating ? (
            <>
              <RefreshCw className="spin" size={14} /> Creating...
            </>
          ) : (
            "Start Now"
          )}
        </motion.button>
      </form>
      {notice && <p className="ca-hero-notice">{notice}</p>}
    </div>
  );
}
