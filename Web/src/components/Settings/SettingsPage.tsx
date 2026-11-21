"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  User as UserIcon,
  Cpu,
  Subtitles,
  Share2,
  Bell,
  Save,
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

import "./Settings.css";

type TabId = "profile" | "engine" | "captions" | "integrations" | "notifications";

const TABS = [
  { id: "profile" as TabId, label: "Profile & Channel", icon: UserIcon },
  { id: "engine" as TabId, label: "AI Engine & Virality", icon: Cpu },
  { id: "captions" as TabId, label: "Captions & 9:16", icon: Subtitles },
  { id: "integrations" as TabId, label: "Telegram & Channels", icon: Share2 },
  { id: "notifications" as TabId, label: "Alerts & Audio", icon: Bell },
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

      // Populate cached user
      try {
        const storedUser = localStorage.getItem("shortsyou_user");
        if (storedUser) {
          const u = JSON.parse(storedUser);
          setUser(u);
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
    }, 400);
  };

  return (
    <WorkspaceShell
      title="Studio Settings"
      subtitle="Configure AI models, 9:16 caption styling, Telegram assistant, and creator profile"
      user={user}
    >
      <div className="ca-settings-container">
        {/* ── Top Bar: Segmented Tabs + Quick Telemetry ── */}
        <div className="ca-settings-top-bar">
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
                    <Icon size={15} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {telegramStatus?.connected && (
            <div className="ca-settings-quick-telemetry hidden sm:flex">
              <span className="ca-settings-status-chip connected">
                <CheckCircle2 size={13} />
                <span>Telegram Active (@{telegramStatus.username || "Bot"})</span>
              </span>
            </div>
          )}
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
        </div>

        {/* ── Floating Sticky Action Bar ── */}
        <aside className="ca-settings-sticky-bar" aria-label="Settings Actions">
          <div className="flex items-center gap-2.5">
            <span
              className={`inline-block w-2.5 h-2.5 rounded-full ${
                hasUnsavedChanges
                  ? "bg-amber-500 animate-pulse shadow-sm shadow-amber-500"
                  : "bg-emerald-500"
              }`}
              aria-hidden="true"
            />
            <span className="text-xs font-bold text-slate-700">
              {hasUnsavedChanges ? "You have unsaved changes" : "All preferences saved to local workspace"}
            </span>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="ca-settings-save-btn"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            <span>{saving ? "Saving Changes..." : "Save Preferences"}</span>
          </button>
        </aside>
      </div>
    </WorkspaceShell>
  );
}
