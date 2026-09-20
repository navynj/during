import { WaveBundle, WaveLine, type WaveMotion } from '@/components/ui/waves';
import type { RippleWithCategory } from '@/lib/queries/ripples';
import {
  elapsedMinutes,
  endWallClock,
  rippleDurationMinutes,
  rippleKind,
  rippleState,
} from '@/lib/ripple-kind';

import { ROPE, ROW_GRID } from './row-grid';

const PLANNED_OPACITY = 0.35;
/**
 * Finer than the export's 2px. On the timeline the waves sit among text at
 * 14px, and a 2px stroke reads heavier than the notes beside it; at the chip
 * scale the same geometry needs the thicker pen.
 */
const TIMELINE_STROKE = 1.25;

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
  motion,
  surface,
}: {
  ripple: RippleWithCategory;
  timeZone: string;
  now: Date;
  motion: WaveMotion;
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

  // A timed record spans two hours of the day, so the gutter carries both: the
  // start beside its badge, the end beside its last wave line. A drop has one
  // moment and a running timer has no end yet, so both show a single label.
  const endsAt = endWallClock(ripple, timeZone);

  return (
    <li className={ROW_GRID}>
      <div
        className="text-main-900 flex flex-col justify-between pt-2 pb-4 text-xs font-medium tabular-nums"
        style={{ opacity: fade }}
      >
        <time>{clock(ripple.occurred_time!)}</time>
        {endsAt ? <time>{endsAt}</time> : null}
      </div>

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
            <WaveBundle
              durationMinutes={duration}
              state={state}
              motion={motion}
              strokeWidth={TIMELINE_STROKE}
              emoji={emoji}
            />
          ) : (
            <span className="flex flex-col items-center" style={{ opacity: fade }}>
              {emoji ? <Badge emoji={emoji} /> : null}
              <WaveLine strokeWidth={TIMELINE_STROKE} />
            </span>
          )}
        </span>
      </div>

      <p className="text-ink pt-1.5 text-sm" style={{ opacity: fade }}>
        {ripple.note}
      </p>
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
