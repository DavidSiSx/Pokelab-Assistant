/**
 * ARCHIVO: app/api/teams/route.ts
 *
 * Fixes aplicados:
 * ① try-catch robusto alrededor de rowToSavedTeam — evita 500 por filas corruptas en DB
 * ② Logging mejorado para diagnosticar el error 500 con detalles reales del fallo
 * ③ Validación de rango offset/limit para evitar parámetros NaN que crashean Supabase
 */

import { NextRequest, NextResponse } from "next/server";
import { createUserClient } from "@/lib/supabase/server";
import type { SaveTeamRequest, SaveTeamResponse, GetTeamsResponse } from "@/types/api";
import type { SavedTeam } from "@/types/pokemon";

// ── GET — list user's saved teams ────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { client: supabase } = createUserClient(req);

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: "No autorizado", code: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);

  // Fix ③: sanitizar limit/offset para evitar NaN → error en Supabase range()
  const rawLimit  = parseInt(searchParams.get("limit")  ?? "20", 10);
  const rawOffset = parseInt(searchParams.get("offset") ?? "0",  10);
  const limit  = isNaN(rawLimit)  || rawLimit  < 1  ? 20 : Math.min(rawLimit, 50);
  const offset = isNaN(rawOffset) || rawOffset < 0  ? 0  : rawOffset;

  let data: any[] | null = null;
  let count: number | null = null;

  try {
    const result = await supabase
      .from("saved_teams")
      .select("*", { count: "exact" })
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (result.error) {
      // Fix ②: log del error real de Supabase para poder diagnosticarlo
      console.error("[GET /api/teams] Supabase DB error:", {
        message: result.error.message,
        code:    result.error.code,
        details: result.error.details,
        hint:    result.error.hint,
      });
      return NextResponse.json(
        {
          error:   "Error al obtener equipos",
          code:    "DB_ERROR",
          details: result.error.message,
        },
        { status: 500 }
      );
    }

    data  = result.data;
    count = result.count;
  } catch (unexpectedErr) {
    console.error("[GET /api/teams] Error inesperado en Supabase:", unexpectedErr);
    return NextResponse.json(
      { error: "Error interno al obtener equipos", code: "DB_ERROR" },
      { status: 500 }
    );
  }

  // Fix ①: try-catch alrededor del mapping para que una fila corrupta no rompa todo
  let teams: SavedTeam[] = [];
  const skipped: number[] = [];

  for (const row of data ?? []) {
    try {
      teams.push(rowToSavedTeam(row));
    } catch (mapErr) {
      console.error(`[GET /api/teams] rowToSavedTeam falló en fila id=${row?.id}:`, mapErr);
      skipped.push(row?.id ?? -1);
    }
  }

  const response: GetTeamsResponse & { skippedRows?: number[] } = {
    teams,
    total: count ?? 0,
    ...(skipped.length > 0 ? { skippedRows: skipped } : {}),
  };

  return NextResponse.json(response);
}

// ── POST — save a new team ────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const { client: supabase } = createUserClient(req);

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: "No autorizado", code: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  let body: SaveTeamRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Body inválido", code: "VALIDATION" },
      { status: 400 }
    );
  }

  const { nombre, descripcion, team, builds, config, aiReport, isPublic } = body;

  if (!nombre?.trim()) {
    return NextResponse.json(
      { error: "El nombre del equipo es requerido", code: "VALIDATION" },
      { status: 400 }
    );
  }

  if (!Array.isArray(team) || team.length === 0) {
    return NextResponse.json(
      { error: "El equipo no puede estar vacío", code: "VALIDATION" },
      { status: 400 }
    );
  }

  if (team.length > 6) {
    return NextResponse.json(
      { error: "El equipo no puede tener más de 6 Pokémon", code: "VALIDATION" },
      { status: 400 }
    );
  }

  let insertedData: any;
  try {
    const { data, error } = await supabase
      .from("saved_teams")
      .insert({
        user_id:    user.id,
        nombre:     nombre.trim(),
        descripcion: descripcion?.trim() ?? null,
        team,
        builds:     builds ?? {},
        config:     config ?? {},
        ai_report:  aiReport ?? null,
        is_public:  isPublic ?? false,
        formato:    config?.format ?? "National Dex",
      })
      .select()
      .single();

    if (error || !data) {
      console.error("[POST /api/teams] Supabase insert error:", {
        message: error?.message,
        code:    error?.code,
        details: error?.details,
        hint:    error?.hint,
      });
      return NextResponse.json(
        {
          error:   "Error al guardar el equipo",
          code:    "DB_ERROR",
          details: error?.message,
        },
        { status: 500 }
      );
    }

    insertedData = data;
  } catch (unexpectedErr) {
    console.error("[POST /api/teams] Error inesperado al insertar:", unexpectedErr);
    return NextResponse.json(
      { error: "Error interno al guardar el equipo", code: "DB_ERROR" },
      { status: 500 }
    );
  }

  let savedTeam: SavedTeam;
  try {
    savedTeam = rowToSavedTeam(insertedData);
  } catch (mapErr) {
    console.error("[POST /api/teams] rowToSavedTeam falló en fila recién insertada:", mapErr);
    return NextResponse.json(
      { error: "Equipo guardado pero no se pudo mapear la respuesta", code: "MAP_ERROR" },
      { status: 500 }
    );
  }

  const response: SaveTeamResponse = { team: savedTeam };
  return NextResponse.json(response, { status: 201 });
}

// ── Helper ────────────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToSavedTeam(row: any): SavedTeam {
  if (!row || typeof row !== "object") {
    throw new Error(`rowToSavedTeam: fila inválida recibida: ${JSON.stringify(row)}`);
  }

  return {
    id:          row.id,
    userId:      row.user_id,
    nombre:      row.nombre      ?? "Sin nombre",
    descripcion: row.descripcion ?? undefined,
    team:        Array.isArray(row.team)   ? row.team   : [],
    builds:      row.builds && typeof row.builds === "object" ? row.builds : {},
    config:      row.config && typeof row.config === "object" ? row.config : {},
    aiReport:    row.ai_report   ?? undefined,
    isPublic:    row.is_public   ?? false,
    formato:     row.formato     ?? "National Dex",
    createdAt:   row.created_at,
    updatedAt:   row.updated_at,
  };
}