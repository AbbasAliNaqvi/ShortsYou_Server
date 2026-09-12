"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  CirclePlay,
  Code2,
  CloudUpload,
  Download,
  Equal,
  Layers3,
  LockKeyhole,
  Menu,
  Palette,
  Play,
  ShieldCheck,
  Sparkles,
  Split,
  Video,
  X,
  Zap,
} from "lucide-react";

const navItems = ["Engine", "Workflow", "Benchmarks", "Enterprise"];
const stages = [
  [
    "STAGE 01",
    "Ingestion & Demux",
    "Continuous multi-track audio and ProRes video ingestion via direct S3 endpoint, YouTube RSS cadence, or API hook.",
    "LATENCY",
    "Under 1.2s",
    CloudUpload,
  ],
  [
    "STAGE 02",
    "Cognitive Saliency",
    "Semantic retention weighting isolates rhetorical curiosity gaps, laughter anchors, and debate climaxes with millisecond precision.",
    "ACCURACY",
    "99.4% Virality Match",
    Sparkles,
  ],
  [
    "STAGE 03",
    "Reframing & Stacking",
    "Optical flow tracks eye level and facial micro-gestures, dynamically re-framing single speakers or stacking dialogue partners.",
    "PAN SPEED",
    "0.12s Smoothing",
    Split,
  ],
  [
    "STAGE 04",
    "4K Instant ProRes Master",
    "Broadcast audio mastered to -14 LUFS, kinetic karaoke styling rendered in GPU RAM, and 4K masters published simultaneously.",
    "RENDER",
    "18x Realtime",
    Video,
  ],
] as const;
const benchmarks = [
  [
    "Turnaround Time",
    "94%",
    "Faster production cycle",
    "From 3.5 hours per clip down to 42 seconds end-to-end.",
  ],
  [
    "Hook Retention",
    "4.8x",
    "Avg 3-second completion",
    "Trained on algorithmic drop-off curves across 100M+ views.",
  ],
  [
    "Audio Calibration",
    "-14",
    "LUFS · EBU R128 Compliant",
    "Multi-band vocal sweetening and automated room de-reverberation.",
  ],
  [
    "Human Overhead",
    "0.0s",
    "Touchless publishing",
    "Zero scrubbing, zero manual masking, zero timeline editing.",
  ],
];
const features = [
  [
    Sparkles,
    "Cognitive Hook Saliency",
    "Evaluates phoneme velocity, curiosity gaps, and narrative hooks against 100M+ viral impressions to cut dead air before viewer dropout.",
    "Retention Curve (Normalized)",
    "+412% over organic benchmark",
    true,
  ],
  [
    Split,
    "Dual-Speaker Dynamic Stacking",
    "Transforms wide 16:9 two-shots into stacked vertical frames with automated micro-panning that keeps speakers in optical focus.",
    "Focal Interpolation",
    "0.12s",
    false,
  ],
  [
    Equal,
    "Spectral Audio Cadence",
    "Removes room reverberation, air conditioner drone, and balances voice warmth to broadcasting standards (-14 LUFS).",
    "Harmonic Clarification",
    "192 kHz / 32-bit Float",
    false,
  ],
  [
    Layers3,
    "Batch Queue Orchestration",
    "Ingest entire channel archives via RSS or direct upload. Generate scheduled TikTok, Reels, and Shorts queues with automated metadata tags.",
    "Render Speed",
    "18x Realtime",
    true,
  ],
] as const;

export function HomeDashboard() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [studioActive, setStudioActive] = useState(false);
  const [exported, setExported] = useState(false);
  return (
    <div className="studio-page">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <div className="ambient ambient-three" />
      <header className="studio-nav">
        <a className="brand" href="#engine">
          <span className="brand-mark">
            <Video size={18} />
          </span>
          <span>
            Shorts<span>You</span>
            <i />
          </span>
        </a>
        <nav className={menuOpen ? "nav-links nav-open" : "nav-links"}>
          {navItems.map((item, index) => (
            <a
              className={index === 0 ? "active" : ""}
              href={`#${item.toLowerCase()}`}
              key={item}
              onClick={() => setMenuOpen(false)}
            >
              {item}
            </a>
          ))}
        </nav>
        <div className="nav-actions">
          <Link className="sign-in" href="/login">
            Sign In
          </Link>
          <Link className="button button-outline" href="/register">
            Start Now <ArrowRight size={14} />
          </Link>
          <button
            className="mobile-menu"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle navigation"
          >
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </header>
      <main>
        <section className="hero shell" id="engine">
          <div className="hero-copy reveal">
            <p className="eyebrow">
              <Sparkles size={13} /> Studio-grade AI video architecture
            </p>
            <h1>
              Automate Viral <em>Video Architecture.</em>
            </h1>
            <p className="hero-description">
              ShortsYou ingests multi-speaker podcasts and unedited broadcasts,
              semantically isolating high-retention narrative hooks and
              rendering 4K vertical exports with zero human latency.
            </p>
            <div className="hero-actions">
              <button
                className="button button-primary"
                onClick={() => setStudioActive(true)}
              >
                Launch Studio <Zap size={16} />
              </button>
              <button
                className="button button-glass"
                onClick={() => setStudioActive(!studioActive)}
              >
                <CirclePlay size={18} />{" "}
                {studioActive ? "Pause Film" : "Watch 90-sec Film"}{" "}
                <kbd>⌘K</kbd>
              </button>
            </div>
            <div className="proof">
              <div className="avatars">
                <span>JD</span>
                <span>SR</span>
                <span>14k</span>
              </div>
              <div>
                <strong>
                  ★ <b>4.9/5</b> studio satisfaction
                </strong>
                <small>Calibrated for broadcast syndication</small>
              </div>
              <div className="powered">
                Powering <b>Spotify</b> · <b>The Daily</b> · <b>All-In</b>
              </div>
            </div>
          </div>
          <StudioTerminal
            active={studioActive}
            exported={exported}
            onExport={() => setExported(true)}
          />
        </section>
        <section className="section shell">
          <SectionHeading
            eyebrow="Deterministic Neural Models"
            title="Surgical Precision. Liquid Workflow."
            text="Four deterministic neural models operating concurrently to isolate retention spikes, dynamically balance spatial composition, and calibrate vocal warmth."
          />
          <div className="feature-grid">
            {features.map(([Icon, title, text, meta, value, wide]) => (
              <FeatureCard
                key={title}
                icon={Icon}
                title={title}
                text={text}
                meta={meta}
                value={value}
                wide={wide}
              />
            ))}
          </div>
        </section>
        <section className="section shell" id="workflow">
          <SectionHeading
            eyebrow="Pipeline Execution"
            title="The 4-Stage Liquid Workflow."
            text="From uncompressed studio audio/video masters to platform-optimized 9:16 virality anchors in under sixty seconds."
          />
          <div className="stage-grid">
            {stages.map(([label, title, text, meta, value, Icon]) => (
              <article className="studio-card stage-card" key={title}>
                <div>
                  <div className="card-top">
                    <span className="stage-label">{label}</span>
                    <Icon size={20} />
                  </div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
                <div className="card-meta">
                  <span>{meta}</span>
                  <b>{value}</b>
                </div>
              </article>
            ))}
          </div>
        </section>
        <section className="section shell" id="benchmarks">
          <SectionHeading
            eyebrow="Verified Studio Benchmarks"
            title="Zero Human Latency. 4.8x Retention."
            text="Measured against conventional human editing suites and traditional linear post-production pipelines over 2,400 broadcast hours."
          />
          <div className="benchmark-grid">
            {benchmarks.map(([label, value, note, text]) => (
              <article className="studio-card benchmark-card" key={label}>
                <span className="mono muted">{label}</span>
                <strong>{value}</strong>
                <b>{note}</b>
                <p>{text}</p>
              </article>
            ))}
          </div>
          <div className="comparison studio-glass">
            <div className="comparison-heading">
              <div>
                <span className="mono muted">Production Comparison</span>
                <h3>Enterprise Podcasting Network vs. ShortsYou Studio</h3>
              </div>
              <span className="mono muted">
                ● ShortsYou Engine　○ Traditional Suite
              </span>
            </div>
            <div className="comparison-grid">
              {[
                ["All-In Podcast Clip Pack", "12 mins vs 14 hrs", "92%"],
                ["Huberman Lab Master Feeds", "+340% View Count", "88%"],
                ["Spotify Studios Syndication", "99.8% Reliability", "99%"],
              ].map(([label, value, width]) => (
                <div key={label}>
                  <div className="compare-label">
                    <span>{label}</span>
                    <b>{value}</b>
                  </div>
                  <div className="progress">
                    <i style={{ width }} />
                  </div>
                  <small>
                    Automated multi-speaker processing with zero frame drops.
                  </small>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="section shell" id="enterprise">
          <SectionHeading
            eyebrow="Security & Infrastructure"
            title="Studio Infrastructure for Media Titans."
            text="Air-gapped security, enterprise SAML SSO, on-premise neural render clusters, and fine-tuned brand LoRA styling engines."
          />
          <div className="enterprise-grid">
            <EnterpriseCard
              icon={ShieldCheck}
              title="SOC2 Type II & SAML SSO"
              text="Strict zero-retention data policies. Your unreleased raw footage and master audio tracks are never used for public training datasets."
              meta="Okta, Azure AD, OneLogin Certified"
            />
            <EnterpriseCard
              icon={Code2}
              title="Dedicated On-Prem Nodes"
              text="Deploy ShortsYou containerized inference pods on your own cloud VPC or bare-metal NVIDIA H100 clusters."
              meta="Cluster latency · < 8ms Interconnect"
            />
            <EnterpriseCard
              icon={Palette}
              title="Custom Brand LoRAs"
              text="Calibrate subtitle kinetic animations, bespoke typography sets, brand colour grading LUTs, and sonic watermarks."
              meta="Custom Glyphs & Kerning"
            />
          </div>
          <div className="enterprise-cta studio-glass">
            <div>
              <span className="eyebrow">Enterprise Deployment</span>
              <h3>Request Dedicated Enterprise Access.</h3>
              <p>
                Custom contracts, tailored SLA uptime agreements, volume API
                concessions, and dedicated production engineering support.
              </p>
            </div>
            <div className="cta-actions">
              <button className="button button-primary">
                Request Enterprise Access
              </button>
              <button className="button button-glass">
                Review Security Whitepaper
              </button>
            </div>
          </div>
        </section>
      </main>
      <footer className="studio-footer">
        <span>
          <b>
            Shorts<span>You</span>
          </b>{" "}
          · © 2025 ShortsYou Inc. Built for elite media operators.
        </span>
        <span className="status">
          <i /> All Systems Operational · 12ms latency
        </span>
        <span className="footer-links">
          Engine　 Workflow　 Benchmarks　 Enterprise　 Security　 Privacy
        </span>
      </footer>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  text,
}: {
  eyebrow: string;
  title: string;
  text: string;
}) {
  return (
    <div className="section-heading reveal">
      <span className="eyebrow">{eyebrow}</span>
      <h2>{title}</h2>
      <p>{text}</p>
    </div>
  );
}
function FeatureCard({
  icon: Icon,
  title,
  text,
  meta,
  value,
  wide,
}: {
  icon: typeof Sparkles;
  title: string;
  text: string;
  meta: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <article className={`studio-card feature-card ${wide ? "wide" : ""}`}>
      <div>
        <div className="card-top">
          <span className="feature-icon">
            <Icon size={19} />
          </span>
          <span className="telemetry">
            {title === "Cognitive Hook Saliency"
              ? "Drop-off Risk: 0.2%"
              : "AI De-Reverb Active"}
          </span>
        </div>
        <h3>{title}</h3>
        <p>{text}</p>
      </div>
      <div className="card-bottom">
        <div className="fake-graph">
          {[1, 2, 3, 4, 5, 6, 7].map((bar) => (
            <i key={bar} />
          ))}
        </div>
        <div className="card-meta">
          <span>{meta}</span>
          <b>{value}</b>
        </div>
      </div>
    </article>
  );
}
function EnterpriseCard({
  icon: Icon,
  title,
  text,
  meta,
}: {
  icon: typeof ShieldCheck;
  title: string;
  text: string;
  meta: string;
}) {
  return (
    <article className="studio-card enterprise-card">
      <span className="feature-icon">
        <Icon size={19} />
      </span>
      <h3>{title}</h3>
      <p>{text}</p>
      <div className="card-meta">
        <span>{meta}</span>
        <Check size={14} />
      </div>
    </article>
  );
}
function StudioTerminal({
  active,
  exported,
  onExport,
}: {
  active: boolean;
  exported: boolean;
  onExport: () => void;
}) {
  return (
    <div
      className={`terminal-wrap reveal reveal-late ${active ? "terminal-live" : ""}`}
    >
      <div className="terminal studio-glass">
        <div className="terminal-bar">
          <span className="traffic">
            <i />
            <i />
            <i />
          </span>
          <span className="mono">
            <LockKeyhole size={11} /> HUBERMAN_EP219_RAW_4K.MOV
          </span>
          <b>● {active ? "LIVE ANALYSIS" : "99.4% RETENTION"}</b>
        </div>
        <div className="video-frame">
          <div className="video-image" />
          <div className="studio-laser" />
          <div className="speaker-box">
            <span>● ACTIVE SPEAKER · PITCH: 142Hz</span>
            <i />
          </div>
          <div className="mic-card">
            <span className="mono">MIC 01: S. ALTMAN</span>
            <div className="wave">
              {[1, 2, 3, 4, 5, 6, 7].map((bar) => (
                <i key={bar} />
              ))}
            </div>
          </div>
          <div className="subtitle">
            « ...the single greatest leverage in 2025 is{" "}
            <b>instant narrative distribution.</b> »
          </div>
        </div>
        <div className="terminal-controls">
          <div className="timeline">
            <span>00:14.28</span>
            <i>
              <b />
            </i>
            <span>00:48.00</span>
          </div>
          <div className="controls-row">
            <button>
              <Play size={12} />
            </button>
            <span className="mono">9:16　 16:9</span>
            <span className="mono muted">4K ProRes 422</span>
            <button className="export" onClick={onExport}>
              {exported ? <Check size={12} /> : <Download size={12} />}{" "}
              {exported ? "Queued" : "Export"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
