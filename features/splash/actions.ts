'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { createClient } from '@/lib/supabase/server';

import type { Splash } from './summary';

export type SplashResult = { ok: true; splash: Splash } | { ok: false; message: string };

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const NewSplash = z.object({
  title: z.string().trim().min(1).max(80),
  /** Declared lanes: my_categories ids, several allowed (H20e). */
  laneIds: z.array(z.uuid()).max(16),
  /** A declared range is descriptive, never a deadline (H20e). */
  declaredStart: z.string().regex(ISO_DATE).nullable(),
  declaredEnd: z.string().regex(ISO_DATE).nullable(),
});

export type NewSplash = z.infer<typeof NewSplash>;

/** Refuses what the row would refuse, in the sheet's own words. */
function refuse(splash: NewSplash): string | null {
  if (splash.declaredEnd && !splash.declaredStart) return 'An end date needs a start date.';
  if (splash.declaredEnd && splash.declaredStart && splash.declaredEnd < splash.declaredStart) {
    return 'That end is before the start.';
  }
  return null;
}

/** Opens a board. Returns the row, so the ripple sheet can be preset to it. */
export async function createSplash(input: NewSplash): Promise<SplashResult> {
  const parsed = NewSplash.safeParse(input);
  if (!parsed.success) return { ok: false, message: 'A splash needs a title.' };
  const splash = parsed.data;
  const refused = refuse(splash);
  if (refused) return { ok: false, message: refused };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: 'Sign in again to open this.' };

  const { data, error } = await supabase
    .from('splashes')
    .insert({
      owner_id: user.id,
      title: splash.title,
      lane_ids: splash.laneIds,
      declared_start: splash.declaredStart,
      declared_end: splash.declaredEnd,
    })
    .select('*')
    .single();

  if (error) return { ok: false, message: error.message };

  revalidatePath('/');
  return { ok: true, splash: data };
}

/**
 * Corrects a board: title, declared lanes, declared range. RLS makes it
 * mine (`splashes belong to their owner`); the update touches no fragment.
 * A changed lane declaration governs by inheritance from here on (H20e) and
 * never rewrites what was already thrown.
 */
export async function updateSplash(id: string, input: NewSplash): Promise<SplashResult> {
  const parsed = NewSplash.safeParse(input);
  if (!parsed.success) return { ok: false, message: 'A splash needs a title.' };
  const splash = parsed.data;
  const refused = refuse(splash);
  if (refused) return { ok: false, message: refused };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('splashes')
    .update({
      title: splash.title,
      lane_ids: splash.laneIds,
      declared_start: splash.declaredStart,
      declared_end: splash.declaredEnd,
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error) return { ok: false, message: error.message };

  revalidatePath('/');
  revalidatePath(`/splash/${id}`);
  return { ok: true, splash: data };
}

/**
 * Removes a board. Its fragments are DETACHED, never deleted (H20d): the
 * foreign key sets their splash_id null, and nothing here touches `ripples`.
 */
export async function deleteSplash(
  id: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from('splashes').delete().eq('id', id);
  if (error) return { ok: false, message: error.message };

  revalidatePath('/');
  return { ok: true };
}
