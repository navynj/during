import { describe, expect, it } from 'vitest';

import {
  earliestYear,
  groupByLane,
  monthCounts,
  monthSeats,
  monthlyTitle,
  monthsOfYear,
  ROPE_ORDER,
  scrubberMonths,
  seatsByLane,
  sessionRange,
  sessionSeats,
  type Session,
} from '@/features/sessions/shelves';
import { summarizeSplash, type Splash, type SplashBlock } from '@/features/splash/summary';
import type { MyCategory } from '@/lib/queries/profile';

const TZ = 'America/Vancouver';
const NOW = new Date('2026-09-25T20:00:00.000Z');
const TODAY = '2026-09-25';

function lane(id: string, name: string, position: number): MyCategory {
  return {
    id,
    user_id: 'a1',
    name,
    icon: '🌊',
    default_mode: 'drop',
    position,
    created_at: '2026-01-01T00:00:00Z',
  };
}
const PLACE = lane('c-place', 'Place', 0);
const FOOD = lane('c-food', 'Food', 1);
const DAY = lane('c-day', 'Day', 2);

function block(id: string, day: string, category = 'c-day'): SplashBlock {
  return {
    id,
    category_id: category,
    note: id,
    occurred_on: day,
    occurred_time: null,
    created_at: `${day}T16:00:00.000Z`,
  };
}

function post(id: string, blocks: SplashBlock[], over: Partial<Splash> = {}) {
  const row: Splash = {
    id,
    owner_id: 'a1',
    title: id,
    declared_start: null,
    declared_end: null,
    declared_lane_id: null,
    session_id: null,
    pinned_at: null,
    pool_id: null,
    type: 'free',
    prompt: null,
    ends_at: null,
    created_at: '2026-09-01T16:00:00.000Z',
    ...over,
  };
  return summarizeSplash(row, blocks, TZ, NOW);
}

const sepEarly = post('early', [block('e', '2026-09-03')]);
const sepLate = post('late', [block('l', '2026-09-20')]);
const spanning = post('span', [block('s1', '2026-08-30'), block('s2', '2026-09-02')]);
const aug = post('aug', [block('a', '2026-08-10', 'c-place')], { declared_lane_id: 'c-place' });

describe('a month’s shelf (H21d, H21e)', () => {
  it('lays its posts oldest first in strict coalesced-key order', () => {
    const seats = monthSeats([sepLate, sepEarly, spanning, aug], '2026-09', TZ);
    expect(seats.map((s) => s.splash.id)).toEqual(['span', 'early', 'late']);
    expect(seats.map((s) => s.date)).toEqual(['2026-09-02', '2026-09-03', '2026-09-20']);
  });

  it('shelves a spanning post in both months, at its latest block in each', () => {
    const august = monthSeats([sepLate, sepEarly, spanning, aug], '2026-08', TZ);
    expect(august.map((s) => s.splash.id)).toEqual(['aug', 'span']);
    expect(august.find((s) => s.splash.id === 'span')!.date).toBe('2026-08-30');
    expect(monthCounts([sepLate, sepEarly, spanning, aug], TZ)).toEqual(
      new Map([
        ['2026-08', 2],
        ['2026-09', 3],
      ]),
    );
  });

  it('breaks a tie on the later-made post', () => {
    const a = post('a', [block('x', '2026-09-03')], { created_at: '2026-09-03T16:00:00Z' });
    const b = post('b', [block('y', '2026-09-03')], { created_at: '2026-09-03T17:00:00Z' });
    expect(monthSeats([b, a], '2026-09', TZ).map((s) => s.splash.id)).toEqual(['a', 'b']);
  });
});

describe('the scrubber', () => {
  it('runs newest first from the current month back to the earliest shelved one, empties included', () => {
    const june = post('june', [block('j', '2026-06-04')]);
    expect(scrubberMonths([june, sepLate], TODAY, TZ)).toEqual([
      '2026-09',
      '2026-08',
      '2026-07',
      '2026-06',
    ]);
    expect(scrubberMonths([], TODAY, TZ)).toEqual(['2026-09']);
  });

  it('reaches past the current month when a post is dated ahead', () => {
    const ahead = post('ahead', [block('f', '2026-10-02')]);
    expect(scrubberMonths([ahead], TODAY, TZ)).toEqual(['2026-10', '2026-09']);
  });

  it('knows the earliest year, and the months of a year up to now', () => {
    const old = post('old', [block('o', '2024-12-25')]);
    expect(earliestYear([old], TODAY, TZ)).toBe(2024);
    expect(earliestYear([], TODAY, TZ)).toBe(2026);
    expect(monthsOfYear(2026, TODAY)).toHaveLength(9);
    expect(monthsOfYear(2025, TODAY)).toHaveLength(12);
    expect(monthsOfYear(2026, TODAY)[8]).toBe('2026-09');
  });
});

describe('lane rows (Home)', () => {
  it('seats every post once, on its lane\u2019s row, rows in lane order, newest first along the rope', () => {
    const mixed = post('mixed', [
      block('m1', '2026-09-05', 'c-place'),
      block('m2', '2026-09-06', 'c-food'),
    ]);
    const seats = monthSeats([mixed, sepEarly, sepLate, aug], '2026-09', TZ);
    const { rows, orphans } = seatsByLane(seats, [PLACE, FOOD, DAY]);
    expect(ROPE_ORDER).toBe('newest-first');
    expect(rows.map((r) => r.lane.name)).toEqual(['Place', 'Food', 'Day']);
    // `mixed` took Place once and Food once; the later-written block wins the tie.
    expect(rows[1].seats.map((s) => s.splash.id)).toEqual(['mixed']);
    expect(rows[2].seats.map((s) => s.splash.id)).toEqual(['late', 'early']);
    expect(orphans).toEqual([]);
    expect(rows.flatMap((r) => r.seats).length + orphans.length).toBe(seats.length);
  });

  it('seats by the declared lane where one is declared: laneIds[0] is that lane', () => {
    const declared = post('decl', [block('d', '2026-09-10', 'c-day')], {
      declared_lane_id: 'c-place',
    });
    expect(declared.declaredLaneId).toBe('c-place');
    expect(declared.laneIds[0]).toBe('c-place');
    const { rows } = seatsByLane(monthSeats([declared], '2026-09', TZ), [PLACE, FOOD, DAY]);
    expect(rows[0].seats.map((s) => s.splash.id)).toEqual(['decl']);
    expect(rows[2].seats).toEqual([]);
  });

  it('keeps a post on no lane of mine apart, as an orphan', () => {
    const stray = post('stray', [block('x', '2026-09-09', 'c-gone')]);
    const { rows, orphans } = seatsByLane(monthSeats([stray], '2026-09', TZ), [PLACE, FOOD, DAY]);
    expect(rows.every((r) => r.seats.length === 0)).toBe(true);
    expect(orphans.map((s) => s.splash.id)).toEqual(['stray']);
  });
});

describe('a custom shelf (H21e)', () => {
  const custom: Session = {
    id: 'ss1',
    owner_id: 'a1',
    kind: 'custom',
    title: 'Trips',
    month: null,
    declared_start: null,
    declared_end: null,
    lane_id: null,
    created_at: '2026-09-01T00:00:00Z',
  };
  const trip = post('trip', [block('t', '2026-08-02', 'c-place')], { session_id: 'ss1' });
  const meal = post('meal', [block('m', '2026-08-20', 'c-food')], { session_id: 'ss1' });
  const noon = post('noon', [block('n', '2026-09-20')], { session_id: 'ss1' });
  const seats = sessionSeats([noon, meal, trip, sepLate], 'ss1', TZ);

  it('lays its posts oldest first and derives its range from them', () => {
    expect(seats.map((s) => s.splash.id)).toEqual(['trip', 'meal', 'noon']);
    expect(sessionRange(custom, seats)).toEqual({ start: '2026-08-02', end: '2026-09-20' });
    expect(
      sessionRange({ ...custom, declared_start: '2026-08-01', declared_end: null }, seats),
    ).toEqual({
      start: '2026-08-01',
      end: '2026-08-01',
    });
  });

  it('groups lane-first, in lane order, the unlaned last', () => {
    const groups = groupByLane(seats, [PLACE, FOOD, DAY], custom);
    expect(groups.map((g) => g.lane?.name ?? null)).toEqual(['Place', 'Food', 'Day']);
    expect(groups[0].seats[0].splash.id).toBe('trip');
  });

  it('renders flat when the shelf declares a lane, or its posts share one', () => {
    expect(groupByLane(seats, [PLACE, FOOD, DAY], { lane_id: 'c-place' })).toHaveLength(1);
    const flat = groupByLane(seats.slice(0, 1), [PLACE, FOOD, DAY], custom);
    expect(flat).toEqual([{ lane: null, seats: seats.slice(0, 1) }]);
  });

  it('finds a month’s title only once a row exists', () => {
    const titled: Session = {
      ...custom,
      id: 'm',
      kind: 'monthly',
      title: 'The month',
      month: '2026-09-01',
    };
    expect(monthlyTitle([titled, custom], '2026-09')?.title).toBe('The month');
    expect(monthlyTitle([titled, custom], '2026-08')).toBeNull();
  });
});
