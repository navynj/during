import type { Database } from '@/lib/database.types';
import type { DuringClient } from '@/lib/queries/profile';
import type { IsoDate } from '@/lib/time';

export type Ripple = Database['public']['Tables']['ripples']['Row'];

/**
 * One author's day. Chronological top to bottom (H2), with date-only records
 * first: they belong to the day without claiming a position on its axis and
 * render in the Daily Note area above it (SPEC 5, H5).
 *
 * The author filter narrows, it does not protect: RLS decides what a viewer
 * may see. Without it the same call would also return linked friends' rows,
 * which is the rail's query, not the timeline's.
 */
export async function getRipplesForDate(
  supabase: DuringClient,
  authorId: string,
  occurredOn: IsoDate,
): Promise<Ripple[]> {
  const { data, error } = await supabase
    .from('ripples')
    .select('*')
    .eq('author_id', authorId)
    .eq('occurred_on', occurredOn)
    .order('occurred_time', { ascending: true, nullsFirst: true })
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
}

export async function getMyRipplesForDate(
  supabase: DuringClient,
  occurredOn: IsoDate,
): Promise<Ripple[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  return getRipplesForDate(supabase, user.id, occurredOn);
}
