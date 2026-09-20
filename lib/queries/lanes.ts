import type { DuringClient } from '@/lib/queries/profile';
import type { IsoDate } from '@/lib/time';

/** One day's record count per category. Days with nothing are simply absent. */
export type LaneCounts = Map<IsoDate, Record<string, number>>;

export type LaneSpan = {
  counts: LaneCounts;
  /** The day the archive starts, or null when there is nothing in it yet. */
  earliest: IsoDate | null;
};

/**
 * The matrix's numbers: how many Ripples each category holds on each day.
 *
 * **Inner ripples are counted**, which is the aggregation rule stated the
 * other way round (H15a2): inner ripples contribute their count and their
 * content, never their time. A cell is a count, so a break inside a session
 * is one more thing that happened, not a subtraction from it.
 *
 * Locked Ripples are counted too, unmarked. This view is mine alone, and lock
 * state belongs to the detail sheet rather than to a marker on my own archive.
 *
 * Planned Ripples are left out: a cell says what the day held, and an
 * intention is not yet a record of one.
 */
export async function getLaneCounts(supabase: DuringClient, authorId: string): Promise<LaneSpan> {
  const { data, error } = await supabase
    .from('ripples')
    .select('occurred_on, category_id')
    .eq('author_id', authorId)
    .eq('planned', false)
    .order('occurred_on', { ascending: true });

  if (error) throw error;

  const counts: LaneCounts = new Map();
  for (const row of data) {
    const day = counts.get(row.occurred_on) ?? {};
    day[row.category_id] = (day[row.category_id] ?? 0) + 1;
    counts.set(row.occurred_on, day);
  }

  return { counts, earliest: data[0]?.occurred_on ?? null };
}
