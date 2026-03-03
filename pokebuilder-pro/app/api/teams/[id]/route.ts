import { NextRequest, NextResponse } from "next/server";
import { createUserClient } from "@/lib/supabase/server";
import type { SavedTeam } from "@/types/pokemon";

// ── DELETE — remove a team by id ─────────────────────────────────────────────
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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

  const { error } = await supabase
    .from("saved_teams")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id); // RLS double-check

  if (error) {
    return NextResponse.json(
      { error: "Error al eliminar el equipo", code: "DB_ERROR" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}

// ── PATCH — update team name/description/isPublic ────────────────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Body inválido", code: "VALIDATION" },
      { status: 400 }
    );
  }

  const allowed = ["nombre", "descripcion", "is_public"] as const;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updates: Record<string, any> = {};
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: "Nada que actualizar", code: "VALIDATION" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("saved_teams")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Error al actualizar el equipo", code: "DB_ERROR" },
      { status: 500 }
    );
  }

  const team: SavedTeam = {
    id: data.id,
    userId: data.user_id,
    nombre: data.nombre,
    descripcion: data.descripcion ?? undefined,
    team: data.team ?? [],
    builds: data.builds ?? {},
    config: data.config ?? {},
    aiReport: data.ai_report ?? undefined,
    isPublic: data.is_public ?? false,
    formato: data.formato ?? "National Dex",
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };

  return NextResponse.json({ team });
}
