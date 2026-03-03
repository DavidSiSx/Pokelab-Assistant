"use client";

import { useState } from "react";
import { PokeballOutline } from "@/components/ui/PokeballBg";

interface PokemonSpriteProps {
  name: string;
  spriteUrl?: string | null;
  size?: number;
  className?: string;
  animate?: boolean;
}

function nameToSpriteUrl(name: string): string {
  const normalized = name
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return `https://img.pokemondb.net/sprites/home/normal/${normalized}.png`;
}

export function PokemonSprite({
  name,
  spriteUrl,
  size = 80,
  className = "",
  animate = false,
}: PokemonSpriteProps) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const src = failed || !spriteUrl ? nameToSpriteUrl(name) : spriteUrl;

  if (!name) {
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
        <PokeballOutline size={size * 0.55} opacity={0.15} />
      </div>
    );
  }

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
          <PokeballOutline size={size * 0.4} opacity={0.1} className="relative animate-spin-slow" />
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
        onError={() => {
          if (!failed) setFailed(true);
        }}
        style={{
          imageRendering: "pixelated",
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
