"use client";

import { memo, useState } from "react";
import { Bell, Volume2, Sparkles, CheckCircle2, AlertCircle } from "lucide-react";
import type { CreatorSettings } from "@/lib/settings";
import { notify } from "@/components/Notifications/NotificationCenter";

export interface NotificationsSettingsPanelProps {
  settings: CreatorSettings;
  onChange: (updater: (prev: CreatorSettings) => CreatorSettings) => void;
}

export const NotificationsSettingsPanel = memo(function NotificationsSettingsPanel({
  settings,
  onChange,
}: NotificationsSettingsPanelProps) {
  const notifications = settings.notifications;
  const [pushStatus, setPushStatus] = useState<string>(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
    return Notification.permission;
  });

  const updateNotifications = (field: keyof typeof notifications, val: unknown) => {
    onChange((prev) => ({
      ...prev,
      notifications: { ...prev.notifications, [field]: val },
    }));
  };

  const handleRequestPush = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      notify("Unsupported", "Browser push notifications are not supported in this environment.", "error");
      return;
    }
    const perm = await Notification.requestPermission();
    setPushStatus(perm);
    if (perm === "granted") {
      updateNotifications("browserPush", true);
      notify("Notifications Enabled", "You will now receive desktop alerts for completed video jobs.", "success");
    } else {
      updateNotifications("browserPush", false);
    }
  };

  const playTestSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch {}
    notify("Audio Feedback", "Sound effects enabled for studio actions.", "info");
  };

  return (
    <div className="ca-settings-panel">
      {/* ── Desktop & Browser Alerts ── */}
      <section className="ca-settings-card ca-glass" aria-labelledby="notification-heading">
        <div className="ca-settings-card-head">
          <div className="ca-settings-card-head-left">
            <div className="ca-settings-card-icon" aria-hidden="true">
              <Bell size={20} />
            </div>
            <div>
              <h2 id="notification-heading">Desktop &amp; In-App Alerts</h2>
              <p>Control browser push notifications, sound cues, and studio alerts.</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {/* Permission Card */}
          <div className="p-4 rounded-2xl bg-white/70 border border-slate-200/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-slate-900">Browser Push Notifications</span>
                {pushStatus === "granted" && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Granted
                  </span>
                )}
              </div>
              <span className="text-xs text-slate-500 mt-0.5 block">
                Receive alerts even when ShortsYou is running in background or minimized.
              </span>
            </div>

            {pushStatus !== "granted" ? (
              <button
                type="button"
                onClick={handleRequestPush}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 shadow-sm"
              >
                Enable Push
              </button>
            ) : (
              <label className="ca-settings-switch">
                <input
                  type="checkbox"
                  checked={notifications.browserPush}
                  onChange={(e) => updateNotifications("browserPush", e.target.checked)}
                />
                <span className="ca-settings-slider-round" />
              </label>
            )}
          </div>

          <div className="ca-settings-toggle-row">
            <div className="ca-settings-toggle-info">
              <span className="ca-settings-toggle-title">AI Job Completion Alerts</span>
              <span className="ca-settings-toggle-sub">
                Shows in-app banner toast as soon as audio transcription, clip indexing, or rendering finishes.
              </span>
            </div>
            <label className="ca-settings-switch">
              <input
                type="checkbox"
                checked={notifications.jobCompletionAlert}
                onChange={(e) => updateNotifications("jobCompletionAlert", e.target.checked)}
              />
              <span className="ca-settings-slider-round" />
            </label>
          </div>

          <div className="ca-settings-toggle-row">
            <div className="ca-settings-toggle-info">
              <div className="flex items-center gap-1.5">
                <Sparkles size={16} className="text-rose-600" />
                <span className="ca-settings-toggle-title">Viral Breakout Alerts (&gt;85 Projected Score)</span>
              </div>
              <span className="ca-settings-toggle-sub">
                Prioritizes clips that score within top 5% of viral retention benchmarks.
              </span>
            </div>
            <label className="ca-settings-switch">
              <input
                type="checkbox"
                checked={notifications.viralBreakoutAlert}
                onChange={(e) => updateNotifications("viralBreakoutAlert", e.target.checked)}
              />
              <span className="ca-settings-slider-round" />
            </label>
          </div>

          <div className="ca-settings-toggle-row">
            <div className="ca-settings-toggle-info">
              <div className="flex items-center gap-2">
                <span className="ca-settings-toggle-title">Interactive Sound Effects</span>
                <button
                  type="button"
                  onClick={playTestSound}
                  className="text-[11px] font-semibold text-rose-700 hover:underline flex items-center gap-1"
                >
                  <Volume2 size={12} />
                  <span>Test Tone</span>
                </button>
              </div>
              <span className="ca-settings-toggle-sub">
                Plays subtle audio feedback when swiping, approving clips, or saving settings.
              </span>
            </div>
            <label className="ca-settings-switch">
              <input
                type="checkbox"
                checked={notifications.soundEffects}
                onChange={(e) => updateNotifications("soundEffects", e.target.checked)}
              />
              <span className="ca-settings-slider-round" />
            </label>
          </div>
        </div>
      </section>
    </div>
  );
});
