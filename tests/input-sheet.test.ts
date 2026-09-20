import { describe, expect, it } from 'vitest';

import {
  canRunTimer,
  emptyDraft,
  isPlanned,
  primaryCommit,
  type Draft,
} from '@/features/input-sheet/draft';
import type { MyCategory } from '@/lib/queries/profile';

const TZ = 'UTC';

function category(over: Partial<MyCategory> = {}): MyCategory {
  return {
    id: 'c1',
    user_id: 'u1',
    name: 'Focus',
    icon: '🔍',
    default_mode: 'timed',
    position: 0,
    created_at: '2026-01-01T00:00:00Z',
    ...over,
  };
}

function draft(over: Partial<Draft> = {}): Draft {
  return {
    categoryId: 'c1',
    note: '',
    time: '09:00',
    audience: 'everyone',
    parentRippleId: null,
    ...over,
  };
}

describe('the draft on first paint', () => {
  it('is completable: a category is chosen and the time is now', () => {
    // SPEC 6: a chip tap alone is a valid entry, so the sheet must open with
    // enough already filled in that Drop is meaningful.
    const d = emptyDraft([category(), category({ id: 'c2', name: 'Place' })], TZ, {});

    expect(d.categoryId).toBe('c1');
    expect(d.time).toMatch(/^\d{2}:\d{2}$/);
    expect(d.note).toBe('');
  });

  it('takes a prefill from whichever entry point opened it (E6)', () => {
    const cats = [category(), category({ id: 'c2', name: 'Place' })];

    expect(emptyDraft(cats, TZ, { categoryId: 'c2' }).categoryId).toBe('c2');
    expect(emptyDraft(cats, TZ, { time: '21:30' }).time).toBe('21:30');
  });

  it('starts as everyone, with lock one tap away rather than a separate toggle', () => {
    expect(emptyDraft([category()], TZ, {}).audience).toBe('everyone');
  });
});

describe('a future time makes it a plan', () => {
  it('is derived from the clock, not a toggle', () => {
    expect(isPlanned(draft({ time: '23:59' }), TZ)).toBe(true);
    expect(isPlanned(draft({ time: '00:00' }), TZ)).toBe(false);
  });

  it('disables the timer: a plan has not started', () => {
    expect(canRunTimer(draft({ time: '23:59' }), TZ)).toBe(false);
    expect(canRunTimer(draft({ time: '00:00' }), TZ)).toBe(true);
  });

  it('makes Drop the primary even for a timed category', () => {
    const cats = [category({ default_mode: 'timed' })];
    expect(primaryCommit(draft({ time: '23:59' }), cats, TZ)).toBe('drop');
    expect(primaryCommit(draft({ time: '00:00' }), cats, TZ)).toBe('timer');
  });
});

describe('for the whole day', () => {
  it('removes the time, which takes the record off the axis', () => {
    const d = draft({ time: null });

    expect(isPlanned(d, TZ)).toBe(false);
    // Nothing without a time can run a timer: there is no moment to run from.
    expect(canRunTimer(d, TZ)).toBe(false);
  });
});

describe('the category shapes the commit', () => {
  it('leads with Drop for a drop-default category (E1/E2)', () => {
    const cats = [category({ default_mode: 'drop' })];
    expect(primaryCommit(draft(), cats, TZ)).toBe('drop');
  });

  it('leads with Timer for a timed-default category', () => {
    expect(primaryCommit(draft(), [category({ default_mode: 'timed' })], TZ)).toBe('timer');
  });
});
