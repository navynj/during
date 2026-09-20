import type { LaneCounts } from '@/lib/queries/lanes';
import { shiftDate, type IsoDate } from '@/lib/time';

/**
 * How many empty days in a row before they fold into one line.
 *
 * Tunable. Three is where a gap stops being a gap and starts being a stretch:
 * two quiet days between records still read as part of the same week, while
 * three drawn as three empty rows costs a screenful to say nothing.
 */
export const QUIET_RUN = 3;

export type LaneRow =
  | { kind: 'day'; date: IsoDate; counts: Record<string, number> }
  /** A stretch where nothing was recorded, folded into one low row. */
  | { kind: 'quiet'; from: IsoDate; to: IsoDate; days: number };

/**
 * The matrix's rows, newest first, from today back to the first record.
 *
 * Unbounded on purpose: the collapse is what makes it affordable, so the
 * archive can be complete without a window that would cut it off at an
 * arbitrary depth.
 */
export function laneRows(
  today: IsoDate,
  earliest: IsoDate | null,
  counts: LaneCounts,
  threshold: number = QUIET_RUN,
): LaneRow[] {
  if (!earliest) return [];

  const rows: LaneRow[] = [];
  let quiet: IsoDate[] = [];

  const flush = (): void => {
    if (quiet.length === 0) return;
    // Below the threshold a gap is still part of the week, so its days stay
    // as themselves rather than being summarised.
    if (quiet.length < threshold) {
      for (const date of quiet) rows.push({ kind: 'day', date, counts: {} });
    } else {
      rows.push({ kind: 'quiet', from: quiet[quiet.length - 1], to: quiet[0], days: quiet.length });
    }
    quiet = [];
  };

  // A plan or a backfill dated after today would otherwise be cut off the
  // top, so the walk starts from whichever is later: today, or the last day
  // the archive holds anything on.
  let from = today;
  for (const date of counts.keys()) if (date > from) from = date;

  for (let date = from; date >= earliest; date = shiftDate(date, -1)) {
    const day = counts.get(date);
    if (day && Object.keys(day).length > 0) {
      flush();
      rows.push({ kind: 'day', date, counts: day });
    } else {
      quiet.push(date);
    }
  }
  flush();

  return rows;
}

/**
 * `Sep 2 to 6`, or `Aug 30 to Sep 3` across a month boundary. Earliest first,
 * because a stretch is read as a period rather than as the scroll's direction.
 */
export function quietLabel(from: IsoDate, to: IsoDate): string {
  const month = (date: IsoDate): string =>
    new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' });
  const day = (date: IsoDate): string => String(new Date(`${date}T00:00:00Z`).getUTCDate());

  const tail = month(from) === month(to) ? day(to) : `${month(to)} ${day(to)}`;
  return `${month(from)} ${day(from)} to ${tail}`;
}

/**
 * Which depth step a row sits at: one step per calendar month back from the
 * newest row on screen. Months are the sections law 1 sinks, and they are the
 * sections the gutter already names.
 */
export function monthsBack(newest: IsoDate, date: IsoDate): number {
  const months = (at: IsoDate): number => {
    const [year, month] = at.split('-').map(Number);
    return year * 12 + month;
  };
  return Math.max(0, months(newest) - months(date));
}
