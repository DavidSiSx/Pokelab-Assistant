"use client";

import { useState, useMemo, useCallback } from "react";
import { useReview } from "@/hooks/useReview";
import type { TeamMember, Build } from "@/types/pokemon";
import { StatBar } from "@/components/ui/StatBar";
import { PokemonSprite } from "@/components/pokemon/PokemonSprite";
import { BuildCard } from "@/components/pokemon/BuildCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { TypeBadge } from "@/components/ui/TypeBadge";
import { WeaknessBar } from "@/components/builder/WeaknessBar";
import { WeaknessMatrix } from "@/components/builder/WeaknessMatrix";
import { PokeballPattern, Pokeball } from "@/components/ui/PokeballBg";
import { LeaderSearch } from "@/components/builder/LeaderSearch";
import { getTeamWeaknessProfile } from "@/utils/type-chart";
import {
  ShieldCheck, Trophy, TrendingDown, Lightbulb,
  ClipboardCopy, ClipboardPaste, Plus, X, Trash2,
  FileText, Users, ChevronDown,
} from "lucide-react";

/* ── Constants ──────────────────────────────────────────── */
const FORMATS = [
  "VGC 2025 Regulation H",
  "VGC 2024 Regulation G",
  "National Dex",
  "National Dex Doubles",
  "OU Singles",
  "Doubles OU",
  "Little Cup",
  "Ubers",
];

const GRADE_COLOR: Record<string, string> = {
  "A+": "var(--success)", A: "var(--success)", "A-": "var(--success)",
  "B+": "var(--warning)", B: "var(--warning)", "B-": "var(--warning)",
  "C+": "var(--accent)",  C: "var(--accent)",
  D: "var(--danger)", F: "var(--danger)",
};

/* ── Showdown parser ────────────────────────────────────── */
function parseShowdownPaste(paste: string): { team: TeamMember[]; builds: Record<string, Build> } {
  const team: TeamMember[] = [];
  const builds: Record<string, Build> = {};
  const blocks = paste.trim().split(/\n\s*\n/);

  blocks.forEach((block, idx) => {
    const lines = block.trim().split("\n");
    if (!lines[0]) return;
    const firstLine = lines[0].trim();
    const atSplit = firstLine.split(" @ ");
    const rawName = atSplit[0].replace(/\s*\(.*?\)\s*/g, "").trim();
    const item = atSplit[1]?.trim() ?? "";

    let ability = "", nature = "", teraType = "";
    const moves: string[] = [];
    let evHp = 0, evAtk = 0, evDef = 0, evSpa = 0, evSpd = 0, evSpe = 0;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith("Ability:"))    ability  = line.replace("Ability:", "").trim();
      else if (line.endsWith("Nature"))   nature   = line.replace("Nature", "").trim();
      else if (line.startsWith("Tera Type:")) teraType = line.replace("Tera Type:", "").trim();
      else if (line.startsWith("EVs:")) {
        line.replace("EVs:", "").trim().split("/").forEach((p) => {
          const m = p.trim().match(/(\d+)\s*(HP|Atk|Def|SpA|SpD|Spe)/i);
          if (!m) return;
          const v = parseInt(m[1]);
          switch (m[2].toLowerCase()) {
            case "hp": evHp = v; break; case "atk": evAtk = v; break;
            case "def": evDef = v; break; case "spa": evSpa = v; break;
            case "spd": evSpd = v; break; case "spe": evSpe = v; break;
          }
        });
      } else if (line.startsWith("- ")) moves.push(line.slice(2).trim());
    }

    if (!rawName) return;
    const id = Date.now() + idx;
    team.push({ id, nombre: rawName, tipo1: "", tipo2: null });
    builds[String(id)] = { item, ability, nature, moves, tera_type: teraType || undefined,
      ev_hp: evHp, ev_atk: evAtk, ev_def: evDef, ev_spa: evSpa, ev_spd: evSpd, ev_spe: evSpe };
  });

  return { team, builds };
}

function buildShowdownExport(team: TeamMember[], builds: Record<string, Build>): string {
  const lines: string[] = [];
  team.forEach((p) => {
    const b = builds[String(p.id)];
    lines.push(`${p.nombre}${b?.item ? ` @ ${b.item}` : ""}`);
    if (b?.ability) lines.push(`Ability: ${b.ability}`);
    if (b?.tera_type) lines.push(`Tera Type: ${b.tera_type}`);
    const evParts = [
      b?.ev_hp  && `${b.ev_hp} HP`,  b?.ev_atk && `${b.ev_atk} Atk`,
      b?.ev_def && `${b.ev_def} Def`, b?.ev_spa && `${b.ev_spa} SpA`,
      b?.ev_spd && `${b.ev_spd} SpD`, b?.ev_spe && `${b.ev_spe} Spe`,
    ].filter(Boolean);
    if (evParts.length) lines.push(`EVs: ${evParts.join(" / ")}`);
    if (b?.nature) lines.push(`${b.nature} Nature`);
    b?.moves?.filter(Boolean).forEach((m) => lines.push(`- ${m}`));
    lines.push("");
  });
  return lines.join("\n");
}

/* ── Team Slot Mini ─────────────────────────────────────── */
function TeamSlotMini({
  index, pokemon, build, selected, onSelect, onRemove,
}: {
  index: number;
  pokemon: TeamMember | null;
  build?: Build;
  selected: boolean;
  onSelect: (i: number) => void;
  onRemove: (i: number) => void;
}) {
  if (!pokemon) {
    return (
      <div
        style={{
          height: 90,
          borderRadius: "var(--radius-lg)",
          border: "2px dashed var(--border)",
          background: "var(--bg-input)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--text-muted)",
          fontSize: "0.7rem",
          opacity: 0.5,
        }}
      >
        Slot vacío
      </div>
    );
  }

  return (
    <button
      onClick={() => onSelect(index)}
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
        padding: "8px 6px",
        borderRadius: "var(--radius-lg)",
        border: `2px solid ${selected ? "var(--accent)" : "var(--border)"}`,
        background: selected ? "var(--accent-glow)" : "var(--bg-card)",
        cursor: "pointer",
        transition: "all 0.15s",
        boxShadow: selected ? "0 0 0 1px var(--accent-glow)" : "none",
        minHeight: 90,
      }}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(index); }}
        style={{
          position: "absolute", top: 4, right: 4,
          padding: 2, background: "transparent", border: "none",
          cursor: "pointer", color: "var(--text-muted)",
          borderRadius: 4, display: "flex",
        }}
      >
        <X size={11} />
      </button>
      <PokemonSprite name={pokemon.nombre} spriteUrl={pokemon.sprite_url} size={44} animate={selected} />
      <span style={{ fontSize: "0.65rem", fontWeight: 600, color: "var(--text-primary)", textTransform: "capitalize", textAlign: "center", lineHeight: 1.2, maxWidth: "100%" }}>
        {pokemon.nombre}
      </span>
      {build?.item && (
        <span style={{ fontSize: "0.55rem", color: "var(--text-muted)", textAlign: "center" }}>
          @ {build.item}
        </span>
      )}
    </button>
  );
}

/* ── Main ReviewView ────────────────────────────────────── */
export function ReviewView() {
  const { result, loading, error, reviewTeam, reset } = useReview();

  // Local team state (independent of builder)
  const [team, setTeam] = useState<(TeamMember | null)[]>(Array(6).fill(null));
  const [builds, setBuilds] = useState<Record<string, Build>>({});
  const [format, setFormat] = useState("VGC 2025 Regulation H");
  const [context, setContext] = useState("");
  const [inputMode, setInputMode] = useState<"search" | "paste">("search");
  const [paste, setPaste] = useState("");
  const [pasteError, setPasteError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [selectedPokemon, setSelectedPokemon] = useState<string | null>(null);
  const [showMatrix, setShowMatrix] = useState(false);
  const [showContext, setShowContext] = useState(false);

  const filledTeam = team.filter(Boolean) as TeamMember[];
  const selectedMember = filledTeam.find((p) => p.nombre === selectedPokemon) ?? null;
  const selectedBuild = selectedMember ? builds[String(selectedMember.id)] : undefined;
  const selectedSlotIdx = team.findIndex((p) => p?.nombre === selectedPokemon);

  const weaknessProfile = useMemo(
    () => filledTeam.length > 0 ? getTeamWeaknessProfile(filledTeam) : null,
    [filledTeam]
  );

  /* ── Team mutations ── */
  const addPokemon = useCallback((p: TeamMember) => {
    setTeam((prev) => {
      const emptyIdx = prev.findIndex((s) => s === null);
      if (emptyIdx === -1) return prev;
      const next = [...prev];
      next[emptyIdx] = p;
      return next;
    });
  }, []);

  const removePokemon = useCallback((idx: number) => {
    setTeam((prev) => { const n = [...prev]; n[idx] = null; return n; });
    setSelectedPokemon(null);
  }, []);

  const clearTeam = useCallback(() => {
    setTeam(Array(6).fill(null));
    setBuilds({});
    setSelectedPokemon(null);
    reset();
  }, [reset]);

  function handleParsePaste() {
    setPasteError(null);
    if (!paste.trim()) { setPasteError("Pega un equipo primero."); return; }
    try {
      const { team: t, builds: b } = parseShowdownPaste(paste);
      if (t.length === 0) { setPasteError("No se pudo leer el equipo. Verifica el formato."); return; }
      const padded: (TeamMember | null)[] = [...t, ...Array(6 - t.length).fill(null)];
      setTeam(padded);
      setBuilds(b);
      setSelectedPokemon(null);
      reset();
      setPaste("");
    } catch { setPasteError("Error al parsear el paste."); }
  }

  function handleCopyShowdown() {
    navigator.clipboard.writeText(buildShowdownExport(filledTeam, builds));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleReview() {
    await reviewTeam(filledTeam, builds, format, context);
  }

  const gradeColor = result ? (GRADE_COLOR[result.grade] ?? "var(--accent)") : "var(--accent)";
  const slotsLeft = team.filter((s) => s === null).length;

  return (
    <div className="relative w-full">
      <PokeballPattern />
      <div className="relative z-[1] w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-5"
        style={{ paddingBottom: 96 }}>

        {/* Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "var(--accent-glow)", border: "1px solid var(--accent)" }}>
              <ShieldCheck size={20} style={{ color: "var(--accent)" }} />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight" style={{ color: "var(--text-primary)" }}>
                Análisis de Equipo
              </h1>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Evaluación competitiva profunda con IA
              </p>
            </div>
          </div>
          {filledTeam.length > 0 && (
            <div className="flex gap-2 flex-shrink-0">
              <button className="btn-secondary text-xs" onClick={handleCopyShowdown}>
                <ClipboardCopy size={13} /> {copied ? "¡Copiado!" : "Exportar"}
              </button>
              <button className="btn-ghost text-xs" onClick={clearTeam} style={{ color: "var(--danger)" }}>
                <Trash2 size={13} /> Limpiar
              </button>
            </div>
          )}
        </div>

        <div className="grid gap-5" style={{ gridTemplateColumns: "300px 1fr", alignItems: "start" }}>

          {/* ── Left: Builder panel ── */}
          <div className="flex flex-col gap-3"
            style={{ position: "sticky", top: 80, maxHeight: "calc(100vh - 100px)", overflowY: "auto", scrollbarWidth: "none", paddingBottom: 80 }}>

            {/* Format */}
            <div className="glass-card p-4 flex flex-col gap-3">
              <span className="text-[0.6rem] uppercase tracking-widest font-bold" style={{ color: "var(--text-muted)" }}>
                Formato
              </span>
              <select className="input" style={{ cursor: "pointer" }} value={format} onChange={(e) => setFormat(e.target.value)}>
                {FORMATS.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>

              {/* Context toggle */}
              <button
                onClick={() => setShowContext((v) => !v)}
                className="flex items-center justify-between w-full text-xs"
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}
              >
                <span className="flex items-center gap-1.5 font-semibold uppercase tracking-wider" style={{ fontSize: "0.6rem" }}>
                  <FileText size={10} /> Contexto adicional
                </span>
                <ChevronDown size={11} style={{ transform: showContext ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
              </button>
              {showContext && (
                <textarea
                  className="input animate-fade-in"
                  rows={3}
                  placeholder="Ej: Equipo de lluvia para regionals, el líder es Pelipper, quiero saber si la build de Kingdra está optimizada..."
                  style={{ resize: "vertical", fontFamily: "inherit", fontSize: "0.8rem" }}
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                />
              )}
            </div>

            {/* Input mode toggle */}
            <div className="flex gap-1 p-1 rounded-xl"
              style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
              {(["search", "paste"] as const).map((m) => (
                <button key={m} onClick={() => setInputMode(m)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all"
                  style={{
                    background: inputMode === m ? "var(--accent)" : "transparent",
                    color: inputMode === m ? "#fff" : "var(--text-secondary)",
                    cursor: "pointer",
                  }}>
                  {m === "search" ? <><Users size={12} /> Buscar</> : <><ClipboardPaste size={12} /> Importar</>}
                </button>
              ))}
            </div>

            {/* Search mode */}
            {inputMode === "search" && (
              <div className="flex flex-col gap-2 animate-fade-in">
                <span className="text-[0.6rem] uppercase tracking-widest font-bold px-0.5" style={{ color: "var(--text-muted)" }}>
                  Agregar Pokémon ({filledTeam.length}/6)
                </span>
                <LeaderSearch
                  selected={null}
                  onSelect={(p) => { if (slotsLeft > 0) addPokemon(p); }}
                  onClear={() => {}}
                  placeholder={slotsLeft > 0 ? "Buscar y agregar..." : "Equipo completo"}
                  disabled={slotsLeft === 0}
                />
                {slotsLeft === 0 && (
                  <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
                    Equipo completo. Elimina un Pokémon para agregar otro.
                  </p>
                )}
              </div>
            )}

            {/* Paste mode */}
            {inputMode === "paste" && (
              <div className="glass-card p-3 flex flex-col gap-2 animate-fade-in">
                <span className="text-[0.6rem] uppercase tracking-widest font-bold" style={{ color: "var(--text-muted)" }}>
                  Showdown Paste
                </span>
                <textarea
                  className="input font-mono"
                  rows={7}
                  placeholder={"Incineroar @ Assault Vest\nAbility: Intimidate\nEVs: 252 HP / 4 Atk / 252 SpD\nCareful Nature\n- Fake Out\n- Knock Off\n..."}
                  value={paste}
                  onChange={(e) => setPaste(e.target.value)}
                  style={{ fontSize: "0.7rem", lineHeight: 1.6, resize: "none" }}
                />
                {pasteError && <p className="text-xs" style={{ color: "var(--danger)" }}>{pasteError}</p>}
                <button className="btn-primary text-xs" onClick={handleParsePaste}>
                  <ClipboardPaste size={12} /> Cargar equipo
                </button>
              </div>
            )}

            {/* Team grid 2x3 */}
            <div className="grid grid-cols-3 gap-2">
              {team.map((p, i) => (
                <TeamSlotMini
                  key={i}
                  index={i}
                  pokemon={p}
                  build={p ? builds[String(p.id)] : undefined}
                  selected={selectedPokemon === p?.nombre}
                  onSelect={(idx) => {
                    const poke = team[idx];
                    setSelectedPokemon(poke ? (selectedPokemon === poke.nombre ? null : poke.nombre) : null);
                  }}
                  onRemove={removePokemon}
                />
              ))}
            </div>

            {/* Analyze button */}
            <button
              className="btn-primary w-full animate-pulse-glow"
              onClick={handleReview}
              disabled={loading || filledTeam.length === 0}
              style={{ padding: "11px 16px" }}
            >
              {loading
                ? <><Pokeball size={16} className="animate-rotate-pokeball" /> Analizando...</>
                : <><ShieldCheck size={15} /> Analizar Equipo ({filledTeam.length} Pokémon)</>
              }
            </button>

            {result && (
              <button className="btn-secondary w-full" onClick={() => { reset(); setSelectedPokemon(null); }}>
                Nueva revisión
              </button>
            )}
          </div>

          {/* ── Right: Results + Detail ── */}
          <div className="flex flex-col gap-4 min-w-0">

            {/* Weakness bar */}
            {weaknessProfile && filledTeam.length > 0 && (
              <WeaknessBar profile={weaknessProfile} onOpenMatrix={() => setShowMatrix(true)} />
            )}

            {/* Empty state */}
            {filledTeam.length === 0 && (
              <EmptyState
                icon={<Trophy size={28} />}
                title="Arma tu equipo para analizar"
                description="Busca Pokémon uno a uno o importa un paste de Showdown."
              />
            )}

            {/* Error */}
            {error && (
              <div className="rounded-xl px-4 py-3 text-sm" role="alert"
                style={{ background: "rgba(239,68,68,0.08)", color: "var(--danger)", border: "1px solid rgba(239,68,68,0.2)" }}>
                {error}
              </div>
            )}

            {/* Loading skeletons */}
            {loading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="skeleton rounded-xl" style={{ height: 90 }} />
                ))}
              </div>
            )}

            {/* Results */}
            {result && !loading && (
              <div className="flex flex-col gap-4 animate-slide-up">

                {/* Score hero */}
                <div className="glass-card p-5 flex flex-col items-center gap-4 sm:flex-row sm:items-start"
                  style={{ borderColor: gradeColor, boxShadow: `0 0 0 1px ${gradeColor}33, 0 8px 32px ${gradeColor}18` }}>
                  <div className="flex flex-col items-center gap-1 flex-shrink-0">
                    <div className="relative w-24 h-24 rounded-full flex items-center justify-center"
                      style={{ background: `conic-gradient(${gradeColor} ${result.score * 3.6}deg, var(--bg-input) 0deg)` }}>
                      <div className="w-20 h-20 rounded-full flex flex-col items-center justify-center"
                        style={{ background: "var(--bg-card)" }}>
                        <span className="font-black text-2xl" style={{ color: gradeColor, lineHeight: 1 }}>{result.grade}</span>
                        <span className="text-xs font-bold tabular-nums" style={{ color: "var(--text-secondary)" }}>{result.score}/100</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 flex-1">
                    <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{result.analysis}</p>
                    <div className="px-3 py-2 rounded-lg text-sm font-semibold italic"
                      style={{ background: `${gradeColor}11`, color: gradeColor, border: `1px solid ${gradeColor}33` }}>
                      "{result.metaVerdict}"
                    </div>
                  </div>
                </div>

                {/* Categories */}
                {result.categories && (
                  <div className="glass-card p-4 flex flex-col gap-3">
                    <h3 className="text-xs uppercase tracking-wider font-semibold" style={{ color: "var(--text-muted)" }}>
                      Categorías
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                      {Object.entries(result.categories).map(([key, cat]) => {
                        const c = cat as { score: number; label: string; desc: string };
                        const col = c.score >= 75 ? "var(--success)" : c.score >= 50 ? "var(--warning)" : "var(--danger)";
                        return (
                          <div key={key} className="flex flex-col gap-1.5 p-3 rounded-xl"
                            style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{c.label}</span>
                              <span className="text-xs font-bold tabular-nums" style={{ color: col }}>{c.score}</span>
                            </div>
                            <StatBar label="" value={c.score} max={100} showValue={false} animated />
                            <p className="text-xs" style={{ color: "var(--text-muted)" }}>{c.desc}</p>
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
                      <TrendingDown size={13} /> Puntos Débiles
                    </h3>
                    <div className="flex flex-col gap-2">
                      {result.weakPoints.map((item, i) => (
                        <div key={i} className="flex items-start gap-2 rounded-lg px-3 py-2 text-xs"
                          style={{ background: "rgba(239,68,68,0.07)", color: "var(--danger)", border: "1px solid rgba(239,68,68,0.15)" }}>
                          <span style={{ flexShrink: 0 }}>›</span>
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
                        <div key={i} className="flex items-start gap-2 rounded-lg px-3 py-2 text-xs"
                          style={{ background: "rgba(34,197,94,0.07)", color: "var(--success)", border: "1px solid rgba(34,197,94,0.15)" }}>
                          <span style={{ flexShrink: 0 }}>›</span>
                          <span className="leading-relaxed">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Per-pokemon ratings */}
                {result.pokemonRatings && Object.keys(result.pokemonRatings).length > 0 && (
                  <div className="glass-card p-4 flex flex-col gap-3">
                    <h3 className="text-xs uppercase tracking-wider font-semibold" style={{ color: "var(--text-muted)" }}>
                      Ratings Individuales
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                      {Object.entries(result.pokemonRatings).map(([name, rating]) => {
                        const col = rating.score >= 75 ? "var(--success)" : rating.score >= 50 ? "var(--warning)" : "var(--danger)";
                        const member = filledTeam.find((p) => p.nombre === name);
                        return (
                          <button
                            key={name}
                            onClick={() => setSelectedPokemon(selectedPokemon === name ? null : name)}
                            className="flex flex-col gap-2 p-3 rounded-xl text-left transition-all"
                            style={{
                              background: selectedPokemon === name ? "var(--accent-glow)" : "var(--bg-surface)",
                              border: `1px solid ${selectedPokemon === name ? "var(--accent)" : "var(--border)"}`,
                              cursor: "pointer",
                            }}
                          >
                            <div className="flex items-center gap-2">
                              {member && <PokemonSprite name={member.nombre} spriteUrl={member.sprite_url} size={36} />}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold capitalize" style={{ color: "var(--text-primary)" }}>{name}</span>
                                  <span className="text-sm font-black tabular-nums" style={{ color: col }}>{rating.score}</span>
                                </div>
                                <StatBar label="" value={rating.score} max={100} showValue={false} animated />
                              </div>
                            </div>
                            <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>{rating.comment}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Selected pokemon build detail */}
            {selectedMember && selectedBuild && (
              <div className="animate-fade-in">
                <BuildCard
                  pokemon={selectedMember}
                  build={selectedBuild}
                  aiRole={selectedMember.rol}
                  onClose={() => setSelectedPokemon(null)}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {showMatrix && weaknessProfile && (
        <WeaknessMatrix profile={weaknessProfile} onClose={() => setShowMatrix(false)} />
      )}
    </div>
  );
}