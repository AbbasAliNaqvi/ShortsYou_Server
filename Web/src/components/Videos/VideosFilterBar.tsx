"use client";

import { motion } from "framer-motion";
import {
  ArrowUpDown,
  CheckCircle2,
  Clapperboard,
  Compass,
  Filter,
  Layers,
  Link2,
  Loader2,
  RefreshCw,
  Search,
  Sparkles,
  X,
} from "lucide-react";

export type VideoSourceFilter = "all" | "direct" | "own" | "public";
export type VideoStatusFilter = "all" | "ready" | "processing" | "failed";

export interface VideosFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedSource: VideoSourceFilter;
  onSourceChange: (source: VideoSourceFilter) => void;
  selectedStatus: VideoStatusFilter;
  onStatusChange: (status: VideoStatusFilter) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  counts: {
    total: number;
    imported: number;
    channel: number;
    discover: number;
    ready: number;
    processing: number;
    failed: number;
  };
  onSync: () => void;
  syncing?: boolean;
  onRefresh: () => void;
  refreshing?: boolean;
  onResetFilters: () => void;
}

export function VideosFilterBar({
  searchQuery,
  onSearchChange,
  selectedSource,
  onSourceChange,
  selectedStatus,
  onStatusChange,
  sortBy,
  onSortChange,
  counts,
  onSync,
  syncing = false,
  onRefresh,
  refreshing = false,
  onResetFilters,
}: VideosFilterBarProps) {
  const isFiltered =
    searchQuery.trim() !== "" ||
    selectedSource !== "all" ||
    selectedStatus !== "all" ||
    sortBy !== "recent";

  return (
    <div className="ca-videos-filter-bar ca-glass">
      {/* Top Row: Search Input & Controls */}
      <div className="ca-filter-bar-top">
        {/* Search Input */}
        <div className="ca-filter-search-box">
          <Search size={16} className="ca-filter-search-icon" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search videos by title or topic…"
            className="ca-filter-search-input"
          />
          {searchQuery && (
            <button
              type="button"
              className="ca-filter-search-clear"
              onClick={() => onSearchChange("")}
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Sort Selector */}
        <div className="ca-filter-sort-wrap">
          <label htmlFor="ca-video-sort" className="ca-filter-sort-label">
            <ArrowUpDown size={14} />
            <span>Sort:</span>
          </label>
          <select
            id="ca-video-sort"
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="ca-filter-sort-select"
          >
            <option value="recent">Recently Added (Newest)</option>
            <option value="published_desc">Publish Date (Newest)</option>
            <option value="published_asc">Publish Date (Oldest)</option>
            <option value="clips_desc">Clips Detected (Most)</option>
            <option value="duration_desc">Duration (Longest)</option>
            <option value="duration_asc">Duration (Shortest)</option>
          </select>
        </div>

        {/* Action Buttons: Sync & Refresh */}
        <div className="ca-filter-actions-group">
          <motion.button
            type="button"
            className="ca-filter-sync-btn"
            onClick={onSync}
            disabled={syncing || refreshing}
            title="Sync connected YouTube channel"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
          >
            <RefreshCw size={13} className={syncing ? "spin" : ""} />
            <span>{syncing ? "Syncing…" : "Sync YouTube"}</span>
          </motion.button>

          <motion.button
            type="button"
            className="ca-filter-refresh-icon-btn"
            onClick={onRefresh}
            disabled={refreshing || syncing}
            title="Refresh videos"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.94 }}
            aria-label="Refresh videos"
          >
            <RefreshCw size={14} className={refreshing ? "spin" : ""} />
          </motion.button>
        </div>
      </div>

      {/* Bottom Row: Source Tabs & Status Pills */}
      <div className="ca-filter-bar-bottom">
        {/* Source Categories */}
        <div className="ca-source-tabs">
          <button
            type="button"
            className={`ca-source-tab ${selectedSource === "all" ? "active" : ""}`}
            onClick={() => onSourceChange("all")}
          >
            <Layers size={13} />
            <span>All Videos</span>
            <span className="ca-tab-badge">{counts.total}</span>
          </button>

          <button
            type="button"
            className={`ca-source-tab ${selectedSource === "direct" ? "active" : ""}`}
            onClick={() => onSourceChange("direct")}
          >
            <Link2 size={13} />
            <span>Imported / URL</span>
            <span className="ca-tab-badge">{counts.imported}</span>
          </button>

          <button
            type="button"
            className={`ca-source-tab ${selectedSource === "own" ? "active" : ""}`}
            onClick={() => onSourceChange("own")}
          >
            <Clapperboard size={13} />
            <span>Channel Synced</span>
            <span className="ca-tab-badge">{counts.channel}</span>
          </button>

          {counts.discover > 0 && (
            <button
              type="button"
              className={`ca-source-tab ${selectedSource === "public" ? "active" : ""}`}
              onClick={() => onSourceChange("public")}
            >
              <Compass size={13} />
              <span>Discover</span>
              <span className="ca-tab-badge">{counts.discover}</span>
            </button>
          )}
        </div>

        {/* Status Filter Pills */}
        <div className="ca-status-pills">
          <button
            type="button"
            className={`ca-status-filter-pill ${selectedStatus === "all" ? "active" : ""}`}
            onClick={() => onStatusChange("all")}
          >
            All Status
          </button>

          <button
            type="button"
            className={`ca-status-filter-pill pill-ready ${selectedStatus === "ready" ? "active" : ""}`}
            onClick={() => onStatusChange("ready")}
          >
            <CheckCircle2 size={12} />
            <span>Ready to Clip</span>
            <span className="ca-status-count">{counts.ready}</span>
          </button>

          {counts.processing > 0 && (
            <button
              type="button"
              className={`ca-status-filter-pill pill-processing ${selectedStatus === "processing" ? "active" : ""}`}
              onClick={() => onStatusChange("processing")}
            >
              <Loader2 size={12} className="spin" />
              <span>In Progress</span>
              <span className="ca-status-count">{counts.processing}</span>
            </button>
          )}

          {counts.failed > 0 && (
            <button
              type="button"
              className={`ca-status-filter-pill pill-failed ${selectedStatus === "failed" ? "active" : ""}`}
              onClick={() => onStatusChange("failed")}
            >
              <span>Failed</span>
              <span className="ca-status-count">{counts.failed}</span>
            </button>
          )}

          {isFiltered && (
            <button
              type="button"
              className="ca-reset-filters-btn"
              onClick={onResetFilters}
              title="Reset all filters"
            >
              <X size={12} />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
