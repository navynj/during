// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { formatClock, TimeControl } from '@/features/input-sheet/sheet-controls';
import type { Draft } from '@/features/input-sheet/draft';

afterEach(cleanup);

const draft: Draft = {
  categoryId: 'c1',
  note: '',
  time: '09:19',
  audience: 'everyone',
  parentRippleId: null,
};

/**
 * A non-Latin script in an English UI means a locale reached the screen. Not a
 * blanket ASCII check: our own copy uses em dashes and curly quotes, and
 * failing on those would police typography instead of locale.
 */
const FOREIGN_SCRIPT =
  /[\p{Script=Han}\p{Script=Hangul}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Cyrillic}\p{Script=Arabic}\p{Script=Hebrew}\p{Script=Thai}]/u;

/** The label itself is digits and a colon, so it can be held to ASCII. */
const NON_ASCII = /[^\x20-\x7E]/;

describe('the time label is English, whatever the browser is set to', () => {
  it('renders no locale strings of its own', () => {
    const { container } = render(
      <TimeControl draft={draft} planned={false} timeZone="Asia/Seoul" onChange={() => {}} />,
    );

    const label = container.querySelector('[data-time-label]')!;
    expect(label.textContent).toBe('09:19');
    expect(label.textContent).not.toMatch(NON_ASCII);
  });

  it('keeps the whole control free of them', () => {
    // The native picker renders in the browser's locale however the value was
    // computed, which is how "오전 09:19" reached an English screen. At rest
    // the control is our own label instead.
    const { container } = render(
      <TimeControl draft={draft} planned timeZone="Asia/Seoul" onChange={() => {}} />,
    );

    expect(container.textContent).not.toMatch(FOREIGN_SCRIPT);
    expect(container.querySelector('input[type="time"]')).toBeNull();
  });

  it('formats rather than converts: the value is already the author’s clock', () => {
    // Converting again would shift a Seoul record by nine hours.
    expect(formatClock('09:19')).toBe('09:19');
    expect(formatClock('23:05')).toBe('23:05');
    expect(formatClock('00:00')).toBe('00:00');
  });
});
