"use client";

import { useState } from "react";
import type { TeamMember, Build } from "@/types/pokemon";
import { TypeBadge } from "@/components/ui/TypeBadge";
import { PokemonSprite } from "@/components/pokemon/PokemonSprite";
import { StatBar } from "@/components/ui/StatBar";

interface BuildCardProps {
  pokemon: TeamMember;
  build: Build;
  aiRole?: string;
  onClose?: () => void;
}

const EV_STATS = [
  { key: "ev_hp",  label: "HP" },
  { key: "ev_atk", label: "Atk" },
  { key: "ev_def", label: "Def" },
  { key: "ev_spa", label: "SpA" },
  { key: "ev_spd", label: "SpD" },
  { key: "ev_spe", label: "Spe" },
] as const;

type EvKey = typeof EV_STATS[number]["key"];

export function BuildCard({ pokemon, build, aiRole, onClose }: BuildCardProps) {
  const [tab, setTab] = useState<"build" | "evs">("build");

  const totalEvs = EV_STATS.reduce((s, { key }) => s + (build[key as EvKey] ?? 0), 0);

  return (
    <div className="card animate-fade-in-scale" style={{ overflow: "hidden" }}>
      {/* Header */}
      <div
        className="flex items-center gap-4 p-4"
        style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-surface)" }}
      >
        <PokemonSprite
          name={pokemon.nombre}
          spriteUrl={pokemon.sprite_url}
          size={72}
          animate
        />
        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
          <h3
            className="font-bold capitalize text-balance"
            style={{ color: "var(--text-primary)", fontSize: "1.1rem" }}
          >
            {pokemon.nombre}
          </h3>
          <div className="flex gap-1.5 flex-wrap">
            {pokemon.tipo1 && <TypeBadge type={pokemon.tipo1} size="md" />}
            {pokemon.tipo2 && <TypeBadge type={pokemon.tipo2} size="md" />}
            {pokemon.tipos?.filter(t => t !== pokemon.tipo1 && t !== pokemon.tipo2).map((t) => (
              <TypeBadge key={t} type={t} size="md" />
            ))}
          </div>
          {aiRole && (
            <span
              className="badge badge-accent"
              style={{ alignSelf: "flex-start" }}
            >
              {aiRole}
            </span>
          )}
        </div>
        {onClose && (
          <button
            className="btn-ghost"
            style={{ padding: "6px", color: "var(--text-muted)", flexShrink: 0 }}
            onClick={onClose}
            aria-label="Cerrar"
          >
            ✕
          </button>
        )}
      </div>

      {/* Tabs */}
      <div
        className="flex"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        {(["build", "evs"] as const).map((t) => (
          <button
            key={t}
            className="btn-ghost flex-1"
            style={{
              borderRadius: 0,
              borderBottom: tab === t ? `2px solid var(--accent)` : "2px solid transparent",
              color: tab === t ? "var(--accent)" : "var(--text-muted)",
              fontWeight: tab === t ? 700 : 400,
              paddingBlock: "10px",
            }}
            onClick={() => setTab(t)}
          >
            {t === "build" ? "Build" : "EVs"}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4">
        {tab === "build" ? (
          <div className="flex flex-col gap-3">
            {/* Item */}
            <Row label="Item" value={build.item || "—"} accent />
            <Row label="Habilidad" value={build.ability || "—"} />
            <Row label="Naturaleza" value={build.nature || "—"} />
            {build.tera_type && (
              <Row
                label="Tera Type"
                value={<TypeBadge type={build.tera_type} size="sm" />}
              />
            )}

            {/* Moveset */}
            {build.moves && build.moves.length > 0 && (
              <div className="flex flex-col gap-1.5 mt-1">
                <span
                  className="text-xs uppercase tracking-wider font-semibold"
                  style={{ color: "var(--text-muted)" }}
                >
                  Moveset
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {build.moves.map((move, i) => (
                    <div
                      key={i}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-medium capitalize"
                      style={{
                        background: "var(--bg-input)",
                        color: move ? "var(--text-primary)" : "var(--text-muted)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      {move || "—"}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            <div
              className="flex justify-between text-xs mb-1"
              style={{ color: "var(--text-muted)" }}
            >
              <span>Distribución EVs</span>
              <span
                style={{ color: totalEvs > 510 ? "var(--danger)" : "var(--text-secondary)" }}
              >
                {totalEvs} / 510
              </span>
            </div>
            {EV_STATS.map(({ key, label }) => (
              <StatBar
                key={key}
                label={label}
                value={build[key as EvKey] ?? 0}
                max={252}
                animated
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span
        className="text-xs uppercase tracking-wider font-medium"
        style={{ color: "var(--text-muted)", flexShrink: 0 }}
      >
        {label}
      </span>
      <span
        className="text-sm font-semibold text-right truncate"
        style={{ color: accent ? "var(--accent-light)" : "var(--text-primary)" }}
      >
        {value}
      </span>
    </div>
  );
}
