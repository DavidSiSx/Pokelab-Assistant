"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronDown, ChevronUp, Lock, Unlock, X, Shield, Zap, Sword } from "lucide-react";
import { TypeBadge } from "@/components/ui/TypeBadge";
import { Tooltip } from "@/components/ui/Tooltip";
import type { TeamMember, Build } from "@/types/pokemon";

interface PokemonCardProps {
  pokemon: TeamMember;
  build?: Build;
  locked?: boolean;
  onLock?: (locked: boolean) => void;
  onRemove?: () => void;
  selected?: boolean;
  onClick?: () => void;
  compact?: boolean;
  showBuild?: boolean;
  className?: string;
}

export function PokemonCard({
  pokemon,
  build,
  locked = false,
  onLock,
  onRemove,
  selected = false,
  onClick,
  compact = false,
  showBuild = false,
  className = "",
}: PokemonCardProps) {
  const [expanded, setExpanded] = useState(false);

  const spriteUrl =
    pokemon.sprite_url ??
    `https://img.pokemondb.net/sprites/home/normal/${pokemon.nombre.toLowerCase().replace(/[^a-z0-9]/g, "-")}.png`;

  const tipos = pokemon.tipos ?? [pokemon.tipo1, pokemon.tipo2].filter(Boolean) as string[];

  return (
    <article
      className={`
        card card-hover relative flex flex-col items-center gap-2 cursor-pointer
        transition-all duration-200 animate-fade-in
        ${compact ? "p-3" : "p-4"}
        ${selected ? "border-[var(--accent)] shadow-[0_0_0_2px_var(--accent-glow)]" : ""}
        ${className}
      `}
      onClick={onClick}
      role={onClick ? "button" : "article"}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => e.key === "Enter" && onClick?.()}
      aria-label={`${pokemon.nombre} — ${tipos.join("/")} type`}
      aria-pressed={selected}
    >
      {/* Top action bar */}
      <div className="absolute top-2 right-2 flex gap-1 z-10">
        {onLock && (
          <Tooltip content={locked ? "Desbloquear slot" : "Bloquear en equipo"}>
            <button
              onClick={(e) => { e.stopPropagation(); onLock(!locked); }}
              className="btn-ghost p-1 rounded-md"
              style={{ color: locked ? "var(--accent)" : "var(--text-muted)" }}
              aria-label={locked ? "Desbloquear" : "Bloquear"}
            >
              {locked ? <Lock size={13} /> : <Unlock size={13} />}
            </button>
          </Tooltip>
        )}
        {onRemove && (
          <Tooltip content="Quitar del equipo">
            <button
              onClick={(e) => { e.stopPropagation(); onRemove(); }}
              className="btn-ghost p-1 rounded-md"
              style={{ color: "var(--text-muted)" }}
              aria-label="Quitar"
            >
              <X size={13} />
            </button>
          </Tooltip>
        )}
      </div>

      {/* Sprite */}
      <div className="relative">
        <Image
          src={spriteUrl}
          alt={pokemon.nombre}
          width={compact ? 64 : 80}
          height={compact ? 64 : 80}
          className="object-contain drop-shadow-lg"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/pokeball-placeholder.png";
          }}
          unoptimized
        />
        {locked && (
          <div
            className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
            style={{ background: "var(--accent)", color: "#fff" }}
          >
            <Lock size={10} />
          </div>
        )}
      </div>

      {/* Name */}
      <h3
        className="font-bold text-center text-balance leading-tight"
        style={{
          fontSize: compact ? "0.8rem" : "0.95rem",
          color: "var(--text-primary)",
        }}
      >
        {pokemon.nombre}
      </h3>

      {/* Types */}
      <div className="flex flex-wrap gap-1 justify-center">
        {tipos.map((t) => (
          <TypeBadge key={t} type={t} size={compact ? "sm" : "md"} />
        ))}
      </div>

      {/* Role */}
      {pokemon.rol && !compact && (
        <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
          {pokemon.rol}
        </p>
      )}

      {/* Build preview (compact) */}
      {build && !compact && (
        <div
          className="w-full flex items-center justify-between mt-1 pt-2"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <div className="flex gap-2">
            {build.item && (
              <Tooltip content={`Item: ${build.item}`}>
                <span className="flex items-center gap-1 text-[0.65rem]" style={{ color: "var(--text-secondary)" }}>
                  <Shield size={10} />
                  <span className="max-w-[70px] truncate">{build.item}</span>
                </span>
              </Tooltip>
            )}
            {build.ability && (
              <Tooltip content={`Ability: ${build.ability}`}>
                <span className="flex items-center gap-1 text-[0.65rem]" style={{ color: "var(--text-secondary)" }}>
                  <Zap size={10} />
                  <span className="max-w-[70px] truncate">{build.ability}</span>
                </span>
              </Tooltip>
            )}
          </div>
          {showBuild && (
            <button
              onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}
              className="btn-ghost p-1"
              aria-label={expanded ? "Ocultar build" : "Ver build"}
            >
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          )}
        </div>
      )}

      {/* Expanded build */}
      {showBuild && expanded && build && (
        <div
          className="w-full rounded-lg p-3 mt-1 flex flex-col gap-2 animate-fade-in"
          style={{ background: "var(--bg-surface)" }}
        >
          {/* Moves */}
          {build.moves.length > 0 && (
            <div className="flex flex-col gap-1">
              <p className="text-[0.6rem] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                Movimientos
              </p>
              <div className="flex flex-wrap gap-1">
                {build.moves.map((mv) => (
                  <span
                    key={mv}
                    className="flex items-center gap-1 text-[0.65rem] px-2 py-0.5 rounded-full"
                    style={{ background: "var(--bg-card-hover)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}
                  >
                    <Sword size={8} />
                    {mv}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Nature + EVs row */}
          <div className="flex gap-4 flex-wrap">
            {build.nature && (
              <div>
                <p className="text-[0.6rem] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Nature</p>
                <p className="text-[0.7rem] font-semibold" style={{ color: "var(--text-primary)" }}>{build.nature}</p>
              </div>
            )}
            {build.tera_type && (
              <div>
                <p className="text-[0.6rem] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Tera</p>
                <TypeBadge type={build.tera_type} size="sm" />
              </div>
            )}
          </div>
        </div>
      )}
    </article>
  );
}
