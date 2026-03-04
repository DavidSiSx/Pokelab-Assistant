"use client";

import { useState, useEffect } from "react";

interface PokemonSpriteProps {
  name: string;
  spriteUrl?: string | null;
  nationalDex?: number | null;
  size?: number;
  animate?: boolean;
  className?: string;
}

export function PokemonSprite({
  name,
  spriteUrl,
  nationalDex,
  size = 48,
  animate = false,
  className = "",
}: PokemonSpriteProps) {
  const fallbacks = buildFallbacks(name, spriteUrl, nationalDex);
  // FIX hydration: always start at 0, render placeholder on server
  const [idx, setIdx] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  function handleError() {
    setIdx((i) => Math.min(i + 1, fallbacks.length - 1));
  }

  const src = fallbacks[idx];

  // Render placeholder on SSR to avoid hydration mismatch from className changes
  if (!mounted || !src) {
    return <PokeballPlaceholder size={size} className={className} />;
  }

  return (
    <img
      src={src}
      alt={name ?? "Pokemon"}
      width={size}
      height={size}
      onError={handleError}
      draggable={false}
      className={`object-contain select-none ${className}`}
      style={{
        imageRendering: "pixelated",
        width: size,
        height: size,
        display: "block",
        animation: animate ? "float 3s ease-in-out infinite" : "none",
      }}
    />
  );
}

function nameToSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/--+/g, "-")
    .replace(/^-|-$/g, "");
}

function buildFallbacks(
  name: string,
  spriteUrl?: string | null,
  nationalDex?: number | null,
): string[] {
  const list: string[] = [];

  if (spriteUrl) list.push(spriteUrl);

  const validDex = nationalDex && nationalDex > 0 && nationalDex <= 1025;

  if (validDex) {
    list.push(
      `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${nationalDex}.png`
    );
  }

  const slug = name ? nameToSlug(name) : "";
  if (slug) {
    list.push(`https://img.pokemondb.net/sprites/home/normal/${slug}.png`);
  }

  if (validDex) {
    list.push(
      `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${nationalDex}.png`
    );
  }

  if (slug) {
    list.push(`https://img.pokemondb.net/sprites/black-white/anim/normal/${slug}.gif`);
  }

  return list.filter(Boolean);
}

export function PokeballPlaceholder({ size, className }: { size: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      className={className}
      aria-hidden="true"
      style={{ opacity: 0.22, display: "block", flexShrink: 0 }}
    >
      <circle cx="20" cy="20" r="19" stroke="currentColor" strokeWidth="2" fill="none" />
      <line x1="1" y1="20" x2="39" y2="20" stroke="currentColor" strokeWidth="2" />
      <circle cx="20" cy="20" r="5" stroke="currentColor" strokeWidth="2" fill="none" />
    </svg>
  );
}