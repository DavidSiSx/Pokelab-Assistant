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
  const limit = Math.min(Number(searchParams.get("limit") ?? 20), 50);
  const offset = Number(searchParams.get("offset") ?? 0);

  const { data, error, count } = await supabase
    .from("saved_teams")
    .select("*", { count: "exact" })
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json(
      { error: "Error al obtener equipos", code: "DB_ERROR" },
      { status: 500 }
    );
  }

  const teams: SavedTeam[] = (data ?? []).map(rowToSavedTeam);

  const response: GetTeamsResponse = {
    teams,
    total: count ?? 0,
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

  const { data, error } = await supabase
    .from("saved_teams")
    .insert({
      user_id: user.id,
      nombre: nombre.trim(),
      descripcion: descripcion?.trim() ?? null,
      team,
      builds: builds ?? {},
      config: config ?? {},
      ai_report: aiReport ?? null,
      is_public: isPublic ?? false,
      formato: config?.format ?? "National Dex",
    })
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Error al guardar el equipo", code: "DB_ERROR" },
      { status: 500 }
    );
  }

  const response: SaveTeamResponse = {
    team: rowToSavedTeam(data),
  };

  return NextResponse.json(response, { status: 201 });
}

// ── Helper ────────────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToSavedTeam(row: any): SavedTeam {
  return {
    id: row.id,
    userId: row.user_id,
    nombre: row.nombre,
    descripcion: row.descripcion ?? undefined,
    team: row.team ?? [],
    builds: row.builds ?? {},
    config: row.config ?? {},
    aiReport: row.ai_report ?? undefined,
    isPublic: row.is_public ?? false,
    formato: row.formato ?? "National Dex",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
