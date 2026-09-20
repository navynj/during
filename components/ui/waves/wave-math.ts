/**
 * The wave grammar's arithmetic, kept pure so it can be reasoned about and
 * tested without a DOM. SPEC 7: waves are impressions (calm / some / lots),
 * never gauges — every number here is chosen to be legible at a glance, not
 * to be read back as a quantity.
 */

/** Content vitality (SPEC 7). Callers decide the mapping; S2 owns that. */
export type WaveTone = 'live' | 'recent' | 'settled';

/** Where the record sits in time. `planned` is law 4's "dotted = not yet". */
export type WaveState = 'planned' | 'active' | 'done';

const TONE_CLASS: Record<WaveTone, string> = {
  live: 'text-main-900',
  recent: 'text-main-400',
  settled: 'text-main-100',
};

/** Waves stroke in `currentColor`, so tone is just a text color. */
export function toneClass(tone: WaveTone): string {
  return TONE_CLASS[tone];
}

/** SPEC 7: cap 8 to 10 lines. Ten, so 8h is distinguishable from 4h. */
export const MAX_BUNDLE_LINES = 10;
export const MIN_BUNDLE_LINES = 1;

/** The duration at which a bundle is still two lines: below it, one. */
const BASE_MINUTES = 15;
/** Lines added per doubling of duration. */
const LINES_PER_DOUBLING = 1.5;

/**
 * Line count for a timed Ripple, log-scaled on duration.
 *
 *   5m -> 1    15m -> 2    25m -> 3    1h -> 5    2h -> 7    4h -> 8    8h -> 10
 *
 * Log-scaled because the difference between 15 and 30 minutes matters to the
 * eye and the difference between 6 and 8 hours does not; the cap lands at 8h,
 * so a working day and an all-nighter both read simply as "lots".
 */
export function bundleLineCount(durationMinutes: number): number {
  if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) return MIN_BUNDLE_LINES;

  const lines = Math.round(LINES_PER_DOUBLING * Math.log2(durationMinutes / BASE_MINUTES) + 2);
  return Math.min(MAX_BUNDLE_LINES, Math.max(MIN_BUNDLE_LINES, lines));
}

/** Dotted = not yet (law 4). Returned as a dasharray, not a border style. */
export function strokeDasharray(state: WaveState): string | undefined {
  return state === 'planned' ? '2 2' : undefined;
}

/** Future fades; past sinks by tone, never by opacity (law 1). */
export function stateOpacity(state: WaveState): number | undefined {
  return state === 'planned' ? 0.45 : undefined;
}

/**
 * One wave line as an SVG path.
 *
 * The geometry is taken from the Figma export, not approximated: four cubic
 * segments of 5px, control points at a third and two thirds of each segment
 * offset 4/3 from the midline, alternating below then above. A cubic with both
 * controls at the same offset peaks at 3/4 of it, so the visible amplitude is
 * 1px and a 2px round stroke lands exactly inside the 4px box.
 *
 * The 1px inset at each end is what keeps the round cap from clipping.
 */
export const WAVE_HEIGHT = 4;
export const WAVE_STROKE = 2;
const MIDLINE = WAVE_HEIGHT / 2;
const CONTROL_OFFSET = 4 / 3;
const SEGMENT = 5;
const INSET = WAVE_STROKE / 2;

/** Figma writes 5 decimals; matching that keeps diffs against the export readable. */
function round(value: number): string {
  return String(Number(value.toFixed(5)));
}

export function waveLinePath(width: number): string {
  const usable = Math.max(SEGMENT, width - INSET * 2);
  const count = Math.max(1, Math.round(usable / SEGMENT));
  const segment = usable / count;

  let path = `M${round(INSET)} ${round(MIDLINE)}`;
  for (let i = 0; i < count; i += 1) {
    const start = INSET + i * segment;
    // The first segment bulges down, matching the export.
    const controlY = MIDLINE + (i % 2 === 0 ? CONTROL_OFFSET : -CONTROL_OFFSET);
    path +=
      `C${round(start + segment / 3)} ${round(controlY)}` +
      ` ${round(start + (2 * segment) / 3)} ${round(controlY)}` +
      ` ${round(start + segment)} ${round(MIDLINE)}`;
  }
  return path;
}
