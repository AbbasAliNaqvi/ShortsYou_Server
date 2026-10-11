"use client";

import { Check, Music2, ScanFace, Subtitles } from "lucide-react";
import type { EditSettings } from "@/lib/api";

const layouts = [
  ["standard", "Smart portrait", "One focused speaker, intelligently framed."],
  ["two_frame", "Two faces", "Pin two speakers to upper and lower panels."],
  ["multi_face", "Multi-faces", "Keep up to three people visible in stacked panels."],
  ["auto_face", "Auto face", "Adapts from one to three panels as faces change."],
] as const;

export interface EditorControlPanelProps {
  settings: EditSettings;
  layout: string;
  hook: string;
  onUpdate: <K extends keyof EditSettings>(key: K, value: EditSettings[K]) => void;
  onSetHook: (val: string) => void;
}

export function EditorControlPanel({
  settings,
  layout,
  hook,
  onUpdate,
  onSetHook,
}: EditorControlPanelProps) {
  return (
    <aside className="ca-editor-controls-panel">
      {/* 1. Frame People Layout */}
      <section className="ca-editor-control-card ca-glass">
        <div className="ca-control-card-header">
          <div className="ca-control-icon-wrap">
            <ScanFace size={18} />
          </div>
          <div>
            <h2 className="ca-control-card-title">Frame People</h2>
            <span className="ca-control-card-sub">Face detection & dynamic layouts</span>
          </div>
        </div>

        <div className="ca-layout-options-grid">
          {layouts.map(([value, title, description]) => {
            const isSelected = layout === value;

            return (
              <button
                type="button"
                key={value}
                className={`ca-layout-option-btn ${isSelected ? "selected" : ""}`}
                onClick={() => onUpdate("layout", value)}
              >
                <div className="ca-layout-btn-top">
                  <span className={`ca-layout-radio ${isSelected ? "checked" : ""}`}>
                    {isSelected && <Check size={12} />}
                  </span>
                  <strong className="ca-layout-btn-title">{title}</strong>
                </div>
                <small className="ca-layout-btn-desc">{description}</small>
              </button>
            );
          })}
        </div>

        <p className="ca-control-note">
          Auto face analyzes the video through time: one face fills the frame; two or three faces
          are split vertically only while they are present.
        </p>
      </section>

      {/* 2. Captions & Opening Hook */}
      <section className="ca-editor-control-card ca-glass">
        <div className="ca-control-card-header">
          <div className="ca-control-icon-wrap">
            <Subtitles size={18} />
          </div>
          <div>
            <h2 className="ca-control-card-title">Captions & Hook</h2>
            <span className="ca-control-card-sub">Hook text & caption styling</span>
          </div>
        </div>

        <label className="ca-editor-field-label">
          <div className="ca-field-label-row">
            <span>Opening Hook Headline</span>
            <small>{hook.length}/100</small>
          </div>
          <input
            type="text"
            className="ca-editor-text-input"
            value={hook}
            maxLength={100}
            onChange={(e) => onSetHook(e.target.value)}
            placeholder="Stop the scroll (e.g. This changes everything…)"
          />
        </label>

        <p className="ca-control-note">
          The opening hook is a prominent headline shown for the first three seconds. Spoken captions
          come from your saved transcription.
        </p>

        <div className="ca-choice-row-wrap">
          <span className="ca-choice-row-label">Caption Style</span>
          <div className="ca-choice-pill-group">
            {(["bold", "karaoke", "minimal"] as const).map((value) => (
              <button
                type="button"
                key={value}
                className={`ca-choice-pill-btn ${settings.captionStyle === value ? "selected" : ""}`}
                onClick={() => onUpdate("captionStyle", value)}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Audio & Visual Polish */}
      <section className="ca-editor-control-card ca-glass">
        <div className="ca-control-card-header">
          <div className="ca-control-icon-wrap">
            <Music2 size={18} />
          </div>
          <div>
            <h2 className="ca-control-card-title">Polish & Grade</h2>
            <span className="ca-control-card-sub">Color grading, background, & background music</span>
          </div>
        </div>

        <label className="ca-editor-field-label">
          <span>Music Track Mood</span>
          <select
            className="ca-editor-select"
            value={settings.musicMood}
            onChange={(e) => onUpdate("musicMood", e.target.value)}
          >
            {[
              "energetic",
              "calm",
              "motivational",
              "dramatic",
              "neutral",
              "none",
            ].map((item) => (
              <option key={item} value={item}>
                {item.charAt(0).toUpperCase() + item.slice(1)}
              </option>
            ))}
          </select>
        </label>

        <div className="ca-choice-row-wrap">
          <span className="ca-choice-row-label">Color Grade Filter</span>
          <div className="ca-choice-pill-group">
            {[
              "warm",
              "cool",
              "vibrant",
              "cinematic",
              "natural",
            ].map((value) => (
              <button
                type="button"
                key={value}
                className={`ca-choice-pill-btn ${settings.colorGrade === value ? "selected" : ""}`}
                onClick={() => onUpdate("colorGrade", value)}
              >
                {value}
              </button>
            ))}
          </div>
        </div>

        <label className="ca-editor-field-label">
          <span>Canvas Background</span>
          <select
            className="ca-editor-select"
            value={settings.backgroundStyle}
            onChange={(e) => onUpdate("backgroundStyle", e.target.value)}
          >
            {[
              ["blur", "Liquid Blur"],
              ["dark_gradient", "Dark Gradient"],
              ["original", "Original Crop"],
              ["brand_color", "Brand Tint"],
            ].map(([val, label]) => (
              <option key={val} value={val}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <p className="ca-control-note">
          Pause and filler cutting are disabled here because cuts made after transcription shift
          word timestamps. Keeping the source timing intact makes exported captions frame-accurate.
        </p>
      </section>
    </aside>
  );
}
