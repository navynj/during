import { describe, expect, it } from 'vitest';

import {
  bundleHeight,
  bundleLineCount,
  MAX_BUNDLE_LINES,
  stateOpacity,
  WAVE_COLOR_CLASS,
  travellingWaveWidth,
  WAVE_GAP,
  WAVE_HEIGHT,
  WAVE_WAVELENGTH,
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

describe('state', () => {
  it('is the only vitality channel — every wave is one color', () => {
    expect(WAVE_COLOR_CLASS).toBe('text-main-900');
  });

  it('fades planned by opacity, never by a dash', () => {
    // A dash at 1px amplitude turns the wave into a dotted line and the wave
    // stops reading as a wave at all.
    expect(stateOpacity('planned')).toBeLessThan(1);
    expect(stateOpacity('planned')).toBeGreaterThan(0);
  });

  it('leaves active and done at full strength', () => {
    expect(stateOpacity('active')).toBeUndefined();
    expect(stateOpacity('done')).toBeUndefined();
  });
});

describe('bundle height', () => {
  it('grows by a constant pitch, so only the count varies', () => {
    const one = bundleHeight(1);
    const two = bundleHeight(2);
    const three = bundleHeight(3);

    expect(one).toBe(WAVE_HEIGHT);
    expect(two - one).toBe(WAVE_HEIGHT + WAVE_GAP);
    expect(three - two).toBe(two - one);
  });
});

describe('travelling line geometry', () => {
  it('is exactly periodic, so the loop has no seam', () => {
    // An even segment count means shifting by one wavelength lands on an
    // identical shape; an odd one would jump every cycle.
    const width = travellingWaveWidth(22);
    const segments = (waveLinePath(width).match(/C/g) ?? []).length;

    expect(segments % 2).toBe(0);
  });

  it('overhangs both edges for the whole shift', () => {
    const visible = 22;
    const width = travellingWaveWidth(visible);

    // Parked one wavelength left, then shifted one more: the path must still
    // cover the window at the end of the loop, or a round cap drifts in.
    expect(width).toBeGreaterThanOrEqual(visible + WAVE_WAVELENGTH * 3);
  });

  it('keeps 5px segments at the widened size', () => {
    const path = waveLinePath(travellingWaveWidth(22));
    const xs = (path.match(/C[\d.]+ /g) ?? []).map((m) => Number(m.slice(1)));

    // First control point sits a third into the first 5px segment.
    expect(xs[0]).toBeCloseTo(1 + 5 / 3, 4);
  });
});
