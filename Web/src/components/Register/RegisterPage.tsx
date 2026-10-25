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
  user:     "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  link:     "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71",
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

// Password strength helper
function passwordStrength(pw: string): { score: number; label: string } {
  if (pw.length < 8)  return { score: 1, label: "Too short — use at least 12 characters" };
  if (pw.length < 12) return { score: 2, label: "Weak — add more characters or symbols" };
  const hasUpper   = /[A-Z]/.test(pw);
  const hasNumber  = /\d/.test(pw);
  const hasSymbol  = /[^A-Za-z0-9]/.test(pw);
  const strength   = [hasUpper, hasNumber, hasSymbol].filter(Boolean).length;
  if (strength >= 3) return { score: 4, label: "Strong" };
  if (strength >= 2) return { score: 3, label: "Good — consider a symbol" };
  return { score: 2, label: "Fair — add uppercase and numbers" };
}

const previewClips = [
  { name: "EP219 · Hook 01", meta: "9:16 · 24 s", status: "done" as const },
  { name: "EP219 · Hook 02", meta: "9:16 · 18 s", status: "done" as const },
  { name: "EP218 · Hook 04", meta: "Processing…", status: "processing" as const },
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
      setError("Enter a valid email address.");
      return;
    }
    if (password.length < 12) {
      setError("Use at least 12 characters for your password.");
      return;
    }

    setLoading(true);
    await new Promise((r) => setTimeout(r, 900));
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
          <span>Already have an account?</span>
          <Link href="/login">Sign in</Link>
        </div>
      </nav>

      {/* Main */}
      <main className="auth-layout">
        {/* Glass form card */}
        <section className="auth-card" aria-label="Create account">
          <div className="auth-kicker">
            <Icon name="lock" size={12} /> Create your account
          </div>
          <h1>Get started</h1>
          <p className="auth-subtitle">
            Start processing your first episode in minutes.
          </p>

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

          <div className="auth-divider">or sign up with email</div>

          <form onSubmit={handleSubmit} noValidate>
            {/* Full name */}
            <div className="auth-field">
              <label htmlFor="reg-name">Full name</label>
              <div className="auth-input-wrap">
                <Icon name="user" size={16} />
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
                <Icon name="mail" size={16} />
                <input
                  id="reg-email"
                  name="email"
                  type="email"
                  placeholder="you@studio.com"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {/* Channel / RSS */}
            <div className="auth-field">
              <label htmlFor="reg-source">
                Podcast or channel URL{" "}
                <span style={{ color: "rgba(255,255,255,0.45)", fontWeight: 400 }}>(optional)</span>
              </label>
              <div className="auth-input-wrap">
                <Icon name="link" size={16} />
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
                <span style={{ color: "rgba(255,255,255,0.45)", fontWeight: 400, marginLeft: 8 }}>
                  min. 12 characters
                </span>
              </label>
              <div className="auth-input-wrap">
                <Icon name="lock" size={16} />
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
                  <Icon name={showPassword ? "eyeOff" : "eye"} size={16} />
                </button>
              </div>
              {pw.length > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                  {/* Strength bars */}
                  {[1, 2, 3, 4].map((n) => (
                    <div
                      key={n}
                      style={{
                        flex: 1,
                        height: 4,
                        borderRadius: 2,
                        background: n <= strength.score
                          ? strength.score >= 4
                            ? "rgba(200,255,220,0.8)"
                            : "rgba(255,255,255,0.7)"
                          : "rgba(255,255,255,0.15)",
                        transition: "background 0.3s",
                      }}
                    />
                  ))}
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", whiteSpace: "nowrap" }}>
                    {strength.label}
                  </span>
                </div>
              )}
            </div>

            {/* Terms */}
            <label className="auth-remember" style={{ marginBottom: 18, alignItems: "flex-start" }}>
              <input type="checkbox" required style={{ marginTop: 2 }} />
              <span>
                I agree to the{" "}
                <a href="#terms" style={{ color: "#fff", textDecoration: "underline", textUnderlineOffset: 3 }}>
                  Terms of service
                </a>{" "}
                and{" "}
                <a href="#privacy" style={{ color: "#fff", textDecoration: "underline", textUnderlineOffset: 3 }}>
                  Privacy policy
                </a>.
              </span>
            </label>

            {error && (
              <p className="auth-error-msg" role="alert" style={{ marginBottom: 12 }}>
                ⚠ {error}
              </p>
            )}
            {submitted && (
              <p className="auth-success-msg" role="status" style={{ marginBottom: 12 }}>
                ✓ Account request captured. Full registration connects when the API endpoint is enabled.
              </p>
            )}

            <button
              className="auth-submit"
              type="submit"
              disabled={loading || submitted}
            >
              {loading ? (
                <><span className="auth-spinner" aria-hidden="true" /> Creating account…</>
              ) : submitted ? (
                "Account created"
              ) : (
                "Create account"
              )}
            </button>
          </form>

          <p className="auth-foot">
            Already have an account? <Link href="/login">Sign in</Link>
          </p>
        </section>

        {/* Preview card — desktop only */}
        <aside className="auth-preview" aria-label="What you'll get">
          <div className="auth-preview-head">You&apos;ll start with</div>
          <div className="auth-preview-title">Your first clips, ready in minutes</div>
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
          <div style={{ marginTop: 20, padding: "16px", borderRadius: 12, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", marginBottom: 6 }}>
              How it works
            </div>
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.78)", lineHeight: 1.6 }}>
              Drop in a podcast episode. ShortsYou finds the hooks, reframes to
              9:16, and delivers a batch of ready-to-post clips — no editing.
            </div>
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
