import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Data Supabase client (SERVER ONLY).
 *
 * Why this exists:
 * - You want Auth (Google login / session) to stay on the *old* Supabase project.
 * - You want Contacts/Companies data to be fetched from a *different* Supabase project.
 *
 * This client is used only inside Next.js Route Handlers (`app/api/**`).
 *
 * Environment variables:
 * - `NEXT_PUBLIC_DATA_SUPABASE_URL` (preferred): the data project's API URL
 * - `NEXT_PUBLIC_DATA_SUPABASE_ANON_KEY` (preferred): the data project's anon key
 * - `DATA_SUPABASE_SERVICE_ROLE_KEY` (optional): service role key for the data project
 *   - If set, the client bypasses RLS (use carefully).
 *
 * Fallback:
 * - If DATA_* vars are not present, we fall back to `NEXT_PUBLIC_SUPABASE_URL/ANON_KEY`
 *   so the app continues to work in single-Supabase setups without env changes.
 */
export function createDataClient(): SupabaseClient {
  const url =
    process.env.NEXT_PUBLIC_DATA_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon =
    process.env.NEXT_PUBLIC_DATA_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRole = process.env.DATA_SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error("Missing Supabase URL: NEXT_PUBLIC_DATA_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL");
  }

  const key = serviceRole ?? anon;
  if (!key) {
    throw new Error(
      "Missing Supabase key: DATA_SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_DATA_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}


