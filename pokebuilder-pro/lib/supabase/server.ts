import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client — used for admin operations (bypasses RLS).
 * Cannot resolve users from request cookies.
 */
export function createServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * Creates a Supabase client scoped to the user whose JWT is
 * carried inside the `Authorization: Bearer <token>` header.
 *
 * Use this in API routes that need to identify the logged-in user.
 */
export function createUserClient(request: Request) {
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "");

  return {
    client: createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: { Authorization: `Bearer ${token}` },
        },
      }
    ),
    token,
  };
}
