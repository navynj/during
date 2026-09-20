import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { authCallbackUrl } from '@/lib/site';
import { asAdmin } from './as-user';

/**
 * The bug this file exists to prevent: Supabase matches redirect_to against
 * additional_redirect_urls as exact strings, and answers a miss by redirecting
 * to site_url instead of erroring. Sign-in then "works" all the way to Google
 * and lands the user back on the sign-in page with no session and nothing in
 * any log to explain it.
 */

function allowlist(): string[] {
  const config = readFileSync('supabase/config.toml', 'utf8');
  const line = config.match(/^additional_redirect_urls = \[(.*)\]$/m);
  if (!line) throw new Error('additional_redirect_urls not found in config.toml');
  return [...line[1].matchAll(/"([^"]+)"/g)].map((match) => match[1]);
}

function returned(actionLink: string | undefined): string {
  if (!actionLink) throw new Error('no action link came back');
  return new URL(actionLink).searchParams.get('redirect_to') ?? '';
}

describe('the OAuth return leg', () => {
  it('sends a URL that is on the allowlist', () => {
    expect(allowlist()).toContain(authCallbackUrl());
  });

  it('carries no query string, which would break the exact match', () => {
    expect(new URL(authCallbackUrl()).search).toBe('');
  });

  it('is honoured by the auth server rather than silently replaced', async () => {
    // Asserts against the running stack, not just the file: a config that
    // parses can still be one GoTrue disagrees with.
    const { data, error } = await asAdmin().auth.admin.generateLink({
      type: 'magiclink',
      email: 'yoonji@during.today',
      options: { redirectTo: authCallbackUrl() },
    });

    expect(error).toBeNull();
    expect(returned(data?.properties?.action_link)).toBe(authCallbackUrl());
  });

  it('falls back silently when the URL is off the allowlist', async () => {
    // Documents the trap. A query string on a non-site_url origin is exactly
    // the combination that shipped broken.
    const offList = 'http://localhost:3000/auth/callback?tz=America%2FVancouver';
    const { data } = await asAdmin().auth.admin.generateLink({
      type: 'magiclink',
      email: 'yoonji@during.today',
      options: { redirectTo: offList },
    });

    expect(returned(data?.properties?.action_link)).not.toContain('/auth/callback');
  });
});
