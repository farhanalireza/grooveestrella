// src/lib/supabase/client.js
import { createBrowserClient } from '@supabase/ssr';

let supabaseClient = null;

function getAnonKey() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_PUBLISHABE_KEY
  );
}

export function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = getAnonKey();
  return Boolean(
    url && 
    anonKey && 
    url !== 'https://your-project.supabase.co' && 
    anonKey !== 'your-anon-key'
  );
}

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseAnonKey = getAnonKey() || 'placeholder-anon-key';

  if (!supabaseClient) {
    supabaseClient = createBrowserClient(supabaseUrl, supabaseAnonKey);
  }
  return supabaseClient;
}

export const supabase = typeof window !== 'undefined' ? createClient() : null;
