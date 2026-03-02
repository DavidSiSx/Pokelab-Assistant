/**
 * ARCHIVO: app/api/pokemon/suggest/_lib/types.ts
 * Interfaces internas del suggest endpoint
 */

import type { BuilderConfig, TeamMember } from "@/types/pokemon";
import type { SynergyCombo } from "@/utils/synergy-combos";

/**
 * Shape de la request al endpoint /api/pokemon/suggest
 */
export interface SuggestRequest {
  lockedTeam: TeamMember[]; // Equipo actual (0-6 miembros)
  config: BuilderConfig; // Configuración del builder
  slotIndex: number; // Índice del slot a llenar (0-5)
  sessionId?: string; // Para rate limiting (Fase 7)
  userId?: string; // Para tracking (Fase 6)
}

/**
 * Shape de cada sugerencia individual de Pokémon
 */
export interface PokemonSuggestion {
  id: string; // Pokedex ID o base_id
  name: string; // Nombre canonizado (ej: "pikachu", "giratina-origin")
  tier: string; // OU, UU, RU, etc.
  
  // Build recomendado
  build: {
    ability: string; // Habilidad única recomendada
    nature: string; // Naturaleza (Timid, Jolly, etc.)
    evSpread: string; // Ej: "252 SpA / 4 SpD / 252 Spe"
    ivSpread?: string; // IVs personalizados si los requiere
    item: string; // Ítem (Psychic Seed, Life Orb, etc.)
    moves: string[]; // Exactamente 4 movimientos
    teraType?: string; // Tipo Tera (si aplica)
    megaStone?: string; // Mega Stone si es Mega
  };

  // Metadata
  synergies: string[]; // Sinergias detectadas con otros Pokémon
  role: string; // "Physical Sweeper", "Special Wall", etc.
  reasoning: string; // Explicación concisa del por qué

  // Contexto del formato
  formatNotes?: string; // Notas específicas del formato (VGC, Singles, etc.)
  comboNote?: string; // Si es un combo partner explícito
}

/**
 * Shape de la respuesta del suggest endpoint
 */
export interface SuggestResponse {
  success: boolean;
  
  // Array de sugerencias (típicamente 1-5 opciones)
  suggestions: PokemonSuggestion[];
  
  // Análisis detallado del equipo final
  report: {
    teamComposition: string; // "Resumen de arquetipos"
    typesCoverage: string; // "Cobertura de tipos"
    speedControl: string; // "Análisis de control de velocidad"
    synergySummary: string; // "Resumen de sinergias"
    weaknesses: string[]; // ["debilidad a Fuego", "no tiene Stealth Rock"]
    strengths: string[]; // ["buena cobertura defensiva", "velocidad controlada"]
    recommendation: string; // "Recomendación general"
    formatSpecific?: string; // Análisis específico del formato
  };

  // Metadata de la sugerencia
  meta: {
    timestamp: number; // unix timestamp
    configHash: string; // Hash del BuilderConfig para caching
    detectedCombos: SynergyCombo[]; // Combos detectados en el pool
    isDynamicMode: boolean; // ¿Se usó pool vector dinámico?
    totalCandidatesEvaluated: number; // Cuántos candidatos se consideraron
  };

  // Errores parciales (no abortan la respuesta)
  warnings?: string[];
}

/**
 * Estado intermedio durante la generación (uso interno)
 */
export interface SuggestState {
  // Input normalizado
  config: BuilderConfig;
  lockedTeam: TeamMember[];
  slotIndex: number;
  leaderName: string;

  // Pool de candidatos construido
  candidatePool: string; // Prompt con candidatos
  detectedCombos: SynergyCombo[];
  comboItemOverrides: Record<string, string>; // {pokeId: item}
  isDynamicMode: boolean;

  // Prompts compilados
  selectionPrompt: string; // Primera llamada Gemini
  reportPrompt: string; // Segunda llamada Gemini
  comboContext: string; // Contexto de sinergias

  // Respuestas de Gemini
  rawSelections?: string; // JSON crudo de Llamada 1
  rawReport?: string; // JSON crudo de Llamada 2
}

/**
 * Respuesta parcial de la Llamada 1 (selección de Pokémon)
 */
export interface AISelectionResponse {
  suggestions: Array<{
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

/**
 * Respuesta parcial de la Llamada 2 (reporte detallado)
 */
export interface AIReportResponse {
  teamComposition: string;
  typesCoverage: string;
  speedControl: string;
  synergySummary: string;
  weaknesses: string[];
  strengths: string[];
  recommendation: string;
  formatSpecific?: string;
}

/**
 * Error con contexto de IA
 */
export interface AIError extends Error {
  code: "GEMINI_ERROR" | "OPENROUTER_ERROR" | "PARSE_ERROR" | "VALIDATION_ERROR";
  details?: Record<string, unknown>;
  attemptedKeys?: number;
  fallbackUsed?: boolean;
}