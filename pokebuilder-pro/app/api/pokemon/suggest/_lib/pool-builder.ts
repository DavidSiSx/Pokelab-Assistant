import { prisma } from "@/lib/prisma";
import {
  applyAllFilters,
  applyMonotypeFilter,
  applyRandomizerFilter,
  expandMonotypePool,
  deduplicateById,
  toNum,
  isExcluded,
} from "./filters";
import {
  SYNERGY_COMBOS,
  getCombosForPokemon,
  type SynergyCombo,
} from "@/utils/synergy-combos";

interface PoolOptions {
  leaderId?: number | null;
  lockedIds?: number[];
  ignoredIds?: number[];
  blacklist?: string[];
  config: any;
}

interface PoolResult {
  candidatePool: any[];
  isDynamicMode: boolean;
  detectedCombos: SynergyCombo[];
  comboItemOverrides: Record<string, string>; // pokemonNombre → item sugerido por combo
}

// ─────────────────────────────────────────────────────────────────
// TRICK ROOM FILTER
// ─────────────────────────────────────────────────────────────────
function applyTrickRoomFilter(pool: any[]): any[] {
  return [...pool].sort((a, b) => {
    const speA = a.spe_base ?? 999;
    const speB = b.spe_base ?? 999;
    const atkA = Math.max(a.atk_base ?? 0, a.spa_base ?? 0);
    const atkB = Math.max(b.atk_base ?? 0, b.spa_base ?? 0);
    const bulkA = (a.hp_base ?? 50) + (a.def_base ?? 50) + (a.spd_base ?? 50);
    const bulkB = (b.hp_base ?? 50) + (b.def_base ?? 50) + (b.spd_base ?? 50);

    const scoreA = (Math.max(0, 150 - speA) * 0.4) + (atkA * 0.35) + (bulkA * 0.0833);
    const scoreB = (Math.max(0, 150 - speB) * 0.4) + (atkB * 0.35) + (bulkB * 0.0833);

    return scoreB - scoreA;
  });
}

// ─────────────────────────────────────────────────────────────────
// STRATIFY POOL
// ─────────────────────────────────────────────────────────────────
function stratifyPool(pool: any[], config: any): any[] {
  const pref = config.metaPreference ?? "balanced";

  const presets: Record<string, {
    highThreshold: number;
    viableThreshold: number;
    highLimit: number;
    viableLimit: number;
    nicheLimit: number;
  }> = {
    extrememeta: { highThreshold: 15, viableThreshold: 5,  highLimit: 22, viableLimit: 6,  nicheLimit: 2  },
    meta:        { highThreshold: 10, viableThreshold: 3,  highLimit: 18, viableLimit: 8,  nicheLimit: 4  },
    balanced:    { highThreshold: 5,  viableThreshold: 1,  highLimit: 14, viableLimit: 12, nicheLimit: 6  },
    varied:      { highThreshold: 5,  viableThreshold: 1,  highLimit: 8,  viableLimit: 12, nicheLimit: 10 },
    niche:       { highThreshold: 5,  viableThreshold: 1,  highLimit: 4,  viableLimit: 8,  nicheLimit: 18 },
  };

  const preset = presets[pref] ?? presets.balanced;

  const highMeta = pool
    .filter(item => (item.usage_score ?? 0) > preset.highThreshold)
    .slice(0, preset.highLimit);

  const viable = pool
    .filter(item => (item.usage_score ?? 0) > preset.viableThreshold && (item.usage_score ?? 0) <= preset.highThreshold)
    .slice(0, preset.viableLimit);

  const niche = pool
    .filter(item => (item.usage_score ?? 0) <= preset.viableThreshold)
    .slice(0, preset.nicheLimit);

  const shuffle = (arr: any[]) => [...arr].sort(() => Math.random() - 0.5);

  return deduplicateById([
    ...shuffle(highMeta),
    ...shuffle(viable),
    ...shuffle(niche),
  ]);
}

// ─────────────────────────────────────────────────────────────────
// DETECT COMBOS — detecta sinergias en el pool actual
// ─────────────────────────────────────────────────────────────────
function detectCombos(
  pool: any[],
  leaderName: string | null,
  lockedNames: string[],
  config: any
): {
  detectedCombos: SynergyCombo[];
  comboBoostIds: Set<number>;
  comboItemOverrides: Record<string, string>;
} {
  const detectedCombos: SynergyCombo[] = [];
  const comboBoostIds = new Set<number>();
  const comboItemOverrides: Record<string, string> = {};

  const f = (config.format || "").toLowerCase();
  const isVGC = f.includes("vgc") || f.includes("doubles");
  const isSingles = f.includes("singles") || f.includes("ou");

  // Nombres actuales en el pool + líder + locked
  const poolNames = pool.map(p => p.nombre.toLowerCase());
  const allCurrentNames = [
    ...poolNames,
    ...(leaderName ? [leaderName.toLowerCase()] : []),
    ...lockedNames.map(n => n.toLowerCase()),
  ];

  // Filtrar combos por formato
  const relevantCombos = SYNERGY_COMBOS.filter(combo => {
    if (isVGC && !combo.format.some(f =>
      f.toLowerCase().includes("vgc") || f.toLowerCase().includes("doubles")
    )) return false;
    if (isSingles && !combo.format.some(f =>
      f.toLowerCase().includes("ou") || f.toLowerCase().includes("singles") ||
      f.toLowerCase().includes("national") || f.toLowerCase().includes("cobblemon")
    )) return false;
    return true;
  });

  for (const combo of relevantCombos) {
    // Normalizar nombres del combo
    const comboNames = combo.pokemon.map(p =>
      p.toLowerCase().replace(/[^a-z0-9-]/g, "")
    );

    // Contar cuántos Pokémon del combo están presentes
    const presentInPool = comboNames.filter(cn =>
      allCurrentNames.some(pn => {
        const normalized = pn.replace(/[^a-z0-9-]/g, "");
        return normalized === cn ||
          normalized.startsWith(cn) ||
          cn.startsWith(normalized);
      })
    );

    // Si al menos 1 Pokémon del combo está presente (líder o locked),
    // boosteamos a los compañeros del combo en el pool
    if (presentInPool.length >= 1) {
      detectedCombos.push(combo);

      // Buscar los compañeros que faltan y que están en el pool
      const missingPartners = comboNames.filter(cn =>
        !presentInPool.includes(cn)
      );

      for (const partnerName of missingPartners) {
        const poolMatch = pool.find(p => {
          const normalized = p.nombre.toLowerCase().replace(/[^a-z0-9-]/g, "");
          return normalized === partnerName ||
            normalized.startsWith(partnerName) ||
            partnerName.startsWith(normalized);
        });

        if (poolMatch) {
          comboBoostIds.add(poolMatch.id);

          // Aplicar item override si el combo tiene items específicos
          // Ejemplo: Sneasler + Indeedee → Sneasler lleva Psychic Seed
          applyComboItemOverride(
            poolMatch.nombre,
            combo,
            allCurrentNames,
            comboItemOverrides,
            config
          );
        }
      }
    }
  }

  return { detectedCombos, comboBoostIds, comboItemOverrides };
}

// ─────────────────────────────────────────────────────────────────
// APPLY COMBO ITEM OVERRIDE — items específicos por combo
// ─────────────────────────────────────────────────────────────────
function applyComboItemOverride(
  pokemonNombre: string,
  combo: SynergyCombo,
  currentNames: string[],
  overrides: Record<string, string>,
  config: any
): void {
  const name = pokemonNombre.toLowerCase();

  // ── Psychic Seed para Sneasler si hay Indeedee ────────────────
  if (name.includes("sneasler") && combo.id.includes("sneasler")) {
    const hasIndeedee = currentNames.some(n => n.includes("indeedee"));
    if (hasIndeedee) {
      overrides[pokemonNombre] = "Psychic Seed";
    }
  }

  // ── Electric Seed si hay setter de Electric Terrain ───────────
  if (combo.tags.includes("electric-terrain")) {
    const hasElectricSetter = currentNames.some(n =>
      ["tapu-koko", "pincurchin", "raichu-alola"].some(s => n.includes(s))
    );
    if (hasElectricSetter && combo.keyItems.includes("Electric Seed")) {
      overrides[pokemonNombre] = "Electric Seed";
    }
  }

  // ── Grassy Seed si hay setter de Grassy Terrain ───────────────
  if (combo.tags.includes("grassy-terrain")) {
    const hasGrassySetter = currentNames.some(n =>
      ["tapu-bulu", "rillaboom"].some(s => n.includes(s))
    );
    if (hasGrassySetter && combo.keyItems.includes("Grassy Seed")) {
      overrides[pokemonNombre] = "Grassy Seed";
    }
  }

  // ── Damp Rock para setters de lluvia ─────────────────────────
  if (combo.tags.includes("rain") && combo.keyItems.includes("Damp Rock")) {
    const isRainSetter = ["pelipper", "politoed", "kyogre"].some(s =>
      name.includes(s)
    );
    if (isRainSetter) {
      overrides[pokemonNombre] = "Damp Rock";
    }
  }

  // ── Heat Rock para setters de sol ────────────────────────────
  if (combo.tags.includes("sun") && combo.keyItems.includes("Heat Rock")) {
    const isSunSetter = ["ninetales-alola", "torkoal", "groudon"].some(s =>
      name.includes(s)
    );
    if (isSunSetter) {
      overrides[pokemonNombre] = "Heat Rock";
    }
  }

  // ── Smooth Rock para setters de arena ────────────────────────
  if (combo.tags.includes("sand") && combo.keyItems.includes("Smooth Rock")) {
    const isSandSetter = ["tyranitar", "hippowdon"].some(s =>
      name.includes(s)
    );
    if (isSandSetter) {
      overrides[pokemonNombre] = "Smooth Rock";
    }
  }

  // ── Icy Rock para setters de nieve ───────────────────────────
  if (combo.tags.includes("snow") && combo.keyItems.includes("Icy Rock")) {
    const isSnowSetter = ["ninetales-alola", "abomasnow"].some(s =>
      name.includes(s)
    );
    if (isSnowSetter) {
      overrides[pokemonNombre] = "Icy Rock";
    }
  }

  // ── Focus Sash para setters de TR ────────────────────────────
  if (combo.tags.includes("trick-room")) {
    const isTRSetter = ["hatterene", "indeedee", "reuniclus", "porygon2"].some(s =>
      name.includes(s)
    );
    if (isTRSetter && !overrides[pokemonNombre]) {
      overrides[pokemonNombre] = "Mental Herb";
    }
  }

  // ── Throat Spray para Boomburst/Hyper Voice ──────────────────
  if (combo.tags.includes("sound-move")) {
    const isSoundUser = ["exploud", "sylveon", "meowstic"].some(s =>
      name.includes(s)
    );
    if (isSoundUser) {
      overrides[pokemonNombre] = "Throat Spray";
    }
  }

  // ── Weakness Policy para abusers de TR que reciben golpes ────
  if (combo.tags.includes("trick-room") && combo.tags.includes("beast-boost")) {
    if (name.includes("stakataka")) {
      overrides[pokemonNombre] = "Weakness Policy";
    }
  }
}

// ─────────────────────────────────────────────────────────────────
// BOOST COMBO PARTNERS — sube prioridad de partners de combo
// ─────────────────────────────────────────────────────────────────
function boostComboPartners(
  pool: any[],
  comboBoostIds: Set<number>,
): any[] {
  if (comboBoostIds.size === 0) return pool;

  // Separar boosteados y no boosteados
  const boosted = pool.filter(p => comboBoostIds.has(p.id));
  const rest = pool.filter(p => !comboBoostIds.has(p.id));

  // Los boosteados van primero
  return [...boosted, ...rest];
}

// ─────────────────────────────────────────────────────────────────
// VECTOR POOL
// ─────────────────────────────────────────────────────────────────
async function buildVectorPool(leaderId: number, limit = 100): Promise<{
  pool: any[];
  isDynamicMode: boolean;
}> {
  const leaderData: any[] = await prisma.$queryRaw`
    SELECT embedding::text as embedding
    FROM "AnalisisMeta"
    WHERE pokemon_id = ${leaderId}
    LIMIT 1
  `;

  if (!leaderData || leaderData.length === 0 || !leaderData[0].embedding) {
    const fallback: any[] = await prisma.$queryRaw`
      SELECT p.id, p.nombre, p.tipo1, p.tipo2,
             p.hp_base, p.atk_base, p.def_base, p.spa_base, p.spd_base, p.spe_base,
             COALESCE(am.perfil_estrategico, '') as perfil_estrategico,
             COALESCE(am.usage_score, 0)         as usage_score,
             COALESCE(am.tier, 'Unranked')       as tier
      FROM "Pokemon" p
      JOIN "AnalisisMeta" am ON p.id = am.pokemon_id
      WHERE p.id != ${leaderId}
      ORDER BY COALESCE(am.usage_score, 0) DESC, RANDOM()
      LIMIT ${limit}
    `;
    return { pool: fallback, isDynamicMode: true };
  }

  const vectorStr = leaderData[0].embedding;
  const pool: any[] = await prisma.$queryRaw`
    SELECT p.id, p.nombre, p.tipo1, p.tipo2,
           p.hp_base, p.atk_base, p.def_base, p.spa_base, p.spd_base, p.spe_base,
           COALESCE(am.perfil_estrategico, '') as perfil_estrategico,
           COALESCE(am.usage_score, 0)         as usage_score,
           COALESCE(am.tier, 'Unranked')       as tier
    FROM "Pokemon" p
    JOIN "AnalisisMeta" am ON p.id = am.pokemon_id
    WHERE p.id != ${leaderId}
    ORDER BY (am.embedding <=> ${vectorStr}::vector)
           * (1.0 - LEAST(COALESCE(am.usage_score, 0) / 50.0, 0.4))
    LIMIT ${limit}
  `;

  return { pool, isDynamicMode: false };
}

// ─────────────────────────────────────────────────────────────────
// SCRATCH POOL
// ─────────────────────────────────────────────────────────────────
async function buildScratchPool(limit = 150): Promise<any[]> {
  return prisma.$queryRaw`
    SELECT p.id, p.nombre, p.tipo1, p.tipo2,
           p.hp_base, p.atk_base, p.def_base, p.spa_base, p.spd_base, p.spe_base,
           COALESCE(am.perfil_estrategico, '') as perfil_estrategico,
           COALESCE(am.usage_score, 0)         as usage_score,
           COALESCE(am.tier, 'Unranked')       as tier
    FROM "Pokemon" p
    JOIN "AnalisisMeta" am ON p.id = am.pokemon_id
    ORDER BY COALESCE(am.usage_score, 0) DESC, RANDOM()
    LIMIT ${limit}
  `;
}

// ─────────────────────────────────────────────────────────────────
// HANDLE MONOTYPE
// ─────────────────────────────────────────────────────────────────
async function handleMonotype(
  pool: any[],
  config: any,
  excludeIds: number[],
  slotsNeeded: number
): Promise<any[]> {
  if (!config.isMonotype || !config.monoTypeSelected) return pool;

  const mono = config.monoTypeSelected.toLowerCase();
  let filtered = applyMonotypeFilter(pool, config);

  if (filtered.length < slotsNeeded + 2) {
    const existingIds = [...filtered.map((p: any) => p.id), ...excludeIds];
    const extra = await expandMonotypePool(mono, config, existingIds, 50);
    const seen = new Set(filtered.map((p: any) => p.id));
    for (const p of extra) {
      if (!seen.has(p.id)) {
        filtered.push(p);
        seen.add(p.id);
      }
    }
  }

  return filtered;
}

// ─────────────────────────────────────────────────────────────────
// GET LEGAL MOVES
// ─────────────────────────────────────────────────────────────────
export async function getLegalMovesFromPokeAPI(pokemonName: string): Promise<string | null> {
  try {
    const cleanName = pokemonName
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${cleanName}`);
    if (!res.ok) return null;

    const data = await res.json();
    return (data.moves as any[])
      .map((m: any) => m.move.name)
      .slice(0, 60)
      .join(", ");
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────
// GET LEADER NAME
// ─────────────────────────────────────────────────────────────────
export async function getLeaderName(leaderId: number): Promise<string> {
  const result: any[] = await prisma.$queryRaw`
    SELECT nombre FROM "Pokemon" WHERE id = ${leaderId} LIMIT 1
  `;
  return result.length > 0 ? result[0].nombre : "Líder Desconocido";
}

// ─────────────────────────────────────────────────────────────────
// BUILD CANDIDATE POOL — función principal
// ─────────────────────────────────────────────────────────────────
export async function buildCandidatePool(
  options: PoolOptions,
  slotsNeeded: number,
  scratchMode = false,
  leaderName: string | null = null,
  lockedNames: string[] = [],
): Promise<PoolResult> {
  const {
    leaderId,
    lockedIds = [],
    ignoredIds = [],
    blacklist = [],
    config,
  } = options;

  const excludeIds = [
    ...lockedIds,
    ...ignoredIds,
    ...(leaderId ? [leaderId] : []),
  ];

  // ── 1. Raw pool ──────────────────────────────────────────────
  let rawPool: any[];
  let isDynamicMode = false;

  if (scratchMode || !leaderId) {
    rawPool = await buildScratchPool(150);
  } else {
    const result = await buildVectorPool(leaderId, 100);
    rawPool = result.pool;
    isDynamicMode = result.isDynamicMode;
  }

  // ── 2. Normalizar IDs ────────────────────────────────────────
  rawPool = rawPool.map(p => ({ ...p, id: toNum(p.id) }));

  // ── 3. Filtros combinados ────────────────────────────────────
  let filtered = applyAllFilters(rawPool, config, { excludeIds, blacklist });

  // ── 4. Monotype ───────────────────────────────────────────────
  filtered = await handleMonotype(filtered, config, excludeIds, slotsNeeded);

  // ── 5. Trick Room ─────────────────────────────────────────────
  if (config.preferTrickRoom) {
    filtered = applyTrickRoomFilter(filtered);
  }

  // ── 6. Randomizer ─────────────────────────────────────────────
  if (config.isRandomizer) {
    filtered = applyRandomizerFilter(filtered);
  }

  // ── 7. Estratificar ───────────────────────────────────────────
  let candidatePool = stratifyPool(filtered, config);

  // ── 8. Detectar sinergias y boostar partners ──────────────────
  const { detectedCombos, comboBoostIds, comboItemOverrides } = detectCombos(
    candidatePool,
    leaderName,
    lockedNames,
    config,
  );

  if (comboBoostIds.size > 0) {
    candidatePool = boostComboPartners(candidatePool, comboBoostIds);
  }

  // ── 9. Safety net ─────────────────────────────────────────────
  if (candidatePool.length < slotsNeeded) {
    const usedIds = candidatePool.map((p: any) => p.id);
    const allExcluded = [...excludeIds, ...usedIds];

    const emergency = await prisma.pokemon.findMany({
      where: {
        id: { notIn: allExcluded.length > 0 ? allExcluded : [0] },
        AnalisisMeta: { some: {} },
      },
      select: {
        id: true, nombre: true, tipo1: true, tipo2: true,
        hp_base: true, atk_base: true, def_base: true,
        spa_base: true, spd_base: true, spe_base: true,
        AnalisisMeta: {
          select: { usage_score: true, tier: true, perfil_estrategico: true },
          orderBy: { usage_score: "desc" },
          take: 1,
        },
      },
      take: 20,
    });

    const seen = new Set(candidatePool.map((p: any) => p.id));
    for (const p of emergency) {
      if (!seen.has(p.id)) {
        candidatePool.push({
          id: p.id,
          nombre: p.nombre,
          tipo1: p.tipo1,
          tipo2: p.tipo2,
          hp_base: p.hp_base,
          atk_base: p.atk_base,
          def_base: p.def_base,
          spa_base: p.spa_base,
          spd_base: p.spd_base,
          spe_base: p.spe_base,
          usage_score: p.AnalisisMeta[0]?.usage_score ?? 0,
          tier: p.AnalisisMeta[0]?.tier ?? "Unranked",
          perfil_estrategico: p.AnalisisMeta[0]?.perfil_estrategico ?? "",
        });
        seen.add(p.id);
      }
    }
  }

  return { candidatePool, isDynamicMode, detectedCombos, comboItemOverrides };
}

// ─────────────────────────────────────────────────────────────────
// GET LOCKED TEAM
// ─────────────────────────────────────────────────────────────────
export async function getLockedTeam(
  lockedIds: number[],
  config: any
): Promise<{ lockedTeam: any[]; validLockedIds: number[] }> {
  if (lockedIds.length === 0) return { lockedTeam: [], validLockedIds: [] };

  const lockedPokemon = await prisma.pokemon.findMany({
    where: { id: { in: lockedIds } },
  });

  const validLockedIds: number[] = [];
  for (const p of lockedPokemon) {
    if (!isExcluded(p.nombre, config)) {
      validLockedIds.push(toNum(p.id));
    }
  }

  return {
    lockedTeam: lockedPokemon.filter(p => validLockedIds.includes(toNum(p.id))),
    validLockedIds,
  };
}