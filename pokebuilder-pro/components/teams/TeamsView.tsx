"use client";

import { useState } from "react";
import { useTeams } from "@/hooks/useTeams";
import { useAuth } from "@/providers/AuthProvider";
import type { SavedTeam } from "@/types/pokemon";
import { PokemonSprite } from "@/components/pokemon/PokemonSprite";
import { TypeBadge } from "@/components/ui/TypeBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { PokeballPattern } from "@/components/ui/PokeballBg";
import {
  Bookmark, Trash2, Copy, Globe, Lock, ChevronDown, ChevronUp, Wand2,
  Calendar, Layers, ClipboardPaste, Check, X,
} from "lucide-react";
import Link from "next/link";

/* ── Showdown exporter ─────────────────────────────────── */
function buildShowdownExport(savedTeam: SavedTeam): string {
  const lines: string[] = [];
  savedTeam.team.forEach((p) => {
    if (!p) return;
    const b = savedTeam.builds[String(p.id)];
    lines.push(`${p.nombre}${b?.item ? ` @ ${b.item}` : ""}`);
    if (b?.ability) lines.push(`Ability: ${b.ability}`);
    if (b?.tera_type) lines.push(`Tera Type: ${b.tera_type}`);
    const evParts = [
      b?.ev_hp  && `${b.ev_hp} HP`,
      b?.ev_atk && `${b.ev_atk} Atk`,
      b?.ev_def && `${b.ev_def} Def`,
      b?.ev_spa && `${b.ev_spa} SpA`,
      b?.ev_spd && `${b.ev_spd} SpD`,
      b?.ev_spe && `${b.ev_spe} Spe`,
    ].filter(Boolean);
    if (evParts.length) lines.push(`EVs: ${evParts.join(" / ")}`);
    if (b?.nature) lines.push(`${b.nature} Nature`);
    b?.moves?.filter(Boolean).forEach((m) => lines.push(`- ${m}`));
    lines.push("");
  });
  return lines.join("\n");
}

/* ── Showdown importer ─────────────────────────────────── */
function parseShowdownPaste(paste: string) {
  const team: any[] = [];
  const builds: Record<string, any> = {};
  const blocks = paste.trim().split(/\n\s*\n/);

  blocks.forEach((block, idx) => {
    const lines = block.trim().split("\n");
    if (!lines[0]) return;
    const firstLine = lines[0].trim();
    const atSplit = firstLine.split(" @ ");
    const rawName = atSplit[0].replace(/\s*\(.*?\)\s*/g, "").trim();
    const item = atSplit[1]?.trim() ?? "";

    if (!rawName) return;

    let ability = "", nature = "", teraType = "";
    const moves: string[] = [];
    let evHp = 0, evAtk = 0, evDef = 0, evSpa = 0, evSpd = 0, evSpe = 0;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith("Ability:")) ability = line.replace("Ability:", "").trim();
      else if (line.endsWith("Nature")) nature = line.replace("Nature", "").trim();
      else if (line.startsWith("Tera Type:")) teraType = line.replace("Tera Type:", "").trim();
      else if (line.startsWith("EVs:")) {
        line.replace("EVs:", "").trim().split("/").forEach((p) => {
          const m = p.trim().match(/(\d+)\s*(HP|Atk|Def|SpA|SpD|Spe)/i);
          if (!m) return;
          const val = parseInt(m[1]);
          switch (m[2].toLowerCase()) {
            case "hp": evHp = val; break; case "atk": evAtk = val; break;
            case "def": evDef = val; break; case "spa": evSpa = val; break;
            case "spd": evSpd = val; break; case "spe": evSpe = val; break;
          }
        });
      } else if (line.startsWith("- ")) moves.push(line.replace("- ", "").trim());
    }

    const id = Math.floor(Math.random() * 1900000) + idx + 1;
    team.push({ id, nombre: rawName, tipo1: "", tipo2: null });
    builds[String(id)] = { item, ability, nature, moves, tera_type: teraType || undefined, ev_hp: evHp, ev_atk: evAtk, ev_def: evDef, ev_spa: evSpa, ev_spd: evSpd, ev_spe: evSpe };
  });

  return { team, builds };
}

/* ── Import Modal ──────────────────────────────────────── */
function ImportModal({ onClose, onImport }: { onClose: () => void; onImport: (name: string, paste: string) => void }) {
  const [paste, setPaste] = useState("");
  const [nombre, setNombre] = useState("");
  const [error, setError] = useState("");

  function handleImport() {
    if (!nombre.trim()) { setError("Ponle un nombre al equipo."); return; }
    if (!paste.trim()) { setError("Pega tu equipo en formato Showdown."); return; }
    const { team } = parseShowdownPaste(paste);
    if (team.length === 0) { setError("No se pudo leer el equipo. Verifica el formato Showdown."); return; }
    onImport(nombre.trim(), paste);
  }

  return (
    <div className="overlay fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}>
      <div className="w-full sm:max-w-lg flex flex-col rounded-t-2xl sm:rounded-2xl overflow-hidden"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", maxHeight: "90dvh" }}>
        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2">
            <ClipboardPaste size={18} style={{ color: "var(--accent)" }} />
            <h2 className="font-bold text-base" style={{ color: "var(--text-primary)" }}>Importar desde Showdown</h2>
          </div>
          <button onClick={onClose} className="btn-ghost p-2"><X size={16} /></button>
        </div>

        <div className="flex flex-col gap-4 p-5 overflow-y-auto">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              Nombre del equipo
            </label>
            <input
              className="input"
              placeholder="Ej: Bug Hyper Offense"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              Showdown Export Paste
            </label>
            <textarea
              className="input font-mono"
              rows={10}
              placeholder={"Ribombee @ Focus Sash\nAbility: Shield Dust\nEVs: 4 HP / 252 SpA / 252 Spe\nTimid Nature\n- Quiver Dance\n- Bug Buzz\n- Moonblast\n- Protect\n\n..."}
              value={paste}
              onChange={(e) => setPaste(e.target.value)}
              style={{ fontSize: "0.72rem", lineHeight: 1.7, resize: "vertical", minHeight: 200 }}
            />
          </div>

          {error && <p className="text-xs" style={{ color: "var(--danger)" }}>{error}</p>}
        </div>

        <div className="flex gap-3 px-5 py-4" style={{ borderTop: "1px solid var(--border)" }}>
          <button className="btn-secondary flex-1" onClick={onClose}>Cancelar</button>
          <button className="btn-primary flex-1 flex items-center justify-center gap-2" onClick={handleImport}>
            <ClipboardPaste size={14} /> Importar equipo
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Team Card ─────────────────────────────────────────── */
function TeamCard({ team, onDelete, isDeleting }: { team: SavedTeam; onDelete: (id: string) => void; isDeleting: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const filledMembers = team.team.filter(Boolean);

  function handleCopyShowdown() {
    navigator.clipboard.writeText(buildShowdownExport(team));
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }

  function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); setTimeout(() => setConfirmDelete(false), 3500); return; }
    onDelete(team.id);
  }

  return (
    <div className="glass-card flex flex-col overflow-hidden animate-bounce-in"
      style={{ borderColor: expanded ? "var(--accent)" : undefined, transition: "all 0.25s" }}>
      {/* Header */}
      <div className="flex items-center gap-3 p-4 cursor-pointer transition-colors"
        onClick={() => setExpanded((v) => !v)} role="button" tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && setExpanded((v) => !v)}
        style={{ background: expanded ? "var(--accent-glow)" : undefined }}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
              {team.nombre}
            </span>
            <span className="badge badge-accent text-xs" style={{ fontSize: "0.6rem" }}>
              {team.formato ?? "National Dex"}
            </span>
            {team.isPublic
              ? <Globe size={11} style={{ color: "var(--text-muted)" }} />
              : <Lock size={11} style={{ color: "var(--text-muted)" }} />}
          </div>
          {team.descripcion && (
            <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>
              {team.descripcion}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            {filledMembers.length}/6
          </span>
          {expanded ? <ChevronUp size={14} style={{ color: "var(--text-muted)" }} /> : <ChevronDown size={14} style={{ color: "var(--text-muted)" }} />}
        </div>
      </div>

      {/* Sprite strip — always visible */}
      <div className="flex gap-2 px-4 pb-3 overflow-x-auto">
        {filledMembers.map((p, i) => (
          <div key={i} className="flex flex-col items-center gap-1 flex-shrink-0">
            <PokemonSprite name={p!.nombre} spriteUrl={p!.sprite_url} nationalDex={p!.national_dex} size={44} />
            <span className="text-[0.55rem] capitalize text-center" style={{ color: "var(--text-muted)", maxWidth: 52 }}>
              {p!.nombre}
            </span>
          </div>
        ))}
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="flex flex-col gap-3 px-4 pb-4 animate-fade-in"
          style={{ borderTop: "1px solid var(--border)" }}>
          {/* Build details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-3">
            {filledMembers.map((p, i) => {
              const b = team.builds[String(p!.id)];
              return (
                <div key={i} className="flex flex-col gap-1 p-2 rounded-lg"
                  style={{ background: "var(--bg-input)", border: "1px solid var(--border)" }}>
                  <span className="text-xs font-bold capitalize" style={{ color: "var(--text-primary)" }}>{p!.nombre}</span>
                  {b?.item && <span className="text-xs" style={{ color: "var(--text-muted)" }}>@ {b.item}</span>}
                  {b?.ability && <span className="text-xs" style={{ color: "var(--text-secondary)" }}>Habilidad: {b.ability}</span>}
                  {b?.nature && <span className="text-xs" style={{ color: "var(--text-secondary)" }}>Natura: {b.nature}</span>}
                  {b?.moves?.filter(Boolean).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {b.moves.filter(Boolean).map((m, mi) => (
                        <span key={mi} className="badge badge-accent" style={{ fontSize: "0.55rem" }}>{m}</span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Meta info */}
          <div className="flex items-center gap-3 text-xs" style={{ color: "var(--text-muted)" }}>
            <span className="flex items-center gap-1"><Calendar size={11} /> {team.createdAt ? new Date(team.createdAt).toLocaleDateString("es") : "—"}</span>
            <span className="flex items-center gap-1"><Layers size={11} /> {filledMembers.length} Pokémon</span>
          </div>

          {/* Actions */}
          <div className="flex gap-2 flex-wrap">
            <button className="btn-ghost text-xs flex items-center gap-1.5" onClick={handleCopyShowdown}>
              {copied ? <><Check size={12} />¡Copiado!</> : <><Copy size={12} />Copiar Showdown</>}
            </button>
            <button
              className="btn-ghost text-xs flex items-center gap-1.5"
              onClick={handleDelete} disabled={isDeleting}
              style={{ color: confirmDelete ? "var(--danger)" : "var(--text-muted)" }}>
              <Trash2 size={13} />
              {confirmDelete ? "Confirmar eliminar" : "Eliminar"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Main TeamsView ────────────────────────────────────── */
export function TeamsView() {
  const { teams, total, isLoading, error, deleting, deleteTeam, saveTeam, saving } = useTeams();
  const { user, loading: authLoading } = useAuth();
  const [showImport, setShowImport] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);

  async function handleImport(nombre: string, paste: string) {
    const { team, builds } = parseShowdownPaste(paste);
    if (team.length === 0) return;
    try {
      await saveTeam({ nombre, descripcion: "Importado desde Showdown", team, builds, config: {}, isPublic: false } as any);
      setShowImport(false);
      setImportSuccess(true);
      setTimeout(() => setImportSuccess(false), 3000);
    } catch (e) {
      console.error(e);
    }
  }

  if (authLoading || isLoading) {
    return (
      <div className="relative w-full min-h-screen">
        <PokeballPattern />
        <div className="relative z-[1] w-full max-w-5xl mx-auto px-4 py-8 flex flex-col gap-4">
          <div className="skeleton rounded-xl" style={{ height: 40, width: 220 }} />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton rounded-xl" style={{ height: 90 }} />
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="relative w-full min-h-screen">
        <PokeballPattern />
        <div className="relative z-[1] w-full max-w-4xl mx-auto px-4 py-8">
          <EmptyState
            icon={<Bookmark size={32} />}
            title="Inicia sesion para ver tus equipos"
            description="Guarda y gestiona tus equipos competitivos desde cualquier dispositivo."
            action={<Link href="/login" className="btn-primary text-sm flex items-center gap-2">Ingresar</Link>}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full min-h-screen">
      <PokeballPattern />
      <div className="relative z-[1] w-full max-w-5xl mx-auto px-4 py-8 flex flex-col gap-6">

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: "var(--accent-glow)", border: "1px solid var(--accent)" }}>
                <Bookmark size={20} style={{ color: "var(--accent)" }} />
              </div>
              <h1 className="font-bold text-balance"
                style={{ color: "var(--text-primary)", fontSize: "clamp(1.35rem,3vw,1.75rem)" }}>
                Mis Equipos
              </h1>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
              {total > 0 ? `${total} equipo${total !== 1 ? "s" : ""} guardado${total !== 1 ? "s" : ""}` : "Aún no tienes equipos guardados"}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 flex-wrap">
            {importSuccess && (
              <span className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg animate-bounce-in"
                style={{ background: "rgba(34,197,94,0.12)", color: "var(--success)", border: "1px solid rgba(34,197,94,0.25)" }}>
                <Check size={12} /> ¡Equipo importado!
              </span>
            )}
            <button
              className="btn-secondary flex items-center gap-1.5 text-sm"
              onClick={() => setShowImport(true)}
              disabled={saving}>
              <ClipboardPaste size={15} />
              Importar Showdown
            </button>
            <Link href="/builder" className="btn-primary flex items-center gap-1.5 text-sm">
              <Wand2 size={15} /> Nuevo equipo
            </Link>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-xl px-4 py-3 text-sm"
            style={{ background: "rgba(239,68,68,0.1)", color: "var(--danger)", border: "1px solid rgba(239,68,68,0.25)" }}>
            Error al cargar equipos. Intenta recargar la página.
          </div>
        )}

        {/* Teams list */}
        {teams.length === 0 ? (
          <EmptyState
            icon={<Bookmark size={32} />}
            title="Aún no tienes equipos guardados"
            description="Crea un equipo en el Builder con IA o importa uno desde Showdown."
            action={
              <div className="flex gap-3">
                <button className="btn-secondary flex items-center gap-1.5 text-sm" onClick={() => setShowImport(true)}>
                  <ClipboardPaste size={14} /> Importar
                </button>
                <Link href="/builder" className="btn-primary flex items-center gap-1.5 text-sm">
                  <Wand2 size={14} /> Crear con IA
                </Link>
              </div>
            }
          />
        ) : (
          <div className="flex flex-col gap-3 stagger-children">
            {teams.map((team) => (
              <TeamCard
                key={team.id}
                team={team}
                onDelete={deleteTeam}
                isDeleting={deleting === team.id}
              />
            ))}
          </div>
        )}
      </div>

      {showImport && (
        <ImportModal onClose={() => setShowImport(false)} onImport={handleImport} />
      )}
    </div>
  );
}