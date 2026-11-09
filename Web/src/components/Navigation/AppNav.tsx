"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  BarChart3,
  Bell,
  Clapperboard,
  Compass,
  Flame,
  LayoutDashboard,
  Settings,
  ShoppingBag,
  WandSparkles,
} from "lucide-react";
import { memo } from "react";

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
    <aside className="app-nav">
      {/* 4-circle clover brand mark */}
      <Link
        className="app-nav-brand-container"
        href="/dashboard"
        aria-label="Shorts home"
      >
        <motion.div
          className="app-nav-clover-mark"
          whileHover={{ scale: 1.08, rotate: 90 }}
          whileTap={{ scale: 0.96 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
            <circle cx="8" cy="8" r="4.2" />
            <circle cx="16" cy="8" r="4.2" />
            <circle cx="8" cy="16" r="4.2" />
            <circle cx="16" cy="16" r="4.2" />
          </svg>
        </motion.div>
      </Link>

      <nav>
        {links.map(([label, href, Icon]) => {
          const isActive = active(href);
          return (
            <Link
              key={href}
              title={label}
              className={`app-nav-link ${isActive ? "active" : ""}`}
              href={href}
            >
              <motion.div
                className="app-nav-icon-box"
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.96 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
              >
                <Icon size={19} />
              </motion.div>
              <span className="app-nav-tooltip">{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="app-nav-bottom">
        <motion.button
          type="button"
          className="app-nav-notif-btn"
          title="Notifications"
          aria-label="Notifications"
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.96 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
        >
          <Bell size={18} />
          <span className="app-nav-notif-dot" />
          <span className="app-nav-tooltip">Notifications</span>
        </motion.button>
        <Link title="Settings" href="/dashboard" className="app-nav-settings-link" aria-label="Settings">
          <motion.div
            className="app-nav-icon-box"
            whileHover={{ scale: 1.08, rotate: 45 }}
            whileTap={{ scale: 0.96 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <Settings size={18} />
          </motion.div>
          <span className="app-nav-tooltip">Settings</span>
        </Link>
      </div>
    </aside>
  );
});
