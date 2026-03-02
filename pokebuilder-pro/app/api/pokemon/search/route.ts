import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Acepta tanto ?q= (route.ts interno) como ?name= (componentes legacy)
    const query = (searchParams.get("q") ?? searchParams.get("name") ?? "").toLowerCase().trim();
    const tipo  = searchParams.get("tipo")?.toLowerCase();
    const tier  = searchParams.get("tier");
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "10"), 50);
    const excludeIds = searchParams.get("exclude")?.split(",").map(Number).filter(Boolean) ?? [];

    if (!query || query.length < 2) {
      return NextResponse.json([]);
    }

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
      orderBy: { nombre: "asc" },
      take: limit,
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

    return NextResponse.json(formatted);

  } catch (error) {
    console.error("Error en /api/pokemon/search:", error);
    return NextResponse.json({ error: "Error al buscar Pokémon" }, { status: 500 });
  }
}