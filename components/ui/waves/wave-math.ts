/**
 * The wave grammar's arithmetic, kept pure so it can be reasoned about and
 * tested without a DOM. SPEC 7: waves are impressions (calm / some / lots),
 * never gauges — every number here is chosen to be legible at a glance, not
 * to be read back as a quantity.
 */

/**
 * One tone (H9a): vitality is carried by state, not by colour. What varies is
 * *contrast*, not tone — a wave is drawn in whatever reads against its ground,
 * #0507C9 on light surfaces and white on a live one (H15c). The surface sets
 * `--wave-ink`; no wave component takes a colour.
 */
export const WAVE_INK = 'var(--wave-ink)';

/** Still the ramp's own value, for anything that has to name it directly. */
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
 * The same law applied to a count of records rather than to a duration
 * (law 2): calm / some / lots, log-scaled, never a tally.
 *
 * Lanes cells are counts, so they cannot borrow `bundleLineCount` — four
 * records and a four-minute session are not the same impression. Capped
 * lower, too: a cell is a glance, and past four lines a matrix row starts to
 * look like a chart.
 */
export const MAX_IMPRESSION_LINES = 5;

export function impressionLineCount(count: number): number {
  if (!Number.isFinite(count) || count <= 0) return 0;
  return Math.min(MAX_IMPRESSION_LINES, Math.floor(Math.log2(count)) + 1);
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
/**
 * The drawn weight. Finer than the export's 2px: waves sit among 14px text on
 * the timeline, and the full-weight pen read louder than the notes beside it.
 * Only the pen — the path below is the exported geometry, untouched. The pen
 * does not scale with the preset: a deeper wave is a bigger wave, not a
 * heavier line.
 */
export const WAVE_STROKE = 1.5;
/** Constant pitch between lines: only the count varies with duration. */
export const WAVE_GAP = 2;

/**
 * How large the wave is drawn. `1` is the Figma export as pinned; `deep` is
 * the same path family at twice the amplitude and wavelength, for the live
 * surface — at full width the pinned geometry read flat, like ticker tape.
 * The shape is scaled, never redrawn.
 */
export const DEEP_SCALE = 2;

const MIDLINE = WAVE_HEIGHT / 2;
const CONTROL_OFFSET = 4 / 3;
const SEGMENT = 5;
/**
 * The export's end inset, which happens to be half of the 2px pen it was
 * drawn with. It is part of the geometry, not a function of the current
 * stroke: deriving it would move the path every time the weight changed.
 */
const INSET = 1;

/** One full period: down then up. The travel loop shifts by exactly this. */
export const WAVE_WAVELENGTH = SEGMENT * 2;

export function waveHeight(scale = 1): number {
  return WAVE_HEIGHT * scale;
}

export function waveWavelength(scale = 1): number {
  return WAVE_WAVELENGTH * scale;
}

/** Figma writes 5 decimals; matching that keeps diffs against the export readable. */
function round(value: number): string {
  return String(Number(value.toFixed(5)));
}

/**
 * One wave line as an SVG path.
 *
 * The geometry is taken from the Figma export, not approximated: four cubic
 * segments of 5px, control points at a third and two thirds of each segment
 * offset 4/3 from the midline, alternating below then above. A cubic with both
 * controls at the same offset peaks at 3/4 of it, so the visible amplitude is
 * 1px and the stroke lands inside the 4px box.
 *
 * `scale` multiplies that whole family — segment, midline and control offset
 * together — so a deep wave is the same curve enlarged rather than a second
 * shape. The end inset does not scale: it clears the round cap, which is a
 * property of the pen.
 */
export function waveLinePath(width: number, scale = 1): string {
  const segment = SEGMENT * scale;
  const midline = MIDLINE * scale;
  const controlOffset = CONTROL_OFFSET * scale;

  const usable = Math.max(segment, width - INSET * 2);
  const count = Math.max(1, Math.round(usable / segment));
  const step = usable / count;

  let path = `M${round(INSET)} ${round(midline)}`;
  for (let i = 0; i < count; i += 1) {
    const start = INSET + i * step;
    // The first segment bulges down, matching the export.
    const controlY = midline + (i % 2 === 0 ? controlOffset : -controlOffset);
    path +=
      `C${round(start + step / 3)} ${round(controlY)}` +
      ` ${round(start + (2 * step) / 3)} ${round(controlY)}` +
      ` ${round(start + step)} ${round(midline)}`;
  }
  return path;
}

/**
 * Path width for a line that travels horizontally inside its box.
 *
 * Wide enough to overflow a whole wavelength on the left and two on the
 * right, so neither round end cap can drift into view during the loop, and
 * snapped to an even number of segments so the path is exactly periodic —
 * without that, shifting by one wavelength would not land on an identical
 * shape and the loop would visibly jump.
 */
export function travellingWaveWidth(visibleWidth: number, scale = 1): number {
  const segment = SEGMENT * scale;
  const needed = visibleWidth + waveWavelength(scale) * 3;
  const segments = Math.ceil((needed - INSET * 2) / segment);
  const evenSegments = segments % 2 === 0 ? segments : segments + 1;
  return evenSegments * segment + INSET * 2;
}

/** A bundle's rendered height, given constant pitch. */
export function bundleHeight(lines: number, gap: number = WAVE_GAP): number {
  return lines * WAVE_HEIGHT + Math.max(0, lines - 1) * gap;
}
