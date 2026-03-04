"use client";

import { useState, useCallback } from "react";
import { useSwap, type SwapSuggestion } from "@/hooks/useSwap";
import { useBuilder } from "@/hooks/useBuilder";
import type { TeamMember, Build } from "@/types/pokemon";
import { PokemonSprite } from "@/components/pokemon/PokemonSprite";
import { EmptyState } from "@/components/ui/EmptyState";
import { PokeballPatternDense, Pokeball } from "@/components/ui/PokeballBg";
import { LeaderSearch } from "@/components/builder/LeaderSearch";
import { ManualBuildModal } from "@/components/review/ManualBuildModal";
import {
  RefreshCw, ArrowRight, ChevronDown, ChevronUp, Swords,
  ClipboardPaste, Pencil, Plus, X, Download, Upload, Users,
} from "lucide-react";

/* ── custom scrollbar ───────────────────────────────────── */
const SCROLL_STYLE = `
  .sv-scroll::-webkit-scrollbar{width:4px;height:4px}
  .sv-scroll::-webkit-scrollbar-track{background:transparent}
  .sv-scroll::-webkit-scrollbar-thumb{background:var(--accent);border-radius:99px}
`;

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
    // Use a safe integer ID (max Postgres int4 = 2147483647)
    const id = (Math.floor(Math.random() * 2000000) + idx + 1);
    team.push({ id, nombre:rawName, tipo1:"", tipo2:null });
    builds[String(id)] = { item, ability, nature, moves, tera_type:teraType||undefined,
      ev_hp:evHp, ev_atk:evAtk, ev_def:evDef, ev_spa:evSpa, ev_spd:evSpd, ev_spe:evSpe };
  });
  return { team, builds };
}

function buildShowdownExport(team:(TeamMember|null)[], builds:Record<string,Build>): string {
  return team.filter(Boolean).map(p => {
    const b = builds[String(p!.id)];
    const lines = [`${p!.nombre}${b?.item?` @ ${b.item}`:""}`];
    if (b?.ability) lines.push(`Ability: ${b.ability}`);
    if (b?.tera_type) lines.push(`Tera Type: ${b.tera_type}`);
    const evParts = [
      b?.ev_hp&&`${b.ev_hp} HP`, b?.ev_atk&&`${b.ev_atk} Atk`, b?.ev_def&&`${b.ev_def} Def`,
      b?.ev_spa&&`${b.ev_spa} SpA`, b?.ev_spd&&`${b.ev_spd} SpD`, b?.ev_spe&&`${b.ev_spe} Spe`,
    ].filter(Boolean);
    if (evParts.length) lines.push(`EVs: ${evParts.join(" / ")}`);
    if (b?.nature) lines.push(`${b.nature} Nature`);
    b?.moves?.filter(Boolean).forEach(m=>lines.push(`- ${m}`));
    return lines.join("\n");
  }).join("\n\n");
}

/* ── Suggestion Card ────────────────────────────────────── */
function SuggestionCard({ suggestion, onAccept }: { suggestion:SwapSuggestion; onAccept:(s:SwapSuggestion)=>void }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="glass-card flex flex-col gap-3 p-4 animate-bounce-in">
      <div className="flex items-center gap-3">
        <div style={{width:60,height:60,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          <PokemonSprite name={suggestion.name} size={56} animate/>
        </div>
        <div className="flex flex-col gap-1 flex-1 min-w-0">
          <span className="font-bold capitalize text-sm truncate" style={{color:"var(--text-primary)"}}>{suggestion.name}</span>
          {suggestion.role&&<span className="badge badge-accent text-[0.6rem] self-start">{suggestion.role}</span>}
        </div>
        <button className="btn-primary py-2 px-3 text-xs flex items-center gap-1.5 flex-shrink-0" onClick={()=>onAccept(suggestion)}>
          <ArrowRight size={13}/> <span className="hidden sm:inline">Usar</span>
        </button>
      </div>

      {/* Quick info */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs px-1" style={{color:"var(--text-secondary)"}}>
        {suggestion.build.item&&<span><span style={{color:"var(--text-muted)"}}>Item: </span>{suggestion.build.item}</span>}
        {suggestion.build.ability&&<span><span style={{color:"var(--text-muted)"}}>Hab: </span>{suggestion.build.ability}</span>}
        {suggestion.build.nature&&<span><span style={{color:"var(--text-muted)"}}>Nat: </span>{suggestion.build.nature}</span>}
        {suggestion.build.teraType&&<span><span style={{color:"var(--text-muted)"}}>Tera: </span>{suggestion.build.teraType}</span>}
      </div>

      {suggestion.build.moves?.length>0&&(
        <div className="flex flex-wrap gap-1.5">
          {suggestion.build.moves.map((m,i)=><span key={`${m}-${i}`} className="badge badge-accent text-[0.6rem]">{m}</span>)}
        </div>
      )}

      {/* Expand reasoning */}
      <div role="button" tabIndex={0}
        onClick={()=>setExpanded(v=>!v)} onKeyDown={e=>{if(e.key==="Enter")setExpanded(v=>!v);}}
        className="flex items-center gap-1 text-xs cursor-pointer"
        style={{color:"var(--text-muted)"}}>
        {expanded?<ChevronUp size={12}/>:<ChevronDown size={12}/>}
        {expanded?"Ocultar razonamiento":"Ver razonamiento"}
      </div>
      {expanded&&(
        <div className="flex flex-col gap-2 animate-fade-in">
          <p className="text-xs leading-relaxed px-1" style={{color:"var(--text-secondary)"}}>{suggestion.reasoning}</p>
          {suggestion.synergies?.length>0&&(
            <div className="flex flex-wrap gap-1.5">
              {suggestion.synergies.map(s=>(
                <span key={s} className="text-xs px-2 py-0.5 rounded-full"
                  style={{background:"rgba(34,197,94,0.1)",color:"var(--success)",border:"1px solid rgba(34,197,94,0.2)"}}>
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

type ImportMode = "builder" | "paste" | "manual";

/* ── Main SwapView ──────────────────────────────────────── */
export function SwapView() {
  const { suggestions, loading, error, findReplacement, reset } = useSwap();
  const builder = useBuilder();

  const [importMode, setImportMode] = useState<ImportMode>("builder");
  const [paste, setPaste] = useState("");
  const [pasteTeam, setPasteTeam] = useState<(TeamMember|null)[]>(Array(6).fill(null));
  const [pasteBuilds, setPasteBuilds] = useState<Record<string,Build>>({});
  const [manualTeam, setManualTeam] = useState<(TeamMember|null)[]>(Array(6).fill(null));
  const [manualBuilds, setManualBuilds] = useState<Record<string,Build>>({});
  const [parseError, setParseError] = useState<string|null>(null);
  const [selectedSlot, setSelectedSlot] = useState<number|null>(null);
  const [swapFeedback, setSwapFeedback] = useState("");
  const [acceptedSlot, setAcceptedSlot] = useState<number|null>(null);
  const [copied, setCopied] = useState(false);
  const [editingSlot, setEditingSlot] = useState<number|null>(null);

  const activeTeam   = importMode==="paste" ? pasteTeam   : importMode==="manual" ? manualTeam   : builder.team;
  const activeBuilds = importMode==="paste" ? pasteBuilds : importMode==="manual" ? manualBuilds : builder.builds;
  const filledTeam   = activeTeam.filter(Boolean) as TeamMember[];
  const slotsLeft    = manualTeam.filter(s=>s===null).length;

  const editingPokemon = editingSlot!==null ? manualTeam[editingSlot] : null;
  const editingBuild   = editingPokemon ? manualBuilds[String(editingPokemon.id)] : undefined;

  const addToManual = useCallback((p:TeamMember) => {
    setManualTeam(prev=>{ const i=prev.findIndex(s=>s===null); if(i===-1)return prev; const n=[...prev]; n[i]=p; return n; });
    setManualBuilds(prev=>({...prev,[String(p.id)]:{item:"",ability:"",nature:"",moves:[]}}));
  }, []);

  const removeFromManual = useCallback((idx:number) => {
    const p=manualTeam[idx];
    if (p) setManualBuilds(prev=>{const n={...prev};delete n[String(p.id)];return n;});
    setManualTeam(prev=>{const n=[...prev];n[idx]=null;return n;});
    if (selectedSlot===idx) setSelectedSlot(null);
  }, [manualTeam, selectedSlot]);

  function handleParsePaste() {
    setParseError(null);
    if (!paste.trim()) { setParseError("Pega un equipo primero."); return; }
    try {
      const { team, builds } = parseShowdownPaste(paste);
      if (team.length===0) { setParseError("No se pudo leer el equipo."); return; }
      setPasteTeam([...team,...Array(6-team.length).fill(null)] as (TeamMember|null)[]);
      setPasteBuilds(builds); setSelectedSlot(null); reset(); setPaste("");
    } catch { setParseError("Error al parsear el paste."); }
  }

  function handleCopy() {
    navigator.clipboard.writeText(buildShowdownExport(activeTeam, activeBuilds));
    setCopied(true); setTimeout(()=>setCopied(false), 2000);
  }

  async function handleFindReplacement() {
    if (selectedSlot===null) return;
    await findReplacement(selectedSlot, activeTeam, activeBuilds, builder.config, swapFeedback);
  }

  function handleAccept(suggestion: SwapSuggestion) {
    if (selectedSlot===null) return;
    const newMember: TeamMember = {
      id: (() => { const r = parseInt(String(suggestion.id)); return r > 0 && r < 2147483647 ? r : (Math.floor(Math.random() * 999999) + 1); })(),
      nombre:suggestion.name, tipo1:"", tipo2:null,
    };
    const newBuild: Build = {
      item:suggestion.build.item, ability:suggestion.build.ability,
      nature:suggestion.build.nature, moves:suggestion.build.moves,
      tera_type:suggestion.build.teraType,
    };
    if (importMode==="paste") {
      setPasteTeam(p=>{const n=[...p];n[selectedSlot]=newMember;return n;});
      setPasteBuilds(p=>({...p,[String(newMember.id)]:newBuild}));
    } else if (importMode==="manual") {
      setManualTeam(p=>{const n=[...p];n[selectedSlot]=newMember;return n;});
      setManualBuilds(p=>({...p,[String(newMember.id)]:newBuild}));
    }
    setAcceptedSlot(selectedSlot); reset(); setTimeout(()=>setAcceptedSlot(null), 3000);
  }

  const MODE_TABS = [
    { id:"builder" as ImportMode, label:"Builder",     icon:<Users size={13}/> },
    { id:"paste"   as ImportMode, label:"Importar",    icon:<ClipboardPaste size={13}/> },
    { id:"manual"  as ImportMode, label:"Constructor", icon:<Pencil size={13}/> },
  ];

  return (
    <div className="relative w-full">
      <style>{SCROLL_STYLE}</style>
      <PokeballPatternDense/>

      <div className="relative z-[1] w-full max-w-screen-2xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 flex flex-col gap-4 sm:gap-5"
        style={{paddingBottom:96}}>

        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{background:"var(--accent-glow)",border:"1px solid var(--accent)"}}>
              <Swords size={18} style={{color:"var(--accent)"}}/>
            </div>
            <div>
              <h1 className="font-bold text-base sm:text-lg leading-tight" style={{color:"var(--text-primary)"}}>Swap de Miembro</h1>
              <p className="text-xs hidden sm:block" style={{color:"var(--text-muted)"}}>Reemplaza un Pokémon con sugerencias IA</p>
            </div>
          </div>
          {filledTeam.length>0&&(
            <button className="btn-secondary text-xs flex items-center gap-1" onClick={handleCopy}>
              <Download size={12}/><span className="hidden sm:inline">{copied?"¡Copiado!":"Exportar"}</span>
            </button>
          )}
        </div>

        {/* Mode tabs */}
        <div className="flex gap-1 p-1 rounded-xl" style={{background:"var(--bg-surface)",border:"1px solid var(--border)",maxWidth:"fit-content"}}>
          {MODE_TABS.map(({id,label,icon})=>(
            <button key={id}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200"
              style={{background:importMode===id?"var(--accent)":"transparent",color:importMode===id?"#fff":"var(--text-secondary)",boxShadow:importMode===id?"0 2px 12px var(--accent-glow)":"none",cursor:"pointer",border:"none",whiteSpace:"nowrap"}}
              onClick={()=>{ setImportMode(id); setSelectedSlot(null); reset(); }}>
              {icon}{label}
            </button>
          ))}
        </div>

        {/* Paste panel */}
        {importMode==="paste"&&(
          <div className="glass-card p-4 flex flex-col gap-3 animate-bounce-in">
            <label className="text-xs uppercase tracking-wider font-semibold" style={{color:"var(--text-muted)"}}>
              Showdown Export Paste
            </label>
            <textarea className="input sv-scroll font-mono text-xs resize-vertical" rows={7}
              placeholder={"Charizard @ Choice Specs\nAbility: Blaze\nEVs: 252 SpA / 4 SpD / 252 Spe\nTimid Nature\n- Fire Blast\n..."}
              value={paste} onChange={e=>setPaste(e.target.value)} style={{lineHeight:1.7}}/>
            {parseError&&<p className="text-xs" style={{color:"var(--danger)"}}>{parseError}</p>}
            <button className="btn-primary w-fit text-sm flex items-center gap-1.5" onClick={handleParsePaste}>
              <Upload size={13}/> Cargar equipo
            </button>
          </div>
        )}

        {/* Manual constructor */}
        {importMode==="manual"&&(
          <div className="glass-card p-4 flex flex-col gap-3 animate-bounce-in">
            <div className="flex items-center justify-between">
              <label className="text-xs uppercase tracking-wider font-semibold" style={{color:"var(--text-muted)"}}>
                Constructor Manual ({filledTeam.length}/6)
              </label>
              {filledTeam.length>0&&(
                <div role="button" tabIndex={0}
                  onClick={()=>{ setManualTeam(Array(6).fill(null)); setManualBuilds({}); setSelectedSlot(null); reset(); }}
                  onKeyDown={e=>{ if(e.key==="Enter"){ setManualTeam(Array(6).fill(null)); setManualBuilds({}); setSelectedSlot(null); reset(); }}}
                  className="text-xs cursor-pointer" style={{color:"var(--danger)"}}>
                  Limpiar
                </div>
              )}
            </div>
            <p className="text-xs" style={{color:"var(--text-muted)"}}>
              Toca <Pencil size={9} style={{display:"inline",verticalAlign:"middle"}}/> en cada slot para editar su build.
            </p>
            <LeaderSearch selected={null}
              onSelect={p=>{ if(slotsLeft>0) addToManual(p); }} onClear={()=>{}}
              placeholder={slotsLeft>0?"Agregar Pokémon...":"Equipo completo"} disabled={slotsLeft===0}/>

            {/* Mini grid — FIX: no button-in-button, use div role=button */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {manualTeam.map((p,i)=>(
                <div key={i}
                  role={p?"button":undefined} tabIndex={p?0:undefined}
                  onClick={p?()=>setSelectedSlot(selectedSlot===i?null:i):undefined}
                  onKeyDown={p?(e=>{if(e.key==="Enter"||e.key===" ")setSelectedSlot(selectedSlot===i?null:i);}):undefined}
                  className="relative flex flex-col items-center gap-1 p-2 rounded-xl transition-all"
                  style={{
                    border:`1.5px solid ${selectedSlot===i?"var(--accent)":"var(--border)"}`,
                    background:selectedSlot===i?"var(--accent-glow)":"var(--bg-input)",
                    minHeight:80, cursor:p?"pointer":"default",
                  }}>
                  {p?(
                    <>
                      {/* Remove — div role=button */}
                      <div role="button" tabIndex={0}
                        onClick={e=>{e.stopPropagation();removeFromManual(i);}}
                        onKeyDown={e=>{if(e.key==="Enter"){e.stopPropagation();removeFromManual(i);}}}
                        className="absolute top-1.5 right-1.5 p-1 rounded cursor-pointer"
                        style={{background:"rgba(0,0,0,0.35)",color:"var(--text-muted)",display:"flex",zIndex:2}}>
                        <X size={9}/>
                      </div>
                      {/* Edit — div role=button */}
                      <div role="button" tabIndex={0}
                        onClick={e=>{e.stopPropagation();setEditingSlot(i);}}
                        onKeyDown={e=>{if(e.key==="Enter"){e.stopPropagation();setEditingSlot(i);}}}
                        title="Editar build"
                        className="absolute top-1.5 left-1.5 p-1 rounded cursor-pointer"
                        style={{background:"var(--bg-input)",border:"1px solid var(--border)",color:"var(--accent)",display:"flex",zIndex:2}}>
                        <Pencil size={9}/>
                      </div>
                      <div style={{width:44,height:44,display:"flex",alignItems:"center",justifyContent:"center",marginTop:4}}>
                        <PokemonSprite name={p.nombre} size={40} animate={selectedSlot===i}/>
                      </div>
                      <span style={{fontSize:"0.6rem",fontWeight:600,textTransform:"capitalize",textAlign:"center",color:"var(--text-primary)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",width:"100%",padding:"0 2px"}}>
                        {p.nombre}
                      </span>
                      {manualBuilds[String(p.id)]?.item&&(
                        <span style={{fontSize:"0.5rem",color:"var(--text-muted)",textAlign:"center",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",width:"100%",padding:"0 2px"}}>
                          @ {manualBuilds[String(p.id)].item}
                        </span>
                      )}
                    </>
                  ):(
                    <Plus size={14} style={{color:"var(--text-muted)",margin:"auto"}}/>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Builder / Paste team strip */}
        {importMode!=="manual"&&filledTeam.length>0&&(
          <div className="glass-card p-4 flex flex-col gap-3 animate-bounce-in">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider font-semibold" style={{color:"var(--text-muted)"}}>
                Selecciona el slot a reemplazar
              </span>
              <span className="badge badge-accent text-xs">{filledTeam.length}/6</span>
            </div>
            <div className="flex gap-2 sm:gap-3 overflow-x-auto sv-scroll pb-1">
              {activeTeam.map((pokemon,i) => {
                if (!pokemon) return null;
                const build = activeBuilds[String(pokemon.id)];
                const isSel = selectedSlot===i;
                const isAcc = acceptedSlot===i;
                return (
                  <button key={i}
                    className="flex flex-col items-center gap-1.5 p-2 sm:p-3 rounded-xl transition-all duration-200 flex-shrink-0"
                    style={{
                      background:isAcc?"rgba(34,197,94,0.12)":isSel?"var(--accent-glow)":"var(--bg-input)",
                      border:`2px solid ${isAcc?"var(--success)":isSel?"var(--accent)":"var(--border)"}`,
                      minWidth:72, maxWidth:96,
                      boxShadow:isSel?"0 4px 16px var(--accent-glow)":"none",
                      cursor:"pointer",
                    }}
                    onClick={()=>{ setSelectedSlot(isSel?null:i); reset(); }}>
                    <div style={{width:48,height:48,display:"flex",alignItems:"center",justifyContent:"center"}}>
                      <PokemonSprite name={pokemon.nombre} spriteUrl={pokemon.sprite_url} size={44} animate={isSel}/>
                    </div>
                    <span className="text-xs font-bold capitalize truncate w-full text-center" style={{color:"var(--text-primary)",fontSize:"0.62rem"}}>{pokemon.nombre}</span>
                    {build?.item&&<span className="truncate w-full text-center" style={{color:"var(--text-muted)",fontSize:"0.55rem"}}>@ {build.item}</span>}
                    {isAcc&&<span className="text-xs font-bold" style={{color:"var(--success)",fontSize:"0.6rem"}}>✓ Ok</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty states */}
        {filledTeam.length===0&&(
          importMode==="builder"
            ?<EmptyState icon={<RefreshCw size={32}/>} title="Sin equipo en el Builder" description="Ve al Team Builder, genera un equipo y vuelve aquí."/>
            :importMode==="paste"
            ?<EmptyState icon={<ClipboardPaste size={32}/>} title="Sin equipo cargado" description="Pega tu equipo en formato Showdown y presiona Cargar equipo."/>
            :<EmptyState icon={<Pencil size={32}/>} title="Equipo vacío" description="Usa el constructor de arriba para agregar tus Pokémon."/>
        )}

        {/* Swap config */}
        {selectedSlot!==null&&activeTeam[selectedSlot]&&(
          <div className="glass-card p-4 flex flex-col gap-3 animate-bounce-in">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs uppercase tracking-wider font-semibold" style={{color:"var(--text-muted)"}}>Reemplazando a</span>
              <span className="font-bold capitalize text-sm" style={{color:"var(--accent)"}}>{activeTeam[selectedSlot]!.nombre}</span>
            </div>
            <input type="text" className="input text-sm"
              placeholder="Describe qué quieres mejorar… ej: necesito más velocidad o cobertura para Heatran"
              value={swapFeedback} onChange={e=>setSwapFeedback(e.target.value)}
              onKeyDown={e=>{ if(e.key==="Enter") handleFindReplacement(); }}/>
            <button className="btn-primary w-full animate-pulse-glow flex items-center justify-center gap-2"
              onClick={handleFindReplacement} disabled={loading}
              style={{fontSize:"0.9rem",padding:"12px"}}>
              {loading
                ?<><Pokeball size={16} className="animate-rotate-pokeball"/> Buscando reemplazos…</>
                :<><Swords size={16}/> Buscar reemplazo para {activeTeam[selectedSlot]!.nombre}</>}
            </button>
          </div>
        )}

        {error&&(
          <div className="rounded-xl px-4 py-3 text-sm"
            style={{background:"rgba(239,68,68,0.1)",color:"var(--danger)",border:"1px solid rgba(239,68,68,0.25)"}}>
            {error}
          </div>
        )}

        {/* Skeleton */}
        {loading&&(
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({length:3}).map((_,i)=><div key={i} className="skeleton rounded-xl" style={{height:180}}/>)}
          </div>
        )}

        {/* Suggestions */}
        {suggestions.length>0&&!loading&&(
          <div className="flex flex-col gap-4 animate-slide-up">
            <div className="flex items-center justify-between">
              <h2 className="text-xs uppercase tracking-wider font-semibold" style={{color:"var(--text-muted)"}}>
                {suggestions.length} sugerencia{suggestions.length!==1?"s":""}
              </h2>
              <button className="btn-ghost text-xs flex items-center gap-1.5" onClick={()=>{reset();handleFindReplacement();}} disabled={loading}>
                <RefreshCw size={12}/> Regenerar
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 stagger-children">
              {suggestions.map(sug=><SuggestionCard key={String(sug.id)} suggestion={sug} onAccept={handleAccept}/>)}
            </div>
          </div>
        )}
      </div>

      {/* Manual Build Modal */}
      {editingSlot!==null && editingPokemon && (
        <ManualBuildModal
          pokemon={editingPokemon}
          initialBuild={editingBuild}
          onSave={build=>{ setManualBuilds(p=>({...p,[String(editingPokemon.id)]:build})); setEditingSlot(null); }}
          onClose={()=>setEditingSlot(null)}
        />
      )}
    </div>
  );
}