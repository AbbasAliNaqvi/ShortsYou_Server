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
import FallingColorBackground from "@/components/LiquidGlass/FallingColorBackground";

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
      <FallingColorBackground />
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

      <footer style={{ background: 'rgba(255, 255, 255, 0.88)', padding: '64px 0 40px', borderTop: '1.5px solid rgba(15, 23, 42, 0.08)', backdropFilter: 'blur(20px)' }}>
        <div className="c" style={{ maxWidth: 1240, margin: '0 auto', padding: '0 clamp(20px, 4vw, 48px)' }}>

          {/* Columns row */}
          <div className="footer-top" style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 40, paddingBottom: 56,
            borderBottom: '1px solid rgba(15, 23, 42, 0.08)', marginBottom: 56,
          }}>
            {[
              { h: 'PLATFORM',    links: ['Dashboard', 'Discover', 'Clips', 'Analytics', 'Editor'] },
              { h: 'DEVELOPERS',  links: ['API Docs', 'Webhooks', 'Job Queue', 'System Status', 'Changelog'] },
              { h: 'COMPANY',     links: ['About', 'Blog', 'Careers', 'Press', 'Legal'] },
            ].map(col => (
              <div key={col.h}>
                <div style={{
                  fontSize: 11, fontWeight: 750, letterSpacing: '0.14em',
                  color: '#64748b', marginBottom: 20, textTransform: 'uppercase',
                }}>
                  {col.h}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {col.links.map(l => (
                    <a key={l} href="#" className="footer-link" style={{ fontSize: 13, color: '#334155', fontWeight: 600, textDecoration: 'none' }}>{l}</a>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Big wordmark + cities + contact — LAM layout */}
          <div className="footer-bottom" style={{
            display: 'grid', gridTemplateColumns: '1fr auto',
            gap: 40, alignItems: 'flex-end',
          }}>
            <div>
              {/* HUGE wordmark */}
              <div style={{
                fontSize: 'clamp(52px, 9vw, 128px)',
                fontWeight: 900, letterSpacing: '-0.05em',
                lineHeight: 1, color: '#090d16', marginBottom: 14,
              }}>
                ShortsYou™
              </div>
              {/* Cities — exactly like LAM */}
              <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
                {['MUM', 'BLR', 'DEL', 'NYC', 'SF'].map(city => (
                  <span key={city} style={{
                    fontSize: 12, color: '#64748b',
                    letterSpacing: '0.08em', fontWeight: 650,
                  }}>{city}</span>
                ))}
              </div>
            </div>

            {/* Contact — right side */}
            <div style={{ textAlign: 'right' }}>
              <div style={{
                fontSize: 11, color: '#64748b', letterSpacing: '0.14em',
                marginBottom: 10, textTransform: 'uppercase', fontWeight: 700,
              }}>Contact</div>
              <a href="mailto:hello@shortsyou.ai" style={{
                display: 'block', fontSize: 14, fontWeight: 750,
                color: '#090d16', marginBottom: 14, letterSpacing: '0.02em',
                transition: 'color 0.15s', textDecoration: 'none',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = '#80182a')}
              onMouseLeave={e => (e.currentTarget.style.color = '#090d16')}
              >
                HELLO@SHORTSYOU.AI
              </a>
              <div style={{ display: 'flex', gap: 20, justifyContent: 'flex-end' }}>
                {['INSTAGRAM', 'LINKEDIN', 'TWITTER'].map(s => (
                  <a key={s} href="#" style={{ fontSize: 12, color: '#475569', fontWeight: 650, textDecoration: 'none' }}>{s}</a>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom strip */}
          <div style={{
            marginTop: 40, paddingTop: 24, borderTop: '1px solid rgba(15, 23, 42, 0.08)',
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', flexWrap: 'wrap', gap: 12,
          }}>
            <span style={{ fontSize: 12.5, color: '#64748b', fontWeight: 550 }}>
              © 2026 ShortsYou Inc. All rights reserved.
            </span>
            <div style={{ display: 'flex', gap: 20 }}>
              {['Privacy', 'Terms', 'Security', 'Sitemap'].map(l => (
                <a key={l} href="#" style={{
                  fontSize: 12.5, color: '#475569', fontWeight: 600, textDecoration: 'none', transition: 'color 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = '#090d16')}
                onMouseLeave={e => (e.currentTarget.style.color = '#475569')}
                >{l}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&family=Instrument+Serif:ital@0;1&display=swap");

        :root {
          --sy-bg: #f7f9fd;
          --sy-ink: #090d16;
          --sy-ink-soft: #1e293b;
          --sy-paper: #090d16;
          --sy-paper-dim: #334155;
          --sy-mute: #475569;
          --sy-line: rgba(15, 23, 42, 0.08);
          --sy-line-strong: rgba(15, 23, 42, 0.14);
          --sy-glass: rgba(255, 255, 255, 0.84);
          --sy-glass-border: rgba(15, 23, 42, 0.12);
          --sy-blood: #80182a;
          --sy-blood-2: #a81c34;
          --sy-blood-soft: rgba(128, 24, 42, 0.18);
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
          background: var(--sy-bg);
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
          color: #ffffff;
        }
        .sy-page {
          position: relative;
          background: var(--sy-bg);
          color: var(--sy-paper);
          overflow-x: hidden;
        }
        main {
          position: relative;
          z-index: 10;
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
          opacity: 0.025;
          mix-blend-mode: multiply;
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
          border: 1.5px solid #090d16;
          pointer-events: none;
          z-index: 9999;
          transition: width 0.25s var(--sy-ease), height 0.25s var(--sy-ease), margin 0.25s var(--sy-ease),
            background 0.25s;
        }
        .sy-cursor--hover {
          width: 52px;
          height: 52px;
          margin-left: -26px;
          margin-top: -26px;
          background: rgba(9, 13, 22, 0.1);
        }
        .sy-progress {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 2.5px;
          background: var(--sy-blood-2);
          transform-origin: left;
          z-index: 250;
        }
        @media (pointer: coarse) {
          .sy-cursor {
            display: none;
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
          padding: 24px clamp(20px, 4vw, 48px);
          transition: padding 0.5s var(--sy-ease), background 0.5s var(--sy-ease), border-color 0.5s var(--sy-ease);
          border-bottom: 1.5px solid transparent;
        }
        .sy-nav--scrolled {
          padding: 14px clamp(20px, 4vw, 48px);
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(24px) saturate(140%);
          -webkit-backdrop-filter: blur(24px) saturate(140%);
          border-bottom-color: var(--sy-line);
          box-shadow: 0 4px 20px rgba(15, 23, 42, 0.04);
        }
        .sy-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          color: var(--sy-ink);
        }
        .sy-brand-mark {
          width: 36px;
          height: 36px;
          border: 1px solid rgba(15, 23, 42, 0.16);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #090d16;
          color: #ffffff;
          box-shadow: 0 2px 8px rgba(9, 13, 22, 0.15);
          transition: transform 0.3s;
        }
        .sy-brand:hover .sy-brand-mark {
          transform: scale(1.05);
        }
        .sy-brand-word {
          display: flex;
          flex-direction: column;
          line-height: 1;
        }
        .sy-brand-name {
          font-weight: 850;
          font-size: 17px;
          letter-spacing: -0.02em;
          color: var(--sy-ink);
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
          font-weight: 700;
          margin-top: 4px;
        }
        .sy-nav-links {
          display: flex;
          align-items: center;
          gap: 36px;
        }
        .sy-nav-links a {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.04em;
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
          height: 1.5px;
          background: var(--sy-blood-2);
          transition: right 0.35s var(--sy-ease);
        }
        .sy-nav-links a:hover {
          color: var(--sy-ink);
        }
        .sy-nav-links a:hover::after {
          right: 0;
        }
        .sy-nav-index {
          color: var(--sy-blood-2);
          font-size: 10px;
          font-weight: 700;
        }
        .sy-nav-actions {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .sy-nav-signin {
          font-size: 13.5px;
          color: var(--sy-paper-dim);
          font-weight: 650;
          padding: 8px 14px;
          border-radius: 9px;
          transition: color 0.2s, background 0.2s;
        }
        .sy-nav-signin:hover {
          color: var(--sy-ink);
          background: rgba(15, 23, 42, 0.05);
        }
        .sy-menu-btn {
          display: none;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          border: 1.5px solid var(--sy-line-strong);
          border-radius: 9px;
          color: var(--sy-ink);
        }

        .sy-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 22px;
          border-radius: 999px;
          font-size: 13.5px;
          font-weight: 700;
          letter-spacing: -0.01em;
          cursor: pointer;
          transition: transform 0.3s var(--sy-ease), background 0.3s var(--sy-ease), border-color 0.3s var(--sy-ease),
            box-shadow 0.3s var(--sy-ease);
        }
        .sy-btn-primary {
          background: #090d16;
          color: #ffffff;
          box-shadow: 0 4px 14px rgba(9, 13, 22, 0.16);
        }
        .sy-btn-primary:hover {
          background: #1e293b;
          box-shadow: 0 8px 24px rgba(9, 13, 22, 0.24);
          transform: translateY(-2px);
        }
        .sy-btn-ghost {
          border: 1.5px solid rgba(15, 23, 42, 0.14);
          background: #ffffff;
          color: #090d16;
          box-shadow: 0 2px 6px rgba(15, 23, 42, 0.04);
        }
        .sy-btn-ghost:hover {
          border-color: rgba(15, 23, 42, 0.3);
          transform: translateY(-2px);
        }
        .sy-btn-tag {
          margin-left: 2px;
          padding: 2px 7px;
          border-radius: 6px;
          background: rgba(15, 23, 42, 0.06);
          font-size: 10px;
          color: var(--sy-mute);
          font-weight: 700;
        }

        .sy-mobile-menu {
          position: fixed;
          inset: 0;
          z-index: 200;
          background: rgba(255, 255, 255, 0.98);
          backdrop-filter: blur(24px);
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
          border: 1.5px solid var(--sy-line-strong);
          border-radius: 9px;
          color: var(--sy-ink);
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
          font-weight: 800;
          letter-spacing: -0.02em;
          padding: 12px 0;
          border-bottom: 1px solid var(--sy-line);
          color: var(--sy-ink);
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
          opacity: 0.6;
          pointer-events: none;
          z-index: 0;
        }
        .sy-hero-copy {
          position: relative;
          z-index: 2;
        }
        .sy-kicker {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--sy-blood);
          font-weight: 700;
        }
        .sy-kicker--hero {
          padding: 7px 16px;
          border: 1px solid rgba(128, 24, 42, 0.2);
          background: rgba(128, 24, 42, 0.08);
          border-radius: 999px;
          margin-bottom: 24px;
        }
        .sy-kicker--hero svg {
          color: var(--sy-blood-2);
        }
        .sy-hero-title {
          font-size: clamp(2.6rem, 5.5vw, 5.8rem);
          line-height: 1.02;
          letter-spacing: -0.03em;
          margin-bottom: 26px;
          color: var(--sy-ink);
        }
        .sy-weight-light {
          font-weight: 400;
          color: #64748b;
        }
        .sy-weight-bold {
          font-weight: 850;
          color: var(--sy-ink);
        }
        .sy-accent-serif {
          font-family: var(--sy-font-serif);
          font-style: italic;
          font-weight: 400;
          color: var(--sy-blood);
        }
        .sy-hero-sub {
          max-width: 520px;
          font-size: 16.5px;
          line-height: 1.65;
          color: var(--sy-paper-dim);
          margin-bottom: 38px;
        }
        .sy-hero-actions {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 48px;
          flex-wrap: wrap;
        }
        .sy-proof {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 10px 18px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(20px);
          border: 1.5px solid rgba(15, 23, 42, 0.12);
          width: fit-content;
          box-shadow: 0 4px 14px rgba(15, 23, 42, 0.03);
        }
        .sy-avatars {
          display: flex;
        }
        .sy-avatars span {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #090d16;
          border: 2px solid #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 700;
          color: #ffffff;
          margin-left: -8px;
        }
        .sy-avatars span:first-child {
          margin-left: 0;
          background: #80182a;
        }
        .sy-proof strong {
          display: block;
          font-size: 13px;
          font-weight: 750;
          color: #090d16;
        }
        .sy-proof .sy-mono {
          font-size: 11px;
          color: #64748b;
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
          z-index: 2;
        }
        .sy-glow-blob {
          position: absolute;
          width: 480px;
          height: 480px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(244, 63, 94, 0.2) 0%, transparent 68%);
          filter: blur(100px);
          opacity: 0.4;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          animation: sy-pulse 9s ease-in-out infinite;
          z-index: 0;
        }
        @keyframes sy-pulse {
          0%,
          100% {
            opacity: 0.3;
            transform: translate(-50%, -50%) scale(1);
          }
          50% {
            opacity: 0.55;
            transform: translate(-50%, -50%) scale(1.07);
          }
        }
        .sy-terminal {
          position: relative;
          z-index: 1;
          border-radius: 24px;
          border: 1.5px solid rgba(15, 23, 42, 0.14);
          border-top: 1.6px solid rgba(255, 255, 255, 0.98);
          background: rgba(255, 255, 255, 0.88);
          backdrop-filter: blur(40px) saturate(140%);
          -webkit-backdrop-filter: blur(40px) saturate(140%);
          overflow: hidden;
          box-shadow: 0 30px 70px -20px rgba(15, 23, 42, 0.12), 0 0 32px -6px rgba(128, 24, 42, 0.08);
        }
        .sy-terminal-bar {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 18px;
          background: #f8fafc;
          border-bottom: 1px solid rgba(15, 23, 42, 0.08);
        }
        .sy-traffic {
          display: flex;
          gap: 6px;
        }
        .sy-traffic i {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: #cbd5e1;
        }
        .sy-terminal-file {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          color: #334155;
          font-weight: 650;
        }
        .sy-terminal-status {
          font-size: 10px;
          color: #047857;
          font-weight: 750;
        }
        .sy-video-frame {
          position: relative;
          aspect-ratio: 16 / 10;
          margin: 16px;
          border-radius: 16px;
          overflow: hidden;
          background: linear-gradient(150deg, #1e293b, #0f172a);
        }
        .sy-video-image {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 30% 30%, rgba(140, 14, 14, 0.28), transparent 55%),
            radial-gradient(circle at 75% 70%, rgba(255, 255, 255, 0.08), transparent 50%);
        }
        .sy-scan-line {
          position: absolute;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.8), transparent);
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
          padding: 6px 12px;
          border: 1px solid rgba(255, 255, 255, 0.25);
          border-radius: 999px;
          background: rgba(15, 23, 42, 0.7);
          backdrop-filter: blur(8px);
          font-size: 9px;
          letter-spacing: 0.06em;
          color: #ffffff;
          font-weight: 650;
        }
        .sy-mic-card {
          position: absolute;
          bottom: 16px;
          left: 16px;
          padding: 10px 14px;
          border-radius: 12px;
          background: rgba(15, 23, 42, 0.82);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.16);
          display: flex;
          flex-direction: column;
          gap: 8px;
          color: #ffffff;
        }
        .sy-wave {
          display: flex;
          align-items: flex-end;
          gap: 3px;
          height: 18px;
        }
        .sy-wave i {
          width: 2.5px;
          background: #f43f5e;
          border-radius: 2px;
        }
        .sy-subtitle {
          position: absolute;
          bottom: 16px;
          right: 16px;
          max-width: 62%;
          padding: 10px 14px;
          border-radius: 12px;
          background: rgba(15, 23, 42, 0.82);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.16);
          font-size: 12px;
          font-style: italic;
          color: #f8fafc;
          text-align: right;
        }
        .sy-terminal-controls {
          padding: 16px 18px 20px;
          background: #ffffff;
          border-top: 1px solid rgba(15, 23, 42, 0.08);
        }
        .sy-scrub {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 11px;
          font-weight: 650;
          color: var(--sy-mute);
          margin-bottom: 14px;
        }
        .sy-scrub-track {
          flex: 1;
          height: 4px;
          border-radius: 999px;
          background: #e2e8f0;
          position: relative;
          overflow: hidden;
        }
        .sy-scrub-fill {
          position: absolute;
          inset: 0;
          width: 32%;
          background: #090d16;
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
          border: 1px solid #cbd5e1;
          background: #f1f5f9;
          color: #090d16;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: border-color 0.2s, background 0.2s;
        }
        .sy-icon-btn:hover {
          border-color: #090d16;
          background: #e2e8f0;
        }
        .sy-export-btn {
          margin-left: auto;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 9px 18px;
          border-radius: 999px;
          background: #090d16;
          color: #ffffff;
          font-size: 12.5px;
          font-weight: 750;
          cursor: pointer;
          transition: background 0.2s, transform 0.2s;
        }
        .sy-export-btn:hover {
          background: #1e293b;
          transform: translateY(-1px);
        }

        .sy-marquee {
          position: relative;
          overflow: hidden;
          padding: 24px 0;
          background: rgba(255, 255, 255, 0.75);
          backdrop-filter: blur(20px);
          border-top: 1px solid rgba(15, 23, 42, 0.08);
          border-bottom: 1px solid rgba(15, 23, 42, 0.08);
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
          font-size: 12.5px;
          letter-spacing: 0.1em;
          color: #334155;
          font-weight: 750;
          white-space: nowrap;
          transition: color 0.3s;
        }
        .sy-marquee-item:hover {
          color: #090d16;
        }
        .sy-marquee-dot {
          width: 5px;
          height: 5px;
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
          color: var(--sy-blood-2);
          font-size: 12px;
          font-weight: 750;
        }
        .sy-section-heading h2 {
          font-size: clamp(2.2rem, 4.2vw, 3.6rem);
          font-weight: 850;
          letter-spacing: -0.02em;
          line-height: 1.08;
          margin-bottom: 18px;
          color: var(--sy-ink);
        }
        .sy-section-heading p {
          font-size: 16px;
          line-height: 1.65;
          color: var(--sy-paper-dim);
          max-width: 580px;
        }

        .sy-feature-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 24px;
        }
        .sy-feature-card {
          position: relative;
          padding: 34px;
          border: 1.5px solid rgba(15, 23, 42, 0.12);
          border-top: 1.6px solid rgba(255, 255, 255, 0.98);
          border-radius: 24px;
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(36px) saturate(140%);
          -webkit-backdrop-filter: blur(36px) saturate(140%);
          box-shadow: 0 16px 36px -8px rgba(15, 23, 42, 0.06);
          transition: border-color 0.3s var(--sy-ease), transform 0.3s var(--sy-ease), box-shadow 0.3s var(--sy-ease);
        }
        .sy-feature-card:hover {
          border-color: rgba(15, 23, 42, 0.28);
          transform: translateY(-4px);
          box-shadow: 0 24px 50px -12px rgba(15, 23, 42, 0.12);
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
          width: 42px;
          height: 42px;
          border-radius: 12px;
          border: 1.5px solid rgba(15, 23, 42, 0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #090d16;
          background: rgba(15, 23, 42, 0.05);
        }
        .sy-feature-tag {
          font-size: 11px;
          font-weight: 700;
          color: var(--sy-blood);
          background: rgba(128, 24, 42, 0.08);
          border: 1px solid rgba(128, 24, 42, 0.2);
          padding: 4px 10px;
          border-radius: 999px;
        }
        .sy-feature-card h3 {
          font-size: 21px;
          font-weight: 800;
          margin-bottom: 10px;
          letter-spacing: -0.01em;
          color: var(--sy-ink);
        }
        .sy-feature-card p {
          font-size: 14.5px;
          line-height: 1.6;
          color: var(--sy-paper-dim);
          max-width: 480px;
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
          background: #e2e8f0;
          border-radius: 2px;
          transition: background 0.3s;
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
          font-size: 10.5px;
          color: var(--sy-mute);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-weight: 650;
        }
        .sy-feature-meta b {
          font-size: 16px;
          font-weight: 800;
          color: var(--sy-ink);
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
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: var(--sy-blood-2);
          box-shadow: 0 0 0 5px rgba(168, 28, 52, 0.16);
          flex-shrink: 0;
        }
        .sy-process-line {
          flex: 1;
          width: 1.5px;
          background: var(--sy-line-strong);
          margin-top: 10px;
        }
        .sy-process-body {
          background: rgba(255, 255, 255, 0.84);
          backdrop-filter: blur(30px);
          border: 1.5px solid rgba(15, 23, 42, 0.12);
          border-radius: 20px;
          padding: 24px 28px;
          box-shadow: 0 8px 24px rgba(15, 23, 42, 0.04);
        }
        .sy-process-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
          color: var(--sy-blood-2);
        }
        .sy-process-label {
          color: var(--sy-blood-2);
          font-weight: 750;
        }
        .sy-process-body h3 {
          font-size: 21px;
          font-weight: 800;
          letter-spacing: -0.01em;
          margin-bottom: 10px;
          color: var(--sy-ink);
        }
        .sy-process-body p {
          font-size: 14.5px;
          line-height: 1.65;
          color: var(--sy-paper-dim);
          max-width: 580px;
          margin-bottom: 16px;
        }
        .sy-process-meta {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 12px;
          color: var(--sy-mute);
          font-weight: 600;
        }
        .sy-process-meta b {
          color: var(--sy-ink);
          font-weight: 750;
        }

        .sy-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          margin-bottom: 28px;
        }
        .sy-stat-card {
          padding: 32px 26px;
          border: 1.5px solid rgba(15, 23, 42, 0.12);
          border-radius: 22px;
          background: rgba(255, 255, 255, 0.84);
          backdrop-filter: blur(30px);
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.04);
          display: flex;
          flex-direction: column;
          gap: 10px;
          transition: border-color 0.3s, transform 0.3s;
        }
        .sy-stat-card:hover {
          border-color: rgba(15, 23, 42, 0.28);
          transform: translateY(-3px);
        }
        .sy-stat-card strong {
          font-size: clamp(2.2rem, 3.6vw, 3rem);
          font-weight: 850;
          letter-spacing: -0.02em;
          color: var(--sy-ink);
        }
        .sy-stat-note {
          color: var(--sy-blood-2);
          font-weight: 700;
        }
        .sy-stat-card p {
          font-size: 13.5px;
          line-height: 1.55;
          color: var(--sy-paper-dim);
        }
        .sy-compare {
          border: 1.5px solid rgba(15, 23, 42, 0.12);
          border-radius: 24px;
          padding: 36px;
          background: rgba(255, 255, 255, 0.84);
          backdrop-filter: blur(30px);
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
          font-size: 22px;
          font-weight: 800;
          color: var(--sy-ink);
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
          font-size: 14.5px;
          font-weight: 650;
          color: var(--sy-ink);
        }
        .sy-compare-top b {
          color: var(--sy-blood-2);
          font-weight: 750;
        }
        .sy-compare-track {
          position: relative;
          height: 7px;
          border-radius: 999px;
          background: #e2e8f0;
          overflow: hidden;
          margin-bottom: 8px;
        }
        .sy-compare-fill {
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, #991b1b, #80182a);
          border-radius: 999px;
          transform-origin: left;
        }
        .sy-compare-note {
          font-size: 13px;
          color: var(--sy-mute);
        }

        .sy-enterprise-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 22px;
          margin-bottom: 24px;
        }
        .sy-enterprise-card {
          padding: 32px;
          border: 1.5px solid rgba(15, 23, 42, 0.12);
          border-radius: 22px;
          background: rgba(255, 255, 255, 0.84);
          backdrop-filter: blur(30px);
          transition: border-color 0.3s, transform 0.3s;
        }
        .sy-enterprise-card:hover {
          border-color: rgba(15, 23, 42, 0.28);
          transform: translateY(-3px);
        }
        .sy-enterprise-card h3 {
          font-size: 18px;
          font-weight: 800;
          margin: 18px 0 10px;
          color: var(--sy-ink);
        }
        .sy-enterprise-card p {
          font-size: 14px;
          line-height: 1.6;
          color: var(--sy-paper-dim);
          margin-bottom: 20px;
        }
        .sy-enterprise-card .sy-feature-meta {
          flex-direction: row;
          align-items: center;
          justify-content: space-between;
          text-align: left;
        }
        .sy-enterprise-card .sy-feature-meta span {
          color: #047857;
          font-weight: 700;
        }
        .sy-enterprise-card .sy-feature-meta svg {
          color: #047857;
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
          border: 1.5px solid rgba(15, 23, 42, 0.14);
          background: rgba(255, 255, 255, 0.88);
          backdrop-filter: blur(36px);
          box-shadow: 0 20px 48px -12px rgba(15, 23, 42, 0.08);
          flex-wrap: wrap;
        }
        .sy-cta-copy h3 {
          font-size: clamp(1.8rem, 3.2vw, 2.4rem);
          font-weight: 850;
          letter-spacing: -0.02em;
          margin: 14px 0 12px;
          color: var(--sy-ink);
        }
        .sy-cta-copy p {
          max-width: 480px;
          font-size: 15px;
          line-height: 1.6;
          color: var(--sy-paper-dim);
        }
        .sy-cta-actions {
          display: flex;
          gap: 14px;
          flex-wrap: wrap;
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