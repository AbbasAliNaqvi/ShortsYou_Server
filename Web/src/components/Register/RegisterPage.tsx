"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import "@/styles/auth.css";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5050";

function VideoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 8l-6 4 6 4V8z" />
      <rect x="2" y="6" width="14" height="12" rx="2" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function EyeIcon({ off }: { off?: boolean }) {
  if (off) {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function GoogleLogo() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"
      />
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
      />
      <path
        fill="#FBBC05"
        d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.8s.2-2.1.4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z"
      />
      <path
        fill="#34A853"
        d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16c1.8 3.7 5.6 7 10.1 7z"
      />
    </svg>
  );
}

function AppleLogo() {
  return (
    <svg width="15" height="15" viewBox="0 0 170 170" fill="currentColor" aria-hidden="true">
      <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.74 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.48-2.73-7.4-7.4-11.77-14.02-6.19-9.35-11.1-19.96-14.73-31.81-3.64-11.86-5.46-23.2-5.46-34.02 0-14.03 3.53-25.79 10.59-35.28 7.07-9.5 16.01-14.35 26.83-14.57 5.01 0 10.45 1.25 16.32 3.76 5.88 2.51 9.74 3.82 11.59 3.93 1.63 0 5.61-1.36 11.95-4.1 6.33-2.73 11.9-4.04 16.71-3.93 12.41.65 22.38 5.17 29.9 13.56-10.89 6.53-16.23 15.56-16.01 27.09.22 9.04 3.64 16.65 10.24 22.85 6.6 6.2 14.54 9.68 23.83 10.45-2.07 6.1-4.41 12.08-7.03 17.95zm-29.58-106.18c0 7.07-2.67 13.82-8.01 20.24-6.42 7.73-14.15 12.19-23.19 13.38.11-2.07.16-3.81.16-5.23 0-6.97 2.89-13.93 8.66-20.89 5.77-6.97 12.79-11.05 21.06-12.25.87 1.52 1.32 3.09 1.32 4.75z" />
    </svg>
  );
}

function SsoIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
    </svg>
  );
}

// Password strength calculation
function passwordStrength(pw: string): { score: number; label: string; color: string } {
  if (pw.length < 8)  return { score: 1, label: "Too short — use at least 12 characters", color: "#ef4444" };
  if (pw.length < 12) return { score: 2, label: "Fair — add more characters", color: "#f59e0b" };
  const hasUpper   = /[A-Z]/.test(pw);
  const hasNumber  = /\d/.test(pw);
  const hasSymbol  = /[^A-Za-z0-9]/.test(pw);
  const strength   = [hasUpper, hasNumber, hasSymbol].filter(Boolean).length;
  if (strength >= 3) return { score: 4, label: "Strong & secure password", color: "#10b981" };
  if (strength >= 2) return { score: 3, label: "Good — consider a special symbol", color: "#6366f1" };
  return { score: 2, label: "Fair — add uppercase or numbers", color: "#f59e0b" };
}

const previewClips = [
  { name: "EP219 · Viral Hook 01", meta: "9:16 · 24s · 98.4% Peak", status: "done" as const },
  { name: "EP219 · Curiosity Lead 02", meta: "9:16 · 18s · 94.1% Retention", status: "done" as const },
  { name: "EP218 · Smart Reframe 04", meta: "Whisper v3 Ingesting…", status: "processing" as const },
];

export function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [pw,           setPw]           = useState("");
  const [loading,      setLoading]      = useState(false);
  const [submitted,    setSubmitted]    = useState(false);
  const [error,        setError]        = useState("");

  const strength = passwordStrength(pw);

  function startGoogleLogin() {
    window.location.href = new URL("/api/v1/auth/google", API_URL).toString();
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form     = new FormData(e.currentTarget);
    const email    = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");

    if (!email.includes("@")) {
      setError("Enter a valid studio email address.");
      return;
    }
    if (password.length < 12) {
      setError("Use at least 12 characters for your studio password.");
      return;
    }

    setLoading(true);
    await new Promise((r) => setTimeout(r, 850));
    setLoading(false);
    setSubmitted(true);
  }

  return (
    <div className="auth-sky-page">
      {/* Top Navbar */}
      <nav className="auth-nav">
        <Link href="/" className="auth-brand">
          <span className="auth-brand-mark"><VideoIcon /></span>
          ShortsYou
        </Link>
        <div className="auth-nav-end">
          <span>Already a creator?</span>
          <Link href="/login">Sign in</Link>
        </div>
      </nav>

      {/* Main Grid */}
      <main className="auth-layout">
        {/* Glass Form Card */}
        <section className="auth-card" aria-label="Create account">
          <div className="auth-kicker">
            <LockIcon /> Create your studio account
          </div>
          <h1>Get started free</h1>
          <p className="auth-subtitle">
            Turn long episodes into high-converting shorts automatically.
          </p>

          {/* Social OAuth Providers */}
          <div className="auth-providers">
            <button type="button" onClick={startGoogleLogin}>
              <GoogleLogo /> Google
            </button>
            <button type="button" onClick={startGoogleLogin}>
              <AppleLogo /> Apple
            </button>
            <button type="button">
              <SsoIcon /> SSO
            </button>
          </div>

          <div className="auth-divider">or sign up with email</div>

          <form onSubmit={handleSubmit} noValidate>
            {/* Full Name */}
            <div className="auth-field">
              <label htmlFor="reg-name">Full name</label>
              <div className="auth-input-wrap">
                <UserIcon />
                <input
                  id="reg-name"
                  name="name"
                  type="text"
                  placeholder="Your name"
                  autoComplete="name"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className="auth-field">
              <label htmlFor="reg-email">Work email</label>
              <div className="auth-input-wrap">
                <MailIcon />
                <input
                  id="reg-email"
                  name="email"
                  type="email"
                  placeholder="creator@studio.com"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {/* Channel / Podcast Source */}
            <div className="auth-field">
              <label htmlFor="reg-source">
                Channel or podcast URL
                <span className="auth-hint">(optional)</span>
              </label>
              <div className="auth-input-wrap">
                <LinkIcon />
                <input
                  id="reg-source"
                  name="source"
                  type="url"
                  placeholder="youtube.com/@channel or RSS feed"
                  autoComplete="url"
                />
              </div>
            </div>

            {/* Password */}
            <div className="auth-field">
              <label htmlFor="reg-password">
                Password
                <span className="auth-hint">min. 12 characters</span>
              </label>
              <div className="auth-input-wrap">
                <LockIcon />
                <input
                  id="reg-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••••"
                  autoComplete="new-password"
                  minLength={12}
                  required
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                />
                <button
                  type="button"
                  className="auth-eye-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <EyeIcon off={showPassword} />
                </button>
              </div>

              {/* Password Strength Indicator */}
              {pw.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    {[1, 2, 3, 4].map((n) => (
                      <div
                        key={n}
                        style={{
                          flex: 1,
                          height: 4,
                          borderRadius: 4,
                          background: n <= strength.score ? strength.color : "rgba(15, 23, 42, 0.1)",
                          transition: "background 0.3s ease",
                        }}
                      />
                    ))}
                  </div>
                  <p style={{ margin: "5px 0 0", fontSize: 12, fontWeight: 550, color: strength.color }}>
                    {strength.label}
                  </p>
                </div>
              )}
            </div>

            {/* Terms of Service */}
            <label className="auth-remember" style={{ alignItems: "flex-start", marginTop: 4 }}>
              <input type="checkbox" required style={{ marginTop: 3 }} />
              <span style={{ fontSize: 13, lineHeight: 1.45, color: "#475569" }}>
                I agree to the{" "}
                <a href="#terms" style={{ color: "#6366f1", fontWeight: 600, textDecoration: "none" }}>
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="#privacy" style={{ color: "#6366f1", fontWeight: 600, textDecoration: "none" }}>
                  Privacy Policy
                </a>.
              </span>
            </label>

            {error && (
              <p className="auth-error-msg" role="alert">⚠ {error}</p>
            )}
            {submitted && (
              <p className="auth-success-msg" role="status">
                ✓ Account initialized! Redirecting to studio dashboard…
              </p>
            )}

            <button
              className="auth-submit"
              type="submit"
              disabled={loading || submitted}
            >
              {loading ? (
                <><span className="auth-spinner" aria-hidden="true" /> Creating studio account…</>
              ) : submitted ? (
                "Account created"
              ) : (
                "Create studio account"
              )}
            </button>
          </form>

          <p className="auth-foot">
            Already have an account? <Link href="/login">Sign in</Link>
          </p>
        </section>

        {/* Dashboard-Styled Live Preview Card */}
        <aside className="auth-preview" aria-label="What you'll get">
          <div className="auth-preview-head-row">
            <span className="auth-preview-badge">● Studio Starter Pack</span>
            <span className="auth-preview-pill">5 Free 4K Exports</span>
          </div>
          <h2 className="auth-preview-title">Your first clips ready in minutes</h2>
          <p className="auth-preview-sub">AI finds peak engagement, frames speaker faces, and burns animated karaoke subtitles.</p>
          
          <div className="auth-clip-list">
            {previewClips.map((clip) => (
              <div className="auth-clip-item" key={clip.name}>
                <div className="auth-clip-thumb" aria-hidden="true">
                  <VideoIcon />
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

          <div className="auth-feature-box">
            <div className="auth-feature-title">
              <span>✦</span> How it works
            </div>
            <div className="auth-feature-desc">
              Drop in any YouTube video or audio feed. ShortsYou transcribes, detects viral hooks, reframes to 9:16, and delivers studio-ready clips with zero manual editing.
            </div>
          </div>
        </aside>
      </main>

      {/* Footer */}
      <footer className="auth-page-footer">
        <span>© 2026 ShortsYou Studio Inc.</span>
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
