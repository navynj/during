'use client';

import { WaveBundle, WaveLine } from '@/components/ui/waves';
import type { RippleWithCategory } from '@/lib/queries/ripples';
import { rippleDurationMinutes, rippleKind, rippleState } from '@/lib/ripple-kind';

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
  now,
}: {
  ripples: RippleWithCategory[];
  draft: Draft;
  emoji: string | null;
  timeZone: string;
  now: Date;
}) {
  const withGhost = placeGhost(ripples, draft.time);

  return (
    <ol className="flex flex-col gap-1 pr-1" aria-label="Today, with your draft in place">
      {withGhost.map((entry) =>
        entry === 'ghost' ? (
          <Ghost key="ghost" time={draft.time} emoji={emoji} />
        ) : (
          <li key={entry.id} className="grid grid-cols-[2.25rem_1.75rem] items-start gap-x-1">
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
