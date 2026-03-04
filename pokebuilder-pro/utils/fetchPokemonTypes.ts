/**
 * utils/fetchPokemonTypes.ts
 *
 * Dado un array de TeamMember con tipo1:"" (venidos de parseShowdownPaste),
 * hace un fetch a /api/pokemon/search para obtener tipo1/tipo2/sprite_url reales.
 * Usado en ReviewView después de parsear un paste de Showdown.
 */
import type { TeamMember } from "@/types/pokemon";

export async function enrichTeamWithTypes(
  team: TeamMember[]
): Promise<TeamMember[]> {
  // Sólo enriquecer los que no tienen tipos
  const needsEnrich = team.filter(p => !p.tipo1);
  if (needsEnrich.length === 0) return team;

  // Fetch en paralelo — un search por nombre exacto
  const results = await Promise.allSettled(
    needsEnrich.map(async (p) => {
      const res = await fetch(
        `/api/pokemon/search?q=${encodeURIComponent(p.nombre)}&limit=5`
      );
      if (!res.ok) return null;
      const data: Array<{
        id: number;
        nombre: string;
        tipo1: string;
        tipo2?: string | null;
        sprite_url?: string | null;
      }> = await res.json();
      // Buscar coincidencia exacta (case-insensitive)
      return (
        data.find(
          (r) => r.nombre.toLowerCase() === p.nombre.toLowerCase()
        ) ?? data[0] ?? null
      );
    })
  );

  // Construir mapa nombre → datos enriquecidos
  const enrichMap = new Map<
    string,
    { tipo1: string; tipo2?: string | null; sprite_url?: string | null; id: number }
  >();
  needsEnrich.forEach((p, i) => {
    const r = results[i];
    if (r.status === "fulfilled" && r.value) {
      enrichMap.set(p.nombre.toLowerCase(), r.value);
    }
  });

  // Aplicar al equipo
  return team.map((p) => {
    if (p.tipo1) return p; // ya tiene tipos, no tocar
    const enriched = enrichMap.get(p.nombre.toLowerCase());
    if (!enriched) return p;
    return {
      ...p,
      id: enriched.id, // usar ID real de BD (necesario para weaknessProfile lookup)
      tipo1: enriched.tipo1,
      tipo2: enriched.tipo2 ?? null,
      sprite_url: enriched.sprite_url ?? p.sprite_url ?? null,
    };
  });
}