"use client";
/* eslint-disable @next/next/no-img-element */

import { motion } from "framer-motion";
import { LogOut, Mail, Search } from "lucide-react";
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
  const displayEmail = email || user?.email;
  const displayName = user?.name;

  return (
    <header className="ca-header-bar">
      {/* Header Left Title & Subtitle */}
      <div className="ca-header-left">
        <h1 className="ca-header-title">{title}</h1>
        {subtitle && <span className="ca-header-subtitle">{subtitle}</span>}
      </div>

      {/* Header Right Action Cluster */}
      <div className="ca-header-actions ca-header-glass-cluster">
        {customActions}

        {/* Messages / Mail Button */}
        <motion.button
          className="ca-glass-circle-btn ca-btn-mail"
          title="Messages & Notifications"
          onClick={onMessagesClick}
          whileHover={{ scale: 1.08, y: -2 }}
          whileTap={{ scale: 0.94 }}
        >
          <Mail size={17} />
          <span className="ca-btn-dot" />
        </motion.button>

        {/* Search & Refresh Studio Button */}
        {onRefresh && (
          <motion.button
            className="ca-glass-circle-btn ca-btn-search"
            onClick={onRefresh}
            aria-label="Refresh studio"
            title="Search & Refresh Studio Data"
            whileHover={{ scale: 1.08, y: -2 }}
            whileTap={{ scale: 0.94 }}
          >
            <Search size={17} className={refreshing ? "spin" : ""} />
          </motion.button>
        )}

        {/* User Profile Badge ("My Image") */}
        <motion.div
          className="ca-header-user-badge"
          title={displayName ? `${displayName} (${displayEmail ?? "Creator"})` : (displayEmail ?? "Creator")}
          whileHover={{ scale: 1.06, y: -2 }}
          whileTap={{ scale: 0.94 }}
        >
          <div className="ca-header-avatar-inner">
            {user?.profilePicture ? (
              <img
                src={user.profilePicture}
                alt={displayName || "Creator profile"}
                className="ca-header-avatar"
              />
            ) : (
              <span className="ca-header-avatar-text">{initials(displayName)}</span>
            )}
          </div>
          <span className="ca-avatar-online-dot" title="Active in Studio" />
        </motion.div>

        {/* Log Out Button */}
        {onSignOut && (
          <motion.button
            className="ca-glass-circle-btn ca-btn-logout"
            onClick={onSignOut}
            title="Sign Out"
            whileHover={{ scale: 1.08, y: -2 }}
            whileTap={{ scale: 0.94 }}
          >
            <LogOut size={17} />
          </motion.button>
        )}
      </div>
    </header>
  );
}
