"use client";

/**
 * Pokeball SVG component with multiple variants for decorative use.
 * Uses currentColor + accent CSS vars to integrate with any theme.
 */

interface PokeballProps {
  className?: string;
  size?: number;
  /** Opacity for the SVG (0-1) */
  opacity?: number;
}

/** Classic closed Pokeball SVG */
export function Pokeball({ className = "", size = 40, opacity = 1 }: PokeballProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ opacity }}
      aria-hidden="true"
    >
      {/* Top half */}
      <path
        d="M50 5C25.147 5 5 25.147 5 50h90C95 25.147 74.853 5 50 5z"
        fill="var(--accent)"
      />
      {/* Bottom half */}
      <path
        d="M50 95c24.853 0 45-20.147 45-45H5c0 24.853 20.147 45 45 45z"
        fill="var(--bg-surface)"
      />
      {/* Center band */}
      <rect x="5" y="46" width="90" height="8" fill="var(--border)" />
      {/* Center circle outer */}
      <circle cx="50" cy="50" r="14" fill="var(--border)" />
      {/* Center circle inner */}
      <circle cx="50" cy="50" r="9" fill="var(--bg-card)" />
      {/* Center highlight */}
      <circle cx="50" cy="50" r="5" fill="var(--accent-light)" opacity="0.6" />
      {/* Outer ring */}
      <circle cx="50" cy="50" r="46" stroke="var(--border)" strokeWidth="2" fill="none" />
    </svg>
  );
}

/** Pokeball outline - lighter, used for patterns and watermarks */
export function PokeballOutline({ className = "", size = 40, opacity = 0.06 }: PokeballProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ opacity }}
      aria-hidden="true"
    >
      <circle cx="50" cy="50" r="46" stroke="currentColor" strokeWidth="2" />
      <line x1="4" y1="50" x2="96" y2="50" stroke="currentColor" strokeWidth="2" />
      <circle cx="50" cy="50" r="12" stroke="currentColor" strokeWidth="2" />
      <circle cx="50" cy="50" r="6" fill="currentColor" opacity="0.3" />
    </svg>
  );
}

/** Floating pokeball background pattern */
export function PokeballPattern({ className = "" }: { className?: string }) {
  return (
    <div className={`pokeball-pattern-container ${className}`} aria-hidden="true">
      <PokeballOutline className="pokeball-float pokeball-float-1" size={80} opacity={0.04} />
      <PokeballOutline className="pokeball-float pokeball-float-2" size={120} opacity={0.03} />
      <PokeballOutline className="pokeball-float pokeball-float-3" size={60} opacity={0.05} />
      <PokeballOutline className="pokeball-float pokeball-float-4" size={100} opacity={0.03} />
      <PokeballOutline className="pokeball-float pokeball-float-5" size={50} opacity={0.04} />
    </div>
  );
}

/** Mini pokeball for inline decoration */
export function PokeballMini({ className = "", size = 16 }: PokeballProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <circle cx="50" cy="50" r="46" fill="var(--accent)" opacity="0.15" stroke="var(--accent)" strokeWidth="3" />
      <line x1="4" y1="50" x2="96" y2="50" stroke="var(--accent)" strokeWidth="3" />
      <circle cx="50" cy="50" r="12" fill="var(--bg-card)" stroke="var(--accent)" strokeWidth="3" />
      <circle cx="50" cy="50" r="5" fill="var(--accent)" />
    </svg>
  );
}
