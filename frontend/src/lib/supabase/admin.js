// src/lib/supabase/admin.js
import { createClient, createAdminClient, isSupabaseServerConfigured } from './server';

/**
 * Verify that the current request belongs to an authenticated admin user
 * (profiles.is_admin = true).
 */
export async function requireAdminSession() {
  if (!isSupabaseServerConfigured()) {
    return {
      ok: false,
      status: 503,
      error: 'Database is not configured.',
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      ok: false,
      status: 401,
      error: 'Authentication required.',
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, username, display_name, is_admin')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError || !profile?.is_admin) {
    return {
      ok: false,
      status: 403,
      error: 'Forbidden: Only GrooveEstrella admins can manage official lists.',
    };
  }

  return {
    ok: true,
    supabase,
    adminClient: createAdminClient() || supabase,
    user,
    profile,
  };
}
