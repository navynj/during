'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { removeRippleMedia } from '@/lib/media';
import { EXCLUSION_VIOLATION, findCollision } from '@/lib/queries/compose';
import { createClient } from '@/lib/supabase/server';
import type { CommitResult } from '@/features/input-sheet/commit';
import { spanVerdict } from '@/features/input-sheet/span-rules';
import { parentBoundsMessage, resolveEnd, strayMessage } from './end-rules';

const Edit = z.object({
  id: z.uuid(),
  categoryId: z.uuid(),
  note: z.string().trim().max(2000).optional(),
  occurredOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  occurredTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .nullable(),
  locked: z.boolean(),
  media: z.array(z.string()).max(8),
  /** The instant the chosen wall clock refers to, resolved in the browser. */
  startInstant: z.string().datetime().nullable(),
  /**
   * The record's end after this edit: a time adds or corrects one, null
   * clears it back to a point, and absent says nothing about it (H18). A
   * running session ignores this — stopping is what writes its end (H17).
   */
  endInstant: z.string().datetime().nullable().optional(),
});

export type Edit = z.infer<typeof Edit>;

/**
 * Corrects a Ripple in place.
 *
 * `ended_at` is an ordinary field (H18): adding one makes a drop timed and
 * clearing one makes a timed a drop. The exception is a *running* session,
 * whose end is written by the act of stopping, so an edit cannot invent one.
 * `created_at` is not editable at all — the occurred/created separation exists
 * so a correction edits when it *happened* while the diary still remembers
 * when you wrote it.
 *
 * Moving a Ripple in time re-runs the exclusion constraint and, for a session,
 * the containment check on its children. Both are surfaced as sentences.
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

  const { data: before } = await supabase
    .from('ripples')
    .select('started_at, ended_at')
    .eq('id', edit.id)
    .single();
  if (!before) return { ok: false, reason: 'error', message: 'That record is gone.' };

  const endedAt = resolveEnd(before, edit);

  // A point ends where it starts, so only a real span is judged here.
  if (endedAt && edit.startInstant && endedAt !== edit.startInstant) {
    const verdict = spanVerdict(Date.parse(edit.startInstant), Date.parse(endedAt), Date.now());
    if (verdict === 'backwards') {
      return { ok: false, reason: 'error', message: 'That end is before the start.' };
    }
    // The present is written by the Timer, and an edit is not the Timer (H18).
    if (verdict === 'straddles') return { ok: false, reason: 'straddles' };
  }

  const { error } = await supabase
    .from('ripples')
    .update({
      category_id: edit.categoryId,
      note: edit.note?.length ? edit.note : null,
      occurred_on: edit.occurredOn,
      occurred_time: edit.occurredTime,
      ended_at: endedAt,
      media: edit.media,
    })
    .eq('id', edit.id);

  if (error) {
    if (error.code === EXCLUSION_VIOLATION && edit.startInstant) {
      const clash = await findCollision(
        supabase,
        user.id,
        new Date(edit.startInstant),
        endedAt && endedAt !== edit.startInstant ? new Date(endedAt) : null,
      );
      if (clash && clash.id !== edit.id) {
        return {
          ok: false,
          reason: 'collision',
          withNote: clash.note,
          withId: clash.id,
          canNest: clash.ended_at === null || clash.ended_at !== clash.started_at,
        };
      }
    }
    if (/within its parent/i.test(error.message)) {
      return { ok: false, reason: 'error', message: await describeParent(supabase, edit.id) };
    }
    // The blocker is a record inside this session, so say which one.
    const strayId = error.message.match(/inner ripple ([0-9a-f-]{36})/i)?.[1];
    if (strayId) {
      return { ok: false, reason: 'error', message: await describeStray(supabase, strayId) };
    }
    return { ok: false, reason: 'error', message: error.message };
  }

  await setLock(supabase, edit.id, edit.locked);

  revalidatePath('/');
  revalidatePath('/now');
  return { ok: true, rippleId: edit.id };
}

async function setLock(
  supabase: Awaited<ReturnType<typeof createClient>>,
  rippleId: string,
  locked: boolean,
): Promise<void> {
  if (locked) {
    await supabase.from('ripple_audience').insert({ ripple_id: rippleId, target_type: 'lock' });
    return;
  }
  await supabase
    .from('ripple_audience')
    .delete()
    .eq('ripple_id', rippleId)
    .eq('target_type', 'lock');
}

/**
 * Hard delete, including the objects. Privacy over recovery: what you remove
 * is removed, with no undo and no copy left behind.
 *
 * A session takes its inner ripples with it — the FK cascades the rows, and
 * their media is gathered first, because once the rows are gone nothing is
 * left to say which objects belonged to them.
 */
export async function deleteRipple(rippleId: string): Promise<CommitResult> {
  const supabase = await createClient();

  const { data: doomed } = await supabase
    .from('ripples')
    .select('id, media')
    .or(`id.eq.${rippleId},parent_ripple_id.eq.${rippleId}`);

  const paths = (doomed ?? []).flatMap((row) => row.media);

  const { error } = await supabase.from('ripples').delete().eq('id', rippleId);
  if (error) return { ok: false, reason: 'error', message: error.message };

  await removeRippleMedia(paths);

  revalidatePath('/');
  revalidatePath('/now');
  return { ok: true, rippleId };
}

/**
 * Names the inner ripple an edit would have stranded.
 *
 * "That does not fit" leaves the author hunting; naming the thing in the way
 * is the difference between a refusal and an answer. A break carries no note
 * of its own (H15a2), so it is named by what it is.
 */
async function describeStray(
  supabase: Awaited<ReturnType<typeof createClient>>,
  strayId: string,
): Promise<string> {
  const { data } = await supabase
    .from('ripples')
    .select('note, started_at, ended_at, occurred_time')
    .eq('id', strayId)
    .maybeSingle();

  if (!data) return 'That span leaves a record inside this session outside it.';
  return strayMessage(data);
}

/** The bounds an inner ripple has to fit inside, said in the author's clock. */
async function describeParent(
  supabase: Awaited<ReturnType<typeof createClient>>,
  childId: string,
): Promise<string> {
  const { data: child } = await supabase
    .from('ripples')
    .select('parent_ripple_id, author_id')
    .eq('id', childId)
    .maybeSingle();
  if (!child?.parent_ripple_id) {
    return 'That time falls outside the session this record sits in.';
  }

  const [{ data: parent }, { data: profile }] = await Promise.all([
    supabase
      .from('ripples')
      .select('occurred_time, ended_at')
      .eq('id', child.parent_ripple_id)
      .maybeSingle(),
    supabase.from('profiles').select('timezone').eq('id', child.author_id).maybeSingle(),
  ]);
  if (!parent) return 'That time falls outside the session this record sits in.';

  const zone = profile?.timezone ?? 'UTC';
  return parentBoundsMessage({
    occurred_time: parent.occurred_time,
    ended_at: parent.ended_at,
    endWallClock: parent.ended_at
      ? new Intl.DateTimeFormat('en-GB', {
          timeZone: zone,
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }).format(new Date(parent.ended_at))
      : null,
  });
}
