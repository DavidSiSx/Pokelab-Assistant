"use client";

import { useState } from "react";
import { useTeams } from "@/hooks/useTeams";
import { useAuth } from "@/providers/AuthProvider";
import type { SavedTeam } from "@/types/pokemon";
import { PokemonSprite } from "@/components/pokemon/PokemonSprite";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  Bookmark, Trash2, Copy, Globe, Lock, ChevronDown, ChevronUp, Wand2,
} from "lucide-react";
import Link from "next/link";

// ── Showdown exporter ─────────────────────────────────────────────────────
function buildShowdownExport(savedTeam: SavedTeam): string {
  const lines: string[] = [];
  savedTeam.team.forEach((p) => {
    if (!p) return;
    const b = savedTeam.builds[String(p.id)];
    lines.push(`${p.nombre}${b?.item ? ` @ ${b.item}` : ""}`);
    if (b?.ability) lines.push(`Ability: ${b.ability}`);
    if (b?.tera_type) lines.push(`Tera Type: ${b.tera_type}`);
    const evParts = [];
    if (b?.ev_hp)  evParts.push(`${b.ev_hp} HP`);
    if (b?.ev_atk) evParts.push(`${b.ev_atk} Atk`);
    if (b?.ev_def) evParts.push(`${b.ev_def} Def`);
    if (b?.ev_spa) evParts.push(`${b.ev_spa} SpA`);
    if (b?.ev_spd) evParts.push(`${b.ev_spd} SpD`);
    if (b?.ev_spe) evParts.push(`${b.ev_spe} Spe`);
    if (evParts.length) lines.push(`EVs: ${evParts.join(" / ")}`);
    if (b?.nature) lines.push(`${b.nature} Nature`);
    b?.moves?.filter(Boolean).forEach((m) => lines.push(`- ${m}`));
    lines.push("");
  });
  return lines.join("\n");
}

// ── Single team card ──────────────────────────────────────────────────────
function TeamCard({
  team,
  onDelete,
  isDeleting,
}: {
  team: SavedTeam;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const filledMembers = team.team.filter(Boolean);

  function handleCopyShowdown() {
    navigator.clipboard.writeText(buildShowdownExport(team));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3500);
      return;
    }
    onDelete(team.id);
  }

  return (
    <div
      className="card flex flex-col gap-0 overflow-hidden animate-fade-in"
      style={{ borderColor: expanded ? "var(--accent)" : "var(--border)", transition: "border-color 0.2s" }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 p-4 cursor-pointer"
        onClick={() => setExpanded((v) => !v)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && setExpanded((v) => !v)}
      >
        {/* Sprites row */}
        <div className="flex gap-1 flex-shrink-0">
          {filledMembers.slice(0, 6).map((p, i) => (
            <PokemonSprite key={i} name={p!.nombre} size={32} />
          ))}
          {Array.from({ length: Math.max(0, 6 - filledMembers.length) }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="rounded-full"
              style={{
                width: 32, height: 32,
                background: "var(--bg-input)",
                border: "1px dashed var(--border)",
              }}
            />
          ))}
        </div>

        {/* Info */}
        <div className="flex flex-col gap-0.5 flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className="font-bold text-sm truncate"
              style={{ color: "var(--text-primary)" }}
            >
              {team.nombre}
            </span>
            {team.isPublic ? (
              <Globe size={11} style={{ color: "var(--success)", flexShrink: 0 }} aria-label="Público" />
            ) : (
              <Lock size={11} style={{ color: "var(--text-muted)", flexShrink: 0 }} aria-label="Privado" />
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-xs"
              style={{ color: "var(--text-muted)" }}
            >
              {team.formato}
            </span>
            <span className="badge badge-accent" style={{ fontSize: "0.6rem" }}>
              {filledMembers.length} Pokémon
            </span>
          </div>
          {team.descripcion && (
            <p
              className="text-xs truncate mt-0.5"
              style={{ color: "var(--text-secondary)" }}
            >
              {team.descripcion}
            </p>
          )}
        </div>

        {/* Expand arrow */}
        <span style={{ color: "var(--text-muted)", flexShrink: 0 }}>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div
          className="flex flex-col gap-4 px-4 pb-4 animate-fade-in"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          {/* Members detail */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-3">
            {filledMembers.map((p, i) => {
              const b = team.builds[String(p!.id)];
              return (
                <div
                  key={i}
                  className="flex flex-col gap-1 p-2 rounded-xl"
                  style={{ background: "var(--bg-input)", border: "1px solid var(--border)" }}
                >
                  <div className="flex items-center gap-2">
                    <PokemonSprite name={p!.nombre} size={36} />
                    <span
                      className="text-xs font-semibold capitalize truncate"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {p!.nombre}
                    </span>
                  </div>
                  {b?.item && (
                    <span className="text-xs" style={{ color: "var(--text-muted)", fontSize: "0.65rem" }}>
                      @ {b.item}
                    </span>
                  )}
                  {b?.moves?.filter(Boolean).length > 0 && (
                    <div className="flex flex-col gap-0.5">
                      {b.moves.filter(Boolean).slice(0, 4).map((m) => (
                        <span
                          key={m}
                          className="text-xs"
                          style={{ color: "var(--text-secondary)", fontSize: "0.62rem" }}
                        >
                          — {m}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* AI report snippet */}
          {team.aiReport?.estrategia && (
            <div
              className="rounded-xl p-3 text-xs leading-relaxed"
              style={{
                background: "var(--accent-glow)",
                border: "1px solid var(--accent)",
                color: "var(--text-secondary)",
              }}
            >
              <span className="font-semibold block mb-1" style={{ color: "var(--accent)" }}>
                Estrategia IA
              </span>
              {team.aiReport.estrategia}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <button
              className="btn-secondary text-xs flex items-center gap-1.5"
              onClick={handleCopyShowdown}
            >
              <Copy size={13} />
              {copied ? "Copiado!" : "Copiar Showdown"}
            </button>
            <button
              className="btn-ghost text-xs flex items-center gap-1.5"
              onClick={handleDelete}
              disabled={isDeleting}
              style={{ color: confirmDelete ? "var(--danger)" : "var(--text-muted)" }}
            >
              <Trash2 size={13} />
              {confirmDelete ? "Confirmar eliminar" : "Eliminar"}
            </button>
          </div>

          {/* Date */}
          <span
            className="text-xs"
            style={{ color: "var(--text-muted)", marginTop: -8 }}
          >
            Guardado el {new Date(team.createdAt).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}
          </span>
        </div>
      )}
    </div>
  );
}

// ── Main TeamsView ────────────────────────────────────────────────────────
export function TeamsView() {
  const { teams, total, isLoading, error, deleting, deleteTeam } = useTeams();
  const { user, loading: authLoading } = useAuth();

  if (authLoading || isLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-6 flex flex-col gap-4">
        <div className="skeleton rounded-xl" style={{ height: 40, width: 200 }} />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="skeleton rounded-xl" style={{ height: 80 }} />
        ))}
      </div>
    );
  }

  if (!user) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-6">
        <EmptyState
          icon={<Bookmark size={32} />}
          title="Inicia sesión para ver tus equipos"
          description="Guarda y gestiona tus equipos competitivos desde cualquier dispositivo."
          action={
            <Link href="/login" className="btn-primary text-sm flex items-center gap-2">
              Ingresar
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1
            className="font-bold text-balance"
            style={{ color: "var(--text-primary)", fontSize: "clamp(1.25rem,3vw,1.75rem)" }}
          >
            Mis Equipos
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
            {total > 0 ? `${total} equipo${total !== 1 ? "s" : ""} guardado${total !== 1 ? "s" : ""}` : "Sin equipos guardados todavía"}
          </p>
        </div>
        <Link href="/builder" className="btn-primary text-sm flex items-center gap-2">
          <Wand2 size={14} />
          Crear equipo
        </Link>
      </div>

      {error && (
        <div
          className="rounded-xl px-4 py-3 text-sm"
          style={{
            background: "rgba(239,68,68,0.1)",
            color: "var(--danger)",
            border: "1px solid rgba(239,68,68,0.25)",
          }}
          role="alert"
        >
          Error al cargar equipos. Intenta de nuevo.
        </div>
      )}

      {/* Teams list */}
      {teams.length > 0 ? (
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
      ) : (
        !error && (
          <EmptyState
            icon={<Bookmark size={32} />}
            title="Sin equipos guardados"
            description="Genera un equipo en el Builder, luego guárdalo aquí para tenerlo siempre disponible."
            action={
              <Link href="/builder" className="btn-primary text-sm flex items-center gap-2">
                <Wand2 size={14} />
                Ir al Builder
              </Link>
            }
          />
        )
      )}
    </div>
  );
}
