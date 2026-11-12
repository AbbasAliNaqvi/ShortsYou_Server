"use client";

import { MessageCircle, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { api, type TelegramStatus } from "@/lib/api";

export default function SettingsPage() {
  const [token] = useState<string | null>(() =>
    typeof window === "undefined" ? null : localStorage.getItem("shortsyou_jwt"),
  );
  const [status, setStatus] = useState<TelegramStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
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

  if (!token || loading) {
    return <main className="workspace-page ca-canvas-container" style={{ padding: 48 }}>Loading settings...</main>;
  }

  return (
    <main className="workspace-page ca-canvas-container">
      <div className="workspace-main ca-main-viewport">
        <section className="workspace-content ca-dashboard-content" style={{ maxWidth: 760 }}>
          <p className="eyebrow">ACCOUNT SETTINGS</p>
          <h1 className="ca-header-title">Connect your creator tools</h1>
          <p className="ca-header-subtitle">
            Receive Short progress updates and approve or reject AI-generated clips directly from Telegram.
          </p>
          <article className="apple-card" style={{ marginTop: 28, padding: 28 }}>
            <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
              <MessageCircle size={30} aria-hidden />
              <div style={{ flex: 1 }}>
                <h2>Telegram Assistant</h2>
                <p style={{ marginTop: 8 }}>
                  {status?.connected
                    ? `Connected${status.username ? ` as @${status.username}` : ""}.`
                    : "Connect Telegram to receive notifications and review Shorts without leaving the conversation."}
                </p>
                {!status?.connected && (
                  <button className="ca-primary-button" style={{ marginTop: 18 }} onClick={connectTelegram} disabled={connecting}>
                    {connecting ? "Opening Telegram..." : "Connect Telegram"}
                  </button>
                )}
                {status?.connected && (
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 18 }}>
                    <ShieldCheck size={18} />
                    <span>Account linked securely through a one-time connection link.</span>
                  </div>
                )}
                {error && <p role="alert" style={{ color: "#b42318", marginTop: 16 }}>{error}</p>}
              </div>
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
