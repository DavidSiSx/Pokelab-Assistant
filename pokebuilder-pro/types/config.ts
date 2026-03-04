export interface BuilderConfig {
  format: string;
  customStrategy: string;
  experienceLevel: "novato" | "experto";
  clauses: string[];

  // Filtros
  allowLegendaries: boolean;
  allowMythicals: boolean;
  allowParadox: boolean;
  allowUB: boolean;
  isLittleCup: boolean;
  isRandomizer: boolean;
  metaPreference: "extrememeta" | "meta" | "balanced" | "varied" | "niche";

  // Monotype
  isMonotype: boolean;
  monoTypeSelected: string;

  // Clima / Terreno
  preferredWeather: "none" | "sun" | "rain" | "sand" | "snow";
  preferredTerrain: "none" | "electric" | "grassy" | "psychic" | "misty";

  // Speed Control
  preferTrickRoom: boolean;
  preferTailwind: boolean;

  // Arquetipo
  teamArchetype: "" | "offense" | "balance" | "stall";

  // Mecánicas especiales
  enableMega: boolean;
  enableGmax: boolean;
  enableTera: boolean;
  preferredTeraType: string;
  enableZMoves: boolean;
  enableDynamax: boolean;

  // Regiones
  includeAlola: boolean;
  includeGalar: boolean;
  includeHisui: boolean;
  includePaldea: boolean;

  generationMode: "leader" | "scratch";
}

export const FORMAT_LIST = [
  "VGC 2025 Regulation H",
  "VGC 2024 Regulation G",
  "National Dex",
  "National Dex Doubles",
  "OU Singles",
  "Doubles OU",
  "Little Cup",
  "Ubers",
  "Random Battle",
] as const;

export type SupportedFormat = (typeof FORMAT_LIST)[number];

export const DEFAULT_CONFIG: BuilderConfig = {
  format: "National Dex Doubles",
  customStrategy: "",
  experienceLevel: "experto",
  clauses: ["Species Clause"],

  allowLegendaries: false,
  allowMythicals: false,
  allowParadox: false,
  allowUB: false,
  isLittleCup: false,
  isRandomizer: false,

  metaPreference: "balanced",

  isMonotype: false,
  monoTypeSelected: "",

  preferredWeather: "none",
  preferredTerrain: "none",

  preferTrickRoom: false,
  preferTailwind: false,

  teamArchetype: "",

  enableMega: false,
  enableGmax: false,
  enableTera: true,
  preferredTeraType: "",
  enableZMoves: false,
  enableDynamax: false,

  includeAlola: true,
  includeGalar: true,
  includeHisui: true,
  includePaldea: true,

  generationMode: "leader",
};