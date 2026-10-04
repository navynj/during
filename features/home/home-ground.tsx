'use client';

import { useEffect, useLayoutEffect, useState } from 'react';

import { useInputSheet } from '@/features/input-sheet/sheet-provider';
import { CategorySheet } from '@/features/lanes/category-sheet';
import { LanesSheet } from '@/features/lanes/lanes-sheet';
import { SessionsSheet } from '@/features/sessions/sessions-sheet';
import {
  filterByLane,
  laneCounts,
  monthSeats,
  type Seat,
  type Session,
} from '@/features/sessions/shelves';
import type { SplashSummary } from '@/features/splash/summary';
import { EMPTY } from '@/lib/empty-states';
import type { MyCategory } from '@/lib/queries/profile';
import type { IsoDate } from '@/lib/time';
import { useOptimisticAction } from '@/lib/use-optimistic-action';

import { LaneHeader, LaneRopes } from './lane-header';
import { MonthScrubber } from './month-scrubber';
import { PinnedBar } from './pinned-bar';
import { SplashGrid } from './splash-grid';

/** How long the commit ripple is given at a new post's pill once the real one has landed. */
const RING_MS = 1800;

/**
 * Home, the water ground (SPEC 5, H21c, H21d; `_docs/mockups/home-ground.png`):
 * one solid #0507C9 surface scoped to one month. The lane header across the
 * top (the lanes view, with the seat of a new lane and the lanes sheet's pencil
 * at its end), ropes through the empty water, the post grid oldest-at-top, the
 * month scrubber beneath it with the `=` that opens the sessions sheet, and the
 * pinned bar above the tab bar. The view opens scrolled to the bottom — the
 * present-and-writing zone.
 *
 * A post just dropped is seated at once, before the server has it, with the
 * ripple playing at its pill (CLAUDE.md, the principle); lanes edited in the
 * lanes sheet read edited at once too.
 */
export function HomeGround({
  month,
  months,
  counts,
  seats,
  pinned,
  categories,
  sessions,
  customCounts,
  earliestYear,
  today,
  timeZone,
}: {
  month: string;
  /** Newest first. */
  months: string[];
  counts: Map<string, number>;
  seats: Seat[];
  pinned: SplashSummary[];
  categories: MyCategory[];
  sessions: Session[];
  customCounts: Record<string, number>;
  earliestYear: number;
  today: IsoDate;
  timeZone: string;
}) {
  const [laneId, setLaneId] = useState<string | null>(null);
  const [sessionsOpen, setSessionsOpen] = useState(false);
  const [newLane, setNewLane] = useState(false);
  const [editingLanes, setEditingLanes] = useState(false);
  const { pendingDrop, clearDropped, dropMessage, pendingDeletes } = useInputSheet();
  const lanes = useOptimisticAction(categories);

  // The post just dropped takes its seat before the server has it; once the
  // real row is on the ground the optimistic one steps aside.
  const landed =
    pendingDrop !== null && seats.some(({ splash }) => splash.id === pendingDrop.splash.id);
  // A post deleted a moment ago is gone from the ground before the re-read.
  const kept = seats.filter(({ splash }) => !pendingDeletes.includes(splash.id));
  const seated =
    pendingDrop && !landed && pendingDrop.month === month
      ? [...kept, ...monthSeats([pendingDrop.splash], month, timeZone)]
      : kept;
  const ringAt =
    pendingDrop && seated.some(({ splash }) => splash.id === pendingDrop.splash.id)
      ? pendingDrop.splash.id
      : null;

  // The present is at the bottom (H21d), so that is where the ground opens.
  useLayoutEffect(() => {
    if (typeof window.scrollTo !== 'function') return;
    try {
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' });
    } catch {
      // A test window may not scroll; the ground still reads correctly.
    }
  }, [month, seated.length]);

  // The signature moment (SPEC 6): the ripple plays from the optimistic
  // seat until a moment after the real one lands, then the memory clears.
  useEffect(() => {
    if (!landed) return;
    const timer = window.setTimeout(clearDropped, RING_MS);
    return () => window.clearTimeout(timer);
  }, [landed, clearDropped]);

  const shown = filterByLane(seated, laneId);

  return (
    <div data-home-ground className="water-ground flex flex-1 flex-col">
      {/* pb-10 clears the tab bar's overlap; the bar cuts its corners into the water. */}
      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col px-6 pb-10">
        <div className="no-scrollbar flex flex-1 flex-col overflow-x-auto">
          <LaneHeader
            categories={lanes.value}
            counts={laneCounts(seated)}
            selectedId={laneId}
            onSelect={setLaneId}
            onCreate={() => setNewLane(true)}
            onEdit={() => setEditingLanes(true)}
          />
          <LaneRopes lanes={lanes.value.length} />
        </div>

        {dropMessage || lanes.message ? (
          <p role="alert" className="pb-4 text-sm text-white/80">
            {dropMessage ?? lanes.message}
          </p>
        ) : null}

        {seated.length === 0 ? (
          <p data-empty-month className="pb-8 text-center text-base text-white">
            {EMPTY.ground}
          </p>
        ) : (
          <SplashGrid seats={shown} month={month} categories={lanes.value} ringAt={ringAt} />
        )}

        <MonthScrubber
          months={months}
          counts={counts}
          scoped={month}
          onManage={() => setSessionsOpen(true)}
        />

        <PinnedBar
          pinned={pinned.filter((p) => !pendingDeletes.includes(p.id))}
          categories={lanes.value}
          month={month}
        />
      </div>

      {sessionsOpen ? (
        <SessionsSheet
          sessions={sessions}
          counts={Object.fromEntries(counts)}
          customCounts={customCounts}
          categories={lanes.value}
          earliestYear={earliestYear}
          today={today}
          onClose={() => setSessionsOpen(false)}
        />
      ) : null}

      {newLane ? (
        <CategorySheet category={null} apply={lanes.run} onClose={() => setNewLane(false)} />
      ) : null}
      {editingLanes ? (
        <LanesSheet
          categories={lanes.value}
          apply={lanes.run}
          message={lanes.message}
          onClose={() => setEditingLanes(false)}
        />
      ) : null}
    </div>
  );
}
