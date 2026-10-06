'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

import { useInputSheet } from '@/features/input-sheet/sheet-provider';
import { CategorySheet } from '@/features/lanes/category-sheet';
import { LanesSheet } from '@/features/lanes/lanes-sheet';
import { SessionsSheet } from '@/features/sessions/sessions-sheet';
import { monthSeats, seatsByLane, type Seat, type Session } from '@/features/sessions/shelves';
import type { SplashSummary } from '@/features/splash/summary';
import type { MyCategory } from '@/lib/queries/profile';
import type { IsoDate } from '@/lib/time';
import { useOptimisticAction } from '@/lib/use-optimistic-action';

import { LaneIcon } from './lane-icon';
import { LaneRows } from './lane-rows';
import { MonthScrubber } from './month-scrubber';
import { PinnedBar } from './pinned-bar';

/** How long the commit ripple is given at a new post's pill once the real one has landed. */
const RING_MS = 1800;

/**
 * Home, the water ground (SPEC 5, H21c; the lane-rows mockup): one solid
 * #0507C9 surface scoped to one month. Lane rows fill it — one row per lane,
 * its month's posts as pills on a rope, newest at the left — and scroll on
 * their own; beneath them the fixed stack: the month scrubber with the `=`
 * that opens the sessions sheet, the lane-icon row that opens the lanes
 * sheet, and the pinned bar above the tab bar. A month with nothing is every
 * row with an empty rope.
 *
 * A post just dropped is seated at once, before the server has it, with the
 * ripple playing at its pill (CLAUDE.md, the principle); lanes edited in the
 * lanes sheet read edited at once too; a post deleted a moment ago is gone.
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
  const [sessionsOpen, setSessionsOpen] = useState(false);
  const [newLane, setNewLane] = useState(false);
  const [editingLanes, setEditingLanes] = useState(false);
  const { pendingDrop, clearDropped, dropMessage, pendingDeletes } = useInputSheet();
  const lanes = useOptimisticAction(categories);

  // The post just dropped takes its seat before the server has it; once the
  // real row is on the ground the optimistic one steps aside. A post deleted
  // a moment ago is gone from the ground before the re-read.
  const landed =
    pendingDrop !== null && seats.some(({ splash }) => splash.id === pendingDrop.splash.id);
  const kept = seats.filter(({ splash }) => !pendingDeletes.includes(splash.id));
  const seated =
    pendingDrop && !landed && pendingDrop.month === month
      ? [...kept, ...monthSeats([pendingDrop.splash], month, timeZone)]
      : kept;
  const ringAt =
    pendingDrop && seated.some(({ splash }) => splash.id === pendingDrop.splash.id)
      ? pendingDrop.splash.id
      : null;

  // The signature moment (SPEC 6): the ripple plays from the optimistic
  // seat until a moment after the real one lands, then the memory clears.
  useEffect(() => {
    if (!landed) return;
    const timer = window.setTimeout(clearDropped, RING_MS);
    return () => window.clearTimeout(timer);
  }, [landed, clearDropped]);

  const { rows, orphans } = seatsByLane(seated, lanes.value);
  useEffect(() => {
    if (orphans.length > 0) {
      console.warn(
        `[during] ${orphans.length} post(s) this month sit on no lane of yours; shown on an unlabelled row.`,
      );
    }
  }, [orphans.length]);

  return (
    <div data-home-ground className="water-ground flex min-h-0 flex-1 flex-col">
      <div
        className="mx-auto flex min-h-0 w-full max-w-xl flex-1 flex-col"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        {/* The rows scroll on their own; everything beneath stays put. */}
        <LaneArea>
          {dropMessage || lanes.message ? (
            <p role="alert" className="pb-4 text-sm text-white/80">
              {dropMessage ?? lanes.message}
            </p>
          ) : null}
          <LaneRows
            rows={rows}
            orphans={orphans}
            month={month}
            categories={lanes.value}
            ringAt={ringAt}
            onCreateLane={() => setNewLane(true)}
          />
        </LaneArea>

        {/* pb-10 clears the tab bar's overlap; the bar cuts its corners into the water. */}
        <div data-fixed-stack className="shrink-0 px-6 pb-10">
          <MonthScrubber
            months={months}
            counts={counts}
            scoped={month}
            onManage={() => setSessionsOpen(true)}
          />
          <div data-lane-icon-row className="flex items-center pb-2">
            <button
              type="button"
              aria-label="Edit lanes"
              data-edit-lanes
              onClick={() => setEditingLanes(true)}
              className="-ml-1 flex h-9 w-9 items-center justify-center text-white"
            >
              <LaneIcon size={20} />
            </button>
          </div>
          <PinnedBar
            pinned={pinned.filter((p) => !pendingDeletes.includes(p.id))}
            categories={lanes.value}
            month={month}
          />
        </div>
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

/** The depth fade at the rows area's bottom edge. */
const FADE_HEIGHT = 'h-8';

/**
 * The rows' scroll container (min-h-0 and flex-1 all the way down from the
 * ground's fixed height, so this is where the overflow lands), with a fade
 * into the water at its bottom edge while there is more below — the cut-off
 * row reads as depth, not clipping — gone once scrolled to the end.
 */
function LaneArea({ children }: { children: ReactNode }) {
  const area = useRef<HTMLDivElement>(null);
  const [more, setMore] = useState(false);

  const measure = (): void => {
    const el = area.current;
    if (!el) return;
    setMore(el.scrollTop + el.clientHeight < el.scrollHeight - 1);
  };

  // Measured once laid out, and again whenever the area or its rows resize.
  useEffect(() => {
    const el = area.current;
    if (!el) return;
    const frame = window.requestAnimationFrame(measure);
    if (typeof ResizeObserver === 'undefined') return () => window.cancelAnimationFrame(frame);
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    for (const child of el.children) observer.observe(child);
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div
        ref={area}
        data-lane-area
        data-more={more ? '' : undefined}
        onScroll={measure}
        className="no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-6 pt-4 pb-6"
      >
        {children}
      </div>
      <div
        aria-hidden
        data-lane-fade
        className={`pointer-events-none absolute inset-x-0 bottom-0 ${FADE_HEIGHT} bg-gradient-to-b from-transparent to-[#0507c9] transition-opacity duration-200 motion-reduce:transition-none ${
          more ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
}
