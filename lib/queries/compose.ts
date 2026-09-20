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

/**
 * A running session's inner ripples. Their spans are what draw calm water in
 * the parent's bundle, so the timeline needs them even though they never take
 * a row of their own (H10).
 */
export async function getInnerRipples(
  supabase: DuringClient,
  parentIds: string[],
): Promise<RippleWithCategory[]> {
  if (parentIds.length === 0) return [];

  const { data, error } = await supabase
    .from('ripples')
    .select('*, category:my_categories(name, icon)')
    .in('parent_ripple_id', parentIds)
    .order('started_at', { ascending: true })
    .returns<RippleWithCategory[]>();

  if (error) throw error;
  return data;
}

/** The break currently running inside a session, if any. */
export function runningBreak(inner: RippleWithCategory[]): RippleWithCategory | null {
  return inner.find((child) => child.ended_at === null && child.occurred_time !== null) ?? null;
}

/**
 * The stretches of a session that were spent on something else, as fractions
 * of its span — what the bundle draws as calm water (H15a2).
 *
 * Any inner ripple with a span counts, not only the Break category: a stretch
 * you spent on something else is a stretch this session was not undulating,
 * and reading the category name would break the moment it is renamed.
 */
export function calmSpans(
  sessionStart: string,
  sessionEnd: string | null,
  now: Date,
  inner: RippleWithCategory[],
): { from: number; to: number }[] {
  const start = Date.parse(sessionStart);
  const end = sessionEnd ? Date.parse(sessionEnd) : now.getTime();
  const total = end - start;
  if (total <= 0) return [];

  const spans: { from: number; to: number }[] = [];
  for (const child of inner) {
    if (!child.started_at) continue;
    const childStart = Date.parse(child.started_at);
    const childEnd = child.ended_at === null ? end : Date.parse(child.ended_at);
    if (childEnd <= childStart) continue; // a drop is a point, not a stretch

    const from = Math.max(0, (childStart - start) / total);
    const to = Math.min(1, (childEnd - start) / total);
    if (to > from) spans.push({ from, to });
  }
  return spans;
}
