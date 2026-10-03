'use client';

import { useEffect, useLayoutEffect, useState } from 'react';

import { useInputSheet } from '@/features/input-sheet/sheet-provider';
import { CategorySheet } from '@/features/lanes/category-sheet';
import { LanesSheet } from '@/features/lanes/lanes-sheet';
import { SessionsSheet } from '@/features/sessions/sessions-sheet';
import { filterByLane, laneCounts, type Seat, type Session } from '@/features/sessions/shelves';
import type { SplashSummary } from '@/features/splash/summary';
import { EMPTY } from '@/lib/empty-states';
import type { MyCategory } from '@/lib/queries/profile';
import type { IsoDate } from '@/lib/time';

import { LaneHeader, LaneRopes } from './lane-header';
import { MonthScrubber } from './month-scrubber';
import { PinnedBar } from './pinned-bar';
import { SplashGrid } from './splash-grid';

/** How long the commit ripple is given at a new post's pill. */
const RING_MS = 1800;

/**
 * Home, the water ground (SPEC 5, H21c, H21d; `_docs/mockups/home-ground.png`):
 * one solid #0507C9 surface scoped to one month. The lane header across the
 * top (the lanes view, with the seat of a new lane and the lanes sheet's pencil
 * at its end), ropes through
 * the empty water, the post grid oldest-at-top, the month scrubber beneath it
 * with the `=` that opens the sessions sheet, and the pinned bar above the tab
 * bar. The view opens scrolled to the bottom — the present-and-writing zone.
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
}) {
  const [laneId, setLaneId] = useState<string | null>(null);
  const [sessionsOpen, setSessionsOpen] = useState(false);
  const [newLane, setNewLane] = useState(false);
  const [editingLanes, setEditingLanes] = useState(false);
  const { justDropped, clearDropped } = useInputSheet();
  // The signature moment (SPEC 6): once the new post's pill is on this
  // ground, the ripple plays there once; the memory of it clears after.
  const ringAt =
    justDropped && seats.some(({ splash }) => splash.id === justDropped) ? justDropped : null;

  // The present is at the bottom (H21d), so that is where the ground opens.
  useLayoutEffect(() => {
    if (typeof window.scrollTo !== 'function') return;
    try {
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' });
    } catch {
      // A test window may not scroll; the ground still reads correctly.
    }
  }, [month, seats.length]);

  useEffect(() => {
    if (!ringAt) return;
    const timer = window.setTimeout(clearDropped, RING_MS);
    return () => window.clearTimeout(timer);
  }, [ringAt, clearDropped]);

  const shown = filterByLane(seats, laneId);

  return (
    <div data-home-ground className="water-ground flex flex-1 flex-col">
      {/* pb-10 clears the tab bar's overlap; the bar cuts its corners into the water. */}
      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col px-6 pb-10">
        <div className="no-scrollbar flex flex-1 flex-col overflow-x-auto">
          <LaneHeader
            categories={categories}
            counts={laneCounts(seats)}
            selectedId={laneId}
            onSelect={setLaneId}
            onCreate={() => setNewLane(true)}
            onEdit={() => setEditingLanes(true)}
          />
          <LaneRopes lanes={categories.length} />
        </div>

        {seats.length === 0 ? (
          <p data-empty-month className="pb-8 text-center text-base text-white">
            {EMPTY.ground}
          </p>
        ) : (
          <SplashGrid seats={shown} month={month} categories={categories} ringAt={ringAt} />
        )}

        <MonthScrubber
          months={months}
          counts={counts}
          scoped={month}
          onManage={() => setSessionsOpen(true)}
        />

        <PinnedBar pinned={pinned} categories={categories} month={month} />
      </div>

      {sessionsOpen ? (
        <SessionsSheet
          sessions={sessions}
          counts={Object.fromEntries(counts)}
          customCounts={customCounts}
          categories={categories}
          earliestYear={earliestYear}
          today={today}
          onClose={() => setSessionsOpen(false)}
        />
      ) : null}

      {newLane ? <CategorySheet category={null} onClose={() => setNewLane(false)} /> : null}
      {editingLanes ? (
        <LanesSheet categories={categories} onClose={() => setEditingLanes(false)} />
      ) : null}
    </div>
  );
}
