"use client";

import { useState } from "react";
import { Lock, Unlock, X } from "lucide-react";
import type { TeamMember, Build } from "@/types/pokemon";
import { TypeBadge } from "@/components/ui/TypeBadge";
import { PokemonSprite } from "@/components/pokemon/PokemonSprite";
import { PokeballOutline } from "@/components/ui/PokeballBg";

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
        glass-card relative cursor-pointer select-none
        transition-all duration-250 overflow-hidden
        ${selected ? "ring-2" : ""}
        ${isEmpty ? "opacity-60 hover:opacity-80" : ""}
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
      aria-label={pokemon ? `Slot ${index + 1}: ${pokemon.nombre}` : `Slot ${index + 1} vacio`}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onSelect?.(index); }}
    >
      {/* Slot number */}
      <span
        className="absolute top-2 left-2 text-xs font-bold tabular-nums z-10"
        style={{ color: "var(--text-muted)" }}
      >
        {index + 1}
      </span>

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center gap-2 py-3">
          {/* Pokeball SVG as empty placeholder */}
          <div className="relative">
            <PokeballOutline
              size={compact ? 36 : 44}
              opacity={0.15}
              className="animate-spin-slow"
            />
          </div>
          {!compact && (
            <span className="text-[0.7rem] font-medium" style={{ color: "var(--text-muted)" }}>
              Vacio
            </span>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-3 pt-1 relative z-[1]">
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
                  className="btn-ghost p-1.5 rounded-lg"
                  style={{
                    color: locked ? "var(--warning)" : "var(--text-muted)",
                  }}
                  onClick={(e) => { e.stopPropagation(); onLock(index, !locked); }}
                  title={locked ? "Desbloquear" : "Bloquear"}
                  aria-label={locked ? "Desbloquear slot" : "Bloquear slot"}
                >
                  {locked ? <Lock size={14} /> : <Unlock size={14} />}
                </button>
              )}
              {onRemove && (
                <button
                  className="btn-ghost p-1.5 rounded-lg"
                  style={{ color: "var(--danger)" }}
                  onClick={(e) => { e.stopPropagation(); onRemove(index); }}
                  title="Quitar"
                  aria-label="Quitar Pokemon del slot"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Decorative pokeball for filled slots */}
      {!isEmpty && (
        <div className="absolute -bottom-3 -right-3 pointer-events-none" aria-hidden="true">
          <PokeballOutline size={48} opacity={0.04} />
        </div>
      )}

      {/* Locked indicator */}
      {locked && !isEmpty && (
        <div
          className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center z-10"
          title="Slot bloqueado"
          style={{ background: "var(--warning)", color: "var(--bg-base)" }}
        >
          <Lock size={10} />
        </div>
      )}
    </div>
  );
}
