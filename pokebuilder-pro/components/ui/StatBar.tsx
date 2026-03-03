"use client";

interface StatBarProps {
  label: string;
  value: number;
  max?: number;
  color?: string;
  showValue?: boolean;
  animated?: boolean;
}

function getStatColor(value: number, max: number): string {
  const ratio = value / max;
  if (ratio >= 0.75) return "var(--success)";
  if (ratio >= 0.5)  return "var(--warning)";
  if (ratio >= 0.3)  return "var(--accent)";
  return "var(--danger)";
}

export function StatBar({
  label,
  value,
  max = 100,
  color,
  showValue = true,
  animated = true,
}: StatBarProps) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const barColor = color ?? getStatColor(value, max);

  return (
    <div className="flex flex-col gap-1 w-full">
      <div className="flex justify-between items-center">
        <span
          className="text-xs font-medium uppercase tracking-wider"
          style={{ color: "var(--text-secondary)" }}
        >
          {label}
        </span>
        {showValue && (
          <span className="text-xs font-bold tabular-nums" style={{ color: barColor }}>
            {value}
          </span>
        )}
      </div>

      <div
        className="w-full h-1.5 rounded-full overflow-hidden"
        style={{ background: "var(--border)" }}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            background: barColor,
            transition: animated ? "width 0.6s cubic-bezier(0.4,0,0.2,1)" : "none",
            boxShadow: `0 0 6px ${barColor}66`,
          }}
        />
      </div>
    </div>
  );
}
