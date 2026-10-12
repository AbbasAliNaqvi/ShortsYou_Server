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
import "@/styles/home.css";

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

    </div>
  );
}