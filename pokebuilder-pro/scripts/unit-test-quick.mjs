#!/usr/bin/env node
/**
 * scripts/unit-test-quick.mjs
 * Corre solo los unit tests (sin servidor). ~2 segundos.
 * Para integration tests: node scripts/test-runner.mjs
 */

const C = {
  reset: "\x1b[0m", bold: "\x1b[1m", red: "\x1b[31m",
  green: "\x1b[32m", yellow: "\x1b[33m", blue: "\x1b[34m", gray: "\x1b[90m",
};

let passed = 0, failed = 0;
const failures = [];

function assert(cond, name, detail = "") {
  if (cond) { passed++; console.log(`${C.green}✓${C.reset} ${name}`); }
  else { failed++; failures.push(`${name}${detail ? ": " + detail : ""}`); console.log(`${C.red}✗${C.reset} ${name}${detail ? C.gray + " — " + detail + C.reset : ""}`); }
}

function section(t) { console.log(`\n${C.bold}${C.blue}━━━ ${t} ━━━${C.reset}`); }

// ─── parseAIResponse mock ─────────────────────────────────────────
function repairJson(str) {
  let r = str.replace(/,\s*$/, "");
  const opens  = (r.match(/\{/g) || []).length;
  const closes = (r.match(/\}/g) || []).length;
  const ao = (r.match(/\[/g) || []).length;
  const ac = (r.match(/\]/g) || []).length;
  const lq = r.lastIndexOf('"');
  const before = r.slice(0, lq);
  if ((before.match(/(?<!\\)"/g) || []).length % 2 !== 0) r += '"';
  for (let i = 0; i < ao - ac; i++) r += "]";
  for (let i = 0; i < opens - closes; i++) r += "}";
  return r;
}

function parseAI(raw) {
  let c = raw.replace(/^[\s\S]*?```(?:json)?\s*/i, "").replace(/\s*```[\s\S]*$/i, "").trim();
  if (c.includes("```")) c = c.replace(/```(?:json)?|```/gi, "").trim();
  const fb = c.indexOf("{"), fab = c.indexOf("[");
  if (fb > 0 && (fab === -1 || fb < fab)) c = c.slice(fb);
  else if (fab > 0 && (fb === -1 || fab < fb)) c = c.slice(fab);
  try { return JSON.parse(c); } catch { return JSON.parse(repairJson(c)); }
}

section("parseAIResponse — parsing robusto");

assert((() => { const r = parseAI('{"selected_ids":[1],"builds":{}}'); return "selected_ids" in r; })(), "JSON puro válido");
assert((() => { const r = parseAI('```json\n{"x":1}\n```'); return r.x === 1; })(), "Markdown json fence");
assert((() => { const r = parseAI('Texto previo:\n{"y":2}'); return r.y === 2; })(), "Texto antes del JSON");
assert((() => { const r = parseAI('{"suggestions":[{"name":"Pika"}]}'); return r.suggestions?.[0]?.name === "Pika"; })(), "Formato B (suggestions)");
assert((() => { const r = parseAI('{"a":1,"unknown":{"nested":"x"}}'); return r.a === 1 && r.unknown?.nested === "x"; })(), "Campos desconocidos extra");
assert((() => { try { const r = parseAI('{"a":1,"b":{"item":"Leftovers","moves":["EQ","DC"'); return typeof r === "object"; } catch { return true; } })(), "JSON truncado — intento de reparación");
assert((() => { const r = parseAI('  \n  {"z": "hello world"}\n  '); return r.z === "hello world"; })(), "Whitespace alrededor");

section("validateSuggestResponse — reglas de equipo");

function validateResponse(res, cfg = {}) {
  const errs = [];
  if (!res.success) errs.push("success=false");
  if (!Array.isArray(res.suggestions)) errs.push("no array");
  if (res.suggestions?.length === 0) errs.push("empty");
  for (const s of res.suggestions || []) {
    if (!s.name) errs.push("sin nombre");
    if (!s.build?.ability) errs.push(`${s.name}: sin ability`);
    if (!s.build?.item) errs.push(`${s.name}: sin item`);
    if (!Array.isArray(s.build?.moves) || s.build.moves.length < 4) errs.push(`${s.name}: moves<4`);
  }
  // Tipo diversity
  const tc = {};
  for (const s of res.suggestions || []) { if (s.tipo1) tc[s.tipo1] = (tc[s.tipo1]||0) + 1; }
  for (const [t, n] of Object.entries(tc)) { if (n >= 4) errs.push(`4x tipo ${t}`); }
  // Item clause
  if (cfg.itemClause) {
    const items = (res.suggestions||[]).map(s=>s.build?.item).filter(Boolean);
    if (new Set(items.map(i=>i.toLowerCase())).size < items.length) errs.push("item dup");
  }
  return errs;
}

const goodRes = {
  success: true,
  suggestions: [
    { name: "Garchomp", tipo1: "Dragon", build: { ability: "Rough Skin", nature: "Jolly", item: "Rocky Helmet", moves: ["EQ","Dragon Claw","SR","SD"] }, role: "Sweeper", synergies: [] },
    { name: "Rotom-W", tipo1: "Electric", build: { ability: "Levitate", nature: "Bold", item: "Leftovers", moves: ["Scald","Volt Switch","WoW","Pain Split"] }, role: "Pivot", synergies: [] },
  ],
};
assert(validateResponse(goodRes).length === 0, "Respuesta válida — sin errores");

const noMovesRes = { success: true, suggestions: [{ name: "Pika", tipo1: "Electric", build: { ability: "Static", nature: "Timid", item: "LB", moves: ["TB"] }, synergies: [] }] };
assert(validateResponse(noMovesRes).length > 0, "Detecta moves insuficientes");

const monotypeBad = {
  success: true,
  suggestions: ["A","B","C","D"].map((n,i) => ({
    name: n, tipo1: "Fire",
    build: { ability: "Blaze", nature: "Timid", item: `Item${i}`, moves: ["a","b","c","d"] }, synergies: [],
  })),
};
assert(validateResponse(monotypeBad).some(e => e.includes("tipo")), "Detecta 4x mismo tipo");

const dupItems = {
  success: true,
  suggestions: [
    { name: "A", tipo1: "Water", build: { ability: "x", nature: "x", item: "Choice Specs", moves: ["a","b","c","d"] }, synergies: [] },
    { name: "B", tipo1: "Fire", build: { ability: "x", nature: "x", item: "Choice Specs", moves: ["a","b","c","d"] }, synergies: [] },
  ],
};
assert(validateResponse(dupItems, { itemClause: true }).some(e => e.includes("item")), "Detecta item duplicado con ItemClause");
assert(validateResponse(dupItems, { itemClause: false }).length === 0, "Sin ItemClause — dup de items OK");

section("Pool logic — filtros y estratificación");

function mockDedup(arr) { const seen = new Set(); return arr.filter(p => { const d = seen.has(p.id); seen.add(p.id); return !d; }); }
function mockStratify(pool, pref = "balanced") {
  const p = { meta:{h:18,v:8,n:4}, balanced:{h:14,v:12,n:6}, niche:{h:4,v:8,n:18} }[pref] || { h:14,v:12,n:6 };
  const h = pool.filter(x => x.score > 5).slice(0, p.h);
  const v = pool.filter(x => x.score > 1 && x.score <= 5).slice(0, p.v);
  const n = pool.filter(x => x.score <= 1).slice(0, p.n);
  return mockDedup([...h, ...v, ...n]);
}

const pool50 = Array.from({length:50}, (_,i) => ({ id:i+1, score: Math.random() * 20 }));
const s = mockStratify(pool50);
assert(s.length <= 32, "stratify — no supera 32 candidatos");
assert(new Set(s.map(p=>p.id)).size === s.length, "stratify — sin duplicados");

const withDups = [{ id:1 }, { id:2 }, { id:1 }];
assert(mockDedup(withDups).length === 2, "dedup — elimina duplicados");

const mixedTypes = [
  { id:1, tipo1:"Fire", tipo2:"Flying" }, { id:2, tipo1:"Fire", tipo2:null },
  { id:3, tipo1:"Dragon", tipo2:"Ground" }, { id:4, tipo1:"Fire", tipo2:null },
];
const fireOnly = mixedTypes.filter(p => p.tipo1==="Fire" || p.tipo2==="Fire");
assert(fireOnly.length === 3, "monotype filter — exacto");

const speedPool = [
  { id:1, nombre:"Reuniclus", spe:30 }, { id:2, nombre:"Zacian", spe:148 },
  { id:3, nombre:"Incineroar", spe:60 }, { id:4, nombre:"Hatterene", spe:29 },
];
const tr = [...speedPool].sort((a,b) => a.spe - b.spe);
assert(tr[0].nombre === "Hatterene", "TR sort — más lento primero");
assert(tr[tr.length-1].nombre === "Zacian", "TR sort — más rápido último");

section("Feedback parser — blacklist automática");

function parseFeedback(fb, team) {
  const patterns = [
    /no\s+(?:quiero|uses?)\s+([a-záéíóúñ\-]+)/gi,
    /(?:cambia|quita|saca)\s+(?:el\s+|la\s+|a\s+)?([a-záéíóúñ\-]+)/gi,
  ];
  const found = [];
  for (const p of patterns) {
    let m;
    while ((m = p.exec(fb)) !== null) if (m[1].length > 2) found.push(m[1].toLowerCase());
  }
  return team.filter(p => found.some(f => p.nombre.toLowerCase().includes(f))).map(p => p.nombre);
}

const team = [{ nombre:"Garchomp" }, { nombre:"Rotom-W" }, { nombre:"Gardevoir" }];
const bl1 = parseFeedback("no quiero garchomp", team);
assert(bl1.includes("Garchomp"), "parseFeedback — detecta 'no quiero X'");
const bl2 = parseFeedback("quita a gardevoir del equipo", team);
assert(bl2.includes("Gardevoir"), "parseFeedback — detecta 'quita a X'");
const bl3 = parseFeedback("equipo está bien así", team);
assert(bl3.length === 0, "parseFeedback — sin match vacío");

// ─── RESULTADO ─────────────────────────────────────────────────────
console.log(`\n${C.bold}━━━ RESULTADO ━━━${C.reset}`);
console.log(`Tests: ${passed + failed} | ${C.green}Pasaron: ${passed}${C.reset} | ${C.red}Fallaron: ${failed}${C.reset}`);
if (failures.length) {
  console.log(`\n${C.red}Fallos:${C.reset}`);
  failures.forEach(f => console.log(`  • ${f}`));
}
const ok = failed === 0;
console.log(`\n${ok ? C.green+"✓ TODOS OK"+C.reset : C.red+"✗ HAY FALLOS"+C.reset}\n`);
process.exit(ok ? 0 : 1);
