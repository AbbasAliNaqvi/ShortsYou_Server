"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  User as UserIcon,
  Cpu,
  Subtitles,
  Share2,
  Bell,
  Sliders,
  Save,
  RotateCcw,
  CheckCircle2,
  Sparkles,
  Loader2,
} from "lucide-react";
import { WorkspaceShell } from "@/components/Layout";
import { notify } from "@/components/Notifications/NotificationCenter";
import {
  DEFAULT_SETTINGS,
  loadSettings,
  saveSettings,
  type CreatorSettings,
} from "@/lib/settings";
import { api, type TelegramStatus, type User } from "@/lib/api";

import { ProfileSettingsPanel } from "./ProfileSettingsPanel";
import { EngineSettingsPanel } from "./EngineSettingsPanel";
import { CaptionsSettingsPanel } from "./CaptionsSettingsPanel";
import { IntegrationsSettingsPanel } from "./IntegrationsSettingsPanel";
import { NotificationsSettingsPanel } from "./NotificationsSettingsPanel";
import { AdvancedSettingsPanel } from "./AdvancedSettingsPanel";

import "./Settings.css";

type TabId = "profile" | "engine" | "captions" | "integrations" | "notifications" | "advanced";

const TABS = [
  { id: "profile" as TabId, label: "Profile & Channel", icon: UserIcon },
  { id: "engine" as TabId, label: "AI & Virality Engine", icon: Cpu },
  { id: "captions" as TabId, label: "Captions & Framing", icon: Subtitles },
  { id: "integrations" as TabId, label: "Integrations & Telegram", icon: Share2 },
  { id: "notifications" as TabId, label: "Notifications", icon: Bell },
  { id: "advanced" as TabId, label: "API Keys & Advanced", icon: Sliders },
];

export function SettingsPage() {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [settings, setSettings] = useState<CreatorSettings>(DEFAULT_SETTINGS);
  const [initialSettingsStr, setInitialSettingsStr] = useState<string>("");
  const [activeTab, setActiveTab] = useState<TabId>("profile");
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Telegram Status
  const [telegramStatus, setTelegramStatus] = useState<TelegramStatus | null>(null);
  const [telegramLoading, setTelegramLoading] = useState(false);

  // Load Initial Settings & User
  useEffect(() => {
    const loaded = loadSettings();
    setSettings(loaded);
    setInitialSettingsStr(JSON.stringify(loaded));

    if (typeof window !== "undefined") {
      const jwt = localStorage.getItem("shortsyou_jwt");
      setToken(jwt);
      if (!jwt) {
        router.replace("/login");
        return;
      }

      // Populate user
      try {
        const storedUser = localStorage.getItem("shortsyou_user");
        if (storedUser) {
          const u = JSON.parse(storedUser);
          setUser(u);
          // Sync profile defaults if name exists
          if (u.name && (!loaded.profile.displayName || loaded.profile.displayName === DEFAULT_SETTINGS.profile.displayName)) {
            setSettings((prev) => ({
              ...prev,
              profile: {
                ...prev.profile,
                displayName: u.name || prev.profile.displayName,
                email: u.email || prev.profile.email,
                avatarUrl: u.profilePicture || prev.profile.avatarUrl,
              },
            }));
          }
        }
      } catch {}

      // Fetch live user & Telegram status
      api.me(jwt)
        .then((u) => {
          if (u) {
            setUser(u);
            localStorage.setItem("shortsyou_user", JSON.stringify(u));
          }
        })
        .catch(() => {});

      loadTelegram(jwt);
    }
  }, [router]);

  const loadTelegram = useCallback((jwtToken: string) => {
    setTelegramLoading(true);
    api.telegramStatus(jwtToken)
      .then(setTelegramStatus)
      .catch(() => {})
      .finally(() => setTelegramLoading(false));
  }, []);

  const hasUnsavedChanges = JSON.stringify(settings) !== initialSettingsStr;

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      saveSettings(settings);
      setInitialSettingsStr(JSON.stringify(settings));

      // Update user in localStorage if profile changed
      if (user) {
        const updatedUser: User = {
          ...user,
          name: settings.profile.displayName,
          email: settings.profile.email,
          profilePicture: settings.profile.avatarUrl,
          channelName: settings.profile.niche,
        };
        setUser(updatedUser);
        localStorage.setItem("shortsyou_user", JSON.stringify(updatedUser));
        window.dispatchEvent(new CustomEvent("shortsyou_user_updated", { detail: updatedUser }));
      }

      setSaving(false);
      notify(
        "Settings Saved",
        "Your AI engine configuration and creator preferences have been updated.",
        "success",
      );
    }, 450);
  };

  const handleReset = () => {
    if (!window.confirm("Reset all settings to default values?")) return;
    setSettings(DEFAULT_SETTINGS);
    saveSettings(DEFAULT_SETTINGS);
    setInitialSettingsStr(JSON.stringify(DEFAULT_SETTINGS));
    notify("Settings Reset", "Restored standard studio default configuration.", "info");
  };

  const handleSignOut = () => {
    if (!window.confirm("Are you sure you want to sign out of ShortsYou?")) return;
    localStorage.removeItem("shortsyou_jwt");
    localStorage.removeItem("shortsyou_user");
    notify("Signed Out", "You have been safely signed out.", "info");
    router.replace("/login");
  };

  return (
    <WorkspaceShell
      title="Studio Settings"
      subtitle="Configure AI models, 9:16 caption styling, Telegram assistant, and creator profile"
      user={user}
      onSignOut={handleSignOut}
    >
      <div className="ca-settings-container">
        {/* ── Top Hero Card ── */}
        <section className="ca-settings-hero ca-glass" aria-labelledby="settings-main-heading">
          <div className="ca-settings-hero-bg-glow" aria-hidden="true" />
          <div className="ca-settings-hero-header">
            <div className="ca-settings-badge-row">
              <span className="ca-settings-badge">
                <Sparkles size={12} />
                <span>ShortsYou Studio v2.4</span>
              </span>
              {telegramStatus?.connected ? (
                <span className="ca-settings-badge connected">
                  <CheckCircle2 size={12} />
                  <span>Telegram Active (@{telegramStatus.username || "Bot"})</span>
                </span>
              ) : (
                <span className="ca-settings-badge" style={{ color: "#475569", borderColor: "#cbd5e1" }}>
                  <span>AI Engine: {settings.engine.aiModel}</span>
                </span>
              )}
            </div>

            <h1 id="settings-main-heading" className="ca-settings-title">
              Workspace &amp; Creator Preferences
            </h1>

            <p className="ca-settings-desc">
              Tailor your automated short-form pipeline. Changes adjust how video transcripts are indexed,
              which clips are selected by the AI Director, and how captions render on mobile screens.
            </p>
          </div>
        </section>

        {/* ── Segmented Navigation Tabs ── */}
        <div className="ca-settings-nav-wrapper">
          <nav className="ca-settings-tabs" aria-label="Settings Categories">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`ca-settings-tab-btn ${isActive ? "active" : ""}`}
                  aria-selected={isActive}
                  role="tab"
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* ── Active Panel Display ── */}
        <div role="tabpanel" aria-live="polite">
          {activeTab === "profile" && (
            <ProfileSettingsPanel settings={settings} onChange={setSettings} />
          )}

          {activeTab === "engine" && (
            <EngineSettingsPanel settings={settings} onChange={setSettings} />
          )}

          {activeTab === "captions" && (
            <CaptionsSettingsPanel settings={settings} onChange={setSettings} />
          )}

          {activeTab === "integrations" && (
            <IntegrationsSettingsPanel
              settings={settings}
              telegramStatus={telegramStatus}
              telegramLoading={telegramLoading}
              onRefreshTelegram={() => token && loadTelegram(token)}
              onChange={setSettings}
            />
          )}

          {activeTab === "notifications" && (
            <NotificationsSettingsPanel settings={settings} onChange={setSettings} />
          )}

          {activeTab === "advanced" && (
            <AdvancedSettingsPanel
              settings={settings}
              onChange={setSettings}
              onSignOut={handleSignOut}
            />
          )}
        </div>

        {/* ── Floating Sticky Action Bar ── */}
        <aside className="ca-settings-sticky-bar ca-glass" aria-label="Settings Actions">
          <div className="flex items-center gap-3">
            <span
              className={`inline-block w-2.5 h-2.5 rounded-full ${
                hasUnsavedChanges ? "bg-amber-500 animate-pulse" : "bg-emerald-500"
              }`}
              aria-hidden="true"
            />
            <span className="text-xs font-bold text-slate-800">
              {hasUnsavedChanges ? "You have unsaved changes" : "All preferences saved to local workspace"}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleReset}
              className="ca-settings-reset-btn"
              title="Reset all settings to default"
            >
              <RotateCcw size={13} />
              <span>Reset Defaults</span>
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="ca-settings-save-btn"
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              <span>{saving ? "Saving Changes..." : "Save Preferences"}</span>
            </button>
          </div>
        </aside>
      </div>
    </WorkspaceShell>
  );
}
