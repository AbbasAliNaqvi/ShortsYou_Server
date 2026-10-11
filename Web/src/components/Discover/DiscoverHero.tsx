"use client";

import { FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Info, LoaderCircle, Search, Sparkles, X } from "lucide-react";

export interface DiscoverHeroProps {
  query: string;
  busy: boolean;
  message?: string;
  onChangeQuery: (val: string) => void;
  onSubmitSearch: (event?: FormEvent) => void;
  onClearMessage?: () => void;
}

export function DiscoverHero({
  query,
  busy,
  message,
  onChangeQuery,
  onSubmitSearch,
  onClearMessage,
}: DiscoverHeroProps) {
  return (
    <motion.section
      className="ca-discover-hero ca-glass"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="ca-discover-hero-top">
        <span className="ca-discover-kicker">
          <Sparkles size={13} />
          <span>Creator Intelligence</span>
        </span>
      </div>

      <h1 className="ca-discover-headline">
        Find the next channel<br />
        <span className="ca-headline-gradient">worth your attention.</span>
      </h1>

      <p className="ca-discover-subtext">
        Search public YouTube creators, choose videos, and queue them into your studio to create
        viral shorts with AI.
      </p>

      {/* Creator Search Input Bar */}
      <form className="ca-creator-search-form" onSubmit={onSubmitSearch}>
        <div className="ca-search-input-wrap">
          <Search size={18} className="ca-search-icon" />
          <input
            type="text"
            className="ca-search-input"
            value={query}
            onChange={(e) => onChangeQuery(e.target.value)}
            placeholder="Search a creator, channel, or @handle (e.g. @MrBeast, Veritaseum)..."
          />
        </div>

        <motion.button
          type="submit"
          className="ca-search-submit-btn"
          disabled={busy || !query.trim()}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
        >
          {busy ? (
            <>
              <LoaderCircle className="spin" size={16} />
              <span>Searching…</span>
            </>
          ) : (
            <>
              <span>Search</span>
              <ArrowRight size={15} />
            </>
          )}
        </motion.button>
      </form>

      {/* Dynamic Feedback Message Banner */}
      <AnimatePresence>
        {message && (
          <motion.div
            className="ca-notice-banner ca-glass"
            initial={{ opacity: 0, y: -6, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -6, height: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="ca-notice-content">
              <Info size={16} className="ca-notice-icon" />
              <span className="ca-notice-text">{message}</span>
            </div>
            {onClearMessage && (
              <button
                type="button"
                className="ca-notice-dismiss"
                onClick={onClearMessage}
                aria-label="Dismiss message"
              >
                <X size={14} />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}
