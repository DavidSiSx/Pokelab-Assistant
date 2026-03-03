"use client";

import { useId } from "react";

/* ── Pokéball SVG minimalista ──────────────────────────────── */
function PokeballSVG({ size = 20, opacity = 0.18 }: { size?: number; opacity?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      style={{ opacity }}
    >
      {/* cuerpo */}
      <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.4" />
      {/* línea central */}
      <line x1="1" y1="10" x2="19" y2="10" stroke="currentColor" strokeWidth="1.4" />
      {/* botón central */}
      <circle cx="10" cy="10" r="2.8" stroke="currentColor" strokeWidth="1.4" fill="none" />
      {/* mitad superior rellena */}
      <path
        d="M10 1 A9 9 0 0 1 19 10 L13 10 A3 3 0 0 0 7 10 L1 10 A9 9 0 0 1 10 1Z"
        fill="currentColor"
        opacity="0.12"
      />
    </svg>
  );
}

/* ── Tapiz CSS puro — sin JS para las posiciones ─────────────
   Usamos un SVG embebido como data-URI en background-image
   para lograr un pattern tile repetido infinitamente.
   Cada tile es 36x36px con la pokéball centrada.
─────────────────────────────────────────────────────────────── */
export function PokeballPattern() {
  // SVG inline → data-URI para usar como bg tile
  const svgTile = encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
      <circle cx="18" cy="18" r="8" stroke="white" stroke-width="1.2" fill="none" opacity="0.13"/>
      <line x1="10" y1="18" x2="26" y2="18" stroke="white" stroke-width="1.2" opacity="0.13"/>
      <circle cx="18" cy="18" r="2.4" stroke="white" stroke-width="1.2" fill="none" opacity="0.13"/>
      <path d="M18 10 A8 8 0 0 1 26 18 L20.4 18 A2.4 2.4 0 0 0 15.6 18 L10 18 A8 8 0 0 1 18 10Z"
            fill="white" opacity="0.04"/>
    </svg>
  `);

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 0,
        backgroundImage: `url("data:image/svg+xml,${svgTile}")`,
        backgroundRepeat: "repeat",
        backgroundSize: "36px 36px",
        // Ligero offset para que no quede demasiado alineado
        backgroundPosition: "0 0",
      }}
    />
  );
}

/* ── Tapiz consistente — SVG como encodeURIComponent ────────
   Sin rgba(), sin caracteres especiales → tile perfecto.
─────────────────────────────────────────────────────────── */
/* ── Tapiz animado diagonal (solo builder) ──────────────────
   El tile es 48x48, animamos background-position de (0,0)
   a (48px, -48px) → movimiento diagonal arriba-derecha.
   Loop perfecto porque el tile se repite exactamente.
─────────────────────────────────────────────────────────── */
const POKEBALL_SVG = [
  '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48">',
  '<circle cx="24" cy="24" r="10" stroke="white" stroke-width="1.3" fill="none" stroke-opacity="0.13"/>',
  '<line x1="14" y1="24" x2="34" y2="24" stroke="white" stroke-width="1.3" stroke-opacity="0.13"/>',
  '<circle cx="24" cy="24" r="3" stroke="white" stroke-width="1.3" fill="black" fill-opacity="0.1" stroke-opacity="0.13"/>',
  '<path d="M24 14 A10 10 0 0 1 34 24 L27 24 A3 3 0 0 0 21 24 L14 24 A10 10 0 0 1 24 14Z" fill="white" fill-opacity="0.04"/>',
  '</svg>',
].join('');

const TILE_URL = `url("data:image/svg+xml,${encodeURIComponent(POKEBALL_SVG)}")`;

export function PokeballPatternDense() {
  return (
    <>
      <style>{`
        @keyframes pokeball-diagonal {
          0%   { background-position: 0 0; }
          100% { background-position: 48px -48px; }
        }
      `}</style>
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 0,
          backgroundImage: TILE_URL,
          backgroundRepeat: 'repeat',
          backgroundSize: '48px 48px',
          animation: 'pokeball-diagonal 6s linear infinite',
        }}
      />
    </>
  );
}

/* ── Pokeball decorativa (prop-driven) ────────────────────── */
export function Pokeball({
  size = 24,
  opacity = 0.6,
  className = "",
}: {
  size?: number;
  opacity?: number;
  className?: string;
}) {
  return (
    <span className={className} style={{ display: "inline-flex", color: "var(--accent)" }}>
      <PokeballSVG size={size} opacity={opacity} />
    </span>
  );
}

/* ── Mini pokeball (para badges/bullets) ─────────────────── */
export function PokeballMini({ size = 12 }: { size?: number }) {
  return <PokeballSVG size={size} opacity={0.7} />;
}

/* ── PokeballOutline — solo el contorno, sin relleno ─────── */
export function PokeballOutline({
  size = 24,
  className = "",
  style,
}: {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
      style={{ color: "var(--accent)", ...style }}
    >
      <circle cx="12" cy="12" r="10.5" stroke="currentColor" strokeWidth="1.5" />
      <line x1="1.5" y1="12" x2="22.5" y2="12" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" fill="none" />
    </svg>
  );
}