import type { BuilderConfig } from "./config";

// Re-export BuilderConfig so consumers can import it from @/types/pokemon
export type { BuilderConfig };

export interface TeamMember {
  id: number;
  nombre: string;
  tipo1: string;
  tipo2?: string | null;
  tipos?: string[];
  sprite_url?: string | null;
  suggestedBuild?: Build;
  nota?: string;
  rol?: string;
}

export interface Build {
  item?: string;
  ability?: string;
  nature?: string;
  moves?: string[];
  ev_hp?: number;
  ev_atk?: number;
  ev_def?: number;
  ev_spa?: number;
  ev_spd?: number;
  ev_spe?: number;
  iv_atk?: number;
  iv_spe?: number;
  tera_type?: string;
  is_mega?: boolean;
  is_gmax?: boolean;
  is_dynamax?: boolean;
  z_move?: string;
  // custom iv spread text (e.g. "31/31/31/0/31/31")
  ivSpread?: string;
  // optionally included by AI endpoints for explanation
  reasoning?: string;
}

export interface PokemonCandidate {
  id: number;
  nombre: string;
  tipo1: string;
  tipo2?: string | null;
  sprite_url?: string | null;
  tier?: string | null;
  usage_score?: number | null;
  perfil_estrategico?: string | null;
}

interface AiReportInline {
  estrategia: string;
  ventajas: string[];
  debilidades: string[];
  leads: string[];
}

interface ReviewResultInline {
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

export interface SavedTeam {
  id: string;
  userId: string;
  nombre: string;
  descripcion?: string;
  team: TeamMember[];
  builds: Record<string, Build>;
  config: BuilderConfig;
  aiReport?: AiReportInline;
  reviewResult?: ReviewResultInline;
  isPublic: boolean;
  publicSlug?: string;
  formato: string;
  createdAt: string;
  updatedAt: string;
  viewCount?: number;
  likeCount?: number;
}

export interface SlotNote {
  pokemonId: number;
  nota: string;
  rol: string;
  amenazas: string[];
  sinergias: string[];
}

export interface TypeMatchup {
  x4: string[];
  x2: string[];
  x05: string[];
  x025: string[];
  x0: string[];
  score: number;
}

export type DetailedTypeAnalysis = Record<string, TypeMatchup>;