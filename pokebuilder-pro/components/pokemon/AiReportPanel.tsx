"use client";

import { useState } from "react";
import { Shield, Zap, Swords, ChevronDown, ChevronUp } from "lucide-react";
import { Pokeball } from "@/components/ui/PokeballBg";
import { TypeBadge } from "@/components/ui/TypeBadge";

// ─── Tipos locales (espejo de SuggestResponse["report"]) ──────────
interface TypeChart {
  teamWeaknesses:  string[];
  teamResistances: string[];
  teamImmunities:  string[];
}

interface PerPokemon {
  name:        string;
  role:        string;
  counters:    string[];
  threatens:   string[];
  synergyWith: string[];
}

interface AiReport {
  teamComposition: string;
  typesCoverage:   string;
  speedControl:    string;
  synergySummary:  string;
  weaknesses:      string[];
  strengths:       string[];
  recommendation:  string;
  formatSpecific?: string;
  typeChart?:      TypeChart;
  perPokemon?:     PerPokemon[];
  // Alias español (legado)
  estrategia?:  string;
  ventajas?:    string[];
  debilidades?: string[];
}

interface AiReportPanelProps {
  report: AiReport;
}

// ─── Sub-componentes ──────────────────────────────────────────────

function Section({
  title, icon, children, defaultOpen = true,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderRadius: 10, overflow: "hidden", border: "1px solid var(--border)" }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3"
        style={{ background: "var(--bg-surface)", border: "none", cursor: "pointer" }}
      >
        <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
          style={{ color: "var(--text-secondary)" }}>
          {icon}
          {title}
        </span>
        {open
          ? <ChevronUp size={13} style={{ color: "var(--text-muted)" }} />
          : <ChevronDown size={13} style={{ color: "var(--text-muted)" }} />}
      </button>
      {open && (
        <div className="p-4 flex flex-col gap-3"
          style={{ background: "var(--bg-card, rgba(0,0,0,0.2))" }}>
          {children}
        </div>
      )}
    </div>
  );
}

function TextBlock({ text }: { text: string }) {
  if (!text) return null;
  return (
    <p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>
      {text}
    </p>
  );
}

function TagList({
  title, items, color, bg,
}: { title: string; items: string[]; color: string; bg: string }) {
  if (!items?.length) return null;
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs uppercase tracking-wider font-semibold mb-0.5"
        style={{ color: "var(--text-muted)" }}>
        {title}
      </span>
      <div className="flex flex-col gap-1.5">
        {items.map((item, i) => (
          <div key={i}
            className="flex items-start gap-2 rounded-lg px-3 py-2 text-xs"
            style={{ background: bg, color, border: `1px solid ${color}22` }}>
            <span style={{ flexShrink: 0, marginTop: 1 }}>•</span>
            <span className="leading-relaxed">{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TypeRow({ label, items, color }: { label: string; items: string[]; color: string }) {
  if (!items?.length) return null;
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs uppercase tracking-wider font-semibold"
        style={{ color: "var(--text-muted)" }}>
        {label}
      </span>
      <div className="flex flex-wrap gap-1.5">
        {items.map((t, i) => {
          // intenta extraer el tipo antes de " x" o " (" para usar TypeBadge
          const typeName = t.split(" ")[0].toLowerCase();
          return (
            <span key={i}
              className="px-2 py-1 rounded-full text-xs font-semibold"
              style={{ background: `${color}18`, color, border: `1px solid ${color}44` }}>
              {t}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function PokemonAnalysisCard({ poke }: { poke: PerPokemon }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderRadius: 8, overflow: "hidden", border: "1px solid var(--border)" }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-2.5"
        style={{ background: "var(--bg-input)", border: "none", cursor: "pointer" }}>
        <div className="flex flex-col items-start gap-0.5">
          <span className="text-sm font-bold capitalize" style={{ color: "var(--text-primary)" }}>
            {poke.name}
          </span>
          <span className="text-xs" style={{ color: "var(--accent-light)" }}>
            {poke.role}
          </span>
        </div>
        {open
          ? <ChevronUp size={13} style={{ color: "var(--text-muted)" }} />
          : <ChevronDown size={13} style={{ color: "var(--text-muted)" }} />}
      </button>

      {open && (
        <div className="p-3 flex flex-col gap-3"
          style={{ background: "var(--bg-card, rgba(0,0,0,0.25))" }}>
          {poke.counters?.length > 0 && (
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: "#ef4444" }}>
                🛡 Lo countera
              </span>
              {poke.counters.map((c, i) => (
                <div key={i} className="text-xs px-2 py-1 rounded-md"
                  style={{ background: "rgba(239,68,68,0.08)", color: "#fca5a5", border: "1px solid rgba(239,68,68,0.15)" }}>
                  {c}
                </div>
              ))}
            </div>
          )}
          {poke.threatens?.length > 0 && (
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: "#22c55e" }}>
                ⚔ Amenaza a
              </span>
              {poke.threatens.map((t, i) => (
                <div key={i} className="text-xs px-2 py-1 rounded-md"
                  style={{ background: "rgba(34,197,94,0.08)", color: "#86efac", border: "1px solid rgba(34,197,94,0.15)" }}>
                  {t}
                </div>
              ))}
            </div>
          )}
          {poke.synergyWith?.length > 0 && (
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: "#3b82f6" }}>
                🔗 Sinergia con
              </span>
              {poke.synergyWith.map((s, i) => (
                <div key={i} className="text-xs px-2 py-1 rounded-md"
                  style={{ background: "rgba(59,130,246,0.08)", color: "#93c5fd", border: "1px solid rgba(59,130,246,0.15)" }}>
                  {s}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────
export function AiReportPanel({ report }: AiReportPanelProps) {
  // Normalizar campos (acepta español y camelCase)
  const teamComposition = report.teamComposition || report.estrategia      || "";
  const strengths       = report.strengths       || report.ventajas         || [];
  const weaknesses      = report.weaknesses      || report.debilidades      || [];
  const typesCoverage   = report.typesCoverage   || "";
  const speedControl    = report.speedControl    || "";
  const synergySummary  = report.synergySummary  || "";
  const recommendation  = report.recommendation  || "";

  return (
    <div className="flex flex-col gap-3 animate-slide-up">
      {/* Header */}
      <div className="glass-card p-4 flex items-center gap-3 relative overflow-hidden">
        <div className="absolute -top-3 -right-3 pointer-events-none" aria-hidden="true">
          <Pokeball size={70} opacity={0.06} />
        </div>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "var(--accent-glow)" }}>
          <Pokeball size={20} />
        </div>
        <div>
          <h3 className="font-bold text-sm uppercase tracking-wider"
            style={{ color: "var(--text-primary)" }}>
            Análisis de IA
          </h3>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Cobertura completa del equipo
          </p>
        </div>
      </div>

      {/* Estrategia general */}
      {teamComposition && (
        <Section title="Estrategia del Equipo" icon={<Swords size={13} />}>
          <TextBlock text={teamComposition} />
          {typesCoverage && (
            <>
              <div style={{ height: 1, background: "var(--border)" }} />
              <div>
                <span className="text-xs uppercase tracking-wider font-semibold block mb-1.5"
                  style={{ color: "var(--text-muted)" }}>Cobertura Ofensiva</span>
                <TextBlock text={typesCoverage} />
              </div>
            </>
          )}
          {speedControl && (
            <>
              <div style={{ height: 1, background: "var(--border)" }} />
              <div>
                <span className="text-xs uppercase tracking-wider font-semibold block mb-1.5"
                  style={{ color: "var(--text-muted)" }}>Control de Velocidad</span>
                <TextBlock text={speedControl} />
              </div>
            </>
          )}
          {synergySummary && (
            <>
              <div style={{ height: 1, background: "var(--border)" }} />
              <div>
                <span className="text-xs uppercase tracking-wider font-semibold block mb-1.5"
                  style={{ color: "var(--text-muted)" }}>Sinergias</span>
                <TextBlock text={synergySummary} />
              </div>
            </>
          )}
        </Section>
      )}

      {/* Cobertura de tipos del equipo */}
      {report.typeChart && (
        <Section title="Cobertura de Tipos" icon={<Shield size={13} />}>
          <TypeRow
            label="Debilidades del Equipo"
            items={report.typeChart.teamWeaknesses}
            color="#ef4444"
          />
          <TypeRow
            label="Resistencias del Equipo"
            items={report.typeChart.teamResistances}
            color="#22c55e"
          />
          {report.typeChart.teamImmunities?.length > 0 && (
            <TypeRow
              label="Inmunidades"
              items={report.typeChart.teamImmunities}
              color="#3b82f6"
            />
          )}
        </Section>
      )}

      {/* Fortalezas y Debilidades */}
      {(strengths.length > 0 || weaknesses.length > 0) && (
        <Section title="Ventajas y Debilidades" icon={<Zap size={13} />}>
          <TagList
            title="Fortalezas"
            items={strengths}
            color="var(--success)"
            bg="rgba(34,197,94,0.08)"
          />
          <TagList
            title="Debilidades"
            items={weaknesses}
            color="var(--danger)"
            bg="rgba(239,68,68,0.08)"
          />
        </Section>
      )}

      {/* Análisis por Pokémon */}
      {report.perPokemon && report.perPokemon.length > 0 && (
        <Section title="Análisis por Pokémon" icon={<Pokeball size={13} />} defaultOpen={false}>
          <div className="flex flex-col gap-2">
            {report.perPokemon.map((poke, i) => (
              <PokemonAnalysisCard key={i} poke={poke} />
            ))}
          </div>
        </Section>
      )}

      {/* Recomendación final */}
      {recommendation && (
        <div className="glass-card p-4"
          style={{ border: "1px solid var(--accent)44", background: "var(--accent-glow)" }}>
          <span className="text-xs uppercase tracking-wider font-bold block mb-2"
            style={{ color: "var(--accent-light)" }}>
            💡 Recomendación
          </span>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>
            {recommendation}
          </p>
        </div>
      )}

      {/* Formato específico */}
      {report.formatSpecific && (
        <div className="glass-card p-4">
          <span className="text-xs uppercase tracking-wider font-semibold block mb-2"
            style={{ color: "var(--text-muted)" }}>
            Notas de Formato
          </span>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            {report.formatSpecific}
          </p>
        </div>
      )}
    </div>
  );
}