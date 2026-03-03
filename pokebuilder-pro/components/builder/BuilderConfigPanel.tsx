"use client";

import { useState } from "react";
import { ChevronDown, Settings } from "lucide-react";
import type { BuilderConfig } from "@/types/config";
import { PokeballMini } from "@/components/ui/PokeballBg";

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

interface BuilderConfigPanelProps {
  config: BuilderConfig;
  onChange: (c: Partial<BuilderConfig>) => void;
}

export function BuilderConfigPanel({ config, onChange }: BuilderConfigPanelProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="glass-card" style={{ overflow: "hidden" }}>
      <button
        className="w-full flex items-center justify-between p-4 transition-colors duration-200"
        style={{
          background: "transparent",
          border: "none",
          cursor: "pointer",
          color: "var(--text-primary)",
          fontWeight: 600,
        }}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className="flex items-center gap-2.5 text-sm">
          <Settings size={15} style={{ color: "var(--accent)" }} />
          Configuracion del Equipo
        </span>
        <ChevronDown
          size={14}
          style={{
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform 0.25s ease",
            color: "var(--text-muted)",
          }}
        />
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

          {/* Mechanics */}
          <div className="flex flex-col gap-2">
            <span className="text-xs uppercase tracking-wider font-semibold" style={{ color: "var(--text-muted)" }}>
              Mecanicas
            </span>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  { key: "enableTera", label: "Terastal" },
                  { key: "enableDynamax", label: "Dynamax" },
                  { key: "enableGmax", label: "Gigantamax" },
                  { key: "enableZMoves", label: "Z-Moves" },
                  { key: "enableMega", label: "Mega" },
                ] as const
              ).map(({ key, label }) => {
                const enabled = config[key] ?? false;
                return (
                  <button
                    key={key}
                    className="text-xs py-2.5 px-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-1.5"
                    style={{
                      background: enabled ? "var(--accent-glow)" : "var(--bg-input)",
                      color: enabled ? "var(--accent-light)" : "var(--text-muted)",
                      border: `1px solid ${enabled ? "var(--accent)" : "var(--border)"}`,
                      cursor: "pointer",
                    }}
                    onClick={() => onChange({ [key]: !enabled })}
                  >
                    {enabled && <PokeballMini size={11} />}
                    {label}
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
