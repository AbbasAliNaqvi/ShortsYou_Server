"use client";

import { useRouter } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type MouseEvent as ReactMouseEvent,
} from "react";
import Link from "next/link";
import {
  motion,
  AnimatePresence,
  useScroll,
  useMotionValueEvent,
  useMotionValue,
  useSpring,
  useTransform,
  useInView,
  animate,
} from "framer-motion";
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
  Pause,
  Play,
  ShieldCheck,
  Sparkles,
  Split,
  Video,
  X,
  Zap,
} from "lucide-react";

const EASE = [0.16, 1, 0.3, 1] as const;

const navItems = ["Engine", "Workflow", "Benchmarks", "Enterprise"];

const marqueeTags = [
  "PODCAST NETWORKS",
  "NEWS DESKS",
  "CREATOR STUDIOS",
  "BROADCAST TEAMS",
  "INDEPENDENT MEDIA",
  "STREAMING PLATFORMS",
];

const features = [
  {
    icon: Sparkles,
    tag: "Drop-off risk · 0.2%",
    title: "Cognitive Hook Saliency",
    text: "Finds the three seconds that make someone stop scrolling, then cuts everything that isn't that.",
    meta: "Retention lift",
    value: "+412%",
    wide: true,
  },
  {
    icon: Split,
    tag: "AI reframe active",
    title: "Dual-Speaker Framing",
    text: "Wide two-shots become stacked vertical frames, panning in step with whoever is talking.",
    meta: "Focal response",
    value: "0.12s",
    wide: false,
  },
  {
    icon: Equal,
    tag: "De-reverb active",
    title: "Spectral Audio Cadence",
    text: "Strips room noise and hum, then balances every voice to broadcast loudness.",
    meta: "Output",
    value: "-14 LUFS",
    wide: false,
  },
  {
    icon: Layers3,
    tag: "Queue running",
    title: "Batch Queue Orchestration",
    text: "Point it at a whole archive. Get a scheduled queue of shorts, reels, and clips back.",
    meta: "Render speed",
    value: "18x realtime",
    wide: true,
  },
] as const;

const stages = [
  {
    icon: CloudUpload,
    label: "Stage 01",
    title: "Ingestion & Demux",
    text: "Multi-track audio and video ingest through direct upload, RSS, or a single API call.",
    meta: "Latency",
    value: "< 1.2s",
  },
  {
    icon: Sparkles,
    label: "Stage 02",
    title: "Cognitive Saliency",
    text: "Semantic weighting finds curiosity gaps, laughs, and debate climaxes to the millisecond.",
    meta: "Accuracy",
    value: "99.4% match",
  },
  {
    icon: Split,
    label: "Stage 03",
    title: "Reframing & Stacking",
    text: "Eye-line and gesture tracking reframes a single speaker or stacks a conversation.",
    meta: "Pan smoothing",
    value: "0.12s",
  },
  {
    icon: Video,
    label: "Stage 04",
    title: "4K Master Export",
    text: "Loudness-matched audio, kinetic captions, and a 4K master published everywhere at once.",
    meta: "Render",
    value: "18x realtime",
  },
] as const;

const benchmarks = [
  {
    label: "Turnaround Time",
    value: 94,
    decimals: 0,
    suffix: "%",
    note: "Faster production cycle",
    text: "From hours of manual editing to under a minute, end to end.",
  },
  {
    label: "Hook Retention",
    value: 4.8,
    decimals: 1,
    suffix: "x",
    note: "Average 3-second completion",
    text: "Modeled on drop-off curves across a hundred million views.",
  },
  {
    label: "Audio Calibration",
    value: -14,
    decimals: 0,
    suffix: " LUFS",
    note: "EBU R128 compliant",
    text: "Automatic vocal balancing and room de-reverberation.",
  },
  {
    label: "Human Overhead",
    value: 0,
    decimals: 1,
    suffix: "s",
    note: "Touchless publishing",
    text: "No scrubbing, no manual masking, no timeline editing.",
  },
] as const;

const comparisons = [
  {
    label: "News Desk Clip Pack",
    value: "12 min vs 14 hrs",
    pct: 92,
    note: "Automated multi-speaker processing, zero frame drops.",
  },
  {
    label: "Wellness Podcast Feed",
    value: "+340% average views",
    pct: 88,
    note: "Consistent hook detection across every episode.",
  },
  {
    label: "Studio Syndication",
    value: "99.8% reliability",
    pct: 99,
    note: "Zero manual QA across a thousand-episode backlog.",
  },
] as const;

const enterpriseCards = [
  {
    icon: ShieldCheck,
    title: "SOC2 Type II & SSO",
    text: "Zero-retention by default. Your raw footage and masters never train a public model.",
    meta: "SAML & OIDC ready",
  },
  {
    icon: Code2,
    title: "Dedicated On-Prem Nodes",
    text: "Run ShortsYou inside your own VPC or bare-metal cluster.",
    meta: "< 8ms interconnect",
  },
  {
    icon: Palette,
    title: "Custom Brand Styling",
    text: "Caption motion, type, color grading, and sonic watermarks tuned to your brand.",
    meta: "Custom kerning & LUTs",
  },
] as const;

function Reveal({
  children,
  delay = 0,
  className = "",
  y = 28,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  y?: number;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.8, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

function Counter({
  value,
  decimals = 0,
  prefix = "",
  suffix = "",
}: {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, value, {
      duration: 1.4,
      ease: EASE,
      onUpdate: (latest) => setDisplay(latest),
    });
    return () => controls.stop();
  }, [inView, value]);

  return (
    <span ref={ref} className="sy-stat-num">
      {prefix}
      {display.toFixed(decimals)}
      {suffix}
    </span>
  );
}

function GrainOverlay() {
  return (
    <svg className="sy-grain" aria-hidden="true">
      <filter id="sy-grain-filter">
        <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" />
      </filter>
      <rect width="100%" height="100%" filter="url(#sy-grain-filter)" />
    </svg>
  );
}

function CustomCursor() {
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const springX = useSpring(x, { stiffness: 480, damping: 38, mass: 0.4 });
  const springY = useSpring(y, { stiffness: 480, damping: 38, mass: 0.4 });
  const [hovering, setHovering] = useState(false);

  useEffect(() => {
    function move(e: MouseEvent) {
      x.set(e.clientX);
      y.set(e.clientY);
    }
    function over(e: MouseEvent) {
      const target = e.target as HTMLElement;
      setHovering(Boolean(target.closest("a, button, [data-cursor-hover]")));
    }
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseover", over);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseover", over);
    };
  }, [x, y]);

  return (
    <motion.div
      className={hovering ? "sy-cursor sy-cursor--hover" : "sy-cursor"}
      style={{ translateX: springX, translateY: springY }}
    />
  );
}

function SectionHeading({
  index,
  kicker,
  title,
  text,
}: {
  index: string;
  kicker: string;
  title: string;
  text: string;
}) {
  return (
    <Reveal className="sy-section-heading">
      <div className="sy-section-label">
        <span className="sy-mono sy-section-index">{index}</span>
        <span className="sy-mono sy-kicker">{kicker}</span>
      </div>
      <h2>{title}</h2>
      <p>{text}</p>
    </Reveal>
  );
}

function FeatureCard({
  icon: Icon,
  tag,
  title,
  text,
  meta,
  value,
  wide,
  delay,
}: {
  icon: typeof Sparkles;
  tag: string;
  title: string;
  text: string;
  meta: string;
  value: string;
  wide: boolean;
  delay: number;
}) {
  return (
    <Reveal delay={delay} className={wide ? "sy-feature-card sy-feature-card--wide" : "sy-feature-card"}>
      <div className="sy-feature-top">
        <span className="sy-feature-icon">
          <Icon size={18} />
        </span>
        <span className="sy-mono sy-feature-tag">{tag}</span>
      </div>
      <h3>{title}</h3>
      <p>{text}</p>
      <div className="sy-feature-bottom">
        <div className="sy-feature-bars">
          {[1, 2, 3, 4, 5, 6, 7].map((bar) => (
            <i key={bar} style={{ height: `${20 + ((bar * 37) % 60)}%` }} />
          ))}
        </div>
        <div className="sy-feature-meta">
          <span>{meta}</span>
          <b>{value}</b>
        </div>
      </div>
    </Reveal>
  );
}

function ProcessRow({
  icon: Icon,
  label,
  title,
  text,
  meta,
  value,
  index,
  isLast,
}: {
  icon: typeof Sparkles;
  label: string;
  title: string;
  text: string;
  meta: string;
  value: string;
  index: number;
  isLast: boolean;
}) {
  return (
    <Reveal delay={index * 0.08} className="sy-process-row">
      <div className="sy-process-rail">
        <span className="sy-process-dot" />
        {!isLast && <span className="sy-process-line" />}
      </div>
      <div className="sy-process-body">
        <div className="sy-process-top">
          <span className="sy-mono sy-process-label">{label}</span>
          <Icon size={18} />
        </div>
        <h3>{title}</h3>
        <p>{text}</p>
        <div className="sy-process-meta sy-mono">
          <span>{meta}</span>
          <b>{value}</b>
        </div>
      </div>
    </Reveal>
  );
}

function StatCard({
  label,
  value,
  decimals,
  suffix,
  note,
  text,
  delay,
}: {
  label: string;
  value: number;
  decimals: number;
  suffix: string;
  note: string;
  text: string;
  delay: number;
}) {
  return (
    <Reveal delay={delay} className="sy-stat-card">
      <span className="sy-mono sy-muted">{label}</span>
      <strong>
        <Counter value={value} decimals={decimals} suffix={suffix} />
      </strong>
      <span className="sy-mono sy-stat-note">{note}</span>
      <p>{text}</p>
    </Reveal>
  );
}

function CompareRow({
  label,
  value,
  pct,
  note,
  delay,
}: {
  label: string;
  value: string;
  pct: number;
  note: string;
  delay: number;
}) {
  return (
    <Reveal delay={delay} className="sy-compare-row">
      <div className="sy-compare-top">
        <span>{label}</span>
        <b className="sy-mono">{value}</b>
      </div>
      <div className="sy-compare-track">
        <motion.div
          className="sy-compare-fill"
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: pct / 100 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: EASE, delay: 0.15 }}
        />
      </div>
      <p className="sy-compare-note">{note}</p>
    </Reveal>
  );
}

function EnterpriseCard({
  icon: Icon,
  title,
  text,
  meta,
  delay,
}: {
  icon: typeof ShieldCheck;
  title: string;
  text: string;
  meta: string;
  delay: number;
}) {
  return (
    <Reveal delay={delay} className="sy-enterprise-card">
      <span className="sy-feature-icon">
        <Icon size={18} />
      </span>
      <h3>{title}</h3>
      <p>{text}</p>
      <div className="sy-feature-meta">
        <span className="sy-mono">{meta}</span>
        <Check size={14} />
      </div>
    </Reveal>
  );
}

function Terminal({
  active,
  exported,
  onToggle,
  onExport,
}: {
  active: boolean;
  exported: boolean;
  onToggle: () => void;
  onExport: () => void;
}) {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotateX = useTransform(my, [-100, 100], [6, -6]);
  const rotateY = useTransform(mx, [-100, 100], [-6, 6]);

  function handleMove(e: ReactMouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    mx.set(e.clientX - rect.left - rect.width / 2);
    my.set(e.clientY - rect.top - rect.height / 2);
  }
  function handleLeave() {
    mx.set(0);
    my.set(0);
  }

  return (
    <motion.div
      id="studio-preview"
      className="sy-hero-visual"
      initial={{ opacity: 0, y: 40, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 1, ease: EASE, delay: 0.35 }}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{ perspective: 1400 }}
    >
      <span className="sy-glow-blob" />
      <motion.div className="sy-terminal" style={{ rotateX, rotateY }}>
        <div className="sy-terminal-bar">
          <span className="sy-traffic">
            <i />
            <i />
            <i />
          </span>
          <span className="sy-mono sy-terminal-file">
            <LockKeyhole size={11} /> SESSION_219_RAW_4K.MOV
          </span>
          <b className="sy-mono sy-terminal-status">{active ? "● LIVE ANALYSIS" : "● 99.4% RETENTION"}</b>
        </div>
        <div className="sy-video-frame">
          <div className="sy-video-image" />
          <span className="sy-scan-line" />
          <div className="sy-speaker-box">
            <span className="sy-mono">ACTIVE SPEAKER · 142HZ</span>
          </div>
          <div className="sy-mic-card">
            <span className="sy-mono">SPEAKER 01</span>
            <div className="sy-wave">
              {[1, 2, 3, 4, 5, 6, 7].map((bar) => (
                <i key={bar} style={{ height: `${30 + ((bar * 29) % 55)}%` }} />
              ))}
            </div>
          </div>
          <div className="sy-subtitle">“the best ideas die in unwatched timelines.”</div>
        </div>
        <div className="sy-terminal-controls">
          <div className="sy-scrub">
            <span className="sy-mono">00:14</span>
            <div className="sy-scrub-track">
              <div className="sy-scrub-fill" />
            </div>
            <span className="sy-mono">00:48</span>
          </div>
          <div className="sy-controls-row">
            <button className="sy-icon-btn" onClick={onToggle} aria-label={active ? "Pause preview" : "Play preview"}>
              {active ? <Pause size={12} /> : <Play size={12} />}
            </button>
            <span className="sy-mono sy-muted">9:16 · 4K PRORES</span>
            <button className="sy-export-btn" onClick={onExport}>
              {exported ? <Check size={12} /> : <Download size={12} />}
              {exported ? "Queued" : "Export"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function HomeDashboard() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [studioActive, setStudioActive] = useState(false);
  const [exported, setExported] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { scrollY, scrollYProgress } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 40);
  });

  useEffect(() => {
    if (localStorage.getItem("shortsyou_jwt")) router.replace("/dashboard");
  }, [router]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function launchStudio() {
    router.push(localStorage.getItem("shortsyou_jwt") ? "/dashboard" : "/login");
  }

  function toggleFilm() {
    setStudioActive((active) => !active);
    document.getElementById("studio-preview")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return (
    <div className="sy-page">
      <GrainOverlay />
      <CustomCursor />
      <motion.div className="sy-progress" style={{ scaleX: scrollYProgress }} />

      <header className={scrolled ? "sy-nav sy-nav--scrolled" : "sy-nav"}>
        <a className="sy-brand" href="#engine" data-cursor-hover>
          <span className="sy-brand-mark">
            <Video size={16} />
          </span>
          <span className="sy-brand-word">
            <span className="sy-brand-name">
              Shorts<em>You</em>
            </span>
            <span className="sy-mono sy-brand-tag">AI Video Architecture</span>
          </span>
        </a>

        <nav className="sy-nav-links">
          {navItems.map((item, index) => (
            <a key={item} href={`#${item.toLowerCase()}`} data-cursor-hover>
              <span className="sy-mono sy-nav-index">0{index + 1}</span>
              {item}
            </a>
          ))}
        </nav>

        <div className="sy-nav-actions">
          <Link className="sy-nav-signin" href="/login">
            Sign In
          </Link>
          <Link className="sy-btn sy-btn-ghost" href="/register">
            Sign Up <ArrowRight size={14} />
          </Link>
          <button className="sy-menu-btn" onClick={() => setMenuOpen(true)} aria-label="Open menu">
            <Menu size={20} />
          </button>
        </div>
      </header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="sy-mobile-menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
          >
            <button className="sy-menu-close" onClick={() => setMenuOpen(false)} aria-label="Close menu">
              <X size={22} />
            </button>
            <nav className="sy-mobile-menu-links">
              {navItems.map((item, index) => (
                <motion.a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  onClick={() => setMenuOpen(false)}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12 + index * 0.06, duration: 0.5, ease: EASE }}
                >
                  <span className="sy-mono">0{index + 1}</span>
                  {item}
                </motion.a>
              ))}
            </nav>
            <div className="sy-mobile-menu-actions">
              <Link href="/login" onClick={() => setMenuOpen(false)}>
                Sign In
              </Link>
              <Link className="sy-btn sy-btn-primary" href="/register" onClick={() => setMenuOpen(false)}>
                Sign Up <ArrowRight size={14} />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main>
        <section className="sy-hero sy-shell" id="engine">
          <span className="sy-grid-overlay" aria-hidden="true" />
          <div className="sy-hero-copy">
            <motion.span
              className="sy-mono sy-kicker sy-kicker--hero"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: EASE }}
            >
              <Sparkles size={12} /> Studio-grade AI video architecture
            </motion.span>

            <motion.h1
              className="sy-hero-title"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: EASE, delay: 0.1 }}
            >
              <span className="sy-weight-light">Turn raw footage into</span>{" "}
              <span className="sy-weight-bold">viral shorts</span>{" "}
              <span className="sy-accent-serif">— automatically.</span>
            </motion.h1>

            <motion.p
              className="sy-hero-sub"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: EASE, delay: 0.2 }}
            >
              ShortsYou ingests long-form podcasts and broadcasts, finds the moments worth watching, and exports
              broadcast-ready vertical cuts without an editor.
            </motion.p>

            <motion.div
              className="sy-hero-actions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: EASE, delay: 0.3 }}
            >
              <button className="sy-btn sy-btn-primary" onClick={launchStudio}>
                Launch Studio <Zap size={16} />
              </button>
              <button className="sy-btn sy-btn-ghost" onClick={toggleFilm}>
                <CirclePlay size={18} />
                {studioActive ? "Pause Film" : "Watch 90-sec Film"}
                <span className="sy-mono sy-btn-tag">90s</span>
              </button>
            </motion.div>

            <motion.div
              className="sy-proof"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: EASE, delay: 0.4 }}
            >
              <div className="sy-avatars">
                <span>JD</span>
                <span>SR</span>
                <span>+</span>
              </div>
              <div>
                <strong>4.9 / 5 studio satisfaction</strong>
                <span className="sy-mono sy-muted">Calibrated for broadcast syndication</span>
              </div>
            </motion.div>
          </div>

          <Terminal
            active={studioActive}
            exported={exported}
            onToggle={toggleFilm}
            onExport={() => setExported(true)}
          />

          <span className="sy-scroll-cue sy-mono">
            Scroll <i />
          </span>
        </section>

        <div className="sy-marquee">
          <div className="sy-marquee-track">
            {[...marqueeTags, ...marqueeTags].map((tag, index) => (
              <span key={`${tag}-${index}`} className="sy-mono sy-marquee-item">
                {tag}
                <i className="sy-marquee-dot" />
              </span>
            ))}
          </div>
        </div>

        <section className="sy-section sy-shell" id="features">
          <SectionHeading
            index="/ 02"
            kicker="Deterministic Neural Models"
            title="Surgical precision. Liquid workflow."
            text="Four models running concurrently to isolate retention spikes, balance composition, and calibrate vocal warmth."
          />
          <div className="sy-feature-grid">
            {features.map((feature, index) => (
              <FeatureCard key={feature.title} {...feature} delay={index * 0.08} />
            ))}
          </div>
        </section>

        <section className="sy-section sy-shell" id="workflow">
          <SectionHeading
            index="/ 03"
            kicker="Pipeline Execution"
            title="The four-stage liquid workflow."
            text="From an uncompressed master to a platform-ready vertical cut in under sixty seconds."
          />
          <div className="sy-process">
            {stages.map((stage, index) => (
              <ProcessRow key={stage.title} {...stage} index={index} isLast={index === stages.length - 1} />
            ))}
          </div>
        </section>

        <section className="sy-section sy-shell" id="benchmarks">
          <SectionHeading
            index="/ 04"
            kicker="Verified Studio Benchmarks"
            title="Zero human latency. 4.8x retention."
            text="Measured against conventional editing suites across 2,400 hours of broadcast footage."
          />
          <div className="sy-stats-grid">
            {benchmarks.map((stat, index) => (
              <StatCard key={stat.label} {...stat} delay={index * 0.06} />
            ))}
          </div>
          <div className="sy-compare">
            <Reveal className="sy-compare-head">
              <span className="sy-mono sy-muted">Production comparison</span>
              <h3>Studio teams vs. ShortsYou</h3>
            </Reveal>
            {comparisons.map((row, index) => (
              <CompareRow key={row.label} {...row} delay={index * 0.08} />
            ))}
          </div>
        </section>

        <section className="sy-section sy-shell" id="enterprise">
          <SectionHeading
            index="/ 05"
            kicker="Security & Infrastructure"
            title="Studio infrastructure for media teams."
            text="Air-gapped security, enterprise SSO, on-premise render clusters, and brand-tuned styling engines."
          />
          <div className="sy-enterprise-grid">
            {enterpriseCards.map((card, index) => (
              <EnterpriseCard key={card.title} {...card} delay={index * 0.08} />
            ))}
          </div>
          <Reveal className="sy-cta-banner">
            <div className="sy-cta-copy">
              <span className="sy-mono sy-kicker">Enterprise deployment</span>
              <h3>Request dedicated enterprise access.</h3>
              <p>Custom contracts, tailored SLA uptime, volume API concessions, and dedicated engineering support.</p>
            </div>
            <div className="sy-cta-actions">
              <button className="sy-btn sy-btn-primary">
                Request Access <ArrowRight size={16} />
              </button>
              <button className="sy-btn sy-btn-ghost">Review Security Whitepaper</button>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="sy-footer sy-shell">
        <div className="sy-footer-top">
          <span className="sy-footer-brand">
            Shorts<em>You</em>
          </span>
          <span className="sy-mono sy-footer-status">
            <i /> All systems operational
          </span>
        </div>
        <div className="sy-footer-links">
          {navItems.map((item) => (
            <a key={item} href={`#${item.toLowerCase()}`}>
              {item}
            </a>
          ))}
          <a href="#">Security</a>
          <a href="#">Privacy</a>
        </div>
        <div className="sy-footer-bottom sy-mono sy-muted">
          © {new Date().getFullYear()} ShortsYou Inc. Built for elite media operators.
        </div>
      </footer>

      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&family=Instrument+Serif:ital@0;1&display=swap");

        :root {
          --sy-ink: #08070a;
          --sy-ink-soft: #100d10;
          --sy-paper: #f3efe8;
          --sy-paper-dim: #cdc6bc;
          --sy-mute: #857e76;
          --sy-line: rgba(243, 239, 232, 0.08);
          --sy-line-strong: rgba(243, 239, 232, 0.16);
          --sy-blood: #630404;
          --sy-blood-2: #8c0e0e;
          --sy-blood-soft: rgba(99, 4, 4, 0.4);
          --sy-font-sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          --sy-font-mono: "JetBrains Mono", "SFMono-Regular", Menlo, monospace;
          --sy-font-serif: "Instrument Serif", Georgia, serif;
          --sy-ease: cubic-bezier(0.16, 1, 0.3, 1);
        }

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        html {
          scroll-behavior: smooth;
        }
        body {
          background: var(--sy-ink);
          color: var(--sy-paper);
          font-family: var(--sy-font-sans);
          -webkit-font-smoothing: antialiased;
          overflow-x: hidden;
        }
        a {
          color: inherit;
          text-decoration: none;
        }
        button {
          font-family: inherit;
          border: none;
          background: none;
          color: inherit;
          cursor: pointer;
        }
        ::selection {
          background: var(--sy-blood);
          color: var(--sy-paper);
        }
        .sy-page {
          position: relative;
        }
        main {
          position: relative;
          z-index: 1;
        }
        .sy-mono {
          font-family: var(--sy-font-mono);
          letter-spacing: 0.02em;
        }
        .sy-muted {
          color: var(--sy-mute);
        }

        .sy-grain {
          position: fixed;
          inset: 0;
          width: 100%;
          height: 100%;
          z-index: 9997;
          pointer-events: none;
          opacity: 0.045;
          mix-blend-mode: overlay;
        }
        .sy-cursor {
          position: fixed;
          top: 0;
          left: 0;
          width: 16px;
          height: 16px;
          margin-left: -8px;
          margin-top: -8px;
          border-radius: 50%;
          border: 1px solid var(--sy-paper);
          pointer-events: none;
          z-index: 9999;
          mix-blend-mode: difference;
          transition: width 0.25s var(--sy-ease), height 0.25s var(--sy-ease), margin 0.25s var(--sy-ease),
            background 0.25s;
        }
        .sy-cursor--hover {
          width: 52px;
          height: 52px;
          margin-left: -26px;
          margin-top: -26px;
          background: var(--sy-paper);
        }
        .sy-progress {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: var(--sy-blood-2);
          transform-origin: left;
          z-index: 250;
        }
        @media (pointer: coarse) {
          .sy-cursor {
            display: none;
          }
        }
        @media (pointer: fine) {
          body,
          a,
          button {
            cursor: none;
          }
        }

        .sy-shell {
          max-width: 1240px;
          margin: 0 auto;
          padding: 0 clamp(20px, 4vw, 48px);
          position: relative;
        }

        .sy-nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 150;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 26px clamp(20px, 4vw, 48px);
          transition: padding 0.5s var(--sy-ease), background 0.5s var(--sy-ease), border-color 0.5s var(--sy-ease);
          border-bottom: 1px solid transparent;
        }
        .sy-nav--scrolled {
          padding: 14px clamp(20px, 4vw, 48px);
          background: rgba(8, 7, 10, 0.75);
          backdrop-filter: blur(20px) saturate(140%);
          border-bottom-color: var(--sy-line);
        }
        .sy-brand {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .sy-brand-mark {
          width: 34px;
          height: 34px;
          border: 1px solid var(--sy-line-strong);
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--sy-blood-2);
          transition: border-color 0.3s, color 0.3s;
        }
        .sy-brand:hover .sy-brand-mark {
          border-color: var(--sy-blood-2);
          color: var(--sy-paper);
        }
        .sy-brand-word {
          display: flex;
          flex-direction: column;
          line-height: 1;
        }
        .sy-brand-name {
          font-weight: 700;
          font-size: 16px;
          letter-spacing: -0.01em;
        }
        .sy-brand-name em {
          font-style: normal;
          color: var(--sy-blood-2);
        }
        .sy-brand-tag {
          font-size: 9px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--sy-mute);
          margin-top: 5px;
        }
        .sy-nav-links {
          display: flex;
          align-items: center;
          gap: 40px;
        }
        .sy-nav-links a {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--sy-paper-dim);
          position: relative;
          padding-bottom: 4px;
          transition: color 0.3s;
        }
        .sy-nav-links a::after {
          content: "";
          position: absolute;
          left: 0;
          right: 100%;
          bottom: 0;
          height: 1px;
          background: var(--sy-blood-2);
          transition: right 0.35s var(--sy-ease);
        }
        .sy-nav-links a:hover {
          color: var(--sy-paper);
        }
        .sy-nav-links a:hover::after {
          right: 0;
        }
        .sy-nav-index {
          color: var(--sy-blood-2);
          font-size: 10px;
        }
        .sy-nav-actions {
          display: flex;
          align-items: center;
          gap: 18px;
        }
        .sy-nav-signin {
          font-size: 13px;
          color: var(--sy-paper-dim);
          transition: color 0.3s;
        }
        .sy-nav-signin:hover {
          color: var(--sy-paper);
        }
        .sy-menu-btn {
          display: none;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          border: 1px solid var(--sy-line-strong);
          border-radius: 9px;
        }

        .sy-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 13px 24px;
          border-radius: 999px;
          font-size: 13.5px;
          font-weight: 600;
          letter-spacing: -0.01em;
          transition: transform 0.4s var(--sy-ease), background 0.4s var(--sy-ease), border-color 0.4s var(--sy-ease),
            box-shadow 0.4s var(--sy-ease);
        }
        .sy-btn-primary {
          background: var(--sy-blood);
          color: var(--sy-paper);
        }
        .sy-btn-primary:hover {
          background: var(--sy-blood-2);
          box-shadow: 0 10px 34px -8px var(--sy-blood-soft);
          transform: translateY(-2px);
        }
        .sy-btn-ghost {
          border: 1px solid var(--sy-line-strong);
          background: rgba(243, 239, 232, 0.03);
          color: var(--sy-paper);
        }
        .sy-btn-ghost:hover {
          border-color: var(--sy-paper-dim);
          background: rgba(243, 239, 232, 0.07);
          transform: translateY(-2px);
        }
        .sy-btn-tag {
          margin-left: 2px;
          padding: 2px 7px;
          border-radius: 6px;
          background: rgba(243, 239, 232, 0.08);
          font-size: 10px;
          color: var(--sy-mute);
        }

        .sy-mobile-menu {
          position: fixed;
          inset: 0;
          z-index: 200;
          background: rgba(8, 7, 10, 0.97);
          backdrop-filter: blur(20px);
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 40px clamp(24px, 6vw, 64px);
        }
        .sy-menu-close {
          position: absolute;
          top: 26px;
          right: clamp(20px, 4vw, 48px);
          width: 38px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--sy-line-strong);
          border-radius: 9px;
        }
        .sy-mobile-menu-links {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .sy-mobile-menu-links a {
          display: flex;
          align-items: baseline;
          gap: 16px;
          font-size: clamp(30px, 9vw, 54px);
          font-weight: 700;
          letter-spacing: -0.02em;
          padding: 12px 0;
          border-bottom: 1px solid var(--sy-line);
        }
        .sy-mobile-menu-links a span {
          font-size: 14px;
          color: var(--sy-blood-2);
        }
        .sy-mobile-menu-actions {
          display: flex;
          gap: 16px;
          margin-top: 40px;
        }

        .sy-hero {
          position: relative;
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1.08fr 0.92fr;
          align-items: center;
          gap: 56px;
          padding-top: 168px;
          padding-bottom: 100px;
          overflow: hidden;
        }
        .sy-grid-overlay {
          position: absolute;
          inset: 0;
          background-image: repeating-linear-gradient(
            90deg,
            var(--sy-line) 0,
            var(--sy-line) 1px,
            transparent 1px,
            transparent 12.5%
          );
          opacity: 0.7;
          pointer-events: none;
          z-index: 0;
        }
        .sy-hero-copy {
          position: relative;
          z-index: 1;
        }
        .sy-kicker {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--sy-paper-dim);
        }
        .sy-kicker--hero {
          padding: 8px 16px;
          border: 1px solid var(--sy-line-strong);
          border-radius: 999px;
          margin-bottom: 26px;
        }
        .sy-kicker--hero svg {
          color: var(--sy-blood-2);
        }
        .sy-hero-title {
          font-size: clamp(2.6rem, 6vw, 6.2rem);
          line-height: 0.98;
          letter-spacing: -0.03em;
          margin-bottom: 26px;
        }
        .sy-weight-light {
          font-weight: 400;
          color: var(--sy-mute);
        }
        .sy-weight-bold {
          font-weight: 800;
          color: var(--sy-paper);
        }
        .sy-accent-serif {
          font-family: var(--sy-font-serif);
          font-style: italic;
          font-weight: 400;
          color: var(--sy-blood-2);
          text-shadow: 0 0 50px rgba(99, 4, 4, 0.55);
        }
        .sy-hero-sub {
          max-width: 520px;
          font-size: 17px;
          line-height: 1.6;
          color: var(--sy-mute);
          margin-bottom: 38px;
        }
        .sy-hero-actions {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 52px;
          flex-wrap: wrap;
        }
        .sy-proof {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .sy-avatars {
          display: flex;
        }
        .sy-avatars span {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: var(--sy-ink-soft);
          border: 2px solid var(--sy-ink);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 600;
          color: var(--sy-paper-dim);
          margin-left: -10px;
        }
        .sy-avatars span:first-child {
          margin-left: 0;
        }
        .sy-proof strong {
          display: block;
          font-size: 13px;
          font-weight: 600;
        }
        .sy-proof .sy-mono {
          font-size: 11px;
        }
        .sy-scroll-cue {
          position: absolute;
          left: clamp(20px, 4vw, 48px);
          bottom: 34px;
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 10px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--sy-mute);
          z-index: 1;
        }
        .sy-scroll-cue i {
          width: 1px;
          height: 26px;
          background: linear-gradient(var(--sy-blood-2), transparent);
          animation: sy-scroll-cue 1.8s ease-in-out infinite;
        }
        @keyframes sy-scroll-cue {
          0%,
          100% {
            transform: scaleY(1);
            opacity: 1;
          }
          50% {
            transform: scaleY(0.4);
            opacity: 0.4;
          }
        }

        .sy-hero-visual {
          position: relative;
          z-index: 1;
        }
        .sy-glow-blob {
          position: absolute;
          width: 480px;
          height: 480px;
          border-radius: 50%;
          background: radial-gradient(circle, var(--sy-blood) 0%, transparent 68%);
          filter: blur(100px);
          opacity: 0.32;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          animation: sy-pulse 9s ease-in-out infinite;
          z-index: 0;
        }
        @keyframes sy-pulse {
          0%,
          100% {
            opacity: 0.26;
            transform: translate(-50%, -50%) scale(1);
          }
          50% {
            opacity: 0.42;
            transform: translate(-50%, -50%) scale(1.07);
          }
        }
        .sy-terminal {
          position: relative;
          z-index: 1;
          border-radius: 22px;
          border: 1px solid var(--sy-line-strong);
          background: linear-gradient(160deg, rgba(243, 239, 232, 0.05), rgba(243, 239, 232, 0.015));
          backdrop-filter: blur(30px);
          overflow: hidden;
          box-shadow: 0 40px 80px -30px rgba(0, 0, 0, 0.7);
        }
        .sy-terminal-bar {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px 18px;
          border-bottom: 1px solid var(--sy-line);
        }
        .sy-traffic {
          display: flex;
          gap: 6px;
        }
        .sy-traffic i {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: var(--sy-line-strong);
        }
        .sy-terminal-file {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          color: var(--sy-mute);
        }
        .sy-terminal-status {
          font-size: 10px;
          color: var(--sy-blood-2);
        }
        .sy-video-frame {
          position: relative;
          aspect-ratio: 16 / 10;
          margin: 16px;
          border-radius: 14px;
          overflow: hidden;
          background: linear-gradient(150deg, #17110f, #050405);
        }
        .sy-video-image {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 30% 30%, rgba(140, 14, 14, 0.18), transparent 55%),
            radial-gradient(circle at 75% 70%, rgba(243, 239, 232, 0.05), transparent 50%);
        }
        .sy-scan-line {
          position: absolute;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(243, 239, 232, 0.5), transparent);
          animation: sy-scan 4s linear infinite;
        }
        @keyframes sy-scan {
          0% {
            top: 0%;
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            top: 100%;
            opacity: 0;
          }
        }
        .sy-speaker-box {
          position: absolute;
          top: 16px;
          left: 16px;
          padding: 6px 10px;
          border: 1px solid var(--sy-line-strong);
          border-radius: 999px;
          background: rgba(8, 7, 10, 0.6);
          font-size: 9px;
          letter-spacing: 0.06em;
          color: var(--sy-paper-dim);
        }
        .sy-mic-card {
          position: absolute;
          bottom: 16px;
          left: 16px;
          padding: 10px 12px;
          border-radius: 12px;
          background: rgba(8, 7, 10, 0.72);
          border: 1px solid var(--sy-line-strong);
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .sy-wave {
          display: flex;
          align-items: flex-end;
          gap: 3px;
          height: 18px;
        }
        .sy-wave i {
          width: 2.5px;
          background: var(--sy-blood-2);
          border-radius: 2px;
        }
        .sy-subtitle {
          position: absolute;
          bottom: 16px;
          right: 16px;
          max-width: 60%;
          padding: 8px 12px;
          border-radius: 10px;
          background: rgba(8, 7, 10, 0.72);
          border: 1px solid var(--sy-line-strong);
          font-size: 11px;
          font-style: italic;
          color: var(--sy-paper-dim);
          text-align: right;
        }
        .sy-terminal-controls {
          padding: 16px 18px 20px;
        }
        .sy-scrub {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 10px;
          color: var(--sy-mute);
          margin-bottom: 14px;
        }
        .sy-scrub-track {
          flex: 1;
          height: 3px;
          border-radius: 999px;
          background: var(--sy-line-strong);
          position: relative;
          overflow: hidden;
        }
        .sy-scrub-fill {
          position: absolute;
          inset: 0;
          width: 32%;
          background: var(--sy-blood-2);
          border-radius: 999px;
        }
        .sy-controls-row {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .sy-icon-btn {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          border: 1px solid var(--sy-line-strong);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: border-color 0.3s, background 0.3s;
        }
        .sy-icon-btn:hover {
          border-color: var(--sy-blood-2);
          background: rgba(140, 14, 14, 0.12);
        }
        .sy-export-btn {
          margin-left: auto;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 9px 16px;
          border-radius: 999px;
          background: var(--sy-blood);
          color: var(--sy-paper);
          font-size: 12px;
          font-weight: 600;
          transition: background 0.3s, transform 0.3s;
        }
        .sy-export-btn:hover {
          background: var(--sy-blood-2);
          transform: translateY(-1px);
        }

        .sy-marquee {
          position: relative;
          overflow: hidden;
          padding: 26px 0;
          border-top: 1px solid var(--sy-line);
          border-bottom: 1px solid var(--sy-line);
          mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent);
        }
        .sy-marquee-track {
          display: flex;
          width: max-content;
          animation: sy-marquee 34s linear infinite;
        }
        @keyframes sy-marquee {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }
        .sy-marquee-item {
          display: flex;
          align-items: center;
          gap: 28px;
          padding: 0 28px;
          font-size: 12px;
          letter-spacing: 0.1em;
          color: var(--sy-mute);
          white-space: nowrap;
          transition: color 0.3s;
        }
        .sy-marquee-item:hover {
          color: var(--sy-paper);
        }
        .sy-marquee-dot {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: var(--sy-blood-2);
          margin-left: 28px;
        }

        .sy-section {
          padding: 140px 0;
          position: relative;
        }
        .sy-section-heading {
          max-width: 720px;
          margin-bottom: 64px;
        }
        .sy-section-label {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 20px;
        }
        .sy-section-index {
          color: var(--sy-mute);
          font-size: 11px;
        }
        .sy-section-heading h2 {
          font-size: clamp(2rem, 4.2vw, 3.4rem);
          font-weight: 700;
          letter-spacing: -0.02em;
          line-height: 1.08;
          margin-bottom: 18px;
        }
        .sy-section-heading p {
          font-size: 16px;
          line-height: 1.65;
          color: var(--sy-mute);
          max-width: 560px;
        }

        .sy-feature-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }
        .sy-feature-card {
          position: relative;
          padding: 32px;
          border: 1px solid var(--sy-line);
          border-radius: 20px;
          background: linear-gradient(160deg, rgba(243, 239, 232, 0.035), rgba(243, 239, 232, 0.008));
          transition: border-color 0.4s var(--sy-ease), transform 0.4s var(--sy-ease), background 0.4s var(--sy-ease);
        }
        .sy-feature-card:hover {
          border-color: var(--sy-blood-2);
          transform: translateY(-4px);
          background: linear-gradient(160deg, rgba(140, 14, 14, 0.08), rgba(243, 239, 232, 0.01));
        }
        .sy-feature-card--wide {
          grid-column: span 2;
        }
        .sy-feature-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 22px;
        }
        .sy-feature-icon {
          width: 38px;
          height: 38px;
          border-radius: 11px;
          border: 1px solid var(--sy-line-strong);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--sy-blood-2);
        }
        .sy-feature-tag {
          font-size: 10px;
          color: var(--sy-mute);
        }
        .sy-feature-card h3 {
          font-size: 19px;
          font-weight: 600;
          margin-bottom: 10px;
          letter-spacing: -0.01em;
        }
        .sy-feature-card p {
          font-size: 14.5px;
          line-height: 1.6;
          color: var(--sy-mute);
          max-width: 440px;
        }
        .sy-feature-bottom {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          margin-top: 28px;
          padding-top: 20px;
          border-top: 1px solid var(--sy-line);
        }
        .sy-feature-bars {
          display: flex;
          align-items: flex-end;
          gap: 4px;
          height: 26px;
        }
        .sy-feature-bars i {
          width: 4px;
          background: var(--sy-line-strong);
          border-radius: 2px;
          transition: background 0.4s;
        }
        .sy-feature-card:hover .sy-feature-bars i {
          background: var(--sy-blood-2);
        }
        .sy-feature-meta {
          text-align: right;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .sy-feature-meta span {
          font-size: 10px;
          color: var(--sy-mute);
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .sy-feature-meta b {
          font-size: 15px;
          font-weight: 700;
        }

        .sy-process {
          border-top: 1px solid var(--sy-line);
        }
        .sy-process-row {
          display: grid;
          grid-template-columns: 32px 1fr;
          column-gap: 28px;
          padding: 38px 0;
          border-bottom: 1px solid var(--sy-line);
        }
        .sy-process-rail {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .sy-process-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: var(--sy-blood-2);
          box-shadow: 0 0 0 5px rgba(140, 14, 14, 0.14);
          flex-shrink: 0;
        }
        .sy-process-line {
          flex: 1;
          width: 1px;
          background: var(--sy-line-strong);
          margin-top: 10px;
        }
        .sy-process-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 14px;
          color: var(--sy-blood-2);
        }
        .sy-process-label {
          color: var(--sy-mute);
        }
        .sy-process-body h3 {
          font-size: 22px;
          font-weight: 600;
          letter-spacing: -0.01em;
          margin-bottom: 10px;
          color: var(--sy-paper);
        }
        .sy-process-body p {
          font-size: 14.5px;
          line-height: 1.65;
          color: var(--sy-mute);
          max-width: 560px;
          margin-bottom: 16px;
        }
        .sy-process-meta {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 11px;
          color: var(--sy-mute);
        }
        .sy-process-meta b {
          color: var(--sy-paper);
          font-weight: 600;
        }

        .sy-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          margin-bottom: 28px;
        }
        .sy-stat-card {
          padding: 30px 26px;
          border: 1px solid var(--sy-line);
          border-radius: 20px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          transition: border-color 0.4s, transform 0.4s;
        }
        .sy-stat-card:hover {
          border-color: var(--sy-blood-2);
          transform: translateY(-3px);
        }
        .sy-stat-card strong {
          font-size: clamp(2rem, 3.4vw, 2.6rem);
          font-weight: 700;
          letter-spacing: -0.02em;
          color: var(--sy-paper);
        }
        .sy-stat-note {
          color: var(--sy-blood-2);
        }
        .sy-stat-card p {
          font-size: 13px;
          line-height: 1.55;
          color: var(--sy-mute);
        }
        .sy-compare {
          border: 1px solid var(--sy-line);
          border-radius: 22px;
          padding: 36px;
        }
        .sy-compare-head {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          margin-bottom: 28px;
          flex-wrap: wrap;
          gap: 8px;
        }
        .sy-compare-head h3 {
          font-size: 20px;
          font-weight: 600;
        }
        .sy-compare-row {
          padding: 18px 0;
          border-top: 1px solid var(--sy-line);
        }
        .sy-compare-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 10px;
          font-size: 14px;
        }
        .sy-compare-track {
          position: relative;
          height: 6px;
          border-radius: 999px;
          background: var(--sy-line-strong);
          overflow: hidden;
          margin-bottom: 8px;
        }
        .sy-compare-fill {
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, var(--sy-blood), var(--sy-blood-2));
          border-radius: 999px;
          transform-origin: left;
        }
        .sy-compare-note {
          font-size: 12.5px;
          color: var(--sy-mute);
        }

        .sy-enterprise-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-bottom: 20px;
        }
        .sy-enterprise-card {
          padding: 30px;
          border: 1px solid var(--sy-line);
          border-radius: 20px;
          transition: border-color 0.4s, transform 0.4s;
        }
        .sy-enterprise-card:hover {
          border-color: var(--sy-blood-2);
          transform: translateY(-3px);
        }
        .sy-enterprise-card h3 {
          font-size: 17px;
          font-weight: 600;
          margin: 18px 0 10px;
        }
        .sy-enterprise-card p {
          font-size: 13.5px;
          line-height: 1.6;
          color: var(--sy-mute);
          margin-bottom: 20px;
        }
        .sy-enterprise-card .sy-feature-meta {
          flex-direction: row;
          align-items: center;
          justify-content: space-between;
          text-align: left;
        }
        .sy-enterprise-card .sy-feature-meta svg {
          color: var(--sy-blood-2);
        }
        .sy-cta-banner {
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 40px;
          padding: 56px;
          border-radius: 26px;
          border: 1px solid var(--sy-line-strong);
          background: radial-gradient(circle at 15% 20%, rgba(99, 4, 4, 0.35), transparent 55%), var(--sy-ink-soft);
          flex-wrap: wrap;
        }
        .sy-cta-copy h3 {
          font-size: clamp(1.6rem, 3vw, 2.2rem);
          font-weight: 700;
          letter-spacing: -0.02em;
          margin: 14px 0 12px;
        }
        .sy-cta-copy p {
          max-width: 440px;
          font-size: 14.5px;
          line-height: 1.6;
          color: var(--sy-mute);
        }
        .sy-cta-actions {
          display: flex;
          gap: 14px;
          flex-wrap: wrap;
        }

        .sy-footer {
          padding: 60px 0 44px;
          border-top: 1px solid var(--sy-line);
        }
        .sy-footer-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 34px;
          flex-wrap: wrap;
          gap: 14px;
        }
        .sy-footer-brand {
          font-size: 18px;
          font-weight: 700;
        }
        .sy-footer-brand em {
          font-style: normal;
          color: var(--sy-blood-2);
        }
        .sy-footer-status {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          color: var(--sy-mute);
        }
        .sy-footer-status i {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--sy-blood-2);
          box-shadow: 0 0 0 4px rgba(140, 14, 14, 0.16);
        }
        .sy-footer-links {
          display: flex;
          flex-wrap: wrap;
          gap: 28px;
          padding-bottom: 34px;
          border-bottom: 1px solid var(--sy-line);
          margin-bottom: 24px;
        }
        .sy-footer-links a {
          font-size: 12px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--sy-paper-dim);
          transition: color 0.3s;
        }
        .sy-footer-links a:hover {
          color: var(--sy-blood-2);
        }
        .sy-footer-bottom {
          font-size: 11.5px;
        }

        @media (max-width: 1080px) {
          .sy-nav-links {
            display: none;
          }
          .sy-menu-btn {
            display: flex;
          }
          .sy-hero {
            grid-template-columns: 1fr;
            padding-top: 150px;
          }
          .sy-stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .sy-enterprise-grid {
            grid-template-columns: 1fr;
          }
          .sy-cta-banner {
            flex-direction: column;
            align-items: flex-start;
            padding: 40px;
          }
        }
        @media (max-width: 760px) {
          .sy-nav-signin {
            display: none;
          }
          .sy-brand-tag {
            display: none;
          }
          .sy-feature-grid {
            grid-template-columns: 1fr;
          }
          .sy-feature-card--wide {
            grid-column: span 1;
          }
          .sy-stats-grid {
            grid-template-columns: 1fr;
          }
          .sy-process-row {
            grid-template-columns: 24px 1fr;
            column-gap: 18px;
          }
          .sy-compare {
            padding: 26px;
          }
          .sy-footer-top {
            flex-direction: column;
            align-items: flex-start;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
            scroll-behavior: auto !important;
          }
        }
      `}</style>
    </div>
  );
}