"use client";

import { useState } from "react";
import { ChevronDown, Settings, Filter, Zap, Shield, Shuffle } from "lucide-react";
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

const POKEMON_TYPES = [
  "Normal","Fire","Water","Grass","Electric","Ice","Fighting","Poison",
  "Ground","Flying","Psychic","Bug","Rock","Ghost","Dragon","Dark","Steel","Fairy",
];

const EXPERIENCE_LEVELS = [
  { value: "casual",    label: "Casual" },
  { value: "competidor",label: "Competidor" },
  { value: "experto",   label: "Experto / VGC" },
];

const META_PREFERENCES = [
  { value: "extrememeta", label: "Top Meta" },
  { value: "meta",        label: "Meta" },
  { value: "balanced",    label: "Balanceado" },
  { value: "varied",      label: "Variado" },
  { value: "niche",       label: "Niche" },
];

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function Section({ title, icon, children, defaultOpen = false }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderRadius: 10, overflow: "hidden", border: "1px solid var(--border)" }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-2.5"
        style={{
          background: "var(--bg-input)",
          border: "none",
          cursor: "pointer",
          color: "var(--text-primary)",
        }}
      >
        <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider"
          style={{ color: "var(--text-muted)" }}>
          {icon}
          {title}
        </span>
        <ChevronDown
          size={13}
          style={{
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform 0.2s",
            color: "var(--text-muted)",
          }}
        />
      </button>
      {open && (
        <div className="p-3 flex flex-col gap-2.5"
          style={{ background: "var(--bg-card, rgba(0,0,0,0.2))" }}>
          {children}
        </div>
      )}
    </div>
  );
}

interface ToggleRowProps {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  accent?: string;
}

function ToggleRow({ label, value, onChange, accent }: ToggleRowProps) {
  const color = accent || "var(--accent)";
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs" style={{ color: "var(--text-secondary, var(--text-muted))" }}>
        {label}
      </span>
      <button
        onClick={() => onChange(!value)}
        style={{
          width: 40,
          height: 22,
          borderRadius: 11,
          background: value ? color : "var(--bg-input)",
          border: `1px solid ${value ? color : "var(--border)"}`,
          cursor: "pointer",
          position: "relative",
          transition: "all 0.2s",
          flexShrink: 0,
        }}
      >
        <span style={{
          position: "absolute",
          top: 2,
          left: value ? 20 : 2,
          width: 16,
          height: 16,
          borderRadius: "50%",
          background: "white",
          transition: "left 0.2s",
          boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
        }} />
      </button>
    </div>
  );
}

interface BuilderConfigPanelProps {
  config: BuilderConfig;
  onChange: (c: Partial<BuilderConfig>) => void;
}

export function BuilderConfigPanel({ config, onChange }: BuilderConfigPanelProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="glass-card" style={{ overflow: "hidden" }}>
      {/* Header */}
      <button
        className="w-full flex items-center justify-between p-4"
        style={{
          background: "transparent",
          border: "none",
          cursor: "pointer",
          color: "var(--text-primary)",
          fontWeight: 600,
        }}
        onClick={() => setOpen(o => !o)}
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
          className="flex flex-col gap-3 p-4"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          {/* ── FORMATO ──────────────────────────────────────────── */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs uppercase tracking-wider font-semibold"
              style={{ color: "var(--text-muted)" }}>
              Formato
            </label>
            <select
              className="input"
              value={config.format}
              onChange={e => onChange({ format: e.target.value })}
            >
              {FORMATS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>

          {/* ── FILTRO DE POKÉDEX ─────────────────────────────────── */}
          <Section title="Filtro de Pokédex" icon={<Filter size={11} />} defaultOpen>
            <ToggleRow
              label="Permitir Legendarios"
              value={config.allowLegendaries ?? false}
              onChange={v => onChange({ allowLegendaries: v })}
              accent="#e53e3e"
            />
            <ToggleRow
              label="Permitir Singulares (Mythicals)"
              value={config.allowMythicals ?? false}
              onChange={v => onChange({ allowMythicals: v })}
              accent="#e53e3e"
            />
            <ToggleRow
              label="Permitir Paradox"
              value={config.allowParadox ?? false}
              onChange={v => onChange({ allowParadox: v })}
              accent="#e53e3e"
            />
            <ToggleRow
              label="Permitir Ultraentes (UBs)"
              value={config.allowUB ?? false}
              onChange={v => onChange({ allowUB: v })}
              accent="#e53e3e"
            />

            {/* Variantes Regionales */}
            <div style={{ height: 1, background: "var(--border)", margin: "2px 0" }} />
            <span className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: "var(--text-muted)", opacity: 0.7 }}>
              Variantes Regionales
            </span>
            <ToggleRow
              label="Formas de Alola"
              value={config.includeAlola ?? true}
              onChange={v => onChange({ includeAlola: v })}
            />
            <ToggleRow
              label="Formas de Galar"
              value={config.includeGalar ?? true}
              onChange={v => onChange({ includeGalar: v })}
            />
            <ToggleRow
              label="Formas de Hisui"
              value={config.includeHisui ?? true}
              onChange={v => onChange({ includeHisui: v })}
            />
            <ToggleRow
              label="Formas de Paldea"
              value={config.includePaldea ?? true}
              onChange={v => onChange({ includePaldea: v })}
            />
          </Section>

          {/* ── CONTROL DE VELOCIDAD ─────────────────────────────── */}
          <Section title="Control de Velocidad" icon={<Zap size={11} />}>
            <ToggleRow
              label="Priorizar Trick Room"
              value={config.preferTrickRoom ?? false}
              onChange={v => onChange({ preferTrickRoom: v })}
            />
            <ToggleRow
              label="Priorizar Tailwind"
              value={config.preferTailwind ?? false}
              onChange={v => onChange({ preferTailwind: v })}
            />
          </Section>

          {/* ── MECÁNICAS ─────────────────────────────────────────── */}
          <Section title="Mecánicas" icon={<Zap size={11} />}>
            {(
              [
                { key: "enableTera",    label: "Terastal"    },
                { key: "enableMega",    label: "Mega"        },
                { key: "enableDynamax", label: "Dynamax"     },
                { key: "enableGmax",    label: "Gigantamax"  },
                { key: "enableZMoves",  label: "Z-Moves"     },
              ] as const
            ).map(({ key, label }) => (
              <ToggleRow
                key={key}
                label={label}
                value={config[key] ?? false}
                onChange={v => onChange({ [key]: v })}
              />
            ))}
          </Section>

          {/* ── ARQUETIPO DE EQUIPO ───────────────────────────────── */}
          <Section title="Arquetipo de Equipo" icon={<Shield size={11} />}>
            <div className="grid grid-cols-3 gap-1.5">
              {(["ofensivo","balance","defensivo"] as const).map(arch => {
                const active = (config.archetype ?? "balance") === arch;
                return (
                  <button
                    key={arch}
                    onClick={() => onChange({ archetype: arch })}
                    className="text-xs py-2 rounded-lg font-semibold uppercase tracking-wider"
                    style={{
                      background: active ? "var(--accent-glow)" : "var(--bg-input)",
                      color: active ? "var(--accent-light)" : "var(--text-muted)",
                      border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`,
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    {arch.charAt(0).toUpperCase() + arch.slice(1)}
                  </button>
                );
              })}
            </div>
          </Section>

          {/* ── PREFERENCIA DE META ───────────────────────────────── */}
          <Section title="Preferencia de Meta" icon={<Shuffle size={11} />}>
            <div className="flex flex-col gap-1.5">
              {META_PREFERENCES.map(({ value, label }) => {
                const active = (config.metaPreference ?? "balanced") === value;
                return (
                  <button
                    key={value}
                    onClick={() => onChange({ metaPreference: value })}
                    className="flex items-center justify-between px-3 py-2 rounded-lg text-xs"
                    style={{
                      background: active ? "var(--accent-glow)" : "var(--bg-input)",
                      color: active ? "var(--accent-light)" : "var(--text-muted)",
                      border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`,
                      cursor: "pointer",
                      transition: "all 0.15s",
                      fontWeight: active ? 600 : 400,
                    }}
                  >
                    <span>{label}</span>
                    {active && <PokeballMini size={10} />}
                  </button>
                );
              })}
            </div>
          </Section>

          {/* ── NIVEL DE EXPERIENCIA ──────────────────────────────── */}
          <Section title="Nivel de Experiencia" icon={<Shield size={11} />}>
            <div className="grid grid-cols-3 gap-1.5">
              {EXPERIENCE_LEVELS.map(({ value, label }) => {
                const active = (config.experienceLevel ?? "experto") === value;
                return (
                  <button
                    key={value}
                    onClick={() => onChange({ experienceLevel: value })}
                    className="text-xs py-2 rounded-lg font-medium"
                    style={{
                      background: active ? "var(--accent-glow)" : "var(--bg-input)",
                      color: active ? "var(--accent-light)" : "var(--text-muted)",
                      border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`,
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </Section>

          {/* ── MODO ESPECIAL ─────────────────────────────────────── */}
          <Section title="Modo Especial" icon={<Shuffle size={11} />}>
            <ToggleRow
              label="Little Cup"
              value={config.isLittleCup ?? false}
              onChange={v => onChange({ isLittleCup: v })}
            />
            <ToggleRow
              label="Monotype"
              value={config.isMonotype ?? false}
              onChange={v => onChange({ isMonotype: v })}
            />
            {config.isMonotype && (
              <select
                className="input"
                value={config.monoTypeSelected ?? ""}
                onChange={e => onChange({ monoTypeSelected: e.target.value })}
                style={{ marginTop: 4 }}
              >
                <option value="">— Seleccionar Tipo —</option>
                {POKEMON_TYPES.map(t => (
                  <option key={t} value={t.toLowerCase()}>{t}</option>
                ))}
              </select>
            )}
            <ToggleRow
              label="Randomizer"
              value={config.isRandomizer ?? false}
              onChange={v => onChange({ isRandomizer: v })}
            />
          </Section>

          {/* ── ESTRATEGIA PERSONALIZADA ──────────────────────────── */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs uppercase tracking-wider font-semibold"
              style={{ color: "var(--text-muted)" }}>
              Contexto / Estrategia
            </label>
            <textarea
              className="input"
              placeholder="Ej: Quiero un equipo de lluvia con Kingdra, prioriza stall..."
              rows={3}
              style={{ resize: "vertical", fontFamily: "inherit" }}
              value={config.customStrategy ?? ""}
              onChange={e => onChange({ customStrategy: e.target.value })}
            />
          </div>
        </div>
      )}
    </div>
  );
}