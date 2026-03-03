"use client";

import { X, Grid3X3 } from "lucide-react";
import type { TeamWeaknessProfile } from "@/utils/type-chart";
import { TYPE_COLORS, TYPE_NAMES_ES } from "@/utils/type-chart";

interface WeaknessMatrixProps {
  profile: TeamWeaknessProfile;
  onClose: () => void;
}

export function WeaknessMatrix({ profile, onClose }: WeaknessMatrixProps) {
  const sorted = [...profile.typeScores].sort((a, b) => b.score - a.score);

  return (
    <div className="overlay" onClick={onClose}>
      <div
        className="glass-card w-full max-w-5xl max-h-[90vh] overflow-y-auto animate-fade-in-scale"
        style={{ background: "var(--bg-surface)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-5 sticky top-0 z-10"
          style={{
            background: "var(--bg-surface)",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "var(--accent-glow)", border: "1px solid var(--accent)" }}
            >
              <Grid3X3 size={18} style={{ color: "var(--accent)" }} />
            </div>
            <div>
              <h2
                className="font-bold text-balance"
                style={{ color: "var(--text-primary)", fontSize: "1.1rem" }}
              >
                Matriz de Debilidades
              </h2>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Analisis tactico de tipos y resistencias
              </p>
            </div>
          </div>
          <button
            className="btn-ghost p-2 rounded-lg"
            onClick={onClose}
            aria-label="Cerrar"
            style={{ color: "var(--text-muted)" }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Grid */}
        <div className="p-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 stagger-children">
          {sorted.map((ts) => {
            const isWeak = ts.score > 0;
            const isResist = ts.score < 0;
            const borderColor = isWeak
              ? "var(--danger)"
              : isResist
              ? "var(--success)"
              : "var(--border)";
            const gradColor = isWeak
              ? "rgba(239,68,68,0.15)"
              : isResist
              ? "rgba(34,197,94,0.15)"
              : "transparent";

            return (
              <div
                key={ts.type}
                className="rounded-xl overflow-hidden animate-fade-in"
                style={{
                  background: "var(--bg-card)",
                  border: `1px solid ${borderColor}`,
                }}
              >
                {/* Top accent bar */}
                <div
                  style={{
                    height: 3,
                    background: isWeak
                      ? "var(--danger)"
                      : isResist
                      ? "var(--success)"
                      : "var(--border)",
                  }}
                />

                <div className="p-3 flex flex-col gap-2">
                  {/* Type header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ background: TYPE_COLORS[ts.type] || "var(--text-muted)" }}
                      />
                      <span
                        className="text-xs font-bold uppercase tracking-wider"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {ts.typeEs}
                      </span>
                    </div>
                    <span
                      className="text-sm font-bold tabular-nums"
                      style={{
                        color: isWeak
                          ? "var(--danger)"
                          : isResist
                          ? "var(--success)"
                          : "var(--text-muted)",
                      }}
                    >
                      {ts.score > 0 ? `+${ts.score}` : ts.score}
                    </span>
                  </div>

                  {/* Pokemon affected */}
                  <div className="flex flex-col gap-1">
                    {ts.weakPokemon.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className="text-xs font-bold px-1.5 py-0.5 rounded"
                          style={{
                            background: "rgba(239,68,68,0.15)",
                            color: "var(--danger)",
                            fontSize: "0.6rem",
                          }}
                        >
                          {"x2"}
                        </span>
                        <span
                          className="text-xs"
                          style={{ color: "var(--text-secondary)", fontSize: "0.65rem" }}
                        >
                          {ts.weakPokemon.join(", ")}
                        </span>
                      </div>
                    )}
                    {ts.resistPokemon.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className="text-xs font-bold px-1.5 py-0.5 rounded"
                          style={{
                            background: "rgba(34,197,94,0.15)",
                            color: "var(--success)",
                            fontSize: "0.6rem",
                          }}
                        >
                          {"x\u00BD"}
                        </span>
                        <span
                          className="text-xs"
                          style={{ color: "var(--text-secondary)", fontSize: "0.65rem" }}
                        >
                          {ts.resistPokemon.join(", ")}
                        </span>
                      </div>
                    )}
                    {ts.immunePokemon.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className="text-xs font-bold px-1.5 py-0.5 rounded"
                          style={{
                            background: "rgba(59,130,246,0.15)",
                            color: "var(--info)",
                            fontSize: "0.6rem",
                          }}
                        >
                          {"x0"}
                        </span>
                        <span
                          className="text-xs"
                          style={{ color: "var(--text-secondary)", fontSize: "0.65rem" }}
                        >
                          {ts.immunePokemon.join(", ")}
                        </span>
                      </div>
                    )}
                    {ts.weakPokemon.length === 0 &&
                      ts.resistPokemon.length === 0 &&
                      ts.immunePokemon.length === 0 && (
                        <span
                          className="text-xs"
                          style={{ color: "var(--text-muted)", fontSize: "0.6rem" }}
                        >
                          Neutral
                        </span>
                      )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
