import type { ReactNode } from "react";
import { Sparkles, LucideIcon } from "lucide-react";

export interface EmptyStateProps {
  text: string;
  icon?: LucideIcon;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  text,
  icon: Icon = Sparkles,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div className={`dashboard-empty ca-glass ${className}`}>
      <Icon size={18} />
      <span>{text}</span>
      {action}
    </div>
  );
}
