import { describe, expect, it } from 'vitest';

import { spanVerdict } from '@/features/input-sheet/span-rules';

const NOON = Date.UTC(2027, 6, 8, 12, 0);
const h = (hours: number): number => Date.UTC(2027, 6, 8, hours, 0);

describe('where a typed span is allowed to sit (H18)', () => {
  it('accepts one that has finished', () => {
    expect(spanVerdict(h(9), h(11), NOON)).toBe('past');
  });

  it('accepts one that has not begun', () => {
    expect(spanVerdict(h(14), h(16), NOON)).toBe('future');
  });

  it('refuses one still running: the present is written by the Timer', () => {
    expect(spanVerdict(h(11), h(13), NOON)).toBe('straddles');
  });

  it('counts a span beginning exactly now as running, not planned', () => {
    // It is a session starting. Typing its end would bill the author for time
    // they have not spent yet.
    expect(spanVerdict(NOON, h(13), NOON)).toBe('straddles');
  });

  it('lets a span end exactly now: that one is over', () => {
    expect(spanVerdict(h(11), NOON, NOON)).toBe('past');
  });

  it('refuses an end before its own start', () => {
    expect(spanVerdict(h(11), h(10), NOON)).toBe('backwards');
  });

  it('has nothing to say about a record with no end', () => {
    expect(spanVerdict(h(9), null, NOON)).toBe('none');
  });
});
