"use client";

import { useState, useCallback } from "react";
import type { TeamMember } from "@/types/pokemon";
import { createBrowserClient } from "@/lib/supabase/client";

export interface ReviewCategory {
  score: number;
  label: string;
  desc: string;
}

export interface ReviewResult {
  score: number;
  grade: string;
  analysis: string;
  weakPoints: string[];
  suggestions: string[];
  metaVerdict: string;
  categories: Record<string, ReviewCategory>;
  pokemonRatings: Record<string, { score: number; comment: string }>;
}

export function useReview() {
  const [result, setResult] = useState<ReviewResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reviewTeam = useCallback(
    async (
      team: TeamMember[],
      builds: Record<string, { ability?: string; nature?: string; item?: string; moves?: string[]; tera_type?: string }>,
      format: string
    ) => {
      if (team.length === 0) {
        setError("El equipo está vacío.");
        return;
      }

      setLoading(true);
      setError(null);

      const teamPayload = team.map((p) => {
        const build = builds[String(p.id)] ?? {};
        return {
          name: p.nombre,
          item: build.item ?? "",
          ability: build.ability ?? "",
          nature: build.nature ?? "",
          teraType: build.tera_type ?? "",
          moves: build.moves ?? [],
          evs: "",
        };
      });

      try {
        // Get auth token from Supabase browser client
        const supabase = createBrowserClient();
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch("/api/pokemon/review", {
          method: "POST",
          headers,
          body: JSON.stringify({ team: teamPayload, format }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "Error desconocido" }));
          // User-friendly error for 401
          if (res.status === 401) {
            throw new Error("Debes iniciar sesión para analizar equipos.");
          }
          throw new Error(err.error ?? "Error al analizar equipo");
        }

        const data: ReviewResult = await res.json();
        setResult(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { result, loading, error, reviewTeam, reset };
}