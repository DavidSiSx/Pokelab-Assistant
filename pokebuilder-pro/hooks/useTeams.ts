"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import type { SavedTeam } from "@/types/pokemon";
import type { SaveTeamRequest, GetTeamsResponse } from "@/types/api";
import { useAuth } from "@/providers/AuthProvider";

/**
 * Create a fetcher that injects the current Supabase access token.
 */
function createAuthFetcher(token: string | null) {
  return async (url: string) => {
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(url, { headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Error de red" }));
      throw new Error(err.error ?? "Error al obtener equipos");
    }
    return res.json();
  };
}

export function useTeams() {
  const { user, session } = useAuth();
  const token = session?.access_token ?? null;

  // Only fetch teams when the user is logged in
  const { data, error, isLoading, mutate } = useSWR<GetTeamsResponse>(
    user ? "/api/teams" : null,
    user ? createAuthFetcher(token) : null,
    { revalidateOnFocus: false }
  );

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const saveTeam = useCallback(
    async (payload: SaveTeamRequest): Promise<SavedTeam | null> => {
      setSaving(true);
      try {
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch("/api/teams", {
          method: "POST",
          headers,
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
    [mutate, token]
  );

  const deleteTeam = useCallback(
    async (id: string): Promise<void> => {
      setDeleting(id);
      try {
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch(`/api/teams/${id}`, { method: "DELETE", headers });
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
    [mutate, token]
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

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`/api/teams/${id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Error al actualizar");
      }

      await mutate();
    },
    [mutate, token]
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
