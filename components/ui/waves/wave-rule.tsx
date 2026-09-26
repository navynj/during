import { waveHeight, waveLinePath, WAVE_STROKE } from './wave-math';

/** Long enough that no phone width runs out of wave before the edge. */
const RULE_WIDTH = 600;

export type WaveRuleProps = {
  /** Which edge the wave is anchored to; the other end is clipped, never stretched. */
  anchor?: 'left' | 'right';
  /** The pinned geometry at 1; the splash stack draws at 1.5. */
  scale?: number;
  className?: string;
};

/**
 * A wave line that fills whatever width it is given: a splash's right-anchored
 * stack, the ghost's underline, the `+ Add to Splash` link's rule.
 *
 * The path is drawn long at the pinned geometry and the viewport slices it
 * (`preserveAspectRatio … slice`), so a wider box shows more wave rather than
 * a stretched one — the exported shape is what makes a wave read as a wave
 * (H9), and scaling it to fit would be the distortion H10 refused.
 */
export function WaveRule({ anchor = 'right', scale = 1, className = '' }: WaveRuleProps) {
  const height = waveHeight(scale);
  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 ${RULE_WIDTH} ${height}`}
      preserveAspectRatio={`${anchor === 'right' ? 'xMax' : 'xMin'}YMid slice`}
      fill="none"
      aria-hidden
      className={`block ${className}`}
    >
      <path
        d={waveLinePath(RULE_WIDTH, scale)}
        stroke="var(--wave-ink)"
        strokeWidth={WAVE_STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
