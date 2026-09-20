import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/supabase/proxy', () => ({ updateSession: () => null }));

import manifest from '@/app/manifest';
import { config } from '@/proxy';

/** The matcher as a plain expression, so a path can be tried against it. */
function guarded(path: string): boolean {
  return config.matcher.some((pattern) => new RegExp(`^${pattern}$`).test(path));
}

describe('the manifest reaches the browser', () => {
  it('is not behind the session check', () => {
    // Browsers fetch the manifest anonymously, so a session check answers with
    // a 307 to /sign-in. The manifest then fails to parse, the install
    // criteria are never met, and the home-screen shortcut opens as an
    // ordinary bookmark with the URL bar showing.
    expect(guarded('/manifest.webmanifest')).toBe(false);
  });

  it('lets the icons through too, since the manifest names them', () => {
    expect(guarded('/icon-192.png')).toBe(false);
    expect(guarded('/icon-512.png')).toBe(false);
    expect(guarded('/apple-touch-icon.png')).toBe(false);
    expect(guarded('/favicon.ico')).toBe(false);
  });

  it('still guards every page', () => {
    expect(guarded('/')).toBe(true);
    expect(guarded('/lanes')).toBe(true);
    expect(guarded('/locker')).toBe(true);
    expect(guarded('/now')).toBe(true);
  });
});

describe('the installed app is an app', () => {
  it('opens standalone, which is what removes the URL bar', () => {
    expect(manifest().display).toBe('standalone');
  });

  it('starts at the day, not wherever the shortcut was made', () => {
    expect(manifest().start_url).toBe('/');
  });

  it('carries an icon at both sizes a launcher asks for', () => {
    const sizes = (manifest().icons ?? []).map((icon) => icon.sizes);
    expect(sizes).toContain('192x192');
    expect(sizes).toContain('512x512');
  });

  it('offers a maskable icon, or Android crops the mark into a circle badly', () => {
    expect((manifest().icons ?? []).some((icon) => icon.purpose === 'maskable')).toBe(true);
  });
});

describe('the status bar belongs to the page, not to a session', () => {
  it('is not the live-surface colour', () => {
    // SPEC 7 law 5: a solid #0507C9 surface means a live session. The status
    // bar is present whenever the app is, so tinting it with that colour
    // would make the claim permanently — and spend the one channel the
    // running record depends on.
    expect(manifest().theme_color?.toLowerCase()).not.toBe('#0507c9');
  });

  it('matches the ground the app actually renders on', () => {
    expect(manifest().theme_color?.toLowerCase()).toBe('#ffffff');
    expect(manifest().background_color?.toLowerCase()).toBe('#ffffff');
  });
});
