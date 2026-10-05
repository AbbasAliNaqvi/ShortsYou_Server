import { RefreshCw } from "lucide-react";

export interface LoadingStateProps {
  text?: string;
  className?: string;
}

export function LoadingState({
  text = "Loading your AI studio data...",
  className = "",
}: LoadingStateProps) {
  return (
    <div className={`dashboard-empty ca-glass ${className}`}>
      <RefreshCw className="spin" size={18} />
      <span>{text}</span>
    </div>
  );
}
