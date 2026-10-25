"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import "@/styles/hero.css";

// ─── Inline SVG icon system (zero external libraries) ────────────────────────
const PATHS = {
  spark:    "M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z",
  video:    "M22 8l-6 4 6 4V8zM2 6h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2z",
  mic:      "M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3zM19 10v2a7 7 0 0 1-14 0v-2M12 19v3",
  layers:   "M12 2l10 5-10 5L2 7l10-5zM2 17l10 5 10-5M2 12l10 5 10-5",
  calendar: "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z",
  arrow:    "M5 12h14M13 6l6 6-6 6",
  up:       "M12 19V5M6 11l6-6 6 6",
  clock:    "M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z",
  user:     "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
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

// ─── Real ShortsYou Pipeline Data (from origin/main) ───────────────────────
const dock = [
  { icon: "spark"    as const, label: "Hooks"    },
  { icon: "video"    as const, label: "Reframe"  },
  { icon: "user"     as const, label: "Speakers" },
  { icon: "layers"   as const, label: "Queue"    },
  { icon: "calendar" as const, label: "Schedule" },
];

const clips: [string, string][] = [
  ["Hook 01", "The best ideas die in unwatched timelines"],
  ["Hook 02", "Why the first three seconds decide everything"],
  ["Hook 03", "The mistake every podcast makes with intros"],
  ["Hook 04", "What 100 million views taught us about drop-off"],
  ["Hook 05", "Two guests, one frame, no manual cropping"],
];

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const [sent, setSent] = useState(false);
  const [tool, setTool] = useState(0);

  // ── High-Performance Pure JS Scroll & Parallax Engine (Zero Libraries) ──
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      window.matchMedia("(pointer: coarse)").matches
    ) return;

    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    let targetScroll = 0;
    let currentScroll = 0;

    let running = true;
    let rafId = 0;

    const onPointerMove = (e: PointerEvent) => {
      targetX = (e.clientX / window.innerWidth) * 2 - 1;
      targetY = (e.clientY / window.innerHeight) * 2 - 1;
    };

    const onScroll = () => {
      targetScroll = window.scrollY;
    };

    // Smooth inertia interpolation loop
    const tick = () => {
      if (!running) return;

      // Pointer spring smoothing
      currentX += (targetX - currentX) * 0.08;
      currentY += (targetY - currentY) * 0.08;

      // Scroll spring smoothing
      currentScroll += (targetScroll - currentScroll) * 0.1;

      const viewportH = window.innerHeight || 800;
      const progress = Math.min(Math.max(currentScroll / viewportH, 0), 1);

      el.style.setProperty("--px", currentX.toFixed(4));
      el.style.setProperty("--py", currentY.toFixed(4));
      el.style.setProperty("--scroll-y", currentScroll.toFixed(1));
      el.style.setProperty("--scroll-p", progress.toFixed(4));

      rafId = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    rafId = requestAnimationFrame(tick);

    return () => {
      running = false;
      cancelAnimationFrame(rafId);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <section className="hx" ref={ref} id="hero">
      {/* ── Man Profile Hero Photo with Dynamic Parallax & Scale Zoom ─── */}
      <div className="hx-sky" aria-hidden="true" />
      <div className="hx-sky-tint" aria-hidden="true" />

      {/* ── Nav ─────────────────────────────────────────── */}
      <header className="hx-nav">
        <Link href="/" className="hx-brand">
          <span className="hx-mark"><Icon name="video" size={16} /></span>
          ShortsYou
        </Link>

        <nav className="hx-links" aria-label="Primary">
          <a href="#features">Product</a>
          <a href="#workflow">Workflow</a>
          <a href="#results">Results</a>
          <a href="#enterprise">Enterprise</a>
          <a href="#contact">Contact us</a>
        </nav>

        <div className="hx-nav-end">
          <Link href="/login" className="hx-login">Log in</Link>
          <Link href="/register" className="hx-signup">Sign up</Link>
        </div>
      </header>

      {/* ── Centered Headline & CTA with Scroll-Driven Fade ─── */}
      <div className="hx-head">
        <h1 className="hx-title">Turn long episodes into shorts, automatically</h1>
        <Link href="/register" className="hx-cta">
          Get ShortsYou
          <span className="hx-cta-arrow"><Icon name="arrow" size={20} /></span>
        </Link>
      </div>

      {/* ── 1. Left Card: AI Assistant (Compact & Orbiting on Scroll) ─ */}
      <aside
        className="fx glass hx-chat"
        style={{ "--i": 1 } as CSSProperties}
        aria-label="Assistant preview"
      >
        <div className="hx-card-kicker">
          <Icon name="spark" size={13} />
          <span>ShortsYou Assistant</span>
        </div>
        <p className="hx-chat-lead">
          I found 6 strong hooks in EP219 and reframed each to 9:16 vertical. Ready to queue them?
        </p>
        <div className="hx-bubble">yes!</div>
        <div className="hx-times">
          <span className="hx-time"><Icon name="clock" size={12} /> Monday at 6:00 PM</span>
          <span className="hx-time"><Icon name="clock" size={12} /> Tuesday at 12:30 PM</span>
        </div>
        {sent ? (
          <p className="hx-done">✓ Hook 01 queued for Monday at 6:00 PM.</p>
        ) : (
          <form
            className="hx-ask"
            onSubmit={(e) => { e.preventDefault(); setSent(true); }}
          >
            <input
              defaultValue="schedule hook 01 for monday"
              aria-label="Message the assistant"
            />
            <button className="hx-send" type="submit" aria-label="Send">
              <Icon name="up" size={15} />
            </button>
          </form>
        )}
      </aside>

      {/* ── 2. Tool Dock (Floating between Chat & Center) ── */}
      <div
        className="fx glass hx-dock"
        role="toolbar"
        aria-label="Tools"
        style={{ "--i": 2 } as CSSProperties}
      >
        {dock.map((d, i) => (
          <button
            key={d.label}
            aria-label={d.label}
            aria-pressed={tool === i}
            onClick={() => setTool(i)}
          >
            <Icon name={d.icon} size={18} />
          </button>
        ))}
      </div>

      {/* ── 3. Clip List (Bottom Left Quadrant, No Overlap) ─ */}
      <div
        className="fx glass hx-list"
        style={{ "--i": 3 } as CSSProperties}
        aria-label="Clip queue preview"
      >
        <div className="hx-tabs">
          <span className="hx-tab-active">Clips <b>6</b></span>
          <span>Queued <b>3</b></span>
          <span>Published <b>12</b></span>
          <span>Drafts <b>2</b></span>
        </div>
        <div className="hx-rows">
          {clips.map(([name, line], idx) => (
            <div className={`hx-row ${idx === 0 ? "active-row" : ""}`} key={name}>
              <span className="hx-row-name">{name}</span>
              <span className="hx-row-desc">{line}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── 4. Toast Notification ────────────────────────── */}
      <div
        className="fx glass hx-toast"
        style={{ "--i": 7 } as CSSProperties}
        aria-hidden="true"
      >
        <div className="hx-toast-icon"><Icon name="spark" size={15} /></div>
        <div className="hx-toast-text">Cut a 20-second clip from 14:02 and add captions</div>
      </div>

      {/* ── 5. Caption Editor (Right Side, Framing the Subject) ─ */}
      <article
        className="fx glass hx-doc"
        style={{ "--i": 4 } as CSSProperties}
        aria-label="Caption editor preview"
      >
        <div className="hx-doc-top">
          <span className="hx-doc-label"><Icon name="video" size={13} /> EP219 Clip Editor</span>
          <span className="hx-doc-share">Share</span>
        </div>
        <h3 className="hx-doc-title">EP219 · Hook 01 — Hook Saliency</h3>
        <p className="hx-doc-body">
          The best ideas die in <u>unwatched</u> timelines. If the{" "}
          <u>first three seconds</u> don&apos;t earn the next three, nobody stays to
          hear the point, so we lead with the line that makes people stop.
        </p>
        <div className="hx-tools" aria-hidden="true">
          <span>T</span>
          <span><b>B</b></span>
          <span><i>I</i></span>
          <span><u>U</u></span>
        </div>
      </article>

      {/* ── 6. Pill Chips ─────────────────────────────────── */}
      <div
        className="fx glass hx-chip c1"
        style={{ "--i": 5 } as CSSProperties}
        aria-hidden="true"
      >
        <Icon name="video" size={15} /> Reframe for 9:16
      </div>

      <div
        className="fx glass hx-chip c2"
        style={{ "--i": 6 } as CSSProperties}
        aria-hidden="true"
      >
        <Icon name="mic" size={15} /> Match loudness to −14 LUFS
      </div>
    </section>
  );
}
