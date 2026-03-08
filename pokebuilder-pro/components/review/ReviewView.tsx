"use client";

import { useState, useMemo, useCallback } from "react";
import { useReview } from "@/hooks/useReview";
import type { TeamMember, Build } from "@/types/pokemon";
import { PokemonSprite } from "@/components/pokemon/PokemonSprite";
import { EmptyState } from "@/components/ui/EmptyState";
import { WeaknessBar } from "@/components/builder/WeaknessBar";
import { WeaknessMatrix } from "@/components/builder/WeaknessMatrix";
import { PokeballPatternDense } from "@/components/ui/PokeballBg";
import { LeaderSearch } from "@/components/builder/LeaderSearch";
import { ManualBuildModal } from "@/components/review/ManualBuildModal";
import { TypeBadge } from "@/components/ui/TypeBadge";
import { getTeamWeaknessProfile } from "@/utils/type-chart";
import { enrichTeamWithTypes } from "@/utils/fetchPokemonTypes";
import {
  ShieldCheck, Trophy, TrendingDown, Lightbulb,
  ClipboardPaste, Plus, X, Trash2, FileText,
  ChevronDown, ChevronUp, Pencil, Download, Upload, Search,
} from "lucide-react";

/* ── custom scrollbar CSS ──────────────────────────────────── */
const SCROLL_STYLE = `
  .rv-scroll::-webkit-scrollbar{width:4px;height:4px}
  .rv-scroll::-webkit-scrollbar-track{background:transparent}
  .rv-scroll::-webkit-scrollbar-thumb{background:var(--accent);border-radius:99px;opacity:.5}
  .rv-scroll::-webkit-scrollbar-thumb:hover{opacity:1}
`;

/* ── Constants ──────────────────────────────────────────── */
const FORMATS = [
  "VGC 2025 Regulation H","VGC 2024 Regulation G",
  "National Dex","National Dex Doubles",
  "OU Singles","Doubles OU","Little Cup","Ubers","Random Battle",
];

const GRADE_COLOR: Record<string, string> = {
  "A+":"var(--success)",A:"var(--success)","A-":"var(--success)",
  "B+":"var(--warning)",B:"var(--warning)","B-":"var(--warning)",
  "C+":"var(--accent)",C:"var(--accent)",
  D:"var(--danger)",F:"var(--danger)",
};

type InputMode = "search" | "paste" | "manual";

/* ── Showdown helpers ───────────────────────────────────── */
function parseShowdownPaste(paste: string): { team: TeamMember[]; builds: Record<string, Build> } {
  const team: TeamMember[] = [];
  const builds: Record<string, Build> = {};
  paste.trim().split(/\n\s*\n/).forEach((block, idx) => {
    const lines = block.trim().split("\n");
    if (!lines[0]) return;
    const atSplit = lines[0].trim().split(" @ ");
    const rawName = atSplit[0].replace(/\s*\(.*?\)\s*/g, "").trim();
    const item = atSplit[1]?.trim() ?? "";
    let ability="", nature="", teraType="";
    const moves: string[] = [];
    let evHp=0,evAtk=0,evDef=0,evSpa=0,evSpd=0,evSpe=0;
    for (let i=1; i<lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith("Ability:")) ability = line.replace("Ability:","").trim();
      else if (line.endsWith("Nature")) nature = line.replace("Nature","").trim();
      else if (line.startsWith("Tera Type:")) teraType = line.replace("Tera Type:","").trim();
      else if (line.startsWith("EVs:")) {
        line.replace("EVs:","").trim().split("/").forEach(p => {
          const m = p.trim().match(/(\d+)\s*(HP|Atk|Def|SpA|SpD|Spe)/i);
          if (!m) return;
          const v = parseInt(m[1]);
          switch(m[2].toLowerCase()) {
            case"hp":evHp=v;break; case"atk":evAtk=v;break; case"def":evDef=v;break;
            case"spa":evSpa=v;break; case"spd":evSpd=v;break; case"spe":evSpe=v;break;
          }
        });
      } else if (line.startsWith("- ")) moves.push(line.slice(2).trim());
    }
    if (!rawName) return;
    const id = Math.floor(Math.random() * 1900000) + idx + 1;
    team.push({ id, nombre:rawName, tipo1:"", tipo2:null });
    builds[String(id)] = { item, ability, nature, moves, tera_type:teraType||undefined,
      ev_hp:evHp, ev_atk:evAtk, ev_def:evDef, ev_spa:evSpa, ev_spd:evSpd, ev_spe:evSpe };
  });
  return { team, builds };
}

function buildShowdownExport(team: TeamMember[], builds: Record<string, Build>): string {
  return team.map(p => {
    const b = builds[String(p.id)];
    const lines = [`${p.nombre}${b?.item ? ` @ ${b.item}` : ""}`];
    if (b?.ability) lines.push(`Ability: ${b.ability}`);
    if (b?.tera_type) lines.push(`Tera Type: ${b.tera_type}`);
    const evParts = [
      b?.ev_hp  && `${b.ev_hp} HP`,  b?.ev_atk && `${b.ev_atk} Atk`,
      b?.ev_def && `${b.ev_def} Def`, b?.ev_spa && `${b.ev_spa} SpA`,
      b?.ev_spd && `${b.ev_spd} SpD`, b?.ev_spe && `${b.ev_spe} Spe`,
    ].filter(Boolean);
    if (evParts.length) lines.push(`EVs: ${evParts.join(" / ")}`);
    if (b?.nature) lines.push(`${b.nature} Nature`);
    b?.moves?.filter(Boolean).forEach(m => lines.push(`- ${m}`));
    return lines.join("\n");
  }).join("\n\n");
}

/* ── TeamSlotMini — FIX: no button-in-button, use div role=button ── */
function TeamSlotMini({ index, pokemon, build, selected, onSelect, onRemove, onEdit }: {
  index: number;
  pokemon: TeamMember | null;
  build?: Build;
  selected: boolean;
  onSelect: (i: number) => void;
  onRemove: (i: number) => void;
  onEdit?: (i: number) => void;
}) {
  if (!pokemon) {
    return (
      <div style={{
        borderRadius:10, border:"1.5px dashed var(--border)",
        display:"flex", alignItems:"center", justifyContent:"center",
        minHeight:90, opacity:0.4,
      }}>
        <Plus size={16} style={{color:"var(--text-muted)"}}/>
      </div>
    );
  }

  return (
    /* outer: div role=button (NOT button) to allow inner interactive elements */
    <div role="button" tabIndex={0}
      onClick={() => onSelect(index)}
      onKeyDown={e => { if (e.key==="Enter"||e.key===" ") onSelect(index); }}
      className="relative flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-150 cursor-pointer"
      style={{
        border:`1.5px solid ${selected?"var(--accent)":"var(--border)"}`,
        background:selected?"var(--accent-glow)":"var(--bg-card)",
        boxShadow:selected?"0 0 0 1px var(--accent-glow)":"none",
        minHeight:90,
      }}>
      {/* Remove — div role=button, NOT button */}
      <div role="button" tabIndex={0}
        onClick={e => { e.stopPropagation(); onRemove(index); }}
        onKeyDown={e => { if(e.key==="Enter"){e.stopPropagation();onRemove(index);} }}
        className="absolute top-1.5 right-1.5 p-1 rounded cursor-pointer"
        style={{background:"rgba(0,0,0,0.35)",color:"var(--text-muted)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:2}}>
        <X size={9}/>
      </div>
      {/* Edit pencil */}
      {onEdit && (
        <div role="button" tabIndex={0}
          onClick={e => { e.stopPropagation(); onEdit(index); }}
          onKeyDown={e => { if(e.key==="Enter"){e.stopPropagation();onEdit(index);} }}
          title="Editar build"
          className="absolute top-1.5 left-1.5 p-1 rounded cursor-pointer"
          style={{background:"var(--bg-input)",border:"1px solid var(--border)",color:"var(--accent)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:2}}>
          <Pencil size={9}/>
        </div>
      )}
      {/* Sprite — fixed size so it doesn't clip */}
      <div style={{width:48,height:48,display:"flex",alignItems:"center",justifyContent:"center",marginTop:onEdit?6:0}}>
        <PokemonSprite name={pokemon.nombre} spriteUrl={pokemon.sprite_url} size={44} animate={selected}/>
      </div>
      <span style={{fontSize:"0.65rem",fontWeight:600,color:"var(--text-primary)",textTransform:"capitalize",textAlign:"center",lineHeight:1.2,width:"100%",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",padding:"0 4px"}}>
        {pokemon.nombre}
      </span>
      {build?.item && (
        <span style={{fontSize:"0.55rem",color:"var(--text-muted)",textAlign:"center",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",width:"100%",padding:"0 4px"}}>
          @ {build.item}
        </span>
      )}
    </div>
  );
}

/* ── Context Panel ──────────────────────────────────────── */
function ContextPanel({ value, onChange }: { value:string; onChange:(v:string)=>void }) {
  const [open, setOpen] = useState(true);
  const tags = ["Sun team","Trick Room ofensivo","Stall / balance","Tailwind sweepers","Hyper offense","Weather-free"];
  return (
    <div className="glass-card" style={{overflow:"hidden"}}>
      <button onClick={()=>setOpen(o=>!o)} className="w-full flex items-center justify-between px-4 py-3"
        style={{background:"transparent",border:"none",cursor:"pointer"}}>
        <span className="flex items-center gap-2 text-sm font-semibold" style={{color:"var(--text-primary)"}}>
          <FileText size={14} style={{color:"var(--accent)"}}/> Contexto del Equipo
        </span>
        {open?<ChevronUp size={13} style={{color:"var(--text-muted)"}}/>:<ChevronDown size={13} style={{color:"var(--text-muted)"}}/>}
      </button>
      {open&&(
        <div className="flex flex-col gap-3 px-4 pb-4" style={{borderTop:"1px solid var(--border)"}}>
          <p className="text-xs pt-3 leading-relaxed" style={{color:"var(--text-muted)"}}>
            Más contexto = análisis más preciso. Describe estrategia, restricciones, formato, etc.
          </p>
          <textarea className="input" rows={3}
            placeholder="Ej: Armé este team para VGC Reg H, con Incineroar como soporte…"
            value={value} onChange={e=>onChange(e.target.value)}
            style={{fontSize:"0.8rem",lineHeight:1.7,resize:"vertical"}}/>
          <div className="flex flex-wrap gap-1.5">
            {tags.map(s=>(
              <button key={s} onClick={()=>onChange(value?`${value}, ${s.toLowerCase()}`:s)}
                className="text-xs px-2 py-1 rounded-full transition-all"
                style={{border:"1px solid var(--border)",background:"var(--bg-input)",color:"var(--text-secondary)",cursor:"pointer"}}>
                + {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Main ReviewView ────────────────────────────────────── */
export function ReviewView() {
  // useReview hook — uses ReviewResult { score, grade, weakPoints, suggestions, analysis, ... }
  const { result, loading, error, reviewTeam, reset } = useReview();

  const [team, setTeam] = useState<(TeamMember | null)[]>(Array(6).fill(null));
  const [builds, setBuilds] = useState<Record<string, Build>>({});
  const [format, setFormat] = useState("VGC 2025 Regulation H");
  const [context, setContext] = useState("");
  const [inputMode, setInputMode] = useState<InputMode>("search");
  const [paste, setPaste] = useState("");
  const [pasteError, setPasteError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [selectedPokemon, setSelectedPokemon] = useState<string | null>(null);
  const [showMatrix, setShowMatrix] = useState(false);
  const [editingSlot, setEditingSlot] = useState<number | null>(null);

  const filledTeam = team.filter(Boolean) as TeamMember[];
  const selectedMember = filledTeam.find(p => p.nombre === selectedPokemon) ?? null;
  const selectedBuild = selectedMember ? builds[String(selectedMember.id)] : undefined;
  const slotsLeft = team.filter(s => s===null).length;

  const editingPokemon = editingSlot !== null ? team[editingSlot] : null;
  const editingBuild   = editingPokemon ? builds[String(editingPokemon.id)] : undefined;

  // ── weaknessProfile: only compute when team is filled enough ──
  const weaknessProfile = useMemo(
    () => filledTeam.length > 0 ? getTeamWeaknessProfile(filledTeam) : null,
    [filledTeam]
  );

  /* ── Team mutations ── */
  const addPokemon = useCallback((p: TeamMember) => {
    setTeam(prev => {
      const i = prev.findIndex(s => s===null);
      if (i===-1) return prev;
      const n = [...prev]; n[i] = p; return n;
    });
    setBuilds(prev => ({ ...prev, [String(p.id)]: { item:"", ability:"", nature:"", moves:[] } }));
  }, []);

  const removePokemon = useCallback((idx: number) => {
    const p = team[idx];
    if (p) setBuilds(prev => { const n={...prev}; delete n[String(p.id)]; return n; });
    setTeam(prev => { const n=[...prev]; n[idx]=null; return n; });
    setSelectedPokemon(null);
  }, [team]);

  const saveBuild = useCallback((slot: number, build: Build) => {
    const p = team[slot];
    if (!p) return;
    setBuilds(prev => ({ ...prev, [String(p.id)]: build }));
  }, [team]);

  async function handleParsePaste() {
    setPasteError(null);
    if (!paste.trim()) { setPasteError("Pega un equipo primero."); return; }
    try {
      const { team: t, builds: b } = parseShowdownPaste(paste);
      if (t.length === 0) { setPasteError("No se pudo leer el equipo. Verifica el formato."); return; }
      // FIX: enricher obtiene tipo1/tipo2/sprite_url reales desde la BD
      // parseShowdownPaste deja tipo1:"" porque no tiene acceso a la BD
      const enriched = await enrichTeamWithTypes(t);
      setTeam([...enriched, ...Array(6 - enriched.length).fill(null)] as (TeamMember | null)[]);
      setBuilds(b);
      setSelectedPokemon(null);
      reset();
      setPaste("");
    } catch {
      setPasteError("Error al parsear el paste.");
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(buildShowdownExport(filledTeam, builds));
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }

  // ── reviewTeam — only passes accepted params ──
  function handleReview() {
    reviewTeam(filledTeam, builds, format);
  }

  const MODE_TABS = [
    { id:"search" as InputMode,  label:"Buscar",      icon:<Search size={13}/> },
    { id:"paste"  as InputMode,  label:"Importar",    icon:<ClipboardPaste size={13}/> },
    { id:"manual" as InputMode,  label:"Constructor", icon:<Pencil size={13}/> },
  ];

  return (
    <div className="relative w-full">
      <style>{SCROLL_STYLE}</style>
      <PokeballPatternDense/>

      <div className="relative z-[1] w-full max-w-screen-2xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 flex flex-col gap-4 sm:gap-5"
        style={{paddingBottom:96}}>

        {/* ── Header ── */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{background:"var(--accent-glow)",border:"1px solid var(--accent)"}}>
              <ShieldCheck size={18} style={{color:"var(--accent)"}}/>
            </div>
            <div>
              <h1 className="font-bold text-base sm:text-lg leading-tight" style={{color:"var(--text-primary)"}}>Team Review</h1>
              <p className="text-xs leading-snug hidden sm:block" style={{color:"var(--text-muted)"}}>Análisis IA de fortalezas, debilidades y sinergia</p>
            </div>
          </div>
          {filledTeam.length>0&&(
            <div className="flex gap-2 flex-shrink-0">
              <button className="btn-secondary text-xs flex items-center gap-1" onClick={handleCopy}>
                <Download size={12}/> <span className="hidden sm:inline">{copied?"¡Copiado!":"Exportar"}</span>
              </button>
              <button className="btn-secondary text-xs flex items-center gap-1"
                onClick={()=>{setTeam(Array(6).fill(null));setBuilds({});setSelectedPokemon(null);reset();}}>
                <Trash2 size={12}/> <span className="hidden sm:inline">Limpiar</span>
              </button>
            </div>
          )}
        </div>

        {/* ── Main grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 sm:gap-5 items-start">

          {/* ─── Left panel ─── */}
          <div className="flex flex-col gap-3 sm:gap-4">

            {/* Format */}
            <div className="glass-card p-3 sm:p-4 flex flex-col gap-2">
              <label className="text-[0.6rem] uppercase tracking-widest font-bold" style={{color:"var(--text-muted)"}}>Formato</label>
              <select className="input text-sm" value={format} onChange={e=>setFormat(e.target.value)}>
                {FORMATS.map(f=><option key={f} value={f}>{f}</option>)}
              </select>
            </div>

            {/* Mode tabs */}
            <div className="glass-card p-3 sm:p-4 flex flex-col gap-3">
              {/* Tab pills */}
              <div className="flex gap-1 p-1 rounded-xl" style={{background:"var(--bg-surface)",border:"1px solid var(--border)"}}>
                {MODE_TABS.map(({id,label,icon})=>(
                  <button key={id}
                    onClick={()=>{ setInputMode(id); setSelectedPokemon(null); }}
                    className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200"
                    style={{background:inputMode===id?"var(--accent)":"transparent",color:inputMode===id?"#fff":"var(--text-secondary)",boxShadow:inputMode===id?"0 2px 12px var(--accent-glow)":"none",cursor:"pointer",border:"none"}}>
                    {icon}<span>{label}</span>
                  </button>
                ))}
              </div>

              {/* Search */}
              {inputMode==="search"&&(
                <div className="flex flex-col gap-2 animate-fade-in">
                  <span className="text-[0.6rem] uppercase tracking-widest font-bold" style={{color:"var(--text-muted)"}}>
                    Agregar Pokémon ({filledTeam.length}/6)
                  </span>
                  <LeaderSearch selected={null} onSelect={p=>{if(slotsLeft>0)addPokemon(p);}} onClear={()=>{}}
                    placeholder={slotsLeft>0?"Buscar y agregar...":"Equipo completo"} disabled={slotsLeft===0}/>
                </div>
              )}

              {/* Paste */}
              {inputMode==="paste"&&(
                <div className="flex flex-col gap-2 animate-fade-in">
                  <span className="text-[0.6rem] uppercase tracking-widest font-bold" style={{color:"var(--text-muted)"}}>Showdown Export Paste</span>
                  <textarea className="input rv-scroll font-mono text-xs" rows={6}
                    placeholder={"Incineroar @ Assault Vest\nAbility: Intimidate\nEVs: 252 HP / 4 Atk / 252 SpD\nCareful Nature\n- Fake Out\n..."}
                    value={paste} onChange={e=>setPaste(e.target.value)}
                    style={{lineHeight:1.6,resize:"vertical"}}/>
                  {pasteError&&<p className="text-xs" style={{color:"var(--danger)"}}>{pasteError}</p>}
                  <button className="btn-primary text-xs flex items-center gap-1.5 w-fit" onClick={handleParsePaste}>
                    <Upload size={12}/> Cargar equipo
                  </button>
                </div>
              )}

              {/* Manual */}
              {inputMode==="manual"&&(
                <div className="flex flex-col gap-2 animate-fade-in">
                  <span className="text-[0.6rem] uppercase tracking-widest font-bold" style={{color:"var(--text-muted)"}}>
                    Constructor ({filledTeam.length}/6)
                  </span>
                  <p className="text-xs leading-relaxed" style={{color:"var(--text-muted)"}}>
                    Toca <Pencil size={9} style={{display:"inline",verticalAlign:"middle"}}/> en cada slot para editar su build con selectors validados.
                  </p>
                  <LeaderSearch selected={null} onSelect={p=>{if(slotsLeft>0)addPokemon(p);}} onClear={()=>{}}
                    placeholder={slotsLeft>0?"Agregar Pokémon...":"Equipo completo"} disabled={slotsLeft===0}/>
                </div>
              )}
            </div>

            {/* Team grid — 3 cols, sprites visibles */}
            <div className="grid grid-cols-3 gap-2">
              {team.map((p, i) => (
                <TeamSlotMini key={i} index={i} pokemon={p}
                  build={p ? builds[String(p.id)] : undefined}
                  selected={selectedPokemon===p?.nombre}
                  onSelect={idx => {
                    const pk = team[idx];
                    setSelectedPokemon(pk ? (selectedPokemon===pk.nombre ? null : pk.nombre) : null);
                  }}
                  onRemove={removePokemon}
                  onEdit={inputMode==="manual" ? idx=>setEditingSlot(idx) : undefined}
                />
              ))}
            </div>

            {/* Selected build summary */}
            {selectedMember&&selectedBuild&&(
              <div className="glass-card p-3 sm:p-4 flex flex-col gap-2 animate-bounce-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PokemonSprite name={selectedMember.nombre} spriteUrl={selectedMember.sprite_url} size={32}/>
                    <span className="text-xs font-bold capitalize" style={{color:"var(--text-primary)"}}>{selectedMember.nombre}</span>
                  </div>
                  {inputMode==="manual"&&(
                    <button className="btn-secondary text-xs flex items-center gap-1"
                      onClick={()=>setEditingSlot(team.findIndex(p=>p?.nombre===selectedMember.nombre))}>
                      <Pencil size={11}/> Editar
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs" style={{color:"var(--text-secondary)"}}>
                  {selectedBuild.item&&<span>🎒 {selectedBuild.item}</span>}
                  {selectedBuild.ability&&<span>⚡ {selectedBuild.ability}</span>}
                  {selectedBuild.nature&&<span>🌿 {selectedBuild.nature}</span>}
                  {(selectedBuild?.moves?.filter(Boolean).length ?? 0) > 0 && (
                    <span className="w-full">⚔️ {selectedBuild?.moves?.filter(Boolean).join(" · ")}</span>
                  )}
                </div>
              </div>
            )}

            {/* Context */}
            <ContextPanel value={context} onChange={setContext}/>

            {/* Weakness coverage */}
            {weaknessProfile&&(
              <div className="glass-card p-3 sm:p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-[0.65rem] font-semibold uppercase tracking-wider" style={{color:"var(--text-muted)"}}>
                    Cobertura Defensiva
                  </span>
                  <button onClick={()=>setShowMatrix(s=>!s)} className="text-xs flex items-center gap-1"
                    style={{color:"var(--accent)",background:"none",border:"none",cursor:"pointer"}}>
                    {showMatrix?"Ocultar":"Matriz"} {showMatrix?<ChevronUp size={11}/>:<ChevronDown size={11}/>}
                  </button>
                </div>
                {/* WeaknessBar expects profile — pass it directly */}
                {!showMatrix&&<WeaknessBar profile={weaknessProfile} onOpenMatrix={()=>setShowMatrix(true)}/>}
              </div>
            )}

            {/* Analyze CTA */}
            <button className="btn-primary w-full animate-pulse-glow"
              onClick={handleReview}
              disabled={loading||filledTeam.length<2}
              style={{fontSize:"0.9rem",padding:"13px",opacity:filledTeam.length<2?0.5:1}}>
              {loading
                ?<span className="flex items-center justify-center gap-2"><span className="loading-spinner"/> Analizando…</span>
                :<span className="flex items-center justify-center gap-2"><ShieldCheck size={16}/> Analizar Equipo</span>}
            </button>
            {filledTeam.length<2&&<p className="text-xs text-center" style={{color:"var(--text-muted)"}}>Agrega al menos 2 Pokémon</p>}
            {error&&<p className="text-xs px-3 py-2 rounded-lg" style={{background:"rgba(239,68,68,0.1)",color:"var(--danger)"}}>{error}</p>}
          </div>

          {/* ─── Right panel — results ─── */}
          <div className="flex flex-col gap-4">
            {!result&&!loading&&(
              <EmptyState icon={<ShieldCheck size={32}/>} title="Sin análisis todavía"
                description={filledTeam.length===0
                  ?"Arma tu equipo a la izquierda y presiona Analizar Equipo."
                  :`${filledTeam.length} Pokémon listos. Agrega contexto y analiza.`}/>
            )}

            {result&&(()=>{
              const gc = GRADE_COLOR[result.grade] ?? "var(--text-muted)";
              // ReviewResult uses: grade, score, analysis, weakPoints, suggestions, pokemonRatings
              const weakPoints  = result.weakPoints  ?? [];
              const suggestions = result.suggestions ?? [];
              return (
                <>
                  {/* Grade card */}
                  <div className="glass-card p-4 sm:p-5 flex items-center gap-4 sm:gap-5"
                    style={{border:`1.5px solid ${gc}33`}}>
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center font-black text-2xl flex-shrink-0"
                      style={{background:`${gc}22`,color:gc,border:`2px solid ${gc}`}}>
                      {result.grade}
                    </div>
                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                      <p className="font-bold text-sm sm:text-base" style={{color:"var(--text-primary)"}}>
                        {result.analysis ?? result.metaVerdict ?? "Análisis completado"}
                      </p>
                      <p className="text-xs" style={{color:"var(--text-muted)"}}>Score: {result.score} / 100</p>
                    </div>
                  </div>

                  {/* Weak points + Suggestions */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {/* Weak Points */}
                    <div className="glass-card p-4 flex flex-col gap-3">
                      <div className="flex items-center gap-2">
                        <TrendingDown size={14} style={{color:"var(--danger)"}}/>
                        <span className="text-xs font-bold uppercase tracking-wider" style={{color:"var(--danger)"}}>Puntos Débiles</span>
                      </div>
                      {weakPoints.length===0
                        ?<p className="text-xs" style={{color:"var(--text-muted)"}}>—</p>
                        :<ul className="flex flex-col gap-2">
                          {weakPoints.map((w: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-xs leading-relaxed" style={{color:"var(--text-secondary)"}}>
                              <span style={{color:"var(--danger)",marginTop:2,flexShrink:0}}>✗</span>{w}
                            </li>
                          ))}
                        </ul>}
                    </div>

                    {/* Suggestions */}
                    <div className="glass-card p-4 flex flex-col gap-3">
                      <div className="flex items-center gap-2">
                        <Lightbulb size={14} style={{color:"var(--warning)"}}/>
                        <span className="text-xs font-bold uppercase tracking-wider" style={{color:"var(--warning)"}}>Sugerencias</span>
                      </div>
                      {suggestions.length===0
                        ?<p className="text-xs" style={{color:"var(--text-muted)"}}>—</p>
                        :<ul className="flex flex-col gap-2">
                          {suggestions.map((s: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-xs leading-relaxed" style={{color:"var(--text-secondary)"}}>
                              <span style={{color:"var(--warning)",marginTop:2,flexShrink:0}}>→</span>{s}
                            </li>
                          ))}
                        </ul>}
                    </div>
                  </div>

                  {/* Category scores */}
                  {result.categories&&Object.keys(result.categories).length>0&&(
                    <div className="glass-card p-4 flex flex-col gap-3">
                      <span className="text-xs font-bold uppercase tracking-wider" style={{color:"var(--text-muted)"}}>
                        Categorías
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {Object.entries(result.categories).map(([key, cat]: [string, any]) => (
                          <div key={key} className="flex flex-col gap-1 p-2 rounded-xl"
                            style={{background:"var(--bg-input)",border:"1px solid var(--border)"}}>
                            <span className="text-[0.6rem] uppercase tracking-wider" style={{color:"var(--text-muted)"}}>{cat.label ?? key}</span>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{background:"var(--bg-card)"}}>
                                <div style={{width:`${cat.score}%`,height:"100%",background:"var(--accent)",borderRadius:99,transition:"width 0.6s ease"}}/>
                              </div>
                              <span className="text-xs font-bold tabular-nums" style={{color:"var(--accent)"}}>{cat.score}</span>
                            </div>
                            {cat.desc&&<p className="text-[0.58rem] leading-relaxed" style={{color:"var(--text-muted)"}}>{cat.desc}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Per-pokemon ratings */}
                  {result.pokemonRatings&&Object.keys(result.pokemonRatings).length>0&&(
                    <div className="glass-card p-4 flex flex-col gap-3">
                      <span className="text-xs font-bold uppercase tracking-wider" style={{color:"var(--text-muted)"}}>
                        Análisis por Pokémon
                      </span>
                      <div className="flex flex-col gap-2">
                        {Object.entries(result.pokemonRatings).map(([name, rating]: [string, any]) => {
                          const member = filledTeam.find(p => p.nombre.toLowerCase()===name.toLowerCase());
                          const scoreColor = rating.score>=70?"var(--success)":rating.score>=50?"var(--warning)":"var(--danger)";
                          return (
                            <div key={name} className="flex items-start gap-3 p-3 rounded-xl"
                              style={{background:"var(--bg-input)"}}>
                              {member&&(
                                <div style={{width:40,height:40,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                                  <PokemonSprite name={member.nombre} spriteUrl={member.sprite_url} size={38}/>
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-semibold text-xs capitalize truncate" style={{color:"var(--text-primary)"}}>{name}</span>
                                  <span className="font-black text-sm tabular-nums flex-shrink-0" style={{color:scoreColor}}>{rating.score}</span>
                                </div>
                                <p className="text-xs leading-relaxed mt-0.5" style={{color:"var(--text-secondary)"}}>{rating.comment}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 flex-wrap">
                    <button className="btn-secondary text-xs flex items-center gap-1.5" onClick={handleCopy}>
                      <Download size={12}/> Exportar Showdown
                    </button>
                    <button className="btn-secondary text-xs flex items-center gap-1.5" onClick={reset}>
                      <Trash2 size={12}/> Nuevo análisis
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      </div>

      {/* WeaknessMatrix modal — FIX: pass profile={weaknessProfile} not team={filledTeam} */}
      {showMatrix && weaknessProfile && (
        <WeaknessMatrix profile={weaknessProfile} onClose={()=>setShowMatrix(false)}/>
      )}

      {/* Manual Build Modal */}
      {editingSlot!==null && editingPokemon && (
        <ManualBuildModal
          pokemon={editingPokemon}
          initialBuild={editingBuild}
          onSave={build=>{ saveBuild(editingSlot, build); setEditingSlot(null); }}
          onClose={()=>setEditingSlot(null)}
        />
      )}
    </div>
  );
}