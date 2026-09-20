import {
  stateOpacity,
  travellingWaveWidth,
  waveLinePath,
  WAVE_COLOR_CLASS,
  WAVE_HEIGHT,
  WAVE_STROKE,
  WAVE_WAVELENGTH,
} from './wave-math';
import type { WaveMotion, WaveState } from './wave-math';

/** The export's width. Lanes cells and the timeline both use it. */
export const WAVE_WIDTH = 22;

const MOTION_CLASS: Record<WaveMotion, string> = {
  grow: 'wave-grow',
  travel: 'wave-travel',
};

export type WaveLineProps = {
  state?: WaveState;
  width?: number;
  className?: string;
  /** Omitted = still. Set by WaveBundle on an in-progress record. */
  motion?: WaveMotion;
  /**
   * Overridable because the export's 2px is drawn at the chip scale, and the
   * timeline wants a finer line at the same geometry. The path is unchanged:
   * only the pen changes, so the waveform stays the exported one.
   */
  strokeWidth?: number;
};

/**
 * A single wave line — one drop (SPEC 7: "drop = single wave line").
 *
 * Stroke only, no fill: the grammar is a line drawn on water, and a filled
 * shape reads as a block, which F3 rejected.
 */
export function WaveLine({
  state = 'done',
  width = WAVE_WIDTH,
  className = '',
  motion,
  strokeWidth = WAVE_STROKE,
}: WaveLineProps) {
  // A travelling line is drawn long and clipped by the viewBox, so the water
  // moves through a fixed window instead of the waveform being distorted.
  // A growing line needs no extra length: it scales what is already there.
  const travelling = motion === 'travel';
  const pathWidth = travelling ? travellingWaveWidth(width) : width;

  const path = (
    <path
      d={waveLinePath(pathWidth)}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      // Law 3: only living things move. Transform only — never layout.
      className={motion ? MOTION_CLASS[motion] : undefined}
    />
  );

  return (
    <svg
      width={width}
      height={WAVE_HEIGHT}
      viewBox={`0 0 ${width} ${WAVE_HEIGHT}`}
      fill="none"
      aria-hidden
      className={`${WAVE_COLOR_CLASS} ${className}`}
      style={{ opacity: stateOpacity(state) }}
    >
      {travelling ? (
        // Parked one wavelength left so the path overhangs both edges for the
        // whole loop; the animation then shifts it one more wavelength.
        <g transform={`translate(${-WAVE_WAVELENGTH} 0)`}>{path}</g>
      ) : (
        path
      )}
    </svg>
  );
}
