/**
 * POKEBUILDER PRO — MEGA TEST RUNNER v3.0.0
 * node scripts/test-runner.mjs
 * set BASE_URL=http://localhost:3000 && node scripts/test-runner.mjs
 * set STRESS_N=10 && set BASE_URL=http://localhost:3000 && node scripts/test-runner.mjs
 * set SKIP_SLOW=true — salta tests lentos (blacklist masiva)
 */
import { performance } from "perf_hooks";
const BASE_URL=process.env.BASE_URL||"http://localhost:3000";
const STRESS_N=parseInt(process.env.STRESS_N||"5");
const TIMEOUT=parseInt(process.env.TIMEOUT||"150000");
const DEBUG=process.env.DEBUG==="true";
const SKIP_SLOW=process.env.SKIP_SLOW==="true";
const C={reset:"\x1b[0m",bold:"\x1b[1m",red:"\x1b[31m",green:"\x1b[32m",yellow:"\x1b[33m",blue:"\x1b[34m",cyan:"\x1b[36m",gray:"\x1b[90m",bgRed:"\x1b[41m",bgGreen:"\x1b[42m",bgYellow:"\x1b[43m"};
const log={ok:(...a)=>console.log(`${C.green}✓${C.reset}`,...a),fail:(...a)=>console.log(`${C.red}✗${C.reset}`,...a),warn:(...a)=>console.log(`${C.yellow}⚠${C.reset}`,...a),info:(...a)=>console.log(`${C.cyan}ℹ${C.reset}`,...a),section:(t)=>console.log(`\n${C.bold}${C.blue}━━━ ${t} ━━━${C.reset}`),debug:(...a)=>DEBUG&&console.log(`${C.gray}[DBG]${C.reset}`,...a)};
const M={total:0,passed:0,failed:0,warned:0,lats:[],errors:[],ai:[]};
function ok(c,n,d=""){M.total++;if(c){M.passed++;log.ok(" "+n);return true;}M.failed++;const m=n+(d?": "+d:"");log.fail(" "+m);M.errors.push(m);return false;}
function sw(c,n,d=""){if(c){log.ok(" "+n);}else{M.warned++;log.warn(` ${C.yellow}(soft)${C.reset} ${n}${d?": "+d:""}`)}}

// ─── FIXTURES ─────────────────────────────────────────────────────
const CF={
  vgc:{format:"VGC",isMonotype:false,enableMega:false,allowLegendaries:true,allowParadox:true,isRandomizer:false,clauses:["Sleep Clause","Species Clause"],metaPreference:"meta",experienceLevel:"experto",blacklist:[]},
  vgcB:{format:"VGC",isMonotype:false,enableMega:false,allowLegendaries:false,allowParadox:false,isRandomizer:false,clauses:["Sleep Clause","Species Clause"],metaPreference:"balanced",experienceLevel:"intermedio",blacklist:[]},
  singles:{format:"Singles OU",isMonotype:false,enableMega:false,allowLegendaries:false,allowParadox:false,isRandomizer:false,clauses:["Sleep Clause","Species Clause","Evasion Clause","OHKO Clause"],metaPreference:"balanced",experienceLevel:"experto",blacklist:[]},
  bss:{format:"BSS",isMonotype:false,enableMega:false,allowLegendaries:true,allowParadox:true,isRandomizer:false,clauses:["Species Clause"],metaPreference:"meta",experienceLevel:"experto",blacklist:[]},
  mFire:{format:"Singles",isMonotype:true,monoTypeSelected:"fuego",enableMega:false,allowLegendaries:false,allowParadox:false,isRandomizer:false,clauses:["Sleep Clause","Species Clause","Item Clause"],metaPreference:"balanced",experienceLevel:"intermedio",blacklist:[]},
  mWater:{format:"VGC",isMonotype:true,monoTypeSelected:"agua",enableMega:false,allowLegendaries:false,allowParadox:false,isRandomizer:false,clauses:["Sleep Clause","Species Clause"],metaPreference:"balanced",experienceLevel:"experto",blacklist:[]},
  mDragon:{format:"Singles OU",isMonotype:true,monoTypeSelected:"dragon",enableMega:false,allowLegendaries:false,allowParadox:false,isRandomizer:false,clauses:["Sleep Clause","Species Clause"],metaPreference:"balanced",experienceLevel:"experto",blacklist:[]},
  tr:{format:"VGC",isMonotype:false,enableMega:false,allowLegendaries:false,allowParadox:false,isRandomizer:false,clauses:["Sleep Clause"],metaPreference:"balanced",experienceLevel:"experto",blacklist:[],preferTrickRoom:true,customStrategy:"Trick Room equipo lento. Setters de TR + atacantes lentos."},
  rand:{format:"VGC",isMonotype:false,enableMega:false,allowLegendaries:false,allowParadox:false,isRandomizer:true,clauses:["Sleep Clause"],metaPreference:"varied",experienceLevel:"principiante",blacklist:[]},
  ic:{format:"Singles OU",isMonotype:false,enableMega:false,allowLegendaries:false,allowParadox:false,isRandomizer:false,clauses:["Sleep Clause","Species Clause","Item Clause"],metaPreference:"meta",experienceLevel:"experto",blacklist:[]},
  stall:{format:"Singles OU",isMonotype:false,enableMega:false,allowLegendaries:false,allowParadox:false,isRandomizer:false,clauses:["Sleep Clause","Species Clause"],metaPreference:"niche",experienceLevel:"experto",blacklist:[],customStrategy:"Stall puro. Hazards + Recovery + PP stall. Sin atacantes."},
  ho:{format:"Singles OU",isMonotype:false,enableMega:false,allowLegendaries:false,allowParadox:false,isRandomizer:false,clauses:["Sleep Clause","Species Clause"],metaPreference:"meta",experienceLevel:"experto",blacklist:[],customStrategy:"Hyper offense. Todos sweepers setup. Cero soporte."},
  rain:{format:"VGC",isMonotype:false,enableMega:false,allowLegendaries:false,allowParadox:false,isRandomizer:false,clauses:["Sleep Clause","Species Clause"],metaPreference:"balanced",experienceLevel:"experto",blacklist:[],customStrategy:"Equipo lluvia. Drizzle + Swift Swim."},
  sun:{format:"VGC",isMonotype:false,enableMega:false,allowLegendaries:false,allowParadox:false,isRandomizer:false,clauses:["Sleep Clause","Species Clause"],metaPreference:"balanced",experienceLevel:"experto",blacklist:[],customStrategy:"Equipo sol. Drought + Chlorophyll."},
  sand:{format:"Singles OU",isMonotype:false,enableMega:false,allowLegendaries:false,allowParadox:false,isRandomizer:false,clauses:["Sleep Clause","Species Clause"],metaPreference:"niche",experienceLevel:"experto",blacklist:[],customStrategy:"Sand team con stall. Tyranitar + muros defensivos."},
};
const P={
  gardevoir:{id:282,nombre:"Gardevoir",tipo1:"Psychic",tipo2:"Fairy"},
  charizard:{id:6,nombre:"Charizard",tipo1:"Fire",tipo2:"Flying"},
  garchomp:{id:445,nombre:"Garchomp",tipo1:"Dragon",tipo2:"Ground"},
  rotomW:{id:479,nombre:"Rotom-W",tipo1:"Electric",tipo2:"Water"},
  incineroar:{id:727,nombre:"Incineroar",tipo1:"Fire",tipo2:"Dark"},
  rillaboom:{id:812,nombre:"Rillaboom",tipo1:"Grass",tipo2:null},
  flutter:{id:987,nombre:"Flutter Mane",tipo1:"Ghost",tipo2:"Fairy"},
  ironHands:{id:994,nombre:"Iron Hands",tipo1:"Fighting",tipo2:"Electric"},
  amoonguss:{id:591,nombre:"Amoonguss",tipo1:"Grass",tipo2:"Poison"},
  hatterene:{id:858,nombre:"Hatterene",tipo1:"Psychic",tipo2:"Fairy"},
  kyogre:{id:382,nombre:"Kyogre",tipo1:"Water",tipo2:null},
  zacian:{id:888,nombre:"Zacian",tipo1:"Fairy",tipo2:null},
  torkoal:{id:324,nombre:"Torkoal",tipo1:"Fire",tipo2:null},
  politoed:{id:186,nombre:"Politoed",tipo1:"Water",tipo2:null},
  tyranitar:{id:248,nombre:"Tyranitar",tipo1:"Rock",tipo2:"Dark"},
  reuniclus:{id:579,nombre:"Reuniclus",tipo1:"Psychic",tipo2:null},
  blissey:{id:242,nombre:"Blissey",tipo1:"Normal",tipo2:null},
  ferrothorn:{id:598,nombre:"Ferrothorn",tipo1:"Grass",tipo2:"Steel"},
  toxapex:{id:748,nombre:"Toxapex",tipo1:"Poison",tipo2:"Water"},
  clefairy:{id:35,nombre:"Clefairy",tipo1:"Fairy",tipo2:null},
};

// ─── UTILIDADES ───────────────────────────────────────────────────
function parseEv(ev){const m={};if(!ev)return m;for(const p of String(ev).split("/")){const x=p.trim().match(/^(\d+)\s+(\w+)$/);if(x)m[x[2].toLowerCase()]=parseInt(x[1]);}return m;}
function evSum(ev){return Object.values(parseEv(ev)).reduce((a,b)=>a+b,0);}
function repairJson(s){let r=s.replace(/,\s*([}\]])/g,"$1").replace(/,\s*$/,"");const o=(r.match(/\{/g)||[]).length,c=(r.match(/\}/g)||[]).length,ao=(r.match(/\[/g)||[]).length,ac=(r.match(/\]/g)||[]).length;if((r.match(/"/g)||[]).length%2!==0)r+='"';for(let i=0;i<ao-ac;i++)r+="]";for(let i=0;i<o-c;i++)r+="}";return r;}
function parseAI(raw){let c=raw.replace(/^[\s\S]*?```(?:json)?\s*/i,"").replace(/\s*```[\s\S]*$/i,"").trim();if(c.includes("```"))c=c.replace(/```(?:json)?|```/gi,"").trim();const fb=c.indexOf("{"),fab=c.indexOf("[");if(fb>0&&(fab===-1||fb<fab))c=c.slice(fb);else if(fab>0&&(fb===-1||fab<fb))c=c.slice(fab);try{return JSON.parse(c);}catch{return JSON.parse(repairJson(c));}}
const STATUS_MOVES=["thunder wave","will-o-wisp","toxic","spore","sleep powder","taunt","protect","rest","recover","roost","synthesis","parting shot","healing wish","lunar dance"];
function bq(poke){const issues=[],b=poke.build||{},mv=(b.moves||[]).map(m=>m.toLowerCase());if(new Set(mv).size<mv.length)issues.push("move repetido");const isCh=b.item?.toLowerCase().startsWith("choice");if(isCh&&mv.includes("protect"))issues.push("Choice+Protect");const isAV=b.item?.toLowerCase()==="assault vest";const st=mv.filter(m=>STATUS_MOVES.includes(m));if(isAV&&st.length>0)issues.push(`AV+status:${st.join(",")}`);const phys=["adamant","jolly","brave","naughty","lonely","hasty"],spec=["modest","timid","quiet","rash","mild"],nat=(b.nature||"").toLowerCase(),ev=parseEv(b.evSpread||"");if(phys.includes(nat)&&(ev["spa"]||0)>0)issues.push("físico+SpA");if(spec.includes(nat)&&(ev["atk"]||0)>0)issues.push("especial+Atk");if(evSum(b.evSpread)>510)issues.push(`EVs>${evSum(b.evSpread)}`);if(Object.values(ev).some(v=>v>252))issues.push("EV>252");return issues;}
function validateRes(res,cfg={}){const e=[];if(!res.success)e.push("success=false");if(!Array.isArray(res.suggestions)){e.push("suggestions no array");return e;}if(res.suggestions.length===0)e.push("suggestions vacío");for(const s of res.suggestions){if(!s.name)e.push("sin nombre");if(!s.build?.ability)e.push(`${s.name||"?"}:sin ability`);if(!s.build?.item)e.push(`${s.name||"?"}:sin item`);if(!s.build?.nature)e.push(`${s.name||"?"}:sin nature`);if(!Array.isArray(s.build?.moves)||s.build.moves.length<4)e.push(`${s.name||"?"}:moves<4(${s.build?.moves?.length??0})`);}const tc={};for(const s of res.suggestions){if(s.tipo1)tc[s.tipo1]=(tc[s.tipo1]||0)+1;}for(const[t,n]of Object.entries(tc))if(n>=4)e.push(`4+tipo${t}`);if(cfg.itemClause){const it=res.suggestions.map(s=>s.build?.item).filter(Boolean);if(new Set(it.map(i=>i.toLowerCase())).size<it.length)e.push("ItemClause violada");}if(cfg.speciesClause!==false){const nm=res.suggestions.map(s=>s.name?.toLowerCase()).filter(Boolean);if(new Set(nm).size<nm.length)e.push("SpeciesClause violada");}return e;}
function deepV(d,cfg={}){const e=validateRes(d,cfg);for(const s of d.suggestions||[]){const q=bq(s);if(q.length)e.push(`[BUILD]${s.name}:${q.join(";")}`)}if(d.report){if(!d.report.teamComposition||d.report.teamComposition.length<5)e.push("teamComposition vacío");if(!Array.isArray(d.report.strengths)||!d.report.strengths.length)e.push("strengths vacío");}return e;}
function detectContra(team,cfg){const i=[];const st=(cfg.customStrategy||"").toLowerCase();if(st.includes("stall")&&(st.includes("hyper offense")||st.includes("sweeper")))i.push("stall+HO");if(cfg.preferTrickRoom){const f=team.filter(p=>p.spe_base&&p.spe_base>100);if(f.length>=3)i.push(`TR+${f.length}rápidos`);}if(cfg.isMonotype&&cfg.monoTypeSelected){const mono=cfg.monoTypeSelected.toLowerCase(),wr=team.filter(p=>p.tipo1?.toLowerCase()!==mono&&p.tipo2?.toLowerCase()!==mono);if(wr.length)i.push(`Monotype:${wr.map(p=>p.nombre).join(",")}`);}if(cfg.clauses?.some(c=>c.toLowerCase().includes("item clause"))){const it=team.map(p=>p.item).filter(Boolean),dup=it.filter((x,idx)=>it.indexOf(x)!==idx);if(dup.length)i.push(`ItemClause:${dup.join(",")}`);}const roles=team.map(p=>(p.role||"").toLowerCase()),hasSw=roles.some(r=>r.includes("sweeper")||r.includes("setup")||r.includes("wallbreaker"));if(team.length>=4&&!hasSw)i.push("sin win condition");if((cfg.format||"").toLowerCase().includes("vgc")){const wp=team.filter(p=>p.moves?.some(m=>m.toLowerCase()==="protect"));if(team.length>=4&&wp.length<2)i.push(`VGC:${wp.length}Protect`);}if(st.includes("lluvia")&&st.includes("sol"))i.push("dual-clima");return i;}
function parseFB(fb,team){const pats=[/no\s+(?:quiero|me\s+gusta|uses?)\s+([a-záéíóúñ\-]+)/gi,/(?:cambia|quita|saca|reemplaza)\s+(?:el\s+|la\s+|a\s+)?([a-záéíóúñ\-]+)/gi,/(?:sin|fuera)\s+([a-záéíóúñ\-]+)/gi];const found=[];for(const p of pats){let m;while((m=p.exec(fb))!==null)if(m[1].length>2)found.push(m[1].toLowerCase());}const bl=[];for(const f of found)for(const s of team)if(s&&s.nombre.toLowerCase().includes(f))bl.push(s.nombre);return[...new Set(bl)];}

// ─── SECCIÓN A: parseAIResponse (12 casos) ───────────────────────
function secA(){
  log.section("A — parseAIResponse: parsing robusto (12)");
  ok((()=>{const r=parseAI('{"selected_ids":[1,2],"builds":{}}');return"selected_ids"in r;})(),"JSON limpio — selected_ids");
  ok((()=>{const r=parseAI('```json\n{"x":1}\n```');return r.x===1;})(),"Markdown ```json");
  ok((()=>{const r=parseAI('```\n{"x":2}\n```');return r.x===2;})(),"Markdown ``` sin lang");
  ok((()=>{const r=parseAI('Respuesta:\n{"y":3}');return r.y===3;})(),"Texto previo al JSON");
  ok((()=>{const r=parseAI('{"suggestions":[{"name":"Pika"}]}');return r.suggestions?.[0]?.name==="Pika";})(),"Formato B (suggestions[])");
  ok((()=>{const r=parseAI('{"a":1,"extra":{"b":2},"arr":[1,2,3]}');return r.a===1&&r.arr?.length===3;})(),"Campos desconocidos extra");
  ok((()=>{try{const r=parseAI('{"a":1,"b":{"moves":["EQ","DC"');return typeof r==="object";}catch{return true;}})(),"JSON truncado — repair/fallo limpio");
  ok((()=>{const r=parseAI('  \n  {"z":"hello"}\n  ');return r.z==="hello";})(),"Whitespace rodeando JSON");
  ok((()=>{const r=parseAI('{"a":1,}');return typeof r==="object"&&r.a===1;})(),"Trailing comma — repair");
  ok((()=>{const r=parseAI('{"builds":{"7":{"item":"Choice Band","ability":"Guts","nature":"Adamant","moves":["CC","IH","P","MP"]}}}');return r.builds?.["7"]?.item==="Choice Band";})(),"Formato A — build anidado completo");
  ok((()=>{const r=parseAI('Aquí el JSON:\n```json\n{"teamComposition":"TR","strengths":["Bulk"],"weaknesses":[],"typesCoverage":"x","speedControl":"TR","synergySummary":"x","recommendation":"Run TR"}\n```\nEspero que ayude!');return r.teamComposition==="TR"&&r.strengths?.length===1;})(),"Fence con texto antes Y después");
  ok((()=>{const r=parseAI('{"perPokemon":[{"name":"Garchomp","role":"Sweeper","counters":["Clefable"],"threatens":["Electric"],"synergyWith":["Gardevoir"]}]}');return r.perPokemon?.[0]?.name==="Garchomp"&&Array.isArray(r.perPokemon[0].counters);})(),"perPokemon anidado — estructura array");
}

// ─── SECCIÓN B: validateSuggestResponse (14 casos) ───────────────
function secB(){
  log.section("B — validateSuggestResponse: reglas equipo (14)");
  const g={success:true,suggestions:[{id:"445",name:"Garchomp",tipo1:"Dragon",tipo2:"Ground",build:{ability:"Rough Skin",nature:"Jolly",item:"Rocky Helmet",evSpread:"4 HP / 252 Atk / 252 Spe",moves:["EQ","DC","SR","SD"]},role:"Sweeper",synergies:[]},{id:"282",name:"Gardevoir",tipo1:"Psychic",tipo2:"Fairy",build:{ability:"Trace",nature:"Modest",item:"Choice Specs",evSpread:"4 HP / 252 SpA / 252 Spe",moves:["Moonblast","Psychic","Shadow Ball","Trick"]},role:"Attacker",synergies:[]}]};
  ok(validateRes(g).length===0,"Equipo válido — 0 errores");
  ok(validateRes({success:true,suggestions:[]}).length>0,"Suggestions vacío detectado");
  ok(validateRes({success:true,suggestions:[{name:"",tipo1:"Fire",build:{ability:"x",nature:"x",item:"x",moves:["a","b","c","d"]},synergies:[]}]}).some(e=>e.includes("nombre")),"Sin nombre detectado");
  ok(validateRes({success:true,suggestions:[{name:"X",tipo1:"Rock",build:{ability:"",nature:"Jolly",item:"Lum",moves:["a","b","c","d"]},synergies:[]}]}).some(e=>e.includes("ability")),"Sin ability detectado");
  ok(validateRes({success:true,suggestions:[{name:"X",tipo1:"Grass",build:{ability:"Overgrow",nature:"Modest",item:"",moves:["a","b","c","d"]},synergies:[]}]}).some(e=>e.includes("item")),"Sin item detectado");
  ok(validateRes({success:true,suggestions:[{name:"Pika",tipo1:"Electric",build:{ability:"Static",nature:"Timid",item:"LB",moves:["TB","VT"]},synergies:[]}]}).some(e=>e.includes("moves<4")),"2 moves — detectado");
  ok(validateRes({success:true,suggestions:[{name:"Over",tipo1:"Dragon",build:{ability:"x",nature:"Jolly",item:"LO",evSpread:"252 HP / 252 Atk / 252 Def",moves:["a","b","c","d"]},synergies:[]}]}).some(e=>e.includes("510")),"EVs 756>510 — detectado");
  ok(validateRes({success:true,suggestions:[{name:"Big",tipo1:"Steel",build:{ability:"x",nature:"Modest",item:"AV",evSpread:"300 SpA / 252 Spe",moves:["a","b","c","d"]},synergies:[]}]}).some(e=>e.includes("252")),"EV individual>252 — detectado");
  const dt={success:true,suggestions:["A","B","C","D"].map((n,i)=>({name:n,tipo1:"Fire",build:{ability:"Blaze",nature:"Timid",item:`CS${i}`,moves:["a","b","c","d"]},synergies:[]}))};
  ok(validateRes(dt).some(e=>e.includes("4+")),"4x mismo tipo — detectado");
  const dup={success:true,suggestions:[{name:"X",tipo1:"Water",build:{ability:"x",nature:"Timid",item:"Choice Specs",moves:["a","b","c","d"]},synergies:[]},{name:"Y",tipo1:"Dragon",build:{ability:"x",nature:"Modest",item:"Choice Specs",moves:["a","b","c","d"]},synergies:[]}]};
  ok(validateRes(dup,{itemClause:true}).some(e=>e.includes("Item")),"Item Clause violada con cfg=true");
  ok(validateRes(dup,{itemClause:false}).length===0,"Item Clause no activa — dup permitido");
  ok(validateRes({success:false,suggestions:[],report:{},meta:{}}).length>0,"success=false detectado");
  const sd={success:true,suggestions:[{name:"Garchomp",tipo1:"Dragon",build:{ability:"RS",nature:"Jolly",item:"LO",moves:["a","b","c","d"]},synergies:[]},{name:"Garchomp",tipo1:"Dragon",build:{ability:"SV",nature:"Jolly",item:"CS",moves:["a","b","c","d"]},synergies:[]}]};
  ok(validateRes(sd).some(e=>e.toLowerCase().includes("species")),"Species duplicada detectada");
  const vgcMeta={success:true,suggestions:[{name:"Incineroar",tipo1:"Fire",tipo2:"Dark",build:{ability:"Intimidate",nature:"Careful",item:"Safety Goggles",evSpread:"252 HP / 4 Atk / 252 SpD",moves:["Fake Out","Flare Blitz","Parting Shot","Taunt"]},synergies:[]},{name:"Rillaboom",tipo1:"Grass",build:{ability:"Grassy Surge",nature:"Adamant",item:"Choice Band",evSpread:"4 HP / 252 Atk / 252 Spe",moves:["Grassy Glide","Wood Hammer","U-turn","Fake Out"]},synergies:[]},{name:"Flutter Mane",tipo1:"Ghost",tipo2:"Fairy",build:{ability:"Protosynthesis",nature:"Timid",item:"Booster Energy",evSpread:"4 HP / 252 SpA / 252 Spe",moves:["Moonblast","Shadow Ball","Protect","Dazzling Gleam"]},synergies:[]},{name:"Iron Hands",tipo1:"Fighting",tipo2:"Electric",build:{ability:"Quark Drive",nature:"Brave",item:"Assault Vest",evSpread:"252 HP / 252 Atk / 4 SpD",moves:["Fake Out","Close Combat","Wild Charge","Heavy Slam"]},synergies:[]}]};
  ok(validateRes(vgcMeta,{itemClause:false}).length===0,"Equipo VGC meta completo — 0 errores");
}

// ─── SECCIÓN C: Pool logic (12 casos) ────────────────────────────
function mockDedup(a){const s=new Set();return a.filter(p=>{const d=s.has(p.id);s.add(p.id);return !d;});}
function mockStrat(pool,pref="balanced"){const P={meta:{h:18,v:8,n:4},balanced:{h:14,v:12,n:6},niche:{h:4,v:8,n:18}}[pref]||{h:14,v:12,n:6};return mockDedup([...pool.filter(x=>x.score>5).slice(0,P.h),...pool.filter(x=>x.score>1&&x.score<=5).slice(0,P.v),...pool.filter(x=>x.score<=1).slice(0,P.n)]);}
function secC(){
  log.section("C — Pool logic: filtros y estratificación (12)");
  const p50=Array.from({length:50},(_,i)=>({id:i+1,score:Math.random()*20}));
  const sb=mockStrat(p50,"balanced");
  ok(sb.length<=32,`stratify balanced — ≤32 candidatos (${sb.length})`);
  ok(new Set(sb.map(p=>p.id)).size===sb.length,"stratify balanced — sin duplicados");
  const sm=mockStrat(p50,"meta"),sn=mockStrat(p50,"niche");
  ok(sm.filter(p=>p.score>5).length>=sn.filter(p=>p.score>5).length,"meta tiene más high-tier que niche");
  ok(sn.filter(p=>p.score<=1).length>=sm.filter(p=>p.score<=1).length,"niche tiene más low-tier que meta");
  ok(mockDedup([{id:1},{id:2},{id:1},{id:3},{id:2}]).length===3,"dedup — 5 items → 3 únicos");
  ok(mockDedup([]).length===0,"dedup — array vacío");
  const pool=[{id:1,nombre:"Garchomp"},{id:2,nombre:"Gardevoir"},{id:3,nombre:"Rotom"},{id:4,nombre:"Incineroar"}];
  const bl=["gardevoir","rotom"],filt=pool.filter(p=>!bl.includes(p.nombre.toLowerCase()));
  ok(filt.length===2&&filt.every(p=>!bl.includes(p.nombre.toLowerCase())),"blacklist — excluye 2 Pokémon exactos");
  const mixed=[{id:1,tipo1:"Fire",tipo2:"Flying"},{id:2,tipo1:"Fire",tipo2:null},{id:3,tipo1:"Dragon",tipo2:"Ground"},{id:4,tipo1:"Fire",tipo2:null},{id:5,tipo1:"Bug",tipo2:"Fire"}];
  ok(mixed.filter(p=>p.tipo1?.toLowerCase()==="fire"||p.tipo2?.toLowerCase()==="fire").length===4,"monotype fuego — 4 de 5");
  const speeds=[{id:1,spe:30},{id:2,spe:148},{id:3,spe:29},{id:4,spe:60},{id:5,spe:100}];
  const tr=[...speeds].sort((a,b)=>a.spe-b.spe);
  ok(tr[0].spe===29&&tr[tr.length-1].spe===148,"TR sort — orden spe correcto");
  const pf=[{id:1},{id:2},{id:3},{id:4},{id:5}],ex=pf.filter(p=>![2,4].includes(p.id));
  ok(ex.length===3&&!ex.find(p=>p.id===2||p.id===4),"excludeIds — excluye exactos");
  ok([].length<3,"safety net — pool vacío detectado");
}

// ─── SECCIÓN D: EV/IV math (10 casos) ────────────────────────────
function secD(){
  log.section("D — EV/IV math (10)");
  ok(evSum("252 HP / 4 Def / 252 Spe")===508,"Spread 508 clásico");
  ok(evSum("6 HP / 252 SpA / 252 Spe")===510,"Spread máximo 510");
  ok(evSum("0 HP / 0 Atk / 0 Def")===0,"Spread vacío = 0");
  ok(evSum("252 HP / 252 Atk / 252 Def")>510,"EVs 756 > 510 detectado");
  ok(evSum("252 HP / 252 Atk / 4 SpD")===508,"Spread defensivo-ofensivo mixto");
  const ev=parseEv("252 HP / 4 Atk / 252 Spe");
  ok(ev["hp"]===252&&ev["atk"]===4&&ev["spe"]===252,"parseEv — valores exactos");
  const ev2=parseEv("300 HP / 252 SpA");
  ok(ev2["hp"]>252,"EV HP=300>252 detectado");
  const ev3=parseEv("252 Atk / 252 Spe / 6 HP");
  ok(ev3["atk"]===252&&ev3["spe"]===252&&ev3["hp"]===6,"parseEv — orden libre");
  ok(Object.keys(parseEv("")).length===0,"parseEv string vacío → {}");
  ok(evSum("252 HP / 200 Def / 58 SpD")===510,"Spread defensivo Def+SpD = 510");
}

// ─── SECCIÓN E: Type coverage (12 casos) ─────────────────────────
const TC={Fire:{Grass:2,Ice:2,Bug:2,Steel:2,Water:0.5,Rock:0.5,Fire:0.5},Water:{Fire:2,Rock:2,Ground:2,Grass:0.5,Water:0.5},Electric:{Water:2,Flying:2,Ground:0,Electric:0.5,Grass:0.5},Dragon:{Dragon:2,Fairy:0},Fairy:{Dragon:2,Dark:2,Fighting:2,Fire:0.5,Poison:0.5,Steel:0.5},Ground:{Fire:2,Electric:2,Poison:2,Rock:2,Steel:2,Flying:0,Grass:0.5},Ghost:{Psychic:2,Ghost:2,Normal:0},Ice:{Dragon:2,Flying:2,Grass:2,Ground:2,Fire:0.5,Steel:0.5},Fighting:{Normal:2,Rock:2,Steel:2,Ice:2,Dark:2,Ghost:0,Fairy:0.5}};
function getEff(atk,def){const c=TC[atk]||{};return def.reduce((m,t)=>m*(c[t]??1),1);}
function twk(team){const r={};for(const atk of Object.keys(TC)){let n=0;for(const p of team){const types=[p.tipo1,p.tipo2].filter(Boolean);if(getEff(atk,types)>=2)n++;}if(n>=2)r[atk]=n;}return r;}
function secE(){
  log.section("E — Type coverage (12)");
  ok(getEff("Fire",["Grass"])===2,"Fire vs Grass = 2x");
  ok(getEff("Fire",["Water"])===0.5,"Fire vs Water = 0.5x");
  ok(getEff("Electric",["Ground"])===0,"Electric vs Ground = inmune");
  ok(getEff("Dragon",["Fairy"])===0,"Dragon vs Fairy = inmune");
  ok(getEff("Ground",["Flying"])===0,"Ground vs Flying = inmune");
  ok(getEff("Water",["Fire","Rock"])===4,"Water vs Fire/Rock dual = 4x");
  ok(getEff("Ice",["Dragon","Flying"])===4,"Ice vs Dragon/Flying = 4x");
  ok(getEff("Fairy",["Dragon","Dark"])===4,"Fairy vs Dragon/Dark = 4x");
  ok(getEff("Fighting",["Ghost"])===0,"Fighting vs Ghost = inmune");
  ok(getEff("Fire",["Steel","Grass"])===4,"Fire vs Steel/Grass = 4x");
  const mf=[{tipo1:"Fire",tipo2:"Flying"},{tipo1:"Fire",tipo2:null},{tipo1:"Fire",tipo2:null},{tipo1:"Fire",tipo2:null}];
  sw((twk(mf)["Water"]||0)>=2,`Monotype fuego — Water amenaza ≥2 (${twk(mf)["Water"]||0})`);
  const bl=[{tipo1:"Dragon",tipo2:"Ground"},{tipo1:"Psychic",tipo2:"Fairy"},{tipo1:"Fire",tipo2:"Dark"},{tipo1:"Electric",tipo2:"Water"}];
  sw(Object.keys(twk(bl)).length<=5,`Equipo balanceado — ≤5 tipos con doble debilidad (${Object.keys(twk(bl)).length})`);
}

// ─── SECCIÓN F: Equipos contradictorios local (15 casos) ──────────
function secF(){
  log.section("F — Equipos contradictorios: detección (15)");
  ok(detectContra([],{customStrategy:"Stall Y hyper offense todos sweepers"}).some(i=>i.includes("stall+HO")),"Stall+HO detectado");
  ok(detectContra([{nombre:"Zacian",spe_base:148},{nombre:"Dragapult",spe_base:142},{nombre:"Koko",spe_base:130}],{preferTrickRoom:true}).some(i=>i.includes("TR")),"TR con 3 rápidos detectado");
  ok(detectContra([{nombre:"Garchomp",tipo1:"Dragon",tipo2:"Ground"},{nombre:"Rotom",tipo1:"Electric",tipo2:null}],{isMonotype:true,monoTypeSelected:"fuego"}).some(i=>i.includes("Monotype")),"Tipo incorrecto en monotype");
  ok(detectContra([{nombre:"A",item:"Choice Band"},{nombre:"B",item:"Choice Band"}],{clauses:["Item Clause"]}).some(i=>i.includes("Item")),"Item Clause violada en equipo base");
  ok(detectContra([{nombre:"Blissey",role:"wall"},{nombre:"Ferro",role:"wall"},{nombre:"Chansey",role:"wall"},{nombre:"Toxapex",role:"wall"}],{format:"Singles"}).some(i=>i.includes("win condition")),"4 walls sin win condition");
  ok(detectContra([{nombre:"A",moves:["TB","VS"]},{nombre:"B",moves:["FT","WoW"]},{nombre:"C",moves:["EQ","SE"]},{nombre:"D",moves:["MB","Psy"]}],{format:"VGC"}).some(i=>i.includes("Protect")),"VGC sin Protect detectado");
  ok(detectContra([],{customStrategy:"Lluvia + sol simultáneos"}).some(i=>i.includes("dual-clima")),"Dual-clima detectado");
  const sd=[{nombre:"Garchomp"},{nombre:"Garchomp"}],nm=sd.map(p=>p.nombre.toLowerCase());ok(new Set(nm).size<nm.length,"Species duplicada en equipo");
  ok(detectContra([{nombre:"Gardevoir",tipo1:"Psychic",tipo2:"Fairy",role:"sweeper",moves:["Moonblast","Psychic","ShadowBall","Protect"],item:"CS"},{nombre:"Incineroar",tipo1:"Fire",tipo2:"Dark",role:"pivot",moves:["Fake Out","FlarBlitz","PartingShot","Protect"],item:"AV"}],{format:"VGC",clauses:["Sleep Clause"]}).length===0,"Equipo válido — 0 contradicciones");
  sw(detectContra([{nombre:"Hatterene",spe_base:29},{nombre:"Reuniclus",spe_base:30},{nombre:"Zacian",spe_base:148}],{preferTrickRoom:true}).filter(i=>i.includes("TR")).length===0,"TR mixto (2 lentos + 1 rápido) — sin alerta severa");
  ok(!detectContra([{nombre:"Draga",role:"sweeper"},{nombre:"Volca",role:"setup sweeper"},{nombre:"Garcho",role:"sweeper"},{nombre:"Zacian",role:"sweeper"}],{format:"Singles"}).some(i=>i.includes("win condition")),"HO con 4 sweepers tiene win condition");
  ok(detectContra([{nombre:"X"}],{clauses:["Item Clause"]}).filter(i=>i.includes("Item")).length===0,"Item Clause con equipo sin items — no falso positivo");
  ok(!detectContra([{nombre:"Arcanine",tipo1:"Fire",tipo2:null},{nombre:"Charizard",tipo1:"Fire",tipo2:"Flying"}],{isMonotype:true,monoTypeSelected:"fuego"}).some(i=>i.includes("Monotype")),"Monotype correcto — no falso positivo");
  ok(detectContra([P.incineroar],{blacklist:["Incineroar"]})!==undefined,"Líder en blacklist — no crashea");
  ok(Array.isArray(detectContra([],{customStrategy:"",format:"",clauses:[]})),"Config mínima — no crashea");
}

// ─── SECCIÓN G: Build quality (12 casos) ─────────────────────────
function secG(){
  log.section("G — Build quality: coherencia de sets (12)");
  ok(bq({name:"G",build:{ability:"RS",nature:"Jolly",item:"Choice Scarf",evSpread:"4 HP / 252 Atk / 252 Spe",moves:["EQ","DC","Protect","SE"]}}).some(i=>i.includes("Choice")),"Choice Scarf + Protect");
  ok(bq({name:"R",build:{ability:"GS",nature:"Adamant",item:"Choice Band",evSpread:"4 HP / 252 Atk / 252 Spe",moves:["GG","WH","U","Protect"]}}).some(i=>i.includes("Choice")),"Choice Band + Protect");
  ok(bq({name:"I",build:{ability:"Int",nature:"Careful",item:"Assault Vest",evSpread:"252 HP / 4 Atk / 252 SpD",moves:["Fake Out","Flare Blitz","Parting Shot","Snarl"]}}).some(i=>i.includes("AV")),"AV + Parting Shot");
  ok(bq({name:"IH",build:{ability:"QD",nature:"Brave",item:"Assault Vest",evSpread:"252 HP / 252 Atk / 4 SpD",moves:["Fake Out","CC","WC","Protect"]}}).some(i=>i.includes("AV")),"AV + Protect");
  ok(bq({name:"X",build:{ability:"x",nature:"Jolly",item:"Lum",evSpread:"252 Atk / 252 Spe / 6 HP",moves:["EQ","EQ","DC","SE"]}}).some(i=>i.includes("move repetido")),"Movimiento repetido");
  ok(bq({name:"A",build:{ability:"x",nature:"Adamant",item:"LO",evSpread:"4 HP / 152 Atk / 100 SpA / 252 Spe",moves:["EQ","DC","FB","SD"]}}).some(i=>i.includes("físico"))||evSum("4 HP / 152 Atk / 100 SpA / 252 Spe")>510,"Adamant+SpA EVs");
  ok(bq({name:"B",build:{ability:"x",nature:"Modest",item:"Specs",evSpread:"4 HP / 100 Atk / 252 SpA / 252 Spe",moves:["MB","SB","Psy","P"]}}).some(i=>i.includes("especial"))||evSum("4 HP / 100 Atk / 252 SpA / 252 Spe")>510,"Modest+Atk EVs");
  ok(bq({name:"C",build:{ability:"x",nature:"Jolly",item:"LO",evSpread:"252 HP / 252 Atk / 252 Spe",moves:["a","b","c","d"]}}).some(i=>i.includes("510")),"EVs 756>510");
  ok(bq({name:"Gardevoir",build:{ability:"Trace",nature:"Modest",item:"Choice Specs",evSpread:"4 HP / 252 SpA / 252 Spe",moves:["Moonblast","Psychic","Shadow Ball","Trick"]}}).length===0,"Gardevoir Specs — limpio");
  ok(bq({name:"Incineroar",build:{ability:"Intimidate",nature:"Careful",item:"Safety Goggles",evSpread:"252 HP / 4 Atk / 252 SpD",moves:["Fake Out","Flare Blitz","Parting Shot","Taunt"]}}).length===0,"Incineroar SG — limpio");
  ok(bq({name:"Reuniclus",build:{ability:"Magic Guard",nature:"Quiet",item:"Life Orb",evSpread:"252 HP / 252 SpA / 4 SpD",moves:["Psychic","Focus Blast","Shadow Ball","Trick Room"]}}).length===0,"Reuniclus TR — limpio");
  ok(bq({name:"IH2",build:{ability:"Quark Drive",nature:"Brave",item:"Assault Vest",evSpread:"252 HP / 252 Atk / 4 SpD",moves:["Fake Out","Close Combat","Wild Charge","Heavy Slam"]}}).length===0,"AV sin status moves — limpio");
}

// ─── SECCIÓN H: Prompt/feedback sanitizer (8 casos) ──────────────
function secH(){
  log.section("H — Prompt/feedback sanitizer (8)");
  const team=[P.garchomp,P.gardevoir,P.rotomW,P.incineroar];
  ok(parseFB("no quiero garchomp",team).includes("Garchomp"),"Detecta 'no quiero X'");
  ok(parseFB("quita a gardevoir",team).includes("Gardevoir"),"Detecta 'quita a X'");
  ok(parseFB("saca a rotom-w del equipo",team).includes("Rotom-W"),"Detecta 'saca a X'");
  ok(parseFB("fuera incineroar",team).includes("Incineroar"),"Detecta 'fuera X'");
  ok(parseFB("no me gusta el equipo",team).length===0,"Sin nombre — blacklist vacía");
  ok(Array.isArray(parseFB("cambia todo son malos",team)),"Feedback ambiguo — no crashea");
  ok(parseFB("no quiero garchomp ni gardevoir",team).length>=2,`Múltiples exclusiones (${parseFB("no quiero garchomp ni gardevoir",team).length})`);
  ok(parseFB("",team).length===0,"Feedback vacío — blacklist vacía");
}

// ══════════════════════════════════════════════════════════════════
// ─── INTEGRATION ─────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════
let serverUp=false;
// try multiple times because Next.js dev server may need a few seconds to spin up
async function checkServer(){
  const maxAttempts = 5;
  for(let attempt=1; attempt<=maxAttempts; attempt++){
    try{
      const r = await fetch(`${BASE_URL}/api/pokemon/suggest`,{
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
        signal: AbortSignal.timeout(5000),
      });
      console.log(`[checkServer] attempt ${attempt}, got status ${r.status}`);
      if(r.status !== 0) return true;
    }catch(e){
      console.log(`[checkServer] attempt ${attempt} error: ${e.message}`);
    }
    if(attempt < maxAttempts) await new Promise(res=>setTimeout(res,1000));
  }
  return false;
}
async function call(body,tag=""){const id=`t${tag.replace(/\s/g,"").slice(0,6)}_${Date.now().toString(36)}`;const t0=performance.now();const res=await fetch(`${BASE_URL}/api/pokemon/suggest`,{method:"POST",headers:{"Content-Type":"application/json","x-session-id":id},body:JSON.stringify(body),signal:AbortSignal.timeout(TIMEOUT)});const ms=Math.round(performance.now()-t0);M.lats.push(ms);const data=await res.json().catch(()=>({}));log.debug(`[${id}] ${res.status} ${ms}ms sug=${data.suggestions?.length??"?"}`);return{status:res.status,data,ms};}
const spn=["⠋","⠙","⠹","⠸","⠼","⠴","⠦","⠧","⠇","⠏"];let spi=0;
async function iTest(name,body,checks=[]){const iv=setInterval(()=>{process.stdout.write(`\r  ${spn[spi++%spn.length]} ${C.gray}${name}${C.reset}  `);},120);try{const{status,data,ms}=await call(body,name);clearInterval(iv);process.stdout.write("\r"+" ".repeat(name.length+12)+"\r");M.ai.push({name,ms,suggestions:data.suggestions?.length??0,warnings:data.warnings||[]});for(const{test,label,warn}of checks){const r=test(status,data,ms);const d=r?"":(`warns=[${(data.warnings||[]).join("|").slice(0,80)}]`);if(warn)sw(r,`  ${name} — ${label}`,d);else ok(r,`  ${name} — ${label}`,d);}const wn=(data.warnings||[]).length?` ${C.yellow}⚠${(data.warnings||[]).length}${C.reset}`:"";log.info(`  ${C.gray}${name}: ${ms}ms | ${data.suggestions?.length??0}sug${wn}${C.reset}`);if(data.warnings?.length)log.warn(`  ${data.warnings.slice(0,2).join(" | ")}`);return{status,data,ms};}catch(e){clearInterval(iv);process.stdout.write("\r"+" ".repeat(name.length+12)+"\r");ok(false,`  ${name} — REQUEST FAILED`,e.message);return{status:0,data:{},ms:0};}}

// ─── SECCIÓN I: Escenarios básicos (15) ──────────────────────────
async function secI(){
  log.section("I — /api/pokemon/suggest: escenarios básicos (15)");
  if(!serverUp){log.warn("Sin servidor — omitiendo");return;}
  await iTest("I01 request vacío",{},[{label:"400",test:(s)=>s===400}]);
  await iTest("I02 sin config",{lockedTeam:[],slotIndex:0},[{label:"400",test:(s)=>s===400}]);
  await iTest("I03 slotIndex=-1",{config:CF.vgc,lockedTeam:[],slotIndex:-1},[{label:"400",test:(s)=>s===400}]);
  await iTest("I04 slotIndex=99",{config:CF.vgc,lockedTeam:[],slotIndex:99},[{label:"400",test:(s)=>s===400}]);
  await iTest("I05 VGC scratch",{config:CF.vgc,lockedTeam:[],slotIndex:0},[
    {label:"200",test:(s)=>s===200},
    {label:"suggestions>0",test:(_,d)=>d.suggestions?.length>0},
    {label:"build completo",test:(_,d)=>d.suggestions?.every(s=>s.build?.ability&&s.build?.item&&s.build?.moves?.length>=4)},
    {label:"reporte presente",test:(_,d)=>!!d.report?.teamComposition},
    {label:"deepValidate 0 errores",test:(_,d)=>deepV(d).length===0,warn:true},
  ]);
  await iTest("I06 Singles líder Gardevoir",{config:CF.singles,lockedTeam:[P.gardevoir],slotIndex:0},[
    {label:"200",test:(s)=>s===200},
    {label:"no incluye a Gardevoir",test:(_,d)=>!d.suggestions?.some(s=>s.name?.toLowerCase().includes("gardevoir"))},
    {label:"report presente",test:(_,d)=>!!d.report?.teamComposition},
  ]);
  await iTest("I07 VGC líder Incineroar",{config:CF.vgc,lockedTeam:[P.incineroar],slotIndex:0},[
    {label:"200",test:(s)=>s===200},
    {label:"≥4 sugerencias",test:(_,d)=>d.suggestions?.length>=4},
  ]);
  await iTest("I08 Monotype Fuego",{config:CF.mFire,lockedTeam:[],slotIndex:0},[
    {label:"200",test:(s)=>s===200},
    {label:"suggestions>0",test:(_,d)=>d.suggestions?.length>0},
  ]);
  await iTest("I09 TrickRoom líder Hatterene",{config:CF.tr,lockedTeam:[P.hatterene],slotIndex:0},[
    {label:"200",test:(s)=>s===200},
    {label:"speedControl en reporte",test:(_,d)=>!!d.report?.speedControl,warn:true},
  ]);
  await iTest("I10 BSS format",{config:CF.bss,lockedTeam:[],slotIndex:0},[
    {label:"200",test:(s)=>s===200},
    {label:"suggestions>0",test:(_,d)=>d.suggestions?.length>0},
  ]);
  await iTest("I11 Equipo 4 fijos — 2 slots libres",{config:CF.vgc,lockedTeam:[P.incineroar,P.rillaboom,P.flutter,P.ironHands],slotIndex:0},[
    {label:"200",test:(s)=>s===200},
    {label:"2 sugerencias",test:(_,d)=>d.suggestions?.length===2,warn:true},
  ]);
  await iTest("I12 Item Clause",{config:CF.ic,lockedTeam:[],slotIndex:0},[
    {label:"200",test:(s)=>s===200},
    {label:"sin items dup",test:(_,d)=>{const it=(d.suggestions||[]).map(s=>s.build?.item).filter(Boolean);return new Set(it.map(i=>i.toLowerCase())).size>=it.length;},warn:true},
  ]);
  if(!SKIP_SLOW)await iTest("I13 Blacklist 10 top-tier",{config:{...CF.vgc,blacklist:["Incineroar","Rillaboom","Garchomp","Dragapult","Urshifu","Calyrex","Kyogre","Zacian","Miraidon","Koraidon"]},lockedTeam:[],slotIndex:0},[
    {label:"200",test:(s)=>s===200},
    {label:"sin bloqueados",test:(_,d)=>!d.suggestions?.some(s=>["incineroar","rillaboom","garchomp","dragapult","urshifu"].includes(s.name?.toLowerCase())),warn:true},
  ]);
  await iTest("I14 Randomizer mode",{config:CF.rand,lockedTeam:[],slotIndex:0},[{label:"200",test:(s)=>s===200},{label:"suggestions>0",test:(_,d)=>d.suggestions?.length>0}]);
  await iTest("I15 Meta — configHash+timestamp",{config:CF.vgc,lockedTeam:[],slotIndex:0},[
    {label:"200",test:(s)=>s===200},
    {label:"meta.configHash presente",test:(_,d)=>typeof d.meta?.configHash==="string"&&d.meta.configHash.length>0},
    {label:"meta.timestamp>0",test:(_,d)=>d.meta?.timestamp>0},
  ]);
}

// ─── SECCIÓN J: Swap edge cases (10) ────────────────────────────
async function secJ(){
  log.section("J — Swap edge cases (10)");
  if(!serverUp){log.warn("Sin servidor — omitiendo");return;}
  await iTest("J01 Swap básico 3 alternativas",{config:CF.vgc,lockedTeam:[P.incineroar,P.rillaboom,P.flutter],slotIndex:1,swapCount:3},[
    {label:"200",test:(s)=>s===200},
    {label:"3 alternativas",test:(_,d)=>d.suggestions?.length===3},
    {label:"no incluye líder",test:(_,d)=>!d.suggestions?.some(s=>s.name?.toLowerCase()==="incineroar")},
    {label:"roles distintos ≥2",test:(_,d)=>new Set(d.suggestions?.map(s=>s.role?.toLowerCase()||"").filter(Boolean)).size>=2,warn:true},
  ]);
  await iTest("J02 Swap 1 slot exacto",{config:CF.singles,lockedTeam:[P.garchomp,P.gardevoir,P.rotomW,P.incineroar],slotIndex:4,swapCount:1},[
    {label:"200",test:(s)=>s===200},
    {label:"exactamente 1 sugerencia",test:(_,d)=>d.suggestions?.length===1},
    {label:"build completo",test:(_,d)=>d.suggestions?.[0]?.build?.moves?.length>=4,warn:true},
  ]);
  await iTest("J03 Swap con feedback soporte",{config:{...CF.vgc,customStrategy:"Necesito redirector y soporte, no más atacantes"},lockedTeam:[P.garchomp,P.charizard],slotIndex:2,swapCount:3},[
    {label:"200",test:(s)=>s===200},
    {label:"suggestions>0",test:(_,d)=>d.suggestions?.length>0},
  ]);
  await iTest("J04 Swap monotype Agua",{config:CF.mWater,lockedTeam:[P.kyogre,P.rotomW],slotIndex:1,swapCount:2},[
    {label:"200",test:(s)=>s===200},
    {label:"tipo agua en sug",test:(_,d)=>d.suggestions?.some(s=>["water","agua"].includes(s.tipo1?.toLowerCase())||["water","agua"].includes(s.tipo2?.toLowerCase())),warn:true},
  ]);
  await iTest("J05 Swap 5 fijos 1 libre",{config:CF.vgc,lockedTeam:[P.incineroar,P.rillaboom,P.flutter,P.ironHands,P.amoonguss],slotIndex:5,swapCount:1},[
    {label:"200",test:(s)=>s===200},
    {label:"1 sugerencia",test:(_,d)=>d.suggestions?.length===1,warn:true},
  ]);
  await iTest("J06 Swap con blacklist",{config:{...CF.vgc,blacklist:["Garchomp","Landorus-T"]},lockedTeam:[P.incineroar,P.rillaboom],slotIndex:2,swapCount:2},[
    {label:"200",test:(s)=>s===200},
    {label:"sin bloqueados",test:(_,d)=>!d.suggestions?.some(s=>["garchomp","landorus-t"].includes(s.name?.toLowerCase())),warn:true},
  ]);
  await iTest("J07 Swap TrickRoom busca lento",{config:CF.tr,lockedTeam:[P.hatterene,P.reuniclus],slotIndex:2,swapCount:2},[
    {label:"200",test:(s)=>s===200},
    {label:"suggestions>0",test:(_,d)=>d.suggestions?.length>0},
  ]);
  await iTest("J08 Swap TR + líder rápido (contradicción)",{config:CF.tr,lockedTeam:[P.zacian],slotIndex:1,swapCount:3},[
    {label:"200 — no explota",test:(s)=>s===200},
    {label:"suggestions>0",test:(_,d)=>d.suggestions?.length>0},
  ]);
  await iTest("J09 swapCount=5",{config:CF.vgcB,lockedTeam:[P.incineroar],slotIndex:1,swapCount:5},[
    {label:"200",test:(s)=>s===200},
    {label:"≥3 sugerencias",test:(_,d)=>d.suggestions?.length>=3,warn:true},
  ]);
  await iTest("J10 swapCount=0 equipo completo",{config:CF.vgc,lockedTeam:[P.incineroar,P.rillaboom,P.flutter,P.ironHands,P.amoonguss,P.garchomp],slotIndex:0,swapCount:0},[
    {label:"200 o 400 gracioso",test:(s)=>s===200||s===400},
  ]);
}

// ─── SECCIÓN K: Equipos contradictorios → IA (12) ────────────────
async function secK(){
  log.section("K — Equipos contradictorios → IA: robustez (12)");
  if(!serverUp){log.warn("Sin servidor — omitiendo");return;}
  await iTest("K01 Stall puro",{config:CF.stall,lockedTeam:[],slotIndex:0},[{label:"200",test:(s)=>s===200},{label:"suggestions>0",test:(_,d)=>d.suggestions?.length>0}]);
  await iTest("K02 Hyper offense",{config:CF.ho,lockedTeam:[],slotIndex:0},[{label:"200",test:(s)=>s===200},{label:"suggestions>0",test:(_,d)=>d.suggestions?.length>0}]);
  await iTest("K03 TR + líder Zacian spe=148",{config:CF.tr,lockedTeam:[P.zacian],slotIndex:0},[
    {label:"200",test:(s)=>s===200},
    {label:"menciona trick/speed",test:(_,d)=>JSON.stringify(d).toLowerCase().includes("trick")||JSON.stringify(d).toLowerCase().includes("speed"),warn:true},
  ]);
  await iTest("K04 Monotype fuego + estrategia lluvia",{config:{...CF.mFire,customStrategy:"Equipo lluvia. Drizzle. Swift Swim. Solo agua."},lockedTeam:[],slotIndex:0},[
    {label:"200 — sobrevive",test:(s)=>s===200},
    {label:"suggestions>0",test:(_,d)=>d.suggestions?.length>0},
  ]);
  await iTest("K05 Monotype fuego blacklist masiva",{config:{...CF.mFire,blacklist:["Charizard","Arcanine","Talonflame","Cinderace","Incineroar","Blaziken","Infernape","Typhlosion","Emboar","Magmortar","Volcarona","Ho-Oh"]},lockedTeam:[],slotIndex:0},[
    {label:"200 o 500 — no cuelga",test:(s)=>s===200||s===500},
    {label:"JSON válido",test:(_,d)=>typeof d==="object"},
  ]);
  await iTest("K06 format='' vacío",{config:{...CF.vgc,format:""},lockedTeam:[],slotIndex:0},[{label:"200 o 400",test:(s)=>s===200||s===400}]);
  await iTest("K07 customStrategy 2000 chars",{config:{...CF.vgc,customStrategy:"A".repeat(1980)+" VGC Incineroar lead."},lockedTeam:[],slotIndex:0},[
    {label:"no crashea",test:(s)=>s===200||s===400||s===429||s===500},
    {label:"JSON válido",test:(_,d)=>typeof d==="object"},
  ]);
  await iTest("K08 Equipo 6 fijados 0 libres",{config:CF.vgc,lockedTeam:[P.incineroar,P.rillaboom,P.flutter,P.ironHands,P.amoonguss,P.garchomp],slotIndex:0},[{label:"200 o 400",test:(s)=>s===200||s===400}]);
  await iTest("K09 Lluvia + sol simultáneos",{config:{...CF.rain,customStrategy:"Lluvia Y sol simultáneos. Drizzle + Drought."},lockedTeam:[P.torkoal,P.politoed],slotIndex:0},[
    {label:"200",test:(s)=>s===200},
    {label:"suggestions>0",test:(_,d)=>d.suggestions?.length>0},
  ]);
  await iTest("K10 Stall en formato VGC",{config:{...CF.stall,format:"VGC"},lockedTeam:[P.blissey,P.ferrothorn,P.toxapex],slotIndex:0},[{label:"200",test:(s)=>s===200}]);
  await iTest("K11 Líder en blacklist",{config:{...CF.vgc,blacklist:["Gardevoir"]},lockedTeam:[P.gardevoir],slotIndex:0},[
    {label:"200 o 400",test:(s)=>s===200||s===400},
    {label:"JSON válido",test:(_,d)=>typeof d==="object"},
  ]);
  await iTest("K12 Monotype dragon + líder Fairy",{config:CF.mDragon,lockedTeam:[P.clefairy],slotIndex:0},[
    {label:"200 — IA intenta resolver",test:(s)=>s===200},
    {label:"JSON válido",test:(_,d)=>typeof d==="object"},
  ]);
}

// ─── SECCIÓN L: Validación profunda (8) ──────────────────────────
async function secL(){
  log.section("L — Validación profunda de respuesta IA (8)");
  if(!serverUp){log.warn("Sin servidor — omitiendo");return;}
  for(const[name,body]of[
    ["L01 VGC meta",{config:CF.vgc,lockedTeam:[],slotIndex:0}],
    ["L02 Singles Garchomp",{config:CF.singles,lockedTeam:[P.garchomp],slotIndex:0}],
    ["L03 Rain team",{config:CF.rain,lockedTeam:[],slotIndex:0}],
    ["L04 Sun team",{config:CF.sun,lockedTeam:[P.torkoal],slotIndex:0}],
    ["L05 Sand stall Tyranitar",{config:CF.sand,lockedTeam:[P.tyranitar],slotIndex:0}],
  ]){
    await iTest(name,body,[
      {label:"200",test:(s)=>s===200},
      {label:"deepV 0 errores",test:(_,d)=>deepV(d).length===0,warn:true},
      {label:"strengths>0",test:(_,d)=>Array.isArray(d.report?.strengths)&&d.report.strengths.length>0,warn:true},
      {label:"weaknesses array",test:(_,d)=>Array.isArray(d.report?.weaknesses),warn:true},
      {label:"roles en suggestions",test:(_,d)=>d.suggestions?.every(s=>s.role?.length>0),warn:true},
    ]);
  }
  await iTest("L06 Swap 3 alt — items distintos",{config:CF.vgc,lockedTeam:[P.incineroar,P.rillaboom],slotIndex:2,swapCount:3},[
    {label:"200",test:(s)=>s===200},
    {label:"3 sugs",test:(_,d)=>d.suggestions?.length===3},
    {label:"nombres únicos",test:(_,d)=>{const nm=d.suggestions?.map(s=>s.name?.toLowerCase()).filter(Boolean);return nm&&new Set(nm).size===nm.length;}},
    {label:"≥2 items distintos",test:(_,d)=>{const it=d.suggestions?.map(s=>s.build?.item?.toLowerCase()).filter(Boolean);return it&&new Set(it).size>=2;},warn:true},
  ]);
  await iTest("L07 Cobertura tipos — no 4+ iguales",{config:CF.singles,lockedTeam:[],slotIndex:0},[
    {label:"200",test:(s)=>s===200},
    {label:"no 4+ mismo tipo",test:(_,d)=>{const tc={};for(const s of d.suggestions||[])if(s.tipo1)tc[s.tipo1]=(tc[s.tipo1]||0)+1;return!Object.values(tc).some(n=>n>=4);},warn:true},
  ]);
  await iTest("L08 Reporte menciona al líder",{config:CF.vgc,lockedTeam:[P.incineroar],slotIndex:0},[
    {label:"200",test:(s)=>s===200},
    {label:"reporte menciona Incineroar",test:(_,d)=>JSON.stringify(d.report||{}).toLowerCase().includes("incineroar"),warn:true},
  ]);
}

// ─── SECCIÓN M: Regresión (6) ─────────────────────────────────────
async function secM(){
  log.section("M — Regresión: configs problemáticas (6)");
  if(!serverUp){log.warn("Sin servidor — omitiendo");return;}
  await iTest("M01 clauses=[]",{config:{...CF.vgc,clauses:[]},lockedTeam:[],slotIndex:0},[{label:"200",test:(s)=>s===200},{label:"suggestions>0",test:(_,d)=>d.suggestions?.length>0}]);
  await iTest("M02 metaPreference desconocido",{config:{...CF.vgc,metaPreference:"ultranicho"},lockedTeam:[],slotIndex:0},[{label:"200 o 400",test:(s)=>s===200||s===400}]);
  await iTest("M03 1 fijo + swapCount=5",{config:CF.vgc,lockedTeam:[P.incineroar],slotIndex:0,swapCount:5},[{label:"200",test:(s)=>s===200},{label:"≥3 sug",test:(_,d)=>d.suggestions?.length>=3,warn:true}]);
  await iTest("M04 lockedTeam=null",{config:CF.vgc,lockedTeam:null,slotIndex:0},[{label:"200 o 400",test:(s)=>s===200||s===400}]);
  await iTest("M05 slotIndex=0 equipo completo",{config:CF.vgc,lockedTeam:[P.incineroar,P.rillaboom,P.flutter,P.ironHands,P.amoonguss,P.garchomp],slotIndex:0},[{label:"200 o 400",test:(s)=>s===200||s===400}]);
  await iTest("M06 blacklist capitalización mixta",{config:{...CF.vgc,blacklist:["INCINEROAR","rillaboom","Garchomp"]},lockedTeam:[],slotIndex:0},[
    {label:"200",test:(s)=>s===200},
    {label:"sin bloqueados (case-insensitive)",test:(_,d)=>!d.suggestions?.some(s=>["incineroar","rillaboom","garchomp"].includes(s.name?.toLowerCase())),warn:true},
  ]);
}

// ─── SECCIÓN N: Rate limit ────────────────────────────────────────
async function secN(){
  log.section("N — Rate limit");
  if(!serverUp){log.warn("Sin servidor — omitiendo");return;}
  log.info("  13 requests rápidos mismo sessionId...");
  const sid=`rl_${Date.now()}`;
  const st=await Promise.all(Array.from({length:13},()=>fetch(`${BASE_URL}/api/pokemon/suggest`,{method:"POST",headers:{"Content-Type":"application/json","x-session-id":sid},body:JSON.stringify({config:CF.vgc,lockedTeam:[],slotIndex:0}),signal:AbortSignal.timeout(10000)}).then(r=>r.status).catch(()=>0)));
  ok(st.includes(429),"Rate limit — 429 al exceder",`statuses: ${[...new Set(st)].join(",")}`);
  const sid2=`rl_other_${Date.now()}`;
  const r2=await fetch(`${BASE_URL}/api/pokemon/suggest`,{method:"POST",headers:{"Content-Type":"application/json","x-session-id":sid2},body:JSON.stringify({config:CF.vgc,lockedTeam:[],slotIndex:0}),signal:AbortSignal.timeout(10000)}).then(r=>r.status).catch(()=>0);
  ok(r2!==429,"Sesión diferente no bloqueada",`status=${r2}`);
}

// ─── SECCIÓN O: Stress ───────────────────────────────────────────
async function secO(){
  log.section(`O — Stress: ${STRESS_N} requests paralelos`);
  if(!serverUp){log.warn("Sin servidor — omitiendo");return;}
  const sc=[{config:CF.vgc,lockedTeam:[],slotIndex:0},{config:CF.singles,lockedTeam:[P.garchomp],slotIndex:0},{config:CF.mFire,lockedTeam:[],slotIndex:0},{config:CF.tr,lockedTeam:[P.hatterene],slotIndex:0},{config:CF.rand,lockedTeam:[],slotIndex:0},{config:CF.rain,lockedTeam:[],slotIndex:0},{config:CF.sun,lockedTeam:[P.torkoal],slotIndex:0},{config:CF.vgcB,lockedTeam:[P.incineroar],slotIndex:0}];
  log.info(`  Lanzando ${STRESS_N} workers...`);
  const t0=performance.now();
  const res=await Promise.all(Array.from({length:STRESS_N},(_,i)=>{const s=sc[i%sc.length],id=`str${i}_${Date.now().toString(36)}`;return(async()=>{const t=performance.now();try{const r=await fetch(`${BASE_URL}/api/pokemon/suggest`,{method:"POST",headers:{"Content-Type":"application/json","x-session-id":id},body:JSON.stringify(s),signal:AbortSignal.timeout(TIMEOUT)});const ms=Math.round(performance.now()-t);M.lats.push(ms);const good=r.status===200||r.status===429;log[good?"ok":"fail"](`  Worker${i+1} — ${r.status} — ${ms}ms`);return good;}catch(e){log.fail(`  Worker${i+1} — ${e.message}`);return false;}})();}));
  const succ=res.filter(Boolean).length,tot=Math.round(performance.now()-t0);
  ok(succ>=Math.ceil(STRESS_N*0.7),`Stress — ${succ}/${STRESS_N} exitosos (≥70%)`,`total=${tot}ms`);
  log.info(`  Total stress time: ${tot}ms`);
}

// ─── REPORTE FINAL ────────────────────────────────────────────────
function report(){
  log.section("REPORTE FINAL");
  const pct=M.total>0?Math.round(M.passed/M.total*100):0;
  const l=[...M.lats].sort((a,b)=>a-b);
  const avg=l.length?Math.round(l.reduce((a,b)=>a+b,0)/l.length):null;
  const p50=l.length?l[Math.floor(l.length*0.5)]:null;
  const p90=l.length?l[Math.floor(l.length*0.9)]:null;
  const max=l.length?l[l.length-1]:null;
  console.log(`\n${C.bold}Tests:${C.reset}     ${M.passed}/${M.total} pasaron ${C.gray}(${pct}%)${C.reset}`);
  console.log(`${C.bold}Fallos:${C.reset}    ${M.failed}`);
  console.log(`${C.bold}Soft warns:${C.reset} ${M.warned}`);
  if(avg!==null){
    console.log(`\n${C.bold}Latencia API:${C.reset} Avg=${avg}ms  P50=${p50}ms  P90=${p90}ms  Max=${max}ms  N=${l.length}`);
    if(avg>60000)log.warn("Avg>60s — considera caching");
    if(max>100000)log.warn("Max>100s — hay requests que timeoutean");
    if(p90>80000)log.warn("P90>80s — 10% de requests muy lentos");
  }
  if(M.ai.length>0){
    console.log(`\n${C.bold}Resultados IA (ordenados por latencia):${C.reset}`);
    [...M.ai].sort((a,b)=>b.ms-a.ms).slice(0,25).forEach(r=>{
      const w=r.warnings.length?` ${C.yellow}⚠${r.warnings.length}${C.reset}`:"";
      const mc=r.ms>90000?C.red:r.ms>60000?C.yellow:C.gray;
      console.log(`  ${mc}${String(r.name).padEnd(50)}${String(r.ms).padStart(7)}ms  ${r.suggestions}sug${w}${C.reset}`);
    });
  }
  if(M.errors.length){
    console.log(`\n${C.bold}${C.red}Errores (${M.errors.length}):${C.reset}`);
    M.errors.forEach(e=>console.log(`  ${C.red}•${C.reset} ${e}`));
  }
  const banner=pct===100?`${C.bgGreen}${C.bold} ✓ TODOS PASARON (${M.passed}/${M.total}) ${C.reset}`:pct>=80?`${C.bgYellow}${C.bold} ⚠ MAYORÍA OK — ${M.passed}/${M.total} (${pct}%) ${C.reset}`:`${C.bgRed}${C.bold} ✗ FALLOS — ${M.passed}/${M.total} (${pct}%) ${C.reset}`;
  console.log(`\n${banner}\n`);
  process.exit(M.failed>0?1:0);
}

// ─── MAIN ─────────────────────────────────────────────────────────
(async()=>{
  console.log(`\n${C.bold}${C.blue}╔══════════════════════════════════════════════════╗\n║  POKEBUILDER PRO — MEGA TEST RUNNER v3.0.0      ║\n╚══════════════════════════════════════════════════╝${C.reset}`);
  console.log(`${C.gray}BASE_URL: ${BASE_URL} | STRESS_N: ${STRESS_N} | TIMEOUT: ${TIMEOUT}ms | DEBUG: ${DEBUG?"ON":"OFF"} | SKIP_SLOW: ${SKIP_SLOW?"ON":"OFF"}${C.reset}\n`);
  secA();secB();secC();secD();secE();secF();secG();secH();
  const u=M.total;console.log(`\n${C.bold}${C.cyan}── Unit tests: ${M.passed}/${u} pasaron ──${C.reset}`);
  log.info("\nVerificando servidor...");
  serverUp=await checkServer();
  if(serverUp){
    log.ok(`Servidor en ${BASE_URL}\n`);
    await secI();await secJ();await secK();await secL();await secM();await secN();await secO();
  }else{
    log.warn(`Sin servidor en ${BASE_URL}`);
    log.warn("Arranca 'npm run dev' para tests de integración\n");
  }
  report();
})();

