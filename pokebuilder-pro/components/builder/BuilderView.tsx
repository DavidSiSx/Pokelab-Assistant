"use client";

import { useState, useMemo, useEffect } from "react";
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
import { WeaknessBar } from "@/components/builder/WeaknessBar";
import { WeaknessMatrix } from "@/components/builder/WeaknessMatrix";
import { EmptyState } from "@/components/ui/EmptyState";
import { PokeballPatternDense, Pokeball } from "@/components/ui/PokeballBg";
import { getTeamWeaknessProfile } from "@/utils/type-chart";
import {
  Wand2, RotateCcw, Save, ClipboardCopy, Sparkles, Crown, Dices,
} from "lucide-react";

type BuildMode = "leader" | "scratch";

const LS_KEY = "pokelab_builder_state";

function loadSaved() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveToDisk(data: object) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(LS_KEY, JSON.stringify(data)); } catch {}
}

export function BuilderView() {
  const {
    team, lockedSlots, builds, config, aiReport, blacklist, feedback,
    loading, error,
    generateTeam, setSlot, lockSlot, setConfig, setFeedback,
    addToBlacklist, clearBlacklist, reset,
  } = useBuilder();

  const { saveTeam, saving } = useTeams();
  const { user } = useAuth();

  // ── Restore persisted state ──────────────────────────────
  const saved = useMemo(() => loadSaved(), []);
  const [mode, setMode] = useState<BuildMode>(saved?.mode ?? "leader");
  const [leader, setLeader] = useState<TeamMember | null>(saved?.leader ?? null);

  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showMatrix, setShowMatrix] = useState(false);
  const [copied, setCopied] = useState(false);

  // ── Persist mode + leader ────────────────────────────────
  useEffect(() => {
    saveToDisk({ mode, leader });
  }, [mode, leader]);

  const hasTeam = team.some((s) => s !== null);
  const selectedPokemon = selectedSlot !== null ? team[selectedSlot] : null;
  const selectedBuild = selectedPokemon ? builds[String(selectedPokemon.id)] : undefined;

  const filledTeam = useMemo(() => team.filter(Boolean) as TeamMember[], [team]);
  const weaknessProfile = useMemo(
    () => filledTeam.length > 0 ? getTeamWeaknessProfile(filledTeam) : null,
    [filledTeam]
  );

  async function handleSave(nombre: string, descripcion: string, isPublic: boolean) {
    const teamMembers = team.filter(Boolean) as TeamMember[];
    await saveTeam({
      nombre, descripcion,
      team: teamMembers,
      builds, config,
      aiReport: aiReport ?? undefined,
      isPublic,
    });
    setShowSaveModal(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  }

  function handleRemoveSlot(index: number) {
    // Slot 0 (líder) no se puede quitar mientras genera o está fijado
    if (loading) return;
    setSlot(index, null);
    if (selectedSlot === index) setSelectedSlot(null);
  }

  function handleClearLeader() {
    if (loading) return;
    setLeader(null);
  }

  function handleGenerate() {
    generateTeam(mode === "leader" ? leader : null);
  }

  function handleReset() {
    reset();
    setSelectedSlot(null);
  }

  function exportToShowdown() {
    const lines: string[] = [];
    team.forEach((p) => {
      if (!p) return;
      const b = builds[String(p.id)];
      lines.push(`${p.nombre}${b?.item ? ` @ ${b.item}` : ""}`);
      if (b?.ability) lines.push(`Ability: ${b.ability}`);
      if (b?.tera_type) lines.push(`Tera Type: ${b.tera_type}`);
      const evParts = [
        b?.ev_hp  && `${b.ev_hp} HP`,
        b?.ev_atk && `${b.ev_atk} Atk`,
        b?.ev_def && `${b.ev_def} Def`,
        b?.ev_spa && `${b.ev_spa} SpA`,
        b?.ev_spd && `${b.ev_spd} SpD`,
        b?.ev_spe && `${b.ev_spe} Spe`,
      ].filter(Boolean);
      if (evParts.length) lines.push(`EVs: ${evParts.join(" / ")}`);
      if (b?.nature) lines.push(`${b.nature} Nature`);
      b?.moves?.filter(Boolean).forEach((m) => lines.push(`- ${m}`));
      lines.push("");
    });
    return lines.join("\n");
  }

  function copyShowdown() {
    navigator.clipboard.writeText(exportToShowdown());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="relative w-full">
      {/* Fondo animado — solo en builder */}
      <PokeballPatternDense />

      <div
        className="relative z-[1] w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-5"
        style={{ paddingBottom: 96 }} /* margen para bottom nav */
      >

        {/* ── Header ── */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "var(--accent-glow)", border: "1px solid var(--accent)" }}
            >
              <Pokeball size={22} />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight" style={{ color: "var(--text-primary)" }}>
                Team Builder
              </h1>
              <p className="text-xs leading-snug" style={{ color: "var(--text-muted)" }}>
                Configura y genera tu equipo competitivo con IA
              </p>
            </div>
          </div>

          {hasTeam && (
            <div className="flex gap-2 flex-shrink-0">
              {user && (
                <button className="btn-primary text-xs" onClick={() => setShowSaveModal(true)}>
                  <Save size={13} /> Guardar
                </button>
              )}
              <button className="btn-secondary text-xs" onClick={copyShowdown}>
                <ClipboardCopy size={13} />
                {copied ? "¡Copiado!" : "Showdown"}
              </button>
            </div>
          )}
        </div>

        {/* ── Mode Toggle ── */}
        <div
          className="flex gap-1 p-1 rounded-xl w-fit"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
        >
          {(["leader", "scratch"] as const).map((m) => (
            <button
              key={m}
              onClick={() => !loading && setMode(m)}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
              style={{
                background: mode === m ? "var(--accent)" : "transparent",
                color: mode === m ? "#fff" : "var(--text-secondary)",
                boxShadow: mode === m ? "0 2px 12px var(--accent-glow)" : "none",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading && mode !== m ? 0.5 : 1,
              }}
            >
              {m === "leader" ? <Crown size={14} /> : <Dices size={14} />}
              {m === "leader" ? "Con Líder" : "Desde Cero"}
            </button>
          ))}
        </div>

        {/* ── Alerts ── */}
        {error && (
          <div className="rounded-xl px-4 py-3 text-sm animate-slide-up" role="alert"
            style={{ background: "rgba(239,68,68,0.08)", color: "var(--danger)", border: "1px solid rgba(239,68,68,0.2)" }}>
            {error}
          </div>
        )}
        {saveSuccess && (
          <div className="rounded-xl px-4 py-3 text-sm animate-slide-up" role="status"
            style={{ background: "rgba(34,197,94,0.08)", color: "var(--success)", border: "1px solid rgba(34,197,94,0.2)" }}>
            ✓ Equipo guardado correctamente.
          </div>
        )}

        {/* ── Main Layout ── */}
        <div className="grid gap-5" style={{ gridTemplateColumns: "280px 1fr", alignItems: "start" }}>

          {/* ── Left sidebar ── */}
          <div
            className="flex flex-col gap-3"
            style={{
              position: "sticky",
              top: 80,
              maxHeight: "calc(100vh - 100px)",
              overflowY: "auto",
              scrollbarWidth: "none",
              paddingBottom: 80,
            }}
          >
            <BuilderConfigPanel config={config} onChange={setConfig} />

            {mode === "leader" && (
              <div className="flex flex-col gap-1.5 animate-fade-in">
                <span className="text-[0.6rem] uppercase tracking-widest font-bold px-0.5"
                  style={{ color: "var(--text-muted)" }}>
                  Líder del Equipo
                </span>
                <LeaderSearch
                  selected={leader}
                  onSelect={(p) => !loading && setLeader(p)}
                  onClear={handleClearLeader}
                  disabled={loading}
                />
              </div>
            )}

            <button
              className="btn-primary w-full animate-pulse-glow"
              onClick={handleGenerate}
              disabled={loading || (mode === "leader" && !leader)}
              style={{ padding: "11px 16px" }}
            >
              {loading ? (
                <><Pokeball size={16} className="animate-rotate-pokeball" /> Generando...</>
              ) : mode === "leader" ? (
                <><Crown size={15} />{leader ? `Construir con ${leader.nombre}` : "Elige un Líder"}</>
              ) : (
                <><Sparkles size={15} /> Generar Equipo Completo</>
              )}
            </button>

            {hasTeam && (
              <button
                className="btn-secondary w-full"
                onClick={handleReset}
                disabled={loading}
              >
                <RotateCcw size={13} /> Resetear
              </button>
            )}

            <FeedbackPanel
              feedback={feedback}
              blacklist={blacklist}
              onFeedbackChange={setFeedback}
              onRegenerate={handleGenerate}
              onClearBlacklist={clearBlacklist}
              loading={loading}
              hasTeam={hasTeam}
            />
          </div>

          {/* ── Center + Right ── */}
          <div className="flex flex-col gap-4 min-w-0">

            {loading && !hasTeam ? (
              <div className="grid grid-cols-2 xl:grid-cols-3 gap-3 stagger-children">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="skeleton rounded-xl" style={{ height: 130 }} />
                ))}
              </div>
            ) : hasTeam ? (
              <div className="grid grid-cols-2 xl:grid-cols-3 gap-3 stagger-children">
                {team.map((pokemon, i) => (
                  <TeamSlot
                    key={i}
                    index={i}
                    pokemon={pokemon}
                    build={pokemon ? builds[String(pokemon.id)] : undefined}
                    locked={lockedSlots[i]}
                    selected={selectedSlot === i}
                    isLeader={mode === "leader" && i === 0 && !!pokemon}
                    // Deshabilitar remove en slot 0 (líder) mientras genera
                    // y en todos los slots durante generación
                    onLock={loading ? undefined : lockSlot}
                    onSelect={setSelectedSlot}
                    onRemove={loading ? undefined : handleRemoveSlot}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Wand2 size={28} />}
                title={mode === "scratch" ? "Modo Desde Cero" : "Elige un Líder"}
                description={
                  mode === "scratch"
                    ? "Presiona Generar para crear un equipo completo de 6 con IA."
                    : "Selecciona un Pokémon líder y presiona Construir para armar tu equipo."
                }
              />
            )}

            {/* Loading overlay sobre el team existente */}
            {loading && hasTeam && (
              <div
                className="rounded-xl px-4 py-3 text-sm flex items-center gap-3 animate-fade-in"
                style={{
                  background: "var(--accent-glow)",
                  border: "1px solid var(--accent)",
                  color: "var(--accent-light)",
                }}
              >
                <Pokeball size={16} className="animate-rotate-pokeball" />
                Regenerando equipo con nuevo feedback…
              </div>
            )}

            {weaknessProfile && hasTeam && (
              <WeaknessBar profile={weaknessProfile} onOpenMatrix={() => setShowMatrix(true)} />
            )}

            {!user && hasTeam && (
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Inicia sesión para guardar equipos.
              </p>
            )}

            {(selectedPokemon || (hasTeam && aiReport)) && (
              <div
                className="grid gap-4"
                style={{ gridTemplateColumns: selectedPokemon && aiReport ? "1fr 1fr" : "1fr" }}
              >
                {selectedPokemon && selectedBuild && (
                  <BuildCard
                    pokemon={selectedPokemon}
                    build={selectedBuild}
                    aiRole={selectedPokemon.rol}
                    isLeader={mode === "leader" && selectedSlot === 0}
                    onClose={() => setSelectedSlot(null)}
                  />
                )}
                {aiReport && <AiReportPanel report={aiReport} />}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showMatrix && weaknessProfile && (
        <WeaknessMatrix profile={weaknessProfile} onClose={() => setShowMatrix(false)} />
      )}
      {showSaveModal && (
        <SaveTeamModal onSave={handleSave} onClose={() => setShowSaveModal(false)} saving={saving} />
      )}
    </div>
  );
}