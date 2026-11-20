"use client";

import { memo } from "react";
import { User, AtSign, Mail, Sparkles, Hash } from "lucide-react";
import type { CreatorSettings } from "@/lib/settings";

export interface ProfileSettingsPanelProps {
  settings: CreatorSettings;
  onChange: (updater: (prev: CreatorSettings) => CreatorSettings) => void;
}

const NICHES = [
  "Tech & Coding",
  "Podcasts & Interviews",
  "Gaming & Streamers",
  "Finance & Business",
  "Comedy & Skits",
  "Fitness & Health",
  "Motivation & Self-Help",
  "Education & Science",
];

const TONES = [
  { id: "high-energy", label: "High-Energy", desc: "Fast-paced, hook-driven, thrilling punchlines" },
  { id: "analytical", label: "Analytical", desc: "Insightful, data-grounded, thought-provoking" },
  { id: "storytelling", label: "Storytelling", desc: "Emotional build-up, narrative arc, relatable" },
  { id: "humorous", label: "Humorous", desc: "Witty, ironic, engaging, meme-compatible" },
] as const;

const TEAM_AVATARS = [
  { name: "Das", url: "/team/das-gajraj-sharma.png" },
  { name: "Abbas", url: "/team/abbas-ali.png" },
  { name: "Mayank", url: "/team/mayank-dhingra.png" },
  { name: "Sammnyu", url: "/team/sammnyu-joshii.png" },
];

export const ProfileSettingsPanel = memo(function ProfileSettingsPanel({
  settings,
  onChange,
}: ProfileSettingsPanelProps) {
  const profile = settings.profile;

  const updateProfile = (field: keyof typeof profile, val: unknown) => {
    onChange((prev) => ({
      ...prev,
      profile: { ...prev.profile, [field]: val },
    }));
  };

  return (
    <div className="ca-settings-panel">
      {/* ── Creator Profile Information ── */}
      <section className="ca-settings-card ca-glass" aria-labelledby="creator-identity-heading">
        <div className="ca-settings-card-head">
          <div className="ca-settings-card-head-left">
            <div className="ca-settings-card-icon" aria-hidden="true">
              <User size={20} />
            </div>
            <div>
              <h2 id="creator-identity-heading">Creator Identity &amp; Channel</h2>
              <p>Your studio persona, public handle, and automated description defaults.</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {/* Avatar Selector */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 p-4 rounded-2xl bg-white/60 border border-slate-200/80">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={profile.avatarUrl || "/hero-character-transparent.png"}
              alt={profile.displayName}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-800 shadow-md"
            />
            <div className="flex-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Avatar Selection</span>
              <p className="text-xs text-slate-500 mt-0.5 mb-2.5">
                Choose a studio avatar or enter a custom image URL.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {TEAM_AVATARS.map((av) => (
                  <button
                    key={av.name}
                    type="button"
                    onClick={() => updateProfile("avatarUrl", av.url)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full border transition-all ${
                      profile.avatarUrl === av.url
                        ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                        : "bg-white text-slate-700 border-slate-300 hover:border-slate-400"
                    }`}
                  >
                    <span>{av.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="ca-settings-grid">
            <div className="ca-settings-field">
              <label htmlFor="settings-displayName" className="ca-settings-label">
                <span>Display Name</span>
              </label>
              <div className="relative">
                <input
                  id="settings-displayName"
                  type="text"
                  value={profile.displayName}
                  onChange={(e) => updateProfile("displayName", e.target.value)}
                  placeholder="e.g. Das Gajraj"
                  className="ca-settings-input"
                />
              </div>
            </div>

            <div className="ca-settings-field">
              <label htmlFor="settings-handle" className="ca-settings-label">
                <span>Creator Handle</span>
                <span className="ca-settings-hint">Used for @tagging &amp; watermarks</span>
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-slate-400 font-semibold text-sm">
                  <AtSign size={15} />
                </span>
                <input
                  id="settings-handle"
                  type="text"
                  value={profile.handle}
                  onChange={(e) => updateProfile("handle", e.target.value.replace(/^@/, ""))}
                  placeholder="channelname"
                  className="ca-settings-input"
                  style={{ paddingLeft: "34px" }}
                />
              </div>
            </div>

            <div className="ca-settings-field">
              <label htmlFor="settings-email" className="ca-settings-label">
                <span>Email Address</span>
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-slate-400">
                  <Mail size={15} />
                </span>
                <input
                  id="settings-email"
                  type="email"
                  value={profile.email}
                  onChange={(e) => updateProfile("email", e.target.value)}
                  placeholder="creator@studio.com"
                  className="ca-settings-input"
                  style={{ paddingLeft: "34px" }}
                />
              </div>
            </div>

            <div className="ca-settings-field">
              <label htmlFor="settings-niche" className="ca-settings-label">
                <span>Primary Channel Niche</span>
                <span className="ca-settings-hint">Calibrates AI Hook scoring</span>
              </label>
              <select
                id="settings-niche"
                value={profile.niche}
                onChange={(e) => updateProfile("niche", e.target.value)}
                className="ca-settings-select"
              >
                {NICHES.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="ca-settings-field">
            <label htmlFor="settings-bio" className="ca-settings-label">
              <span>Creator Bio / Channel Tagline</span>
              <span className="ca-settings-hint">Auto-injected into YouTube &amp; Reels descriptions</span>
            </label>
            <textarea
              id="settings-bio"
              value={profile.bio}
              onChange={(e) => updateProfile("bio", e.target.value)}
              placeholder="Short description of your content style..."
              className="ca-settings-textarea"
              rows={2}
            />
          </div>

          <div className="ca-settings-field">
            <label htmlFor="settings-hashtags" className="ca-settings-label">
              <span className="inline-flex items-center gap-1.5">
                <Hash size={14} />
                <span>Default Hashtags</span>
              </span>
              <span className="ca-settings-hint">Appended to exported clip metadata</span>
            </label>
            <input
              id="settings-hashtags"
              type="text"
              value={profile.defaultHashtags}
              onChange={(e) => updateProfile("defaultHashtags", e.target.value)}
              placeholder="#Shorts #AI #Trending"
              className="ca-settings-input"
            />
          </div>
        </div>
      </section>

      {/* ── AI Voice & Script Tone ── */}
      <section className="ca-settings-card ca-glass" aria-labelledby="tone-heading">
        <div className="ca-settings-card-head">
          <div className="ca-settings-card-head-left">
            <div className="ca-settings-card-icon" aria-hidden="true">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 id="tone-heading">Narrative &amp; Hook Tone</h2>
              <p>Guide the AI Agentic Director on script cadence, viral hook phrasing, and cut style.</p>
            </div>
          </div>
        </div>

        <div className="ca-settings-preset-grid">
          {TONES.map((tone) => {
            const isSelected = profile.contentTone === tone.id;
            return (
              <button
                key={tone.id}
                type="button"
                onClick={() => updateProfile("contentTone", tone.id)}
                className={`ca-settings-preset-btn ${isSelected ? "selected" : ""}`}
                aria-pressed={isSelected}
              >
                <span className="ca-settings-preset-title">{tone.label}</span>
                <span className="ca-settings-preset-desc">{tone.desc}</span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
});
