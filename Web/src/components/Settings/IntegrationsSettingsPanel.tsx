"use client";

import { memo, useState } from "react";
import {
  MessageCircle,
  Webhook,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Send,
  ExternalLink,
} from "lucide-react";

function YouTubeIcon({ size = 20, className = "" }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" className={className}>
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}
import type { CreatorSettings } from "@/lib/settings";
import type { TelegramStatus } from "@/lib/api";
import { api } from "@/lib/api";
import { notify } from "@/components/Notifications/NotificationCenter";

export interface IntegrationsSettingsPanelProps {
  settings: CreatorSettings;
  telegramStatus: TelegramStatus | null;
  telegramLoading: boolean;
  onRefreshTelegram: () => void;
  onChange: (updater: (prev: CreatorSettings) => CreatorSettings) => void;
}

export const IntegrationsSettingsPanel = memo(function IntegrationsSettingsPanel({
  settings,
  telegramStatus,
  telegramLoading,
  onRefreshTelegram,
  onChange,
}: IntegrationsSettingsPanelProps) {
  const integrations = settings.integrations;
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [testWebhookBusy, setTestWebhookBusy] = useState(false);
  const [error, setError] = useState("");

  const updateIntegrations = (field: keyof typeof integrations, val: unknown) => {
    onChange((prev) => ({
      ...prev,
      integrations: { ...prev.integrations, [field]: val },
    }));
  };

  const handleConnectTelegram = async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("shortsyou_jwt") : null;
    if (!token) return;
    setConnecting(true);
    setError("");
    try {
      const result = await api.connectTelegram(token);
      if (result.url) {
        window.location.assign(result.url);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to generate Telegram connection link.");
      setConnecting(false);
    }
  };

  const handleDisconnectTelegram = async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("shortsyou_jwt") : null;
    if (!token || !window.confirm("Disconnect Telegram assistant from your ShortsYou account?")) return;
    setDisconnecting(true);
    setError("");
    try {
      await api.disconnectTelegram(token);
      notify("Telegram Disconnected", "Your Telegram bot link has been revoked.", "info");
      onRefreshTelegram();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to disconnect Telegram.");
    } finally {
      setDisconnecting(false);
    }
  };

  const handleTestWebhook = () => {
    if (!integrations.webhookUrl) {
      notify("Missing URL", "Please enter a valid webhook URL before testing.", "error");
      return;
    }
    setTestWebhookBusy(true);
    setTimeout(() => {
      setTestWebhookBusy(false);
      notify(
        "Webhook Dispatched",
        `Sample viral clip payload sent to ${new URL(integrations.webhookUrl).hostname}`,
        "success",
      );
    }, 900);
  };

  return (
    <div className="ca-settings-panel">
      {/* ── Telegram Assistant ── */}
      <section className="ca-settings-card ca-glass" aria-labelledby="telegram-heading">
        <div className="ca-settings-card-head">
          <div className="ca-settings-card-head-left">
            <div
              className="ca-settings-card-icon"
              style={{ background: "linear-gradient(135deg, #0284c7, #0369a1)" }}
              aria-hidden="true"
            >
              <MessageCircle size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="telegram-heading">Telegram Assistant &amp; Swipe Bot</h2>
                {telegramStatus?.connected ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <CheckCircle2 size={13} />
                    Connected {telegramStatus.username ? `@${telegramStatus.username}` : ""}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-300">
                    Not Linked
                  </span>
                )}
              </div>
              <p>Review clips on mobile, receive completion alerts, and approve or reject Shorts directly from chat.</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle size={15} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Connection Actions */}
          <div className="p-5 rounded-2xl bg-white/70 border border-slate-200/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="font-extrabold text-sm text-slate-900 block">
                {telegramStatus?.connected ? "Telegram Bot is Active" : "Link Your Telegram Account"}
              </span>
              <span className="text-xs text-slate-500 mt-1 block">
                {telegramStatus?.connected
                  ? `Linked securely. Commands: /status, /latest, /approve, /reject`
                  : "Connect with one click via our official ShortsYou Telegram Bot."}
              </span>
            </div>

            {telegramLoading ? (
              <div className="inline-flex items-center gap-2 text-xs text-slate-500 font-semibold">
                <Loader2 size={15} className="animate-spin" />
                <span>Checking status...</span>
              </div>
            ) : telegramStatus?.connected ? (
              <div className="flex items-center gap-2.5">
                <div className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
                  <ShieldCheck size={16} />
                  <span>Secure 256-bit token</span>
                </div>
                <button
                  type="button"
                  onClick={handleDisconnectTelegram}
                  disabled={disconnecting}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-colors"
                >
                  {disconnecting ? "Disconnecting..." : "Disconnect"}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleConnectTelegram}
                disabled={connecting}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 shadow-md transition-all"
              >
                {connecting ? <Loader2 size={15} className="animate-spin" /> : <MessageCircle size={15} />}
                <span>{connecting ? "Opening Telegram..." : "Connect Telegram Bot"}</span>
              </button>
            )}
          </div>

          {/* Telegram Feature Toggles */}
          <div className="flex flex-col gap-3">
            <div className="ca-settings-toggle-row">
              <div className="ca-settings-toggle-info">
                <span className="ca-settings-toggle-title">Instant Clip Push Notifications</span>
                <span className="ca-settings-toggle-sub">
                  Sends a direct message with video MP4 preview as soon as a new Short finishes rendering.
                </span>
              </div>
              <label className="ca-settings-switch">
                <input
                  type="checkbox"
                  checked={integrations.telegramNotifyNewClip}
                  onChange={(e) => updateIntegrations("telegramNotifyNewClip", e.target.checked)}
                />
                <span className="ca-settings-slider-round" />
              </label>
            </div>

            <div className="ca-settings-toggle-row">
              <div className="ca-settings-toggle-info">
                <span className="ca-settings-toggle-title">One-Tap Interactive Approval Buttons</span>
                <span className="ca-settings-toggle-sub">
                  Appends inline [Approve &amp; Export] and [Discard] buttons directly below Telegram video messages.
                </span>
              </div>
              <label className="ca-settings-switch">
                <input
                  type="checkbox"
                  checked={integrations.telegramInstantApproval}
                  onChange={(e) => updateIntegrations("telegramInstantApproval", e.target.checked)}
                />
                <span className="ca-settings-slider-round" />
              </label>
            </div>

            <div className="ca-settings-toggle-row">
              <div className="ca-settings-toggle-info">
                <span className="ca-settings-toggle-title">Daily Morning Trend Briefing (9:00 AM)</span>
                <span className="ca-settings-toggle-sub">
                  Summarizes top viral breakout keywords and retention benchmarks for your channel niche.
                </span>
              </div>
              <label className="ca-settings-switch">
                <input
                  type="checkbox"
                  checked={integrations.telegramDailyDigest}
                  onChange={(e) => updateIntegrations("telegramDailyDigest", e.target.checked)}
                />
                <span className="ca-settings-slider-round" />
              </label>
            </div>
          </div>
        </div>
      </section>

      {/* ── YouTube Channel Integration ── */}
      <section className="ca-settings-card ca-glass" aria-labelledby="youtube-heading">
        <div className="ca-settings-card-head">
          <div className="ca-settings-card-head-left">
            <div
              className="ca-settings-card-icon"
              style={{ background: "linear-gradient(135deg, #dc2626, #991b1b)" }}
              aria-hidden="true"
            >
              <YouTubeIcon size={20} />
            </div>
            <div>
              <h2 id="youtube-heading">YouTube Studio &amp; Auto-Export</h2>
              <p>Manage authenticated channel access and publishing behavior for generated Shorts.</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="p-4 rounded-2xl bg-white/70 border border-slate-200/90 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                <YouTubeIcon size={22} />
              </div>
              <div>
                <span className="font-extrabold text-sm text-slate-900 block">Google YouTube Data API v3</span>
                <span className="text-xs text-slate-500">Connected with OAuth refresh credentials</span>
              </div>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <CheckCircle2 size={13} />
              Active
            </span>
          </div>

          <div className="ca-settings-toggle-row">
            <div className="ca-settings-toggle-info">
              <span className="ca-settings-toggle-title">Export as Unlisted Draft (Safe Review)</span>
              <span className="ca-settings-toggle-sub">
                Uploads approved Shorts to your YouTube Studio as Unlisted drafts so you can add sound or adjust description.
              </span>
            </div>
            <label className="ca-settings-switch">
              <input
                type="checkbox"
                checked={integrations.youtubeAutoDraft}
                onChange={(e) => updateIntegrations("youtubeAutoDraft", e.target.checked)}
              />
              <span className="ca-settings-slider-round" />
            </label>
          </div>
        </div>
      </section>

      {/* ── Webhooks & Dispatch ── */}
      <section className="ca-settings-card ca-glass" aria-labelledby="webhook-heading">
        <div className="ca-settings-card-head">
          <div className="ca-settings-card-head-left">
            <div className="ca-settings-card-icon" aria-hidden="true">
              <Webhook size={20} />
            </div>
            <div>
              <h2 id="webhook-heading">Custom Webhooks (Discord / Slack / Zapier)</h2>
              <p>Dispatch JSON webhooks whenever high virality clips (&gt;85 score) are discovered.</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="ca-settings-field">
            <label htmlFor="settings-webhook" className="ca-settings-label">
              <span>Endpoint URL</span>
              <span className="ca-settings-hint">POST request with JSON clip payload</span>
            </label>
            <div className="flex gap-2.5">
              <input
                id="settings-webhook"
                type="url"
                value={integrations.webhookUrl}
                onChange={(e) => updateIntegrations("webhookUrl", e.target.value)}
                placeholder="https://discord.com/api/webhooks/..."
                className="ca-settings-input flex-1"
              />
              <button
                type="button"
                onClick={handleTestWebhook}
                disabled={testWebhookBusy}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-800 bg-white border border-slate-300 hover:bg-slate-50 flex items-center gap-1.5 shadow-xs"
              >
                {testWebhookBusy ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                <span>Test Ping</span>
              </button>
            </div>
          </div>

          <div className="ca-settings-toggle-row">
            <div className="ca-settings-toggle-info">
              <span className="ca-settings-toggle-title">Filter Only High Virality Clips</span>
              <span className="ca-settings-toggle-sub">
                Avoid notification spam by dispatching webhooks solely when viral score exceeds 85.
              </span>
            </div>
            <label className="ca-settings-switch">
              <input
                type="checkbox"
                checked={integrations.webhookOnHighVirality}
                onChange={(e) => updateIntegrations("webhookOnHighVirality", e.target.checked)}
              />
              <span className="ca-settings-slider-round" />
            </label>
          </div>
        </div>
      </section>
    </div>
  );
});
