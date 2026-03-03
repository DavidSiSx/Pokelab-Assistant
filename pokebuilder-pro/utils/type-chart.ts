/**
 * Full 18x18 Pokemon type effectiveness matrix + team analysis utilities.
 */

export const ALL_TYPES = [
  "Normal", "Fire", "Water", "Electric", "Grass", "Ice",
  "Fighting", "Poison", "Ground", "Flying", "Psychic", "Bug",
  "Rock", "Ghost", "Dragon", "Dark", "Steel", "Fairy",
] as const;

export type PokemonType = (typeof ALL_TYPES)[number];

// Type name mappings (English -> Spanish)
export const TYPE_NAMES_ES: Record<string, string> = {
  Normal: "Normal", Fire: "Fuego", Water: "Agua", Electric: "Electrico",
  Grass: "Planta", Ice: "Hielo", Fighting: "Lucha", Poison: "Veneno",
  Ground: "Tierra", Flying: "Volador", Psychic: "Psiquico", Bug: "Bicho",
  Rock: "Roca", Ghost: "Fantasma", Dragon: "Dragon", Dark: "Siniestro",
  Steel: "Acero", Fairy: "Hada",
};

// Spanish -> English reverse map
export const TYPE_NAMES_EN: Record<string, string> = Object.fromEntries(
  Object.entries(TYPE_NAMES_ES).map(([en, es]) => [es.toLowerCase(), en])
);

/**
 * Effectiveness matrix: CHART[attacking][defending] = multiplier
 * 1 = normal, 2 = super effective, 0.5 = not very effective, 0 = immune
 */
const CHART: Record<string, Record<string, number>> = {
  Normal:   { Normal:1, Fire:1, Water:1, Electric:1, Grass:1, Ice:1, Fighting:1, Poison:1, Ground:1, Flying:1, Psychic:1, Bug:1, Rock:0.5, Ghost:0, Dragon:1, Dark:1, Steel:0.5, Fairy:1 },
  Fire:     { Normal:1, Fire:0.5, Water:0.5, Electric:1, Grass:2, Ice:2, Fighting:1, Poison:1, Ground:1, Flying:1, Psychic:1, Bug:2, Rock:0.5, Ghost:1, Dragon:0.5, Dark:1, Steel:2, Fairy:1 },
  Water:    { Normal:1, Fire:2, Water:0.5, Electric:1, Grass:0.5, Ice:1, Fighting:1, Poison:1, Ground:2, Flying:1, Psychic:1, Bug:1, Rock:2, Ghost:1, Dragon:0.5, Dark:1, Steel:1, Fairy:1 },
  Electric: { Normal:1, Fire:1, Water:2, Electric:0.5, Grass:0.5, Ice:1, Fighting:1, Poison:1, Ground:0, Flying:2, Psychic:1, Bug:1, Rock:1, Ghost:1, Dragon:0.5, Dark:1, Steel:1, Fairy:1 },
  Grass:    { Normal:1, Fire:0.5, Water:2, Electric:1, Grass:0.5, Ice:1, Fighting:1, Poison:0.5, Ground:2, Flying:0.5, Psychic:1, Bug:0.5, Rock:2, Ghost:1, Dragon:0.5, Dark:1, Steel:0.5, Fairy:1 },
  Ice:      { Normal:1, Fire:0.5, Water:0.5, Electric:1, Grass:2, Ice:0.5, Fighting:1, Poison:1, Ground:2, Flying:2, Psychic:1, Bug:1, Rock:1, Ghost:1, Dragon:2, Dark:1, Steel:0.5, Fairy:1 },
  Fighting: { Normal:2, Fire:1, Water:1, Electric:1, Grass:1, Ice:2, Fighting:1, Poison:0.5, Ground:1, Flying:0.5, Psychic:0.5, Bug:0.5, Rock:2, Ghost:0, Dragon:1, Dark:2, Steel:2, Fairy:0.5 },
  Poison:   { Normal:1, Fire:1, Water:1, Electric:1, Grass:2, Ice:1, Fighting:1, Poison:0.5, Ground:0.5, Flying:1, Psychic:1, Bug:1, Rock:0.5, Ghost:0.5, Dragon:1, Dark:1, Steel:0, Fairy:2 },
  Ground:   { Normal:1, Fire:2, Water:1, Electric:2, Grass:0.5, Ice:1, Fighting:1, Poison:2, Ground:1, Flying:0, Psychic:1, Bug:0.5, Rock:2, Ghost:1, Dragon:1, Dark:1, Steel:2, Fairy:1 },
  Flying:   { Normal:1, Fire:1, Water:1, Electric:0.5, Grass:2, Ice:1, Fighting:2, Poison:1, Ground:1, Flying:1, Psychic:1, Bug:2, Rock:0.5, Ghost:1, Dragon:1, Dark:1, Steel:0.5, Fairy:1 },
  Psychic:  { Normal:1, Fire:1, Water:1, Electric:1, Grass:1, Ice:1, Fighting:2, Poison:2, Ground:1, Flying:1, Psychic:0.5, Bug:1, Rock:1, Ghost:1, Dragon:1, Dark:0, Steel:0.5, Fairy:1 },
  Bug:      { Normal:1, Fire:0.5, Water:1, Electric:1, Grass:2, Ice:1, Fighting:0.5, Poison:0.5, Ground:1, Flying:0.5, Psychic:2, Bug:1, Rock:1, Ghost:0.5, Dragon:1, Dark:2, Steel:0.5, Fairy:0.5 },
  Rock:     { Normal:1, Fire:2, Water:1, Electric:1, Grass:1, Ice:2, Fighting:0.5, Poison:1, Ground:0.5, Flying:2, Psychic:1, Bug:2, Rock:1, Ghost:1, Dragon:1, Dark:1, Steel:0.5, Fairy:1 },
  Ghost:    { Normal:0, Fire:1, Water:1, Electric:1, Grass:1, Ice:1, Fighting:1, Poison:1, Ground:1, Flying:1, Psychic:2, Bug:1, Rock:1, Ghost:2, Dragon:1, Dark:0.5, Steel:1, Fairy:1 },
  Dragon:   { Normal:1, Fire:1, Water:1, Electric:1, Grass:1, Ice:1, Fighting:1, Poison:1, Ground:1, Flying:1, Psychic:1, Bug:1, Rock:1, Ghost:1, Dragon:2, Dark:1, Steel:0.5, Fairy:0 },
  Dark:     { Normal:1, Fire:1, Water:1, Electric:1, Grass:1, Ice:1, Fighting:0.5, Poison:1, Ground:1, Flying:1, Psychic:2, Bug:1, Rock:1, Ghost:2, Dragon:1, Dark:0.5, Steel:0.5, Fairy:0.5 },
  Steel:    { Normal:1, Fire:0.5, Water:0.5, Electric:0.5, Grass:1, Ice:2, Fighting:1, Poison:1, Ground:1, Flying:1, Psychic:1, Bug:1, Rock:2, Ghost:1, Dragon:1, Dark:1, Steel:0.5, Fairy:2 },
  Fairy:    { Normal:1, Fire:0.5, Water:1, Electric:1, Grass:1, Ice:1, Fighting:2, Poison:0.5, Ground:1, Flying:1, Psychic:1, Bug:1, Rock:1, Ghost:1, Dragon:2, Dark:2, Steel:0.5, Fairy:1 },
};

/**
 * Get the effectiveness multiplier of an attacking type vs a defending pokemon's types.
 */
export function getEffectiveness(
  attackingType: string,
  defendingTypes: string[]
): number {
  const atk = normalizeType(attackingType);
  if (!CHART[atk]) return 1;
  return defendingTypes.reduce((mult, dt) => {
    const def = normalizeType(dt);
    return mult * (CHART[atk]?.[def] ?? 1);
  }, 1);
}

function normalizeType(t: string): string {
  const lower = t.toLowerCase().trim();
  // Try English first
  const english = ALL_TYPES.find((at) => at.toLowerCase() === lower);
  if (english) return english;
  // Try Spanish -> English
  const mapped = TYPE_NAMES_EN[lower];
  if (mapped) return mapped;
  // Capitalize first letter as fallback
  return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
}

export interface TypeScore {
  type: string;
  typeEs: string;
  score: number; // positive = team is weak, negative = team resists
  weakPokemon: string[];   // pokemon weak to this type
  resistPokemon: string[]; // pokemon that resist this type
  immunePokemon: string[]; // pokemon immune to this type
}

export interface TeamWeaknessProfile {
  typeScores: TypeScore[];
  criticalWeaknesses: TypeScore[]; // score >= 2
  strongResistances: TypeScore[];  // score <= -2
  immunities: TypeScore[];         // has immune pokemon
}

/**
 * Analyze a team's weaknesses and resistances against all 18 types.
 */
export function getTeamWeaknessProfile(
  team: Array<{ nombre: string; tipo1: string; tipo2?: string | null }>
): TeamWeaknessProfile {
  const typeScores: TypeScore[] = ALL_TYPES.map((attackType) => {
    const weakPokemon: string[] = [];
    const resistPokemon: string[] = [];
    const immunePokemon: string[] = [];

    for (const poke of team) {
      if (!poke.tipo1) continue;
      const types = [poke.tipo1, poke.tipo2].filter(Boolean) as string[];
      const mult = getEffectiveness(attackType, types);

      if (mult === 0) immunePokemon.push(poke.nombre);
      else if (mult >= 2) weakPokemon.push(poke.nombre);
      else if (mult < 1) resistPokemon.push(poke.nombre);
    }

    const score = weakPokemon.length - resistPokemon.length - immunePokemon.length;

    return {
      type: attackType,
      typeEs: TYPE_NAMES_ES[attackType] || attackType,
      score,
      weakPokemon,
      resistPokemon,
      immunePokemon,
    };
  });

  return {
    typeScores,
    criticalWeaknesses: typeScores.filter((ts) => ts.score >= 2),
    strongResistances: typeScores.filter((ts) => ts.score <= -2),
    immunities: typeScores.filter((ts) => ts.immunePokemon.length > 0),
  };
}

/** CSS colors for each type (matches .type-* classes) */
export const TYPE_COLORS: Record<string, string> = {
  Normal: "#9ca3af", Fire: "#f97316", Water: "#3b82f6", Electric: "#eab308",
  Grass: "#22c55e", Ice: "#67e8f9", Fighting: "#b45309", Poison: "#a855f7",
  Ground: "#d97706", Flying: "#818cf8", Psychic: "#ec4899", Bug: "#84cc16",
  Rock: "#78716c", Ghost: "#6d28d9", Dragon: "#6366f1", Dark: "#525252",
  Steel: "#94a3b8", Fairy: "#f9a8d4",
};
