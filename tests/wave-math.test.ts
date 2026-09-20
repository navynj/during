import { describe, expect, it } from 'vitest';

import {
  bundleLineCount,
  MAX_BUNDLE_LINES,
  stateOpacity,
  strokeDasharray,
  toneClass,
  waveLinePath,
} from '@/components/ui/waves';

/** The path Figma exported, which the generator has to reproduce exactly. */
const FIGMA_PATH =
  'M1 2C2.66667 3.33333 4.33333 3.33333 6 2C7.66667 0.666667 9.33333 0.666667 11 2' +
  'C12.6667 3.33333 14.3333 3.33333 16 2C17.6667 0.666667 19.3333 0.666667 21 2';

function numbers(path: string): number[] {
  return (path.match(/-?\d+(\.\d+)?/g) ?? []).map(Number);
}

describe('bundle line count', () => {
  it('scales on the log curve', () => {
    // More waves = more happened, at impression level (law 2).
    expect(bundleLineCount(25)).toBe(3);
    expect(bundleLineCount(60)).toBe(5);
    expect(bundleLineCount(120)).toBe(7);
  });

  it('caps so a long day reads as "lots", not as a quantity', () => {
    expect(bundleLineCount(480)).toBe(MAX_BUNDLE_LINES);
    expect(bundleLineCount(1440)).toBe(MAX_BUNDLE_LINES);
    // The cap is the point: 8h and 24h are indistinguishable by design.
    expect(bundleLineCount(1440)).toBe(bundleLineCount(480));
  });

  it('never renders less than one line', () => {
    expect(bundleLineCount(1)).toBe(1);
    expect(bundleLineCount(0)).toBe(1);
    expect(bundleLineCount(-30)).toBe(1);
    expect(bundleLineCount(Number.NaN)).toBe(1);
  });

  it('rises monotonically', () => {
    const counts = [5, 15, 25, 60, 120, 240, 480].map(bundleLineCount);
    for (let i = 1; i < counts.length; i += 1) {
      expect(counts[i]).toBeGreaterThanOrEqual(counts[i - 1]);
    }
  });
});

describe('wave geometry', () => {
  it('reproduces the Figma export at its own width', () => {
    const generated = numbers(waveLinePath(22));
    const reference = numbers(FIGMA_PATH);

    expect(generated).toHaveLength(reference.length);
    generated.forEach((value, i) => expect(value).toBeCloseTo(reference[i], 4));
  });

  it('insets both ends so the round cap is not clipped', () => {
    expect(waveLinePath(22).startsWith('M1 2')).toBe(true);
    expect(waveLinePath(22).endsWith('21 2')).toBe(true);
  });

  it('keeps the same segment density at other widths', () => {
    // 44px is twice 22, so it should carry twice the segments: eight cubics.
    expect((waveLinePath(44).match(/C/g) ?? []).length).toBe(8);
    expect((waveLinePath(22).match(/C/g) ?? []).length).toBe(4);
  });
});

describe('tone and state', () => {
  it('maps tone to the main ramp', () => {
    expect(toneClass('live')).toBe('text-main-900');
    expect(toneClass('recent')).toBe('text-main-400');
    expect(toneClass('settled')).toBe('text-main-100');
  });

  it('renders planned dotted and faded, and nothing else', () => {
    expect(strokeDasharray('planned')).toBe('2 2');
    expect(stateOpacity('planned')).toBeLessThan(1);

    for (const state of ['active', 'done'] as const) {
      expect(strokeDasharray(state)).toBeUndefined();
      expect(stateOpacity(state)).toBeUndefined();
    }
  });
});
