"use client";

import { useState } from "react";
import { useSwap, type SwapSuggestion } from "@/hooks/useSwap";
import { useBuilder } from "@/hooks/useBuilder";
import type { TeamMember, Build } from "@/types/pokemon";
import { PokemonSprite } from "@/components/pokemon/PokemonSprite";
import { EmptyState } from "@/components/ui/EmptyState";
import { PokeballPattern, Pokeball } from "@/components/ui/PokeballBg";
import {
  RefreshCw, ArrowRight, ChevronDown, ChevronUp,
  Swords,
} from "lucide-react";

/* ── Showdown paste parser ───────────────────────── */
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

    let ability = "";
    let nature = "";
    let teraType = "";
    const moves: string[] = [];
    let evHp = 0, evAtk = 0, evDef = 0, evSpa = 0, evSpd = 0, evSpe = 0;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith("Ability:")) ability = line.replace("Ability:", "").trim();
      else if (line.endsWith("Nature")) nature = line.replace("Nature", "").trim();
      else if (line.startsWith("Tera Type:")) teraType = line.replace("Tera Type:", "").trim();
      else if (line.startsWith("EVs:")) {
        const evStr = line.replace("EVs:", "").trim();
        const parts = evStr.split("/").map((p) => p.trim());
        parts.forEach((p) => {
          const m = p.match(/(\d+)\s*(HP|Atk|Def|SpA|SpD|Spe)/i);
          if (!m) return;
          const val = parseInt(m[1]);
          switch (m[2].toLowerCase()) {
            case "hp": evHp = val; break;
            case "atk": evAtk = val; break;
            case "def": evDef = val; break;
            case "spa": evSpa = val; break;
            case "spd": evSpd = val; break;
            case "spe": evSpe = val; break;
          }
        });
      } else if (line.startsWith("- ")) {
        moves.push(line.replace("- ", "").trim());
      }
    }

    if (!rawName) return;
    const id = Date.now() + idx;
    const member: TeamMember = { id, nombre: rawName, tipo1: "", tipo2: null };
    const build: Build = {
      item, ability, nature, moves,
      ev_hp: evHp, ev_atk: evAtk, ev_def: evDef,
      ev_spa: evSpa, ev_spd: evSpd, ev_spe: evSpe,
      tera_type: teraType || undefined,
    };
    team.push(member);
    builds[String(id)] = build;
  });

  return { team, builds };
}

/* ── Suggestion Card ─────────────────────────────── */
function SuggestionCard({
  suggestion,
  onAccept,
}: {
  suggestion: SwapSuggestion;
  onAccept: (sug: SwapSuggestion) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="glass-card flex flex-col gap-3 p-4 animate-bounce-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <PokemonSprite name={suggestion.name} size={60} animate />
        <div className="flex flex-col gap-1 flex-1 min-w-0">
          <span
            className="font-bold capitalize text-sm"
            style={{ color: "var(--text-primary)" }}
          >
            {suggestion.name}
          </span>
          {suggestion.role && (
            <span className="badge badge-accent" style={{ fontSize: "0.6rem", alignSelf: "flex-start" }}>
              {suggestion.role}
            </span>
          )}
        </div>
        <button
          className="btn-primary py-2 px-3 text-xs flex items-center gap-1.5"
          onClick={() => onAccept(suggestion)}
        >
          <ArrowRight size={13} />
          Usar
        </button>
      </div>

      {/* Build summary */}
      <div
        className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs px-1"
        style={{ color: "var(--text-secondary)" }}
      >
        {suggestion.build.item && (
          <span>
            <span style={{ color: "var(--text-muted)" }}>Item: </span>
            {suggestion.build.item}
          </span>
        )}
        {suggestion.build.ability && (
          <span>
            <span style={{ color: "var(--text-muted)" }}>Habilidad: </span>
            {suggestion.build.ability}
          </span>
        )}
        {suggestion.build.nature && (
          <span>
            <span style={{ color: "var(--text-muted)" }}>Natura: </span>
            {suggestion.build.nature}
          </span>
        )}
        {suggestion.build.teraType && (
          <span>
            <span style={{ color: "var(--text-muted)" }}>Tera: </span>
            {suggestion.build.teraType}
          </span>
        )}
      </div>

      {/* Moves */}
      {suggestion.build.moves?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {suggestion.build.moves.map((move, i) => (
            <span
              key={`${move}-${i}`}
              className="badge badge-accent"
              style={{ fontSize: "0.6rem" }}
            >
              {move}
            </span>
          ))}
        </div>
      )}

      {/* Reasoning toggle */}
      <button
        className="flex items-center gap-1 text-xs text-left"
        style={{ color: "var(--text-muted)" }}
        onClick={() => setExpanded((v) => !v)}
      >
        {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        {expanded ? "Ocultar razonamiento" : "Ver razonamiento"}
      </button>

      {expanded && (
        <div className="flex flex-col gap-2 animate-fade-in">
          <p
            className="text-xs leading-relaxed px-1"
            style={{ color: "var(--text-secondary)" }}
          >
            {suggestion.reasoning}
          </p>
          {suggestion.synergies?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {suggestion.synergies.map((s) => (
                <span
                  key={s}
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    background: "rgba(34,197,94,0.1)",
                    color: "var(--success)",
                    border: "1px solid rgba(34,197,94,0.2)",
                  }}
                >
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Main SwapView ───────────────────────────────── */
export function SwapView() {
  const { suggestions, loading, error, findReplacement, reset } = useSwap();
  const builder = useBuilder();

  const [importMode, setImportMode] = useState<"builder" | "paste">("builder");
  const [paste, setPaste] = useState("");
  const [pasteTeam, setPasteTeam] = useState<(TeamMember | null)[]>([]);
  const [pasteBuilds, setPasteBuilds] = useState<Record<string, Build>>({});
  const [parseError, setParseError] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [swapFeedback, setSwapFeedback] = useState("");
  const [acceptedSlot, setAcceptedSlot] = useState<number | null>(null);

  const activeTeam = importMode === "paste" ? pasteTeam : builder.team;
  const activeBuilds = importMode === "paste" ? pasteBuilds : builder.builds;
  const activeConfig = builder.config;
  const filledTeam = activeTeam.filter(Boolean) as TeamMember[];

  function handleParsePaste() {
    setParseError(null);
    if (!paste.trim()) {
      setParseError("Pega un equipo en formato Showdown primero.");
      return;
    }
    try {
      const { team, builds } = parseShowdownPaste(paste);
      if (team.length === 0) {
        setParseError("No se pudo leer el equipo. Verifica el formato.");
        return;
      }
      setPasteTeam(team.map((t) => t as TeamMember | null).concat(Array(6 - team.length).fill(null)));
      setPasteBuilds(builds);
      setSelectedSlot(null);
      reset();
    } catch {
      setParseError("Error al parsear el paste.");
    }
  }

  async function handleFindReplacement() {
    if (selectedSlot === null) return;
    await findReplacement(selectedSlot, activeTeam, activeBuilds, activeConfig, swapFeedback);
  }

  function handleAccept(suggestion: SwapSuggestion) {
    if (selectedSlot === null) return;
    const newMember: TeamMember = {
      id: typeof suggestion.id === "number" ? suggestion.id : parseInt(String(suggestion.id)) || Date.now(),
      nombre: suggestion.name,
      tipo1: "",
      tipo2: null,
      rol: suggestion.role,
    };

    const evParts = (suggestion.build.evSpread ?? "").match(/(\d+)\s*(HP|Atk|Def|SpA|SpD|Spe)/gi) ?? [];
    const evMap: Record<string, number> = {};
    evParts.forEach((part) => {
      const [val, stat] = part.split(/\s+/);
      evMap[stat.toLowerCase()] = parseInt(val);
    });

    const newBuild: Build = {
      ability: suggestion.build.ability,
      nature: suggestion.build.nature,
      item: suggestion.build.item,
      moves: suggestion.build.moves,
      ev_hp: evMap["hp"] ?? 0, ev_atk: evMap["atk"] ?? 0, ev_def: evMap["def"] ?? 0,
      ev_spa: evMap["spa"] ?? 0, ev_spd: evMap["spd"] ?? 0, ev_spe: evMap["spe"] ?? 0,
      tera_type: suggestion.build.teraType,
    };

    if (importMode === "builder") {
      builder.setSlot(selectedSlot, newMember);
    } else {
      const updated = [...pasteTeam];
      updated[selectedSlot] = newMember;
      setPasteTeam(updated);
      setPasteBuilds({ ...pasteBuilds, [String(newMember.id)]: newBuild });
    }

    setAcceptedSlot(selectedSlot);
    reset();
    setTimeout(() => setAcceptedSlot(null), 2500);
  }

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
              <RefreshCw size={20} style={{ color: "var(--accent)" }} />
            </div>
            <h1
              className="font-bold text-balance"
              style={{ color: "var(--text-primary)", fontSize: "clamp(1.35rem,3vw,1.75rem)" }}
            >
              Cambio de Miembro
            </h1>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
            Selecciona un Pokemon y recibe sugerencias IA para optimizar tu equipo.
          </p>
        </div>

        {/* Source toggle */}
        <div
          className="flex gap-1 p-1 rounded-xl w-fit"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
        >
          {(["builder", "paste"] as const).map((mode) => (
            <button
              key={mode}
              className="px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200"
              style={{
                background: importMode === mode ? "var(--accent)" : "transparent",
                color: importMode === mode ? "#fff" : "var(--text-secondary)",
                boxShadow: importMode === mode ? "0 2px 12px var(--accent-glow)" : "none",
              }}
              onClick={() => {
                setImportMode(mode);
                setSelectedSlot(null);
                reset();
              }}
            >
              {mode === "builder" ? "Equipo del Builder" : "Importar Showdown"}
            </button>
          ))}
        </div>

        {/* Paste import */}
        {importMode === "paste" && (
          <div className="glass-card p-4 flex flex-col gap-3 animate-bounce-in">
            <label
              className="text-xs uppercase tracking-wider font-semibold"
              style={{ color: "var(--text-muted)" }}
            >
              Showdown Export Paste
            </label>
            <textarea
              className="input font-mono text-xs resize-none"
              rows={8}
              placeholder={"Charizard @ Choice Specs\nAbility: Blaze\nEVs: 252 SpA / 4 SpD / 252 Spe\nTimid Nature\n- Fire Blast\n- Air Slash\n- Focus Blast\n- Roost\n\n..."}
              value={paste}
              onChange={(e) => setPaste(e.target.value)}
              style={{ fontSize: "0.72rem", lineHeight: 1.7 }}
            />
            {parseError && (
              <p className="text-xs" style={{ color: "var(--danger)" }}>{parseError}</p>
            )}
            <button className="btn-primary w-fit text-sm" onClick={handleParsePaste}>
              Cargar equipo
            </button>
          </div>
        )}

        {/* ── Team horizontal strip ──────────────── */}
        {filledTeam.length > 0 ? (
          <div className="glass-card p-4 flex flex-col gap-3 animate-bounce-in">
            <div className="flex items-center justify-between">
              <span
                className="text-xs uppercase tracking-wider font-semibold"
                style={{ color: "var(--text-muted)" }}
              >
                Selecciona el slot a reemplazar
              </span>
              <span className="badge badge-accent" style={{ fontSize: "0.65rem" }}>
                {filledTeam.length} / 6
              </span>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-1">
              {activeTeam.map((pokemon, i) => {
                if (!pokemon) return null;
                const build = activeBuilds[String(pokemon.id)];
                const isSelected = selectedSlot === i;
                const isAccepted = acceptedSlot === i;

                return (
                  <button
                    key={i}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all duration-200 flex-shrink-0"
                    style={{
                      background: isAccepted
                        ? "rgba(34,197,94,0.12)"
                        : isSelected
                        ? "var(--accent-glow)"
                        : "var(--bg-input)",
                      border: `2px solid ${
                        isAccepted
                          ? "var(--success)"
                          : isSelected
                          ? "var(--accent)"
                          : "var(--border)"
                      }`,
                      minWidth: 90,
                      boxShadow: isSelected ? "0 4px 16px var(--accent-glow)" : "none",
                    }}
                    onClick={() => {
                      setSelectedSlot(isSelected ? null : i);
                      reset();
                    }}
                  >
                    <PokemonSprite name={pokemon.nombre} spriteUrl={pokemon.sprite_url} size={52} animate={isSelected} />
                    <span
                      className="text-xs font-bold capitalize truncate w-full text-center"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {pokemon.nombre}
                    </span>
                    {build?.item && (
                      <span className="text-xs truncate w-full text-center" style={{ color: "var(--text-muted)", fontSize: "0.6rem" }}>
                        @ {build.item}
                      </span>
                    )}
                    {isAccepted && (
                      <span className="text-xs font-bold" style={{ color: "var(--success)" }}>
                        Actualizado
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ) : importMode === "builder" ? (
          <EmptyState
            icon={<RefreshCw size={32} />}
            title="Sin equipo en el Builder"
            description="Ve al Team Builder, genera un equipo y luego vuelve aqui."
          />
        ) : (
          <EmptyState
            icon={<RefreshCw size={32} />}
            title="Sin equipo cargado"
            description="Pega tu equipo en formato Showdown y presiona Cargar equipo."
          />
        )}

        {/* Swap config */}
        {selectedSlot !== null && activeTeam[selectedSlot] && (
          <div className="glass-card p-4 flex flex-col gap-3 animate-bounce-in">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-semibold" style={{ color: "var(--text-muted)" }}>
                Reemplazando a
              </span>
              <span className="font-bold capitalize text-sm" style={{ color: "var(--accent)" }}>
                {activeTeam[selectedSlot]!.nombre}
              </span>
            </div>

            <input
              type="text"
              className="input text-sm"
              placeholder={"Describe que quieres mejorar..."}
              value={swapFeedback}
              onChange={(e) => setSwapFeedback(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleFindReplacement();
              }}
            />

            <button
              className="btn-primary w-full animate-pulse-glow"
              onClick={handleFindReplacement}
              disabled={loading}
              style={{ fontSize: "0.9rem", padding: "12px" }}
            >
              {loading ? (
                <>
                  <Pokeball size={16} className="animate-rotate-pokeball" />
                  Buscando reemplazos...
                </>
              ) : (
                <>
                  <Swords size={16} />
                  {`Buscar reemplazo para ${activeTeam[selectedSlot]!.nombre}`}
                </>
              )}
            </button>
          </div>
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

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="skeleton rounded-xl" style={{ height: 180 }} />
            ))}
          </div>
        )}

        {/* Suggestions */}
        {suggestions.length > 0 && !loading && (
          <div className="flex flex-col gap-4 animate-slide-up">
            <div className="flex items-center justify-between">
              <h2
                className="text-xs uppercase tracking-wider font-semibold"
                style={{ color: "var(--text-muted)" }}
              >
                {suggestions.length} sugerencia{suggestions.length !== 1 ? "s" : ""} de reemplazo
              </h2>
              <button
                className="btn-ghost text-xs flex items-center gap-1.5"
                onClick={() => {
                  reset();
                  handleFindReplacement();
                }}
                disabled={loading}
              >
                <RefreshCw size={12} />
                Regenerar
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 stagger-children">
              {suggestions.map((sug) => (
                <SuggestionCard
                  key={String(sug.id)}
                  suggestion={sug}
                  onAccept={handleAccept}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
