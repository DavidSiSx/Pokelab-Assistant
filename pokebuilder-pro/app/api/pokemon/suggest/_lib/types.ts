/**
 * ARCHIVO: app/api/pokemon/suggest/_lib/types.ts
 */

import type { BuilderConfig, TeamMember } from "@/types/pokemon";
import type { SynergyCombo } from "@/utils/synergy-combos";

export interface SuggestRequest {
  lockedTeam: TeamMember[];
  config: BuilderConfig;
  slotIndex: number;
  sessionId?: string;
  userId?: string;
}

export interface PokemonSuggestion {
  id: string;
  name: string;
  tier: string;
  build: {
    ability: string;
    nature: string;
    evSpread: string;
    ivSpread?: string;
    item: string;
    moves: string[];
    teraType?: string;
    megaStone?: string;
  };
  synergies: string[];
  role: string;
  reasoning: string;
  formatNotes?: string;
  comboNote?: string;
}

export interface SuggestResponse {
  success: boolean;
  suggestions: PokemonSuggestion[];
  report: {
    teamComposition: string;
    typesCoverage: string;
    speedControl: string;
    synergySummary: string;
    weaknesses: string[];
    strengths: string[];
    recommendation: string;
    formatSpecific?: string;
    // ✅ Nuevos campos del reporte enriquecido
    typeChart?: {
      teamWeaknesses: string[];
      teamResistances: string[];
      teamImmunities: string[];
    };
    perPokemon?: Array<{
      name: string;
      role: string;
      counters: string[];
      threatens: string[];
      synergyWith: string[];
    }>;
  };
  meta: {
    timestamp: number;
    configHash: string;
    detectedCombos: SynergyCombo[];
    isDynamicMode: boolean;
    totalCandidatesEvaluated: number;
  };
  warnings?: string[];
}

export interface SuggestState {
  config: BuilderConfig;
  lockedTeam: TeamMember[];
  slotIndex: number;
  leaderName: string;
  candidatePool: string;
  detectedCombos: SynergyCombo[];
  comboItemOverrides: Record<string, string>;
  isDynamicMode: boolean;
  selectionPrompt: string;
  reportPrompt: string;
  comboContext: string;
  rawSelections?: string;
  rawReport?: string;
}

// ✅ Acepta formato A: { selected_ids, builds } y formato B: { suggestions: [...] }
export interface AISelectionResponse {
  // Formato A (nuevo — más limpio)
  selected_ids?: number[];
  builds?: Record<string, {
    item: string;
    ability: string;
    nature: string;
    moves: string[];
    ev_hp?: number;
    ev_atk?: number;
    ev_def?: number;
    ev_spa?: number;
    ev_spd?: number;
    ev_spe?: number;
    iv_atk?: number;
    teraType?: string;
    megaStone?: string;
    role?: string;
    reasoning?: string;
    synergies?: string[];
  }>;
  // Formato B (legacy)
  suggestions?: Array<{
    name: string;
    dex_id?: string;
    ability: string;
    nature: string;
    evSpread: string;
    item: string;
    moves: string[];
    teraType?: string;
    megaStone?: string;
    role: string;
    reasoning: string;
    synergies?: string[];
  }>;
}

// ✅ Acepta campos en inglés (nuevo) y español (legacy)
export interface AIReportResponse {
  // Inglés (nuevo)
  teamComposition?: string;
  typesCoverage?: string;
  speedControl?: string;
  synergySummary?: string;
  weaknesses?: string[];
  strengths?: string[];
  recommendation?: string;
  formatSpecific?: string;
  // Español (legacy — por si el modelo responde en español)
  estrategia?: string;
  ventajas?: string[];
  debilidades?: string[];
  // Análisis enriquecido
  typeChart?: {
    teamWeaknesses: string[];
    teamResistances: string[];
    teamImmunities: string[];
  };
  perPokemon?: Array<{
    name: string;
    role: string;
    counters: string[];
    threatens: string[];
    synergyWith: string[];
  }>;
}

export interface AIError extends Error {
  code: "GEMINI_ERROR" | "OPENROUTER_ERROR" | "PARSE_ERROR" | "VALIDATION_ERROR";
  details?: Record<string, unknown>;
  attemptedKeys?: number;
  fallbackUsed?: boolean;
}