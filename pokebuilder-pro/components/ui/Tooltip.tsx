"use client";

import { useState, type ReactNode } from "react";

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  maxWidth?: number;
}

export function Tooltip({ content, children, position = "top", maxWidth = 220 }: TooltipProps) {
  const [visible, setVisible] = useState(false);

  const positionStyles: Record<string, React.CSSProperties> = {
    top:    { bottom: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)" },
    bottom: { top: "calc(100% + 8px)",   left: "50%", transform: "translateX(-50%)" },
    left:   { right: "calc(100% + 8px)", top: "50%",  transform: "translateY(-50%)" },
    right:  { left: "calc(100% + 8px)",  top: "50%",  transform: "translateY(-50%)" },
  };

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}

      {visible && (
        <span
          role="tooltip"
          className="absolute z-50 pointer-events-none animate-fade-in-scale"
          style={{
            ...positionStyles[position],
            maxWidth,
            background: "var(--bg-card)",
            color: "var(--text-primary)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-sm)",
            padding: "6px 10px",
            fontSize: "0.75rem",
            lineHeight: 1.4,
            whiteSpace: "normal",
            boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
          }}
        >
          {content}
        </span>
      )}
    </span>
  );
}
