"use client";
/* eslint-disable @next/next/no-img-element */

import { Zap } from "lucide-react";
import type { PublicVideo } from "@/lib/api";
import { formatDuration } from "@/lib/formatters";

export interface VideoSearchResultsProps {
  results: PublicVideo[];
  onSelect: (video: PublicVideo) => void;
  onClear: () => void;
}

export function VideoSearchResults({
  results,
  onSelect,
  onClear,
}: VideoSearchResultsProps) {
  return (
    <>
      {results.length > 0 && (
        <section
          className="video-search-results ca-glass ca-section-box"
        >
          <div className="ca-search-bar-header">
            <span>Choose a video for AI Auto-Create</span>
            <button onClick={onClear}>Clear</button>
          </div>
          <div className="ca-search-grid">
            {results.map((video) => (
              <article
                key={video.youtubeVideoId}
                className="ca-search-card ca-glass"
              >
                <img src={video.thumbnailUrl} alt="" />
                <section>
                  <small>
                    {video.durationSeconds
                      ? formatDuration(video.durationSeconds)
                      : "YouTube video"}
                  </small>
                  <h3>{video.title}</h3>
                  <p>{video.description}</p>
                </section>
                <button onClick={() => onSelect(video)}>
                  <Zap size={14} /> AI Auto-Create
                </button>
              </article>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
