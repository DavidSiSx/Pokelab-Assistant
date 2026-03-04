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
  ChevronDown, ChevronUp, AlertTriangle,
} from "lucide-react";

type BuildMode = "leader" | "scratch";

const LS_KEY = "pokelab_builder_state";

function loadSaved() {
  if (typeof window === "undefined") return null;
  try { const raw = localStorage.getItem(LS_KEY); return raw ? JSON.parse(raw) : null; }
  catch { return null; }
}
function saveToDisk(data: object) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(LS_KEY, JSON.stringify(data)); } catch {}
}

// FIX: Exportación Showdown correcta con IVs y formato estándar Pokémon Showdown
function buildShowdownExport(team: TeamMember[], builds: Record<string, any>): string {
  return team.map((p) => {
    const b = builds[String(p.id)] ?? {};
    const lines: string[] = [];
    lines.push(`${p.nombre}${b.item ? ` @ ${b.item}` : ""}`);
    if (b.ability)   lines.push(`Ability: ${b.ability}`);
    if (b.shiny)     lines.push("Shiny: Yes");
    if (b.tera_type) lines.push(`Tera Type: ${b.tera_type}`);
    const evParts = [
      b.ev_hp  && `${b.ev_hp} HP`,  b.ev_atk && `${b.ev_atk} Atk`,
      b.ev_def && `${b.ev_def} Def`, b.ev_spa && `${b.ev_spa} SpA`,
      b.ev_spd && `${b.ev_spd} SpD`, b.ev_spe && `${b.ev_spe} Spe`,
    ].filter(Boolean);
    if (evParts.length) lines.push(`EVs: ${evParts.join(" / ")}`);
    if (b.nature) lines.push(`${b.nature} Nature`);
    const ivParts = [
      b.iv_hp  != null && b.iv_hp  !== 31 && `${b.iv_hp} HP`,
      b.iv_atk != null && b.iv_atk !== 31 && `${b.iv_atk} Atk`,
      b.iv_def != null && b.iv_def !== 31 && `${b.iv_def} Def`,
      b.iv_spa != null && b.iv_spa !== 31 && `${b.iv_spa} SpA`,
      b.iv_spd != null && b.iv_spd !== 31 && `${b.iv_spd} SpD`,
      b.iv_spe != null && b.iv_spe !== 31 && `${b.iv_spe} Spe`,
    ].filter(Boolean);
    if (ivParts.length) lines.push(`IVs: ${ivParts.join(" / ")}`);
    (b.moves ?? []).filter(Boolean).forEach((m: string) => lines.push(`- ${m}`));
    return lines.join("\n");
  }).join("\n\n");
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

  const saved = useMemo(() => loadSaved(), []);
  const [mode, setMode]           = useState<BuildMode>(saved?.mode ?? "leader");
  const [leader, setLeader]       = useState<TeamMember | null>(saved?.leader ?? null);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveSuccess, setSaveSuccess]    = useState(false);
  const [saveError, setSaveError]        = useState<string | null>(null);
  const [showMatrix, setShowMatrix]      = useState(false);
  const [copied, setCopied]              = useState(false);
  const [sidebarOpen, setSidebarOpen]    = useState(false);

  useEffect(() => { saveToDisk({ mode, leader }); }, [mode, leader]);

  const hasTeam = team.some((s) => s !== null);
  const selectedPokemon = selectedSlot !== null ? team[selectedSlot] : null;
  const selectedBuild   = selectedPokemon ? builds[String(selectedPokemon.id)] : undefined;
  const filledTeam      = useMemo(() => team.filter(Boolean) as TeamMember[], [team]);
  const weaknessProfile = useMemo(() => filledTeam.length > 0 ? getTeamWeaknessProfile(filledTeam) : null, [filledTeam]);

  // FIX: Validación monotype — el líder debe tener el tipo monoType seleccionado
  const leaderMonotypeWarning = useMemo(() => {
    if (!config.isMonotype || !config.monoTypeSelected || !leader) return null;
    const mono = config.monoTypeSelected.toLowerCase();
    const t1 = (leader.tipo1 ?? "").toLowerCase();
    const t2 = (leader.tipo2 ?? "").toLowerCase();
    if (t1 !== mono && t2 !== mono) {
      return `⚠️ ${leader.nombre} no es de tipo ${config.monoTypeSelected}. El líder debe ser del mismo tipo que el equipo.`;
    }
    return null;
  }, [leader, config.isMonotype, config.monoTypeSelected]);

  // FIX: Justificación por Pokémon desde aiReport.perPokemon
  const selectedJustification = useMemo(() => {
    if (!selectedPokemon || !aiReport) return null;
    const nombre = selectedPokemon.nombre.toLowerCase();
    const perPoke: any[] = (aiReport as any).perPokemon ?? [];
    const match = perPoke.find((p: any) => (p.name ?? p.nombre ?? "").toLowerCase() === nombre);
    if (match) return {
      role: match.role ?? selectedPokemon.rol ?? "",
      counters: match.counters ?? [],
      threatens: match.threatens ?? [],
      synergy: match.synergyWith ?? [],
    };
    return null;
  }, [selectedPokemon, aiReport]);

  function handleClearLeader() { setLeader(null); setSelectedSlot(null); }

  async function handleGenerate(feedbackOverride?: string) {
    setSelectedSlot(null);
    await generateTeam(mode === "leader" ? leader : null, feedbackOverride);
  }

  function handleReset() { reset(); setSelectedSlot(null); setSaveSuccess(false); setSaveError(null); }

  // FIX: handleSave recibe y pasa isPublic — antes ignoraba ese tercer parámetro
  async function handleSave(nombre: string, descripcion: string, isPublic: boolean) {
    if (!hasTeam) return;
    setSaveError(null);
    try {
      await saveTeam({ nombre, descripcion, isPublic, team: filledTeam, builds, config, aiReport: aiReport ?? undefined } as any);
      setSaveSuccess(true);
      setShowSaveModal(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e: any) {
      setSaveError(e?.message ?? "Error al guardar el equipo");
    }
  }

  // FIX: exportación Showdown con IVs y formato correcto
  function handleCopy() {
    navigator.clipboard.writeText(buildShowdownExport(filledTeam, builds));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="relative w-full min-h-screen">
      <PokeballPatternDense />

      <div className="relative z-[1] w-full max-w-screen-2xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 flex flex-col gap-4"
        style={{ paddingBottom: 96 }}>

        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "var(--accent-glow)", border: "1px solid var(--accent)" }}>
              <Wand2 size={18} style={{ color: "var(--accent)" }} />
            </div>
            <div>
              <h1 className="font-bold text-base sm:text-xl leading-tight" style={{ color: "var(--text-primary)" }}>Team Builder</h1>
              <p className="text-xs hidden sm:block" style={{ color: "var(--text-muted)" }}>Crea tu equipo competitivo con IA</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {hasTeam && (
              <>
                <button className="btn-ghost py-2 px-3 text-xs flex items-center gap-1.5" onClick={handleCopy}>
                  <ClipboardCopy size={13} />
                  <span className="hidden sm:inline">{copied ? "¡Copiado!" : "Exportar"}</span>
                </button>
                {user && (
                  <button className="btn-secondary py-2 px-3 text-xs flex items-center gap-1.5"
                    onClick={() => { setSaveError(null); setShowSaveModal(true); }} disabled={saving}>
                    <Save size={13} />
                    <span className="hidden sm:inline">{saving ? "Guardando…" : saveSuccess ? "¡Guardado!" : "Guardar"}</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Mode selector */}
        <div className="flex gap-1 p-1 rounded-xl self-start"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
          {(["leader", "scratch"] as BuildMode[]).map((m) => (
            <button key={m} onClick={() => { setMode(m); if (m === "scratch") handleClearLeader(); }}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200"
              style={{
                background: mode === m ? "var(--accent)" : "transparent",
                color: mode === m ? "#fff" : "var(--text-secondary)",
                border: "none", cursor: "pointer",
              }}>
              {m === "leader" ? <><Crown size={13} /><span>Con Líder</span></> : <><Sparkles size={13} /><span>Desde Cero</span></>}
            </button>
          ))}
        </div>

        <div className="flex flex-col lg:grid lg:grid-cols-[300px_1fr] gap-4 lg:gap-5 items-start">

          {/* Sidebar */}
          <div className="flex flex-col gap-3">
            <button className="lg:hidden flex items-center justify-between w-full px-4 py-3 rounded-xl"
              style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
              onClick={() => setSidebarOpen(!sidebarOpen)}>
              <span className="text-sm font-semibold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                <Dices size={15} style={{ color: "var(--accent)" }} /> Configuración
              </span>
              {sidebarOpen ? <ChevronUp size={15} style={{ color: "var(--text-muted)" }} /> : <ChevronDown size={15} style={{ color: "var(--text-muted)" }} />}
            </button>

            <div className={`flex flex-col gap-3 ${sidebarOpen ? "flex" : "hidden"} lg:flex`}>
              <div className="lg:sticky" style={{ top: 80, display: "flex", flexDirection: "column", gap: 12 }}>
                <BuilderConfigPanel config={config} onChange={setConfig} />

                {mode === "leader" && (
                  <div className="flex flex-col gap-1.5 animate-fade-in">
                    <span className="text-[0.6rem] uppercase tracking-widest font-bold px-0.5"
                      style={{ color: "var(--text-muted)" }}>Líder del Equipo</span>
                    <LeaderSearch
                      selected={leader}
                      onSelect={(p) => !loading && setLeader(p)}
                      onClear={handleClearLeader}
                      disabled={loading}
                    />
                    {/* FIX: advertencia monotype */}
                    {leaderMonotypeWarning && (
                      <div className="flex items-start gap-2 px-3 py-2 rounded-lg text-xs animate-fade-in"
                        style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "var(--danger)" }}>
                        <AlertTriangle size={12} style={{ flexShrink: 0, marginTop: 1 }} />
                        {leaderMonotypeWarning}
                      </div>
                    )}
                  </div>
                )}

                <button
                  className="btn-primary w-full animate-pulse-glow"
                  onClick={() => handleGenerate()}
                  disabled={loading || (mode === "leader" && !leader) || !!leaderMonotypeWarning}
                  style={{ padding: "12px 16px", fontSize: "0.9rem" }}>
                  {loading ? (
                    <><Pokeball size={16} className="animate-rotate-pokeball" /> Generando…</>
                  ) : mode === "leader" ? (
                    <><Crown size={15} />{leader ? `Construir con ${leader.nombre}` : "Elige un Líder"}</>
                  ) : (
                    <><Sparkles size={15} /> Generar Equipo</>
                  )}
                </button>

                {hasTeam && (
                  <button className="btn-secondary w-full" onClick={handleReset} disabled={loading}>
                    <RotateCcw size={13} /> Resetear
                  </button>
                )}

                {/* FIX: FeedbackPanel ya existía pero estaba dentro del bloque collapsible y requiere hasTeam */}
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
            </div>
          </div>

          {/* Main content */}
          <div className="flex flex-col gap-4 min-w-0">

            {error && (
              <div className="rounded-xl px-4 py-3 text-sm animate-bounce-in"
                style={{ background: "rgba(239,68,68,0.1)", color: "var(--danger)", border: "1px solid rgba(239,68,68,0.25)" }}>
                {error}
              </div>
            )}

            {saveError && (
              <div className="rounded-xl px-4 py-3 text-sm animate-bounce-in"
                style={{ background: "rgba(239,68,68,0.1)", color: "var(--danger)", border: "1px solid rgba(239,68,68,0.25)" }}>
                Error al guardar: {saveError}
              </div>
            )}

            {/* Team grid */}
            <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-6 xl:grid-cols-3 gap-2 sm:gap-3">
              {team.map((pokemon, i) => (
                <TeamSlot
                  key={i} index={i} pokemon={pokemon}
                  build={pokemon ? builds[String(pokemon.id)] : undefined}
                  locked={lockedSlots[i]}
                  selected={selectedSlot === i}
                  onSelect={() => setSelectedSlot(selectedSlot === i ? null : i)}
                  onLock={(locked) => lockSlot(i, locked)}
                  onRemove={() => { setSlot(i, null); if (selectedSlot === i) setSelectedSlot(null); }}
                  onBlacklist={(name) => addToBlacklist(name)}
                  loading={loading}
                />
              ))}
            </div>

            {/* Weakness bar */}
            {weaknessProfile && hasTeam && (
              <div className="glass-card p-3 sm:p-4 flex flex-col gap-3 animate-slide-up">
                <div className="flex items-center justify-between">
                  <span className="text-[0.65rem] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                    Cobertura Defensiva
                  </span>
                  <button onClick={() => setShowMatrix(true)} className="btn-ghost py-1 px-2 text-xs flex items-center gap-1">
                    Ver Matriz
                  </button>
                </div>
                <WeaknessBar profile={weaknessProfile} onOpenMatrix={() => setShowMatrix(true)} />
              </div>
            )}

            {loading && !hasTeam ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 stagger-children">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="skeleton rounded-xl" style={{ height: 120 }} />
                ))}
              </div>
            ) : null}

            {/* BuildCard + Justificación + AiReportPanel */}
            {(selectedPokemon || (hasTeam && aiReport)) && (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

                {selectedPokemon && selectedBuild && (
                  <div className="flex flex-col gap-3">
                    <BuildCard
                      pokemon={selectedPokemon}
                      build={selectedBuild}
                      aiRole={selectedPokemon.rol}
                      isLeader={mode === "leader" && selectedSlot === 0}
                      onClose={() => setSelectedSlot(null)}
                    />

                    {/* FIX: Justificación del Pokémon en el equipo */}
                    {selectedJustification && (
                      <div className="glass-card p-4 flex flex-col gap-2 animate-fade-in"
                        style={{ border: "1px solid var(--accent)33" }}>
                        <span className="text-[0.6rem] uppercase tracking-wider font-bold"
                          style={{ color: "var(--accent-light)" }}>
                          💡 Por qué {selectedPokemon.nombre} en este equipo
                        </span>
                        {selectedJustification.role && (
                          <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                            Rol: {selectedJustification.role}
                          </p>
                        )}
                        {selectedJustification.synergy.length > 0 && (
                          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                            <span style={{ color: "var(--text-muted)" }}>Sinergia con: </span>
                            {selectedJustification.synergy.join(", ")}
                          </p>
                        )}
                        {selectedJustification.threatens.length > 0 && (
                          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                            <span style={{ color: "var(--text-muted)" }}>Amenaza a: </span>
                            {selectedJustification.threatens.join(", ")}
                          </p>
                        )}
                        {selectedJustification.counters.length > 0 && (
                          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                            <span style={{ color: "var(--text-muted)" }}>Contrarrestado por: </span>
                            {selectedJustification.counters.join(", ")}
                          </p>
                        )}
                      </div>
                    )}
                    {/* Fallback: mostrar solo el rol si no hay perPokemon */}
                    {!selectedJustification && selectedPokemon.rol && (
                      <div className="glass-card px-4 py-3 animate-fade-in"
                        style={{ border: "1px solid var(--accent)22" }}>
                        <span className="text-[0.6rem] uppercase tracking-wider font-bold block mb-1"
                          style={{ color: "var(--accent-light)" }}>💡 Rol en el equipo</span>
                        <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{selectedPokemon.rol}</p>
                      </div>
                    )}
                  </div>
                )}

                {aiReport && <AiReportPanel report={aiReport} />}
              </div>
            )}

            {!hasTeam && !loading && (
              <EmptyState
                icon={<Wand2 size={32} />}
                title="Listo para construir"
                description={
                  mode === "leader"
                    ? "Elige un Pokémon líder arriba y presiona Construir."
                    : "Presiona Generar Equipo para crear tu equipo desde cero con IA."
                }
              />
            )}
          </div>
        </div>
      </div>

      {showMatrix && weaknessProfile && (
        <WeaknessMatrix profile={weaknessProfile} onClose={() => setShowMatrix(false)} />
      )}
      {showSaveModal && (
        <SaveTeamModal onSave={handleSave} onClose={() => setShowSaveModal(false)} saving={saving} />
      )}
    </div>
  );
}