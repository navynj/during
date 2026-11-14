import { expect, test } from '@playwright/test';

/**
 * The focus ring is the keyboard's alone (H78n): a click leaves none, Tab
 * draws 2px in the accent with a 2px gap. Signed out, so no record is read.
 */
test('no ring on a click; the accent ring on Tab', async ({ page }, info) => {
  test.skip(info.project.name !== 'phone', 'one width is enough');
  await page.goto('/sign-in');
  const button = page.locator('[data-google-sign-in]');
  await expect(button).toBeVisible({ timeout: 60_000 });

  // A press that focuses without leaving the page: the pointer, then no click.
  await button.dispatchEvent('pointerdown');
  await button.focus();
  expect(await button.evaluate((el) => getComputedStyle(el).outlineStyle)).toBe('none');

  await page.locator('body').click({ position: { x: 1, y: 1 } });
  await page.keyboard.press('Tab');
  const ring = await page.evaluate(() => {
    const el = document.activeElement as HTMLElement;
    const style = getComputedStyle(el);
    return {
      style: style.outlineStyle,
      width: style.outlineWidth,
      offset: style.outlineOffset,
      color: style.outlineColor,
      accent: getComputedStyle(document.documentElement).getPropertyValue('--theme-900').trim(),
    };
  });
  expect(ring.style).toBe('solid');
  expect(ring.width).toBe('2px');
  expect(ring.offset).toBe('2px');
  // Signed out wears Black: the accent is ink.
  expect(ring.color).toBe('rgb(22, 22, 33)');
});
