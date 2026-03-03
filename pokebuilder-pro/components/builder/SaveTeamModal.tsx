"use client";

import { useState } from "react";

interface SaveTeamModalProps {
  onSave: (nombre: string, descripcion: string, isPublic: boolean) => Promise<void>;
  onClose: () => void;
  saving: boolean;
}

export function SaveTeamModal({ onSave, onClose, saving }: SaveTeamModalProps) {
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    if (!nombre.trim()) {
      setError("El nombre del equipo es obligatorio.");
      return;
    }
    setError("");
    await onSave(nombre.trim(), descripcion.trim(), isPublic);
  }

  return (
    <div className="overlay" onClick={onClose} role="dialog" aria-modal aria-label="Guardar equipo">
      <div
        className="card w-full max-w-md animate-fade-in-scale"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between p-4"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <h2 className="font-bold" style={{ color: "var(--text-primary)", fontSize: "1rem" }}>
            Guardar Equipo
          </h2>
          <button className="btn-ghost" style={{ padding: "4px 8px" }} onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-4 p-4">
          <div className="flex flex-col gap-1.5">
            <label
              className="text-xs uppercase tracking-wider font-semibold"
              style={{ color: "var(--text-muted)" }}
              htmlFor="team-name"
            >
              Nombre *
            </label>
            <input
              id="team-name"
              className="input"
              placeholder="Mi equipo VGC..."
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              maxLength={60}
              autoFocus
            />
            {error && (
              <span className="text-xs" style={{ color: "var(--danger)" }}>
                {error}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              className="text-xs uppercase tracking-wider font-semibold"
              style={{ color: "var(--text-muted)" }}
              htmlFor="team-desc"
            >
              Descripción
            </label>
            <textarea
              id="team-desc"
              className="input"
              placeholder="Descripción opcional..."
              rows={2}
              style={{ resize: "none", fontFamily: "inherit" }}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              maxLength={280}
            />
          </div>

          <label
            className="flex items-center gap-3 cursor-pointer"
            htmlFor="team-public"
          >
            <div
              className="relative"
              style={{ width: 36, height: 20, flexShrink: 0 }}
            >
              <input
                type="checkbox"
                id="team-public"
                className="sr-only"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
              />
              <div
                className="rounded-full transition-colors duration-200"
                style={{
                  width: 36,
                  height: 20,
                  background: isPublic ? "var(--accent)" : "var(--border)",
                }}
              />
              <div
                className="absolute top-1 rounded-full transition-transform duration-200"
                style={{
                  width: 12,
                  height: 12,
                  background: "#fff",
                  left: 4,
                  transform: isPublic ? "translateX(16px)" : "none",
                }}
              />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                Equipo Público
              </span>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                Visible en la galería de equipos populares
              </span>
            </div>
          </label>

          <div className="flex gap-2 pt-1">
            <button className="btn-secondary flex-1" onClick={onClose}>
              Cancelar
            </button>
            <button
              className="btn-primary flex-1"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
