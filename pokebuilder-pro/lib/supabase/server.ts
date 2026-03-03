import { createClient } from "@supabase/supabase-js";

// lib/supabase/server.ts
export function createServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! // Changed from SERVICE_ROLE_KEY
  );
}