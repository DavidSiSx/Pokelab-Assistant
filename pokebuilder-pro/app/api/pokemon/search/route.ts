import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** Obtiene el nombre base de un Pokémon ignorando sufijos de forma */
function getBaseName(nombre: string): string {
  return nombre
    .toLowerCase()
    // Sufijos comunes de formas alternas en la DB
    .replace(/-(f|m|female|male|alola|alolan|galar|galarian|hisui|hisuian|paldea|paldean|mega|mega-x|mega-y|gmax|primal|origin|crowned|shadow|ice|dusk-mane|dawn-wings|ultra|resolute|pirouette|therian|incarnate|black|white|complete|10|50|10-power-construct|50-power-construct|school|dusk|dawn|midday|midnight|original|core|blade|shield|sword|eternal|neutral|fan|frost|heat|mow|wash|small|large|super|average|phony|antique|roaming|family-of-three|amped|lowkey|rapid-strike|single-strike|hangry|full-belly|gorging|gulping|ice-rider|shadow-rider|crowned-sword|crowned-shield|white-striped|zero|hero|teal|indigo|hearthflame|wellspring|cornerstone|terastal|stellar|blue-striped|red-striped|east|west|plant|sandy|trash|sunny|rainy|snowy|zen|standard|zen-galar|blue|yellow|red|green|purple|white|black|orange|gray|striped|polteageist|sinistea|amorphous|mineral|natural|land|sky|speed|attack|defense|altered|origin|unbound|confined|unbound|baile|pom-pom|sensu|pau|dusk-lycanroc|midnight-lycanroc|midday-lycanroc|pirouette|aria|battle-bond|ash|original-cap|partner-cap|alola-cap|kanto-cap|unova-cap|sinnoh-cap|hoenn-cap|kalos-cap|world-cap|totem|disguised|busted|hangry|full-belly)$/, "")
    .trim();
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = (searchParams.get("q") ?? searchParams.get("name") ?? "").toLowerCase().trim();
    const tipo  = searchParams.get("tipo")?.toLowerCase();
    const tier  = searchParams.get("tier");
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "10"), 50);
    const excludeIds = searchParams.get("exclude")?.split(",").map(Number).filter(Boolean) ?? [];

    if (!query || query.length < 2) {
      return NextResponse.json([]);
    }

    // Traer más resultados para poder deduplicar
    const rawLimit = limit * 4;

    const results = await prisma.pokemon.findMany({
      where: {
        AND: [
          { nombre: { contains: query, mode: "insensitive" } },
          ...(tipo ? [{ OR: [
            { tipo1: { equals: tipo, mode: "insensitive" as const } },
            { tipo2: { equals: tipo, mode: "insensitive" as const } },
          ]}] : []),
          ...(excludeIds.length > 0 ? [{ id: { notIn: excludeIds } }] : []),
          ...(tier ? [{ AnalisisMeta: { some: { tier: { equals: tier } } } }] : []),
        ],
      },
      select: {
        id:         true,
        nombre:     true,
        tipo1:      true,
        tipo2:      true,
        sprite_url: true,
        AnalisisMeta: {
          select: { tier: true, usage_score: true },
          orderBy: { usage_score: "desc" },
          take: 1,
        },
      },
      orderBy: [
        { nombre: "asc" },
      ],
      take: rawLimit,
    });

    const formatted = results.map((p) => ({
      id:          p.id,
      nombre:      p.nombre,
      tipo1:       p.tipo1,
      tipo2:       p.tipo2,
      sprite_url:  p.sprite_url,
      tier:        p.AnalisisMeta[0]?.tier        ?? "Unranked",
      usage_score: p.AnalisisMeta[0]?.usage_score ?? 0,
    }));

    const queryHasSuffix = query.includes("-");

    let deduped: typeof formatted;

    if (queryHasSuffix) {
      deduped = formatted;
    } else {
      const baseMap = new Map<string, typeof formatted[0]>();
      for (const p of formatted) {
        const base = getBaseName(p.nombre);
        const existing = baseMap.get(base);
        if (!existing || (p.usage_score ?? 0) > (existing.usage_score ?? 0)) {
          baseMap.set(base, p);
        }
      }
      deduped = Array.from(baseMap.values());
    }

    return NextResponse.json(deduped.slice(0, limit));

  } catch (error) {
    console.error("Error en /api/pokemon/search:", error);
    return NextResponse.json({ error: "Error al buscar Pokémon" }, { status: 500 });
  }
}