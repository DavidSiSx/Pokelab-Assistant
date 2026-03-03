"use client";

import { useState } from "react";
import { useBuilder } from "@/hooks/useBuilder";
import { useTeams } from "@/hooks/useTeams";
import { useAuth } from "@/providers/AuthProvider";
import type { TeamMember } from "@/types/pokemon";
import { TeamSlot } from "@/components/pokemon/TeamSlot";
import { BuildCard } from "@/components/pokemon/BuildCard";
import { AiReportPanel } from "@/components/pokemon/AiReportPanel";
import { BuilderConfigPanel } from "@/components/builder/BuilderConfigPanel";
import { FeedbackPanel } from "@/components/builder/FeedbackPanel";
import { LeaderSearch } from "@/components/builder/LeaderSearch";
import { SaveTeamModal } from "@/components/builder/SaveTeamModal";
import { EmptyState } from "@/components/ui/EmptyState";

export function BuilderView() {
  const {
    team, lockedSlots, builds, config, aiReport, blacklist, feedback,
    loading, error,
    generateTeam, setSlot, lockSlot, setConfig, setFeedback,
    addToBlacklist, clearBlacklist, reset,
  } = useBuilder();

  const { saveTeam, saving } = useTeams();
  const { user } = useAuth();

  const [leader, setLeader] = useState<TeamMember | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const hasTeam = team.some((s) => s !== null);
  const selectedPokemon = selectedSlot !== null ? team[selectedSlot] : null;
  const selectedBuild = selectedPokemon ? builds[String(selectedPokemon.id)] : undefined;

  async function handleSave(nombre: string, descripcion: string, isPublic: boolean) {
    const teamMembers = team.filter(Boolean) as TeamMember[];
    await saveTeam({
      nombre,
      descripcion,
      team: teamMembers,
      builds,
      config,
      aiReport: aiReport ?? undefined,
      isPublic,
      formato: config.format,
    });
    setShowSaveModal(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  }

  function handleRemoveSlot(index: number) {
    setSlot(index, null);
    if (selectedSlot === index) setSelectedSlot(null);
  }

  // Showdown export
  function exportToShowdown() {
    const lines: string[] = [];
    team.forEach((p) => {
      if (!p) return;
      const b = builds[String(p.id)];
      lines.push(`${p.nombre}${b?.item ? ` @ ${b.item}` : ""}`);
      if (b?.ability) lines.push(`Ability: ${b.ability}`);
      if (b?.tera_type) lines.push(`Tera Type: ${b.tera_type}`);
      const evParts = [];
      if (b?.ev_hp)  evParts.push(`${b.ev_hp} HP`);
      if (b?.ev_atk) evParts.push(`${b.ev_atk} Atk`);
      if (b?.ev_def) evParts.push(`${b.ev_def} Def`);
      if (b?.ev_spa) evParts.push(`${b.ev_spa} SpA`);
      if (b?.ev_spd) evParts.push(`${b.ev_spd} SpD`);
      if (b?.ev_spe) evParts.push(`${b.ev_spe} Spe`);
      if (evParts.length) lines.push(`EVs: ${evParts.join(" / ")}`);
      if (b?.nature) lines.push(`${b.nature} Nature`);
      b?.moves?.filter(Boolean).forEach((m) => lines.push(`- ${m}`));
      lines.push("");
    });
    return lines.join("\n");
  }

  function copyShowdown() {
    navigator.clipboard.writeText(exportToShowdown());
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6 flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1
          className="font-bold text-balance"
          style={{ color: "var(--text-primary)", fontSize: "clamp(1.25rem,3vw,1.75rem)" }}
        >
          Team Builder
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
          Genera un equipo desde cero o elige un líder para construir alrededor de él.
        </p>
      </div>

      {/* Main layout: left panel + right detail */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">

        {/* ── Left: config + leader + generate ── */}
        <div className="flex flex-col gap-4 lg:w-80 lg:flex-shrink-0">
          <BuilderConfigPanel config={config} onChange={setConfig} />

          <div className="flex flex-col gap-2">
            <span
              className="text-xs uppercase tracking-wider font-semibold px-1"
              style={{ color: "var(--text-muted)" }}
            >
              Líder del Equipo (opcional)
            </span>
            <LeaderSearch
              selected={leader}
              onSelect={setLeader}
              onClear={() => setLeader(null)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <button
              className="btn-primary w-full animate-pulse-glow"
              onClick={() => generateTeam(leader)}
              disabled={loading}
              style={{ fontSize: "0.9rem", padding: "12px" }}
            >
              {loading
                ? "Generando equipo..."
                : leader
                ? `Construir alrededor de ${leader.nombre}`
                : "Generar Equipo desde Cero"}
            </button>
            {hasTeam && (
              <button
                className="btn-secondary w-full"
                onClick={reset}
                disabled={loading}
              >
                Resetear
              </button>
            )}
          </div>

          {error && (
            <div
              className="rounded-xl px-4 py-3 text-sm animate-slide-up"
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

          {saveSuccess && (
            <div
              className="rounded-xl px-4 py-3 text-sm animate-slide-up"
              style={{
                background: "rgba(34,197,94,0.1)",
                color: "var(--success)",
                border: "1px solid rgba(34,197,94,0.25)",
              }}
              role="status"
            >
              Equipo guardado correctamente.
            </div>
          )}

          {/* Feedback panel */}
          <FeedbackPanel
            feedback={feedback}
            blacklist={blacklist}
            onFeedbackChange={setFeedback}
            onRegenerate={() => generateTeam(leader)}
            onClearBlacklist={clearBlacklist}
            loading={loading}
            hasTeam={hasTeam}
          />
        </div>

        {/* ── Center: team grid ── */}
        <div className="flex-1 flex flex-col gap-4">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 stagger-children">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton rounded-xl" style={{ height: 90 }} />
              ))}
            </div>
          ) : hasTeam ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 stagger-children">
                {team.map((pokemon, i) => (
                  <TeamSlot
                    key={i}
                    index={i}
                    pokemon={pokemon}
                    build={pokemon ? builds[String(pokemon.id)] : undefined}
                    locked={lockedSlots[i]}
                    selected={selectedSlot === i}
                    onLock={lockSlot}
                    onSelect={setSelectedSlot}
                    onRemove={handleRemoveSlot}
                  />
                ))}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-1">
                {user ? (
                  <button
                    className="btn-primary"
                    onClick={() => setShowSaveModal(true)}
                  >
                    Guardar Equipo
                  </button>
                ) : (
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                    Inicia sesión para guardar equipos
                  </span>
                )}
                <button className="btn-secondary" onClick={copyShowdown}>
                  Copiar Showdown
                </button>
              </div>
            </>
          ) : (
            <EmptyState
              icon="🎮"
              title="Aún no hay equipo"
              description="Configura tus opciones y presiona Generar para crear tu equipo competitivo."
            />
          )}
        </div>

        {/* ── Right: build detail ── */}
        <div className="flex flex-col gap-4 lg:w-80 lg:flex-shrink-0">
          {selectedPokemon && selectedBuild ? (
            <BuildCard
              pokemon={selectedPokemon}
              build={selectedBuild}
              aiRole={selectedPokemon.rol}
              onClose={() => setSelectedSlot(null)}
            />
          ) : (
            hasTeam && (
              <div
                className="card p-6 flex flex-col items-center gap-2 opacity-60"
                style={{ borderStyle: "dashed" }}
              >
                <span style={{ fontSize: "2rem" }}>👆</span>
                <p
                  className="text-sm text-center"
                  style={{ color: "var(--text-muted)" }}
                >
                  Selecciona un Pokémon para ver su build
                </p>
              </div>
            )
          )}

          {aiReport && <AiReportPanel report={aiReport} />}
        </div>
      </div>

      {showSaveModal && (
        <SaveTeamModal
          onSave={handleSave}
          onClose={() => setShowSaveModal(false)}
          saving={saving}
        />
      )}
    </div>
  );
}
