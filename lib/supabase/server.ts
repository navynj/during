import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

import type { Database } from '@/lib/database.types';
import { supabaseAnonKey, supabaseUrl } from '@/lib/env';
import { fetchWithDeadline } from '@/lib/supabase/fetch';

export async function createClient() {
  const cookieStore = await cookies();

  // Named reads (lib/env.ts): a missing variable fails as `Missing <NAME>`.
  return createServerClient<Database>(supabaseUrl(), supabaseAnonKey(), {
    global: { fetch: fetchWithDeadline(5_000) },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component, where cookies are read-only.
          // The middleware refreshes the session, so this is safe to ignore.
        }
      },
    },
  });
}
