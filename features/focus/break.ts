'use server';

import { revalidatePath } from 'next/cache';

import { createClient } from '@/lib/supabase/server';
import type { CommitResult } from '@/features/input-sheet/commit';

/** The category a break is recorded in. Lazily created, then just a category. */
const BREAK_CATEGORY = 'Break';

/**
 * Finds or creates the author's Break category.
 *
 * Created on first use rather than seeded with the presets: a category that
 * appears in the chip row before it has ever been used is a suggestion to take
 * a break, which is not the app's business.
 */
async function breakCategoryId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<string> {
  const { data: existing } = await supabase
    .from('my_categories')
    .select('id')
    .eq('user_id', userId)
    .eq('name', BREAK_CATEGORY)
    .maybeSingle();

  if (existing) return existing.id;

  const { data: last } = await supabase
    .from('my_categories')
    .select('position')
    .eq('user_id', userId)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data, error } = await supabase
    .from('my_categories')
    .insert({
      user_id: userId,
      name: BREAK_CATEGORY,
      icon: '🌊',
      default_mode: 'timed',
      position: (last?.position ?? 0) + 1,
    })
    .select('id')
    .single();

  // A racing second insert loses to the unique (user_id, name); read it back.
  if (error) {
    const { data: raced } = await supabase
      .from('my_categories')
      .select('id')
      .eq('user_id', userId)
      .eq('name', BREAK_CATEGORY)
      .single();
    return raced!.id;
  }

  return data.id;
}

/**
 * Starts a break inside the running session: a timed inner ripple (H15a2).
 * The session itself is untouched — its span stays one interval and its
 * duration stays gross.
 */
export async function startBreak(sessionId: string): Promise<CommitResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, reason: 'error', message: 'Sign in again.' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('timezone')
    .eq('id', user.id)
    .single();

  const zone = profile?.timezone ?? 'UTC';
  const local = new Intl.DateTimeFormat('en-CA', {
    timeZone: zone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date());
  const at = Object.fromEntries(local.map((part) => [part.type, part.value]));

  const { data, error } = await supabase
    .from('ripples')
    .insert({
      author_id: user.id,
      category_id: await breakCategoryId(supabase, user.id),
      note: null,
      occurred_on: `${at.year}-${at.month}-${at.day}`,
      occurred_time: `${at.hour}:${at.minute}`,
      ended_at: null,
      parent_ripple_id: sessionId,
    })
    .select('id')
    .single();

  if (error) return { ok: false, reason: 'error', message: error.message };

  revalidatePath('/');
  revalidatePath('/now');
  return { ok: true, rippleId: data.id };
}

/** Ends the break and lets the water flow again. */
export async function endBreak(breakId: string): Promise<CommitResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('ripples')
    .update({ ended_at: new Date().toISOString() })
    .eq('id', breakId)
    .is('ended_at', null);

  if (error) return { ok: false, reason: 'error', message: error.message };

  revalidatePath('/');
  revalidatePath('/now');
  return { ok: true, rippleId: breakId };
}

/**
 * Stops the session, closing a running break first.
 *
 * The order is load-bearing: a parent's span shrinks to its end, and a child
 * still running would be left outside it.
 */
export async function stopSessionWithBreak(
  sessionId: string,
  openBreakId: string | null,
): Promise<CommitResult> {
  if (openBreakId) {
    const closed = await endBreak(openBreakId);
    if (!closed.ok) return closed;
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('ripples')
    .update({ ended_at: new Date().toISOString() })
    .eq('id', sessionId)
    .is('ended_at', null);

  if (error) return { ok: false, reason: 'error', message: error.message };

  revalidatePath('/');
  revalidatePath('/now');
  return { ok: true, rippleId: sessionId };
}
