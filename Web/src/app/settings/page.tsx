"use client";

import { AlertCircle, CheckCircle2, Loader2, MessageCircle, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { api, type TelegramStatus } from "@/lib/api";

export default function SettingsPage() {
  const [token] = useState<string | null>(() =>
    typeof window === "undefined" ? null : localStorage.getItem("shortsyou_jwt"),
  );
  const [status, setStatus] = useState<TelegramStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      window.location.replace("/login");
      return;
    }
    api.telegramStatus(token)
      .then(setStatus)
      .catch((cause) => setError(cause instanceof Error ? cause.message : "Could not load Telegram status."))
      .finally(() => setLoading(false));
  }, [token]);

  async function connectTelegram() {
    if (!token) return;
    setConnecting(true);
    setError("");
    try {
      const result = await api.connectTelegram(token);
      window.location.assign(result.url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not create Telegram connection link.");
      setConnecting(false);
    }
  }

  async function disconnectTelegram() {
    if (!token || !window.confirm("Disconnect Telegram from this ShortsYou account?")) return;
    setDisconnecting(true);
    setError("");
    try {
      await api.disconnectTelegram(token);
      setStatus({ connected: false });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not disconnect Telegram.");
    } finally {
      setDisconnecting(false);
    }
  }

  if (!token || loading) {
    return (
      <main className="workspace-page settings-page ca-canvas-container">
        <div className="settings-loading" role="status" aria-live="polite">
          <Loader2 className="settings-spinner" size={20} aria-hidden />
          <span>Loading your settings...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="workspace-page settings-page ca-canvas-container">
      <div className="workspace-main ca-main-viewport">
        <section className="workspace-content ca-dashboard-content" style={{ maxWidth: 760 }}>
          <p className="settings-eyebrow">ACCOUNT SETTINGS</p>
          <h1 className="ca-header-title">Connect your creator tools</h1>
          <p className="settings-subtitle">
            Receive Short progress updates and approve or reject AI-generated clips directly from Telegram.
          </p>
          <article className="settings-card">
            <div className="settings-card-icon" aria-hidden>
              <MessageCircle size={24} />
            </div>
            <div className="settings-card-body">
              <div className="settings-card-heading">
                <div>
                  <p className="settings-card-kicker">CREATOR TOOL</p>
                  <h2>Telegram Assistant</h2>
                </div>
                {status?.connected && (
                  <span className="settings-connected-badge">
                    <CheckCircle2 size={15} aria-hidden />
                    Connected
                  </span>
                )}
              </div>
              <p className="settings-card-description">
                  {status?.connected
                    ? `Connected${status.username ? ` as @${status.username}` : ""}.`
                    : "Connect Telegram to receive notifications and review Shorts without leaving the conversation."}
              </p>
              {!status?.connected && (
                <button className="settings-connect-button" onClick={connectTelegram} disabled={connecting}>
                  {connecting ? <Loader2 className="settings-spinner" size={17} aria-hidden /> : <MessageCircle size={17} aria-hidden />}
                  {connecting ? "Opening Telegram..." : "Connect Telegram"}
                </button>
              )}
              {status?.connected && (
                <div className="settings-connected-actions">
                  <div className="settings-security-note">
                    <ShieldCheck size={18} aria-hidden />
                    <span>Account linked securely through a one-time connection link.</span>
                  </div>
                  <button
                    className="settings-disconnect-button"
                    onClick={disconnectTelegram}
                    disabled={disconnecting}
                  >
                    {disconnecting && <Loader2 className="settings-spinner" size={15} aria-hidden />}
                    {disconnecting ? "Disconnecting..." : "Disconnect Telegram"}
                  </button>
                </div>
              )}
              {error && (
                <p className="settings-error" role="alert">
                  <AlertCircle size={16} aria-hidden />
                  {error}
                </p>
              )}
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
