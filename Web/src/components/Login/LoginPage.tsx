"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import "@/styles/auth.css";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5050";

// Inline SVG icons
const PATHS = {
  video:    "M22 8l-6 4 6 4V8zM2 6h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2z",
  mail:     "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6",
  lock:     "M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2zM7 11V7a5 5 0 0 1 10 0v4",
  eye:      "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
  eyeOff:   "M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22",
  terminal: "M4 17l6-6-6-6M12 19h8",
  key:      "M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4",
} as const;

function Icon({ name, size = 16 }: { name: keyof typeof PATHS; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <path d={PATHS[name]} />
    </svg>
  );
}

const previewClips = [
  { name: "EP219 · Hook 01", meta: "9:16 · 24 s", status: "done" as const },
  { name: "EP219 · Hook 02", meta: "9:16 · 18 s", status: "done" as const },
  { name: "EP218 · Hook 04", meta: "Processing…", status: "processing" as const },
  { name: "EP217 · Hook 01", meta: "9:16 · 31 s", status: "done" as const },
];

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [submitted,    setSubmitted]    = useState(false);
  const [error,        setError]        = useState("");

  function startGoogleLogin() {
    window.location.href = new URL("/api/v1/auth/google", API_URL).toString();
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form  = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    if (!email.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }
    setLoading(true);
    // Simulate network — real endpoint wired when backend is active
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    setSubmitted(true);
  }

  return (
    <div className="auth-sky-page">
      {/* Nav */}
      <nav className="auth-nav">
        <Link href="/" className="auth-brand">
          <span className="auth-brand-mark"><Icon name="video" size={16} /></span>
          ShortsYou
        </Link>
        <div className="auth-nav-end">
          <span>New here?</span>
          <Link href="/register">Create account</Link>
        </div>
      </nav>

      {/* Main */}
      <main className="auth-layout">
        {/* Glass form card */}
        <section className="auth-card" aria-label="Sign in">
          <div className="auth-kicker">
            <Icon name="lock" size={12} /> Secure sign in
          </div>
          <h1>Welcome back</h1>
          <p className="auth-subtitle">Sign in to your ShortsYou workspace.</p>

          {/* OAuth providers */}
          <div className="auth-providers">
            <button type="button" onClick={startGoogleLogin}>
              <span className="auth-google-mark">G</span> Google
            </button>
            <button type="button" onClick={startGoogleLogin}>
              <Icon name="terminal" size={14} /> Apple
            </button>
            <button type="button">
              <Icon name="key" size={14} /> SSO
            </button>
          </div>

          <div className="auth-divider">or continue with email</div>

          {/* Email + password form */}
          <form onSubmit={handleSubmit} noValidate>
            <div className="auth-field">
              <label htmlFor="login-email">Email address</label>
              <div className="auth-input-wrap">
                <Icon name="mail" size={16} />
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  placeholder="you@studio.com"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="auth-field">
              <div className="auth-field-row">
                <label htmlFor="login-password">Password</label>
                <a href="#forgot">Forgot password?</a>
              </div>
              <div className="auth-input-wrap">
                <Icon name="lock" size={16} />
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="auth-eye-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <Icon name={showPassword ? "eyeOff" : "eye"} size={16} />
                </button>
              </div>
            </div>

            <label className="auth-remember">
              <input type="checkbox" defaultChecked />
              Keep me signed in for 30 days
            </label>

            {error && (
              <p className="auth-error-msg" role="alert">⚠ {error}</p>
            )}
            {submitted && (
              <p className="auth-success-msg" role="status">
                ✓ Email sign-in will connect when the backend credential endpoint is enabled.
              </p>
            )}

            <button
              className="auth-submit"
              type="submit"
              disabled={loading || submitted}
            >
              {loading ? (
                <><span className="auth-spinner" aria-hidden="true" /> Signing in…</>
              ) : submitted ? (
                "Signed in"
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          <p className="auth-foot">
            Don&apos;t have an account?{" "}
            <Link href="/register">Create account</Link>
          </p>
        </section>

        {/* Preview card — desktop only */}
        <aside className="auth-preview" aria-label="Recent clips preview">
          <div className="auth-preview-head">Your recent clips</div>
          <div className="auth-preview-title">Pick up where you left off</div>
          <div className="auth-clip-list">
            {previewClips.map((clip) => (
              <div className="auth-clip-item" key={clip.name}>
                <div className="auth-clip-thumb" aria-hidden="true">
                  <Icon name="video" size={16} />
                </div>
                <div className="auth-clip-info">
                  <div className="auth-clip-name">{clip.name}</div>
                  <div className="auth-clip-meta">{clip.meta}</div>
                </div>
                <div className={`auth-clip-status ${clip.status}`}>
                  {clip.status === "done" ? "Ready" : "Processing"}
                </div>
              </div>
            ))}
          </div>
        </aside>
      </main>

      {/* Footer */}
      <footer className="auth-page-footer">
        <span>© 2026 ShortsYou Inc.</span>
        <nav aria-label="Legal">
          <a href="#privacy">Privacy</a>
          <a href="#terms">Terms</a>
          <a href="#security">Security</a>
          <a href="#status">Status</a>
        </nav>
      </footer>
    </div>
  );
}
