"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Clapperboard, Compass, LayoutDashboard, Menu, Terminal, UserCircle, WandSparkles } from "lucide-react";
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
  if (pathname === "/" || pathname === "/login" || pathname === "/register") return null;
  const active = (href: string) => href === "/editor" ? pathname.startsWith("/editor") : pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`));
  return <aside className={`app-nav ${open ? "open" : ""}`}><Link className="app-nav-brand" href="/dashboard" aria-label="ShortsYou home"><span>S</span></Link><button className="app-nav-menu" onClick={() => setOpen((value) => !value)} aria-label="Toggle navigation"><Menu size={18} /></button><nav>{links.map(([label, href, Icon]) => <Link key={href} title={label} className={active(href) ? "active" : ""} href={href} onClick={() => setOpen(false)}><Icon size={17} /><span>{label}</span></Link>)}</nav><div className="app-nav-bottom"><button title="Console"><Terminal size={17} /></button><Link title="Profile" href="/dashboard"><UserCircle size={18} /></Link></div></aside>;
}
