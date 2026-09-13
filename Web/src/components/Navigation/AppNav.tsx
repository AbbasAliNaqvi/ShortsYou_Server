"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Clapperboard,
  Compass,
  LayoutDashboard,
  Menu,
  SkipForward,
  Terminal,
  UserCircle,
  WandSparkles,
} from "lucide-react";
import { useState } from "react";

const links = [
  ["Studio", "/dashboard", LayoutDashboard],
  ["Videos", "/videos", Clapperboard],
  ["Custom Editor", "/editor", WandSparkles],
  ["Discover", "/discover", Compass],
  ["Clips Review", "/clips", Clapperboard],
  ["Analytics", "/analytics", BarChart3],
] as const;

export function AppNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  if (pathname === "/" || pathname === "/login" || pathname === "/register")
    return null;

  const active = (href: string) =>
    href === "/editor"
      ? pathname.startsWith("/editor")
      : pathname === href ||
        (href !== "/dashboard" && pathname.startsWith(`${href}/`));

  return (
    <aside className={`app-nav ${open ? "open" : ""}`}>
      {/* Removed py-2 entirely to minimize top and bottom margin */}
      <Link
        className="app-nav-brand-container flex flex-col items-center justify-center w-full"
        href="/dashboard"
        aria-label="Shorts home"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Swapped the glow for a flat, matte frosted glass hover effect */}
        <div 
          className={`flex items-center justify-center w-11 h-11 rounded-2xl border transition-all duration-300 ${
            isHovered 
              ? "bg-white/20 border-white/30 backdrop-blur-xl shadow-none" 
              : "bg-white/10 border-white/20 backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.1)]"
          }`}
        >
          <SkipForward 
            size={16} 
            color={isHovered ? "#ff9eb5" : "#ffffff"} 
            className="transition-colors duration-200 ease-in-out" 
          />
        </div>
      </Link>

      <button
        className="app-nav-menu mt-2" 
        onClick={() => setOpen((value) => !value)}
        aria-label="Toggle navigation"
      >
        <Menu size={18} />
      </button>
      
      <nav>
        {links.map(([label, href, Icon]) => (
          <Link
            key={href}
            title={label}
            className={active(href) ? "active" : ""}
            href={href}
            onClick={() => setOpen(false)}
          >
            <Icon size={17} />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
      
      <div className="app-nav-bottom">
        <button title="Console">
          <Terminal size={17} />
        </button>
        <Link title="Profile" href="/dashboard">
          <UserCircle size={18} />
        </Link>
      </div>
    </aside>
  );
}