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
      className={`card flex flex-col items-center justify-center text-center ${compact ? "py-10 gap-3" : "py-16 gap-5"}`}
      style={{ borderStyle: "dashed", background: "var(--bg-surface)" }}
    >
      {icon && (
        <div
          className="flex items-center justify-center rounded-2xl"
          style={{
            width: compact ? 52 : 64,
            height: compact ? 52 : 64,
            background: "var(--accent-glow)",
            border: "1px solid var(--accent)",
            color: "var(--accent)",
          }}
        >
          {typeof icon === "string" ? (
            <span style={{ fontSize: compact ? "1.4rem" : "1.6rem" }}>{icon}</span>
          ) : (
            icon
          )}
        </div>
      )}

      <div className="flex flex-col gap-2 max-w-sm">
        <h3
          className={`font-bold text-balance ${compact ? "text-sm" : "text-base"}`}
          style={{ color: "var(--text-primary)" }}
        >
          {title}
        </h3>
        {description && (
          <p
            className="text-sm leading-relaxed text-balance text-pretty"
            style={{ color: "var(--text-muted)" }}
          >
            {description}
          </p>
        )}
      </div>

      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
