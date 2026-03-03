"use client";

import { useState, useCallback } from "react";
import { PokeballOutline } from "@/components/ui/PokeballBg";

interface PokemonSpriteProps {
  name: string;
  spriteUrl?: string | null;
  nationalDex?: number | null;
  size?: number;
  className?: string;
  animate?: boolean;
}

/* ── Name normalization for regional forms / megas ─── */
const REGIONAL_MAP: Record<string, string> = {
  alola: "-alola",
  alolan: "-alola",
  galar: "-galar",
  galarian: "-galar",
  hisui: "-hisui",
  hisuian: "-hisui",
  paldea: "-paldea",
  paldean: "-paldea",
};

function normalizeName(name: string): string {
  let n = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim();

  // Handle "Ninetales-Alola" / "Ninetales Alola" patterns
  for (const [suffix, replacement] of Object.entries(REGIONAL_MAP)) {
    const regex = new RegExp(`[\\s-]${suffix}$`, "i");
    if (regex.test(n)) {
      n = n.replace(regex, replacement);
      break;
    }
  }

  // Handle "Mega X" / "Mega Y" patterns
  if (/^mega[\s-]/i.test(n)) {
    n = n.replace(/^mega[\s-]/i, "");
    if (/[\s-][xy]$/i.test(n)) {
      const variant = n.slice(-1).toLowerCase();
      n = n.slice(0, -2).trim() + `-mega-${variant}`;
    } else {
      n = n + "-mega";
    }
  }

  return n.replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

function buildFallbackChain(
  name: string,
  spriteUrl?: string | null,
  nationalDex?: number | null
): string[] {
  const urls: string[] = [];
  const normalized = normalizeName(name);

  // Tier 1: DB sprite_url
  if (spriteUrl) urls.push(spriteUrl);

  // Tier 2: PokeAPI official artwork (by national dex ID)
  if (nationalDex) {
    urls.push(
      `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${nationalDex}.png`
    );
  }

  // Tier 3: PokemonDB home sprite by normalized name
  urls.push(`https://img.pokemondb.net/sprites/home/normal/${normalized}.png`);

  // Tier 4: PokeAPI sprite by name (for regional forms)
  urls.push(
    `https://img.pokemondb.net/sprites/home/normal/${normalized.replace(/-/g, "")}.png`
  );

  return urls;
}

export function PokemonSprite({
  name,
  spriteUrl,
  nationalDex,
  size = 80,
  className = "",
  animate = false,
}: PokemonSpriteProps) {
  const fallbacks = buildFallbackChain(name, spriteUrl, nationalDex);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [allFailed, setAllFailed] = useState(false);

  const handleError = useCallback(() => {
    const nextIdx = currentIdx + 1;
    if (nextIdx < fallbacks.length) {
      setCurrentIdx(nextIdx);
      setLoaded(false);
    } else {
      setAllFailed(true);
    }
  }, [currentIdx, fallbacks.length]);

  if (!name || allFailed) {
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          background: "var(--bg-card-hover)",
        }}
      >
        <PokeballOutline size={size * 0.55} opacity={0.2} />
      </div>
    );
  }

  const src = fallbacks[currentIdx] || "";

  return (
    <div
      className={`relative ${animate ? "animate-float" : ""} ${className}`}
      style={{ width: size, height: size, flexShrink: 0 }}
    >
      {!loaded && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ width: size, height: size }}
        >
          <div className="skeleton absolute inset-0 rounded-full" />
          <PokeballOutline
            size={size * 0.4}
            opacity={0.1}
            className="relative animate-spin-slow"
          />
        </div>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={name}
        width={size}
        height={size}
        crossOrigin="anonymous"
        onLoad={() => setLoaded(true)}
        onError={handleError}
        style={{
          opacity: loaded ? 1 : 0,
          transition: "opacity 0.25s ease",
          width: size,
          height: size,
          objectFit: "contain",
        }}
      />
    </div>
  );
}
