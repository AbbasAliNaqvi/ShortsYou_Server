"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import "@/styles/sections.css";

// ─── Inline SVG icons (no lucide-react) ───────────────────────────────────
const PATHS = {
  shield:  "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  server:  "M2 9h20M2 15h20M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z",
  palette: "M12 2a10 10 0 0 0 0 20c1.1 0 2-.9 2-2v-.5c0-.5.4-.9.9-.9h1.6a2 2 0 0 0 2-2A10 10 0 0 0 12 2zM8 12a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm2-4a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm4 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm2 4a1 1 0 1 1 0-2 1 1 0 0 1 0 2z",
  arrow:   "M5 12h14M13 6l6 6-6 6",
  mail:    "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6",
  video:   "M22 8l-6 4 6 4V8zM2 6h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2z",
} as const;

function Icon({ name, size = 18 }: { name: keyof typeof PATHS; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}

// ─── IntersectionObserver + rAF counter ───────────────────────────────────
function useCounter(target: number, decimals = 0) {
  const ref     = useRef<HTMLSpanElement>(null);
  const [val, setVal] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVal(target);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        observer.disconnect();
        const start     = performance.now();
        const duration  = 1400;
        const from      = 0;
        const range     = target - from;

        function tick(now: number) {
          const t = Math.min((now - start) / duration, 1);
          // ease-out cubic
          const eased = 1 - Math.pow(1 - t, 3);
          setVal(parseFloat((from + range * eased).toFixed(decimals)));
          if (t < 1) requestAnimationFrame(tick);
          else setVal(target);
        }
        requestAnimationFrame(tick);
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target, decimals]);

  return { ref, val };
}

// ─── Counter display ──────────────────────────────────────────────────────
function StatNum({
  value,
  decimals = 0,
  suffix = "",
}: {
  value: number;
  decimals?: number;
  suffix?: string;
}) {
  const { ref, val } = useCounter(value, decimals);
  return (
    <span ref={ref} className="sy-stat-num">
      {val.toFixed(decimals)}{suffix}
    </span>
  );
}

// ─── Animated compare bar ─────────────────────────────────────────────────
function CompareBar({ pct }: { pct: number }) {
  const fillRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = fillRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        observer.disconnect();
        requestAnimationFrame(() => {
          el.style.transform = `scaleX(${pct / 100})`;
        });
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [pct]);

  return (
    <div className="sy-compare-track">
      <div
        ref={fillRef}
        className="sy-compare-fill"
        style={{
          transform: "scaleX(0)",
          transition: "transform 1.2s cubic-bezier(0.16,1,0.3,1)",
        }}
      />
    </div>
  );
}

// ─── Section data ─────────────────────────────────────────────────────────
const steps = [
  {
    n: "1",
    title: "Ingest",
    body:  "Upload via direct file, RSS feed, or API call. Multi-track audio and 4K video are both supported.",
    stat:  "Ingest latency",
    val:   "< 1.2 s",
  },
  {
    n: "2",
    title: "Detect hooks",
    body:  "Semantic analysis finds curiosity gaps, laugh peaks, and debate climaxes — then marks the clip boundaries.",
    stat:  "Boundary precision",
    val:   "±120 ms",
  },
  {
    n: "3",
    title: "Reframe",
    body:  "Eye-line and gesture tracking reframes a solo speaker or stacks two speakers into a vertical split.",
    stat:  "Pan smoothing",
    val:   "0.12 s",
  },
  {
    n: "4",
    title: "Export",
    body:  "Loudness-matched audio, burned captions, and a 4K master — delivered wherever you publish.",
    stat:  "Render speed",
    val:   "18× realtime",
  },
] as const;

const stats = [
  {
    label:    "Audio output",
    value:    -14,
    decimals: 0,
    suffix:   " LUFS",
    note:     "EBU R128 compliant",
    text:     "Automatic vocal balancing and room de-reverberation on every export.",
  },
  {
    label:    "Render speed",
    value:    18,
    decimals: 0,
    suffix:   "× realtime",
    note:     "Continuous throughput",
    text:     "A 60-minute episode produces clips in under four minutes end to end.",
  },
  {
    label:    "Queue capacity",
    value:    500,
    decimals: 0,
    suffix:   " ep",
    note:     "Batch processing",
    text:     "Process a full podcast back-catalogue in a single scheduled run.",
  },
  {
    label:    "Human touch",
    value:    0,
    decimals: 0,
    suffix:   " edits",
    note:     "Touchless publishing",
    text:     "No manual scrubbing, no timeline editing, no masking required.",
  },
] as const;

const comparisons = [
  {
    label: "News desk clip pack",
    value: "12 min vs 14 hrs",
    pct:   92,
    note:  "Automated multi-speaker processing, zero frame drops.",
  },
  {
    label: "Podcast short-form feed",
    value: "Full back-catalogue processed overnight",
    pct:   85,
    note:  "Consistent hook detection across every episode.",
  },
  {
    label: "Studio syndication",
    value: "One API call, every platform",
    pct:   98,
    note:  "Zero manual QA across a thousand-episode backlog.",
  },
] as const;

const entCards = [
  {
    icon:  "shield" as const,
    title: "Data isolation by default",
    body:  "Your raw footage and masters are never used to train any public model. Zero-retention storage is on by default.",
    meta:  "SAML & OIDC ready",
  },
  {
    icon:  "server" as const,
    title: "On-prem deployment",
    body:  "Run ShortsYou inside your own VPC or bare-metal cluster. Network traffic never leaves your perimeter.",
    meta:  "< 8 ms interconnect",
  },
  {
    icon:  "palette" as const,
    title: "Brand styling",
    body:  "Caption motion, typeface, colour grading, and audio watermarks — all tuned to your brand guidelines.",
    meta:  "Custom LUTs & kernels",
  },
] as const;

// ─── Main component ───────────────────────────────────────────────────────
export function Sections() {
  return (
    <div className="sy-landing">
      {/* ── Features bento ──────────────────────────────── */}
      <section className="sy-section" id="features" aria-labelledby="features-heading">
        <div className="sy-shell">
          <div className="sy-section-head">
            <h2 id="features-heading">What ShortsYou does</h2>
            <p>
              Every piece of the pipeline — detection, reframing, audio, captions —
              runs automatically so your team ships clips, not timelines.
            </p>
          </div>
          <div className="sy-features">

            {/* Card 1 — Hook detection (wide) */}
            <article className="sy-feat sy-glass">
              <div className="sy-feat-label">Hook detection · live</div>
              <h3>Find the moments that make people stop</h3>
              <p>
                Semantic analysis scores every second for curiosity gap, emotional
                peak, and debate climax. The top hooks surface automatically.
              </p>
              <div className="sy-feat-visual">
                <div className="sy-waveform" aria-hidden="true">
                  {Array.from({ length: 16 }, (_, i) => <i key={i} />)}
                </div>
              </div>
            </article>

            {/* Card 2 — 9:16 reframe (narrow) */}
            <article className="sy-feat sy-glass">
              <div className="sy-feat-label">Speaker reframe · AI reframe active</div>
              <h3>Wide shots become vertical frames</h3>
              <p>
                Eye-line and gesture tracking reframes solo speakers or stacks
                two guests into a 9:16 split — automatically.
              </p>
              <div className="sy-feat-visual">
                <div className="sy-phone-frame" aria-hidden="true">
                  <div className="sy-phone-wide" />
                  <div className="sy-arrow-indicator">→</div>
                  <div className="sy-phone" />
                </div>
              </div>
            </article>

            {/* Card 3 — Loudness (narrow) */}
            <article className="sy-feat sy-glass">
              <div className="sy-feat-label">Audio processing · de-reverb active</div>
              <h3>Every voice lands at broadcast loudness</h3>
              <p>
                Room noise stripped, voices balanced, output mastered to
                −14 LUFS — the platform standard for TikTok, Reels, and Shorts.
              </p>
              <div className="sy-feat-visual">
                <div className="sy-lufs-meter" aria-hidden="true">
                  {[
                    { label: "Raw",    width: "72%",  target: false },
                    { label: "Vocal",  width: "60%",  target: false },
                    { label: "Output", width: "55%",  target: true  },
                  ].map((row) => (
                    <div className="sy-lufs-row" key={row.label}>
                      <span style={{ width: 42, flexShrink: 0 }}>{row.label}</span>
                      <div className="sy-lufs-bar-bg">
                        <div
                          className="sy-lufs-bar"
                          style={{ width: row.width, opacity: row.target ? 1 : 0.4 }}
                        />
                      </div>
                      {row.target && <span className="sy-lufs-target">−14 LUFS</span>}
                    </div>
                  ))}
                </div>
              </div>
            </article>

            {/* Card 4 — Batch queue (wide) */}
            <article className="sy-feat sy-glass">
              <div className="sy-feat-label">Batch queue · running</div>
              <h3>Point it at an archive, get a clip queue back</h3>
              <p>
                Drop in an RSS feed or a whole upload folder. ShortsYou builds
                a scheduled queue and renders at 18× realtime — no babysitting.
              </p>
              <div className="sy-feat-visual">
                <div className="sy-queue-list" aria-hidden="true">
                  {[
                    { status: "done",    label: "EP217 — 6 hooks detected",     time: "Done" },
                    { status: "active",  label: "EP218 — Reframing speakers…",  time: "2 min" },
                    { status: "pending", label: "EP219 — Queued",               time: "~8 min" },
                    { status: "pending", label: "EP220 — Queued",               time: "~14 min" },
                  ].map((item) => (
                    <div className="sy-queue-item" key={item.label}>
                      <span className={`sy-queue-dot ${item.status}`} />
                      <span className="sy-queue-label">{item.label}</span>
                      <span className="sy-queue-time">{item.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* ── Workflow timeline ────────────────────────────── */}
      <section className="sy-section" id="workflow" aria-labelledby="workflow-heading">
        <div className="sy-shell">
          <div className="sy-section-head">
            <h2 id="workflow-heading">How it works</h2>
            <p>
              Four stages from raw file to published clip. No timeline scrubbing,
              no manual masking, no export queue management.
            </p>
          </div>
          <div className="sy-workflow">
            {steps.map((step, i) => (
              <article className="sy-step sy-glass" key={step.title}>
                <div className="sy-step-num">
                  <div className={`sy-step-circle${i === 1 ? " active" : ""}`}>
                    {step.n}
                  </div>
                </div>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
                <div className="sy-step-stat">
                  <span>{step.stat}</span>
                  <b>{step.val}</b>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Results ─────────────────────────────────────── */}
      <section className="sy-section" id="results" aria-labelledby="results-heading">
        <div className="sy-shell">
          <div className="sy-section-head">
            <h2 id="results-heading">What you get</h2>
            <p>
              Concrete outputs — measured in formats, speeds, and capacities,
              not marketing claims.
            </p>
          </div>
          <div className="sy-stats-grid">
            {stats.map((s) => (
              <div className="sy-stat-card sy-glass" key={s.label}>
                <div className="sy-stat-label">{s.label}</div>
                <StatNum value={s.value} decimals={s.decimals} suffix={s.suffix} />
                <div className="sy-stat-note">{s.note}</div>
                <p className="sy-stat-text">{s.text}</p>
              </div>
            ))}
          </div>

          {/* Comparison panel */}
          <div className="sy-compare sy-glass" style={{ marginTop: 16 }}>
            <div className="sy-compare-head">In practice</div>
            {comparisons.map((c) => (
              <div className="sy-compare-row" key={c.label}>
                <div className="sy-compare-top">
                  <span>{c.label}</span>
                  <b>{c.value}</b>
                </div>
                <CompareBar pct={c.pct} />
                <p className="sy-compare-note">{c.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Enterprise ──────────────────────────────────── */}
      <section className="sy-section" id="enterprise" aria-labelledby="enterprise-heading">
        <div className="sy-shell">
          <div className="sy-section-head">
            <h2 id="enterprise-heading">Built for production teams</h2>
            <p>
              Network security, on-prem options, and brand control —
              ready for news desks, podcast networks, and creator studios.
            </p>
          </div>
          <div className="sy-enterprise-grid">
            {entCards.map((card) => (
              <article className="sy-ent-card sy-glass" key={card.title}>
                <div className="sy-ent-icon">
                  <Icon name={card.icon} size={18} />
                </div>
                <h3>{card.title}</h3>
                <p>{card.body}</p>
                <div className="sy-ent-meta">{card.meta}</div>
              </article>
            ))}
          </div>
          <div className="sy-ent-cta sy-glass" style={{ marginTop: 16 }}>
            <div>
              <h3>Talk to the team</h3>
              <p>
                Custom deployment, volume pricing, and dedicated support —
                get in touch and we&apos;ll scope it together.
              </p>
            </div>
            <div className="sy-ent-cta-actions">
              <Link href="/register" className="sy-btn-primary">
                Start free
              </Link>
              <a href="mailto:hello@shortsyou.ai" className="sy-btn-ghost">
                Contact us <Icon name="arrow" size={14} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────── */}
      <footer className="sy-footer" id="contact">
        <div className="sy-shell">
          <div className="sy-footer-top">
            {[
              {
                h: "Platform",
                links: ["Dashboard", "Discover", "Clips", "Analytics", "Editor"],
                hrefs: ["/dashboard", "/discover", "/clips", "/analytics", "/editor"],
              },
              {
                h: "Developers",
                links: ["API docs", "Webhooks", "Job queue", "System status", "Changelog"],
                hrefs: ["#api", "#webhooks", "#queue", "#status", "#changelog"],
              },
              {
                h: "Company",
                links: ["About", "Blog", "Careers", "Press", "Legal"],
                hrefs: ["#about", "#blog", "#careers", "#press", "#legal"],
              },
            ].map((col) => (
              <div className="sy-footer-col" key={col.h}>
                <h4>{col.h}</h4>
                {col.links.map((label, i) => (
                  <a key={label} href={col.hrefs[i]}>{label}</a>
                ))}
              </div>
            ))}
          </div>

          <div className="sy-footer-bottom">
            <div className="sy-footer-wordmark" aria-hidden="true">ShortsYou</div>
            <div className="sy-footer-contact" id="contact">
              <h5>Contact</h5>
              <a href="mailto:hello@shortsyou.ai">hello@shortsyou.ai</a>
              <div className="sy-footer-social">
                <a href="#instagram">Instagram</a>
                <a href="#linkedin">LinkedIn</a>
                <a href="#twitter">Twitter</a>
              </div>
            </div>
          </div>

          <div className="sy-footer-strip">
            <span>© 2026 ShortsYou Inc. All rights reserved.</span>
            <nav aria-label="Legal">
              <a href="#privacy">Privacy</a>
              <a href="#terms">Terms</a>
              <a href="#security">Security</a>
              <a href="#sitemap">Sitemap</a>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
