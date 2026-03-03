"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { TeamMember, Build } from "@/types/pokemon";
import { TypeBadge } from "@/components/ui/TypeBadge";
import { PokemonSprite } from "@/components/pokemon/PokemonSprite";
import { StatBar } from "@/components/ui/StatBar";
import { PokeballOutline } from "@/components/ui/PokeballBg";

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
    <div className="glass-card animate-fade-in-scale" style={{ overflow: "hidden" }}>
      {/* Header */}
      <div
        className="relative flex items-center gap-4 p-4"
        style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-surface)" }}
      >
        {/* Decorative watermark */}
        <div className="absolute top-2 right-2 pointer-events-none" aria-hidden="true">
          <PokeballOutline size={60} opacity={0.05} />
        </div>

        <div className="relative">
          <div
            className="absolute inset-0 rounded-full opacity-15 blur-md"
            style={{ background: "var(--accent)" }}
            aria-hidden="true"
          />
          <PokemonSprite
            name={pokemon.nombre}
            spriteUrl={pokemon.sprite_url}
            size={72}
            animate
          />
        </div>
        <div className="flex flex-col gap-1.5 flex-1 min-w-0 relative z-[1]">
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
            className="btn-ghost relative z-[1]"
            style={{ padding: "6px", color: "var(--text-muted)", flexShrink: 0 }}
            onClick={onClose}
            aria-label="Cerrar"
          >
            <X size={16} />
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
            className="flex-1 relative transition-colors duration-200"
            style={{
              padding: "12px",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: tab === t ? "var(--accent)" : "var(--text-muted)",
              fontWeight: tab === t ? 700 : 500,
              fontSize: "0.85rem",
            }}
            onClick={() => setTab(t)}
          >
            {t === "build" ? "Build" : "EVs"}
            {tab === t && (
              <span
                className="absolute bottom-0 left-4 right-4 h-[2px] rounded-full"
                style={{ background: "var(--accent)" }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4">
        {tab === "build" ? (
          <div className="flex flex-col gap-3">
            {/* Item */}
            <Row label="Item" value={build.item || "--"} accent />
            <Row label="Habilidad" value={build.ability || "--"} />
            <Row label="Naturaleza" value={build.nature || "--"} />
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
                      className="px-3 py-2 rounded-lg text-xs font-medium capitalize transition-colors duration-200"
                      style={{
                        background: move ? "var(--bg-input)" : "var(--bg-surface)",
                        color: move ? "var(--text-primary)" : "var(--text-muted)",
                        border: `1px solid ${move ? "var(--border)" : "var(--bg-card-hover)"}`,
                      }}
                    >
                      {move || "--"}
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
              <span>Distribucion EVs</span>
              <span
                className="font-bold"
                style={{ color: totalEvs > 510 ? "var(--danger)" : "var(--accent)" }}
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
