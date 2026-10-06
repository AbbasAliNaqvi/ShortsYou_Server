"use client";
/* eslint-disable @next/next/no-img-element */

import { motion } from "framer-motion";
import { Clapperboard, Eye, LoaderCircle, Radio, Users, Video } from "lucide-react";
import type { Channel } from "@/lib/api";
import { compactNumber } from "@/lib/formatters";

export interface ChannelBannerProps {
  channel: Channel;
  busy: boolean;
  onAddChannel: () => void;
}

export function ChannelBanner({ channel, busy, onAddChannel }: ChannelBannerProps) {
  return (
    <motion.section
      className="ca-channel-banner ca-glass"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="ca-channel-banner-left">
        <div className="ca-channel-avatar-lg">
          {channel.thumbnailUrl ? (
            <img src={channel.thumbnailUrl} alt={channel.title} />
          ) : (
            <div className="ca-channel-avatar-fallback">
              <Radio size={28} />
            </div>
          )}
        </div>

        <div className="ca-channel-details">
          <span className="ca-channel-tag">Selected Creator</span>
          <h2 className="ca-channel-title">{channel.title}</h2>
          {channel.description && (
            <p className="ca-channel-description">{channel.description}</p>
          )}

          <div className="ca-channel-stat-chips">
            <span className="ca-channel-stat-chip">
              <Users size={13} />
              <strong>{compactNumber(channel.subscriberCount)}</strong> subscribers
            </span>
            <span className="ca-channel-stat-chip">
              <Video size={13} />
              <strong>{compactNumber(channel.videoCount)}</strong> videos
            </span>
            <span className="ca-channel-stat-chip">
              <Eye size={13} />
              <strong>{compactNumber(channel.viewCount)}</strong> views
            </span>
          </div>
        </div>
      </div>

      <div className="ca-channel-banner-right">
        <motion.button
          type="button"
          className="ca-channel-add-btn"
          onClick={onAddChannel}
          disabled={busy}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.96 }}
        >
          {busy ? (
            <>
              <LoaderCircle className="spin" size={16} />
              <span>Adding creator…</span>
            </>
          ) : (
            <>
              <Clapperboard size={16} />
              <span>Add creator to studio</span>
            </>
          )}
        </motion.button>
      </div>
    </motion.section>
  );
}
