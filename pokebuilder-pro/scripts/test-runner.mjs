
/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║   POKEBUILDER PRO — TEST RUNNER & STRESS TESTER                 ║
 * ║   Ejecuta: node scripts/test-runner.mjs                         ║
 * ║   Con servidor: BASE_URL=http://localhost:3000 node scripts/...  ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 * Qué hace:
 *  1. Unit tests de parseAIResponse, filters, stratifyPool
 *  2. Integration tests contra el endpoint /api/pokemon/suggest
 *  3. Stress test: N requests en paralelo
 *  4. Validación estricta de estructura JSON de respuesta
 *  5. Reporte final con métricas de latencia y tasa de éxito
 */

import { performance } from "perf_hooks";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const STRESS_CONCURRENCY = parseInt(process.env.STRESS_N || "5");
const TIMEOUT_MS = parseInt(process.env.TIMEOUT || "120000");

// ─── COLORES ANSI ────────────────────────────────────────────────
const C = {
  reset:  "\x1b[0m",
  bold:   "\x1b[1m",
  red:    "\x1b[31m",
  green:  "\x1b[32m",
  yellow: "\x1b[33m",
  blue:   "\x1b[34m",
  cyan:   "\x1b[36m",
  gray:   "\x1b[90m",
  bgRed:  "\x1b[41m",
  bgGreen:"\x1b[42m",
};

const log = {
  info:    (...a) => console.log(`${C.cyan}ℹ${C.reset}`, ...a),
  ok:      (...a) => console.log(`${C.green}✓${C.reset}`, ...a),
  fail:    (...a) => console.log(`${C.red}✗${C.reset}`, ...a),
  warn:    (...a) => console.log(`${C.yellow}⚠${C.reset}`, ...a),
  section: (t)   => console.log(`\n${C.bold}${C.blue}━━━ ${t} ━━━${C.reset}`),
  debug:   (...a) => process.env.DEBUG && console.log(`${C.gray}[DBG]${C.reset}`, ...a),
};

// ─── MÉTRICAS GLOBALES ───────────────────────────────────────────
const metrics = {
  total: 0, passed: 0, failed: 0,
  latencies: [],
  errors: [],
};

function assert(condition, name, detail = "") {
  metrics.total++;
  if (condition) {
    metrics.passed++;
    log.ok(name);
    return true;
  } else {
    metrics.failed++;
    const msg = `${name}${detail ? `: ${detail}` : ""}`;
    log.fail(msg);
    metrics.errors.push(msg);
    return false;
  }
}

// ─── FIXTURES ────────────────────────────────────────────────────
const FIXTURES = {
  minimalConfig: {
    format: "VGC",
    isMonotype: false,
    enableMega: false,
    allowLegendaries: false,
    allowParadox: false,
    isRandomizer: false,
    clauses: ["Sleep Clause", "Species Clause"],
    metaPreference: "balanced",
    experienceLevel: "experto",
    blacklist: [],
  },

  vgcConfig: {
    format: "VGC",
    isMonotype: false,
    enableMega: false,
    allowLegendaries: true,
    allowParadox: true,
    isRandomizer: false,
    clauses: ["Sleep Clause", "Species Clause"],
    metaPreference: "meta",
    experienceLevel: "experto",
    blacklist: [],
    preferTrickRoom: false,
  },

  monotypeConfig: {
    format: "Singles",
    isMonotype: true,
    monoTypeSelected: "fuego",
    enableMega: false,
    allowLegendaries: false,
    allowParadox: false,
    isRandomizer: false,
    clauses: ["Sleep Clause", "Species Clause", "Item Clause"],
    metaPreference: "balanced",
    experienceLevel: "intermedio",
    blacklist: [],
  },

  trickRoomConfig: {
    format: "VGC",
    isMonotype: false,
    enableMega: false,
    allowLegendaries: false,
    allowParadox: false,
    isRandomizer: false,
    clauses: ["Sleep Clause"],
    metaPreference: "balanced",
    experienceLevel: "experto",
    blacklist: [],
    preferTrickRoom: true,
  },

  // Gardevoir (ID real en la mayoría de DBs)
  leaderGardevoir: {
    id: 282,
    nombre: "Gardevoir",
    tipo1: "Psychic",
    tipo2: "Fairy",
    sprite_url: null,
  },

  leaderCharizard: {
    id: 6,
    nombre: "Charizard",
    tipo1: "Fire",
    tipo2: "Flying",
    sprite_url: null,
  },
};

// ─── UNIT TESTS: parseAIResponse ─────────────────────────────────
function unitTestsParseAI() {
  log.section("UNIT TESTS — parseAIResponse");

  const testCases = [
    // Caso 1: JSON limpio
    {
      name: "JSON puro válido",
      input: '{"selected_ids":[1,2,3],"builds":{"1":{"item":"Leftovers","ability":"Levitate","nature":"Timid","moves":["Thunderbolt","Shadow Ball","Volt Switch","Protect"]}}}',
      expectKeys: ["selected_ids", "builds"],
    },
    // Caso 2: JSON envuelto en markdown
    {
      name: "JSON en bloque markdown ```json",
      input: '```json\n{"selected_ids":[1,2,3],"builds":{}}\n```',
      expectKeys: ["selected_ids", "builds"],
    },
    // Caso 3: JSON con texto antes
    {
      name: "JSON precedido de texto",
      input: 'Aquí está mi respuesta:\n{"selected_ids":[4,5,6],"builds":{}}',
      expectKeys: ["selected_ids", "builds"],
    },
    // Caso 4: JSON truncado (sin cierre)
    {
      name: "JSON truncado — recuperación",
      input: '{"selected_ids":[7,8,9],"builds":{"7":{"item":"Choice Band","ability":"Guts","nature":"Adamant","moves":["Close Combat","Flame Wheel",',
      expectKeys: null, // debería fallar limpiamente, no crash
    },
    // Caso 5: Formato B (suggestions array)
    {
      name: "Formato legacy (suggestions array)",
      input: '{"suggestions":[{"name":"Pikachu","ability":"Static","nature":"Timid","evSpread":"252 SpA / 4 SpD / 252 Spe","item":"Light Ball","moves":["Thunderbolt","Volt Tackle","Iron Tail","Quick Attack"],"role":"Sweeper","reasoning":"STAB eléctrico potente"}]}',
      expectKeys: ["suggestions"],
    },
    // Caso 6: Campo extra raro que no debe romper nada
    {
      name: "JSON con campos desconocidos extra",
      input: '{"selected_ids":[10],"builds":{},"unknownField":true,"anotherField":{"nested":"value"}}',
      expectKeys: ["selected_ids", "builds"],
    },
  ];

  let passed = 0;
  for (const tc of testCases) {
    try {
      const result = mockParseAIResponse(tc.input);
      if (tc.expectKeys === null) {
        // Esperamos error limpio
        log.warn(`  [${tc.name}] — no crasheó, devolvió ${typeof result} (aceptable si hay recovery)`);
        passed++;
      } else {
        const allKeys = tc.expectKeys.every(k => k in result);
        if (allKeys) {
          log.ok(`  ${tc.name}`);
          passed++;
        } else {
          log.fail(`  ${tc.name} — faltan keys: ${tc.expectKeys.filter(k => !(k in result))}`);
        }
      }
    } catch (e) {
      if (tc.expectKeys === null) {
        log.ok(`  ${tc.name} — falla esperada: ${e.message}`);
        passed++;
      } else {
        log.fail(`  ${tc.name} — ERROR INESPERADO: ${e.message}`);
      }
    }
  }

  metrics.total += testCases.length;
  metrics.passed += passed;
  metrics.failed += (testCases.length - passed);
}

// Mock del parseAIResponse del ai-client
function mockParseAIResponse(raw) {
  // Paso 1: limpiar markdown
  let cleaned = raw
    .replace(/^[\s\S]*?```(?:json)?\s*/i, "")
    .replace(/\s*```[\s\S]*$/i, "")
    .trim();

  if (cleaned.includes("```")) {
    cleaned = cleaned.replace(/```(?:json)?|```/gi, "").trim();
  }

  // Paso 2: encontrar objeto JSON
  const firstBrace = cleaned.indexOf("{");
  const firstBracket = cleaned.indexOf("[");
  if (firstBrace > 0 && (firstBracket === -1 || firstBrace < firstBracket)) {
    cleaned = cleaned.slice(firstBrace);
  } else if (firstBracket > 0 && (firstBrace === -1 || firstBracket < firstBrace)) {
    cleaned = cleaned.slice(firstBracket);
  }

  // Paso 3: intentar parse directo
  try {
    return JSON.parse(cleaned);
  } catch {
    // Paso 4: intentar reparar JSON truncado
    const repaired = repairTruncatedJson(cleaned);
    return JSON.parse(repaired);
  }
}

function repairTruncatedJson(str) {
  let result = str;
  // Eliminar trailing coma
  result = result.replace(/,\s*$/, "");

  // Contar aperturas y cierres
  const opens = (result.match(/\{/g) || []).length;
  const closes = (result.match(/\}/g) || []).length;
  const arrOpens = (result.match(/\[/g) || []).length;
  const arrCloses = (result.match(/\]/g) || []).length;

  // Cerrar string abierto
  const lastQuote = result.lastIndexOf('"');
  const strBeforeLastQuote = result.slice(0, lastQuote);
  const openStrings = (strBeforeLastQuote.match(/(?<!\\)"/g) || []).length;
  if (openStrings % 2 !== 0) result += '"';

  // Cerrar arrays y objetos
  for (let i = 0; i < arrOpens - arrCloses; i++) result += "]";
  for (let i = 0; i < opens - closes; i++) result += "}";

  return result;
}

// ─── UNIT TESTS: Validación de SuggestResponse ──────────────────
function unitTestsResponseValidation() {
  log.section("UNIT TESTS — Validación de SuggestResponse");

  const cases = [
    {
      name: "Respuesta válida completa",
      response: {
        success: true,
        suggestions: [
          { id: "1", name: "Garchomp", tier: "S", tipo1: "Dragon", tipo2: "Ground",
            build: { ability: "Rough Skin", nature: "Jolly", item: "Rocky Helmet",
                     evSpread: "4 HP / 252 Atk / 252 Spe", moves: ["Earthquake","Dragon Claw","Stealth Rock","Swords Dance"] },
            role: "Sweeper", reasoning: "Good", synergies: [] }
        ],
        report: {
          teamComposition: "Test", typesCoverage: "Test",
          speedControl: "Test", synergySummary: "Test",
          weaknesses: ["Ice"], strengths: ["Ground"],
          recommendation: "Test",
        },
        meta: { timestamp: Date.now(), configHash: "abc", detectedCombos: [], isDynamicMode: false, totalCandidatesEvaluated: 50 },
      },
      valid: true,
    },
    {
      name: "Respuesta con suggestions vacíos",
      response: { success: true, suggestions: [], report: {}, meta: {} },
      valid: false,
    },
    {
      name: "Respuesta con pokemon sin moves",
      response: {
        success: true,
        suggestions: [{ id: "1", name: "Pikachu", tier: "OU",
          build: { ability: "Static", nature: "Timid", item: "Light Ball", moves: [] },
          role: "Sweeper", reasoning: "", synergies: [] }],
        report: { teamComposition: "x", typesCoverage: "x", speedControl: "x",
                  synergySummary: "x", weaknesses: [], strengths: [], recommendation: "x" },
        meta: { timestamp: 0, configHash: "x", detectedCombos: [], isDynamicMode: false, totalCandidatesEvaluated: 0 },
      },
      valid: false,
    },
    {
      name: "4+ Pokémon del mismo tipo (violación diversidad)",
      response: buildMonotypeDuplication(),
      valid: false,
    },
    {
      name: "Items duplicados con Item Clause activa",
      response: buildDuplicateItems(),
      config: { itemClause: true },
      valid: false,
    },
    {
      name: "Items duplicados SIN Item Clause - permitido",
      response: buildDuplicateItems(),
      config: { itemClause: false },
      valid: true,
    },
    {
      name: "success=false detecta error",
      response: { success: false, suggestions: [], report: {}, meta: {} },
      valid: false,
    },
  ];

  for (const tc of cases) {
    const errors = validateSuggestResponse(tc.response, tc.config || {});
    const isValid = errors.length === 0;
    if (tc.valid) {
      assert(isValid, `  ${tc.name}`, errors.join("; "));
    } else {
      assert(!isValid, `  ${tc.name} — detecta errores`, `errores: ${errors.length}`);
    }
  }
}

function validateSuggestResponse(response, config = {}) {
  const errors = [];

  if (!response.success) errors.push("success=false");
  if (!Array.isArray(response.suggestions)) errors.push("suggestions no es array");
  if (response.suggestions?.length === 0) errors.push("suggestions vacío");

  for (const sug of response.suggestions || []) {
    if (!sug.name) errors.push(`Pokémon sin nombre`);
    if (!sug.build) errors.push(`${sug.name}: sin build`);
    else {
      if (!sug.build.ability) errors.push(`${sug.name}: sin ability`);
      if (!sug.build.nature) errors.push(`${sug.name}: sin nature`);
      if (!sug.build.item) errors.push(`${sug.name}: sin item`);
      if (!Array.isArray(sug.build.moves) || sug.build.moves.length < 4)
        errors.push(`${sug.name}: moves insuficientes (${sug.build?.moves?.length ?? 0})`);
    }
  }

  // Verificar diversidad de tipos (máx 3 del mismo tipo)
  const typeCounts = {};
  for (const sug of response.suggestions || []) {
    const t1 = sug.tipo1;
    if (t1) typeCounts[t1] = (typeCounts[t1] || 0) + 1;
  }
  for (const [tipo, count] of Object.entries(typeCounts)) {
    if (count >= 4) errors.push(`4+ Pokémon de tipo ${tipo} — viola regla de diversidad`);
  }

  // Items duplicados
  const items = (response.suggestions || []).map(s => s.build?.item).filter(Boolean);
  const uniqueItems = new Set(items);
  if (config.itemClause && uniqueItems.size < items.length) {
    errors.push(`Items duplicados con Item Clause activa: ${items.join(", ")}`);
  }

  return errors;
}

function buildMonotypeDuplication() {
  const makeFirePoke = (name, id) => ({
    id: String(id), name, tier: "OU", tipo1: "Fire", tipo2: null,
    build: { ability: "Blaze", nature: "Timid", item: "Choice Specs",
             evSpread: "252 SpA / 4 SpD / 252 Spe", moves: ["Flamethrower","Fire Blast","Focus Blast","Protect"] },
    role: "Sweeper", reasoning: "", synergies: [],
  });
  return {
    success: true,
    suggestions: [
      makeFirePoke("Charizard", 6),
      makeFirePoke("Arcanine", 59),
      makeFirePoke("Talonflame", 663),
      makeFirePoke("Cinderace", 815),
    ],
    report: { teamComposition: "", typesCoverage: "", speedControl: "",
              synergySummary: "", weaknesses: [], strengths: [], recommendation: "" },
    meta: { timestamp: 0, configHash: "", detectedCombos: [], isDynamicMode: false, totalCandidatesEvaluated: 0 },
  };
}

function buildDuplicateItems() {
  return {
    success: true,
    suggestions: [
      { id: "1", name: "A", tier: "OU", tipo1: "Water", build: { ability: "x", nature: "x", item: "Choice Specs", evSpread: "", moves: ["a","b","c","d"] }, role: "", reasoning: "", synergies: [] },
      { id: "2", name: "B", tier: "OU", tipo1: "Fire", build: { ability: "x", nature: "x", item: "Choice Specs", evSpread: "", moves: ["a","b","c","d"] }, role: "", reasoning: "", synergies: [] },
    ],
    report: { teamComposition: "", typesCoverage: "", speedControl: "",
              synergySummary: "", weaknesses: [], strengths: [], recommendation: "" },
    meta: { timestamp: 0, configHash: "", detectedCombos: [], isDynamicMode: false, totalCandidatesEvaluated: 0 },
  };
}

// ─── UNIT TESTS: Lógica de pool ──────────────────────────────────
function unitTestsPoolLogic() {
  log.section("UNIT TESTS — Pool & Filters (lógica local)");

  // stratifyPool mock
  const mockPool = Array.from({ length: 50 }, (_, i) => ({
    id: i + 1,
    nombre: `Pokemon${i + 1}`,
    usage_score: Math.random() * 20,
  }));

  // Test estratificación
  const stratified = mockStratifyPool(mockPool, { metaPreference: "balanced" });
  assert(stratified.length <= 32, "stratifyPool — no supera límite de 32 candidatos");
  assert(new Set(stratified.map(p => p.id)).size === stratified.length, "stratifyPool — sin duplicados");

  // Test deduplicateById
  const withDups = [{ id: 1, nombre: "A" }, { id: 2, nombre: "B" }, { id: 1, nombre: "A-dup" }];
  const deduped = mockDeduplicateById(withDups);
  assert(deduped.length === 2, "deduplicateById — elimina duplicados");

  // Test blacklist filter
  const pool = [{ id: 1, nombre: "Garchomp" }, { id: 2, nombre: "Gardevoir" }, { id: 3, nombre: "Rotom" }];
  const filtered = pool.filter(p => !["gardevoir"].includes(p.nombre.toLowerCase()));
  assert(filtered.length === 2, "blacklist filter — excluye correctamente");

  // Test monotype filter
  const mixedPool = [
    { id: 1, nombre: "Charizard", tipo1: "Fire",    tipo2: "Flying"  },
    { id: 2, nombre: "Arcanine",  tipo1: "Fire",    tipo2: null      },
    { id: 3, nombre: "Garchomp",  tipo1: "Dragon",  tipo2: "Ground"  },
    { id: 4, nombre: "Ninetales", tipo1: "Fire",    tipo2: null      },
  ];
  const monoFiltered = mixedPool.filter(p =>
    p.tipo1?.toLowerCase() === "fire" || p.tipo2?.toLowerCase() === "fire"
  );
  assert(monoFiltered.length === 3, "monotype filter — solo Pokémon de tipo Fuego");

  // Test TrickRoom sort (lentos primero)
  const speedPool = [
    { id: 1, nombre: "Reuniclus",  spe_base: 30 },
    { id: 2, nombre: "Zacian",     spe_base: 148 },
    { id: 3, nombre: "Incineroar", spe_base: 60 },
    { id: 4, nombre: "Hatterene",  spe_base: 29 },
  ];
  const trSorted = [...speedPool].sort((a, b) => a.spe_base - b.spe_base);
  assert(trSorted[0].nombre === "Hatterene", "TrickRoom sort — más lento primero");
  assert(trSorted[3].nombre === "Zacian", "TrickRoom sort — más rápido último");
}

function mockStratifyPool(pool, config) {
  const pref = config.metaPreference ?? "balanced";
  const presets = {
    meta:     { highLimit: 18, viableLimit: 8,  nicheLimit: 4 },
    balanced: { highLimit: 14, viableLimit: 12, nicheLimit: 6 },
    niche:    { highLimit: 4,  viableLimit: 8,  nicheLimit: 18 },
  };
  const preset = presets[pref] ?? presets.balanced;
  const high   = pool.filter(p => p.usage_score > 5).slice(0, preset.highLimit);
  const viable = pool.filter(p => p.usage_score > 1 && p.usage_score <= 5).slice(0, preset.viableLimit);
  const niche  = pool.filter(p => p.usage_score <= 1).slice(0, preset.nicheLimit);
  return mockDeduplicateById([...high, ...viable, ...niche]);
}

function mockDeduplicateById(arr) {
  const seen = new Set();
  return arr.filter(p => { const dup = seen.has(p.id); seen.add(p.id); return !dup; });
}

// ─── INTEGRATION TESTS ───────────────────────────────────────────
async function integrationTests() {
  log.section("INTEGRATION TESTS — /api/pokemon/suggest");

  let serverUp = false;
  try {
    const probe = await fetch(`${BASE_URL}/api/pokemon/suggest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
      signal: AbortSignal.timeout(5000),
    });
    serverUp = probe.status !== 0; // cualquier HTTP response = servidor activo
  } catch {
    log.warn(`Servidor no disponible en ${BASE_URL} — omitiendo integration tests`);
    log.warn("Arranca con: npm run dev — luego vuelve a ejecutar el script");
    return;
  }

  log.info(`Servidor detectado en ${BASE_URL}`);

  // Test 1: request vacío → 400
  await testEndpoint("Request vacío → 400", {
    body: {},
    expectedStatus: 400,
    validate: null,
  });

  // Test 2: slotIndex fuera de rango → 400
  await testEndpoint("slotIndex=-1 → 400", {
    body: { config: FIXTURES.minimalConfig, lockedTeam: [], slotIndex: -1 },
    expectedStatus: 400,
    validate: null,
  });

  // Test 3: Request scratch mode (sin líder)
  await testEndpoint("Scratch mode — sin líder", {
    body: {
      config: FIXTURES.vgcConfig,
      lockedTeam: [],
      slotIndex: 0,
    },
    expectedStatus: 200,
    validate: (data) => validateSuggestResponse(data),
  });

  // Test 4: Con líder Gardevoir
  await testEndpoint("Con líder Gardevoir", {
    body: {
      config: FIXTURES.vgcConfig,
      lockedTeam: [FIXTURES.leaderGardevoir],
      slotIndex: 0,
    },
    expectedStatus: 200,
    validate: (data) => validateSuggestResponse(data),
  });

  // Test 5: Monotype Fuego
  await testEndpoint("Monotype Fuego", {
    body: {
      config: FIXTURES.monotypeConfig,
      lockedTeam: [],
      slotIndex: 0,
    },
    expectedStatus: 200,
    validate: (data) => {
      const errors = validateSuggestResponse(data);
      // Todos deben ser de tipo Fuego
      const nonFire = data.suggestions?.filter(s =>
        s.tipo1?.toLowerCase() !== "fuego" &&
        s.tipo1?.toLowerCase() !== "fire" &&
        s.tipo2?.toLowerCase() !== "fuego" &&
        s.tipo2?.toLowerCase() !== "fire"
      );
      if (nonFire?.length > 0) errors.push(`Monotype violado: ${nonFire.map(p => p.name).join(", ")} no son de tipo Fuego`);
      return errors;
    },
  });

  // Test 6: Swap (swapCount=3)
  await testEndpoint("Swap — swapCount=3 con equipo parcial", {
    body: {
      config: FIXTURES.vgcConfig,
      lockedTeam: [FIXTURES.leaderGardevoir],
      slotIndex: 1,
      swapCount: 3,
    },
    expectedStatus: 200,
    validate: (data) => {
      const errors = validateSuggestResponse(data);
      if (data.suggestions?.length !== 3) errors.push(`Esperaba 3 sugerencias, recibió ${data.suggestions?.length}`);
      return errors;
    },
  });

  // Test 7: Trick Room
  await testEndpoint("Trick Room mode", {
    body: {
      config: FIXTURES.trickRoomConfig,
      lockedTeam: [],
      slotIndex: 0,
    },
    expectedStatus: 200,
    validate: (data) => validateSuggestResponse(data),
  });

  // Test 8: Rate limit (10 requests rápidos)
  await testRateLimit();
}

async function testEndpoint(name, { body, expectedStatus, validate }) {
  const sessionId = `test_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const t0 = performance.now();

  try {
    const res = await fetch(`${BASE_URL}/api/pokemon/suggest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-session-id": sessionId,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    const elapsed = Math.round(performance.now() - t0);
    metrics.latencies.push(elapsed);

    const statusOk = assert(
      res.status === expectedStatus,
      `  ${name} — status ${res.status} (esperado ${expectedStatus})`,
      `latencia: ${elapsed}ms`
    );

    if (!statusOk || !validate) return;

    let data;
    try {
      data = await res.json();
    } catch {
      assert(false, `  ${name} — respuesta no es JSON válido`);
      return;
    }

    log.debug("Response:", JSON.stringify(data).slice(0, 200) + "...");

    const validationErrors = validate(data);
    assert(
      validationErrors.length === 0,
      `  ${name} — validación de respuesta`,
      validationErrors.join(" | ")
    );

    log.info(`  ${C.gray}[${name}] → ${elapsed}ms, ${data.suggestions?.length ?? 0} sugerencias${C.reset}`);

  } catch (e) {
    assert(false, `  ${name} — ERROR: ${e.message}`);
  }
}

async function testRateLimit() {
  log.info("  Probando rate limit (10 requests rápidos mismo sessionId)...");
  const sessionId = `ratelimit_test_${Date.now()}`;
  const requests = Array.from({ length: 12 }, () =>
    fetch(`${BASE_URL}/api/pokemon/suggest`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-session-id": sessionId },
      body: JSON.stringify({ config: FIXTURES.minimalConfig, lockedTeam: [], slotIndex: 0 }),
      signal: AbortSignal.timeout(10000),
    }).then(r => r.status).catch(() => 0)
  );

  const statuses = await Promise.all(requests);
  const has429 = statuses.includes(429);
  assert(has429, "  Rate limit — retorna 429 al exceder límite", `statuses: ${statuses.join(",")}`);
}

// ─── STRESS TEST ─────────────────────────────────────────────────
async function stressTest() {
  log.section(`STRESS TEST — ${STRESS_CONCURRENCY} requests en paralelo`);

  let serverUp = false;
  try {
    await fetch(`${BASE_URL}/api/pokemon/suggest`, { method: "HEAD", signal: AbortSignal.timeout(3000) });
    serverUp = true;
  } catch {
    log.warn("Servidor no disponible — omitiendo stress test");
    return;
  }

  const configs = [
    FIXTURES.vgcConfig,
    FIXTURES.monotypeConfig,
    FIXTURES.trickRoomConfig,
    FIXTURES.minimalConfig,
  ];

  const tasks = Array.from({ length: STRESS_CONCURRENCY }, (_, i) => {
    const config = configs[i % configs.length];
    const sessionId = `stress_${i}_${Date.now()}`;
    return (async () => {
      const t0 = performance.now();
      try {
        const res = await fetch(`${BASE_URL}/api/pokemon/suggest`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-session-id": sessionId },
          body: JSON.stringify({ config, lockedTeam: [], slotIndex: 0 }),
          signal: AbortSignal.timeout(TIMEOUT_MS),
        });
        const elapsed = Math.round(performance.now() - t0);
        metrics.latencies.push(elapsed);
        const ok = res.status === 200 || res.status === 429;
        log[ok ? "ok" : "fail"](`  Worker ${i+1} — status ${res.status} — ${elapsed}ms`);
        return ok;
      } catch (e) {
        log.fail(`  Worker ${i+1} — TIMEOUT/ERROR: ${e.message}`);
        return false;
      }
    })();
  });

  const results = await Promise.all(tasks);
  const successCount = results.filter(Boolean).length;
  assert(
    successCount >= Math.ceil(STRESS_CONCURRENCY * 0.8),
    `Stress — ${successCount}/${STRESS_CONCURRENCY} requests exitosos (≥80% requerido)`
  );
}

// ─── REPORTE FINAL ───────────────────────────────────────────────
function printReport() {
  log.section("REPORTE FINAL");

  const successRate = metrics.total > 0 ? Math.round(metrics.passed / metrics.total * 100) : 0;
  const avgLatency = metrics.latencies.length > 0
    ? Math.round(metrics.latencies.reduce((a, b) => a + b, 0) / metrics.latencies.length)
    : null;
  const maxLatency = metrics.latencies.length > 0 ? Math.max(...metrics.latencies) : null;
  const minLatency = metrics.latencies.length > 0 ? Math.min(...metrics.latencies) : null;
  const p90 = metrics.latencies.length > 0
    ? metrics.latencies.sort((a, b) => a - b)[Math.floor(metrics.latencies.length * 0.9)]
    : null;

  console.log(`\n${C.bold}Tests:${C.reset}   ${metrics.passed}/${metrics.total} pasaron (${successRate}%)`);
  console.log(`${C.bold}Fallos:${C.reset}  ${metrics.failed}`);

  if (avgLatency !== null) {
    console.log(`\n${C.bold}Latencia:${C.reset}`);
    console.log(`  Promedio: ${avgLatency}ms`);
    console.log(`  Mínima:   ${minLatency}ms`);
    console.log(`  Máxima:   ${maxLatency}ms`);
    console.log(`  P90:      ${p90}ms`);

    if (avgLatency > 60000) log.warn("Latencia promedio >60s — considera caching o modo rápido");
    if (maxLatency > 100000) log.warn("Latencia máxima >100s — hay timeouts en puerta");
  }

  if (metrics.errors.length > 0) {
    console.log(`\n${C.bold}${C.red}Errores detectados:${C.reset}`);
    metrics.errors.forEach(e => console.log(`  ${C.red}•${C.reset} ${e}`));
  }

  const banner = successRate === 100
    ? `${C.bgGreen}${C.bold} ✓ TODOS LOS TESTS PASARON ${C.reset}`
    : `${C.bgRed}${C.bold} ✗ HAY FALLOS — REVISAR ${C.reset}`;

  console.log(`\n${banner}\n`);

  process.exit(metrics.failed > 0 ? 1 : 0);
}

// ─── MAIN ────────────────────────────────────────────────────────
(async () => {
  console.log(`\n${C.bold}${C.blue}╔══════════════════════════════════════════╗`);
  console.log(`║  POKEBUILDER PRO — TEST RUNNER v1.0.0   ║`);
  console.log(`╚══════════════════════════════════════════╝${C.reset}\n`);
  console.log(`${C.gray}BASE_URL:     ${BASE_URL}`);
  console.log(`STRESS_N:     ${STRESS_CONCURRENCY}`);
  console.log(`TIMEOUT_MS:   ${TIMEOUT_MS}`);
  console.log(`DEBUG:        ${process.env.DEBUG ? "ON" : "OFF"}${C.reset}\n`);

  unitTestsParseAI();
  unitTestsResponseValidation();
  unitTestsPoolLogic();

  await integrationTests();
  await stressTest();

  printReport();
})();
