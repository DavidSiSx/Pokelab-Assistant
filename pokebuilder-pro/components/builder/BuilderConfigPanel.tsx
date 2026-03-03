"use client";

import { useState } from "react";
import type { BuilderConfig } from "@/types/config";

const FORMATS = [
  "VGC 2025 Regulation H",
  "VGC 2024 Regulation G",
  "National Dex",
  "OU Singles",
  "Doubles OU",
  "Little Cup",
  "Ubers",
  "Random Battle",
];

const TIERS = ["Ubers", "OU", "UU", "RU", "NU", "PU", "LC", "Any"];

interface BuilderConfigPanelProps {
  config: BuilderConfig;
  onChange: (c: Partial<BuilderConfig>) => void;
}

export function BuilderConfigPanel({ config, onChange }: BuilderConfigPanelProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="card" style={{ overflow: "hidden" }}>
      <button
        className="w-full flex items-center justify-between p-4 btn-ghost"
        style={{ borderRadius: 0, color: "var(--text-primary)", fontWeight: 600 }}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 text-sm">
          <span style={{ color: "var(--accent)" }}>⚙</span>
          Configuración del Equipo
        </span>
        <span
          style={{
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform 0.2s",
            color: "var(--text-muted)",
            fontSize: "0.75rem",
          }}
        >
          ▼
        </span>
      </button>

      {open && (
        <div
          className="flex flex-col gap-4 p-4 animate-slide-up"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          {/* Format */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs uppercase tracking-wider font-semibold" style={{ color: "var(--text-muted)" }}>
              Formato
            </label>
            <select
              className="input"
              value={config.format}
              onChange={(e) => onChange({ format: e.target.value })}
            >
              {FORMATS.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>

          {/* Tier */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs uppercase tracking-wider font-semibold" style={{ color: "var(--text-muted)" }}>
              Tier Preferido
            </label>
            <select
              className="input"
              value={config.tier ?? "Any"}
              onChange={(e) => onChange({ tier: e.target.value })}
            >
              {TIERS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Mechanics */}
          <div className="flex flex-col gap-2">
            <span className="text-xs uppercase tracking-wider font-semibold" style={{ color: "var(--text-muted)" }}>
              Mecánicas
            </span>
            <div className="grid grid-cols-2 gap-2">
              {(["terastallization", "dynamax", "gigantamax", "zmoves", "mega"] as const).map((mech) => {
                const labels: Record<string, string> = {
                  terastallization: "Terastal",
                  dynamax: "Dynamax",
                  gigantamax: "Gigantamax",
                  zmoves: "Z-Moves",
                  mega: "Mega",
                };
                const enabled = config.mechanics?.[mech] ?? false;
                return (
                  <button
                    key={mech}
                    className="text-xs py-2 px-3 rounded-lg font-medium transition-all duration-150"
                    style={{
                      background: enabled ? "var(--accent-glow)" : "var(--bg-input)",
                      color: enabled ? "var(--accent-light)" : "var(--text-muted)",
                      border: `1px solid ${enabled ? "var(--accent)" : "var(--border)"}`,
                    }}
                    onClick={() =>
                      onChange({
                        mechanics: { ...(config.mechanics ?? {}), [mech]: !enabled },
                      })
                    }
                  >
                    {labels[mech]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom strategy */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs uppercase tracking-wider font-semibold" style={{ color: "var(--text-muted)" }}>
              Contexto / Estrategia
            </label>
            <textarea
              className="input"
              placeholder="Ej: Quiero un equipo de lluvia con Kingdra, prioriza stall..."
              rows={3}
              style={{ resize: "vertical", fontFamily: "inherit" }}
              value={config.customStrategy ?? ""}
              onChange={(e) => onChange({ customStrategy: e.target.value })}
            />
          </div>
        </div>
      )}
    </div>
  );
}
