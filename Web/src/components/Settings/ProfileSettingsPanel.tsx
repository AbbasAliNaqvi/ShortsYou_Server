"use client";

import { memo } from "react";
import { User, AtSign, Mail, Sparkles, Hash, Zap, BarChart2, BookOpen, Smile, Check } from "lucide-react";
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
  {
    id: "high-energy",
    label: "High-Energy",
    icon: Zap,
    desc: "Fast-paced, hook-driven, thrilling punchlines and dopamine retention cuts.",
    sample: '"Wait, stop scrolling! Look at this..."',
  },
  {
    id: "analytical",
    label: "Analytical",
    icon: BarChart2,
    desc: "Insightful, data-grounded, thought-provoking framework breakdowns.",
    sample: '"The exact 3-variable math behind virality..."',
  },
  {
    id: "storytelling",
    label: "Storytelling",
    icon: BookOpen,
    desc: "Emotional build-up, narrative arc, relatable real-world anecdotes.",
    sample: '"In 2021, everyone laughed at this decision..."',
  },
  {
    id: "humorous",
    label: "Humorous",
    icon: Smile,
    desc: "Witty, ironic, engaging, meme-compatible timing and relatable irony.",
    sample: '"When you deploy on a Friday afternoon..."',
  },
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
      <section className="ca-settings-card" aria-labelledby="creator-identity-heading">
        <div className="ca-settings-card-head">
          <div className="ca-settings-card-head-left">
            <div className="ca-settings-card-icon" aria-hidden="true">
              <User size={22} />
            </div>
            <div>
              <h2 id="creator-identity-heading">Creator Identity &amp; Channel</h2>
              <p>Your studio persona, public handle, and automated description defaults.</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {/* Avatar Selector */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 p-4 rounded-2xl bg-slate-50/80 border border-slate-200/90 shadow-2xs">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={profile.avatarUrl || "/hero-character-transparent.png"}
              alt={profile.displayName}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-900 shadow-md flex-shrink-0"
            />
            <div className="flex-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Studio Avatar Selection
              </span>
              <p className="text-xs text-slate-600 mt-0.5 mb-2.5">
                Choose a studio teammate avatar or link your custom creator photo.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {TEAM_AVATARS.map((av) => {
                  const isSelected = profile.avatarUrl === av.url;
                  return (
                    <button
                      key={av.name}
                      type="button"
                      onClick={() => updateProfile("avatarUrl", av.url)}
                      className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-xl border transition-all ${
                        isSelected
                          ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                          : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={av.url} alt="" className="w-4 h-4 rounded-full object-cover" />
                      <span>{av.name}</span>
                      {isSelected && <Check size={12} className="text-emerald-400" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="ca-settings-grid">
            <div className="ca-settings-field">
              <label htmlFor="settings-displayName" className="ca-settings-label">
                <span>Display Name</span>
              </label>
              <input
                id="settings-displayName"
                type="text"
                value={profile.displayName}
                onChange={(e) => updateProfile("displayName", e.target.value)}
                placeholder="e.g. Das Gajraj"
                className="ca-settings-input"
              />
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
                <Hash size={14} className="text-slate-500" />
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
              className="ca-settings-input font-mono text-xs"
            />
          </div>
        </div>
      </section>

      {/* ── AI Voice & Script Tone ── */}
      <section className="ca-settings-card" aria-labelledby="tone-heading">
        <div className="ca-settings-card-head">
          <div className="ca-settings-card-head-left">
            <div className="ca-settings-card-icon" aria-hidden="true">
              <Sparkles size={22} />
            </div>
            <div>
              <h2 id="tone-heading">Narrative &amp; Hook Tone</h2>
              <p>Guide the AI Agentic Director on script cadence, viral hook phrasing, and cut style.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {TONES.map((tone) => {
            const Icon = tone.icon;
            const isSelected = profile.contentTone === tone.id;
            return (
              <button
                key={tone.id}
                type="button"
                onClick={() => updateProfile("contentTone", tone.id)}
                className={`flex flex-col text-left p-4 rounded-2xl border transition-all ${
                  isSelected
                    ? "bg-rose-50/70 border-rose-600 shadow-sm ring-1 ring-rose-500/30"
                    : "bg-white border-slate-200/90 hover:border-slate-300 hover:shadow-xs"
                }`}
                aria-pressed={isSelected}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                      isSelected ? "bg-rose-600 text-white" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    <Icon size={16} />
                  </div>
                  {isSelected && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                      Active
                    </span>
                  )}
                </div>
                <span className="font-extrabold text-sm text-slate-900">{tone.label}</span>
                <span className="text-xs text-slate-600 mt-1 leading-relaxed">{tone.desc}</span>
                <span className="text-[10.5px] font-mono text-slate-400 mt-2.5 pt-2 border-t border-slate-100">
                  {tone.sample}
                </span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
});
