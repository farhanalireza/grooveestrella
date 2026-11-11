// src/lib/supabase/publicServer.js
import { createClient } from '@supabase/supabase-js';

let publicClient = null;

function getAnonKey() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_PUBLISHABE_KEY
  );
}

export function isPublicSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = getAnonKey();
  return Boolean(
    url &&
    anonKey &&
    url !== 'https://your-project.supabase.co' &&
    anonKey !== 'your-anon-key'
  );
}

/**
 * Lightweight, cookie-free Supabase client for fast public reads (profiles, public journals, follows, rating summaries).
 * Avoids `cookies()` overhead and CORS preflights when called from Server Components or public API routes.
 */
export function getPublicSupabaseClient() {
  if (!isPublicSupabaseConfigured()) return null;

  if (!publicClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = getAnonKey();
    publicClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  }

  return publicClient;
}
