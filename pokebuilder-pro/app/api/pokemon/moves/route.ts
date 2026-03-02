import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rateLimit";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // Acepta tanto ?name= (componentes) como ?nombre= (legacy)
    const rawName = (searchParams.get("name") ?? searchParams.get("nombre") ?? "").toLowerCase().trim();

    if (!rawName) return NextResponse.json({ moves: [], abilities: [] });

    // Rate limit por IP (no hay auth en este endpoint)
    const forwarded = (request as any).headers?.get?.("x-forwarded-for") ?? "unknown";
    const ip = forwarded.split(",")[0].trim();
    const limit = checkRateLimit(ip, "moves");
    if (!limit.allowed) {
      return NextResponse.json({ error: "RATE_LIMITED", message: limit.message }, { status: 429 });
    }

    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${rawName}`, {
      next: { revalidate: 86400 }, // cache 24h — los datos de moves no cambian
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Pokémon no encontrado" }, { status: 404 });
    }

    const data = await res.json();

    // ── HABILIDADES ──────────────────────────────────────────────
    const abilities: string[] = data.abilities.map((a: any) =>
      a.ability.name
        .split("-")
        .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ")
    );

    // ── MOVIMIENTOS — deduplicar por nombre ──────────────────────
    const seenNames = new Set<string>();
    const uniqueMoveEntries = data.moves.filter((m: any) => {
      const n = m.move.name;
      if (seenNames.has(n)) return false;
      seenNames.add(n);
      return true;
    });

    // Fetch de detalles en lotes de 20 para no saturar PokeAPI
    const BATCH_SIZE = 20;
    const moves: any[] = [];

    for (let i = 0; i < uniqueMoveEntries.length; i += BATCH_SIZE) {
      const batch = uniqueMoveEntries.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map(async (m: any) => {
          const formattedName = m.move.name
            .split("-")
            .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ");
          try {
            const moveRes = await fetch(m.move.url, { next: { revalidate: 86400 } });
            if (!moveRes.ok) throw new Error("not ok");
            const moveData = await moveRes.json();
            return {
              nombre:    formattedName,
              tipo:      moveData.type?.name        ?? null,
              potencia:  moveData.power             ?? null,
              precision: moveData.accuracy          ?? null,
              categoria: moveData.damage_class?.name ?? null, // 'physical' | 'special' | 'status'
            };
          } catch {
            return { nombre: formattedName };
          }
        })
      );
      moves.push(...batchResults);
    }

    // Ordenar: físicos y especiales primero (por potencia desc), estado al final
    moves.sort((a, b) => {
      if (a.categoria === "status" && b.categoria !== "status") return 1;
      if (a.categoria !== "status" && b.categoria === "status") return -1;
      return (b.potencia ?? 0) - (a.potencia ?? 0);
    });

    return NextResponse.json({ moves, abilities });

  } catch (error) {
    console.error("Error en /api/pokemon/moves:", error);
    return NextResponse.json({ error: "Fallo al cargar datos" }, { status: 500 });
  }
}