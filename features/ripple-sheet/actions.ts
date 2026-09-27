'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import type { CommitResult } from '@/features/input-sheet/commit';
import { removeRippleMedia } from '@/lib/media';
import { createClient } from '@/lib/supabase/server';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const CLOCK = /^\d{2}:\d{2}$/;

const Edit = z.object({
  id: z.uuid(),
  categoryId: z.uuid().nullable(),
  note: z.string().trim().max(2000).optional(),
  media: z.array(z.string()).max(8),
  /** The annotation after this edit, or none: a plain posted fragment (H20c). */
  occurredOn: z.string().regex(ISO_DATE).nullable(),
  occurredTime: z.string().regex(CLOCK).nullable(),
  /** The instants the chosen wall clock refers to, resolved in the browser. */
  startInstant: z.iso.datetime().nullable(),
  endInstant: z.iso.datetime().nullable(),
  splashId: z.uuid().nullable(),
});

export type Edit = z.infer<typeof Edit>;

/**
 * Corrects a Ripple in place (H17). Editable: note, category (subject to the
 * board's inheritance, H20e), media, the annotation, the board. Not editable:
 * `created_at`, because the occurred/created separation exists so a
 * correction edits when it happened while the diary remembers when you wrote
 * it. Removing the annotation moves the fragment back to where it was posted.
 *
 * Lock state is not here: audience lives in the detail sheet (H20g), see
 * `setRippleLock`.
 */
export async function updateRipple(input: Edit): Promise<CommitResult> {
  const parsed = Edit.safeParse(input);
  if (!parsed.success) return { ok: false, reason: 'error', message: 'That edit is incomplete.' };
  const edit = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, reason: 'error', message: 'Sign in again to save this.' };

  if (edit.occurredTime !== null && edit.occurredOn === null) {
    return { ok: false, reason: 'error', message: 'A time needs a date.' };
  }
  // An end needs a beginning: a clock to follow, or by dates alone a date
  // (the row's own rule, ripples_ended_needs_date).
  if (edit.endInstant !== null) {
    if (edit.occurredOn === null) {
      return { ok: false, reason: 'error', message: 'An end needs a start.' };
    }
    if (
      edit.startInstant !== null &&
      Date.parse(edit.endInstant) <= Date.parse(edit.startInstant)
    ) {
      return { ok: false, reason: 'error', message: 'That end is before the start.' };
    }
  }

  const { data: before } = await supabase
    .from('ripples')
    .select('category_id, splash_id')
    .eq('id', edit.id)
    .single();
  if (!before) return { ok: false, reason: 'error', message: 'That record is gone.' };

  // While attached to a laned board the lane is the board's to say (H20e).
  const categoryId = await inheritedCategory(
    supabase,
    edit.categoryId ?? before.category_id,
    edit.splashId,
  );
  if (!categoryId) return { ok: false, reason: 'error', message: 'There is no lane to drop into.' };

  // A point ends where it starts; a span ends where it says — with a clock,
  // or by dates alone; an unannotated fragment has no instant at all (H20c).
  const endedAt = edit.endInstant ?? edit.startInstant;

  const { error } = await supabase
    .from('ripples')
    .update({
      category_id: categoryId,
      note: edit.note?.length ? edit.note : null,
      media: edit.media,
      occurred_on: edit.occurredOn,
      occurred_time: edit.occurredTime,
      ended_at: endedAt,
      splash_id: edit.splashId,
    })
    .eq('id', edit.id);

  if (error) return { ok: false, reason: 'error', message: error.message };

  revalidatePath('/');
  for (const splashId of [before.splash_id, edit.splashId]) {
    if (splashId) revalidatePath(`/splash/${splashId}`);
  }
  return { ok: true, rippleId: edit.id };
}

async function inheritedCategory(
  supabase: Awaited<ReturnType<typeof createClient>>,
  chosen: string,
  splashId: string | null,
): Promise<string | null> {
  if (!splashId) return chosen;
  const { data: splash } = await supabase
    .from('splashes')
    .select('lane_ids')
    .eq('id', splashId)
    .maybeSingle();
  const lanes = splash?.lane_ids ?? [];
  if (lanes.length === 0) return chosen;
  if (lanes.length === 1) return lanes[0];
  return lanes.includes(chosen) ? chosen : lanes[0];
}

/**
 * The lock, toggled where the record is read (H20g). One spectrum with two
 * stops in P1 — Everyone, Only me — and the row is the state: present means
 * locked, absent means everyone (C8).
 */
export async function setRippleLock(rippleId: string, locked: boolean): Promise<CommitResult> {
  const supabase = await createClient();

  const { error } = locked
    ? await supabase.from('ripple_audience').insert({ ripple_id: rippleId, target_type: 'lock' })
    : await supabase
        .from('ripple_audience')
        .delete()
        .eq('ripple_id', rippleId)
        .eq('target_type', 'lock');

  // A lock that is already there is not a failure to lock.
  if (error && error.code !== '23505')
    return { ok: false, reason: 'error', message: error.message };

  revalidatePath('/');
  return { ok: true, rippleId };
}

/**
 * Hard delete, including the objects. Privacy over recovery: what you remove
 * is removed, with no undo and no copy left behind.
 *
 * Inner ripples (dormant, H20b) still cascade through the FK; their media is
 * gathered first, because once the rows are gone nothing is left to say which
 * objects belonged to them.
 */
export async function deleteRipple(rippleId: string): Promise<CommitResult> {
  const supabase = await createClient();

  const { data: doomed } = await supabase
    .from('ripples')
    .select('id, media, splash_id')
    .or(`id.eq.${rippleId},parent_ripple_id.eq.${rippleId}`);

  const paths = (doomed ?? []).flatMap((row) => row.media);
  const splashId = doomed?.find((row) => row.id === rippleId)?.splash_id ?? null;

  const { error } = await supabase.from('ripples').delete().eq('id', rippleId);
  if (error) return { ok: false, reason: 'error', message: error.message };

  await removeRippleMedia(paths);

  revalidatePath('/');
  if (splashId) revalidatePath(`/splash/${splashId}`);
  return { ok: true, rippleId };
}
