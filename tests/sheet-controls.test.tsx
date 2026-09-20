// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { AudienceChip, formatClock, TimeControl } from '@/features/input-sheet/sheet-controls';
import type { Draft } from '@/features/input-sheet/draft';

afterEach(cleanup);

const draft: Draft = {
  categoryId: 'c1',
  note: '',
  time: '09:19',
  audience: 'everyone',
  media: [],
  endTime: null,
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

  it('is one control with two exclusive segments', () => {
    const timed = render(
      <TimeControl draft={draft} planned={false} timeZone="Asia/Seoul" onChange={() => {}} />,
    );
    const pressed = [...timed.container.querySelectorAll('[aria-pressed]')].map((el) =>
      el.getAttribute('aria-pressed'),
    );

    // Exactly one segment is chosen, never both and never neither.
    expect(pressed).toEqual(['true', 'false']);

    cleanup();
    const allDay = render(
      <TimeControl
        draft={{ ...draft, time: null }}
        planned={false}
        timeZone="Asia/Seoul"
        onChange={() => {}}
      />,
    );
    expect(
      [...allDay.container.querySelectorAll('[aria-pressed]')].map((el) =>
        el.getAttribute('aria-pressed'),
      ),
    ).toEqual(['false', 'true']);
  });

  it('uses the selection grammar the chips use', () => {
    const { container } = render(
      <TimeControl draft={draft} planned={false} timeZone="Asia/Seoul" onChange={() => {}} />,
    );
    const chosen = container.querySelector('[aria-pressed="true"]')!;

    expect(chosen.className).toContain('bg-main-900');
    expect(chosen.className).toContain('text-white');
  });

  it('offers no prose links beside it', () => {
    const { container } = render(
      <TimeControl draft={draft} planned={false} timeZone="Asia/Seoul" onChange={() => {}} />,
    );

    expect(container.textContent).not.toMatch(/For the whole day|Give it a time/);
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

describe('the audience chip', () => {
  it('is two states and no avatar', () => {
    const { container, rerender } = render(
      <AudienceChip audience="everyone" onChange={() => {}} />,
    );
    expect(container.textContent).toBe('Everyone');
    // No icon, so nothing can overlap the label or sit off-palette.
    expect(container.querySelector('svg')).toBeNull();

    rerender(<AudienceChip audience="only-me" onChange={() => {}} />);
    expect(container.textContent).toBe('Only me');
    expect(container.querySelector('svg')).toBeNull();
  });
});
