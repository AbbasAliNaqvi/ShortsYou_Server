"use client";

import { Dna, RefreshCw, Sparkles } from "lucide-react";
import type { CreatorDNA } from "@/lib/api";

interface CreatorDNAPanelProps {
  dna: CreatorDNA | null;
  busy: boolean;
  onGenerate: (sync: boolean) => void;
}

export function CreatorDNAPanel({ dna, busy, onGenerate }: CreatorDNAPanelProps) {
  const topics = dna?.topicDistribution?.slice(0, 4) ?? [];
  const words = dna?.vocabularyProfile?.topWords?.slice(0, 8) ?? [];
  const ready = Boolean(dna && !dna.ready);

  return (
    <section className="ca-dna-panel ca-glass">
      <div className="ca-dna-heading">
        <div>
          <span className="ca-dna-eyebrow"><Dna size={13} /> Creator intelligence</span>
          <h2>Your Creator DNA</h2>
          <p>Turn your strongest topics, language, and delivery patterns into a repeatable creative signal.</p>
        </div>
        <div className="ca-dna-actions">
          <button type="button" onClick={() => onGenerate(false)} disabled={busy}>
            {busy ? <RefreshCw className="spin" size={13} /> : <Sparkles size={13} />}
            Generate DNA
          </button>
          {dna && (
            <button type="button" className="secondary" onClick={() => onGenerate(true)} disabled={busy}>
              Refresh profile
            </button>
          )}
        </div>
      </div>

      {!dna || ready ? (
        <div className="ca-dna-empty">
          <Dna size={28} />
          <strong>{dna?.message ?? "No DNA profile yet"}</strong>
          <span>Generate it after processing a few videos to unlock sharper topic and hook recommendations.</span>
        </div>
      ) : (
        <div className="ca-dna-grid">
          <div className="ca-dna-block ca-dna-topics">
            <span className="ca-dna-label">Top topics</span>
            {topics.map((topic) => (
              <div className="ca-dna-topic" key={`${topic.topic}-${topic.label}`}>
                <span>{topic.label}</span><b>{Math.round(topic.weight * 100)}%</b>
                <i><em style={{ width: `${Math.min(100, topic.weight * 100)}%` }} /></i>
              </div>
            ))}
          </div>
          <div className="ca-dna-block">
            <span className="ca-dna-label">Voice profile</span>
            <strong className="ca-dna-big-value">{dna.emotionalRange?.dominantEmotion ?? "Balanced"}</strong>
            <span className="ca-dna-muted">{Math.round(dna.speechProfile?.avgWpm ?? 0)} WPM average delivery</span>
            <span className="ca-dna-muted">{Math.round((dna.vocabularyProfile?.readabilityScore ?? 0) * 100)}% readability signal</span>
          </div>
          <div className="ca-dna-block">
            <span className="ca-dna-label">Signature vocabulary</span>
            <div className="ca-dna-word-cloud">{words.map((word) => <span key={word}>{word}</span>)}</div>
          </div>
          <div className="ca-dna-vector" aria-label="DNA vector">
            {(dna.dnaVector ?? []).map((value, index) => <i key={index} style={{ height: `${Math.max(8, value * 100)}%` }} />)}
          </div>
        </div>
      )}
    </section>
  );
}
