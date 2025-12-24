import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Creates a Supabase admin client using the service_role key.
 * This client bypasses RLS policies and should only be used for
 * server-side operations that need elevated privileges.
 *
 * IMPORTANT: Never expose this client to the browser or use it
 * in client components.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing Supabase admin credentials. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.'
    );
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
