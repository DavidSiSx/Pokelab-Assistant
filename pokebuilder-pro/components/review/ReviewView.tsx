"use client";

import { useState, useMemo } from "react";
import { useReview } from "@/hooks/useReview";
import { useBuilder } from "@/hooks/useBuilder";
import type { TeamMember, Build } from "@/types/pokemon";
import { StatBar } from "@/components/ui/StatBar";
import { PokemonSprite } from "@/components/pokemon/PokemonSprite";
import { BuildCard } from "@/components/pokemon/BuildCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { TypeBadge } from "@/components/ui/TypeBadge";
import { WeaknessBar } from "@/components/builder/WeaknessBar";
import { WeaknessMatrix } from "@/components/builder/WeaknessMatrix";
import { PokeballPattern, Pokeball } from "@/components/ui/PokeballBg";
import { getTeamWeaknessProfile } from "@/utils/type-chart";
import {
  ShieldCheck, Trophy,
  TrendingDown, Lightbulb,
} from "lucide-react";

const GRADE_COLOR: Record<string, string> = {
  "A+": "var(--success)", A: "var(--success)", "A-": "var(--success)",
  "B+": "var(--warning)", B: "var(--warning)", "B-": "var(--warning)",
  "C+": "var(--accent)", C: "var(--accent)",
  D: "var(--danger)", F: "var(--danger)",
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
  const [showMatrix, setShowMatrix] = useState(false);

  const weaknessProfile = useMemo(
    () => (filledTeam.length > 0 ? getTeamWeaknessProfile(filledTeam) : null),
    [filledTeam]
  );

  const selectedMember = filledTeam.find((p) => p.nombre === selectedPokemon) ?? null;
  const selectedBuild = selectedMember ? builds[String(selectedMember.id)] : undefined;

  async function handleReview() {
    await reviewTeam(filledTeam, builds, format);
  }

  const gradeColor = result ? (GRADE_COLOR[result.grade] ?? "var(--accent)") : "var(--accent)";

  return (
    <div className="relative w-full min-h-screen">
      <PokeballPattern />
      <div className="relative z-[1] w-full max-w-7xl mx-auto px-4 py-8 flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2.5">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "var(--accent-glow)", border: "1px solid var(--accent)" }}
            >
              <ShieldCheck size={20} style={{ color: "var(--accent)" }} />
            </div>
            <h1
              className="font-bold text-balance"
              style={{ color: "var(--text-primary)", fontSize: "clamp(1.35rem,3vw,1.75rem)" }}
            >
              Analisis de Equipo
            </h1>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
            Evaluacion competitiva profunda de tu estrategia y cobertura.
          </p>
        </div>

        {filledTeam.length === 0 && (
          <EmptyState
            icon={<Trophy size={28} />}
            title="Sin equipo para analizar"
            description="Ve al Team Builder, genera o arma un equipo, luego vuelve aqui."
          />
        )}

        {filledTeam.length > 0 && (
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
            {/* Left: Team grid + results */}
            <div className="flex-1 flex flex-col gap-5 min-w-0">
              {/* Team 2x3 grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 stagger-children">
                {filledTeam.map((p) => {
                  const build = builds[String(p.id)];
                  const rating = result?.pokemonRatings?.[p.nombre];
                  const isSelected = selectedPokemon === p.nombre;

                  return (
                    <button
                      key={p.id}
                      className="glass-card flex flex-col items-center gap-2 p-3 transition-all duration-200 animate-bounce-in"
                      style={{
                        borderColor: isSelected ? "var(--accent)" : undefined,
                        boxShadow: isSelected
                          ? "0 0 0 1px var(--accent-glow), 0 4px 20px var(--accent-glow)"
                          : undefined,
                      }}
                      onClick={() =>
                        setSelectedPokemon(isSelected ? null : p.nombre)
                      }
                    >
                      <PokemonSprite
                        name={p.nombre}
                        spriteUrl={p.sprite_url}
                        size={56}
                        animate={isSelected}
                      />
                      <span
                        className="text-sm font-bold capitalize truncate w-full text-center"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {p.nombre}
                      </span>
                      <div className="flex gap-1 flex-wrap justify-center">
                        {p.tipo1 && <TypeBadge type={p.tipo1} size="sm" />}
                        {p.tipo2 && <TypeBadge type={p.tipo2} size="sm" />}
                      </div>
                      {build?.item && (
                        <span
                          className="text-xs truncate w-full text-center"
                          style={{ color: "var(--text-muted)" }}
                        >
                          @ {build.item}
                        </span>
                      )}
                      {rating && (
                        <span
                          className="text-xs font-bold tabular-nums"
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

              {/* Weakness Bar */}
              {weaknessProfile && (
                <WeaknessBar
                  profile={weaknessProfile}
                  onOpenMatrix={() => setShowMatrix(true)}
                />
              )}

              {/* Analyze button */}
              {!result && (
                <button
                  className="btn-primary w-full max-w-sm animate-pulse-glow"
                  onClick={handleReview}
                  disabled={loading}
                  style={{ fontSize: "0.9rem", padding: "12px" }}
                >
                  {loading ? (
                    <>
                      <Pokeball size={16} className="animate-rotate-pokeball" />
                      Analizando...
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={16} />
                      Analizar Equipo
                    </>
                  )}
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="skeleton rounded-xl" style={{ height: 80 }} />
                  ))}
                </div>
              )}

              {/* Results */}
              {result && (
                <div className="flex flex-col gap-5 animate-slide-up">
                  {/* Score hero */}
                  <div
                    className="glass-card p-5 flex flex-col items-center gap-4 sm:flex-row sm:items-start"
                    style={{
                      borderColor: gradeColor,
                      boxShadow: `0 0 0 1px ${gradeColor}33, 0 12px 40px ${gradeColor}22`,
                    }}
                  >
                    {/* Circular gauge */}
                    <div className="flex flex-col items-center gap-1 flex-shrink-0">
                      <div
                        className="relative w-24 h-24 rounded-full flex items-center justify-center"
                        style={{
                          background: `conic-gradient(${gradeColor} ${result.score * 3.6}deg, var(--bg-input) 0deg)`,
                        }}
                      >
                        <div
                          className="w-20 h-20 rounded-full flex flex-col items-center justify-center"
                          style={{ background: "var(--bg-card)" }}
                        >
                          <span
                            className="font-black text-2xl"
                            style={{ color: gradeColor, lineHeight: 1 }}
                          >
                            {result.grade}
                          </span>
                          <span
                            className="text-xs font-bold tabular-nums"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            {result.score}/100
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 flex-1">
                      <p
                        className="text-sm leading-relaxed"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {result.analysis}
                      </p>
                      <div
                        className="px-3 py-2 rounded-lg text-sm font-semibold italic"
                        style={{
                          background: `${gradeColor}11`,
                          color: gradeColor,
                          border: `1px solid ${gradeColor}33`,
                        }}
                      >
                        {`"${result.metaVerdict}"`}
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
                        Categorias
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {Object.entries(result.categories).map(([key, cat]) => {
                          const catData = cat as { score: number; label: string; desc: string };
                          return (
                            <div
                              key={key}
                              className="flex flex-col gap-1.5 p-3 rounded-xl"
                              style={{
                                background: "var(--bg-surface)",
                                border: "1px solid var(--border)",
                              }}
                            >
                              <div className="flex items-center justify-between">
                                <span
                                  className="text-xs font-semibold"
                                  style={{ color: "var(--text-primary)" }}
                                >
                                  {catData.label}
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
                    <div className="glass-card p-4 flex flex-col gap-3">
                      <h3 className="text-xs uppercase tracking-wider font-semibold flex items-center gap-1.5" style={{ color: "var(--danger)" }}>
                        <TrendingDown size={13} /> Puntos Debiles
                      </h3>
                      <div className="flex flex-col gap-2">
                        {result.weakPoints.map((item, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-2 rounded-lg px-3 py-2 text-xs"
                            style={{
                              background: "rgba(239,68,68,0.07)",
                              color: "var(--danger)",
                              border: "1px solid rgba(239,68,68,0.15)",
                            }}
                          >
                            <span style={{ flexShrink: 0 }}>{">"}</span>
                            <span className="leading-relaxed">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="glass-card p-4 flex flex-col gap-3">
                      <h3 className="text-xs uppercase tracking-wider font-semibold flex items-center gap-1.5" style={{ color: "var(--success)" }}>
                        <Lightbulb size={13} /> Sugerencias
                      </h3>
                      <div className="flex flex-col gap-2">
                        {result.suggestions.map((item, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-2 rounded-lg px-3 py-2 text-xs"
                            style={{
                              background: "rgba(34,197,94,0.07)",
                              color: "var(--success)",
                              border: "1px solid rgba(34,197,94,0.15)",
                            }}
                          >
                            <span style={{ flexShrink: 0 }}>{">"}</span>
                            <span className="leading-relaxed">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button className="btn-secondary w-full max-w-sm" onClick={reset}>
                    Nueva Revision
                  </button>
                </div>
              )}
            </div>

            {/* Right: Side panel */}
            {selectedMember && selectedBuild && (
              <aside className="flex flex-col gap-4 lg:w-72 xl:w-80 lg:flex-shrink-0 lg:sticky lg:top-20 animate-fade-in">
                <BuildCard
                  pokemon={selectedMember}
                  build={selectedBuild}
                  aiRole={selectedMember.rol}
                  onClose={() => setSelectedPokemon(null)}
                />
                {result?.pokemonRatings?.[selectedMember.nombre] && (
                  <div
                    className="glass-card p-3 flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                        Rating Individual
                      </span>
                      <span
                        className="text-lg font-black tabular-nums"
                        style={{
                          color:
                            result.pokemonRatings[selectedMember.nombre].score >= 75
                              ? "var(--success)"
                              : result.pokemonRatings[selectedMember.nombre].score >= 50
                              ? "var(--warning)"
                              : "var(--danger)",
                        }}
                      >
                        {result.pokemonRatings[selectedMember.nombre].score}
                      </span>
                    </div>
                    <StatBar
                      label=""
                      value={result.pokemonRatings[selectedMember.nombre].score}
                      max={100}
                      showValue={false}
                      animated
                    />
                    <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                      {result.pokemonRatings[selectedMember.nombre].comment}
                    </p>
                  </div>
                )}
              </aside>
            )}
          </div>
        )}
      </div>

      {/* Weakness Matrix Modal */}
      {showMatrix && weaknessProfile && (
        <WeaknessMatrix
          profile={weaknessProfile}
          onClose={() => setShowMatrix(false)}
        />
      )}
    </div>
  );
}
