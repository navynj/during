import { config } from 'dotenv';
import { expect, test, type Page } from '@playwright/test';

import { asAdmin } from '../tests/as-user';
import { splashPath } from '@/lib/routes';

import { isLavender } from './lavender';

config({ path: '.env.local', quiet: true });

/**
 * Black + Light draws no blue (H78, review): the card stack once showed
 * lavender — its back cards, the top card's edge, its ••• — from a grey
 * ramp tinted blue whatever the theme. Every colour the stack and a page's
 * panel compute is read here, and none may read as blue or violet. Ink and
 * the cool greys carry a trace of blue by design and read as grey: a colour
 * counts only past an OKLCH chroma of 0.03 (`e2e/lavender.ts`). One
 * throwaway person, removed after.
 */
const admin = asAdmin();
let me = '';
const splashes: string[] = [];
let cookie = '';

test.beforeAll(async () => {
  const email = `theme-hue-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@during.today`;
  const made = await admin.auth.admin.createUser({ email, email_confirm: true });
  if (made.error) throw made.error;
  me = made.data.user.id;
  await admin
    .from('profiles')
    .insert({ id: me, display_name: 'Ink', timezone: 'America/Vancouver' });
  const lane = await admin
    .from('my_categories')
    .insert({ user_id: me, name: 'Day', icon: '🌊' })
    .select('id')
    .single();
  if (lane.error) throw lane.error;
  await admin
    .from('my_theme_settings')
    .upsert({ user_id: me, home_color: 'black', mode: 'light', apply_everywhere: false });
  // Two pages, so the stack has a card behind the top one.
  for (const [title, day] of [
    ['Older', '2026-10-20'],
    ['Newer', '2026-10-21'],
  ]) {
    const post = await admin
      .from('splashes')
      .insert({
        owner_id: me,
        created_by: me,
        title,
        declared_lane_id: lane.data.id,
        declared_start: day,
      })
      .select('id')
      .single();
    if (post.error) throw post.error;
    splashes.push(post.data.id);
    const note = await admin
      .from('ripples')
      .insert({ author_id: me, note: `A note on ${title}`, splash_id: post.data.id });
    if (note.error) throw note.error;
  }

  const link = await admin.auth.admin.generateLink({ type: 'magiclink', email });
  if (link.error) throw link.error;
  const verified = await fetch(link.data.properties.action_link, { redirect: 'manual' });
  const hash = new URLSearchParams(verified.headers.get('location')!.split('#')[1]);
  cookie =
    'base64-' +
    Buffer.from(
      JSON.stringify({
        access_token: hash.get('access_token'),
        refresh_token: hash.get('refresh_token'),
        token_type: 'bearer',
        expires_in: Number(hash.get('expires_in')),
        expires_at: Number(hash.get('expires_at')),
        user: made.data.user,
      }),
    ).toString('base64url');
});

test.afterAll(async () => {
  if (me) await admin.from('ripples').delete().eq('author_id', me);
  for (const id of splashes) await admin.from('splashes').delete().eq('id', id);
  if (me) await admin.auth.admin.deleteUser(me);
});

/** Every computed colour under `selector` that reads blue or violet (`isLavender`), as "prop value". */
async function blueIn(page: Page, selector: string): Promise<string[]> {
  const seen = await page.evaluate((selector) => {
    const found = new Set<string>();
    for (const root of document.querySelectorAll(selector)) {
      for (const el of [root, ...root.querySelectorAll('*')]) {
        // Google's own logo keeps its brand colours (its button, sign-in).
        if (el.closest('[data-google-sign-in] svg')) continue;
        const style = getComputedStyle(el);
        for (const prop of [
          'color',
          'background-color',
          'border-top-color',
          'border-bottom-color',
          'fill',
          'stroke',
          'box-shadow',
        ]) {
          for (const m of style
            .getPropertyValue(prop)
            .matchAll(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/g)) {
            if (m[4] !== undefined && Number(m[4]) === 0) continue;
            found.add(`${prop} ${m[0]}`);
          }
        }
      }
    }
    return [...found];
  }, selector);
  return seen.filter((entry) => {
    const [r, g, b] = entry.match(/[\d.]+/g)!.map(Number);
    return isLavender(r, g, b);
  });
}

test('Black + Light: the card stack and a page panel draw no blue', async ({
  page,
  baseURL,
}, info) => {
  test.skip(info.project.name !== 'phone', 'one width is enough');
  test.setTimeout(120_000);
  const ref = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname.split('.')[0];
  await page.context().addCookies([{ name: `sb-${ref}-auth-token`, value: cookie, url: baseURL! }]);

  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'black');
  await expect(page.locator('html')).toHaveAttribute('data-mode', 'light');
  await expect(page.locator('[data-diving-board]')).toBeVisible({ timeout: 60_000 });
  expect(await blueIn(page, '[data-diving-board]')).toEqual([]);

  await page.goto(splashPath(splashes[1]));
  await expect(page.locator('[data-splash-page]')).toBeVisible({ timeout: 60_000 });
  expect(await blueIn(page, '[data-splash-modal], [data-splash-page]')).toEqual([]);
});

test('signed out, sign-in draws no blue but Google’s own logo (H78)', async ({ page }, info) => {
  test.skip(info.project.name !== 'phone', 'one width is enough');
  await page.goto('/sign-in');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'black');
  await expect(page.locator('[data-pool-block]')).toBeVisible({ timeout: 60_000 });
  expect(await blueIn(page, 'main')).toEqual([]);
});
