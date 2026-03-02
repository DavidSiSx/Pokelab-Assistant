import { createServerClient } from "./server";
import { NextResponse } from "next/server";

export async function requireAuth() {
  const supabase = createServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      user: null,
      error: NextResponse.json({ error: "No autorizado" }, { status: 401 }),
    };
  }

  return { user, error: null };
}