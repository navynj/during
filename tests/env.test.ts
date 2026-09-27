import { describe, expect, it } from 'vitest';

import { assertServerEnv, missingServerEnv, requireEnv, SERVER_ENV } from '@/lib/env';

/**
 * After the prod photo incident: a missing variable must fail by name, once,
 * at startup — not as a generic throw from whichever route touches it first.
 */
describe('the server environment is checked by name', () => {
  const complete = Object.fromEntries(SERVER_ENV.map((name) => [name, 'set'])) as Record<
    (typeof SERVER_ENV)[number],
    string
  >;

  it('names the variable a single read is missing', () => {
    expect(() => requireEnv('SUPABASE_SERVICE_ROLE_KEY', undefined)).toThrow(
      'Missing SUPABASE_SERVICE_ROLE_KEY',
    );
    expect(() => requireEnv('SUPABASE_SERVICE_ROLE_KEY', '')).toThrow(
      'Missing SUPABASE_SERVICE_ROLE_KEY',
    );
    expect(requireEnv('NEXT_PUBLIC_SUPABASE_URL', 'http://x')).toBe('http://x');
  });

  it('lists every absent variable, and passes a complete environment', () => {
    expect(missingServerEnv(complete)).toEqual([]);
    expect(() => assertServerEnv(complete)).not.toThrow();

    const { SUPABASE_SERVICE_ROLE_KEY: _dropped, ...withoutKey } = complete;
    void _dropped;
    expect(missingServerEnv(withoutKey)).toEqual(['SUPABASE_SERVICE_ROLE_KEY']);
    expect(() => assertServerEnv(withoutKey)).toThrow('Missing SUPABASE_SERVICE_ROLE_KEY');

    expect(() => assertServerEnv({})).toThrow(`Missing ${SERVER_ENV.join(', ')}`);
  });

  it('requires the four the deploy doc lists, the service key among them', () => {
    expect([...SERVER_ENV]).toEqual([
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'NEXT_PUBLIC_SITE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
    ]);
  });
});
