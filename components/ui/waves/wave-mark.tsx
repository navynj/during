import { impressionLineCount, WAVE_GAP } from './wave-math';
import { WaveLine } from './wave-line';

/** The disc's diameter, and the wave width inside it. */
const MARK_SIZE = 28;
const MARK_WAVE = 14;

/**
 * A post's wave mark (SPEC 7, H21; `home-ground.png`): its block count on
 * the log scale (law 2), drawn as white waves on a solid #0507C9 disc at the
 * pill's right end. A post with nothing in it yet draws one line so it has a
 * mark at all. On a blue pill — a lone block standing in as a post — the
 * disc inverts: white, with blue waves.
 */
export function WaveMark({
  count,
  tone = 'blue',
  className = '',
}: {
  count: number;
  tone?: 'blue' | 'white';
  className?: string;
}) {
  const lines = Math.max(1, impressionLineCount(count));
  const surface = tone === 'blue' ? 'bg-main-900' : 'bg-white';
  return (
    <span
      aria-hidden
      data-wave-mark
      data-lines={lines}
      data-tone={tone}
      className={`flex shrink-0 flex-col items-center justify-center rounded-full ${surface} ${className}`}
      style={{
        width: MARK_SIZE,
        height: MARK_SIZE,
        gap: WAVE_GAP,
        ['--wave-ink' as string]: tone === 'blue' ? '#ffffff' : 'var(--color-main-900)',
      }}
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
