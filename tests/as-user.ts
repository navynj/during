import { createHmac } from 'node:crypto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/lib/database.types';

/** The local stack's fixed JWT secret, printed by `supabase start`. */
const LOCAL_JWT_SECRET = 'super-secret-jwt-token-with-at-least-32-characters-long';

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64url');
}

/**
 * Mints a session for a seeded account.
 *
 * The tests go through PostgREST with a real user token rather than the
 * service-role key, because the service role bypasses RLS — which is the only
 * thing under test here.
 */
export function asUser(userId: string): SupabaseClient<Database> {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = base64url(
    JSON.stringify({
      sub: userId,
      aud: 'authenticated',
      role: 'authenticated',
      iss: 'supabase-demo',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    }),
  );
  const signature = createHmac('sha256', LOCAL_JWT_SECRET)
    .update(`${header}.${payload}`)
    .digest('base64url');
  const token = `${header}.${payload}.${signature}`;

  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    },
  );
}

/** Seeded accounts (supabase/seed.sql). */
export const YOONJI = '11111111-1111-1111-1111-111111111111';
export const MINA = '22222222-2222-2222-2222-222222222222';
export const JAE = '33333333-3333-3333-3333-333333333333';

/** Yoonji's locked Ripple and one of her unlocked ones. */
export const LOCKED_RIPPLE = 'b1000000-0000-0000-0000-000000000004';
export const UNLOCKED_RIPPLE = 'b1000000-0000-0000-0000-000000000002';
export const JAE_RIPPLE = 'b3000000-0000-0000-0000-000000000001';

/** Service-role client. Bypasses RLS, so it is only ever used for fixtures. */
export function asAdmin(): SupabaseClient<Database> {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

/** A client with no session, for asserting that the door is shut by default. */
export function anonymous(): SupabaseClient<Database> {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
