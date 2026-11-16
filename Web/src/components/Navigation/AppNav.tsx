"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Clapperboard,
  Compass,
  Flame,
  HeartHandshake,
  LayoutDashboard,
  Settings,
  ShoppingBag,
  WandSparkles,
} from "lucide-react";
import { memo } from "react";
import { LiquidGlass } from "@/components/ui/liquid-glass";

const links = [
  ["Studio", "/dashboard", BarChart3],
  ["Swipe", "/swipe", Flame],
  ["Videos", "/videos", Clapperboard],
  ["Custom Editor", "/editor", WandSparkles],
  ["Discover", "/discover", Compass],
  ["Clips Review", "/clips", ShoppingBag],
  ["Analytics", "/analytics", LayoutDashboard],
] as const;

export const AppNav = memo(function AppNav() {
  const pathname = usePathname();

  // Hidden strictly on public landing & auth routes
  if (pathname === "/" || pathname === "/login" || pathname === "/register") {
    return null;
  }

  const active = (href: string) =>
    href === "/editor"
      ? pathname.startsWith("/editor")
      : pathname === href ||
        (href !== "/dashboard" && pathname.startsWith(`${href}/`));

  return (
    <aside className="app-nav" aria-label="Main Navigation">
      {/* 4-circle clover brand mark */}
      <Link
        className="app-nav-brand-container"
        href="/dashboard"
        aria-label="Shorts home"
      >
        <div className="app-nav-clover-mark">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
            <circle cx="8" cy="8" r="4.2" />
            <circle cx="16" cy="8" r="4.2" />
            <circle cx="8" cy="16" r="4.2" />
            <circle cx="16" cy="16" r="4.2" />
          </svg>
        </div>
      </Link>

      <nav aria-label="Primary Navigation">
        {links.map(([label, href, Icon]) => {
          const isActive = active(href);
          return (
            <Link
              key={href}
              title={label}
              className={`app-nav-link ${isActive ? "active" : ""}`}
              href={href}
              aria-current={isActive ? "page" : undefined}
            >
              <div className="app-nav-icon-box">
                <Icon size={19} />
              </div>
              <span className="app-nav-tooltip">{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="app-nav-bottom">
        <Link
          title="Support the Team"
          href="/support"
          className="app-nav-settings-link app-nav-liquid-action"
          aria-label="Support the Team"
        >
          <LiquidGlass
            radius={16}
            scale={24}
            aberration={6}
            bevelDepth={10}
            frost={0.4}
            tint={0.16}
            className="app-nav-liquid-surface"
          >
            <HeartHandshake size={18} />
          </LiquidGlass>
          <span className="app-nav-tooltip">Support the Team</span>
        </Link>
        <Link
          title="Settings"
          href="/settings"
          className="app-nav-settings-link app-nav-liquid-action"
          aria-label="Settings"
        >
          <LiquidGlass
            radius={16}
            scale={24}
            aberration={6}
            bevelDepth={10}
            frost={0.4}
            tint={0.16}
            className="app-nav-liquid-surface"
          >
            <Settings size={18} />
          </LiquidGlass>
          <span className="app-nav-tooltip">Settings</span>
        </Link>
      </div>
    </aside>
  );
});
