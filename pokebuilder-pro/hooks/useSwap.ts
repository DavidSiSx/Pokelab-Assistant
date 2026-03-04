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

// ── Mapa de tipos en español e inglés ────────────────────────────
const TYPE_ALIASES: Record<string, string> = {
  // español
  bicho: "bug", fuego: "fire", agua: "water", planta: "grass",
  eléctrico: "electric", electrico: "electric", hielo: "ice",
  lucha: "fighting", veneno: "poison", tierra: "ground",
  volador: "flying", psíquico: "psychic", psiquico: "psychic",
  roca: "rock", fantasma: "ghost", dragón: "dragon", dragon: "dragon",
  siniestro: "dark", acero: "steel", hada: "fairy", normal: "normal",
  // inglés directo
  bug: "bug", fire: "fire", water: "water", grass: "grass",
  electric: "electric", ice: "ice", fighting: "fighting",
  poison: "poison", ground: "ground", flying: "flying",
  psychic: "psychic", rock: "rock", ghost: "ghost",
  dragon: "dragon", dark: "dark", steel: "steel", fairy: "fairy",
};

/**
 * Detecta si el feedback menciona un tipo específico de Pokémon
 * y devuelve el tipo en inglés si lo encuentra.
 * Ej: "otro tipo bicho" → "bug"
 *     "quiero solo tipo agua" → "water"
 *     "dame un fighting" → "fighting"
 */
function detectTypeFromFeedback(feedback: string): string | null {
  const lower = feedback.toLowerCase();
  for (const [alias, type] of Object.entries(TYPE_ALIASES)) {
    if (lower.includes(alias)) return type;
  }
  return null;
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

      // Locked team = todos excepto el slot que se reemplaza
      const lockedTeam = currentTeam
        .filter((p, i) => p !== null && i !== slotIndex)
        .filter(Boolean) as TeamMember[];

      const blacklist: string[] = [];

      // Auto-blacklist pokémon mencionados en feedback
      if (feedback) {
        currentTeam.forEach((p) => {
          if (p && feedback.toLowerCase().includes(p.nombre.toLowerCase())) {
            blacklist.push(p.nombre);
          }
        });
      }

      // Siempre blacklistear el Pokémon actual del slot
      const currentSlotPokemon = currentTeam[slotIndex];
      if (currentSlotPokemon) blacklist.push(currentSlotPokemon.nombre);

      // FIX: Detectar tipo en el feedback y aplicar monotype si corresponde
      const detectedType = feedback ? detectTypeFromFeedback(feedback) : null;
      const monoConfig = detectedType
        ? { ...config, isMonotype: true, monoTypeSelected: detectedType }
        : config;

      // Construir estrategia con el feedback del usuario de forma más directa
      const strategyParts: string[] = [];
      if (config.customStrategy) strategyParts.push(config.customStrategy);
      if (feedback) {
        // Pasar el feedback del usuario tal cual para que la IA lo interprete
        strategyParts.push(`INSTRUCCIÓN DEL USUARIO: "${feedback}"`);
        if (detectedType) {
          strategyParts.push(
            `FILTRO DE TIPO: El reemplazo DEBE ser de tipo ${detectedType.toUpperCase()} (tipo ${detectedType}). Busca en el pool SOLO Pokémon de tipo ${detectedType}.`
          );
        }
      }
      strategyParts.push(
        "Sugiere 3 candidatos con ROLES DISTINTOS (ej: uno ofensivo, uno de soporte, uno pivot). Diversidad máxima."
      );

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
              ...monoConfig,
              blacklist: [...(monoConfig.blacklist ?? []), ...blacklist],
              customStrategy: strategyParts.filter(Boolean).join(" | "),
            },
            slotIndex,
            swapCount: 3,
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.warnings?.[0] ?? "Error al buscar reemplazo");
        }

        const data = await res.json();
        const raw: any[] = data.suggestions ?? [];

        const normalized: SwapSuggestion[] = raw.map((sug: any) => {
          const reasoning =
            sug.reasoning ?? sug.razonamiento ?? sug.build?.reasoning ?? "";

          const evSpread =
            sug.build?.evSpread ?? sug.evSpread ?? buildEvString(sug);

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
                sug.build?.teraType ?? sug.teraType ??
                sug.build?.tera_type ?? sug.tera_type ?? "",
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