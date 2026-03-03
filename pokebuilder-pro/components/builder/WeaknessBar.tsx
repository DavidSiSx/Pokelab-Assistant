"use client";

import { Grid3X3, AlertTriangle, Shield, Check } from "lucide-react";
import type { TeamWeaknessProfile } from "@/utils/type-chart";

interface WeaknessBarProps {
  profile: TeamWeaknessProfile;
  onOpenMatrix: () => void;
}

export function WeaknessBar({ profile, onOpenMatrix }: WeaknessBarProps) {
  const { criticalWeaknesses, strongResistances, immunities } = profile;
  const hasCritical = criticalWeaknesses.length > 0;

  return (
    <div
      className="glass-card flex items-center gap-4 px-4 py-3 flex-wrap animate-slide-up"
      style={{ background: "color-mix(in srgb, var(--bg-surface) 90%, transparent)" }}
    >
      {/* Weakness alerts */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {hasCritical ? (
          <>
            <AlertTriangle size={14} style={{ color: "var(--warning)", flexShrink: 0 }} />
            <span
              className="text-xs font-bold uppercase tracking-wider"
              style={{ color: "var(--warning)" }}
            >
              Alertas Criticas
            </span>
            <div className="flex gap-1.5 flex-wrap">
              {criticalWeaknesses.slice(0, 4).map((ts) => (
                <span
                  key={ts.type}
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{
                    background: "rgba(239,68,68,0.12)",
                    color: "var(--danger)",
                    border: "1px solid rgba(239,68,68,0.25)",
                  }}
                >
                  {ts.typeEs} +{ts.score}
                </span>
              ))}
            </div>
          </>
        ) : (
          <>
            <Check size={14} style={{ color: "var(--success)", flexShrink: 0 }} />
            <span
              className="text-xs font-bold uppercase tracking-wider"
              style={{ color: "var(--success)" }}
            >
              Cobertura Defensiva Solida
            </span>
          </>
        )}
      </div>

      {/* Resistances / Immunities */}
      {(strongResistances.length > 0 || immunities.length > 0) && (
        <div className="flex items-center gap-2 min-w-0">
          <Shield size={14} style={{ color: "var(--success)", flexShrink: 0 }} />
          <span
            className="text-xs font-semibold uppercase tracking-wider hidden sm:inline"
            style={{ color: "var(--success)" }}
          >
            Muros
          </span>
          <div className="flex gap-1.5 flex-wrap">
            {immunities.slice(0, 3).map((ts) => (
              <span
                key={ts.type}
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{
                  background: "rgba(59,130,246,0.12)",
                  color: "var(--info)",
                  border: "1px solid rgba(59,130,246,0.25)",
                }}
              >
                {ts.typeEs}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Open Matrix button */}
      <button
        className="btn-primary text-xs flex items-center gap-1.5 flex-shrink-0"
        onClick={onOpenMatrix}
        style={{ padding: "8px 14px" }}
      >
        <Grid3X3 size={14} />
        <span className="hidden sm:inline">Abrir Matriz</span>
        <span className="sm:hidden">Matriz</span>
      </button>
    </div>
  );
}
