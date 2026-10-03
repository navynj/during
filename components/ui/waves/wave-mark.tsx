import { impressionLineCount, WAVE_GAP } from './wave-math';
import { WaveLine } from './wave-line';

/** The ring's diameter, and the wave width inside it. */
const MARK_SIZE = 28;
const MARK_WAVE = 14;

/**
 * A post's wave mark (SPEC 7, H21): its block count on the log scale (law 2),
 * drawn inside a ring at the pill's right end. A post with nothing in it yet
 * draws one line so it has a mark at all. Colour is the surface's: the ring
 * and the waves are `currentColor` and `--wave-ink`, so a white pill on the
 * ground draws it blue and a lane header on the ground draws it white.
 */
export function WaveMark({ count, className = '' }: { count: number; className?: string }) {
  const lines = Math.max(1, impressionLineCount(count));
  return (
    <span
      aria-hidden
      data-wave-mark
      data-lines={lines}
      className={`flex shrink-0 flex-col items-center justify-center rounded-full border border-current ${className}`}
      style={{ width: MARK_SIZE, height: MARK_SIZE, gap: WAVE_GAP }}
    >
      {Array.from({ length: lines }, (_, index) => (
        <WaveLine key={index} width={MARK_WAVE} />
      ))}
    </span>
  );
}

/**
 * A lane header's waves on the ground: its post count this month on the log
 * scale, stacked small, nothing when nothing.
 */
export function WaveStack({ count, width = 16 }: { count: number; width?: number }) {
  const lines = impressionLineCount(count);
  if (lines === 0) return null;
  return (
    <span
      aria-hidden
      data-wave-stack
      data-lines={lines}
      className="flex flex-col items-center"
      style={{ gap: WAVE_GAP }}
    >
      {Array.from({ length: lines }, (_, index) => (
        <WaveLine key={index} width={width} />
      ))}
    </span>
  );
}
