"use client";

import { useState } from "react";
import type { TeamMember, Build } from "@/types/pokemon";
import { TypeBadge } from "@/components/ui/TypeBadge";
import { PokemonSprite } from "@/components/pokemon/PokemonSprite";

interface TeamSlotProps {
  index: number;
  pokemon: TeamMember | null;
  build?: Build;
  locked?: boolean;
  selected?: boolean;
  onLock?: (index: number, locked: boolean) => void;
  onSelect?: (index: number) => void;
  onRemove?: (index: number) => void;
  compact?: boolean;
}

function BuildSummary({ build }: { build: Build }) {
  return (
    <div className="flex flex-col gap-0.5 mt-1.5">
      {build.item && (
        <span style={{ color: "var(--text-muted)", fontSize: "0.65rem" }}>
          @ {build.item}
        </span>
      )}
      {build.ability && (
        <span style={{ color: "var(--text-muted)", fontSize: "0.65rem" }}>
          {build.ability}
        </span>
      )}
      {build.nature && (
        <span style={{ color: "var(--accent-light)", fontSize: "0.65rem" }}>
          {build.nature} Nature
        </span>
      )}
    </div>
  );
}

export function TeamSlot({
  index,
  pokemon,
  build,
  locked = false,
  selected = false,
  onLock,
  onSelect,
  onRemove,
  compact = false,
}: TeamSlotProps) {
  const [hovered, setHovered] = useState(false);
  const isEmpty = !pokemon;

  return (
    <div
      className={`
        card glow-border relative cursor-pointer select-none
        transition-all duration-200
        ${selected ? "ring-2" : ""}
        ${isEmpty ? "opacity-60" : ""}
        ${compact ? "p-2" : "p-3"}
      `}
      style={{
        borderColor: selected ? "var(--accent)" : locked ? "var(--warning)" : undefined,
        boxShadow: selected ? `0 0 0 1px var(--accent-glow), 0 4px 20px var(--accent-glow)` : undefined,
      }}
      onClick={() => onSelect?.(index)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      role="button"
      tabIndex={0}
      aria-label={pokemon ? `Slot ${index + 1}: ${pokemon.nombre}` : `Slot ${index + 1} vacío`}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onSelect?.(index); }}
    >
      {/* Slot number */}
      <span
        className="absolute top-2 left-2 text-xs font-bold tabular-nums"
        style={{ color: "var(--text-muted)" }}
      >
        {index + 1}
      </span>

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center gap-1 py-3">
          <div
            className="w-10 h-10 rounded-full border-2 border-dashed flex items-center justify-center"
            style={{ borderColor: "var(--border)" }}
          >
            <span style={{ color: "var(--text-muted)", fontSize: "1.1rem" }}>+</span>
          </div>
          {!compact && (
            <span style={{ color: "var(--text-muted)", fontSize: "0.7rem" }}>
              Vacío
            </span>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-3 pt-1">
          <PokemonSprite
            name={pokemon.nombre}
            spriteUrl={pokemon.sprite_url}
            size={compact ? 48 : 56}
          />
          <div className="flex flex-col gap-1 min-w-0 flex-1">
            <span
              className="font-bold capitalize truncate"
              style={{
                color: "var(--text-primary)",
                fontSize: compact ? "0.8rem" : "0.875rem",
              }}
            >
              {pokemon.nombre}
            </span>
            <div className="flex gap-1 flex-wrap">
              {pokemon.tipo1 && <TypeBadge type={pokemon.tipo1} size="sm" />}
              {pokemon.tipo2 && <TypeBadge type={pokemon.tipo2} size="sm" />}
              {pokemon.tipos?.filter(t => t !== pokemon.tipo1 && t !== pokemon.tipo2).map((t) => (
                <TypeBadge key={t} type={t} size="sm" />
              ))}
            </div>
            {pokemon.rol && !compact && (
              <span
                className="text-xs truncate"
                style={{ color: "var(--text-muted)" }}
              >
                {pokemon.rol}
              </span>
            )}
            {build && !compact && <BuildSummary build={build} />}
          </div>

          {/* Actions on hover */}
          {hovered && (
            <div className="flex flex-col gap-1 ml-auto animate-fade-in-scale">
              {onLock && (
                <button
                  className="btn-ghost"
                  style={{
                    padding: "4px 6px",
                    fontSize: "0.75rem",
                    color: locked ? "var(--warning)" : "var(--text-muted)",
                  }}
                  onClick={(e) => { e.stopPropagation(); onLock(index, !locked); }}
                  title={locked ? "Desbloquear" : "Bloquear"}
                  aria-label={locked ? "Desbloquear slot" : "Bloquear slot"}
                >
                  {locked ? "🔒" : "🔓"}
                </button>
              )}
              {onRemove && (
                <button
                  className="btn-ghost"
                  style={{ padding: "4px 6px", fontSize: "0.75rem", color: "var(--danger)" }}
                  onClick={(e) => { e.stopPropagation(); onRemove(index); }}
                  title="Quitar"
                  aria-label="Quitar Pokemon del slot"
                >
                  ✕
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Locked indicator */}
      {locked && !isEmpty && (
        <div
          className="absolute top-1.5 right-1.5 text-xs"
          title="Slot bloqueado"
          style={{ color: "var(--warning)" }}
        >
          🔒
        </div>
      )}
    </div>
  );
}
