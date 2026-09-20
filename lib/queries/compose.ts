import type { DuringClient } from '@/lib/queries/profile';
import type { RippleWithCategory } from '@/lib/queries/ripples';
import type { IsoDate } from '@/lib/time';

/** Postgres exclusion-constraint violation. */
export const EXCLUSION_VIOLATION = '23P01';

/**
 * The author's running timer, if one is going. H10 guarantees at most one, so
 * this is a single row rather than a list.
 */
export async function getRunningSession(
  supabase: DuringClient,
  authorId: string,
): Promise<RippleWithCategory | null> {
  const { data, error } = await supabase
    .from('ripples')
    .select('*, category:my_categories(name, icon)')
    .eq('author_id', authorId)
    .is('ended_at', null)
    .is('parent_ripple_id', null)
    .not('occurred_time', 'is', null)
    .eq('planned', false)
    .order('started_at', { ascending: false })
    .limit(1)
    .returns<RippleWithCategory[]>();

  if (error) throw error;
  return data[0] ?? null;
}

/**
 * Which record a rejected write collided with.
 *
 * The constraint says no, but "no" is not a message — the sheet has to name
 * the record in the way and, when it is a session, offer to file the new one
 * inside it. Run after a 23P01 rather than before every write: the database
 * is the authority, and a check beforehand would be a race.
 */
export async function findCollision(
  supabase: DuringClient,
  authorId: string,
  at: Date,
): Promise<RippleWithCategory | null> {
  const instant = at.toISOString();

  const { data, error } = await supabase
    .from('ripples')
    .select('*, category:my_categories(name, icon)')
    .eq('author_id', authorId)
    .is('parent_ripple_id', null)
    .eq('planned', false)
    .lte('started_at', instant)
    .or(`ended_at.is.null,ended_at.gt.${instant}`)
    .order('started_at', { ascending: false })
    .limit(1)
    .returns<RippleWithCategory[]>();

  if (error) throw error;
  const candidate = data[0];
  if (!candidate) return null;

  // A drop's span is a point, so it only collides with an identical instant.
  const isPoint = candidate.ended_at !== null && candidate.ended_at === candidate.started_at;
  if (isPoint && candidate.started_at !== instant) return null;

  return candidate;
}

/** Today's Ripples, for the sheet's rail. Same query the timeline uses. */
export type ComposeContext = {
  ripples: RippleWithCategory[];
  running: RippleWithCategory | null;
  date: IsoDate;
};
