import { VALID_MEGA_STONES } from "./constants";

// ─────────────────────────────────────────────────────────────────
// HELPERS — Mega Stones
// ─────────────────────────────────────────────────────────────────
export function getMegaStone(pokemonName: string): string | null {
  const name = pokemonName.toLowerCase();
  if (name in VALID_MEGA_STONES) {
    const stone = VALID_MEGA_STONES[name as keyof typeof VALID_MEGA_STONES];
    return stone || null;
  }
  return null;
}

function isMegaStoneItem(item: string): boolean {
  const lower = item.toLowerCase();
  const validStones = Object.values(VALID_MEGA_STONES)
    .filter(Boolean)
    .map((s) => s.toLowerCase());
  return (
    validStones.includes(lower) ||
    (lower.endsWith("ite") &&
      lower !== "leftovers" &&
      lower !== "eviolite" &&
      lower !== "rockyhelmet")
  );
}

// ─────────────────────────────────────────────────────────────────
// HELPERS — Z-Crystals
// ─────────────────────────────────────────────────────────────────
function isZCrystal(item: string): boolean {
  const lower = item.toLowerCase();
  return (
    lower.endsWith("-z") ||
    lower.endsWith("ium z") ||
    lower.endsWith("ium-z") ||
    lower.includes("z-crystal") ||
    lower === "tapunium z" ||
    lower === "pikanium z" ||
    lower === "aloraichium z" ||
    lower === "eevium z" ||
    lower === "mewnium z" ||
    lower === "decidium z" ||
    lower === "incinium z" ||
    lower === "primarium z" ||
    lower === "solganium z" ||
    lower === "lunalium z" ||
    lower === "ultranecrozium z" ||
    lower === "mimikium z" ||
    lower === "marshadium z" ||
    lower === "kommonium z"
  );
}

// ─────────────────────────────────────────────────────────────────
// ENFORCE MEGA LIMIT — máximo 1 Mega por equipo
// ─────────────────────────────────────────────────────────────────
function enforceMegaLimit(
  builds: Record<string, any>,
  candidatePool: any[]
): Record<string, any> {
  let megaCount = 0;
  const result: Record<string, any> = {};

  for (const [id, build] of Object.entries(builds)) {
    if (!build) continue;
    const item = build.item || "";

    if (isMegaStoneItem(item)) {
      megaCount++;
      if (megaCount > 1) {
        result[id] = { ...build, item: "Life Orb", is_mega: false };
        continue;
      } else {
        result[id] = { ...build, is_mega: true };
        continue;
      }
    }
    result[id] = build;
  }

  return result;
}

// ─────────────────────────────────────────────────────────────────
// ENFORCE Z-MOVE LIMIT — máximo 1 Z-Crystal por equipo
// ─────────────────────────────────────────────────────────────────
function enforceZMoveLimit(builds: Record<string, any>): Record<string, any> {
  let zCount = 0;
  const result: Record<string, any> = {};

  for (const [id, build] of Object.entries(builds)) {
    if (!build) continue;
    const item = build.item || "";

    if (isZCrystal(item)) {
      zCount++;
      if (zCount > 1) {
        result[id] = { ...build, item: "Choice Specs" };
        continue;
      }
    }
    result[id] = build;
  }

  return result;
}

// ─────────────────────────────────────────────────────────────────
// ENFORCE ITEM CLAUSE — ningún item repetido
// ─────────────────────────────────────────────────────────────────
const ITEM_CLAUSE_FALLBACKS = [
  "Life Orb",
  "Choice Specs",
  "Choice Band",
  "Choice Scarf",
  "Leftovers",
  "Rocky Helmet",
  "Assault Vest",
  "Focus Sash",
  "Heavy-Duty Boots",
  "Eviolite",
  "Sitrus Berry",
  "Lum Berry",
];

function enforceItemClause(builds: Record<string, any>): Record<string, any> {
  const usedItems = new Set<string>();
  const result: Record<string, any> = {};
  let fallbackIndex = 0;

  for (const [id, build] of Object.entries(builds)) {
    if (!build) continue;
    const item = build.item || "";
    const lower = item.toLowerCase();

    if (item && !usedItems.has(lower)) {
      usedItems.add(lower);
      result[id] = build;
    } else {
      // Item duplicado o vacío — buscar reemplazo único
      let replacement = "";
      const startIndex = fallbackIndex;
      while (fallbackIndex < startIndex + ITEM_CLAUSE_FALLBACKS.length * 2) {
        const candidate = ITEM_CLAUSE_FALLBACKS[fallbackIndex % ITEM_CLAUSE_FALLBACKS.length];
        if (!usedItems.has(candidate.toLowerCase())) {
          replacement = candidate;
          break;
        }
        fallbackIndex++;
      }
      if (!replacement) replacement = `Sitrus Berry`; // último recurso
      usedItems.add(replacement.toLowerCase());
      result[id] = { ...build, item: replacement };
      fallbackIndex++;
    }
  }

  return result;
}

// ─────────────────────────────────────────────────────────────────
// SANITIZE EVs
// ─────────────────────────────────────────────────────────────────
function sanitizeEvs(build: any): any {
  const evKeys = ["ev_hp", "ev_atk", "ev_def", "ev_spa", "ev_spd", "ev_spe"];

  // Parsear formato string "252 SpA / 4 SpD / 252 Spe"
  if (build.evs && typeof build.evs === "string") {
    const parsed: Record<string, number> = {};
    const parts = build.evs.split("/").map((s: string) => s.trim());
    for (const part of parts) {
      const match = part.match(/(\d+)\s+(\w+)/);
      if (match) {
        const val = Math.min(parseInt(match[1]), 252);
        const stat = match[2].toLowerCase();
        if (stat === "hp")                        parsed["ev_hp"]  = val;
        if (stat === "atk")                       parsed["ev_atk"] = val;
        if (stat === "def")                       parsed["ev_def"] = val;
        if (stat === "spa" || stat === "spatk")   parsed["ev_spa"] = val;
        if (stat === "spd" || stat === "spdef")   parsed["ev_spd"] = val;
        if (stat === "spe" || stat === "speed")   parsed["ev_spe"] = val;
      }
    }
    build = { ...build, ...parsed };
  }

  // Parsear formato evSpread string
  if (build.evSpread && typeof build.evSpread === "string" && !build.ev_spa && !build.ev_spe) {
    const parsed: Record<string, number> = {};
    const parts = build.evSpread.split("/").map((s: string) => s.trim());
    for (const part of parts) {
      const match = part.match(/(\d+)\s+(\w+)/i);
      if (match) {
        const val = Math.min(parseInt(match[1]), 252);
        const stat = match[2].toLowerCase();
        if (stat === "hp")                        parsed["ev_hp"]  = val;
        if (stat === "atk")                       parsed["ev_atk"] = val;
        if (stat === "def")                       parsed["ev_def"] = val;
        if (stat === "spa" || stat === "spatk")   parsed["ev_spa"] = val;
        if (stat === "spd" || stat === "spdef")   parsed["ev_spd"] = val;
        if (stat === "spe" || stat === "speed")   parsed["ev_spe"] = val;
      }
    }
    build = { ...build, ...parsed };
  }

  // Clamp 0-252
  for (const key of evKeys) {
    if (build[key] !== undefined) {
      build[key] = Math.min(Math.max(0, Number(build[key]) || 0), 252);
    }
  }

  // Reducir si total > 510
  const total = evKeys.reduce((sum, k) => sum + (build[k] || 0), 0);
  if (total > 510) {
    const factor = 510 / total;
    for (const key of evKeys) {
      build[key] = Math.floor((build[key] || 0) * factor);
    }
  }

  return build;
}

// ─────────────────────────────────────────────────────────────────
// SANITIZE IVs
// ─────────────────────────────────────────────────────────────────
function sanitizeIvs(build: any, config: any): any {
  // Parsear formato string "31/31/31/31/31/31"
  if (build.ivs && typeof build.ivs === "string") {
    const parts = build.ivs.split("/").map(Number);
    if (parts.length === 6) {
      build = {
        ...build,
        iv_hp:  parts[0],
        iv_atk: parts[1],
        iv_def: parts[2],
        iv_spa: parts[3],
        iv_spd: parts[4],
        iv_spe: parts[5],
      };
    }
  }
  return build;
}

// ─────────────────────────────────────────────────────────────────
// SANITIZE MOVES
// ─────────────────────────────────────────────────────────────────
function sanitizeMoves(build: any): any {
  if (!Array.isArray(build.moves)) {
    build.moves = [];
  }
  // Deduplicar y limpiar nulls/undefined
  build.moves = [...new Set<string>(build.moves.filter(Boolean))];
  build.moves = build.moves.slice(0, 4);
  if (build.moves.length === 0) {
    build.moves = ["Tackle"];
  }
  return build;
}

// ─────────────────────────────────────────────────────────────────
// FIX: detectar si un item parece incorrecto para el Pokémon dado
// Si la IA usó un item genérico pero la DB tiene uno específico,
// preferimos el de la DB.
// ─────────────────────────────────────────────────────────────────
const GENERIC_FALLBACK_ITEMS = new Set([
  "choice specs", "choice band", "life orb", "leftovers",
  "assault vest", "focus sash", "rocky helmet", "heavy-duty boots",
  "choice scarf", "sitrus berry", "lum berry", "oran berry",
]);

function isItemSuspicious(aiItem: string, dbItem: string): boolean {
  if (!aiItem) return true;
  // Si coincide con el DB, no hay problema
  if (aiItem.toLowerCase() === dbItem.toLowerCase()) return false;
  // Si la IA usó un genérico y el DB tiene uno específico (no genérico), preferir DB
  const aiIsGeneric = GENERIC_FALLBACK_ITEMS.has(aiItem.toLowerCase());
  const dbIsGeneric = GENERIC_FALLBACK_ITEMS.has(dbItem.toLowerCase());
  return aiIsGeneric && !dbIsGeneric;
}

// ─────────────────────────────────────────────────────────────────
// SANITIZE BUILDS — función principal exportada
// ─────────────────────────────────────────────────────────────────
export function sanitizeBuilds(
  builds: Record<string, any>,
  config: any,
  candidatePool: any[],
  comboItemOverrides: Record<string, string> = {}
): Record<string, any> {
  let sanitized: Record<string, any> = {};

  for (const [id, build] of Object.entries(builds)) {
    if (!build) continue;

    const pokemon = candidatePool.find((p) => p.id.toString() === id.toString());
    const pokemonName = pokemon?.nombre?.toLowerCase() || "";
    let current = { ...build };

    // ── 0a. FIX: Aplicar builds reales de la DB como base prioritaria ──
    // El pool-builder inyecta db_item, db_ability, db_nature, db_moves, db_ev_*
    // desde BuildCompetitiva. La IA DEBE haberlos usado, pero por si acaso,
    // aquí los restauramos si la IA los ignoró o usó valores genéricos.
    if (pokemon) {
      // Item: restaurar si la IA usó un genérico cuando DB tiene uno específico
      if (
        pokemon.db_item &&
        (!current.item || isItemSuspicious(current.item, pokemon.db_item))
      ) {
        current.item = pokemon.db_item;
      }

      // Ability: rellenar si la IA no puso nada
      if (pokemon.db_ability && !current.ability) {
        current.ability = pokemon.db_ability;
      }

      // Nature: rellenar si la IA no puso nada
      if (pokemon.db_nature && !current.nature) {
        current.nature = pokemon.db_nature;
      }

      // Moves: si la IA generó menos de 4 moves válidos, completar con los de DB
      const aiMoves = Array.isArray(current.moves)
        ? current.moves.filter(Boolean)
        : [];
      if (
        aiMoves.length < 4 &&
        Array.isArray(pokemon.db_moves) &&
        pokemon.db_moves.length > 0
      ) {
        // Mezclar: primero los de IA, rellenar huecos con los de DB
        const merged = [...aiMoves];
        for (const m of pokemon.db_moves) {
          if (merged.length >= 4) break;
          if (m && !merged.includes(m)) merged.push(m);
        }
        current.moves = merged;
      }

      // EVs: si todos son 0 y la DB tiene EVs, usar los de DB
      const aiEvTotal =
        (current.ev_hp  ?? 0) + (current.ev_atk ?? 0) + (current.ev_def ?? 0) +
        (current.ev_spa ?? 0) + (current.ev_spd ?? 0) + (current.ev_spe ?? 0);
      const dbEvTotal =
        (pokemon.db_ev_hp  ?? 0) + (pokemon.db_ev_atk ?? 0) + (pokemon.db_ev_def ?? 0) +
        (pokemon.db_ev_spa ?? 0) + (pokemon.db_ev_spd ?? 0) + (pokemon.db_ev_spe ?? 0);
      if (aiEvTotal === 0 && dbEvTotal > 0) {
        current.ev_hp  = pokemon.db_ev_hp  ?? 0;
        current.ev_atk = pokemon.db_ev_atk ?? 0;
        current.ev_def = pokemon.db_ev_def ?? 0;
        current.ev_spa = pokemon.db_ev_spa ?? 0;
        current.ev_spd = pokemon.db_ev_spd ?? 0;
        current.ev_spe = pokemon.db_ev_spe ?? 0;
      }
    }

    // ── 0b. Aplicar combo item overrides (después de DB, antes de validaciones) ──
    if (pokemon?.nombre && comboItemOverrides[pokemon.nombre]) {
      current.item = comboItemOverrides[pokemon.nombre];
    }

    // ── 1. Sanitizar EVs e IVs ──────────────────────────────────
    current = sanitizeEvs(current);
    current = sanitizeIvs(current, config);

    // ── 2. Sanitizar movimientos ────────────────────────────────
    current = sanitizeMoves(current);

    // ── 3. Validar Mega Stone ───────────────────────────────────
    if (!config.enableMega) {
      if (isMegaStoneItem(current.item || "")) {
        current.item = "Leftovers";
        current.is_mega = false;
      }
    } else {
      const validStone = getMegaStone(pokemonName);
      if (isMegaStoneItem(current.item || "")) {
        if (validStone === null) {
          current.item = "Life Orb";
          current.is_mega = false;
        } else if (validStone.toLowerCase() !== current.item.toLowerCase()) {
          current.item = validStone;
          current.is_mega = true;
        } else {
          current.is_mega = true;
        }
      }
    }

    // ── 4. Validar Z-Crystal ────────────────────────────────────
    if (!config.enableZMoves && isZCrystal(current.item || "")) {
      current.item = "Leftovers";
    }

    // ── 5. Validar Tera Type ────────────────────────────────────
    if (!config.enableTera) {
      delete current.teraType;
      delete current.tera_type;
    }

    // ── 6. Validar Dynamax/Gmax ─────────────────────────────────
    if (!config.enableDynamax && !config.enableGmax) {
      delete current.is_dynamax;
      delete current.is_gmax;
    }

    sanitized[id] = current;
  }

  // ── 7. Límite de 1 Mega por equipo ──────────────────────────
  if (config.enableMega) {
    sanitized = enforceMegaLimit(sanitized, candidatePool);
  }

  // ── 8. Límite de 1 Z-Crystal por equipo ─────────────────────
  if (config.enableZMoves) {
    sanitized = enforceZMoveLimit(sanitized);
  }

  // ── 9. Item Clause — SIEMPRE activa (nunca repetir items) ───
  // Antes solo se activaba si config.clauses incluía "item clause".
  // Ahora lo aplicamos siempre porque repetir items es incorrecto
  // competitivamente en cualquier formato.
  sanitized = enforceItemClause(sanitized);

  return sanitized;
}