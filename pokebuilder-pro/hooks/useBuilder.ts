"use client";

import { useState, useCallback, useReducer } from "react";
import type { TeamMember, Build } from "@/types/pokemon";
import type { BuilderConfig } from "@/types/config";
import type { AiReport } from "@/types/api";
import { DEFAULT_CONFIG } from "@/types/config";

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
      return { ...state, team: action.team, builds: action.builds, aiReport: action.aiReport, loading: false, error: null };
    case "SET_SLOT": {
      const t = [...state.team]; t[action.index] = action.pokemon;
      return { ...state, team: t };
    }
    case "LOCK_SLOT": {
      const l = [...state.lockedSlots]; l[action.index] = action.locked;
      return { ...state, lockedSlots: l };
    }
    case "SET_CONFIG":
      return { ...state, config: { ...state.config, ...action.config } };
    case "SET_FEEDBACK":
      return { ...state, feedback: action.feedback };
    case "ADD_TO_BLACKLIST":
      return { ...state, blacklist: state.blacklist.includes(action.name) ? state.blacklist : [...state.blacklist, action.name] };
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

// ── Feedback parser — safe against undefined/null input ───────────────────
function parseFeedback(
  feedback: string | undefined | null,
  currentTeam: (TeamMember | null)[]
): { blacklist: string[]; strategyHints: string } {
  // ⚡ CRITICAL FIX: guard against undefined (feedbackOverride may be undefined)
  const safeFeedback = typeof feedback === "string" ? feedback.trim() : "";
  if (!safeFeedback) return { blacklist: [], strategyHints: "" };

  const lower = safeFeedback.toLowerCase();

  const removePatterns = [
    /no\s+(?:quiero|me\s+gusta|uses?)\s+([a-záéíóúñ\-]+)/gi,
    /(?:cambia|quita|saca|reemplaza)\s+(?:el\s+|la\s+|a\s+)?([a-záéíóúñ\-]+)/gi,
    /(?:sin|fuera)\s+([a-záéíóúñ\-]+)/gi,
  ];

  const detectedRemovals: string[] = [];
  for (const pattern of removePatterns) {
    let m: RegExpExecArray | null;
    while ((m = pattern.exec(safeFeedback)) !== null) {
      const name = m[1].trim();
      if (name.length > 2) detectedRemovals.push(name);
    }
  }

  const blacklist: string[] = [];
  for (const removal of detectedRemovals) {
    for (const slot of currentTeam) {
      if (slot && slot.nombre.toLowerCase().includes(removal.toLowerCase())) {
        blacklist.push(slot.nombre);
      }
    }
    if (blacklist.length === 0) blacklist.push(removal);
  }

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

  return { blacklist: [...new Set(blacklist)], strategyHints: foundHints.join(" ") };
}

export function useBuilder() {
  const [state, dispatch] = useReducer(builderReducer, initialState);
  const [sessionId] = useState(() => `sess_${Date.now()}_${Math.random().toString(36).slice(2)}`);

  const generateTeam = useCallback(
    async (leader?: TeamMember | null, feedbackOverride?: string) => {
      dispatch({ type: "SET_LOADING", loading: true });

      const feedback = typeof feedbackOverride === "string" ? feedbackOverride : state.feedback;
      const { blacklist: fbBlacklist, strategyHints } = parseFeedback(feedback, state.team);
      const mergedBlacklist = [...new Set([...state.blacklist, ...fbBlacklist])];

      const configWithHints: BuilderConfig = {
        ...state.config,
        customStrategy: [state.config.customStrategy, strategyHints].filter(Boolean).join(" "),
        generationMode: leader ? "leader" : "scratch",
      };

      const lockedTeam: TeamMember[] = [];
      if (leader) lockedTeam.push(leader);
      state.team.forEach((slot, i) => {
        if (slot && state.lockedSlots[i] && slot.id !== leader?.id) lockedTeam.push(slot);
      });

      try {
        const res = await fetch("/api/pokemon/suggest", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-session-id": sessionId },
          body: JSON.stringify({
            lockedTeam,
            config: { ...configWithHints, blacklist: mergedBlacklist },
            slotIndex: 0,
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          dispatch({ type: "SET_ERROR", error: err.warnings?.[0] ?? "Error al generar equipo" });
          return;
        }

        const data = await res.json();
        const suggestions = data.suggestions ?? [];

        const newTeam: (TeamMember | null)[] = [null, null, null, null, null, null];
        const newBuilds: Record<string, Build> = {};

        if (leader) {
          newTeam[0] = leader;
          const eb = state.builds[String(leader.id)];
          if (eb) newBuilds[String(leader.id)] = eb;
        }

        suggestions.forEach((sug: any, i: number) => {
          const slot = leader ? i + 1 : i;
          if (slot >= 6) return;
          const member: TeamMember = {
            id: Number(sug.id) || (i + 1),
            nombre: sug.name || sug.nombre || "",
            tipo1: sug.tipo1 || "",
            tipo2: sug.tipo2 || null,
            rol: sug.role || sug.rol,
            sprite_url: sug.sprite_url || null,
            national_dex: sug.national_dex || null,
          };
          newTeam[slot] = member;

          const build: Build = {
            ability: sug.build?.ability ?? sug.ability ?? "",
            nature: sug.build?.nature ?? sug.nature ?? "",
            item: sug.build?.item ?? sug.item ?? "",
            moves: sug.build?.moves ?? sug.moves ?? [],
            ev_hp: sug.build?.ev_hp ?? sug.ev_hp ?? 0,
            ev_atk: sug.build?.ev_atk ?? sug.ev_atk ?? 0,
            ev_def: sug.build?.ev_def ?? sug.ev_def ?? 0,
            ev_spa: sug.build?.ev_spa ?? sug.ev_spa ?? 0,
            ev_spd: sug.build?.ev_spd ?? sug.ev_spd ?? 0,
            ev_spe: sug.build?.ev_spe ?? sug.ev_spe ?? 0,
            tera_type: sug.build?.teraType ?? sug.teraType ?? sug.tera_type,
          };
          newBuilds[String(member.id)] = build;
        });

        const aiReport: AiReport | null = data.report
          ? {
              estrategia: data.report.teamComposition ?? "",
              fortalezas: data.report.strengths ?? [],
              ventajas: data.report.strengths ?? [],
              debilidades: data.report.weaknesses ?? [],
              leads: [],
            }
          : null;

        dispatch({ type: "SET_TEAM", team: newTeam, builds: newBuilds, aiReport });
        if (fbBlacklist.length > 0) fbBlacklist.forEach((name) => dispatch({ type: "ADD_TO_BLACKLIST", name }));
      } catch {
        dispatch({ type: "SET_ERROR", error: "Error de red. Intenta de nuevo." });
      }
    },
    [state, sessionId]
  );

  const setSlot = useCallback((i: number, p: TeamMember | null) => dispatch({ type: "SET_SLOT", index: i, pokemon: p }), []);
  const lockSlot = useCallback((i: number, l: boolean) => dispatch({ type: "LOCK_SLOT", index: i, locked: l }), []);
  const setConfig = useCallback((c: Partial<BuilderConfig>) => dispatch({ type: "SET_CONFIG", config: c }), []);
  const setFeedback = useCallback((f: string) => dispatch({ type: "SET_FEEDBACK", feedback: f }), []);
  const addToBlacklist = useCallback((n: string) => dispatch({ type: "ADD_TO_BLACKLIST", name: n }), []);
  const clearBlacklist = useCallback(() => dispatch({ type: "CLEAR_BLACKLIST" }), []);
  const reset = useCallback(() => dispatch({ type: "RESET" }), []);

  return { ...state, generateTeam, setSlot, lockSlot, setConfig, setFeedback, addToBlacklist, clearBlacklist, reset, sessionId };
}