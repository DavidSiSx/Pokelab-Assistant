"use client";

import { useState, useCallback, useReducer } from "react";
import type { TeamMember, Build } from "@/types/pokemon";
import type { BuilderConfig } from "@/types/config";
import type { AiReport } from "@/types/api";
import { DEFAULT_CONFIG } from "@/types/config";

// ── State ──────────────────────────────────────────────────────────────────
export interface BuilderState {
  team: (TeamMember | null)[];
  lockedSlots: boolean[];
  builds: Record<string, Build>;
  config: BuilderConfig;
  aiReport: AiReport | null;
  blacklist: string[];
  feedback: string;
  loading: boolean;
  error: string | null;
}

type BuilderAction =
  | { type: "SET_TEAM"; team: (TeamMember | null)[]; builds: Record<string, Build>; aiReport: AiReport | null }
  | { type: "SET_SLOT"; index: number; pokemon: TeamMember | null }
  | { type: "LOCK_SLOT"; index: number; locked: boolean }
  | { type: "SET_CONFIG"; config: Partial<BuilderConfig> }
  | { type: "SET_FEEDBACK"; feedback: string }
  | { type: "ADD_TO_BLACKLIST"; name: string }
  | { type: "CLEAR_BLACKLIST" }
  | { type: "SET_LOADING"; loading: boolean }
  | { type: "SET_ERROR"; error: string | null }
  | { type: "RESET" };

function builderReducer(state: BuilderState, action: BuilderAction): BuilderState {
  switch (action.type) {
    case "SET_TEAM":
      return {
        ...state,
        team: action.team,
        builds: action.builds,
        aiReport: action.aiReport,
        loading: false,
        error: null,
      };
    case "SET_SLOT": {
      const newTeam = [...state.team];
      newTeam[action.index] = action.pokemon;
      return { ...state, team: newTeam };
    }
    case "LOCK_SLOT": {
      const newLocked = [...state.lockedSlots];
      newLocked[action.index] = action.locked;
      return { ...state, lockedSlots: newLocked };
    }
    case "SET_CONFIG":
      return { ...state, config: { ...state.config, ...action.config } };
    case "SET_FEEDBACK":
      return { ...state, feedback: action.feedback };
    case "ADD_TO_BLACKLIST":
      return {
        ...state,
        blacklist: state.blacklist.includes(action.name)
          ? state.blacklist
          : [...state.blacklist, action.name],
      };
    case "CLEAR_BLACKLIST":
      return { ...state, blacklist: [] };
    case "SET_LOADING":
      return { ...state, loading: action.loading, error: null };
    case "SET_ERROR":
      return { ...state, error: action.error, loading: false };
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

const initialState: BuilderState = {
  team: [null, null, null, null, null, null],
  lockedSlots: [false, false, false, false, false, false],
  builds: {},
  config: DEFAULT_CONFIG,
  aiReport: null,
  blacklist: [],
  feedback: "",
  loading: false,
  error: null,
};

// ── Feedback parser — detecta nombres y palabras clave ─────────────────────
function parseFeedback(
  feedback: string,
  currentTeam: (TeamMember | null)[]
): { blacklist: string[]; strategyHints: string } {
  const lower = feedback.toLowerCase();

  // Extract "no quiero X", "cambia X", "quita X", "sin X"
  const removePatterns = [
    /no\s+(?:quiero|me\s+gusta|uses?)\s+([a-záéíóúñ\-]+)/gi,
    /(?:cambia|quita|saca|reemplaza)\s+(?:el\s+|la\s+|a\s+)?([a-záéíóúñ\-]+)/gi,
    /(?:sin|fuera)\s+([a-záéíóúñ\-]+)/gi,
  ];

  const detectedRemovals: string[] = [];
  for (const pattern of removePatterns) {
    let m: RegExpExecArray | null;
    while ((m = pattern.exec(feedback)) !== null) {
      const name = m[1].trim();
      if (name.length > 2) detectedRemovals.push(name);
    }
  }

  // Match against current team members
  const blacklist: string[] = [];
  for (const removal of detectedRemovals) {
    for (const slot of currentTeam) {
      if (
        slot &&
        slot.nombre.toLowerCase().includes(removal.toLowerCase())
      ) {
        blacklist.push(slot.nombre);
      }
    }
    // Also add raw name if no match (AI will handle)
    if (blacklist.length === 0) blacklist.push(removal);
  }

  // Strategy hints: keywords to append to customStrategy
  const strategyKeywords: Record<string, string> = {
    stall: "Priorizar estrategia de stall y resistencia.",
    sol: "Usar equipo de sol con abusadores de Drought/Chlorophyll.",
    lluvia: "Usar equipo de lluvia con Swift Swim.",
    arena: "Usar equipo de arena (Sand).",
    granizo: "Usar equipo de nieve/granizo (Snow).",
    "trick room": "Usar Trick Room como control de velocidad.",
    tailwind: "Usar Tailwind como control de velocidad.",
    agresivo: "Priorizar ataques directos y presión ofensiva.",
    ofensivo: "Equipo hiper ofensivo, priorizar sweep y revenge kill.",
    balance: "Equipo balanceado con opciones tanto ofensivas como defensivas.",
  };

  const foundHints: string[] = [];
  for (const [keyword, hint] of Object.entries(strategyKeywords)) {
    if (lower.includes(keyword)) foundHints.push(hint);
  }

  return {
    blacklist: [...new Set(blacklist)],
    strategyHints: foundHints.join(" "),
  };
}

// ── Hook ───────────────────────────────────────────────────────────────────
export function useBuilder() {
  const [state, dispatch] = useReducer(builderReducer, initialState);
  const [sessionId] = useState(
    () => `sess_${Date.now()}_${Math.random().toString(36).slice(2)}`
  );

  const generateTeam = useCallback(
    async (leader?: TeamMember | null, feedbackOverride?: string) => {
      dispatch({ type: "SET_LOADING", loading: true });

      const feedback = feedbackOverride ?? state.feedback;
      const { blacklist: fbBlacklist, strategyHints } = parseFeedback(
        feedback,
        state.team
      );

      const mergedBlacklist = [
        ...new Set([...state.blacklist, ...fbBlacklist]),
      ];

      const configWithHints: BuilderConfig = {
        ...state.config,
        customStrategy: [state.config.customStrategy, strategyHints]
          .filter(Boolean)
          .join(" "),
        generationMode: leader ? "leader" : "scratch",
      };

      // Build locked team from current slots
      const lockedTeam: TeamMember[] = [];
      if (leader) lockedTeam.push(leader);
      state.team.forEach((slot, i) => {
        if (slot && state.lockedSlots[i] && slot.id !== leader?.id) {
          lockedTeam.push(slot);
        }
      });

      try {
        const res = await fetch("/api/pokemon/suggest", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-session-id": sessionId,
          },
          body: JSON.stringify({
            lockedTeam,
            config: { ...configWithHints, blacklist: mergedBlacklist },
            slotIndex: 0,
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          dispatch({ type: "SET_ERROR", error: err.warnings?.[0] ?? "Error generando equipo" });
          return;
        }

        const data = await res.json();

        // Map suggestions → TeamMember + Builds
        const newTeam: (TeamMember | null)[] = Array(6).fill(null);
        const newBuilds: Record<string, Build> = {};

        if (leader) {
          newTeam[0] = leader;
          if (leader.suggestedBuild) newBuilds[String(leader.id)] = leader.suggestedBuild;
        }

        data.suggestions?.forEach((sug: {
          id: string | number;
          name: string;
          build?: {
            ability?: string;
            nature?: string;
            item?: string;
            moves?: string[];
            evSpread?: string;
            teraType?: string;
          };
          role?: string;
        }, idx: number) => {
          const slotIdx = leader ? idx + 1 : idx;
          if (slotIdx >= 6) return;

          const evSpread = sug.build?.evSpread ?? "";
          const evParts = evSpread.match(/(\d+)\s*(HP|Atk|Def|SpA|SpD|Spe)/gi) ?? [];
          const evMap: Record<string, number> = {};
          evParts.forEach((part) => {
            const [val, stat] = part.split(/\s+/);
            evMap[stat.toLowerCase()] = parseInt(val);
          });

          const member: TeamMember = {
            id: typeof sug.id === "number" ? sug.id : parseInt(String(sug.id)) || Date.now(),
            nombre: sug.name,
            tipo1: sug.tipo1 || "",
            tipo2: sug.tipo2 || null,
            sprite_url: sug.sprite_url || null,
            rol: sug.role,
          };

          const build: Build = {
            ability: sug.build?.ability ?? "",
            nature: sug.build?.nature ?? "",
            item: sug.build?.item ?? "",
            moves: sug.build?.moves ?? [],
            ev_hp: evMap["hp"] ?? 0,
            ev_atk: evMap["atk"] ?? 0,
            ev_def: evMap["def"] ?? 0,
            ev_spa: evMap["spa"] ?? 0,
            ev_spd: evMap["spd"] ?? 0,
            ev_spe: evMap["spe"] ?? 0,
            tera_type: sug.build?.teraType,
          };

          newTeam[slotIdx] = member;
          newBuilds[String(member.id)] = build;
        });

        // Map report
        const aiReport: AiReport = {
          estrategia: data.report?.teamComposition ?? "",
          ventajas: data.report?.strengths ?? [],
          debilidades: data.report?.weaknesses ?? [],
          leads: [],
        };

        dispatch({ type: "SET_TEAM", team: newTeam, builds: newBuilds, aiReport });

        // Add feedback blacklist to persistent blacklist
        if (fbBlacklist.length > 0) {
          fbBlacklist.forEach((name) =>
            dispatch({ type: "ADD_TO_BLACKLIST", name })
          );
        }
      } catch {
        dispatch({ type: "SET_ERROR", error: "Error de red. Intenta de nuevo." });
      }
    },
    [state, sessionId]
  );

  const setSlot = useCallback((index: number, pokemon: TeamMember | null) => {
    dispatch({ type: "SET_SLOT", index, pokemon });
  }, []);

  const lockSlot = useCallback((index: number, locked: boolean) => {
    dispatch({ type: "LOCK_SLOT", index, locked });
  }, []);

  const setConfig = useCallback((config: Partial<BuilderConfig>) => {
    dispatch({ type: "SET_CONFIG", config });
  }, []);

  const setFeedback = useCallback((feedback: string) => {
    dispatch({ type: "SET_FEEDBACK", feedback });
  }, []);

  const addToBlacklist = useCallback((name: string) => {
    dispatch({ type: "ADD_TO_BLACKLIST", name });
  }, []);

  const clearBlacklist = useCallback(() => {
    dispatch({ type: "CLEAR_BLACKLIST" });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  return {
    ...state,
    generateTeam,
    setSlot,
    lockSlot,
    setConfig,
    setFeedback,
    addToBlacklist,
    clearBlacklist,
    reset,
    sessionId,
  };
}
