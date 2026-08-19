import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

export const CONTACTS_TABLE = process.env.SUPABASE_CONTACTS_TABLE ?? "contacts";

/**
 * Service-role Supabase client. Bypasses RLS — import from API routes only,
 * never from client components.
 */
export function supabase(): SupabaseClient {
  if (!_client) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    _client = createClient(url, key, { auth: { persistSession: false } });
  }
  return _client;
}
