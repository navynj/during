import {
  stateOpacity,
  waveLinePath,
  WAVE_COLOR_CLASS,
  WAVE_HEIGHT,
  WAVE_STROKE,
} from './wave-math';
import type { WaveState } from './wave-math';

/** The export's width. Lanes cells and the timeline both use it. */
export const WAVE_WIDTH = 22;

export type WaveLineProps = {
  state?: WaveState;
  width?: number;
  className?: string;
  /** Set by WaveBundle on its last line so only that one moves. */
  growing?: boolean;
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
  growing = false,
}: WaveLineProps) {
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
      <path
        d={waveLinePath(width)}
        stroke="currentColor"
        strokeWidth={WAVE_STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
        // Law 3: only living things move. Scales along x from the left edge,
        // so the animation touches transform only and never reflows the bundle.
        className={growing ? 'wave-grow' : undefined}
      />
    </svg>
  );
}
