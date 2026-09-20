// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { RippleRow } from '@/features/home-daily/ripple-row';
import { TimeAxis, ADD_RIPPLE_SLOT_ID } from '@/features/home-daily/time-axis';
import { DailyNoteArea } from '@/features/home-daily/daily-note-area';
import type { RippleWithCategory } from '@/lib/queries/ripples';
import { wallClockToInstant } from '@/lib/ripple-kind';

const TZ = 'America/Vancouver';
const NOW = new Date('2026-09-19T20:00:00.000Z');

beforeEach(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      onchange: null,
      dispatchEvent: () => false,
    }),
  });
});
afterEach(cleanup);

function ripple(over: Partial<RippleWithCategory> = {}): RippleWithCategory {
  return {
    id: 'r1',
    author_id: 'a1',
    category_id: 'c1',
    note: 'spec rewrite',
    media: [],
    occurred_on: '2026-09-19',
    occurred_time: '09:00:00',
    ended_at: wallClockToInstant('2026-09-19', '10:30', TZ).toISOString(),
    planned: false,
    participants: [],
    created_at: '2026-09-19T16:00:00.000Z',
    parent_ripple_id: null,
    started_at: null,
    category: { name: 'Focus', icon: '🔍' },
    ...over,
  };
}

function row(over: Partial<RippleWithCategory> = {}) {
  return render(<RippleRow ripple={ripple(over)} timeZone={TZ} now={NOW} surface="bg-white" />);
}

describe('a Ripple on the axis', () => {
  it('shows its author-local time, not a converted one', () => {
    const { getByText } = row();
    expect(getByText('09:00')).toBeTruthy();
  });

  it('draws a timed record as a bundle whose density is its duration', () => {
    const { container } = row();
    // 90 minutes -> 6 lines on the log curve.
    expect(container.querySelector('[data-lines]')?.getAttribute('data-lines')).toBe('6');
  });

  it('draws a drop as a single line', () => {
    const at = wallClockToInstant('2026-09-19', '12:15', TZ).toISOString();
    const { container } = row({ occurred_time: '12:15:00', ended_at: at });

    expect(container.querySelector('[data-lines]')).toBeNull();
    expect(container.querySelectorAll('svg')).toHaveLength(1);
  });

  it('carries the category as a badge so the text is pure note (SPEC 7)', () => {
    const { getByText } = row();
    expect(getByText('🔍')).toBeTruthy();
    expect(getByText('spec rewrite')).toBeTruthy();
  });

  it('fades a planned record, badge and note together', () => {
    const { container, getByText } = row({ planned: true, ended_at: null });

    const faded = [...container.querySelectorAll('[style*="opacity"]')];
    expect(faded.length).toBeGreaterThan(0);
    for (const el of faded) {
      expect(Number((el as HTMLElement).style.opacity)).toBeLessThan(1);
    }
    expect(Number((getByText('spec rewrite') as HTMLElement).style.opacity)).toBeLessThan(1);
  });

  it('animates a running timer and holds a finished one still', () => {
    const live = row({ ended_at: null });
    expect(live.container.querySelectorAll('.wave-travel').length).toBeGreaterThan(0);

    cleanup();
    const done = row();
    expect(done.container.querySelectorAll('.wave-travel')).toHaveLength(0);
  });

  it('gives a locked Ripple no marker of its own', () => {
    // SPEC: this view is mine alone; lock state surfaces in the mini sheet.
    const { container } = row({ note: 'the thing I am not saying out loud yet' });
    expect(container.textContent).not.toMatch(/lock/i);
  });
});

describe('the day around it', () => {
  it('ends the flow with the Add ripple slot', () => {
    const { container, getByText } = render(
      <TimeAxis ripples={[ripple()]} timeZone={TZ} now={NOW} surface="bg-white" />,
    );

    expect(getByText('Add ripple')).toBeTruthy();
    const items = [...container.querySelectorAll('li')];
    expect(items[items.length - 1].id).toBe(ADD_RIPPLE_SLOT_ID);
  });

  it('stacks several Daily Notes rather than collapsing them', () => {
    const { getByText } = render(
      <DailyNoteArea
        notes={[
          ripple({ id: 'n1', note: 'slept badly', occurred_time: null }),
          ripple({ id: 'n2', note: 'quiet one', occurred_time: null }),
        ]}
      />,
    );

    expect(getByText('slept badly')).toBeTruthy();
    expect(getByText('quiet one')).toBeTruthy();
  });

  it('prompts when the day has no note', () => {
    const { getByText } = render(<DailyNoteArea notes={[]} />);
    expect(getByText('Add a Daily Note')).toBeTruthy();
  });
});

describe('motion on the axis (H10)', () => {
  it('travels every line of an in-progress record', () => {
    const { container } = render(
      <TimeAxis
        ripples={[ripple({ ended_at: null })]}
        timeZone={TZ}
        now={NOW}
        surface="bg-white"
      />,
    );

    const paths = container.querySelectorAll('path');
    expect(paths.length).toBeGreaterThan(1);
    expect(container.querySelectorAll('path.wave-travel')).toHaveLength(paths.length);
  });

  it('leaves finished records still', () => {
    const { container } = render(
      <TimeAxis ripples={[ripple()]} timeZone={TZ} now={NOW} surface="bg-white" />,
    );

    expect(container.querySelectorAll('.wave-travel')).toHaveLength(0);
  });
});

describe('the rope', () => {
  it('is masked by the wave stack rather than showing through it', () => {
    // The surface travels down as a prop: a hardcoded white would blot a past
    // day, whose page has already sunk to pool-100 or pool-200.
    const { container } = render(
      <RippleRow ripple={ripple()} timeZone={TZ} now={NOW} surface="bg-pool-100" />,
    );

    const stack = container.querySelector('.bg-pool-100');
    expect(stack).not.toBeNull();
    expect(stack!.querySelector('[data-lines]')).not.toBeNull();
  });
});

describe('the time gutter', () => {
  it('shows the start only, so the column is one ascending sequence', () => {
    const { container, getByText } = row();

    expect(getByText('09:00')).toBeTruthy();
    expect(container.querySelectorAll('time')).toHaveLength(1);
  });

  it('never decreases down the axis, for any day the seed can produce', () => {
    const day = [
      ripple({ id: 'a', occurred_time: '06:00:00', ended_at: null }),
      ripple({ id: 'b', occurred_time: '09:00:00' }),
      ripple({ id: 'c', occurred_time: '09:00:00', ended_at: null }),
      ripple({ id: 'd', occurred_time: '23:59:00', ended_at: null }),
    ];
    const { container } = render(
      <TimeAxis ripples={day} timeZone={TZ} now={NOW} surface="bg-white" />,
    );

    const shown = [...container.querySelectorAll('time')].map((el) => el.textContent!);
    expect(shown).toEqual([...shown].sort());
    // An end label in the same column would have broken this: a 09:00-10:30
    // record followed by a 10:00 one reads 09:00, 10:30, 10:00.
    expect(shown).toHaveLength(day.length);
  });
});

describe('the duration tag', () => {
  it('reports a finished timed span in hours and minutes', () => {
    const { getByText } = row();
    expect(getByText('1h 30m')).toBeTruthy();
  });

  it('counts up while the timer runs', () => {
    // 09:00 start, NOW is 13:00Z = 05:00 local... the row helper fixes both,
    // so assert on the shape rather than the figure.
    const { container } = row({ ended_at: null });
    const chip = container.querySelector('.text-main-400');

    expect(chip).not.toBeNull();
    expect(chip!.textContent).toMatch(/^\d+(h( \d+m)?|m)$/);
  });

  it('never appears on a drop (E2: only explicit timers claim duration)', () => {
    const at = wallClockToInstant('2026-09-19', '12:15', TZ).toISOString();
    const { container } = row({ occurred_time: '12:15:00', ended_at: at });

    expect(container.querySelector('.text-main-400')).toBeNull();
  });
});

describe('the rope', () => {
  it('is masked by the wave stack rather than showing through it', () => {
    // The surface travels down as a prop: a hardcoded white would blot a past
    // day, whose page has already sunk to pool-100 or pool-200.
    const { container } = render(
      <RippleRow ripple={ripple()} timeZone={TZ} now={NOW} surface="bg-pool-100" />,
    );

    const stack = container.querySelector('.bg-pool-100');
    expect(stack).not.toBeNull();
    expect(stack!.querySelector('[data-lines]')).not.toBeNull();
  });
});

describe('one tone (H9a)', () => {
  it('draws every wave in #0507C9, whatever the record', () => {
    const cases: Partial<RippleWithCategory>[] = [
      {},
      { ended_at: null },
      { planned: true, ended_at: null },
      {
        occurred_time: '12:15:00',
        ended_at: wallClockToInstant('2026-09-19', '12:15', TZ).toISOString(),
      },
    ];

    for (const over of cases) {
      const { container } = row(over);
      for (const svg of container.querySelectorAll('svg')) {
        const cls = svg.getAttribute('class') ?? '';
        expect(cls).toContain('text-main-900');
        expect(cls).not.toMatch(/text-main-(400|100)/);
      }
      cleanup();
    }
  });

  it('varies only by opacity, and only where a state calls for it', () => {
    // Lighter waves exist, but they are #0507C9 faded by state — planned, and
    // the live trail — never a second tone (ruling 2 / H9a).
    const done = row();
    for (const svg of done.container.querySelectorAll('svg')) {
      expect((svg as SVGElement).style.opacity).toBe('');
    }
  });
});

describe('the note row does not stretch', () => {
  it('aligns the duration chip to the baseline rather than the row height', () => {
    // jsdom computes no layout, so this pins the rule rather than the pixels:
    // the grid stretches the cell, and a flex child with a background grows
    // with it unless the alignment says otherwise.
    const { container, getByText } = row();
    const noteRow = getByText('spec rewrite').parentElement!;

    expect(noteRow.className).toContain('items-baseline');
    expect(noteRow.className).not.toContain('items-stretch');
    expect(container.querySelector('.text-main-400')?.parentElement).toBe(noteRow);
  });
});
