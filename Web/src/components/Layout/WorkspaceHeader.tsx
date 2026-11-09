"use client";
/* eslint-disable @next/next/no-img-element */

import { useState, useRef, useEffect } from "react";
import { LogOut, Mail, Search, CheckCircle2, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import type { User } from "@/lib/api";
import { initials } from "@/lib/formatters";

export interface WorkspaceHeaderProps {
  title?: string;
  subtitle?: string;
  email?: string;
  user?: User | null;
  refreshing?: boolean;
  onRefresh?: () => void;
  onSignOut?: () => void;
  onMessagesClick?: () => void;
  customActions?: ReactNode;
}

/**
 * Gracefully format user names to an allowed visual length so large names
 * remain clean, balanced, and never break the pill layout.
 */
function formatDisplayName(name?: string, maxLength = 14): string {
  if (!name) return "Creator";
  const trimmed = name.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength).trim()}…`;
}

export function WorkspaceHeader({
  title = "Channel Analytics",
  subtitle,
  email,
  user,
  refreshing = false,
  onRefresh,
  onSignOut,
  onMessagesClick,
  customActions,
}: WorkspaceHeaderProps) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  // Persistent User Cache to prevent avatar/name popping during page transitions
  const [cachedUser, setCachedUser] = useState<User | null>(user ?? null);

  useEffect(() => {
    setMounted(true);
    if (user) {
      setCachedUser(user);
    } else {
      try {
        const stored = localStorage.getItem("shortsyou_user");
        if (stored) {
          setCachedUser(JSON.parse(stored) as User);
        }
      } catch {}
    }
  }, [user]);

  // Avoid hydration mismatch by aligning initial SSR/client state with props, then hydrating cached session
  const activeUser = mounted ? (user || cachedUser) : user;
  const displayEmail = email || activeUser?.email;
  const displayName = activeUser?.name || (displayEmail ? displayEmail.split("@")[0] : "Creator");
  const formattedName = formatDisplayName(displayName, 14);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    }
    if (userMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [userMenuOpen]);

  return (
    <header className="ca-header-bar">
      {/* Header Left Title & Subtitle */}
      <div className="ca-header-left">
        <h1 className="ca-header-title">{title}</h1>
        {subtitle && <span className="ca-header-subtitle">{subtitle}</span>}
      </div>

      {/* Header Right Action Cluster — Frost Themed Capsule */}
      <div className="ca-header-actions">
        {customActions}

        <div className="ca-header-glass-cluster" ref={dropdownRef}>
          {/* Messages / Mail Button */}
          <button
            type="button"
            className="ca-glass-circle-btn ca-btn-mail"
            title="Messages & Notifications"
            onClick={onMessagesClick}
            aria-label="Messages & Notifications"
          >
            <Mail size={18} strokeWidth={1.9} />
            <span className="ca-btn-dot" />
          </button>

          {/* Search & Refresh Studio Button */}
          {onRefresh && (
            <button
              type="button"
              className="ca-glass-circle-btn ca-btn-search"
              onClick={onRefresh}
              aria-label="Refresh studio"
              title="Search & Refresh Studio Data"
            >
              <Search size={18} strokeWidth={1.9} className={refreshing ? "spin" : ""} />
            </button>
          )}

          {/* Sign Out Button */}
          {onSignOut && (
            <button
              type="button"
              className="ca-glass-circle-btn ca-btn-logout"
              onClick={onSignOut}
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut size={18} strokeWidth={1.9} />
            </button>
          )}

          {/* Luminous Frosted User Pill Button: Profile Photo + User Name */}
          <button
            type="button"
            className={`ca-user-pill-btn ca-btn-authenticate ${userMenuOpen ? "active" : ""}`}
            onClick={() => setUserMenuOpen((prev) => !prev)}
            title={displayName ? `${displayName} (${displayEmail ?? "Creator"})` : (displayEmail ?? "Creator")}
            aria-label="Creator Profile Menu"
            aria-expanded={userMenuOpen}
            suppressHydrationWarning
          >
            <div className="ca-pill-avatar-wrap">
              <div className="ca-pill-avatar-inner" suppressHydrationWarning>
                {activeUser?.profilePicture ? (
                  <img
                    src={activeUser.profilePicture}
                    alt={displayName || "Creator profile"}
                    className="ca-pill-avatar-img"
                  />
                ) : (
                  <span className="ca-pill-avatar-initials" suppressHydrationWarning>
                    {initials(displayName)}
                  </span>
                )}
              </div>
              <span className="ca-pill-online-dot" />
            </div>

            <span className="ca-pill-user-name" suppressHydrationWarning>
              {formattedName}
            </span>
          </button>

          {/* Frosted Profile Popover */}
          {userMenuOpen && (
            <div className="ca-auth-popover" role="dialog" aria-label="Creator Profile">
              <div className="ca-auth-popover-header">
                <div className="ca-auth-badge">
                  <ShieldCheck size={16} />
                  <span>Creator Studio</span>
                </div>
                <div className="ca-auth-live-pill">
                  <span className="ca-auth-dot" />
                  <span>Active</span>
                </div>
              </div>

              <div className="ca-auth-user-profile">
                <div className="ca-auth-avatar-wrap">
                  {activeUser?.profilePicture ? (
                    <img
                      src={activeUser.profilePicture}
                      alt={displayName}
                      className="ca-auth-avatar-img"
                    />
                  ) : (
                    <span className="ca-auth-avatar-initials">
                      {initials(displayName)}
                    </span>
                  )}
                </div>
                <div className="ca-auth-user-meta">
                  <span className="ca-auth-user-name">{displayName}</span>
                  {displayEmail && <span className="ca-auth-user-email">{displayEmail}</span>}
                </div>
              </div>

              <div className="ca-auth-session-details">
                <div className="ca-auth-session-item">
                  <span className="ca-auth-label">Status</span>
                  <span className="ca-auth-val">
                    <CheckCircle2 size={13} className="text-emerald-500 inline mr-1" />
                    Online in Studio
                  </span>
                </div>
                <div className="ca-auth-session-item">
                  <span className="ca-auth-label">Role</span>
                  <span className="ca-auth-val">Verified Creator</span>
                </div>
              </div>

              {onSignOut && (
                <div className="ca-auth-actions">
                  <button
                    type="button"
                    className="ca-auth-signout-btn"
                    onClick={() => {
                      setUserMenuOpen(false);
                      onSignOut();
                    }}
                  >
                    <LogOut size={14} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
