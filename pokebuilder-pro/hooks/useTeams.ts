"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import type { SavedTeam } from "@/types/pokemon";
import type { SaveTeamRequest, GetTeamsResponse } from "@/types/api";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useTeams() {
  const { data, error, isLoading, mutate } = useSWR<GetTeamsResponse>(
    "/api/teams",
    fetcher,
    { revalidateOnFocus: false }
  );

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const saveTeam = useCallback(
    async (payload: SaveTeamRequest): Promise<SavedTeam | null> => {
      setSaving(true);
      try {
        const res = await fetch("/api/teams", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error ?? "Error al guardar");
        }

        const { team } = await res.json();
        await mutate(); // revalidate list
        return team as SavedTeam;
      } catch (e) {
        throw e;
      } finally {
        setSaving(false);
      }
    },
    [mutate]
  );

  const deleteTeam = useCallback(
    async (id: string): Promise<void> => {
      setDeleting(id);
      try {
        const res = await fetch(`/api/teams/${id}`, { method: "DELETE" });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error ?? "Error al eliminar");
        }
        // Optimistic update
        await mutate(
          (prev) =>
            prev
              ? {
                  ...prev,
                  teams: prev.teams.filter((t) => t.id !== id),
                  total: prev.total - 1,
                }
              : prev,
          { revalidate: false }
        );
      } finally {
        setDeleting(null);
      }
    },
    [mutate]
  );

  const updateTeam = useCallback(
    async (
      id: string,
      updates: Partial<Pick<SavedTeam, "nombre" | "descripcion" | "isPublic">>
    ): Promise<void> => {
      const body: Record<string, unknown> = {};
      if ("nombre" in updates) body.nombre = updates.nombre;
      if ("descripcion" in updates) body.descripcion = updates.descripcion;
      if ("isPublic" in updates) body.is_public = updates.isPublic;

      const res = await fetch(`/api/teams/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Error al actualizar");
      }

      await mutate();
    },
    [mutate]
  );

  return {
    teams: data?.teams ?? [],
    total: data?.total ?? 0,
    isLoading,
    error,
    saving,
    deleting,
    saveTeam,
    deleteTeam,
    updateTeam,
    mutate,
  };
}
