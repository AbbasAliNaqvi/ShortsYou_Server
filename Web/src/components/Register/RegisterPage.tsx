"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CircleHelp,
  Eye,
  EyeOff,
  Gauge,
  KeyRound,
  LockKeyhole,
  Mail,
  Mic2,
  Network,
  ScanFace,
  Sparkles,
  Video,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5050";

const benefits = [
  [
    Gauge,
    "4K ProRes 422 Direct Vertical Rendering",
    "Continuous 18x realtime rendering with zero frame degradation.",
  ],
  [
    ScanFace,
    "Multi-Speaker Face Tracking & 9:16 Stacking",
    "Optical flow AI dynamically crops and composes multi-camera talk shows.",
  ],
  [
    Sparkles,
    "Algorithmic Hook Saliency Engine",
    "Semantic analysis calculates retention probability per chapter.",
  ],
  [
    Mic2,
    "Automated Audio Clarification (-14 LUFS)",
    "Studio-calibrated vocal isolation curves and loudness mastering.",
  ],
] as const;

export function RegisterPage() {
  const [tier, setTier] = useState("solo");
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    const email = String(form.get("email") ?? "");

    if (password.length < 12) {
      setError("Use at least 12 characters for your master password.");
      return;
    }
    if (!email.includes("@")) {
      setError("Enter a valid studio work email.");
      return;
    }
    setSubmitted(true);
  }

  return (
    <main className="auth-page">
      <div className="auth-atmosphere auth-atmosphere-one" />
      <div className="auth-atmosphere auth-atmosphere-two" />
      <div className="auth-dots" />
      <header className="auth-header">
        <Link className="auth-brand" href="/">
          <span className="auth-brand-mark">
            <Video size={18} />
          </span>
          <span>
            <strong>ShortsYou</strong>
            <small>STUDIO GRADE 4K</small>
          </span>
        </Link>
        <div className="auth-release">
          <i /> Architecture 2.8 Released <b>·</b> Start 14-Day Free Run
        </div>
        <div className="auth-header-actions">
          <span>Already have a seat?</span>
          <Link href="/login">Sign In</Link>
          <button aria-label="Help">
            <CircleHelp size={16} />
          </button>
        </div>
      </header>

      <div className="auth-layout">
        <section className="auth-intro">
          <span className="auth-kicker">
            <i /> Neural studio deployment
          </span>
          <h1>
            Turn long-form broadcasts into <em>viral high-fidelity cinema.</em>
          </h1>
          <p className="auth-lead">
            Engineered exclusively for premium media networks, elite podcasters,
            and high-frequency video laboratories requiring zero-latency
            processing.
          </p>
          <div className="benefit-list">
            {benefits.map(([Icon, title, text]) => (
              <article className="benefit-row" key={title}>
                <span>
                  <Icon size={17} />
                </span>
                <div>
                  <h2>{title}</h2>
                  <p>{text}</p>
                </div>
              </article>
            ))}
          </div>
          <div className="auth-proof">
            <div className="proof-avatars">
              <span>AK</span>
              <span>JD</span>
              <span>SR</span>
              <b>+14k</b>
            </div>
            <div>
              <div className="stars">★★★★★</div>
              <strong>Architected for production scale</strong>
            </div>
            <div className="proof-deploy">
              <small>DEPLOYED BY TEAMS AT:</small>
              <b>SPOTIFY · THE DAILY · ALL-IN</b>
            </div>
          </div>
        </section>

        <section className="register-card">
          <div className="register-highlight" />
          <div className="register-heading">
            <div>
              <h2>Initiate Studio Access</h2>
              <p>
                Join 14,000+ media networks turning raw podcasts into 4K viral
                shorts in seconds.
              </p>
            </div>
            <span>STEP 01/02</span>
          </div>
          <div className="provider-grid">
            <button
              type="button"
              onClick={() => {
                window.location.href = new URL(
                  "/api/v1/auth/google",
                  API_URL,
                ).toString();
              }}
            >
              <span className="google-mark">G</span>Google
            </button>
            <button type="button">
              <span className="apple-mark">●</span>Apple ID
            </button>
            <button type="button">
              <KeyRound size={14} />
              Deploy SSO
            </button>
          </div>
          <div className="auth-divider">
            <span>OR REGISTER WORKSPACE</span>
          </div>
          <form onSubmit={handleSubmit}>
            <fieldset className="tier-field">
              <legend>Select architecture tier</legend>
              <div className="tier-grid">
                <label
                  className={
                    tier === "solo" ? "tier-option selected" : "tier-option"
                  }
                >
                  <input
                    type="radio"
                    name="tier"
                    value="solo"
                    checked={tier === "solo"}
                    onChange={() => setTier("solo")}
                  />
                  <span>
                    <strong>Solo Creator</strong>
                    <small>Fast track · 1080p rendering</small>
                  </span>
                </label>
                <label
                  className={
                    tier === "network" ? "tier-option selected" : "tier-option"
                  }
                >
                  <input
                    type="radio"
                    name="tier"
                    value="network"
                    checked={tier === "network"}
                    onChange={() => setTier("network")}
                  />
                  <span>
                    <strong>
                      Studio Network <b>4K PRO</b>
                    </strong>
                    <small>Multi-seat · ProRes master</small>
                  </span>
                </label>
              </div>
            </fieldset>
            <div className="input-grid">
              <Field
                label="Full name / studio lead"
                name="name"
                placeholder="Andrew Huberman"
                icon={Network}
              />
              <Field
                label="Studio work email"
                name="email"
                placeholder="name@production.co"
                type="email"
                icon={Mail}
              />
            </div>
            <Field
              label="Channel or podcast URL / RSS hook"
              name="source"
              placeholder="youtube.com/@hubermanlab or Spotify / RSS feed"
              icon={Mic2}
              note="Auto-sync enabled"
            />
            <div className="form-field">
              <div className="field-label">
                <label htmlFor="password">Create master password</label>
                <span>Min. 12 characters</span>
              </div>
              <div className="input-shell">
                <LockKeyhole size={16} />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  defaultValue="studioaccess2025"
                  minLength={12}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <div className="strength">
                <span>
                  <i />
                  <i />
                  <i />
                  <i />
                </span>
                <b>✓ Hardware Grade / Strong</b>
              </div>
            </div>
            <label className="terms">
              <input type="checkbox" defaultChecked required />
              <span>
                I agree to the <a href="#terms">Studio Terms of Architecture</a>{" "}
                & strict <a href="#privacy">Zero-Retention Privacy Protocol</a>.
              </span>
            </label>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            {submitted && (
              <p className="form-success" role="status">
                Workspace request captured. Email registration will connect when
                the API endpoint is enabled.
              </p>
            )}
            <button className="claim-button" type="submit">
              {submitted
                ? "Workspace Request Saved"
                : "Claim 14-Day Studio Run"}{" "}
              <ArrowRight size={16} />
            </button>
            <div className="reassurance">
              <span>ϟ No card required upfront</span>
              <span>·</span>
              <span>⌑ 256-bit SOC-2 certified</span>
              <span>·</span>
              <span>⊗ Instant cancellation</span>
            </div>
          </form>
        </section>
      </div>
      <footer className="auth-footer">
        <span>
          <strong>ShortsYou</strong> · © 2025 ShortsYou Inc. Built for elite
          media operators.
        </span>
        <nav>
          <a href="#privacy">Privacy Protocol</a>
          <a href="#terms">Terms of Architecture</a>
          <a href="#security">Studio Security</a>
          <a className="operational" href="#status">
            <i /> System Status (100% Operational)
          </a>
        </nav>
      </footer>
    </main>
  );
}

function Field({
  label,
  name,
  placeholder,
  icon: Icon,
  type = "text",
  note,
}: {
  label: string;
  name: string;
  placeholder: string;
  icon: typeof Mail;
  type?: string;
  note?: string;
}) {
  return (
    <div className="form-field">
      <div className="field-label">
        <label htmlFor={name}>{label}</label>
        {note ? <span className="field-note">{note}</span> : null}
      </div>
      <div className="input-shell">
        <Icon size={16} />
        <input
          id={name}
          name={name}
          type={type}
          placeholder={placeholder}
          required
        />
      </div>
    </div>
  );
}
