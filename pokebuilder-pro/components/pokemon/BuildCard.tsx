"use client";

import { useState } from "react";
import { X, Crown } from "lucide-react";
import type { TeamMember, Build } from "@/types/pokemon";
import { TypeBadge } from "@/components/ui/TypeBadge";
import { PokemonSprite } from "@/components/pokemon/PokemonSprite";
import { StatBar } from "@/components/ui/StatBar";
import { PokeballOutline } from "@/components/ui/PokeballBg";

interface BuildCardProps {
  pokemon: TeamMember;
  build: Build;
  aiRole?: string;
  isLeader?: boolean;
  onClose?: () => void;
}

const EV_STATS = [
  { key: "ev_hp",  label: "HP"  },
  { key: "ev_atk", label: "Atk" },
  { key: "ev_def", label: "Def" },
  { key: "ev_spa", label: "SpA" },
  { key: "ev_spd", label: "SpD" },
  { key: "ev_spe", label: "Spe" },
] as const;

type EvKey = typeof EV_STATS[number]["key"];

const MOVE_COLORS = [
  { bg: "rgba(239,68,68,0.12)",  border: "rgba(239,68,68,0.3)",  num: "#ef4444"  },
  { bg: "rgba(59,130,246,0.12)", border: "rgba(59,130,246,0.3)", num: "#3b82f6"  },
  { bg: "rgba(34,197,94,0.12)",  border: "rgba(34,197,94,0.3)",  num: "#22c55e"  },
  { bg: "rgba(168,85,247,0.12)", border: "rgba(168,85,247,0.3)", num: "#a855f7"  },
];

export function BuildCard({ pokemon, build, aiRole, isLeader, onClose }: BuildCardProps) {
  const [tab, setTab] = useState<"build" | "evs">("build");

  const totalEvs = EV_STATS.reduce((s, { key }) => s + (build[key as EvKey] ?? 0), 0);
  const tipos = pokemon.tipos ?? [pokemon.tipo1, pokemon.tipo2].filter(Boolean) as string[];

  return (
    <div className="glass-card animate-fade-in-scale" style={{ overflow: "hidden" }}>

      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="relative flex items-center gap-4 p-4"
        style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-surface)" }}>
        <div className="absolute top-2 right-2 pointer-events-none" aria-hidden="true">
          <PokeballOutline size={60} opacity={0.05} />
        </div>

        {/* Sprite */}
        <div className="relative flex-shrink-0">
          <div className="absolute inset-0 rounded-full opacity-15 blur-md"
            style={{ background: isLeader ? "#ef4444" : "var(--accent)" }} aria-hidden="true" />
          <PokemonSprite name={pokemon.nombre} spriteUrl={pokemon.sprite_url} size={72} animate />
          {isLeader && (
            <div className="absolute -top-1 -left-1 w-5 h-5 rounded-full flex items-center justify-center"
              style={{ background: "#ef4444", color: "#fff" }}>
              <Crown size={10} />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col gap-1.5 flex-1 min-w-0 relative z-[1]">
          <div className="flex items-center gap-2">
            {isLeader && (
              <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                style={{ background: "rgba(239,68,68,0.2)", color: "#ef4444" }}>
                Líder
              </span>
            )}
            <h3 className="font-bold capitalize" style={{ color: "var(--text-primary)", fontSize: "1.05rem" }}>
              {pokemon.nombre}
            </h3>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {tipos.map((t) => <TypeBadge key={t} type={t} size="md" />)}
          </div>
          {aiRole && (
            <span className="badge badge-accent" style={{ alignSelf: "flex-start", fontSize: "0.7rem" }}>
              {aiRole}
            </span>
          )}
        </div>

        {onClose && (
          <button className="btn-ghost relative z-[1]"
            style={{ padding: "6px", color: "var(--text-muted)", flexShrink: 0 }}
            onClick={onClose} aria-label="Cerrar">
            <X size={16} />
          </button>
        )}
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────── */}
      <div className="flex" style={{ borderBottom: "1px solid var(--border)" }}>
        {(["build", "evs"] as const).map((t) => (
          <button key={t} className="flex-1 relative transition-colors duration-200"
            style={{
              padding: "12px", background: "transparent", border: "none", cursor: "pointer",
              color: tab === t ? "var(--accent)" : "var(--text-muted)",
              fontWeight: tab === t ? 700 : 500, fontSize: "0.85rem",
            }}
            onClick={() => setTab(t)}>
            {t === "build" ? "Build" : "EVs / IVs"}
            {tab === t && (
              <span className="absolute bottom-0 left-4 right-4 h-[2px] rounded-full"
                style={{ background: "var(--accent)" }} />
            )}
          </button>
        ))}
      </div>

      {/* ── Contenido ────────────────────────────────────────────── */}
      <div className="p-4">
        {tab === "build" ? (
          <div className="flex flex-col gap-3">

            {/* Item + Habilidad en grid */}
            <div className="grid grid-cols-2 gap-2">
              <StatCard label="Objeto" value={build.item || "--"} accent icon="🎒" />
              <StatCard label="Habilidad" value={build.ability || "--"} icon="⚡" />
            </div>

            {/* Naturaleza + Tera */}
            <div className="grid grid-cols-2 gap-2">
              <StatCard label="Naturaleza" value={build.nature || "--"} icon="🌿" />
              {build.tera_type && (
                  <div className="flex flex-col gap-1 px-3 py-2 rounded-lg"
                    style={{ background: "var(--bg-input)", border: "1px solid var(--border)" }}>
                    <span className="text-xs uppercase tracking-wider font-medium"
                      style={{ color: "var(--text-muted)" }}>🔷 Tera Type</span>
                    <TypeBadge type={build.tera_type} size="sm" />
                  </div>
                )}
            </div>

            {/* EVs resumen */}
            {totalEvs > 0 && (
              <div className="px-3 py-2 rounded-lg text-xs"
                style={{ background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
                <span className="font-semibold" style={{ color: "var(--accent-light)" }}>EVs: </span>
                {EV_STATS
                  .filter(({ key }) => (build[key as EvKey] ?? 0) > 0)
                  .map(({ key, label }) => `${build[key as EvKey]} ${label}`)
                  .join(" / ") || "—"}
              </div>
            )}

            {/* Moveset */}
            {(build.moves ?? []).length > 0 && (
              <div className="flex flex-col gap-1.5">
                <span className="text-xs uppercase tracking-wider font-semibold"
                  style={{ color: "var(--text-muted)" }}>
                  Moveset
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {[0,1,2,3].map((i) => {
                    const move = build.moves?.[i] ?? null;
                    const color = MOVE_COLORS[i];
                    return (
                      <div key={i}
                        className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium"
                        style={{
                          background: move ? color.bg : "var(--bg-surface)",
                          border: `1px solid ${move ? color.border : "var(--border)"}`,
                          color: move ? "var(--text-primary)" : "var(--text-muted)",
                          minHeight: 38,
                        }}>
                        <span className="font-bold tabular-nums text-[0.65rem] flex-shrink-0"
                          style={{ color: move ? color.num : "var(--text-muted)" }}>
                          {i + 1}
                        </span>
                        <span className="truncate capitalize">{move || "--"}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Razonamiento del AI */}
            {(build as any).reasoning && (
              <div className="px-3 py-2.5 rounded-lg text-xs leading-relaxed"
                style={{ background: "rgba(var(--accent-rgb,139,92,246),0.08)", border: "1px solid rgba(var(--accent-rgb,139,92,246),0.2)", color: "var(--text-secondary)" }}>
                <span className="font-bold block mb-1" style={{ color: "var(--accent-light)" }}>
                  💬 Razonamiento IA
                </span>
                {(build as any).reasoning}
              </div>
            )}

          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            <div className="flex justify-between text-xs mb-1" style={{ color: "var(--text-muted)" }}>
              <span>Distribución de EVs</span>
              <span className="font-bold"
                style={{ color: totalEvs > 510 ? "var(--danger)" : "var(--accent)" }}>
                {totalEvs} / 510
              </span>
            </div>
            {EV_STATS.map(({ key, label }) => (
              <StatBar key={key} label={label} value={build[key as EvKey] ?? 0} max={252} animated />
            ))}
            {/* IVs */}
            {build.ivSpread && (
              <div className="mt-2 pt-2" style={{ borderTop: "1px solid var(--border)" }}>
                <div className="flex justify-between text-xs mb-1" style={{ color: "var(--text-muted)" }}>
                  <span>IVs personalizados</span>
                </div>
                <div className="px-3 py-2 rounded-lg text-xs font-medium"
                  style={{ background: "var(--bg-input)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}>
                  {build.ivSpread}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, accent = false, icon }: {
  label: string; value: React.ReactNode; accent?: boolean; icon?: string;
}) {
  return (
    <div className="flex flex-col gap-1 px-3 py-2 rounded-lg"
      style={{ background: "var(--bg-input)", border: "1px solid var(--border)" }}>
      <span className="text-xs uppercase tracking-wider font-medium flex items-center gap-1"
        style={{ color: "var(--text-muted)" }}>
        {icon && <span>{icon}</span>}
        {label}
      </span>
      <span className="text-sm font-semibold truncate"
        style={{ color: accent ? "var(--accent-light)" : "var(--text-primary)" }}>
        {value}
      </span>
    </div>
  );
}