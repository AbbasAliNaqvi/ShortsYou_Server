"use client";
/* eslint-disable @next/next/no-img-element */

import { motion } from "framer-motion";
import { Radio } from "lucide-react";
import type { Channel } from "@/lib/api";
import { compactNumber } from "@/lib/formatters";

export interface ChannelCandidatesProps {
  channels: Channel[];
  selectedChannel: Channel | null;
  onSelectChannel: (channel: Channel) => void;
  busy?: boolean;
}

export function ChannelCandidates({
  channels,
  selectedChannel,
  onSelectChannel,
  busy = false,
}: ChannelCandidatesProps) {
  if (channels.length === 0) return null;

  return (
    <section className="ca-candidates-section">
      <div className="ca-candidates-header">
        <span className="ca-candidates-tag">Search Results</span>
        <span className="ca-candidates-count">
          {channels.length} {channels.length === 1 ? "channel" : "channels"} found
        </span>
      </div>

      <div className="ca-candidates-grid">
        {channels.map((candidate) => {
          const isSelected = selectedChannel?.channelId === candidate.channelId;

          return (
            <motion.button
              type="button"
              key={candidate.channelId}
              className={`ca-candidate-card ca-glass ${isSelected ? "selected" : ""}`}
              onClick={() => onSelectChannel(candidate)}
              disabled={busy}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              <div className="ca-candidate-avatar-wrap">
                {candidate.thumbnailUrl ? (
                  <img
                    src={candidate.thumbnailUrl}
                    alt={candidate.title}
                    className="ca-candidate-avatar"
                  />
                ) : (
                  <div className="ca-candidate-avatar-fallback">
                    <Radio size={18} />
                  </div>
                )}
                {isSelected && <span className="ca-candidate-selected-dot" />}
              </div>

              <div className="ca-candidate-info">
                <strong className="ca-candidate-title" title={candidate.title}>
                  {candidate.title}
                </strong>
                <span className="ca-candidate-subs">
                  {compactNumber(candidate.subscriberCount)} subscribers
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}
