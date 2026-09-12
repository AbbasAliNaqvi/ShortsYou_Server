"use client";

import { startTransition, useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  Clapperboard,
  FolderKanban,
  LogOut,
  Sparkles,
  WandSparkles,
} from "lucide-react";

export function PlaceholderDashboard() {
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token) {
      sessionStorage.setItem("shortsyou_jwt", token);
      window.history.replaceState({}, document.title, "/dashboard");
    }
    startTransition(() => {
      setHasSession(Boolean(token || sessionStorage.getItem("shortsyou_jwt")));
    });
  }, []);

  function signOut() {
    sessionStorage.removeItem("shortsyou_jwt");
    setHasSession(false);
  }

  return (
    <main className="placeholder-dashboard">
      <header>
        <Link className="dashboard-brand" href="/">
          <span>
            <Clapperboard size={17} />
          </span>
          Shorts<span>You</span>
        </Link>
        <div className="dashboard-user">
          <span className="dashboard-status">
            <i /> {hasSession ? "Studio session active" : "Preview workspace"}
          </span>
          <button onClick={signOut} aria-label="Sign out">
            <LogOut size={15} />
          </button>
        </div>
      </header>
      <div className="dashboard-body">
        <aside>
          <p>Workspace</p>
          <a className="selected" href="#overview">
            <Sparkles size={16} />
            Overview
          </a>
          <a href="#content">
            <WandSparkles size={16} />
            Content Lab
          </a>
          <a href="#library">
            <FolderKanban size={16} />
            Library
          </a>
          <a href="#analytics">
            <BarChart3 size={16} />
            Analytics
          </a>
        </aside>
        <section>
          <span className="dashboard-kicker">Studio command center</span>
          <h1>
            Welcome back to
            <br />
            <em>your creative engine.</em>
          </h1>
          <p className="dashboard-copy">
            Your authenticated workspace is ready. This placeholder dashboard is
            the handoff point for the full studio experience.
          </p>
          <div className="dashboard-grid-cards">
            <article>
              <span>Clips in motion</span>
              <strong>24</strong>
              <small>Processing queue ready</small>
            </article>
            <article>
              <span>Audience lift</span>
              <strong>64.8k</strong>
              <small>Across recent exports</small>
            </article>
            <article>
              <span>Next action</span>
              <strong>Start a project</strong>
              <small>Content Lab is waiting</small>
            </article>
          </div>
          <div className="dashboard-placeholder">
            <Sparkles size={22} />
            <div>
              <h2>Dashboard placeholder</h2>
              <p>
                We&apos;ll replace this surface with your real ShortsYou studio
                modules next.
              </p>
            </div>
            <Link href="/">Explore landing page</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
