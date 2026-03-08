/**
 * ARCHIVO: components/pokemon/TeamSlot.tsx
 *
 * Fixes:
 * ① Añadido onBlacklist?: (name: string) => void en TeamSlotProps
 * ② Botón de blacklist dentro del slot (hover)
 */
"use client";

import { useState } from "react";
import { Lock, Unlock, X, Crown, Ban } from "lucide-react";
import type { TeamMember, Build } from "@/types/pokemon";
import { TypeBadge } from "@/components/ui/TypeBadge";
import { PokemonSprite } from "@/components/pokemon/PokemonSprite";
import { PokeballOutline } from "@/components/ui/PokeballBg";

export interface TeamSlotProps {
  index:        number;
  pokemon:      TeamMember | null;
  build?:       Build;
  locked?:      boolean;
  selected?:    boolean;
  isLeader?:    boolean;
  // ✅ Fix: onLock recibe (index, locked) no solo (locked)
  onLock?:      (index: number, locked: boolean) => void;
  onSelect?:    (index: number) => void;
  onRemove?:    (index: number) => void;
  // ✅ Fix: añadido onBlacklist
  onBlacklist?: (name: string) => void;
  loading?:     boolean;
  compact?:     boolean;
}

function BuildSummary({ build }: { build: Build }) {
  const hasData = build.item || build.ability || build.nature;
  if (!hasData) return null;
  return (
    <div className="flex flex-col gap-0.5 mt-1.5">
      {build.item && (
        <span style={{ color: "var(--accent-light)", fontSize: "0.65rem" }}>
          🎒 {build.item}
        </span>
      )}
      {build.ability && (
        <span style={{ color: "var(--text-muted)", fontSize: "0.65rem" }}>
          ⚡ {build.ability}
        </span>
      )}
      {build.nature && (
        <span style={{ color: "var(--text-muted)", fontSize: "0.65rem" }}>
          {build.nature} Nature
        </span>
      )}
    </div>
  );
}

export function TeamSlot({
  index, pokemon, build, locked = false, selected = false,
  isLeader, onLock, onSelect, onRemove, onBlacklist, loading = false, compact = false,
}: TeamSlotProps) {
  const [hovered, setHovered] = useState(false);
  const isEmpty = !pokemon;

  const accentColor = isLeader ? "#ef4444" : "var(--accent)";
  const accentGlow  = isLeader ? "rgba(239,68,68,0.15)" : "var(--accent-glow)";

  if (loading && isEmpty) {
    return (
      <div
        className={`skeleton ${compact ? "p-2" : "p-3"}`}
        style={{ borderRadius: "var(--radius-lg)", minHeight: compact ? 72 : 100 }}
      />
    );
  }

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
        borderColor: selected ? accentColor : locked ? "var(--warning)" : undefined,
        boxShadow:   selected ? `0 0 0 1px ${accentGlow}, 0 4px 20px ${accentGlow}` : undefined,
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
      <span className="absolute top-2 left-2 text-xs font-bold tabular-nums z-10"
        style={{ color: "var(--text-muted)" }}>
        {index + 1}
      </span>

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center gap-2 py-3">
          <PokeballOutline size={compact ? 24 : 32} style={{ opacity: 0.2 }} />
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>Vacío</span>
        </div>
      ) : (
        <>
          {/* Leader crown */}
          {isLeader && (
            <span className="absolute top-2 right-2 z-10">
              <Crown size={12} style={{ color: "#ef4444" }} />
            </span>
          )}

          {/* Pokémon info */}
          <div className="flex items-center gap-2 mt-2">
            <PokemonSprite
              name={pokemon!.nombre}
              spriteUrl={pokemon!.sprite_url}
              size={compact ? 36 : 48}
            />
            <div className="flex flex-col gap-0.5 min-w-0 flex-1">
              <span className="font-semibold truncate capitalize text-sm"
                style={{ color: "var(--text-primary)" }}>
                {pokemon!.nombre}
              </span>
              <div className="flex gap-1 flex-wrap">
                {pokemon!.tipo1 && <TypeBadge type={pokemon!.tipo1} size="sm" />}
                {pokemon!.tipo2 && <TypeBadge type={pokemon!.tipo2} size="sm" />}
              </div>
              {build && !compact && <BuildSummary build={build} />}
            </div>
          </div>

          {/* Action buttons — visible on hover */}
          {hovered && (
            <div className="absolute top-1.5 right-1.5 flex gap-1 z-20">
              {/* Lock/Unlock */}
              {onLock && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // ✅ Fix: pasa (index, !locked) correctamente
                    onLock(index, !locked);
                  }}
                  className="w-6 h-6 rounded-md flex items-center justify-center transition-colors"
                  style={{
                    background: locked ? "rgba(234,179,8,0.15)" : "var(--bg-input)",
                    border: `1px solid ${locked ? "var(--warning)" : "var(--border)"}`,
                  }}
                  title={locked ? "Desbloquear" : "Bloquear"}
                  aria-label={locked ? "Desbloquear slot" : "Bloquear slot"}
                >
                  {locked
                    ? <Lock   size={11} style={{ color: "var(--warning)" }} />
                    : <Unlock size={11} style={{ color: "var(--text-muted)" }} />
                  }
                </button>
              )}

              {/* Blacklist */}
              {onBlacklist && pokemon && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onBlacklist(pokemon.nombre);
                  }}
                  className="w-6 h-6 rounded-md flex items-center justify-center transition-colors"
                  style={{
                    background: "rgba(239,68,68,0.1)",
                    border: "1px solid rgba(239,68,68,0.3)",
                  }}
                  title={`Banear ${pokemon.nombre}`}
                  aria-label={`Banear ${pokemon.nombre}`}
                >
                  <Ban size={11} style={{ color: "var(--danger)" }} />
                </button>
              )}

              {/* Remove */}
              {onRemove && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(index);
                  }}
                  className="w-6 h-6 rounded-md flex items-center justify-center transition-colors"
                  style={{
                    background: "rgba(239,68,68,0.08)",
                    border: "1px solid rgba(239,68,68,0.2)",
                  }}
                  title="Quitar del equipo"
                  aria-label="Quitar del equipo"
                >
                  <X size={11} style={{ color: "var(--danger)" }} />
                </button>
              )}
            </div>
          )}

          {/* Locked indicator */}
          {locked && !hovered && (
            <div className="absolute top-1.5 right-1.5 z-20">
              <Lock size={11} style={{ color: "var(--warning)" }} />
            </div>
          )}
        </>
      )}
    </div>
  );
}