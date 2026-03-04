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

      // Locked team = all filled slots EXCEPT the one being swapped
      const lockedTeam = currentTeam
        .filter((p, i) => p !== null && i !== slotIndex)
        .filter(Boolean) as TeamMember[];

      const blacklist: string[] = [];

      // Auto-blacklist pokemon mentioned in feedback
      if (feedback) {
        currentTeam.forEach((p) => {
          if (p && feedback.toLowerCase().includes(p.nombre.toLowerCase())) {
            blacklist.push(p.nombre);
          }
        });
      }

      // Always blacklist the current slot so AI won't suggest the same pokemon
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
              customStrategy: [
                config.customStrategy,
                feedback,
                "Sugiere 3 candidatos con ROLES DISTINTOS (ej: uno ofensivo, uno de soporte, uno pivot). Diversidad máxima.",
              ].filter(Boolean).join(" "),
            },
            slotIndex,
            // ⚡ KEY: tell the server to generate 3 alternatives instead of 1
            swapCount: 3,
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.warnings?.[0] ?? "Error al buscar reemplazo");
        }

        const data = await res.json();
        const raw: any[] = data.suggestions ?? [];

        // Normalize to SwapSuggestion shape
        const normalized: SwapSuggestion[] = raw.map((sug: any) => {
          // reasoning can be at root level or nested inside build object
          const reasoning =
            sug.reasoning ??
            sug.razonamiento ??
            sug.build?.reasoning ??
            "";

          // evSpread: use existing string or build from individual ev fields
          const evSpread =
            sug.build?.evSpread ??
            sug.evSpread ??
            buildEvString(sug);

          return {
            id: sug.id ?? sug.national_dex ?? Math.floor(Math.random() * 900000) + 1,
            name: sug.name ?? sug.nombre ?? "???",
            role: sug.role ?? sug.rol ?? sug.build?.role ?? "",
            reasoning,
            build: {
              ability: sug.build?.ability ?? sug.ability ?? "",
              nature:  sug.build?.nature  ?? sug.nature  ?? "",
              item:    sug.build?.item    ?? sug.item    ?? "",
              moves:   sug.build?.moves   ?? sug.moves   ?? [],
              evSpread,
              teraType:
                sug.build?.teraType ??
                sug.teraType ??
                sug.build?.tera_type ??
                sug.tera_type ??
                "",
            },
            synergies: Array.isArray(sug.synergies) ? sug.synergies : [],
          };
        });

        setSuggestions(normalized);
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

/** Build evSpread string from individual ev_* fields */
function buildEvString(sug: any): string {
  const parts = [
    sug.ev_hp  && `${sug.ev_hp} HP`,
    sug.ev_atk && `${sug.ev_atk} Atk`,
    sug.ev_def && `${sug.ev_def} Def`,
    sug.ev_spa && `${sug.ev_spa} SpA`,
    sug.ev_spd && `${sug.ev_spd} SpD`,
    sug.ev_spe && `${sug.ev_spe} Spe`,
  ].filter(Boolean);
  return parts.length ? parts.join(" / ") : "";
}