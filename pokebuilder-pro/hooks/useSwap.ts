"use client";

import { useState, useCallback } from "react";
import type { TeamMember, Build } from "@/types/pokemon";
import type { BuilderConfig } from "@/types/config";

export interface SwapSuggestion {
  id: string | number;
  name: string;
  role: string;
  reasoning: string;
  build: {
    ability: string;
    nature: string;
    item: string;
    moves: string[];
    evSpread?: string;
    teraType?: string;
  };
  synergies: string[];
}

export function useSwap() {
  const [suggestions, setSuggestions] = useState<SwapSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId] = useState(
    () => `swap_${Date.now()}_${Math.random().toString(36).slice(2)}`
  );

  const findReplacement = useCallback(
    async (
      slotIndex: number,
      currentTeam: (TeamMember | null)[],
      builds: Record<string, Build>,
      config: BuilderConfig,
      feedback?: string
    ) => {
      setLoading(true);
      setError(null);

      // Build locked team without the slot being swapped
      const lockedTeam = currentTeam
        .filter((p, i) => p !== null && i !== slotIndex)
        .filter(Boolean) as TeamMember[];

      const blacklist = feedback
        ? currentTeam
            .filter((p) => p && feedback.toLowerCase().includes(p.nombre.toLowerCase()))
            .map((p) => p!.nombre)
        : [];

      // Add current slot pokemon to blacklist so AI won't suggest it again
      const currentSlotPokemon = currentTeam[slotIndex];
      if (currentSlotPokemon) blacklist.push(currentSlotPokemon.nombre);

      try {
        const res = await fetch("/api/pokemon/suggest", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-session-id": sessionId,
          },
          body: JSON.stringify({
            lockedTeam,
            config: {
              ...config,
              blacklist,
              customStrategy: [config.customStrategy, feedback].filter(Boolean).join(" "),
            },
            slotIndex,
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.warnings?.[0] ?? "Error al buscar reemplazo");
        }

        const data = await res.json();
        setSuggestions(data.suggestions ?? []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error desconocido");
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    },
    [sessionId]
  );

  const reset = useCallback(() => {
    setSuggestions([]);
    setError(null);
  }, []);

  return { suggestions, loading, error, findReplacement, reset };
}
