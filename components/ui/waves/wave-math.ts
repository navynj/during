/**
 * The wave grammar's arithmetic, kept pure so it can be reasoned about and
 * tested without a DOM. SPEC 7: waves are impressions (calm / some / lots),
 * never gauges — every number here is chosen to be legible at a glance, not
 * to be read back as a quantity.
 */

/**
 * Waves are always #0507C9. Vitality is carried by state, not by tone: past
 * is expressed by the section background sinking (law 1), not by draining the
 * color out of the wave itself.
 */
export const WAVE_COLOR_CLASS = 'text-main-900';

/** Where the record sits in time. */
export type WaveState = 'planned' | 'active' | 'done';

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

/**
 * Future fades (law 1). Opacity alone, not a dash: a dashed stroke at this
 * amplitude turns the wave into a dotted line and loses the wave entirely.
 */
export function stateOpacity(state: WaveState): number | undefined {
  return state === 'planned' ? 0.35 : undefined;
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
/** Constant pitch between lines: only the count varies with duration. */
export const WAVE_GAP = 2;
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

/** One full period: down then up. The travel loop shifts by exactly this. */
export const WAVE_WAVELENGTH = SEGMENT * 2;

/**
 * Path width for a line that travels horizontally inside its box.
 *
 * Wide enough to overflow a whole wavelength on the left and two on the
 * right, so neither round end cap can drift into view during the loop, and
 * snapped to an even number of segments so the path is exactly periodic —
 * without that, shifting by one wavelength would not land on an identical
 * shape and the loop would visibly jump.
 */
export function travellingWaveWidth(visibleWidth: number): number {
  const needed = visibleWidth + WAVE_WAVELENGTH * 3;
  const segments = Math.ceil((needed - INSET * 2) / SEGMENT);
  const evenSegments = segments % 2 === 0 ? segments : segments + 1;
  return evenSegments * SEGMENT + INSET * 2;
}

/** A bundle's rendered height, given constant pitch. */
export function bundleHeight(lines: number, gap: number = WAVE_GAP): number {
  return lines * WAVE_HEIGHT + Math.max(0, lines - 1) * gap;
}
