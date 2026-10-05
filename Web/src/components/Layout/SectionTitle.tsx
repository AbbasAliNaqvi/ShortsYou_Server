import type { ReactNode } from "react";

export interface SectionTitleProps {
  title: string;
  meta?: string;
  action?: ReactNode;
}

export function SectionTitle({ title, meta, action }: SectionTitleProps) {
  return (
    <div className="workspace-section-title">
      <h2>
        <i />
        {title}
      </h2>
      <div className="workspace-section-meta-wrap">
        {meta && <span>{meta}</span>}
        {action}
      </div>
    </div>
  );
}
