import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * requireAuth — intenta autenticar al usuario usando:
 * 1. Cookie de sesión (SSR estándar de Supabase)
 * 2. Bearer token del header Authorization (para llamadas client-side fetch)
 *
 * Esto resuelve el error "No autorizado" cuando el cliente hace POST con
 * el token de Supabase en el header pero el servidor no lo lee.
 */
export async function requireAuth(req?: NextRequest) {
  // Try Bearer token from Authorization header first (client fetch)
  if (req) {
    const authHeader = req.headers.get("authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();

    if (token) {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { global: { headers: { Authorization: `Bearer ${token}` } } }
      );

      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (!error && user) {
        return { user, error: null };
      }
    }
  }

  // Fallback: cookie-based session (for server-rendered calls)
  const { createServerClient } = await import("./server");
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