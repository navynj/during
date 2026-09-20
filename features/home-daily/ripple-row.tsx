import { WaveBundle, WaveLine, type WaveMotion } from '@/components/ui/waves';
import type { RippleWithCategory } from '@/lib/queries/ripples';
import { elapsedMinutes, rippleDurationMinutes, rippleKind, rippleState } from '@/lib/ripple-kind';

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
}: {
  ripple: RippleWithCategory;
  timeZone: string;
  now: Date;
  motion: WaveMotion;
}) {
  const kind = rippleKind(ripple, timeZone);
  const state = rippleState(ripple);
  const emoji = ripple.category?.icon ?? undefined;

  // A running timer has no end yet, so its line count comes from how long it
  // has been going. Without this a live record would draw one line until the
  // moment it is stopped, and then jump.
  const duration =
    ripple.ended_at === null
      ? elapsedMinutes(ripple, timeZone, now)
      : rippleDurationMinutes(ripple, timeZone);

  return (
    <li className="grid grid-cols-[3.5rem_2.75rem_1fr] items-start gap-x-3 py-1">
      <time className="text-main-900 pt-1 text-xs font-medium tabular-nums">
        {clock(ripple.occurred_time!)}
      </time>

      <div className="flex justify-center">
        {kind === 'timed' ? (
          <WaveBundle durationMinutes={duration} state={state} motion={motion} emoji={emoji} />
        ) : (
          <span
            className="flex flex-col items-center"
            style={{ opacity: state === 'planned' ? 0.35 : undefined }}
          >
            {emoji ? <Badge emoji={emoji} /> : null}
            <WaveLine />
          </span>
        )}
      </div>

      <p
        className="text-ink pt-1 text-sm"
        style={{ opacity: state === 'planned' ? 0.35 : undefined }}
      >
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
