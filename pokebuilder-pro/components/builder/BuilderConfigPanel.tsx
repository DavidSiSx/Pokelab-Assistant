"use client";

import { useState } from "react";
import { ChevronDown, Settings, Filter, Zap, Shield, Shuffle } from "lucide-react";
import type { BuilderConfig } from "@/types/config";
import { PokeballMini } from "@/components/ui/PokeballBg";

const FORMATS = [
  "VGC 2025 Regulation H",
  "VGC 2024 Regulation G",
  "National Dex",
  "National Dex Doubles",
  "OU Singles",
  "Doubles OU",
  "Little Cup",
  "Ubers",
  "Random Battle",
];

const POKEMON_TYPES = [
  "Normal","Fire","Water","Grass","Electric","Ice","Fighting","Poison",
  "Ground","Flying","Psychic","Bug","Rock","Ghost","Dragon","Dark","Steel","Fairy",
];

const EXPERIENCE_LEVELS = [
  { value: "casual",     label: "Casual"    },
  { value: "competidor", label: "Competidor"},
  { value: "experto",    label: "Experto"   },
];

const META_PREFERENCES = [
  { value: "extrememeta", label: "Top Meta"  },
  { value: "meta",        label: "Meta"      },
  { value: "balanced",    label: "Balanceado"},
  { value: "varied",      label: "Variado"   },
  { value: "niche",       label: "Niche"     },
];

/* ── Collapsible Section ──────────────────────────────────────── */
function Section({
  title, icon, children, defaultOpen = false,
}: {
  title: string; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderRadius: 8, overflow: "hidden", border: "1px solid var(--border)" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-3 py-2.5"
        style={{
          background: "var(--bg-input)",
          border: "none",
          cursor: "pointer",
          color: "var(--text-primary)",
          userSelect: "none",
        }}
      >
        <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider"
          style={{ color: "var(--text-muted)" }}>
          {icon}{title}
        </span>
        <ChevronDown
          size={12}
          style={{
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform 0.2s",
            color: "var(--text-muted)",
            flexShrink: 0,
          }}
        />
      </button>
      {open && (
        <div className="p-3 flex flex-col gap-2" style={{ background: "var(--bg-card)" }}>
          {children}
        </div>
      )}
    </div>
  );
}

/* ── Toggle Row ───────────────────────────────────────────────── */
function ToggleRow({
  label, value, onChange, accent,
}: {
  label: string; value: boolean; onChange: (v: boolean) => void; accent?: string;
}) {
  const color = accent || "var(--accent)";
  return (
    <label
      className="flex items-center justify-between"
      style={{ cursor: "pointer", userSelect: "none" }}
    >
      <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
        {label}
      </span>
      <button
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        style={{
          width: 36,
          height: 20,
          borderRadius: 10,
          background: value ? color : "var(--bg-input)",
          border: `1px solid ${value ? color : "var(--border)"}`,
          cursor: "pointer",
          position: "relative",
          transition: "all 0.2s",
          flexShrink: 0,
          outline: "none",
        }}
      >
        <span style={{
          position: "absolute",
          top: 2,
          left: value ? 17 : 2,
          width: 14,
          height: 14,
          borderRadius: "50%",
          background: "white",
          transition: "left 0.2s",
          boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
          pointerEvents: "none",
        }} />
      </button>
    </label>
  );
}

/* ── Pill button group ────────────────────────────────────────── */
function PillGroup<T extends string>({
  options, value, onChange, cols = 3,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  cols?: number;
}) {
  return (
    <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {options.map(({ value: v, label }) => {
        const active = value === v;
        return (
          <button
            key={v}
            onClick={() => onChange(v)}
            className="text-xs py-1.5 rounded-lg font-semibold uppercase tracking-wider transition-all duration-150"
            style={{
              background: active ? "var(--accent-glow)" : "var(--bg-input)",
              color: active ? "var(--accent-light)" : "var(--text-muted)",
              border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`,
              cursor: "pointer",
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

/* ── Main Component ───────────────────────────────────────────── */
export function BuilderConfigPanel({
  config, onChange,
}: {
  config: BuilderConfig;
  onChange: (c: Partial<BuilderConfig>) => void;
}) {
  // Empieza abierto para que se vea el contenido inmediatamente
  const [open, setOpen] = useState(true);

  return (
    <div className="glass-card" style={{ overflow: "visible" }}>
      {/* Collapsible header */}
      <button
        className="w-full flex items-center justify-between px-4 py-3"
        style={{
          background: "transparent",
          border: "none",
          cursor: "pointer",
          color: "var(--text-primary)",
          fontWeight: 600,
          userSelect: "none",
          borderRadius: "var(--radius-lg)",
        }}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 text-sm">
          <Settings size={14} style={{ color: "var(--accent)" }} />
          Configuración del Equipo
        </span>
        <ChevronDown
          size={13}
          style={{
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform 0.25s",
            color: "var(--text-muted)",
          }}
        />
      </button>

      {open && (
        <div
          className="flex flex-col gap-3 px-4 pb-4"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          {/* Formato */}
          <div className="flex flex-col gap-1.5 pt-3">
            <label className="text-[0.6rem] uppercase tracking-widest font-bold"
              style={{ color: "var(--text-muted)" }}>
              Formato
            </label>
            <select
              className="input"
              style={{ cursor: "pointer" }}
              value={config.format}
              onChange={(e) => onChange({ format: e.target.value })}
            >
              {FORMATS.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>

          {/* Filtro Pokédex */}
          <Section title="Filtro Pokédex" icon={<Filter size={10} />} defaultOpen>
            <ToggleRow label="Legendarios" value={config.allowLegendaries ?? false} onChange={(v) => onChange({ allowLegendaries: v })} accent="#e53e3e" />
            <ToggleRow label="Singulares (Mythicals)" value={config.allowMythicals ?? false} onChange={(v) => onChange({ allowMythicals: v })} accent="#e53e3e" />
            <ToggleRow label="Paradoja" value={config.allowParadox ?? false} onChange={(v) => onChange({ allowParadox: v })} accent="#e53e3e" />
            <ToggleRow label="Ultraentes (UBs)" value={config.allowUB ?? false} onChange={(v) => onChange({ allowUB: v })} accent="#e53e3e" />

            <div style={{ height: 1, background: "var(--border)", margin: "2px 0" }} />
            <span className="text-[0.6rem] uppercase tracking-widest font-bold" style={{ color: "var(--text-muted)" }}>
              Variantes Regionales
            </span>
            <ToggleRow label="Formas de Alola"  value={config.includeAlola  ?? true} onChange={(v) => onChange({ includeAlola: v })} />
            <ToggleRow label="Formas de Galar"  value={config.includeGalar  ?? true} onChange={(v) => onChange({ includeGalar: v })} />
            <ToggleRow label="Formas de Hisui"  value={config.includeHisui  ?? true} onChange={(v) => onChange({ includeHisui: v })} />
            <ToggleRow label="Formas de Paldea" value={config.includePaldea ?? true} onChange={(v) => onChange({ includePaldea: v })} />
          </Section>

          {/* Speed Control */}
          <Section title="Control de Velocidad" icon={<Zap size={10} />}>
            <ToggleRow label="Priorizar Trick Room" value={config.preferTrickRoom ?? false} onChange={(v) => onChange({ preferTrickRoom: v })} />
            <ToggleRow label="Priorizar Tailwind"   value={config.preferTailwind  ?? false} onChange={(v) => onChange({ preferTailwind: v })} />
          </Section>

          {/* Mecánicas */}
          <Section title="Mecánicas" icon={<Zap size={10} />}>
            {([
              { key: "enableTera",    label: "Terastal"   },
              { key: "enableMega",    label: "Mega"       },
              { key: "enableDynamax", label: "Dynamax"    },
              { key: "enableGmax",    label: "Gigantamax" },
              { key: "enableZMoves",  label: "Z-Moves"    },
            ] as const).map(({ key, label }) => (
              <ToggleRow
                key={key}
                label={label}
                value={config[key] ?? false}
                onChange={(v) => onChange({ [key]: v })}
              />
            ))}
          </Section>

          {/* Arquetipo */}
          <Section title="Arquetipo" icon={<Shield size={10} />}>
            <PillGroup
              cols={3}
              options={[
                { value: "ofensivo",  label: "Ofensivo"  },
                { value: "balance",   label: "Balance"   },
                { value: "defensivo", label: "Defensivo" },
              ]}
              value={(config.archetype ?? "balance") as any}
              onChange={(v) => onChange({ archetype: v as any })}
            />
          </Section>

          {/* Meta Preference */}
          <Section title="Preferencia Meta" icon={<Shuffle size={10} />}>
            <PillGroup
              cols={1}
              options={META_PREFERENCES}
              value={(config.metaPreference ?? "balanced") as any}
              onChange={(v) => onChange({ metaPreference: v as any })}
            />
          </Section>

          {/* Experiencia */}
          <Section title="Nivel de Experiencia" icon={<Shield size={10} />}>
            <PillGroup
              cols={3}
              options={EXPERIENCE_LEVELS}
              value={(config.experienceLevel ?? "experto") as any}
              onChange={(v) => onChange({ experienceLevel: v as any })}
            />
          </Section>

          {/* Modo Especial */}
          <Section title="Modo Especial" icon={<Shuffle size={10} />}>
            <ToggleRow label="Little Cup" value={config.isLittleCup ?? false} onChange={(v) => onChange({ isLittleCup: v })} />
            <ToggleRow label="Monotype"   value={config.isMonotype  ?? false} onChange={(v) => onChange({ isMonotype: v })} />
            {config.isMonotype && (
              <select
                className="input"
                style={{ cursor: "pointer", marginTop: 4 }}
                value={config.monoTypeSelected ?? ""}
                onChange={(e) => onChange({ monoTypeSelected: e.target.value })}
              >
                <option value="">— Seleccionar Tipo —</option>
                {POKEMON_TYPES.map((t) => (
                  <option key={t} value={t.toLowerCase()}>{t}</option>
                ))}
              </select>
            )}
            <ToggleRow label="Randomizer" value={config.isRandomizer ?? false} onChange={(v) => onChange({ isRandomizer: v })} />
          </Section>

          {/* Estrategia personalizada */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[0.6rem] uppercase tracking-widest font-bold"
              style={{ color: "var(--text-muted)" }}>
              Contexto / Estrategia
            </label>
            <textarea
              className="input"
              placeholder="Ej: Quiero un equipo de lluvia con Kingdra…"
              rows={3}
              style={{ resize: "vertical", fontFamily: "inherit", cursor: "text" }}
              value={config.customStrategy ?? ""}
              onChange={(e) => onChange({ customStrategy: e.target.value })}
            />
          </div>
        </div>
      )}
    </div>
  );
}