"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CircleHelp,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Terminal,
  Video,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5050";

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  function startGoogleLogin() {
    window.location.href = new URL("/api/v1/auth/google", API_URL).toString();
  }

  return (
    <main className="login-page">
      <div className="login-glow login-glow-right" />
      <div className="login-glow login-glow-left" />
      <div className="login-dots" />
      <header className="login-header">
        <Link className="login-brand" href="/">
          <span>
            <Video size={18} />
          </span>
          <strong>ShortsYou</strong>
        </Link>
        <div className="login-status">
          <i /> System Operational · 12ms
        </div>
        <nav>
          <Link href="/">
            <ArrowLeft size={14} /> <span>Back to Platform</span>
          </Link>
          <a href="#support">
            <CircleHelp size={14} /> <span>Support</span>
          </a>
          <Link className="login-explore" href="/">
            Explore Engine
          </Link>
        </nav>
      </header>
      <div className="login-layout">
        <section className="login-card">
          <span className="login-card-beam" />
          <div className="login-kicker">
            <LockKeyhole size={12} /> Terminal 01 Auth
          </div>
          <h1>Access Studio Engine</h1>
          <p className="login-subtitle">
            Enter your studio credentials to resume video architecture.
          </p>
          <div className="login-providers">
            <button type="button" onClick={startGoogleLogin}>
              <span className="google-mark">G</span>Google
            </button>
            <button type="button">
              <Terminal size={14} />
              Apple
            </button>
            <button type="button">
              <KeyRound size={14} />
              SSO / SAML
            </button>
          </div>
          <div className="login-divider">
            <span>OR CONTINUE WITH EMAIL</span>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="login-field">
              <label htmlFor="work-email">Work email</label>
              <div>
                <Mail size={16} />
                <input
                  id="work-email"
                  name="email"
                  type="email"
                  placeholder="operator@studio.com"
                  required
                />
              </div>
            </div>
            <div className="login-field">
              <div className="login-field-label">
                <label htmlFor="login-password">Master password</label>
                <a href="#forgot">Forgot password?</a>
              </div>
              <div>
                <LockKeyhole size={16} />
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••••"
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
            </div>
            <label className="remember-session">
              <input type="checkbox" defaultChecked />
              Keep terminal session active (30 days)
            </label>
            {submitted && (
              <p className="login-placeholder" role="status">
                Email sign-in will connect when the backend credential endpoint
                is enabled.
              </p>
            )}
            <button className="login-submit" type="submit">
              Sign In to Workspace <ArrowRight size={16} />
            </button>
          </form>
          <div className="login-signup">
            Don&apos;t have a studio seat?{" "}
            <Link href="/register">Request Access / Create account</Link>
          </div>
        </section>
        <aside className="login-aside">
          <div className="telemetry-card">
            <div className="telemetry-heading">
              <span>
                <i /> Live telemetry stream
              </span>
              <b>4K_REC_ACTIVE</b>
            </div>
            <div className="workload">
              <span>ACTIVE WORKLOAD</span>
              <strong>HUBERMAN_EP219_RAW_4K.MOV</strong>
              <b>AI CUT V4.2</b>
              <div>
                <span>Retention Differential</span>
                <strong>+412% Benchmark</strong>
              </div>
            </div>
            <div className="login-testimonial">
              <div className="stars">★★★★★</div>
              <blockquote>
                &quot;ShortsYou cut our turnaround from 3.5h down to 42s without
                losing cinematic speaker coherence.&quot;
              </blockquote>
              <small>
                <ShieldCheck size={14} /> Spotify Studios / All-In Network
                Operator
              </small>
            </div>
          </div>
          <div className="assurance-card">
            <ShieldCheck size={19} />
            <div>
              <strong>Terminal Hardware Assurance</strong>
              <p>
                SOC-2 Type II Certified · 256-Bit Hardware Encryption · Strict
                Zero-Data Retention Engine.
              </p>
            </div>
          </div>
        </aside>
      </div>
      <footer className="login-footer">
        <span>
          © 2025 ShortsYou Inc. Ultra-premium AI video architecture. All rights
          reserved.
        </span>
        <nav>
          <a href="#privacy">Privacy Protocol</a>
          <a href="#terms">Terms of Architecture</a>
          <a href="#security">Studio Security</a>
          <a href="#status">System Status</a>
        </nav>
      </footer>
    </main>
  );
}
