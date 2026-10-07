"use client";

import { CheckSquare, Square } from "lucide-react";

export interface ClipsFilterBarProps {
  filter: string;
  onFilterChange: (filter: string) => void;
  allSelected: boolean;
  onToggleSelectAll: () => void;
  totalCount: number;
}

export function ClipsFilterBar({
  filter,
  onFilterChange,
  allSelected,
  onToggleSelectAll,
  totalCount,
}: ClipsFilterBarProps) {
  const tabs = [
    { key: "all", label: `All Clips (${totalCount})` },
    { key: "ready", label: "Ready to Publish" },
    { key: "viral", label: "Viral" },
    { key: "narrative", label: "Narrative" },
  ];

  return (
    <div className="ca-clips-toolbar ca-glass">
      <div className="ca-clips-tabs-scroll">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`ca-clips-tab-btn ${filter === tab.key ? "active" : ""}`}
            onClick={() => onFilterChange(tab.key)}
          >
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

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
  );
}
