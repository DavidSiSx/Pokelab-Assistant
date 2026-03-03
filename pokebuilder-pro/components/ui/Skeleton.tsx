"use client";

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: "sm" | "md" | "lg" | "full";
}

const ROUNDED_MAP = {
  sm:   "var(--radius-sm)",
  md:   "var(--radius-md)",
  lg:   "var(--radius-lg)",
  full: "9999px",
};

export function Skeleton({ className = "", width, height, rounded = "md" }: SkeletonProps) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{
        width:  width  ?? "100%",
        height: height ?? "1rem",
        borderRadius: ROUNDED_MAP[rounded],
      }}
      aria-hidden="true"
    />
  );
}

// ── Preset skeletons ──────────────────────────────────────────────────────
export function PokemonCardSkeleton() {
  return (
    <div
      className="card p-4 flex flex-col items-center gap-3"
      style={{ minHeight: 180 }}
    >
      <Skeleton width={80} height={80} rounded="full" />
      <Skeleton width="60%" height={14} />
      <div className="flex gap-2 w-full justify-center">
        <Skeleton width={56} height={20} rounded="full" />
        <Skeleton width={56} height={20} rounded="full" />
      </div>
      <Skeleton width="80%" height={12} />
      <Skeleton width="70%" height={12} />
    </div>
  );
}

export function TeamSlotSkeleton() {
  return (
    <div className="card p-3 flex flex-col items-center gap-2" style={{ minHeight: 140 }}>
      <Skeleton width={64} height={64} rounded="full" />
      <Skeleton width="70%" height={12} />
      <div className="flex gap-1">
        <Skeleton width={44} height={16} rounded="full" />
      </div>
    </div>
  );
}
