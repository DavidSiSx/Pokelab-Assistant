"use client";

import { useState } from "react";
import { useReview } from "@/hooks/useReview";
import { useBuilder } from "@/hooks/useBuilder";
import type { TeamMember, Build } from "@/types/pokemon";
import { StatBar } from "@/components/ui/StatBar";
import { PokemonSprite } from "@/components/pokemon/PokemonSprite";
import { EmptyState } from "@/components/ui/EmptyState";
import { TypeBadge } from "@/components/ui/TypeBadge";
import { ShieldCheck, Trophy } from "lucide-react";

const GRADE_COLOR: Record<string, string> = {
  "A+": "var(--success)", A: "var(--success)", "A-": "var(--success)",
  "B+": "var(--warning)", B: "var(--warning)", "B-": "var(--warning)",
  "C+": "var(--accent)", C: "var(--accent)",
  D: "var(--danger)", F: "var(--danger)",
};

const CATEGORY_ICONS: Record<string, string> = {
  sinergia: "⚡",
  cobertura: "🎯",
  speedControl: "💨",
  matchupSpread: "⚔",
  itemsOptim: "🎒",
  consistencia: "🛡",
  originalidad: "✨",
};

interface ReviewViewProps {
  externalTeam?: (TeamMember | null)[];
  externalBuilds?: Record<string, Build>;
  externalFormat?: string;
}

export function ReviewView({
  externalTeam,
  externalBuilds,
  externalFormat,
}: ReviewViewProps) {
  const { result, loading, error, reviewTeam, reset } = useReview();
  const builder = useBuilder();

  const team = externalTeam ?? builder.team;
  const builds = externalBuilds ?? builder.builds;
  const format = externalFormat ?? builder.config.format ?? "National Dex";

  const filledTeam = team.filter(Boolean) as TeamMember[];
  const [selectedPokemon, setSelectedPokemon] = useState<string | null>(null);

  async function handleReview() {
    await reviewTeam(filledTeam, builds, format);
  }

  const gradeColor = result ? (GRADE_COLOR[result.grade] ?? "var(--accent)") : "var(--accent)";

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8 flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="page-header">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-lg flex items-center justify-center"
              style={{ background: "var(--accent-glow)", border: "1px solid var(--accent)" }}
            >
              <ShieldCheck size={20} style={{ color: "var(--accent)" }} />
            </div>
            <h1
              className="font-bold text-balance"
              style={{ color: "var(--text-primary)", fontSize: "clamp(1.5rem,4vw,2rem)" }}
            >
              Análisis de Equipo
            </h1>
          </div>
        </div>
        <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
          Evaluación competitiva profunda de tu estrategia y cobertura.
        </p>
      </div>

      {/* Team preview */}
      {filledTeam.length > 0 ? (
        <div className="glass-card p-4 flex flex-col gap-3 animate-bounce-in">
          <div className="flex items-center justify-between">
            <span
              className="text-xs uppercase tracking-wider font-semibold"
              style={{ color: "var(--text-muted)" }}
            >
              Equipo a Analizar — {format}
            </span>
            <span
              className="badge badge-accent"
              style={{ fontSize: "0.65rem" }}
            >
              {filledTeam.length} / 6
            </span>
          </div>
          <div className="flex flex-wrap gap-3">
            {filledTeam.map((p) => {
              const build = builds[String(p.id)];
              const rating = result?.pokemonRatings?.[p.nombre];
              return (
                <button
                  key={p.id}
                  className="flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-150"
                  style={{
                    background: selectedPokemon === p.nombre ? "var(--accent-glow)" : "var(--bg-input)",
                    border: `1px solid ${selectedPokemon === p.nombre ? "var(--accent)" : "var(--border)"}`,
                    minWidth: 72,
                  }}
                  onClick={() =>
                    setSelectedPokemon(selectedPokemon === p.nombre ? null : p.nombre)
                  }
                >
                  <PokemonSprite name={p.nombre} spriteUrl={p.sprite_url} size={48} />
                  <span
                    className="text-xs font-medium capitalize"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {p.nombre}
                  </span>
                  {build?.item && (
                    <span
                      className="text-xs"
                      style={{ color: "var(--text-muted)", fontSize: "0.6rem" }}
                    >
                      @ {build.item}
                    </span>
                  )}
                  {rating && (
                    <span
                      className="text-xs font-bold"
                      style={{
                        color:
                          rating.score >= 75
                            ? "var(--success)"
                            : rating.score >= 50
                            ? "var(--warning)"
                            : "var(--danger)",
                      }}
                    >
                      {rating.score}/100
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Selected pokemon detail */}
          {selectedPokemon && result?.pokemonRatings?.[selectedPokemon] && (
            <div
              className="rounded-xl p-3 text-sm animate-fade-in"
              style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
            >
              <span className="font-bold" style={{ color: "var(--text-primary)" }}>
                {selectedPokemon}:{" "}
              </span>
              <span style={{ color: "var(--text-secondary)" }}>
                {result.pokemonRatings[selectedPokemon].comment}
              </span>
            </div>
          )}
        </div>
      ) : (
        <EmptyState
          icon={<Trophy size={28} />}
          title="Sin equipo para analizar"
          description="Ve al Team Builder, genera o arma un equipo, luego vuelve aqui."
        />
      )}

      {/* Action */}
      {filledTeam.length > 0 && !result && (
        <button
          className="btn-primary w-full max-w-sm"
          onClick={handleReview}
          disabled={loading}
          style={{ fontSize: "0.9rem", padding: "12px" }}
        >
          {loading ? "Analizando equipo..." : "Analizar Equipo"}
        </button>
      )}

      {error && (
        <div
          className="rounded-xl px-4 py-3 text-sm"
          style={{
            background: "rgba(239,68,68,0.1)",
            color: "var(--danger)",
            border: "1px solid rgba(239,68,68,0.25)",
          }}
          role="alert"
        >
          {error}
        </div>
      )}

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton rounded-xl" style={{ height: 80 }} />
          ))}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="flex flex-col gap-6 animate-slide-up">
          {/* Score hero */}
          <div
            className="glass-card p-6 flex flex-col items-center gap-4 sm:flex-row sm:items-start"
            style={{ borderColor: gradeColor, boxShadow: `0 0 0 1px ${gradeColor}33, 0 12px 40px ${gradeColor}22` }}
          >
            <div className="flex flex-col items-center gap-1" style={{ flexShrink: 0 }}>
              <span
                className="font-black"
                style={{ fontSize: "5rem", lineHeight: 1, color: gradeColor }}
              >
                {result.grade}
              </span>
              <span
                className="text-3xl font-bold tabular-nums"
                style={{ color: "var(--text-secondary)" }}
              >
                {result.score}
                <span className="text-sm font-normal" style={{ color: "var(--text-muted)" }}>
                  /100
                </span>
              </span>
            </div>
            <div className="flex flex-col gap-2 flex-1">
              <p
                className="text-sm leading-relaxed"
                style={{ color: "var(--text-secondary)" }}
              >
                {result.analysis}
              </p>
              <div
                className="px-3 py-2 rounded-lg text-sm font-semibold text-center italic mt-1"
                style={{
                  background: `${gradeColor}11`,
                  color: gradeColor,
                  border: `1px solid ${gradeColor}33`,
                }}
              >
                "{result.metaVerdict}"
              </div>
            </div>
          </div>

          {/* Categories */}
          {result.categories && (
            <div className="glass-card p-4 flex flex-col gap-3">
              <h3
                className="text-xs uppercase tracking-wider font-semibold"
                style={{ color: "var(--text-muted)" }}
              >
                Categorías
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(result.categories).map(([key, cat]) => {
                  const catData = cat as { score: number; label: string; desc: string };
                  return (
                    <div
                      key={key}
                      className="flex flex-col gap-1.5 p-3 rounded-xl"
                      style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className="flex items-center gap-1.5 text-xs font-semibold"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {CATEGORY_ICONS[key] ?? "•"} {catData.label}
                        </span>
                        <span
                          className="text-xs font-bold tabular-nums"
                          style={{
                            color:
                              catData.score >= 75
                                ? "var(--success)"
                                : catData.score >= 50
                                ? "var(--warning)"
                                : "var(--danger)",
                          }}
                        >
                          {catData.score}
                        </span>
                      </div>
                      <StatBar
                        label=""
                        value={catData.score}
                        max={100}
                        showValue={false}
                        animated
                      />
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {catData.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Weak points & suggestions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TagSection
              title="Puntos Débiles"
              items={result.weakPoints}
              color="var(--danger)"
              bg="rgba(239,68,68,0.07)"
            />
            <TagSection
              title="Sugerencias"
              items={result.suggestions}
              color="var(--success)"
              bg="rgba(34,197,94,0.07)"
            />
          </div>

          {/* Reset */}
          <button className="btn-secondary w-full max-w-sm" onClick={reset}>
            Nueva Revisión
          </button>
        </div>
      )}
    </div>
  );
}

function TagSection({
  title, items, color, bg,
}: { title: string; items: string[]; color: string; bg: string }) {
  return (
    <div className="glass-card p-4 flex flex-col gap-3">
      <h3
        className="text-xs uppercase tracking-wider font-semibold"
        style={{ color: "var(--text-muted)" }}
      >
        {title}
      </h3>
      <div className="flex flex-col gap-2">
        {items.map((item, i) => (
          <div
            key={i}
            className="flex items-start gap-2 rounded-lg px-3 py-2 text-xs"
            style={{ background: bg, color, border: `1px solid ${color}22` }}
          >
            <span style={{ flexShrink: 0, marginTop: 1 }}>•</span>
            <span className="leading-relaxed">{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
