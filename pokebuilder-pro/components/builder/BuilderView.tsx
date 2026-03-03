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
import { Wand2, RotateCcw, Save, ClipboardCopy, Sparkles } from "lucide-react";

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
    <div className="w-full max-w-7xl mx-auto px-4 py-8 flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "var(--accent-glow)", border: "1px solid var(--accent)" }}
            >
              <Wand2 size={18} style={{ color: "var(--accent)" }} />
            </div>
            <h1
              className="font-bold text-balance"
              style={{ color: "var(--text-primary)", fontSize: "clamp(1.35rem,3vw,1.75rem)" }}
            >
              Team Builder
            </h1>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
            Genera un equipo desde cero o elige un lider para construir alrededor de el.
          </p>
        </div>

        {hasTeam && (
          <div className="flex gap-2">
            {user && (
              <button
                className="btn-primary text-xs flex items-center gap-1.5"
                onClick={() => setShowSaveModal(true)}
              >
                <Save size={14} />
                Guardar
              </button>
            )}
            <button className="btn-secondary text-xs flex items-center gap-1.5" onClick={copyShowdown}>
              <ClipboardCopy size={14} />
              Showdown
            </button>
          </div>
        )}
      </div>

      {error && (
        <div
          className="rounded-xl px-4 py-3 text-sm animate-slide-up"
          style={{
            background: "rgba(239,68,68,0.08)",
            color: "var(--danger)",
            border: "1px solid rgba(239,68,68,0.2)",
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
            background: "rgba(34,197,94,0.08)",
            color: "var(--success)",
            border: "1px solid rgba(34,197,94,0.2)",
          }}
          role="status"
        >
          Equipo guardado correctamente.
        </div>
      )}

      {/* Main layout */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">

        {/* Left sidebar */}
        <aside className="flex flex-col gap-4 lg:w-72 xl:w-80 lg:flex-shrink-0 lg:sticky lg:top-20">
          <BuilderConfigPanel config={config} onChange={setConfig} />

          <div className="flex flex-col gap-2">
            <span
              className="text-[0.65rem] uppercase tracking-widest font-bold px-1"
              style={{ color: "var(--text-muted)" }}
            >
              Lider del Equipo (opcional)
            </span>
            <LeaderSearch
              selected={leader}
              onSelect={setLeader}
              onClear={() => setLeader(null)}
            />
          </div>

          <button
            className="btn-primary w-full flex items-center justify-center gap-2"
            onClick={() => generateTeam(leader)}
            disabled={loading}
            style={{ padding: "12px 16px", fontSize: "0.875rem" }}
          >
            {loading ? (
              <>
                <span
                  className="w-4 h-4 border-2 rounded-full animate-spin"
                  style={{ borderColor: "rgba(255,255,255,0.3)", borderTopColor: "#fff" }}
                />
                Generando...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                {leader
                  ? `Construir con ${leader.nombre}`
                  : "Generar Equipo"}
              </>
            )}
          </button>

          {hasTeam && (
            <button
              className="btn-secondary w-full flex items-center justify-center gap-2"
              onClick={reset}
              disabled={loading}
            >
              <RotateCcw size={14} />
              Resetear
            </button>
          )}

          <FeedbackPanel
            feedback={feedback}
            blacklist={blacklist}
            onFeedbackChange={setFeedback}
            onRegenerate={() => generateTeam(leader)}
            onClearBlacklist={clearBlacklist}
            loading={loading}
            hasTeam={hasTeam}
          />
        </aside>

        {/* Center: team grid */}
        <div className="flex-1 flex flex-col gap-5 min-w-0">
          {loading && !hasTeam ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 stagger-children">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton rounded-xl" style={{ height: 100 }} />
              ))}
            </div>
          ) : hasTeam ? (
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
          ) : (
            <EmptyState
              icon={<Wand2 size={28} />}
              title="Aun no hay equipo"
              description="Configura tus opciones y presiona Generar para crear tu equipo competitivo."
            />
          )}

          {!user && hasTeam && (
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Inicia sesion para guardar equipos.
            </p>
          )}
        </div>

        {/* Right: build detail */}
        {(selectedPokemon || (hasTeam && aiReport)) && (
          <aside className="flex flex-col gap-4 lg:w-72 xl:w-80 lg:flex-shrink-0 lg:sticky lg:top-20">
            {selectedPokemon && selectedBuild && (
              <BuildCard
                pokemon={selectedPokemon}
                build={selectedBuild}
                aiRole={selectedPokemon.rol}
                onClose={() => setSelectedSlot(null)}
              />
            )}
            {aiReport && <AiReportPanel report={aiReport} />}
          </aside>
        )}
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
