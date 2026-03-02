import { VALID_MEGA_STONES } from "./constants";

export function getMegaStone(pokemonName: string): string | null {
  const name = pokemonName.toLowerCase();
  if (name in VALID_MEGA_STONES) {
    const stone = VALID_MEGA_STONES[name];
    return stone || null;
  }
  return null;
}

function isMegaStoneItem(item: string): boolean {
  const lower = item.toLowerCase();
  const validStones = Object.values(VALID_MEGA_STONES)
    .filter(Boolean)
    .map(s => s.toLowerCase());
  return validStones.includes(lower) ||
    (lower.endsWith("ite") && lower !== "leftovers" && lower !== "eviolite" && lower !== "rockyhelmet");
}

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

function enforceItemClause(builds: Record<string, any>): Record<string, any> {
  const usedItems = new Set<string>();
  const result: Record<string, any> = {};
  const FALLBACK_ITEMS = [
    "Life Orb", "Choice Specs", "Choice Band", "Choice Scarf",
    "Leftovers", "Rocky Helmet", "Assault Vest", "Focus Sash"
  ];
  let fallbackIndex = 0;

  for (const [id, build] of Object.entries(builds)) {
    if (!build) continue;
    const item = build.item || "";
    const lower = item.toLowerCase();

    if (usedItems.has(lower)) {
      let replacement = FALLBACK_ITEMS[fallbackIndex % FALLBACK_ITEMS.length];
      while (usedItems.has(replacement.toLowerCase()) && fallbackIndex < FALLBACK_ITEMS.length * 2) {
        fallbackIndex++;
        replacement = FALLBACK_ITEMS[fallbackIndex % FALLBACK_ITEMS.length];
      }
      usedItems.add(replacement.toLowerCase());
      result[id] = { ...build, item: replacement };
      fallbackIndex++;
    } else {
      usedItems.add(lower);
      result[id] = build;
    }
  }

  return result;
}

function sanitizeEvs(build: any): any {
  const evKeys = ["ev_hp","ev_atk","ev_def","ev_spa","ev_spd","ev_spe"];

  if (build.evs && typeof build.evs === "string") {
    const parsed: Record<string, number> = {};
    const parts = build.evs.split("/").map((s: string) => s.trim());
    for (const part of parts) {
      const match = part.match(/(\d+)\s+(\w+)/);
      if (match) {
        const val = Math.min(parseInt(match[1]), 252);
        const stat = match[2].toLowerCase();
        if (stat === "hp")  parsed["ev_hp"]  = val;
        if (stat === "atk") parsed["ev_atk"] = val;
        if (stat === "def") parsed["ev_def"] = val;
        if (stat === "spa" || stat === "spatk") parsed["ev_spa"] = val;
        if (stat === "spd" || stat === "spdef") parsed["ev_spd"] = val;
        if (stat === "spe" || stat === "speed") parsed["ev_spe"] = val;
      }
    }
    build = { ...build, ...parsed };
  }

  for (const key of evKeys) {
    if (build[key] !== undefined) {
      build[key] = Math.min(Math.max(0, Number(build[key]) || 0), 252);
    }
  }

  const total = evKeys.reduce((sum, k) => sum + (build[k] || 0), 0);
  if (total > 510) {
    const factor = 510 / total;
    for (const key of evKeys) {
      build[key] = Math.floor((build[key] || 0) * factor);
    }
  }

  return build;
}

function sanitizeIvs(build: any, config: any): any {
  if (build.ivs && typeof build.ivs === "string") {
    const parts = build.ivs.split("/").map(Number);
    if (parts.length === 6) {
      build = {
        ...build,
        iv_hp:  parts[0], iv_atk: parts[1], iv_def: parts[2],
        iv_spa: parts[3], iv_spd: parts[4], iv_spe: parts[5],
      };
    }
  }
  return build;
}

function sanitizeMoves(build: any): any {
  if (!Array.isArray(build.moves)) {
    build.moves = [];
  }
  build.moves = [...new Set<string>(build.moves)];
  build.moves = build.moves.slice(0, 4);
  if (build.moves.length === 0) {
    build.moves = ["Tackle"];
  }
  return build;
}

export function sanitizeBuilds(
  builds: Record<string, any>,
  config: any,
  candidatePool: any[],
  comboItemOverrides: Record<string, string> = {}
): Record<string, any> {
  let sanitized: Record<string, any> = {};

  for (const [id, build] of Object.entries(builds)) {
    if (!build) continue;

    const pokemon = candidatePool.find(p => p.id.toString() === id.toString());
    const pokemonName = pokemon?.nombre?.toLowerCase() || "";
    let current = { ...build };

    // ── 0. Aplicar combo item overrides primero ──────────────────
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

  // ── 9. Item Clause ──────────────────────────────────────────
  const hasItemClause = config.clauses?.some(
    (c: string) => c.toLowerCase().includes("item clause")
  );
  if (hasItemClause) {
    sanitized = enforceItemClause(sanitized);
  }

  return sanitized;
}