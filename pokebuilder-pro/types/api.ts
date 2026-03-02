import { TeamMember, Build, PokemonCandidate, SavedTeam } from "./pokemon";
import { BuilderConfig } from "./config";

// ── Suggest ──────────────────────────────────────────────
export interface SuggestRequest {
  leader?: TeamMember | null;
  currentTeam: (TeamMember | null)[];
  lockedSlots: boolean[];
  blacklist: string[];
  config: BuilderConfig;
}

export interface SuggestResponse {
  team: TeamMember[];
  validLockedIds: number[];
  aiReport: AiReport;
  builds: Record<string, Build>;
  isDynamicMode: boolean;
}

export interface AiReport {
  estrategia: string;
  ventajas: string[];
  debilidades: string[];
  leads: string[];
}

// ── Review ───────────────────────────────────────────────
export interface ReviewRequest {
  team: TeamMember[];
  config: BuilderConfig;
}

export interface ReviewResult {
  score: number;
  grade: "A+" | "A" | "B" | "C" | "D" | "F";
  analisis: string;
  debilidades: string[];
  sugerencias: string[];
  metaVerdict: string;
  categorias: {
    sinergia: number;
    cobertura: number;
    speedControl: number;
    hazardControl: number;
    winCondition: number;
  };
  ratings: Record<string, { score: number; comentario: string }>;
}

// ── Comparación de equipos ───────────────────────────────
export interface TeamComparisonRequest {
  teamA: TeamMember[];
  teamB: TeamMember[];
  config: BuilderConfig;
}

export interface TeamComparisonResult {
  winner: "A" | "B" | "empate";
  scoreDiff: number;
  reviewA: ReviewResult;
  reviewB: ReviewResult;
  analisisComparativo: string;
  ventajasA: string[];      // ventajas de A sobre B
  ventajasB: string[];      // ventajas de B sobre A
  recomendacion: string;    // qué cambiar para mejorar el equipo perdedor
}

// ── Search ───────────────────────────────────────────────
export interface SearchResult {
  id: number;
  nombre: string;
  tipo1: string;
  tipo2?: string | null;
  sprite_url?: string | null;
}

// ── Teams guardados ──────────────────────────────────────
export interface SaveTeamRequest {
  nombre: string;
  descripcion?: string;
  team: TeamMember[];
  builds: Record<string, Build>;
  config: BuilderConfig;
  aiReport?: AiReport;
  isPublic?: boolean;
}

export interface SaveTeamResponse {
  team: SavedTeam;
  publicUrl?: string;       // si isPublic=true, devuelve la URL para compartir
}

export interface GetTeamsResponse {
  teams: SavedTeam[];
  total: number;
}

// ── Candidate pool interno ───────────────────────────────
export interface CandidateWithMeta extends PokemonCandidate {
  megaStone?: string;
}

// ── Errores estándar de API ──────────────────────────────
export interface ApiError {
  error: string;
  code?: "RATE_LIMIT" | "UNAUTHORIZED" | "NOT_FOUND" | "AI_FAILED" | "VALIDATION";
  retryAfter?: number;      // segundos hasta poder reintentar (rate limit)
}