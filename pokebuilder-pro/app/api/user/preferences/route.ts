import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import type { Theme } from "@/providers/ThemeProvider";

const VALID_THEMES: Theme[] = ["pokeball", "midnight", "forest", "plasma", "ultra"];

// ── GET — get user preferences ────────────────────────────────────────────────
export async function GET() {
  const supabase = createServerClient();

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

  const { data } = await supabase
    .from("user_preferences")
    .select("theme")
    .eq("user_id", user.id)
    .single();

  return NextResponse.json({ theme: data?.theme ?? "pokeball" });
}

// ── PATCH — upsert user preferences ──────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  const supabase = createServerClient();

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

  let body: { theme?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Body inválido", code: "VALIDATION" },
      { status: 400 }
    );
  }

  const theme = body.theme as Theme;
  if (!theme || !VALID_THEMES.includes(theme)) {
    return NextResponse.json(
      { error: "Tema inválido", code: "VALIDATION" },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("user_preferences")
    .upsert({ user_id: user.id, theme }, { onConflict: "user_id" });

  if (error) {
    return NextResponse.json(
      { error: "Error al guardar preferencia", code: "DB_ERROR" },
      { status: 500 }
    );
  }

  return NextResponse.json({ theme });
}
