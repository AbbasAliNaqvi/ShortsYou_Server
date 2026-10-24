"use client";

import {
  ArrowUpDown,
  CheckCircle2,
  CheckSquare,
  Film,
  Loader2,
  Search,
  Sparkles,
  Square,
  X,
} from "lucide-react";
import type { Video } from "@/lib/api";

export interface ClipsFilterBarProps {
  filter: string;
  onFilterChange: (filter: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedVideoId: string;
  onVideoChange: (videoId: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  videos: Video[];
  counts: {
    total: number;
    ready: number;
    detected: number;
    rendering: number;
    viral: number;
    narrative: number;
  };
  allSelected: boolean;
  onToggleSelectAll: () => void;
  onResetFilters: () => void;
}

export function ClipsFilterBar({
  filter,
  onFilterChange,
  searchQuery,
  onSearchChange,
  selectedVideoId,
  onVideoChange,
  sortBy,
  onSortChange,
  videos,
  counts,
  allSelected,
  onToggleSelectAll,
  onResetFilters,
}: ClipsFilterBarProps) {
  const isFiltered =
    filter !== "all" ||
    searchQuery.trim() !== "" ||
    selectedVideoId !== "all" ||
    sortBy !== "viral_desc";

  return (
    <div className="ca-clips-toolbar ca-glass">
      {/* Top Row: Search, Video Picker, Sort, and Select All */}
      <div className="ca-clips-toolbar-top">
        {/* Search */}
        <div className="ca-clips-search-box">
          <Search size={15} className="ca-clips-search-icon" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search clips by hook or transcript text…"
            className="ca-clips-search-input"
          />
          {searchQuery && (
            <button
              type="button"
              className="ca-clips-search-clear"
              onClick={() => onSearchChange("")}
              aria-label="Clear search"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Source Video Filter Dropdown */}
        {videos.length > 0 && (
          <div className="ca-clips-video-picker-wrap">
            <Film size={14} className="ca-clips-filter-icon" />
            <select
              value={selectedVideoId}
              onChange={(e) => onVideoChange(e.target.value)}
              className="ca-clips-select-input"
              aria-label="Filter clips by source video"
            >
              <option value="all">All Source Videos ({videos.length})</option>
              {videos.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.title.length > 36 ? `${v.title.slice(0, 36)}…` : v.title}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Sort Selector */}
        <div className="ca-clips-sort-wrap">
          <ArrowUpDown size={14} className="ca-clips-filter-icon" />
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="ca-clips-select-input"
            aria-label="Sort clips"
          >
            <option value="viral_desc">Viral Score (Highest)</option>
            <option value="viral_asc">Viral Score (Lowest)</option>
            <option value="newest">Recently Created</option>
            <option value="duration_desc">Duration (Longest)</option>
            <option value="duration_asc">Duration (Shortest)</option>
          </select>
        </div>

        {/* Select All Checkbox Button */}
        <button
          type="button"
          className="ca-clips-select-all-btn"
          onClick={onToggleSelectAll}
        >
          {allSelected ? (
            <>
              <CheckSquare size={14} className="ca-check-icon checked" />
              <span>Deselect All</span>
            </>
          ) : (
            <>
              <Square size={14} className="ca-check-icon" />
              <span>Select All</span>
            </>
          )}
        </button>
      </div>

      {/* Bottom Row: Category & Status Filter Tabs */}
      <div className="ca-clips-tabs-scroll">
        <button
          type="button"
          className={`ca-clips-tab-btn ${filter === "all" ? "active" : ""}`}
          onClick={() => onFilterChange("all")}
        >
          <span>All Clips</span>
          <span className="ca-clips-tab-count">{counts.total}</span>
        </button>

        <button
          type="button"
          className={`ca-clips-tab-btn ${filter === "ready" ? "active" : ""}`}
          onClick={() => onFilterChange("ready")}
        >
          <CheckCircle2 size={12} className="text-emerald-500" />
          <span>Ready to Download</span>
          <span className="ca-clips-tab-count">{counts.ready}</span>
        </button>

        {counts.rendering > 0 && (
          <button
            type="button"
            className={`ca-clips-tab-btn tab-rendering ${filter === "rendering" ? "active" : ""}`}
            onClick={() => onFilterChange("rendering")}
          >
            <Loader2 size={12} className="spin text-amber-500" />
            <span>Rendering</span>
            <span className="ca-clips-tab-count">{counts.rendering}</span>
          </button>
        )}

        <button
          type="button"
          className={`ca-clips-tab-btn ${filter === "detected" ? "active" : ""}`}
          onClick={() => onFilterChange("detected")}
        >
          <span>Detected Drafts</span>
          <span className="ca-clips-tab-count">{counts.detected}</span>
        </button>

        {counts.viral > 0 && (
          <button
            type="button"
            className={`ca-clips-tab-btn ${filter === "viral" ? "active" : ""}`}
            onClick={() => onFilterChange("viral")}
          >
            <Sparkles size={12} className="text-amber-500" />
            <span>Viral</span>
            <span className="ca-clips-tab-count">{counts.viral}</span>
          </button>
        )}

        {counts.narrative > 0 && (
          <button
            type="button"
            className={`ca-clips-tab-btn ${filter === "narrative" ? "active" : ""}`}
            onClick={() => onFilterChange("narrative")}
          >
            <span>Narrative</span>
            <span className="ca-clips-tab-count">{counts.narrative}</span>
          </button>
        )}

        {isFiltered && (
          <button
            type="button"
            className="ca-clips-reset-btn"
            onClick={onResetFilters}
            title="Reset filters and search"
          >
            <X size={12} />
            <span>Reset</span>
          </button>
        )}
      </div>
    </div>
  );
}
