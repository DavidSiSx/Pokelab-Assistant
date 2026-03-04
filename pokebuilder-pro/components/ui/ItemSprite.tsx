/**
 * components/ui/ItemSprite.tsx
 *
 * Muestra el sprite de un ítem usando las imágenes de PokeAPI.
 * URL: https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/{slug}.png
 *
 * Uso:
 *   <ItemSprite item="Choice Specs" size={20} />
 *   <ItemSprite item="Leftovers" size={16} />
 */
"use client";

import { useState } from "react";

interface ItemSpriteProps {
  item: string;
  size?: number;
  className?: string;
}

/** Convierte nombre de ítem a slug de PokeAPI */
function itemToSlug(item: string): string {
  return item
    .toLowerCase()
    .replace(/\s+/g, "-")       // espacios → guiones
    .replace(/[^a-z0-9-]/g, "") // quitar caracteres raros
    .replace(/-+/g, "-")        // guiones dobles → uno
    .replace(/^-|-$/g, "");     // trim guiones extremos
}

/** URL del sprite de PokeAPI */
export function getItemSpriteUrl(item: string): string {
  const slug = itemToSlug(item);
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${slug}.png`;
}

export function ItemSprite({ item, size = 20, className }: ItemSpriteProps) {
  const [failed, setFailed] = useState(false);

  if (!item || failed) {
    // fallback: emoji de mochila
    return (
      <span
        style={{ fontSize: size * 0.7, lineHeight: 1, display: "inline-block", flexShrink: 0 }}
        className={className}
        aria-label={item}
      >
        🎒
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={getItemSpriteUrl(item)}
      alt={item}
      width={size}
      height={size}
      className={className}
      style={{
        width: size,
        height: size,
        objectFit: "contain",
        imageRendering: "pixelated",
        flexShrink: 0,
      }}
      onError={() => setFailed(true)}
    />
  );
}