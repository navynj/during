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
  // record is in the way before the constraint refuses the write. A typed span
  // can cover several, so this is a set rather than the one under the start.
  const colliding = findColliding(ripples, draft, timeZone, date);

  return (
    <ol className="flex flex-col gap-1 pr-1" aria-label="Today, with your draft in place">
      {withGhost.map((entry) =>
        entry === 'ghost' ? (
          <Ghost key="ghost" draft={draft} emoji={emoji} />
        ) : (
          <li
            key={entry.id}
            data-colliding={colliding.has(entry.id) ? '' : undefined}
            className={`grid grid-cols-[2.25rem_1.75rem] items-start gap-x-1 rounded ${
              colliding.has(entry.id) ? 'bg-pool-100 ring-main-900/30 ring-1' : ''
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

/**
 * The draft, drawn where it would land. Faded, because it is not a record yet.
 *
 * A typed end makes it a bundle rather than a line (H18): the ghost shows the
 * kind the record will have, and kind is end-presence.
 */
function Ghost({ draft, emoji }: { draft: Draft; emoji: string | null }) {
  const minutes = draft.time && draft.endTime ? minutesBetween(draft.time, draft.endTime) : 0;

  return (
    <li
      data-ghost
      className="grid grid-cols-[2.25rem_1.75rem] items-start gap-x-1"
      style={{ opacity: 0.45 }}
    >
      <time className="text-main-900 pt-1 text-[10px] font-light tabular-nums">
        {draft.time ?? 'all day'}
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
        {minutes > 0 ? (
          <WaveBundle durationMinutes={minutes} state="done" density="compact" />
        ) : (
          <WaveLine />
        )}
      </span>
    </li>
  );
}

function minutesBetween(from: string, to: string): number {
  const [fh, fm] = from.split(':').map(Number);
  const [th, tm] = to.split(':').map(Number);
  return th * 60 + tm - (fh * 60 + fm);
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
 * Which existing records the draft would overlap. Computed here rather than
 * asked of the server: the answer changes with every tick of the time picker,
 * and a round trip per tick would lag behind the thumb.
 *
 * A point looks for what contains it; a typed span looks for everything it
 * covers, because the constraint refuses on any overlap and the rail should
 * show the same thing the constraint will say.
 */
function findColliding(
  ripples: RippleWithCategory[],
  draft: Draft,
  timeZone: string,
  date: string,
): Set<string> {
  const hit = new Set<string>();
  if (draft.time === null) return hit;

  const from = wallClockToInstant(date, draft.time, timeZone).getTime();
  const to = draft.endTime ? wallClockToInstant(date, draft.endTime, timeZone).getTime() : from;

  for (const ripple of ripples) {
    if (!ripple.started_at || ripple.planned) continue;
    const start = Date.parse(ripple.started_at);
    const end = ripple.ended_at === null ? Number.POSITIVE_INFINITY : Date.parse(ripple.ended_at);
    if (end <= start) continue;
    // Half-open on both sides, matching the constraint: touching an endpoint
    // is adjacency, and a point is its own zero-length range.
    if (from < end && (to > start || (to === from && from >= start))) hit.add(ripple.id);
  }
  return hit;
}
