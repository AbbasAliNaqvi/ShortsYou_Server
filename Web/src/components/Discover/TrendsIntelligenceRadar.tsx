"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  TrendingUp,
  Flame,
  Zap,
  Lightbulb,
  Copy,
  Check,
  Search,
  RefreshCw,
  Compass,
  ArrowUpRight,
  Filter,
} from "lucide-react";
import type { PredictTrendsData, TrendItem, VideoIdeaItem } from "@/lib/trendsApi";

export interface TrendsIntelligenceRadarProps {
  data: PredictTrendsData | null;
  loading: boolean;
  onRefresh: () => void;
  onSelectSearchTopic: (query: string) => void;
}

export function TrendsIntelligenceRadar({
  data,
  loading,
  onRefresh,
  onSelectSearchTopic,
}: TrendsIntelligenceRadarProps) {
  const [selectedGenre, setSelectedGenre] = useState<string>("all");
  const [selectedMomentum, setSelectedMomentum] = useState<string>("all");
  const [copiedHook, setCopiedHook] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"ideas" | "trends">("ideas");

  const genres = useMemo(() => {
    return data?.genres || ["tech", "education", "motivation", "news"];
  }, [data]);

  const filteredTrends = useMemo(() => {
    if (!data?.trends) return [];
    return data.trends.filter((t) => {
      const matchGenre =
        selectedGenre === "all" ||
        t.genre.toLowerCase() === selectedGenre.toLowerCase();
      const matchMomentum =
        selectedMomentum === "all" ||
        t.momentum.toLowerCase() === selectedMomentum.toLowerCase();
      return matchGenre && matchMomentum;
    });
  }, [data, selectedGenre, selectedMomentum]);

  const filteredIdeas = useMemo(() => {
    if (!data?.videoIdeas) return [];
    return data.videoIdeas.filter((idea) => {
      if (selectedGenre === "all") return true;
      return idea.genres.some(
        (g) => g.toLowerCase() === selectedGenre.toLowerCase()
      );
    });
  }, [data, selectedGenre]);

  function handleCopyHook(hookText: string) {
    navigator.clipboard?.writeText(hookText);
    setCopiedHook(hookText);
    setTimeout(() => {
      setCopiedHook(null);
    }, 2000);
  }

  const momentumBadges: Record<
    string,
    { label: string; bg: string; text: string; icon: any }
  > = {
    rising: {
      label: "Rising Velocity",
      bg: "bg-emerald-500/10 border-emerald-500/25",
      text: "text-emerald-600 dark:text-emerald-400",
      icon: TrendingUp,
    },
    emerging: {
      label: "Emerging Wave",
      bg: "bg-amber-500/10 border-amber-500/25",
      text: "text-amber-600 dark:text-amber-400",
      icon: Zap,
    },
    peaking: {
      label: "Peak Viral Demand",
      bg: "bg-rose-500/10 border-rose-500/25",
      text: "text-rose-600 dark:text-rose-400",
      icon: Flame,
    },
  };

  return (
    <motion.section
      className="ca-trends-intelligence-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* ── Top Header Ribbon ── */}
      <div className="ca-trends-header ca-glass">
        <div className="ca-trends-header-left">
          <div className="ca-trends-live-kicker">
            <span className="ca-pulse-indicator" />
            <Sparkles size={13} className="text-amber-500" />
            <span>AI Virality Radar & Live Forecast</span>
          </div>
          <h2 className="ca-trends-title">
            Predicted Trends & <span className="ca-headline-gradient">Viral Video Blueprints</span>
          </h2>
          <p className="ca-trends-description">
            Algorithmic predictions synthesized from your creator audience data. Browse rising
            topics, grab pre-crafted curiosity hooks, or search YouTube creators dominating these
            themes.
          </p>
        </div>

        <div className="ca-trends-header-actions">
          <motion.button
            type="button"
            className="ca-trends-refresh-btn"
            onClick={onRefresh}
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <RefreshCw size={14} className={loading ? "spin" : ""} />
            <span>{loading ? "Synthesizing…" : "Refresh Radar"}</span>
          </motion.button>
        </div>
      </div>

      {/* ── Quick KPI Stat Strip ── */}
      <div className="ca-trends-stats-grid">
        <div className="ca-trends-stat-card ca-glass">
          <div className="ca-stat-icon-wrap bg-indigo-500/10 text-indigo-600">
            <Compass size={18} />
          </div>
          <div className="ca-stat-info">
            <span className="ca-stat-label">Active Niche Clusters</span>
            <span className="ca-stat-value">{genres.length} Genres</span>
          </div>
        </div>

        <div className="ca-trends-stat-card ca-glass">
          <div className="ca-stat-icon-wrap bg-emerald-500/10 text-emerald-600">
            <TrendingUp size={18} />
          </div>
          <div className="ca-stat-info">
            <span className="ca-stat-label">Predicted Trends</span>
            <span className="ca-stat-value">
              {data?.trends.length ?? 12} Trajectories
            </span>
          </div>
        </div>

        <div className="ca-trends-stat-card ca-glass">
          <div className="ca-stat-icon-wrap bg-amber-500/10 text-amber-600">
            <Lightbulb size={18} />
          </div>
          <div className="ca-stat-info">
            <span className="ca-stat-label">Viral Video Ideas</span>
            <span className="ca-stat-value">
              {data?.videoIdeas.length ?? 6} Ready Hooks
            </span>
          </div>
        </div>

        <div className="ca-trends-stat-card ca-glass">
          <div className="ca-stat-icon-wrap bg-rose-500/10 text-rose-600">
            <Flame size={18} />
          </div>
          <div className="ca-stat-info">
            <span className="ca-stat-label">Model Engine</span>
            <span className="ca-stat-value">Gemini + CPEP</span>
          </div>
        </div>
      </div>

      {/* ── Filter Bar & Section Switcher ── */}
      <div className="ca-trends-filter-bar ca-glass">
        <div className="ca-trends-tabs">
          <button
            type="button"
            className={`ca-trends-tab-btn ${activeTab === "ideas" ? "active" : ""}`}
            onClick={() => setActiveTab("ideas")}
          >
            <Lightbulb size={15} />
            <span>Viral Video Ideas</span>
            <span className="ca-tab-count">{filteredIdeas.length}</span>
          </button>
          <button
            type="button"
            className={`ca-trends-tab-btn ${activeTab === "trends" ? "active" : ""}`}
            onClick={() => setActiveTab("trends")}
          >
            <TrendingUp size={15} />
            <span>Niche Trend Radar</span>
            <span className="ca-tab-count">{filteredTrends.length}</span>
          </button>
        </div>

        <div className="ca-trends-genre-filters">
          <span className="ca-filter-label">
            <Filter size={13} />
            <span>Genre:</span>
          </span>
          <button
            type="button"
            className={`ca-genre-pill ${selectedGenre === "all" ? "active" : ""}`}
            onClick={() => setSelectedGenre("all")}
          >
            All
          </button>
          {genres.map((g) => (
            <button
              key={g}
              type="button"
              className={`ca-genre-pill ${selectedGenre.toLowerCase() === g.toLowerCase() ? "active" : ""}`}
              onClick={() => setSelectedGenre(g.toLowerCase())}
            >
              {g.charAt(0).toUpperCase() + g.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* ── Active Content Showcase ── */}
      <div className="ca-trends-showcase-wrap">
        <AnimatePresence mode="wait">
          {activeTab === "ideas" ? (
            /* ─────────────────────────────────────────────────────────────
               VIRAL VIDEO IDEAS (WITH HOOKS & 1-CLICK ACTIONS)
            ───────────────────────────────────────────────────────────── */
            <motion.div
              key="ideas-grid"
              className="ca-video-ideas-grid"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
            >
              {filteredIdeas.map((idea, idx) => (
                <motion.div
                  key={idx}
                  className="ca-idea-card ca-glass"
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                >
                  <div className="ca-idea-card-header">
                    <div className="ca-idea-genres">
                      {idea.genres.map((g) => (
                        <span key={g} className="ca-idea-genre-chip">
                          {g}
                        </span>
                      ))}
                    </div>
                    {idea.trends[0] && (
                      <span className="ca-idea-trend-chip" title={idea.trends.join(", ")}>
                        <TrendingUp size={11} />
                        <span>{idea.trends[0]}</span>
                      </span>
                    )}
                  </div>

                  <h3 className="ca-idea-title">{idea.title}</h3>

                  {/* Viral Curiosity Hook Box */}
                  <div className="ca-idea-hook-box">
                    <div className="ca-hook-top">
                      <span className="ca-hook-badge">
                        <Flame size={12} className="text-amber-500" />
                        <span>Viral Hook Script</span>
                      </span>
                      <button
                        type="button"
                        className="ca-copy-hook-btn"
                        onClick={() => handleCopyHook(idea.hook)}
                        title="Copy hook to clipboard"
                      >
                        {copiedHook === idea.hook ? (
                          <>
                            <Check size={13} className="text-emerald-500" />
                            <span className="text-emerald-600 font-semibold">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy size={13} />
                            <span>Copy Hook</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="ca-hook-text">“{idea.hook}”</p>
                  </div>

                  {/* Action Footer */}
                  <div className="ca-idea-footer">
                    <button
                      type="button"
                      className="ca-search-inspiration-btn"
                      onClick={() => onSelectSearchTopic(idea.title)}
                    >
                      <Search size={13} />
                      <span>Search Creators in this Niche</span>
                      <ArrowUpRight size={13} />
                    </button>
                  </div>
                </motion.div>
              ))}

              {filteredIdeas.length === 0 && (
                <div className="ca-empty-trends-message ca-glass">
                  <Lightbulb size={24} className="text-amber-500" />
                  <p>No video ideas matched the selected genre filter.</p>
                  <button
                    type="button"
                    className="ca-reset-filter-btn"
                    onClick={() => setSelectedGenre("all")}
                  >
                    Reset Filter
                  </button>
                </div>
              )}
            </motion.div>
          ) : (
            /* ─────────────────────────────────────────────────────────────
               NICHE TREND RADAR (WITH MOMENTUM & KEYWORDS)
            ───────────────────────────────────────────────────────────── */
            <motion.div
              key="trends-grid"
              className="ca-trends-radar-grid"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
            >
              {filteredTrends.map((trend, idx) => {
                const badge = momentumBadges[trend.momentum.toLowerCase()] || momentumBadges.rising;
                const IconComponent = badge.icon;
                return (
                  <motion.div
                    key={idx}
                    className="ca-trend-card ca-glass"
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  >
                    <div className="ca-trend-card-header">
                      <span className="ca-trend-genre-tag">{trend.genre}</span>
                      <div className={`ca-trend-momentum-pill ${badge.bg} ${badge.text}`}>
                        <IconComponent size={12} />
                        <span>{badge.label}</span>
                      </div>
                    </div>

                    <h4 className="ca-trend-name">{trend.name}</h4>

                    <p className="ca-trend-rationale">{trend.whyTrending}</p>

                    <div className="ca-trend-keywords">
                      {trend.keywords.map((kw) => (
                        <button
                          key={kw}
                          type="button"
                          className="ca-keyword-chip"
                          onClick={() => onSelectSearchTopic(kw)}
                          title={`Search creators for "${kw}"`}
                        >
                          <span>#{kw}</span>
                          <Search size={10} className="ca-kw-icon" />
                        </button>
                      ))}
                    </div>
                  </motion.div>
                );
              })}

              {filteredTrends.length === 0 && (
                <div className="ca-empty-trends-message ca-glass">
                  <TrendingUp size={24} className="text-indigo-500" />
                  <p>No trends found for the current filter criteria.</p>
                  <button
                    type="button"
                    className="ca-reset-filter-btn"
                    onClick={() => {
                      setSelectedGenre("all");
                      setSelectedMomentum("all");
                    }}
                  >
                    Reset Filters
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.section>
  );
}
