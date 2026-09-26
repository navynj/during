import { describe, expect, it } from 'vitest';

import { buildFlow, monthLabel, monthSections } from '@/features/home/flow';
import {
  dominantCategory,
  formatRange,
  isSplashOpen,
  OPEN_WINDOW_HOURS,
  summarizeSplash,
  type Splash,
} from '@/features/splash/summary';
import { dayOf, flowInstant, isFutureDated, monthOf, sortNewestFirst } from '@/lib/flow-key';
import type { RippleWithCategory } from '@/lib/queries/ripples';

const TZ = 'America/Vancouver';
const NOW = new Date('2026-09-25T20:00:00.000Z');

function ripple(over: Partial<RippleWithCategory> = {}): RippleWithCategory {
  return {
    id: 'r',
    author_id: 'a1',
    category_id: 'c-day',
    note: 'fixture',
    media: [],
    occurred_on: null,
    occurred_time: null,
    started_at: null,
    ended_at: null,
    planned: false,
    participants: [],
    created_at: '2026-09-25T16:00:00.000Z',
    parent_ripple_id: null,
    splash_id: null,
    category: { name: 'Day', icon: '🖋' },
    ...over,
  };
}

function splash(over: Partial<Splash> = {}): Splash {
  return {
    id: 's1',
    owner_id: 'a1',
    title: 'Whistler',
    declared_start: null,
    declared_end: null,
    lane_ids: [],
    pool_id: null,
    type: 'free',
    prompt: null,
    ends_at: null,
    created_at: '2026-09-01T16:00:00.000Z',
    ...over,
  };
}

describe("the diary's own order (H20c)", () => {
  it('flows unannotated fragments in posting order, newest first', () => {
    const sorted = sortNewestFirst(
      [
        ripple({ id: 'first', created_at: '2026-09-25T10:00:00Z' }),
        ripple({ id: 'third', created_at: '2026-09-25T12:00:00Z' }),
        ripple({ id: 'second', created_at: '2026-09-25T11:00:00Z' }),
      ],
      TZ,
    );
    expect(sorted.map((r) => r.id)).toEqual(['third', 'second', 'first']);
  });

  it('moves an annotated fragment to where it happened, and back when the annotation goes', () => {
    const backfill = ripple({
      id: 'backfill',
      occurred_on: '2026-08-21',
      created_at: '2026-09-25T16:00:00Z',
    });
    const posted = ripple({ id: 'posted', created_at: '2026-09-20T16:00:00Z' });

    expect(sortNewestFirst([backfill, posted], TZ).map((r) => r.id)).toEqual([
      'posted',
      'backfill',
    ]);
    expect(monthOf(backfill, TZ)).toBe('2026-08');

    const plain = { ...backfill, occurred_on: null };
    expect(sortNewestFirst([plain, posted], TZ).map((r) => r.id)).toEqual(['backfill', 'posted']);
    expect(monthOf(plain, TZ)).toBe('2026-09');
  });

  it('sorts a span by its start and a date-only fragment at its day’s end', () => {
    const span = ripple({
      id: 'span',
      occurred_on: '2026-09-24',
      occurred_time: '19:00:00',
      ended_at: '2026-09-25T04:00:00Z',
    });
    const dateOnly = ripple({ id: 'date-only', occurred_on: '2026-09-24' });
    const late = ripple({
      id: 'late',
      occurred_on: '2026-09-24',
      occurred_time: '23:00:00',
      ended_at: '2026-09-25T06:00:00Z',
    });

    expect(sortNewestFirst([span, dateOnly, late], TZ).map((r) => r.id)).toEqual([
      'date-only',
      'late',
      'span',
    ]);
    expect(flowInstant(span, TZ)).toBe(Date.parse('2026-09-25T02:00:00Z'));
  });

  it('breaks a tie on created_at, later first', () => {
    const a = ripple({ id: 'a', occurred_on: '2026-09-24', created_at: '2026-09-25T10:00:00Z' });
    const b = ripple({ id: 'b', occurred_on: '2026-09-24', created_at: '2026-09-25T11:00:00Z' });
    expect(sortNewestFirst([a, b], TZ).map((r) => r.id)).toEqual(['b', 'a']);
  });
});

describe("months are cut in the author's timezone", () => {
  it('keeps a late-night fragment in the month its author was living', () => {
    // 06:30Z on Oct 1 is 23:30 on Sep 30 in Vancouver.
    const fragment = ripple({ created_at: '2026-10-01T06:30:00Z' });
    expect(monthOf(fragment, TZ)).toBe('2026-09');
    expect(monthOf(fragment, 'Asia/Seoul')).toBe('2026-10');
    expect(dayOf(fragment, TZ)).toBe('2026-09-30');
  });

  it('sections the flow by that month, newest first', () => {
    const rows = buildFlow(
      [
        ripple({ id: 'sep', created_at: '2026-10-01T06:30:00Z' }),
        ripple({ id: 'oct', created_at: '2026-10-02T06:30:00Z' }),
        ripple({ id: 'aug', occurred_on: '2026-08-21', created_at: '2026-10-02T07:00:00Z' }),
      ],
      [],
      TZ,
    );
    const sections = monthSections(rows, TZ);
    expect(sections.map((s) => s.month)).toEqual(['2026-10', '2026-09', '2026-08']);
    expect(sections[2].rows[0].id).toBe('aug');
    expect(monthLabel('2026-08')).toBe('2026 AUG');
  });

  it('knows a fragment placed ahead of today', () => {
    expect(isFutureDated(ripple({ occurred_on: '2026-09-28' }), TZ, '2026-09-25')).toBe(true);
    expect(isFutureDated(ripple(), TZ, '2026-09-25')).toBe(false);
  });
});

describe('a splash in the flow (H20d, H20e)', () => {
  const members = [
    ripple({
      id: 'm1',
      splash_id: 's1',
      category_id: 'c-place',
      created_at: '2026-09-10T16:00:00Z',
    }),
    ripple({
      id: 'm2',
      splash_id: 's1',
      category_id: 'c-place',
      created_at: '2026-09-20T16:00:00Z',
    }),
    ripple({
      id: 'm3',
      splash_id: 's1',
      category_id: 'c-mood',
      created_at: '2026-09-21T16:00:00Z',
    }),
  ];

  it('sits at its latest fragment’s point, just above it', () => {
    const summary = summarizeSplash(splash(), members, TZ, NOW);
    const rows = buildFlow(
      [...members, ripple({ id: 'loose', created_at: '2026-09-22T16:00:00Z' })],
      [summary],
      TZ,
    );
    expect(rows.map((r) => r.id)).toEqual(['loose', 's1', 'm3', 'm2', 'm1']);
  });

  it('sits at its own creation while empty', () => {
    const summary = summarizeSplash(splash({ created_at: '2026-09-23T16:00:00Z' }), [], TZ, NOW);
    expect(summary.flowKey).toBe(Date.parse('2026-09-23T16:00:00Z'));
    expect(summary.range).toBeNull();
    expect(summary.dominantCategoryId).toBeNull();
  });

  it('derives its range first-to-last, or takes the declared one', () => {
    expect(summarizeSplash(splash(), members, TZ, NOW).range).toEqual({
      start: '2026-09-10',
      end: '2026-09-21',
    });
    const declared = summarizeSplash(
      splash({ declared_start: '2026-08-17', declared_end: '2026-08-20' }),
      members,
      TZ,
      NOW,
    );
    expect(declared.range).toEqual({ start: '2026-08-17', end: '2026-08-20' });
    expect(declared.declared).toBe(true);
    expect(formatRange(declared.range)).toBe('2026. 8. 17 ~ 2026. 8. 20');
    expect(formatRange({ start: '2026-08-17', end: '2026-08-17' })).toBe('2026. 8. 17');
  });

  it('shows a declared lane over the derived one, and the dominant lane otherwise', () => {
    expect(summarizeSplash(splash(), members, TZ, NOW).dominantCategoryId).toBe('c-place');
    expect(
      summarizeSplash(splash({ lane_ids: ['c-mood'] }), members, TZ, NOW).dominantCategoryId,
    ).toBe('c-mood');
    // A tie goes to the most recently posted.
    expect(dominantCategory(members.slice(1))).toBe('c-mood');
  });

  it('is open within 48 hours of its last fragment, or while empty', () => {
    const edge = new Date(NOW.getTime() - OPEN_WINDOW_HOURS * 60 * 60 * 1000);
    expect(isSplashOpen(1, new Date(edge.getTime() + 1000).toISOString(), NOW)).toBe(true);
    expect(isSplashOpen(1, edge.toISOString(), NOW)).toBe(false);
    expect(isSplashOpen(0, null, NOW)).toBe(true);
    expect(summarizeSplash(splash(), members, TZ, NOW).open).toBe(false);
  });
});
