import { prisma } from "@/lib/prisma";
import {
  PARADOX_LIST, UB_LIST, MYTHICAL_LIST, LEGENDARY_LIST, LITTLE_CUP_LIST
} from "./constants";

export function toNum(id: any): number { return Number(id); }
export function idInList(id: any, list: number[]): boolean { return list.includes(toNum(id)); }

// ─────────────────────────────────────────────────────────────────
// EXCLUSIÓN BASE — filtra por config del usuario
// ─────────────────────────────────────────────────────────────────
export function isExcluded(nombre: string, config: any): boolean {
  const name = nombre.toLowerCase();

  if (!config.allowParadox     && PARADOX_LIST.includes(name))   return true;
  if (!config.allowUB          && UB_LIST.includes(name))        return true;
  if (!config.allowMythicals   && MYTHICAL_LIST.includes(name))  return true;
  if (!config.allowLegendaries && LEGENDARY_LIST.includes(name)) return true;
  if (config.isLittleCup      && !LITTLE_CUP_LIST.includes(name)) return true;

  return false;
}

// ─────────────────────────────────────────────────────────────────
// FILTRO DE REGIONES — variantes regionales
// ─────────────────────────────────────────────────────────────────
export function isRegionExcluded(nombre: string, config: any): boolean {
  const name = nombre.toLowerCase();

  if (!config.includeAlola  && name.includes("-alola"))  return true;
  if (!config.includeGalar  && name.includes("-galar"))  return true;
  if (!config.includeHisui  && name.includes("-hisui"))  return true;
  if (!config.includePaldea && name.includes("-paldea")) return true;

  return false;
}

// ─────────────────────────────────────────────────────────────────
// FILTRO DE MECÁNICAS — formas que requieren mecánica activa
// ─────────────────────────────────────────────────────────────────
export function isMechanicExcluded(nombre: string, config: any): boolean {
  const name = nombre.toLowerCase();

  // Formas Mega — solo permitidas si enableMega está activo
  if (!config.enableMega && (
    name.includes("-mega") ||
    name.endsWith("-mega-x") ||
    name.endsWith("-mega-y")
  )) return true;

  // Formas Gigantamax — solo permitidas si enableGmax está activo
  if (!config.enableGmax && name.includes("-gmax")) return true;

  // Formas Eternamax — requiere Dynamax
  if (!config.enableDynamax && name === "eternamax") return true;

  return false;
}

// ─────────────────────────────────────────────────────────────────
// FILTRO DE BLACKLIST — Pokémon baneados por el usuario
// ─────────────────────────────────────────────────────────────────
export function isBlacklisted(nombre: string, blacklist: string[]): boolean {
  const name = nombre.toLowerCase();
  return blacklist.map(b => b.toLowerCase()).includes(name);
}

// ─────────────────────────────────────────────────────────────────
// FILTRO MONOTYPE
// ─────────────────────────────────────────────────────────────────
export function applyMonotypeFilter(pool: any[], config: any): any[] {
  if (!config.isMonotype || !config.monoTypeSelected) return pool;
  const mono = config.monoTypeSelected.toLowerCase();
  return pool.filter(p =>
    p.tipo1?.toLowerCase() === mono ||
    p.tipo2?.toLowerCase() === mono
  );
}

// ─────────────────────────────────────────────────────────────────
// FILTRO DE CLIMA — prioriza Pokémon relevantes al clima elegido
// ─────────────────────────────────────────────────────────────────
const WEATHER_ABILITIES: Record<string, string[]> = {
  sun:  ["chlorophyll","drought","flower-gift","solar-power","forecast"],
  rain: ["swift-swim","drizzle","rain-dish","dry-skin","hydration"],
  sand: ["sand-rush","sand-force","sand-stream","sand-veil"],
  snow: ["slush-rush","snow-warning","ice-body","forecast"],
};

// ─────────────────────────────────────────────────────────────────
// FILTRO DE TERRENO — prioriza Pokémon relevantes al terreno elegido
// ─────────────────────────────────────────────────────────────────
const TERRAIN_ABILITIES: Record<string, string[]> = {
  electric: ["electric-surge","surge-surfer","hadron-engine"],
  grassy:   ["grassy-surge","grassy-pelt"],
  psychic:  ["psychic-surge","telepathy"],
  misty:    ["misty-surge","misty-retreat"],
};

// ─────────────────────────────────────────────────────────────────
// FILTRO DE TRICK ROOM — prioriza Pokémon lentos
// ─────────────────────────────────────────────────────────────────
export function applyTrickRoomFilter(pool: any[], config: any): any[] {
  if (!config.preferTrickRoom) return pool;
  // Pokémon con base speed <= 50 son ideales para TR
  // Si tenemos stats en el pool, filtramos; si no, dejamos pasar
  return pool.sort((a, b) => {
    const speA = a.spe_base ?? 50;
    const speB = b.spe_base ?? 50;
    return speA - speB; // lentos primero
  });
}

// ─────────────────────────────────────────────────────────────────
// FILTRO LITTLE CUP — valida que no tenga evolución previa
// (además de estar en la lista)
// ─────────────────────────────────────────────────────────────────
export function applyLittleCupFilter(pool: any[], config: any): any[] {
  if (!config.isLittleCup) return pool;
  return pool.filter(p => LITTLE_CUP_LIST.includes(p.nombre.toLowerCase()));
}

// ─────────────────────────────────────────────────────────────────
// FILTRO RANDOMIZER — mezcla aleatoria del pool
// ─────────────────────────────────────────────────────────────────
export function applyRandomizerFilter(pool: any[]): any[] {
  return [...pool].sort(() => Math.random() - 0.5);
}

// ─────────────────────────────────────────────────────────────────
// FILTRO DE TIER — excluye Pokémon debajo de cierto tier
// ─────────────────────────────────────────────────────────────────
const TIER_ORDER = ["S","OU","UU","RU","NU","PU","LC","Unranked"];

export function applyTierFilter(pool: any[], minTier?: string): any[] {
  if (!minTier || minTier === "Unranked") return pool;
  const minIndex = TIER_ORDER.indexOf(minTier);
  if (minIndex === -1) return pool;
  return pool.filter(p => {
    const tierIndex = TIER_ORDER.indexOf(p.tier ?? "Unranked");
    return tierIndex !== -1 && tierIndex <= minIndex;
  });
}

// ─────────────────────────────────────────────────────────────────
// FILTRO COMBINADO — aplica todos los filtros de una vez
// ─────────────────────────────────────────────────────────────────
export function applyAllFilters(
  pool: any[],
  config: any,
  options: {
    excludeIds?: number[];
    blacklist?: string[];
    minTier?: string;
  } = {}
): any[] {
  const { excludeIds = [], blacklist = [], minTier } = options;

  return pool.filter(p => {
    // IDs excluidos (equipo actual, bloqueados, líder)
    if (excludeIds.length > 0 && idInList(p.id, excludeIds)) return false;

    // Blacklist del usuario
    if (blacklist.length > 0 && isBlacklisted(p.nombre, blacklist)) return false;

    // Filtros de categoría
    if (isExcluded(p.nombre, config))       return false;

    // Filtros de región
    if (isRegionExcluded(p.nombre, config)) return false;

    // Filtros de mecánicas
    if (isMechanicExcluded(p.nombre, config)) return false;

    return true;
  });
}

// ─────────────────────────────────────────────────────────────────
// DEDUPLICAR — elimina duplicados por ID
// ─────────────────────────────────────────────────────────────────
export function deduplicateById(arr: any[]): any[] {
  const seen = new Set<number>();
  return arr.filter(p => {
    if (seen.has(toNum(p.id))) return false;
    seen.add(toNum(p.id));
    return true;
  });
}

// ─────────────────────────────────────────────────────────────────
// EXPAND MONOTYPE — si el pool monotype es muy pequeño, lo expande
// ─────────────────────────────────────────────────────────────────
export async function expandMonotypePool(
  mono: string,
  config: any,
  excludeIds: number[],
  limit: number
): Promise<any[]> {
  try {
    const extra: any[] = await prisma.$queryRaw`
      SELECT p.id, p.nombre, p.tipo1, p.tipo2,
             COALESCE(am.perfil_estrategico, '') as perfil_estrategico,
             COALESCE(am.usage_score, 0)         as usage_score,
             COALESCE(am.tier, 'Unranked')       as tier
      FROM "Pokemon" p
      LEFT JOIN "AnalisisMeta" am ON p.id = am.pokemon_id
      WHERE (LOWER(p.tipo1) = ${mono} OR LOWER(p.tipo2) = ${mono})
      ORDER BY COALESCE(am.usage_score, 0) DESC
      LIMIT ${limit}
    `;

    return extra
      .filter(p => !excludeIds.includes(toNum(p.id)))
      .filter(p => !isExcluded(p.nombre, config))
      .filter(p => !isRegionExcluded(p.nombre, config))
      .filter(p => !isMechanicExcluded(p.nombre, config))
      .map(p => ({ ...p, id: toNum(p.id) }));
  } catch {
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────
// NORMALIZE CONFIG — normaliza campos con nombres alternativos
// ─────────────────────────────────────────────────────────────────
export function normalizeConfig(raw: any): any {
  const allowMythicals = raw.allowMythicals ?? raw.allowMythical ?? true;
  return {
    ...raw,
    allowMythicals,
    allowMythical: allowMythicals,
    // defaults seguros para campos opcionales
    includeAlola:  raw.includeAlola  ?? true,
    includeGalar:  raw.includeGalar  ?? true,
    includeHisui:  raw.includeHisui  ?? true,
    includePaldea: raw.includePaldea ?? true,
    allowParadox:  raw.allowParadox  ?? false,
    allowUB:       raw.allowUB       ?? false,
    allowLegendaries: raw.allowLegendaries ?? false,
    isLittleCup:   raw.isLittleCup   ?? false,
    isMonotype:    raw.isMonotype    ?? false,
    isRandomizer:  raw.isRandomizer  ?? false,
    enableMega:    raw.enableMega    ?? false,
    enableGmax:    raw.enableGmax    ?? false,
    enableTera:    raw.enableTera    ?? true,
    enableZMoves:  raw.enableZMoves  ?? false,
    enableDynamax: raw.enableDynamax ?? false,
    blacklist:     raw.blacklist     ?? [],
  };
}