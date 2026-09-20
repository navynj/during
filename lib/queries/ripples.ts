import type { Database } from '@/lib/database.types';
import type { DuringClient } from '@/lib/queries/profile';
import type { IsoDate } from '@/lib/time';

export type Ripple = Database['public']['Tables']['ripples']['Row'];

/**
 * A Ripple with the category it is displayed as: SPEC 7's format is
 * `category · note`, so the badge and the row arrive together or the row
 * cannot be drawn.
 */
export type RippleWithCategory = Ripple & {
  category: { name: string; icon: string | null } | null;
};

const WITH_CATEGORY = '*, category:my_categories(name, icon)';

/**
 * One author's day, top level only. Chronological top to bottom (H2), with
 * date-only records first: they belong to the day without claiming a position
 * on its axis and render in the Daily Note area above it (SPEC 5, H5).
 *
 * Inner ripples are excluded here rather than filtered in the view: the parent
 * owns the row on the axis (H10), and their own display arrives with the mini
 * sheet in S5.
 *
 * The author filter narrows, it does not protect: RLS decides what a viewer
 * may see. Without it the same call would also return linked friends' rows,
 * which is the rail's query, not the timeline's.
 */
export async function getRipplesForDate(
  supabase: DuringClient,
  authorId: string,
  occurredOn: IsoDate,
): Promise<RippleWithCategory[]> {
  const { data, error } = await supabase
    .from('ripples')
    .select(WITH_CATEGORY)
    .eq('author_id', authorId)
    .eq('occurred_on', occurredOn)
    .is('parent_ripple_id', null)
    .order('occurred_time', { ascending: true, nullsFirst: true })
    .order('created_at', { ascending: true })
    .returns<RippleWithCategory[]>();

  if (error) throw error;
  return data;
}

export async function getMyRipplesForDate(
  supabase: DuringClient,
  occurredOn: IsoDate,
): Promise<RippleWithCategory[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  return getRipplesForDate(supabase, user.id, occurredOn);
}

/**
 * Splits a day into its two regions. Date-only records belong to the day
 * without claiming a position on its axis, so they stack in the Daily Note
 * area (SPEC 5.3, H5) and never appear on the timeline.
 */
export function splitByRegion(ripples: RippleWithCategory[]): {
  notes: RippleWithCategory[];
  timeline: RippleWithCategory[];
} {
  return {
    notes: ripples.filter((ripple) => ripple.occurred_time === null),
    timeline: ripples.filter((ripple) => ripple.occurred_time !== null),
  };
}
