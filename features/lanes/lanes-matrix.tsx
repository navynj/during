'use client';

// DORMANT (H21, review): the Lanes tab retired — Home's lane header is the
// lanes view. The matrix stays for P3's pool Lanes (D2: the same view with the
// column binding swapped). No route mounts it; do not delete it.

import Link from 'next/link';
import { useState } from 'react';
import { Plus } from 'lucide-react';

import { impressionLineCount, WAVE_GAP, WaveLine } from '@/components/ui/waves';
import type { MyCategory } from '@/lib/queries/profile';
import { depthSurface } from '@/lib/depth';
import { EMPTY } from '@/lib/empty-states';
import { monthHref } from '@/features/home/scope';
import { formatPagerDate, type IsoDate } from '@/lib/time';

import { CategorySheet } from './category-sheet';
import { monthsBack, quietLabel, type LaneRow } from './matrix';

/**
 * SPEC 5: my categories x days, wave cells, exploration rather than recall.
 *
 * Locked Ripples are included and unmarked — this view is mine alone, so lock
 * state belongs to the detail sheet rather than to a badge on my own archive.
 *
 * The column header is a category's own control: name, icon, and delete while
 * it is still empty. Its other half — the mapping dashboard, "where this lane
 * flows" — needs pools to flow into, so it arrives with P2. Nothing is
 * scaffolded for it here.
 *
 * Conflict noted rather than guessed: _docs/mockups/Home - Lanes.png keeps a
 * white ground at every depth. It predates SPEC 7 law 1's sinking, which the
 * spec applies to exactly this kind of continuous backward scroll, so the
 * sinking wins and the mockup's layout is kept.
 */
const DATE_COL = '4.5rem';
const LANE_COL = '4.5rem';

export function LanesMatrix({ categories, rows }: { categories: MyCategory[]; rows: LaneRow[] }) {
  const [editing, setEditing] = useState<MyCategory | 'new' | null>(null);
  const newest = rows[0] && rows[0].kind === 'day' ? rows[0].date : rows[0]?.from;

  return (
    // The matrix owns both scroll axes, which is what makes its headers
    // stick: an element sticks inside its nearest scrollport, so a header in
    // a box that scrolls sideways while the *document* scrolls down never
    // moves. Bounding the height puts both axes in the same box.
    <div className="no-scrollbar -mx-6 min-h-0 flex-1 overflow-auto">
      <div style={{ minWidth: `calc(${DATE_COL} + ${categories.length + 1} * ${LANE_COL})` }}>
        <Header
          categories={categories}
          onEdit={(category) => setEditing(category)}
          onCreate={() => setEditing('new')}
        />

        {rows.length === 0 ? (
          <p className="text-pool-500 px-6 py-16 text-center text-sm">{EMPTY.lanes}</p>
        ) : (
          <ol>
            {rows.map((row, index) =>
              row.kind === 'quiet' ? (
                <QuietRow
                  key={`${row.from}-${row.to}`}
                  row={row}
                  newest={newest!}
                  lanes={categories.length}
                />
              ) : (
                <DayRow
                  key={row.date}
                  row={row}
                  categories={categories}
                  newest={newest!}
                  // The month names itself once, at the head of its own
                  // section — which is also where the ground steps down.
                  opensMonth={monthKey(rows[index - 1]) !== monthKey(row)}
                />
              ),
            )}
          </ol>
        )}
      </div>

      {editing ? (
        <CategorySheet
          category={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </div>
  );
}

/**
 * Sticky, so the lane a cell belongs to is readable at any depth: a matrix
 * whose headers scroll away is a grid of unlabelled marks.
 */
function Header({
  categories,
  onEdit,
  onCreate,
}: {
  categories: MyCategory[];
  onEdit: (category: MyCategory) => void;
  onCreate: () => void;
}) {
  return (
    <div data-sticky-header className="sticky top-0 z-10 flex bg-white pt-2 pb-3">
      <span aria-hidden className="shrink-0" style={{ width: DATE_COL }} />
      {categories.map((category) => (
        <button
          key={category.id}
          type="button"
          onClick={() => onEdit(category)}
          className="flex shrink-0 flex-col items-center gap-1.5"
          style={{ width: LANE_COL }}
        >
          <span className="text-main-900 text-xs font-semibold">{category.name}</span>
          <span aria-hidden className="text-lg">
            {category.icon}
          </span>
        </button>
      ))}

      {/* The seat of a lane that does not exist yet — the promise the Home
          strip's "+" has been making since S2, now kept. */}
      <button
        type="button"
        onClick={onCreate}
        aria-label="New lane"
        className="flex shrink-0 flex-col items-center gap-1.5 pt-4"
        style={{ width: LANE_COL }}
      >
        <span className="text-main-900 flex h-7 w-7 items-center justify-center rounded-full border border-dashed border-current opacity-30">
          <Plus aria-hidden size={14} />
        </span>
      </button>
    </div>
  );
}

function DayRow({
  row,
  categories,
  newest,
  opensMonth,
}: {
  row: Extract<LaneRow, { kind: 'day' }>;
  categories: MyCategory[];
  newest: IsoDate;
  opensMonth: boolean;
}) {
  const { year, month, day, weekday, full } = formatPagerDate(row.date);
  const surface = depthSurface(monthsBack(newest, row.date));

  return (
    <li className="flex items-stretch" style={{ background: surface }}>
      {/* The date column is the row's header, held at the left edge while the
          lanes scroll sideways under the fingers. */}
      <div
        className="sticky left-0 z-[1] flex shrink-0 flex-col justify-center py-2 pl-6"
        style={{ width: DATE_COL, background: surface }}
      >
        {opensMonth ? (
          <p className="text-main-900 text-[10px]/none font-medium">
            {year} {month.toUpperCase()}
          </p>
        ) : null}
        <Link href={monthHref(row.date.slice(0, 7))} className="text-main-900 flex flex-col">
          <span className="sr-only">{full}</span>
          <span aria-hidden className="text-lg/none font-medium">
            {day}
          </span>
          <span aria-hidden className="text-[10px]/none font-medium">
            {weekday}
          </span>
        </Link>
      </div>

      {categories.map((category) => (
        <Cell
          key={category.id}
          date={row.date}
          name={category.name}
          count={row.counts[category.id] ?? 0}
        />
      ))}
      <span aria-hidden className="shrink-0" style={{ width: LANE_COL }} />
    </li>
  );
}

/**
 * One cell: an impression of how much that lane held that day (law 2), never
 * a tally. Tapping it opens that day's month on the ground (H21h).
 */
function Cell({ date, name, count }: { date: IsoDate; name: string; count: number }) {
  const lines = impressionLineCount(count);

  return (
    <Link
      href={monthHref(date.slice(0, 7))}
      aria-label={count === 0 ? `${name}, nothing on ${date}` : `${name}, ${count} on ${date}`}
      data-lane-cell
      data-lines={lines}
      className="border-pool-200 flex shrink-0 flex-col items-center justify-center border-l py-3"
      style={{ width: LANE_COL, gap: WAVE_GAP }}
    >
      {Array.from({ length: lines }, (_, index) => (
        <WaveLine key={index} />
      ))}
    </Link>
  );
}

/** A stretch where nothing was recorded, kept low so the eye passes over it. */
function QuietRow({
  row,
  newest,
  lanes,
}: {
  row: Extract<LaneRow, { kind: 'quiet' }>;
  newest: IsoDate;
  /** The ropes carry on through a quiet stretch; only the days fold. */
  lanes: number;
}) {
  const surface = depthSurface(monthsBack(newest, row.to));

  return (
    <li data-quiet-row className="flex items-stretch" style={{ background: surface }}>
      <p
        className="text-pool-500 sticky left-0 z-[1] shrink-0 py-2 pl-6 text-[10px]/none"
        style={{ width: DATE_COL, background: surface }}
      >
        {quietLabel(row.from, row.to)}
      </p>
      {Array.from({ length: lanes }, (_, index) => (
        <span
          key={index}
          aria-hidden
          className="border-pool-200 shrink-0 border-l"
          style={{ width: LANE_COL }}
        />
      ))}
    </li>
  );
}

/** `2026-08`, or null above the first row. A quiet stretch takes its latest day. */
function monthKey(row: LaneRow | undefined): string | null {
  if (!row) return null;
  return (row.kind === 'day' ? row.date : row.to).slice(0, 7);
}
