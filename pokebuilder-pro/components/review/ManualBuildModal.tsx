"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import type { TeamMember, Build } from "@/types/pokemon";
import { PokemonSprite } from "@/components/pokemon/PokemonSprite";
import { TypeBadge } from "@/components/ui/TypeBadge";
import { X, Search, Check, Loader2, Zap, Shield, Sword } from "lucide-react";

/* ─── Types ─────────────────────────────────────────────── */
interface MoveData {
  nombre: string;
  tipo: string | null;
  potencia: number | null;
  precision: number | null;
  categoria: string | null;
}

/* ─── Static data ────────────────────────────────────────── */
const NATURES = [
  { name:"Hardy",   up:null,    down:null  },
  { name:"Lonely",  up:"atk",   down:"def" },
  { name:"Brave",   up:"atk",   down:"spe" },
  { name:"Adamant", up:"atk",   down:"spa" },
  { name:"Naughty", up:"atk",   down:"spd" },
  { name:"Bold",    up:"def",   down:"atk" },
  { name:"Docile",  up:null,    down:null  },
  { name:"Relaxed", up:"def",   down:"spe" },
  { name:"Impish",  up:"def",   down:"spa" },
  { name:"Lax",     up:"def",   down:"spd" },
  { name:"Timid",   up:"spe",   down:"atk" },
  { name:"Hasty",   up:"spe",   down:"def" },
  { name:"Serious", up:null,    down:null  },
  { name:"Jolly",   up:"spe",   down:"spa" },
  { name:"Naive",   up:"spe",   down:"spd" },
  { name:"Modest",  up:"spa",   down:"atk" },
  { name:"Mild",    up:"spa",   down:"def" },
  { name:"Quiet",   up:"spa",   down:"spe" },
  { name:"Bashful", up:null,    down:null  },
  { name:"Rash",    up:"spa",   down:"spd" },
  { name:"Calm",    up:"spd",   down:"atk" },
  { name:"Gentle",  up:"spd",   down:"def" },
  { name:"Sassy",   up:"spd",   down:"spe" },
  { name:"Careful", up:"spd",   down:"spa" },
  { name:"Quirky",  up:null,    down:null  },
];

const TERA_TYPES = [
  "Normal","Fire","Water","Grass","Electric","Ice","Fighting","Poison",
  "Ground","Flying","Psychic","Bug","Rock","Ghost","Dragon","Dark","Steel","Fairy","Stellar",
];

const TYPE_COLORS: Record<string,string> = {
  Normal:"#9ca3af",Fire:"#f97316",Water:"#3b82f6",Grass:"#22c55e",
  Electric:"#eab308",Ice:"#67e8f9",Fighting:"#b45309",Poison:"#a855f7",
  Ground:"#d97706",Flying:"#818cf8",Psychic:"#ec4899",Bug:"#84cc16",
  Rock:"#78716c",Ghost:"#6d28d9",Dragon:"#6366f1",Dark:"#525252",
  Steel:"#94a3b8",Fairy:"#f9a8d4",
};

const CAT_ICON:Record<string,string> = { physical:"⚔️", special:"✨", status:"💤" };

const EV_LABELS = ["HP","Atk","Def","SpA","SpD","Spe"] as const;
const EV_KEYS   = ["ev_hp","ev_atk","ev_def","ev_spa","ev_spd","ev_spe"] as const;
type EvKey = typeof EV_KEYS[number];

const STAT_COLORS = ["#ef4444","#f97316","#eab308","#3b82f6","#8b5cf6","#22c55e"];

const COMMON_ITEMS = [
  "Choice Band","Choice Specs","Choice Scarf","Life Orb","Focus Sash","Assault Vest",
  "Leftovers","Rocky Helmet","Eviolite","Lum Berry","Sitrus Berry","Figy Berry",
  "Mental Herb","Power Herb","White Herb","Booster Energy","Clear Amulet","Mirror Herb",
  "Covert Cloak","Safety Goggles","Wide Lens","Zoom Lens","Scope Lens","King's Rock",
  "Black Glasses","Charcoal","Mystic Water","Never-Melt Ice","Miracle Seed","Soft Sand",
  "Magnet","Twisted Spoon","Silk Scarf","Sharp Beak","Poison Barb","Spell Tag",
  "Metal Coat","Fairy Feather","Dragon Fang","Expert Belt","Muscle Band","Wise Glasses",
  "Air Balloon","Red Card","Shed Shell","Heavy-Duty Boots","Throat Spray","Loaded Dice",
];

const EV_PRESETS = [
  { label:"Físico Ofensivo",    evs:{ ev_hp:4,  ev_atk:252, ev_def:0,   ev_spa:0,   ev_spd:0,   ev_spe:252 } },
  { label:"Especial Ofensivo",  evs:{ ev_hp:4,  ev_atk:0,   ev_def:0,   ev_spa:252, ev_spd:0,   ev_spe:252 } },
  { label:"Bulky Físico",       evs:{ ev_hp:252, ev_atk:4,  ev_def:252, ev_spa:0,   ev_spd:0,   ev_spe:0  } },
  { label:"Bulky Especial",     evs:{ ev_hp:252, ev_atk:0,  ev_def:0,   ev_spa:4,   ev_spd:252, ev_spe:0  } },
  { label:"Trick Room",         evs:{ ev_hp:252, ev_atk:252, ev_def:4,  ev_spa:0,   ev_spd:0,   ev_spe:0  } },
  { label:"Max Bulk",           evs:{ ev_hp:252, ev_atk:0,  ev_def:128, ev_spa:0,   ev_spd:128, ev_spe:0  } },
];

/* ─── Hex EV Chart ───────────────────────────────────────── */
function HexChart({ evs }: { evs: Record<EvKey,number> }) {
  const size=110; const cx=size/2; const cy=size/2; const r=size*0.40;
  const angles=[0,60,120,180,240,300].map(a=>((a-90)*Math.PI)/180);
  const pt=(a:number,radius:number)=>({ x:cx+radius*Math.cos(a), y:cy+radius*Math.sin(a) });
  const rings=[0.25,0.5,0.75,1];
  const hexPts=(s:number)=>angles.map(a=>pt(a,r*s)).map(({x,y})=>`${x},${y}`).join(" ");
  const evVals=EV_KEYS.map(k=>evs[k]??0);
  const evPts=angles.map((a,i)=>pt(a,r*Math.max(0.04,evVals[i]/252))).map(({x,y})=>`${x},${y}`).join(" ");
  const total=evVals.reduce((a,b)=>a+b,0);
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {rings.map((s,ri)=><polygon key={ri} points={hexPts(s)} fill="none" stroke="var(--border)" strokeWidth={ri===rings.length-1?1.2:0.6} strokeOpacity={0.5}/>)}
        {angles.map((a,i)=>{const e=pt(a,r);return <line key={i} x1={cx} y1={cy} x2={e.x} y2={e.y} stroke="var(--border)" strokeWidth={0.6} strokeOpacity={0.4}/>;}) }
        <polygon points={evPts} fill="var(--accent)" fillOpacity={0.22} stroke="var(--accent)" strokeWidth={1.5} strokeLinejoin="round"/>
        {angles.map((a,i)=>{const p=pt(a,r*Math.max(0.04,evVals[i]/252));return <circle key={i} cx={p.x} cy={p.y} r={2.8} fill={STAT_COLORS[i]} stroke="var(--bg-card)" strokeWidth={1}/>;}) }
        {angles.map((a,i)=>{const p=pt(a,r*1.22);return <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle" fontSize={7.5} fontWeight={600} fill={evVals[i]>0?STAT_COLORS[i]:"var(--text-muted)"}>{EV_LABELS[i]}</text>;}) }
      </svg>
      <span className="text-xs tabular-nums" style={{color:total>508?"var(--danger)":"var(--accent)"}}>
        {total}<span style={{color:"var(--text-muted)"}}>/508</span>
      </span>
    </div>
  );
}

/* ─── EV Row with slider ─────────────────────────────────── */
function EvRow({ label,value,color,onChange }:{ label:string;value:number;color:string;onChange:(v:number)=>void }) {
  const pct=Math.round((value/252)*100);
  return (
    <div className="flex items-center gap-2">
      <span className="text-[0.6rem] font-bold uppercase w-7 flex-shrink-0" style={{color}}>{label}</span>
      <div className="flex-1 relative h-5 flex items-center">
        <input type="range" min={0} max={252} step={4} value={value}
          onChange={e=>onChange(Number(e.target.value))}
          className="custom-range w-full"
          style={{"--range-color":color,"--range-pct":`${pct}%`} as React.CSSProperties}
        />
      </div>
      <span className="text-xs tabular-nums w-8 text-right font-mono" style={{color:value>0?color:"var(--text-muted)"}}>{value}</span>
    </div>
  );
}

/* ─── Move Card ──────────────────────────────────────────── */
function MoveCard({ move,selected,onSelect }:{ move:MoveData;selected:boolean;onSelect:()=>void }) {
  const typeKey = move.tipo ? move.tipo.charAt(0).toUpperCase()+move.tipo.slice(1) : "";
  const typeColor = TYPE_COLORS[typeKey] ?? "#6b7280";
  return (
    <div role="button" tabIndex={0} onClick={onSelect} onKeyDown={e=>{if(e.key==="Enter"||e.key===" ")onSelect();}}
      className="flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all duration-150 cursor-pointer w-full"
      style={{ background:selected?`${typeColor}22`:"var(--bg-input)", border:`1.5px solid ${selected?typeColor:"var(--border)"}` }}>
      <div style={{width:3,height:28,borderRadius:99,background:typeColor,flexShrink:0}}/>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold truncate" style={{color:"var(--text-primary)"}}>{move.nombre}</span>
          <span className="text-[0.6rem]">{CAT_ICON[move.categoria??"status"]??"💤"}</span>
        </div>
        <div className="flex gap-2 mt-0.5">
          <span className="text-[0.6rem]" style={{color:typeColor}}>{typeKey||"—"}</span>
          {move.potencia&&<span className="text-[0.6rem]" style={{color:"var(--text-muted)"}}>💥 {move.potencia}</span>}
          {move.precision&&<span className="text-[0.6rem]" style={{color:"var(--text-muted)"}}>🎯 {move.precision}%</span>}
        </div>
      </div>
      {selected&&<Check size={13} style={{color:typeColor,flexShrink:0}}/>}
    </div>
  );
}

/* ─── Main Modal ─────────────────────────────────────────── */
type Tab = "moveset"|"item"|"ability"|"nature"|"tera"|"evs";

export interface ManualBuildModalProps {
  pokemon: TeamMember;
  initialBuild?: Partial<Build>;
  onSave: (build:Build)=>void;
  onClose: ()=>void;
}

export function ManualBuildModal({ pokemon,initialBuild,onSave,onClose }:ManualBuildModalProps) {
  const [tab,setTab]   = useState<Tab>("moveset");
  const [moves,setMoves] = useState<MoveData[]>([]);
  const [abilities,setAbilities] = useState<string[]>([]);
  const [loading,setLoading] = useState(true);

  const [selectedMoves,setSelectedMoves] = useState<(string|null)[]>(
    ()=>Array(4).fill(null).map((_,i)=>initialBuild?.moves?.[i]??null)
  );
  const [item,setItem]       = useState(initialBuild?.item??"");
  const [ability,setAbility] = useState(initialBuild?.ability??"");
  const [nature,setNature]   = useState(initialBuild?.nature??"");
  const [teraType,setTera]   = useState(initialBuild?.tera_type??"");
  const [evs,setEvs]         = useState<Record<EvKey,number>>({
    ev_hp:initialBuild?.ev_hp??0, ev_atk:initialBuild?.ev_atk??0,
    ev_def:initialBuild?.ev_def??0, ev_spa:initialBuild?.ev_spa??0,
    ev_spd:initialBuild?.ev_spd??0, ev_spe:initialBuild?.ev_spe??0,
  });

  const [moveSearch,setMoveSearch] = useState("");
  const [itemSearch,setItemSearch] = useState("");
  const [activeSlot,setActiveSlot] = useState<number|null>(null);

  useEffect(()=>{
    setLoading(true);
    fetch(`/api/pokemon/moves?name=${encodeURIComponent(pokemon.nombre.toLowerCase())}`)
      .then(r=>r.json()).then(d=>{setMoves(d.moves??[]);setAbilities(d.abilities??[]);})
      .catch(()=>{setMoves([]);setAbilities([]);}).finally(()=>setLoading(false));
  },[pokemon.nombre]);

  const evTotal = Object.values(evs).reduce((a,b)=>a+b,0);
  const filteredMoves = moves.filter(m=>m.nombre.toLowerCase().includes(moveSearch.toLowerCase()));
  const filteredItems = COMMON_ITEMS.filter(it=>it.toLowerCase().includes(itemSearch.toLowerCase()));

  function handleSave(){
    onSave({ item,ability,nature,tera_type:teraType||undefined,
      moves:selectedMoves.filter(Boolean) as string[],
      ev_hp:evs.ev_hp,ev_atk:evs.ev_atk,ev_def:evs.ev_def,
      ev_spa:evs.ev_spa,ev_spd:evs.ev_spd,ev_spe:evs.ev_spe });
    onClose();
  }

  const TABS = [
    { id:"moveset" as Tab, label:"Moveset",    shortLabel:"MV", icon:<Sword size={13}/>,   badge:selectedMoves.filter(Boolean).length>0?String(selectedMoves.filter(Boolean).length):undefined },
    { id:"item"    as Tab, label:"Ítem",       shortLabel:"IT", icon:"🎒",                  badge:item?"✓":undefined },
    { id:"ability" as Tab, label:"Habilidad",  shortLabel:"HA", icon:<Zap size={13}/>,      badge:ability?"✓":undefined },
    { id:"nature"  as Tab, label:"Naturaleza", shortLabel:"NA", icon:"🌿",                  badge:nature?"✓":undefined },
    { id:"tera"    as Tab, label:"Tera",       shortLabel:"TR", icon:"🔷",                  badge:teraType?"✓":undefined },
    { id:"evs"     as Tab, label:"EVs",        shortLabel:"EV", icon:<Shield size={13}/>,   badge:evTotal>0?String(evTotal):undefined },
  ];

  const modal = (
    <>
      {/* custom scrollbar styles */}
      <style>{`
        .modal-scroll::-webkit-scrollbar{width:4px;height:4px}
        .modal-scroll::-webkit-scrollbar-track{background:transparent}
        .modal-scroll::-webkit-scrollbar-thumb{background:var(--accent);border-radius:99px;opacity:.6}
        .modal-scroll::-webkit-scrollbar-thumb:hover{opacity:1}
        .custom-range{-webkit-appearance:none;appearance:none;height:4px;border-radius:99px;background:linear-gradient(to right,var(--range-color) var(--range-pct),var(--bg-input) var(--range-pct));outline:none;cursor:pointer}
        .custom-range::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;border-radius:50%;background:var(--range-color);border:2px solid var(--bg-card);box-shadow:0 0 6px var(--range-color)66}
        .custom-range::-moz-range-thumb{width:14px;height:14px;border-radius:50%;background:var(--range-color);border:2px solid var(--bg-card);box-shadow:0 0 6px var(--range-color)66}
      `}</style>

      <div className="fixed inset-0 flex items-end sm:items-center justify-center z-[9999] p-0 sm:p-4"
        style={{background:"rgba(0,0,0,0.78)",backdropFilter:"blur(6px)"}}
        onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
        <div className="w-full sm:max-w-2xl lg:max-w-3xl flex flex-col rounded-t-2xl sm:rounded-2xl overflow-hidden animate-bounce-in"
          style={{background:"var(--bg-card)",border:"1px solid var(--border)",boxShadow:"0 24px 80px rgba(0,0,0,0.75)",
            maxHeight:"92dvh",minHeight:"60dvh"}}>

          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
            style={{borderBottom:"1px solid var(--border)",background:"var(--bg-surface)"}}>
            <PokemonSprite name={pokemon.nombre} spriteUrl={pokemon.sprite_url} size={44} animate/>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-sm sm:text-base capitalize" style={{color:"var(--text-primary)"}}>{pokemon.nombre}</h2>
              <div className="flex gap-1.5 mt-0.5">
                {pokemon.tipo1&&<TypeBadge type={pokemon.tipo1} size="sm"/>}
                {pokemon.tipo2&&<TypeBadge type={pokemon.tipo2} size="sm"/>}
              </div>
            </div>
            {/* Build summary pills */}
            <div className="hidden sm:flex gap-1 flex-wrap justify-end max-w-[160px]">
              {item&&<span className="text-[0.55rem] px-1.5 py-0.5 rounded-full truncate max-w-[80px]" style={{background:"var(--bg-input)",color:"var(--text-secondary)",border:"1px solid var(--border)"}}>🎒 {item}</span>}
              {ability&&<span className="text-[0.55rem] px-1.5 py-0.5 rounded-full truncate max-w-[80px]" style={{background:"var(--bg-input)",color:"var(--text-secondary)",border:"1px solid var(--border)"}}>{ability}</span>}
            </div>
            <div role="button" tabIndex={0} onClick={onClose} onKeyDown={e=>{if(e.key==="Enter")onClose();}}
              className="p-1.5 rounded-lg flex-shrink-0 cursor-pointer"
              style={{background:"var(--bg-input)",border:"1px solid var(--border)"}}>
              <X size={16} style={{color:"var(--text-muted)"}}/>
            </div>
          </div>

          {/* TABS — scrollable on mobile, proper size */}
          <div className="flex-shrink-0 overflow-x-auto" style={{background:"var(--bg-surface)",borderBottom:"1px solid var(--border)"}}>
            <div className="flex gap-1 p-2 min-w-max">
              {TABS.map(({id,label,shortLabel,icon,badge})=>(
                <button key={id} onClick={()=>setTab(id)}
                  className="relative flex items-center justify-center gap-1 rounded-lg font-semibold transition-all duration-150 flex-shrink-0"
                  style={{
                    padding:"8px 14px",
                    minWidth:48,
                    fontSize:"0.8rem",
                    background:tab===id?"var(--accent)":"var(--bg-input)",
                    color:tab===id?"#fff":"var(--text-secondary)",
                    border:`1px solid ${tab===id?"var(--accent)":"var(--border)"}`,
                    cursor:"pointer",
                    whiteSpace:"nowrap",
                  }}>
                  <span className="hidden sm:flex items-center gap-1">{icon}<span>{label}</span></span>
                  <span className="flex sm:hidden items-center gap-1">{icon}<span>{shortLabel}</span></span>
                  {badge&&(
                    <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-0.5 rounded-full flex items-center justify-center text-[0.5rem] font-black"
                      style={{background:tab===id?"rgba(255,255,255,0.3)":"var(--accent)",color:"#fff"}}>
                      {badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto modal-scroll p-4 flex flex-col gap-3">
            {loading&&(
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 size={28} className="animate-spin" style={{color:"var(--accent)"}}/>
                <span className="text-sm" style={{color:"var(--text-muted)"}}>Cargando datos de {pokemon.nombre}…</span>
              </div>
            )}

            {!loading&&(
              <>
                {/* ── MOVESET ── */}
                {tab==="moveset"&&(
                  <div className="flex flex-col gap-3">
                    {/* Active slots — div not button wrapper */}
                    <div className="grid grid-cols-2 gap-2">
                      {[0,1,2,3].map(slot=>{
                        const moveName=selectedMoves[slot];
                        const md=moves.find(m=>m.nombre===moveName);
                        const typeKey=md?.tipo?md.tipo.charAt(0).toUpperCase()+md.tipo.slice(1):"";
                        const tc=TYPE_COLORS[typeKey]??"var(--border)";
                        return (
                          <div key={slot} role="button" tabIndex={0}
                            onClick={()=>setActiveSlot(activeSlot===slot?null:slot)}
                            onKeyDown={e=>{if(e.key==="Enter"||e.key===" ")setActiveSlot(activeSlot===slot?null:slot);}}
                            className="flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all"
                            style={{background:moveName?`${tc}18`:"var(--bg-input)",border:`2px solid ${activeSlot===slot?"var(--accent)":moveName?tc:"var(--border)"}`}}>
                            <div style={{width:3,height:24,borderRadius:99,background:moveName?tc:"var(--border)",flexShrink:0}}/>
                            <div className="flex-1 min-w-0">
                              {moveName?(
                                <>
                                  <p className="text-xs font-semibold truncate" style={{color:"var(--text-primary)"}}>{moveName}</p>
                                  <p className="text-[0.6rem]" style={{color:tc}}>{typeKey}{md?.potencia?` · 💥${md.potencia}`:""}</p>
                                </>
                              ):(
                                <p className="text-xs" style={{color:"var(--text-muted)"}}>Movimiento {slot+1}</p>
                              )}
                            </div>
                            {moveName&&(
                              <div role="button" tabIndex={0}
                                onClick={e=>{e.stopPropagation();setSelectedMoves(p=>{const n=[...p];n[slot]=null;return n;});}}
                                onKeyDown={e=>{if(e.key==="Enter"){e.stopPropagation();setSelectedMoves(p=>{const n=[...p];n[slot]=null;return n;});}}}
                                className="cursor-pointer p-0.5" style={{color:"var(--text-muted)"}}>
                                <X size={10}/>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {activeSlot!==null&&(
                      <div className="flex flex-col gap-2 animate-fade-in">
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg"
                          style={{background:"var(--bg-input)",border:"1px solid var(--border)"}}>
                          <Search size={13} style={{color:"var(--text-muted)",flexShrink:0}}/>
                          <input autoFocus className="flex-1 bg-transparent text-sm outline-none"
                            style={{color:"var(--text-primary)"}}
                            placeholder={`Slot ${activeSlot+1}: buscar movimiento…`}
                            value={moveSearch} onChange={e=>setMoveSearch(e.target.value)}/>
                          {moveSearch&&<div role="button" tabIndex={0} onClick={()=>setMoveSearch("")} className="cursor-pointer"><X size={11} style={{color:"var(--text-muted)"}}/></div>}
                        </div>
                        <p className="text-[0.6rem] px-1" style={{color:"var(--text-muted)"}}>
                          {filteredMoves.length} movimientos · {pokemon.nombre}
                        </p>
                        <div className="flex flex-col gap-1 max-h-52 overflow-y-auto modal-scroll">
                          {filteredMoves.map(m=>(
                            <MoveCard key={m.nombre} move={m} selected={selectedMoves[activeSlot]===m.nombre}
                              onSelect={()=>{setSelectedMoves(p=>{const n=[...p];n[activeSlot]=m.nombre;return n;});setMoveSearch("");}}/>
                          ))}
                          {filteredMoves.length===0&&<p className="text-xs text-center py-6" style={{color:"var(--text-muted)"}}>Sin resultados</p>}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ── ÍTEM ── */}
                {tab==="item"&&(
                  <div className="flex flex-col gap-3">
                    {item&&(
                      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                        style={{background:"var(--accent-glow)",border:"1.5px solid var(--accent)"}}>
                        <span className="text-base">🎒</span>
                        <span className="flex-1 font-semibold text-sm" style={{color:"var(--text-primary)"}}>{item}</span>
                        <div role="button" tabIndex={0} onClick={()=>setItem("")} className="cursor-pointer"><X size={13} style={{color:"var(--text-muted)"}}/></div>
                      </div>
                    )}
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg"
                      style={{background:"var(--bg-input)",border:"1px solid var(--border)"}}>
                      <Search size={13} style={{color:"var(--text-muted)"}}/>
                      <input autoFocus className="flex-1 bg-transparent text-sm outline-none"
                        style={{color:"var(--text-primary)"}} placeholder="Buscar ítem…"
                        value={itemSearch} onChange={e=>setItemSearch(e.target.value)}/>
                    </div>
                    <div className="flex flex-col gap-1.5 max-h-[52vh] overflow-y-auto modal-scroll">
                      {filteredItems.map(it=>(
                        <div key={it} role="button" tabIndex={0}
                          onClick={()=>{setItem(it);setItemSearch("");}}
                          onKeyDown={e=>{if(e.key==="Enter"){setItem(it);setItemSearch("");}}}
                          className="flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-all"
                          style={{background:item===it?"var(--accent-glow)":"var(--bg-input)",border:`1.5px solid ${item===it?"var(--accent)":"var(--border)"}`}}>
                          <span className="text-base flex-shrink-0">🎒</span>
                          <span className="text-sm flex-1" style={{color:item===it?"var(--accent-light)":"var(--text-primary)"}}>{it}</span>
                          {item===it&&<Check size={14} style={{color:"var(--accent)"}}/>}
                        </div>
                      ))}
                      {filteredItems.length===0&&<p className="text-xs text-center py-6" style={{color:"var(--text-muted)"}}>Sin resultados</p>}
                    </div>
                  </div>
                )}

                {/* ── HABILIDAD ── */}
                {tab==="ability"&&(
                  <div className="flex flex-col gap-2">
                    <p className="text-xs px-1 pb-1" style={{color:"var(--text-muted)"}}>
                      Habilidades verificadas para <strong className="capitalize">{pokemon.nombre}</strong>:
                    </p>
                    {abilities.length===0&&<p className="text-xs text-center py-8" style={{color:"var(--text-muted)"}}>Sin datos</p>}
                    <div className="flex flex-col gap-2">
                      {abilities.map(ab=>(
                        <div key={ab} role="button" tabIndex={0}
                          onClick={()=>setAbility(ab)} onKeyDown={e=>{if(e.key==="Enter")setAbility(ab);}}
                          className="flex items-center gap-3 px-4 py-3.5 rounded-xl cursor-pointer transition-all"
                          style={{background:ability===ab?"var(--accent-glow)":"var(--bg-input)",border:`2px solid ${ability===ab?"var(--accent)":"var(--border)"}`}}>
                          <Zap size={16} style={{color:ability===ab?"var(--accent)":"var(--text-muted)",flexShrink:0}}/>
                          <span className="font-semibold text-sm flex-1" style={{color:ability===ab?"var(--accent-light)":"var(--text-primary)"}}>{ab}</span>
                          {ability===ab&&<Check size={15} style={{color:"var(--accent)"}}/>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── NATURALEZA ── */}
                {tab==="nature"&&(
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-col gap-2 max-h-[58vh] overflow-y-auto modal-scroll pr-1">
                      {NATURES.map(nat=>{
                        const isSel=nature===nat.name;
                        return (
                          <div key={nat.name} role="button" tabIndex={0}
                            onClick={()=>setNature(nat.name)} onKeyDown={e=>{if(e.key==="Enter")setNature(nat.name);}}
                            className="flex items-center gap-3 px-4 py-3.5 rounded-xl cursor-pointer transition-all"
                            style={{background:isSel?"var(--accent-glow)":"var(--bg-input)",border:`1.5px solid ${isSel?"var(--accent)":"var(--border)"}`}}>
                            <span className="font-bold text-sm w-20 flex-shrink-0" style={{color:isSel?"var(--accent-light)":"var(--text-primary)"}}>{nat.name}</span>
                            <div className="flex gap-2 flex-1 flex-wrap">
                              {!nat.up?(
                                <span className="text-xs px-2 py-0.5 rounded-full" style={{background:"var(--bg-card)",color:"var(--text-muted)"}}>Sin modificadores</span>
                              ):(
                                <>
                                  <span className="text-xs px-2.5 py-0.5 rounded-full font-bold" style={{background:"rgba(34,197,94,0.15)",color:"var(--success)"}}>+{nat.up.toUpperCase()}</span>
                                  <span className="text-xs px-2.5 py-0.5 rounded-full font-bold" style={{background:"rgba(239,68,68,0.15)",color:"var(--danger)"}}>-{nat.down!.toUpperCase()}</span>
                                </>
                              )}
                            </div>
                            {isSel&&<Check size={14} style={{color:"var(--accent)",flexShrink:0}}/>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── TERA ── */}
                {tab==="tera"&&(
                  <div className="flex flex-col gap-3">
                    <p className="text-xs" style={{color:"var(--text-muted)"}}>Opcional — cambia el tipo al terastalizar.</p>
                    {teraType&&<div role="button" tabIndex={0} onClick={()=>setTera("")} onKeyDown={e=>{if(e.key==="Enter")setTera("");}} className="text-xs flex items-center gap-1 cursor-pointer w-fit" style={{color:"var(--text-muted)"}}><X size={11}/> Quitar Tera</div>}
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {TERA_TYPES.map(t=>{
                        const color=TYPE_COLORS[t]??"#6b7280";
                        const isSel=teraType===t;
                        return (
                          <div key={t} role="button" tabIndex={0}
                            onClick={()=>setTera(t)} onKeyDown={e=>{if(e.key==="Enter")setTera(t);}}
                            className="flex flex-col items-center gap-1.5 py-3 rounded-xl cursor-pointer transition-all"
                            style={{background:isSel?`${color}22`:"var(--bg-input)",border:`2px solid ${isSel?color:"var(--border)"}`,boxShadow:isSel?`0 0 12px ${color}44`:"none"}}>
                            <div className="w-3 h-3 rounded-full" style={{background:color}}/>
                            <span className="text-[0.65rem] font-semibold" style={{color:isSel?color:"var(--text-secondary)"}}>{t}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── EVs ── */}
                {tab==="evs"&&(
                  <div className="flex flex-col gap-4">
                    <div className="flex gap-4 items-start flex-col sm:flex-row">
                      <div className="flex-shrink-0 mx-auto sm:mx-0"><HexChart evs={evs}/></div>
                      <div className="flex-1 flex flex-col gap-3 w-full">
                        {EV_KEYS.map((k,i)=>(
                          <EvRow key={k} label={EV_LABELS[i]} value={evs[k]} color={STAT_COLORS[i]}
                            onChange={v=>{const tot=Object.values({...evs,[k]:v}).reduce((a,b)=>a+b,0);if(tot<=508)setEvs(p=>({...p,[k]:v}));}}/>
                        ))}
                        <div role="button" tabIndex={0} onClick={()=>setEvs({ev_hp:0,ev_atk:0,ev_def:0,ev_spa:0,ev_spd:0,ev_spe:0})}
                          onKeyDown={e=>{if(e.key==="Enter")setEvs({ev_hp:0,ev_atk:0,ev_def:0,ev_spa:0,ev_spd:0,ev_spe:0});}}
                          className="text-xs cursor-pointer w-fit" style={{color:"var(--text-muted)"}}>↺ Resetear</div>
                      </div>
                    </div>
                    {evTotal>508&&<p className="text-xs px-3 py-2 rounded-lg" style={{background:"rgba(239,68,68,0.1)",color:"var(--danger)"}}>⚠ Superas 508 EVs totales</p>}
                    <div className="flex flex-col gap-2">
                      <span className="text-[0.6rem] uppercase tracking-wider font-bold" style={{color:"var(--text-muted)"}}>Spreads rápidos</span>
                      <div className="flex flex-wrap gap-1.5">
                        {EV_PRESETS.map(({label,evs:p})=>(
                          <div key={label} role="button" tabIndex={0}
                            onClick={()=>setEvs(p as Record<EvKey,number>)}
                            onKeyDown={e=>{if(e.key==="Enter")setEvs(p as Record<EvKey,number>);}}
                            className="text-xs px-2.5 py-1 rounded-full cursor-pointer transition-all"
                            style={{border:"1px solid var(--border)",background:"var(--bg-input)",color:"var(--text-secondary)"}}>
                            {label}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-3 flex-shrink-0"
            style={{borderTop:"1px solid var(--border)",background:"var(--bg-surface)"}}>
            <div className="flex gap-1.5 flex-wrap max-w-[55%]">
              {item&&<span className="text-[0.58rem] px-1.5 py-0.5 rounded-full truncate max-w-[90px]" style={{background:"var(--bg-input)",color:"var(--text-secondary)",border:"1px solid var(--border)"}}>🎒 {item}</span>}
              {ability&&<span className="text-[0.58rem] px-1.5 py-0.5 rounded-full truncate max-w-[90px]" style={{background:"var(--bg-input)",color:"var(--text-secondary)",border:"1px solid var(--border)"}}>{ability}</span>}
              {nature&&<span className="text-[0.58rem] px-1.5 py-0.5 rounded-full" style={{background:"var(--bg-input)",color:"var(--text-secondary)",border:"1px solid var(--border)"}}>{nature}</span>}
            </div>
            <button className="btn-primary text-sm flex items-center gap-1.5 flex-shrink-0" onClick={handleSave}>
              <Check size={14}/> Guardar Build
            </button>
          </div>
        </div>
      </div>
    </>
  );

  if (typeof document==="undefined") return null;
  return createPortal(modal, document.body);
}