'use client';

import { WaveBundle, WaveLine } from '@/components/ui/waves';
import type { RippleWithCategory } from '@/lib/queries/ripples';
import {
  rippleDurationMinutes,
  rippleKind,
  rippleState,
  wallClockToInstant,
} from '@/lib/ripple-kind';

import type { Draft } from './draft';

/**
 * H12: the sheet's landing surface. The same wave components and the same
 * day's Ripples as the page, at the library's compact density — a preset, not
 * a second timeline.
 *
 * The ghost sits among the real records at the chosen time and moves as the
 * time or category changes. Preview here; arrival on the page.
 */
export function MiniAxis({
  ripples,
  draft,
  emoji,
  timeZone,
  date,
}: {
  ripples: RippleWithCategory[];
  draft: Draft;
  emoji: string | null;
  timeZone: string;
  date: string;
}) {
  const withGhost = placeGhost(ripples, draft.time);
  // The rail is now the collision-anticipation surface, so it says which
  // record is in the way before the constraint refuses the write.
  const colliding = findColliding(ripples, draft.time, timeZone, date);

  return (
    <ol className="flex flex-col gap-1 pr-1" aria-label="Today, with your draft in place">
      {withGhost.map((entry) =>
        entry === 'ghost' ? (
          <Ghost key="ghost" time={draft.time} emoji={emoji} />
        ) : (
          <li
            key={entry.id}
            data-colliding={entry.id === colliding ? '' : undefined}
            className={`grid grid-cols-[2.25rem_1.75rem] items-start gap-x-1 rounded ${
              entry.id === colliding ? 'bg-pool-100 ring-main-900/30 ring-1' : ''
            }`}
          >
            <time className="text-main-900 pt-1 text-[10px] font-light tabular-nums opacity-60">
              {entry.occurred_time!.slice(0, 5)}
            </time>
            <span className="flex justify-center">
              {rippleKind(entry, timeZone) === 'timed' ? (
                <WaveBundle
                  durationMinutes={
                    entry.ended_at === null ? 30 : rippleDurationMinutes(entry, timeZone)
                  }
                  state={rippleState(entry)}
                  density="compact"
                  emoji={entry.category?.icon ?? undefined}
                />
              ) : (
                <WaveLine state={rippleState(entry)} />
              )}
            </span>
          </li>
        ),
      )}
    </ol>
  );
}

/** The draft, drawn where it would land. Faded, because it is not a record yet. */
function Ghost({ time, emoji }: { time: string | null; emoji: string | null }) {
  return (
    <li
      data-ghost
      className="grid grid-cols-[2.25rem_1.75rem] items-start gap-x-1"
      style={{ opacity: 0.45 }}
    >
      <time className="text-main-900 pt-1 text-[10px] font-light tabular-nums">
        {time ?? 'all day'}
      </time>
      <span className="flex flex-col items-center">
        {emoji ? (
          <span
            aria-hidden
            className="bg-pool-100 mb-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px]"
          >
            {emoji}
          </span>
        ) : null}
        <WaveLine />
      </span>
    </li>
  );
}

/**
 * Where the draft sits in the day. Date-only drafts leave the axis entirely —
 * "for the whole day" moves the ghost to the Daily Note area (SPEC 6).
 */
function placeGhost(
  ripples: RippleWithCategory[],
  time: string | null,
): (RippleWithCategory | 'ghost')[] {
  const timed = ripples.filter((r) => r.occurred_time !== null);
  if (time === null) return timed;

  const before = timed.filter((r) => r.occurred_time!.slice(0, 5) <= time);
  const after = timed.filter((r) => r.occurred_time!.slice(0, 5) > time);
  return [...before, 'ghost', ...after];
}

/**
 * Which existing span the chosen time falls inside, if any. Computed here
 * rather than asked of the server: the answer changes with every tick of the
 * time picker, and a round trip per tick would lag behind the thumb.
 */
function findColliding(
  ripples: RippleWithCategory[],
  time: string | null,
  timeZone: string,
  date: string,
): string | null {
  if (time === null) return null;
  const at = wallClockToInstant(date, time, timeZone).getTime();

  for (const ripple of ripples) {
    if (!ripple.started_at || ripple.planned) continue;
    const start = Date.parse(ripple.started_at);
    const end = ripple.ended_at === null ? Number.POSITIVE_INFINITY : Date.parse(ripple.ended_at);
    // Half-open, matching the constraint: touching an endpoint is adjacency.
    if (end > start && at >= start && at < end) return ripple.id;
  }
  return null;
}
