"use client";

import { useState } from "react";

interface PokemonSpriteProps {
  name: string;
  spriteUrl?: string | null;
  nationalDex?: number | null;
  size?: number;
  animate?: boolean;
  className?: string;
}

/**
 * Sprite resolution order:
 *  1. spriteUrl from DB
 *  2. PokeAPI official sprite by nationalDex number
 *  3. PokeAPI sprite by slug (name normalized)
 *  4. Generic Pokéball placeholder SVG
 */
export function PokemonSprite({
  name,
  spriteUrl,
  nationalDex,
  size = 48,
  animate = false,
  className = "",
}: PokemonSpriteProps) {
  // Build the fallback chain once
  const fallbacks = buildFallbacks(name, spriteUrl, nationalDex);
  const [idx, setIdx] = useState(0);

  const src = fallbacks[idx];

  function handleError() {
    if (idx + 1 < fallbacks.length) {
      setIdx((i) => i + 1);
    }
  }

  if (!src) {
    return <PokeballPlaceholder size={size} className={className} />;
  }

  return (
    <img
      src={src}
      alt={name}
      width={size}
      height={size}
      onError={handleError}
      draggable={false}
      className={`object-contain select-none ${animate ? "animate-float" : ""} ${className}`}
      style={{ imageRendering: "pixelated", width: size, height: size }}
    />
  );
}

function buildFallbacks(
  name: string,
  spriteUrl?: string | null,
  nationalDex?: number | null,
): string[] {
  const list: string[] = [];

  // 1. DB sprite
  if (spriteUrl) list.push(spriteUrl);

  // 2. PokeAPI by dex number (official front default)
  if (nationalDex && nationalDex > 0) {
    list.push(
      `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${nationalDex}.png`
    );
    // also shiny as second option
    list.push(
      `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${nationalDex}.png`
    );
  }

  // 3. PokeAPI by slug
  if (name) {
    const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    list.push(`https://pokeapi.co/api/v2/pokemon/${slug}/`); // won't work as img, skip
    // Use sprites CDN directly
    list.push(
      `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${nationalDex ?? 0}.png`
    );
  }

  return list.filter(Boolean).filter((u) => !u.includes("/api/v2/"));
}

function PokeballPlaceholder({ size, className }: { size: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      className={className}
      aria-hidden="true"
      style={{ opacity: 0.25 }}
    >
      <circle cx="20" cy="20" r="19" stroke="currentColor" strokeWidth="2" fill="none" />
      <line x1="1" y1="20" x2="39" y2="20" stroke="currentColor" strokeWidth="2" />
      <circle cx="20" cy="20" r="5" stroke="currentColor" strokeWidth="2" fill="none" />
    </svg>
  );
}