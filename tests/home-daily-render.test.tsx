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
  it('shows both ends of a timed record', () => {
    const { getByText } = row();
    expect(getByText('09:00')).toBeTruthy();
    expect(getByText('10:30')).toBeTruthy();
  });

  it('shows one time for a drop', () => {
    const at = wallClockToInstant('2026-09-19', '12:15', TZ).toISOString();
    const { container } = row({ occurred_time: '12:15:00', ended_at: at });

    expect(container.querySelectorAll('time')).toHaveLength(1);
  });

  it('shows one time while a timer runs', () => {
    const { container } = row({ ended_at: null });
    expect(container.querySelectorAll('time')).toHaveLength(1);
  });
});
