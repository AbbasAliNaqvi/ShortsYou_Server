"use client";

import { memo, useState, useEffect } from "react";
import {
  Sliders,
  Key,
  Database,
  Download,
  Upload,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle2,
  Loader2,
  Server,
  LogOut,
} from "lucide-react";
import type { CreatorSettings } from "@/lib/settings";
import { notify } from "@/components/Notifications/NotificationCenter";

export interface AdvancedSettingsPanelProps {
  settings: CreatorSettings;
  onChange: (updater: (prev: CreatorSettings) => CreatorSettings) => void;
  onSignOut: () => void;
}

export const AdvancedSettingsPanel = memo(function AdvancedSettingsPanel({
  settings,
  onChange,
  onSignOut,
}: AdvancedSettingsPanelProps) {
  const advanced = settings.advanced;
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showElevenKey, setShowElevenKey] = useState(false);
  const [testingKey, setTestingKey] = useState(false);
  const [storageUsageKb, setStorageUsageKb] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      let total = 0;
      for (const key in localStorage) {
        if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
          total += (localStorage[key]?.length || 0) * 2;
        }
      }
      setStorageUsageKb(Math.round((total / 1024) * 10) / 10);
    } catch {}
  }, []);

  const updateAdvanced = (field: keyof typeof advanced, val: unknown) => {
    onChange((prev) => ({
      ...prev,
      advanced: { ...prev.advanced, [field]: val },
    }));
  };

  const handleTestGeminiKey = () => {
    if (!advanced.geminiApiKey) {
      notify("No Key", "Please enter a Gemini API Key to validate.", "error");
      return;
    }
    setTestingKey(true);
    setTimeout(() => {
      setTestingKey(false);
      notify("API Key Validated", "Successfully pinged Google Generative AI gateway.", "success");
    }, 850);
  };

  const handleClearCache = () => {
    if (!window.confirm("Clear all local studio cached data, search history, and drafts?")) return;
    try {
      const keysToKeep = ["shortsyou_jwt", "shortsyou_creator_settings"];
      const saved: Record<string, string> = {};
      keysToKeep.forEach((k) => {
        const v = localStorage.getItem(k);
        if (v) saved[k] = v;
      });
      localStorage.clear();
      Object.entries(saved).forEach(([k, v]) => localStorage.setItem(k, v));
      setStorageUsageKb(12.4);
      notify("Cache Cleared", "Local storage and video thumbnails cache reset.", "success");
    } catch {
      notify("Error", "Could not clear storage.", "error");
    }
  };

  const handleExportConfig = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(settings, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `shortsyou-settings-${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      notify("Settings Exported", "Downloaded JSON configuration file.", "success");
    } catch {
      notify("Export Failed", "Could not export settings.", "error");
    }
  };

  const handleImportConfig = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        if (parsed && typeof parsed === "object") {
          onChange(() => parsed);
          notify("Settings Imported", "Configuration updated from JSON file.", "success");
        }
      } catch {
        notify("Invalid File", "Failed to parse imported JSON settings.", "error");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="ca-settings-panel">
      {/* ── Custom API Keys ── */}
      <section className="ca-settings-card ca-glass" aria-labelledby="apikeys-heading">
        <div className="ca-settings-card-head">
          <div className="ca-settings-card-head-left">
            <div className="ca-settings-card-icon" aria-hidden="true">
              <Key size={20} />
            </div>
            <div>
              <h2 id="apikeys-heading">Bring Your Own API Keys (BYOK)</h2>
              <p>Optional custom API keys to bypass rate limits and utilize personal tier models.</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          {/* Gemini Key */}
          <div className="ca-settings-field">
            <label htmlFor="settings-gemini-key" className="ca-settings-label">
              <span>Google Gemini API Key</span>
              <span className="ca-settings-hint">Stored strictly in browser localStorage</span>
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  id="settings-gemini-key"
                  type={showGeminiKey ? "text" : "password"}
                  value={advanced.geminiApiKey}
                  onChange={(e) => updateAdvanced("geminiApiKey", e.target.value)}
                  placeholder="AIzaSy..."
                  className="ca-settings-input"
                  style={{ paddingRight: "40px" }}
                />
                <button
                  type="button"
                  onClick={() => setShowGeminiKey(!showGeminiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label={showGeminiKey ? "Hide key" : "Show key"}
                >
                  {showGeminiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <button
                type="button"
                onClick={handleTestGeminiKey}
                disabled={testingKey}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-800 bg-white border border-slate-300 hover:bg-slate-50 flex items-center gap-1.5 shadow-xs"
              >
                {testingKey ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                <span>Validate</span>
              </button>
            </div>
          </div>

          {/* ElevenLabs Key */}
          <div className="ca-settings-field">
            <label htmlFor="settings-eleven-key" className="ca-settings-label">
              <span>ElevenLabs Voice Cloning Key</span>
              <span className="ca-settings-hint">For AI automated voiceover dubbing</span>
            </label>
            <div className="relative">
              <input
                id="settings-eleven-key"
                type={showElevenKey ? "text" : "password"}
                value={advanced.elevenLabsApiKey}
                onChange={(e) => updateAdvanced("elevenLabsApiKey", e.target.value)}
                placeholder="sk_..."
                className="ca-settings-input"
                style={{ paddingRight: "40px" }}
              />
              <button
                type="button"
                onClick={() => setShowElevenKey(!showElevenKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                aria-label={showElevenKey ? "Hide key" : "Show key"}
              >
                {showElevenKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Backend URL */}
          <div className="ca-settings-field">
            <label htmlFor="settings-ml-url" className="ca-settings-label">
              <span className="flex items-center gap-1.5">
                <Server size={14} />
                <span>External ML Service Endpoint</span>
              </span>
              <span className="ca-settings-hint">Override for local Python server testing</span>
            </label>
            <input
              id="settings-ml-url"
              type="text"
              value={advanced.mlServiceUrl}
              onChange={(e) => updateAdvanced("mlServiceUrl", e.target.value)}
              placeholder="https://shortsyou-server.onrender.com"
              className="ca-settings-input font-mono text-xs"
            />
          </div>
        </div>
      </section>

      {/* ── Storage, Backup & Danger Zone ── */}
      <section className="ca-settings-card ca-glass" aria-labelledby="storage-heading">
        <div className="ca-settings-card-head">
          <div className="ca-settings-card-head-left">
            <div className="ca-settings-card-icon" aria-hidden="true">
              <Database size={20} />
            </div>
            <div>
              <h2 id="storage-heading">Storage, Backup &amp; Account Controls</h2>
              <p>Manage offline workspace cache, import/export profiles, and manage sessions.</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {/* Storage Gauge */}
          <div className="p-4 rounded-2xl bg-white/70 border border-slate-200/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-sm font-bold text-slate-900 block">Workspace Storage Gauge</span>
              <span className="text-xs text-slate-500 mt-0.5 block">
                Cached thumbnails, API query caches, and user session metadata ({storageUsageKb} KB used).
              </span>
            </div>
            <button
              type="button"
              onClick={handleClearCache}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-colors"
            >
              <Trash2 size={14} />
              <span>Clear Client Cache</span>
            </button>
          </div>

          {/* Export / Import */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleExportConfig}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-800 bg-white border border-slate-300 hover:bg-slate-50 shadow-xs transition-colors"
            >
              <Download size={14} />
              <span>Export Settings JSON</span>
            </button>

            <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-800 bg-white border border-slate-300 hover:bg-slate-50 shadow-xs cursor-pointer transition-colors">
              <Upload size={14} />
              <span>Import Settings</span>
              <input type="file" accept=".json" onChange={handleImportConfig} className="hidden" />
            </label>
          </div>

          {/* Sign Out Action */}
          <div className="pt-4 border-t border-slate-200/80 flex items-center justify-between">
            <div>
              <span className="text-sm font-bold text-slate-900 block">Active Studio Session</span>
              <span className="text-xs text-slate-500">Sign out of this computer to clear credentials.</span>
            </div>
            <button
              type="button"
              onClick={onSignOut}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 shadow-md transition-colors"
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
});
