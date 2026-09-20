import { DurationChip } from '@/components/ui/chips/duration-chip';
import { WaveBundle, WaveLine } from '@/components/ui/waves';
import { StopSessionChip } from './stop-session-chip';
import type { RippleWithCategory } from '@/lib/queries/ripples';
import {
  elapsedMinutes,
  rippleDurationMinutes,
  rippleKind,
  rippleState,
  startInstant,
} from '@/lib/ripple-kind';

import { ROPE, ROW_GRID } from './row-grid';

const PLANNED_OPACITY = 0.35;

/** `08:00`, from the stored author-local wall clock. */
function clock(time: string): string {
  return time.slice(0, 5);
}

/**
 * One Ripple on the axis: its time in the gutter, its wave on the rope, its
 * note beside it. SPEC 7's display format is `category · note`, with the
 * category carried by the badge so the text is 100% note.
 *
 * Locked Ripples render exactly like any other. This view is mine alone, and
 * SPEC's Lanes/Locker principle applies: lock state surfaces in the mini sheet
 * (S5), never as a marker on my own timeline.
 */
export function RippleRow({
  ripple,
  timeZone,
  now,
  surface,
}: {
  ripple: RippleWithCategory;
  timeZone: string;
  now: Date;
  /** The page's current depth colour, so the wave stack can mask the rope. */
  surface: string;
}) {
  const kind = rippleKind(ripple, timeZone);
  const state = rippleState(ripple);
  const emoji = ripple.category?.icon ?? undefined;
  const fade = state === 'planned' ? PLANNED_OPACITY : undefined;

  // A running timer has no end yet, so its line count comes from how long it
  // has been going. Without this a live record would draw one line until the
  // moment it is stopped, and then jump.
  const duration =
    ripple.ended_at === null
      ? elapsedMinutes(ripple, timeZone, now)
      : rippleDurationMinutes(ripple, timeZone);

  // The gutter carries start times only, so the column reads as one ascending
  // sequence. A record's length is told by its bundle and its duration tag,
  // not by a second number that breaks the ordering.

  return (
    <li className={ROW_GRID}>
      <time
        className="text-main-900 pt-2 text-xs font-light tabular-nums"
        style={{ opacity: fade }}
      >
        {clock(ripple.occurred_time!)}
      </time>

      {/* The rope runs the full height of this cell, so consecutive rows join
          into one continuous line without anyone computing an offset. */}
      <div className="relative flex flex-col items-center pb-4">
        <span aria-hidden className={`${ROPE} inset-y-0`} />
        {/* The stack carries the page's own surface so the rope passes
            behind it rather than showing through the gaps between lines. It
            takes the colour as a prop because the surface sinks with the
            date, and a hardcoded white would blot a past day. */}
        <span className={`relative ${surface}`}>
          {kind === 'timed' ? (
            // The bundle fades itself, badge included, so the fade is not
            // applied here as well — twice would land it at 0.12.
            <WaveBundle durationMinutes={duration} state={state} emoji={emoji} />
          ) : (
            <span className="flex flex-col items-center" style={{ opacity: fade }}>
              {emoji ? <Badge emoji={emoji} /> : null}
              <WaveLine />
            </span>
          )}
        </span>
      </div>

      {/* Baseline, not stretch: the grid stretches this cell to the row
          height, and a flex child with a background would grow with it —
          the chip is a label sitting on the note's baseline, not a panel. */}
      <div
        className="flex flex-wrap items-baseline gap-2 pt-[calc(var(--spacing)*1.125)]"
        style={{ opacity: fade }}
      >
        <p className="text-ink text-sm">{ripple.note}</p>
        {kind === 'timed' ? (
          ripple.ended_at === null ? (
            <StopSessionChip
              rippleId={ripple.id}
              since={startInstant(ripple, timeZone)!.toISOString()}
              initialMinutes={duration}
            />
          ) : (
            <DurationChip minutes={duration} />
          )
        ) : null}
      </div>
    </li>
  );
}

function Badge({ emoji }: { emoji: string }) {
  return (
    <span
      aria-hidden
      className="bg-pool-100 mb-1 flex h-7 w-7 items-center justify-center rounded-full text-sm"
    >
      {emoji}
    </span>
  );
}
