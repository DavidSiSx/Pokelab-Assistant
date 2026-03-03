import { createClient } from "@supabase/supabase-js";

// Singleton for client components
let _client: ReturnType<typeof createClient> | null = null;

export function createBrowserClient() {
  if (!_client) {
    _client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return _client;
}

// Legacy export — keep for backwards compat
export const supabaseClient = createBrowserClient();
