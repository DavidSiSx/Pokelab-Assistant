"use client";

import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  compact?: boolean;
}

export function EmptyState({ icon, title, description, action, compact = false }: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${compact ? "py-8 gap-3" : "py-16 gap-4"}`}
    >
      {icon && (
        <div
          className="flex items-center justify-center rounded-full animate-float"
          style={{
            width: compact ? 56 : 72,
            height: compact ? 56 : 72,
            background: "var(--accent-glow)",
            border: "1px solid var(--accent)",
            color: "var(--accent)",
          }}
        >
          {icon}
        </div>
      )}

      <div className="flex flex-col gap-1.5 max-w-xs">
        <h3
          className={`font-bold text-balance ${compact ? "text-base" : "text-lg"}`}
          style={{ color: "var(--text-primary)" }}
        >
          {title}
        </h3>
        {description && (
          <p
            className="text-sm leading-relaxed text-balance"
            style={{ color: "var(--text-secondary)" }}
          >
            {description}
          </p>
        )}
      </div>

      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
