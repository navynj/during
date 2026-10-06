'use client';

import { useLayoutEffect, useRef } from 'react';
import { Plus } from 'lucide-react';

import { CommitRing } from '@/components/ui/waves';
import { usePrefersReducedMotion } from '@/components/ui/waves/use-reduced-motion';
import type { LaneRowSeats, Seat } from '@/features/sessions/shelves';
import { SplashPill } from '@/features/splash/splash-pill';
import type { MyCategory } from '@/lib/queries/profile';

import { splashHref } from './scope';

/** The label column: emoji over the name, the rope beginning after it. */
const LABEL_COLUMN = '4.5rem';

/**
 * Home's lane rows: one row per lane in the author's order — a fixed label
 * column (emoji over the name, centred, two-line names wrapping), then a thin
 * rope to the right edge with the month's posts of that lane on it as pills,
 * newest at the left. Each rope scrolls on its own, sideways only; the label
 * and the rope never move. A lane with nothing this month is a row with an
 * empty rope. After the last row, the seat of a lane that does not exist yet.
 *
 * The post just dropped is scrolled into view — its rope to the start, its
 * row into the area — before the ring paints, so the ring never plays off
 * screen.
 */
export function LaneRows({
  rows,
  orphans,
  month,
  categories,
  ringAt,
  onCreateLane,
}: {
  rows: LaneRowSeats[];
  /** Seats with no lane of their own: one unlabelled row at the end, only when any. */
  orphans: Seat[];
  month: string;
  categories: MyCategory[];
  ringAt: string | null;
  onCreateLane: () => void;
}) {
  const area = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  useLayoutEffect(() => {
    if (!ringAt) return;
    const seat = area.current?.querySelector<HTMLElement>(`[data-seat="${CSS.escape(ringAt)}"]`);
    if (!seat) return;
    const rope = seat.closest<HTMLElement>('[data-lane-rope]');
    if (rope) rope.scrollLeft = 0;
    const row = seat.closest<HTMLElement>('[data-lane-row]');
    row?.scrollIntoView({ block: 'nearest', behavior: reducedMotion ? 'instant' : 'smooth' });
  }, [ringAt, reducedMotion]);

  return (
    <div ref={area} data-lane-rows className="flex flex-col">
      {rows.map(({ lane, seats }) => (
        <LaneRow
          key={lane.id}
          laneId={lane.id}
          label={
            <>
              <span aria-hidden className="text-3xl/none">
                {lane.icon}
              </span>
              <span className="text-center text-sm/tight font-semibold text-white">
                {lane.name}
              </span>
            </>
          }
          seats={seats}
          month={month}
          categories={categories}
          ringAt={ringAt}
        />
      ))}

      {orphans.length > 0 ? (
        <LaneRow
          laneId=""
          label={null}
          seats={orphans}
          month={month}
          categories={categories}
          ringAt={ringAt}
        />
      ) : null}

      {/* The seat of a lane that does not exist yet, on an empty rope. */}
      <div
        data-new-lane-row
        className="grid items-center py-4"
        style={{ gridTemplateColumns: `${LABEL_COLUMN} minmax(0, 1fr)` }}
      >
        <div className="flex justify-center">
          <button
            type="button"
            aria-label="New lane"
            data-new-lane
            onClick={onCreateLane}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/40 text-white/60"
          >
            <Plus aria-hidden size={16} />
          </button>
        </div>
        <Rope />
      </div>
    </div>
  );
}

function LaneRow({
  laneId,
  label,
  seats,
  month,
  categories,
  ringAt,
}: {
  laneId: string;
  label: React.ReactNode;
  seats: Seat[];
  month: string;
  categories: MyCategory[];
  ringAt: string | null;
}) {
  return (
    <div
      data-lane-row={laneId}
      className="grid items-center py-3"
      style={{ gridTemplateColumns: `${LABEL_COLUMN} minmax(0, 1fr)` }}
    >
      <div data-lane-label className="flex flex-col items-center gap-1.5 px-1">
        {label}
      </div>

      {/* The rope runs under the pills to the screen's edge; only the strip
          scrolls, sideways and on its own. */}
      <div className="relative -mr-6 min-w-0">
        <Rope />
        {/* Default touch-action: a vertical drag that begins on a pill or a
            rope scrolls the rows area; a horizontal one scrolls this rope only. */}
        <ol
          data-lane-rope
          className="no-scrollbar relative flex w-full gap-3 overflow-x-auto overscroll-x-contain py-1 pr-6 pl-1"
        >
          {seats.map(({ splash, span }) => {
            const ring = ringAt === splash.id;
            return (
              <li key={splash.id} data-seat={splash.id} className="relative shrink-0">
                {ring ? (
                  <span
                    aria-hidden
                    data-commit-ripple
                    className="pointer-events-none absolute inset-0 flex items-center justify-center"
                  >
                    <CommitRing size={160} contentSize={40} gap={8} once />
                  </span>
                ) : null}
                <SplashPill
                  splash={splash}
                  range={span}
                  categories={categories}
                  href={splashHref(splash.id, month)}
                  ground="water"
                  ring={ring}
                />
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

/** The rope: a thin line in the low-contrast white the old lane lines used. */
function Rope() {
  return (
    <span
      aria-hidden
      data-rope
      className="pointer-events-none absolute top-1/2 right-0 left-0 h-px bg-white/15"
    />
  );
}
