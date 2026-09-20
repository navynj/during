import type { DuringClient } from '@/lib/queries/profile';
import type { RippleWithCategory } from '@/lib/queries/ripples';
import type { IsoDate } from '@/lib/time';

const WITH_CATEGORY = '*, category:my_categories(name, icon)';

export type TrailDay = { date: IsoDate; ripples: RippleWithCategory[] };

/**
 * My whole archive, newest day first.
 *
 * **This is my own archive, not a feed.** The no-feed hypothesis (A1, A2) is
 * about other people's content arriving unasked — an endless column of records
 * I did not write. A backward scroll through what I wrote myself is the
 * opposite motion: nothing new arrives at the top, and the only way through it
 * is to go back. Locker is the recall engine (D10), and this is recall.
 *
 * Locked Ripples are included and unmarked, for the same reason they are on
 * Home: the Locker sees everything, and audience state lives in the detail
 * sheet rather than as a marker on my own records.
 *
 * Unbounded. At P1 this is one person's few months, and a window would be a
 * cut-off the word "Trail" promises is not there; pagination is the answer
 * when the archive outgrows one request, not a limit that quietly hides it.
 */
export async function getMyTrail(
  supabase: DuringClient,
  authorId: string,
): Promise<RippleWithCategory[]> {
  const { data, error } = await supabase
    .from('ripples')
    .select(WITH_CATEGORY)
    .eq('author_id', authorId)
    .is('parent_ripple_id', null)
    .order('occurred_on', { ascending: false })
    .order('occurred_time', { ascending: true, nullsFirst: true })
    .order('created_at', { ascending: true })
    .returns<RippleWithCategory[]>();

  if (error) throw error;
  return data;
}

/**
 * Days, newest first, each holding its Ripples in the order Home shows them.
 *
 * The scroll descends through days and each day still reads top-to-early, so a
 * day in the Trail looks like the same day on Home rather than a reversed one.
 * `occurred_on` is already an author-local calendar date, so the boundaries
 * are the author's without any instant being re-read here.
 */
export function groupByDay(ripples: RippleWithCategory[]): TrailDay[] {
  const days: TrailDay[] = [];

  for (const ripple of ripples) {
    const last = days[days.length - 1];
    if (last && last.date === ripple.occurred_on) last.ripples.push(ripple);
    else days.push({ date: ripple.occurred_on, ripples: [ripple] });
  }

  return days;
}
