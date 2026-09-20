'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { EXCLUSION_VIOLATION, findCollision } from '@/lib/queries/compose';
import { createClient } from '@/lib/supabase/server';

/**
 * What the sheet can tell the author when a write is refused. The exclusion
 * constraint is a product rule (H10), so its rejection is a sentence, not a
 * stack trace.
 */
export type CommitResult =
  | { ok: true; rippleId: string }
  | { ok: false; reason: 'collision'; withNote: string | null; withId: string; canNest: boolean }
  | { ok: false; reason: 'error'; message: string };

const Draft = z.object({
  categoryId: z.uuid(),
  note: z.string().trim().max(2000).optional(),
  occurredOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  /** null = "for the whole day": a date-only record. */
  occurredTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .nullable(),
  mode: z.enum(['drop', 'timer']),
  planned: z.boolean(),
  locked: z.boolean(),
  parentRippleId: z.uuid().nullable(),
  /** The instant the chosen wall clock refers to, resolved in the browser. */
  startInstant: z.string().datetime().nullable(),
});

export type Draft = z.infer<typeof Draft>;

export async function commitRipple(input: Draft): Promise<CommitResult> {
  const parsed = Draft.safeParse(input);
  if (!parsed.success) return { ok: false, reason: 'error', message: 'That draft is incomplete.' };
  const draft = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, reason: 'error', message: 'Sign in again to record this.' };

  // A drop ends where it starts; a timer has not ended yet (SPEC 8).
  const endedAt = draft.mode === 'timer' ? null : draft.startInstant;

  const { data, error } = await supabase
    .from('ripples')
    .insert({
      author_id: user.id,
      category_id: draft.categoryId,
      note: draft.note?.length ? draft.note : null,
      occurred_on: draft.occurredOn,
      occurred_time: draft.occurredTime,
      ended_at: draft.occurredTime === null ? null : endedAt,
      planned: draft.planned,
      parent_ripple_id: draft.parentRippleId,
    })
    .select('id')
    .single();

  if (error) {
    if (error.code === EXCLUSION_VIOLATION && draft.startInstant) {
      const clash = await findCollision(supabase, user.id, new Date(draft.startInstant));
      if (clash) {
        return {
          ok: false,
          reason: 'collision',
          withNote: clash.note,
          withId: clash.id,
          // Only a span can take it in. A drop has no inside.
          canNest: clash.ended_at === null || clash.ended_at !== clash.started_at,
        };
      }
    }
    return { ok: false, reason: 'error', message: error.message };
  }

  if (draft.locked) {
    await supabase.from('ripple_audience').insert({ ripple_id: data.id, target_type: 'lock' });
  }

  revalidatePath('/');
  return { ok: true, rippleId: data.id };
}

/** Stops the running timer. The duration chip on the axis is the affordance. */
export async function stopSession(rippleId: string): Promise<CommitResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('ripples')
    .update({ ended_at: new Date().toISOString() })
    .eq('id', rippleId)
    .is('ended_at', null);

  if (error) return { ok: false, reason: 'error', message: error.message };

  revalidatePath('/');
  return { ok: true, rippleId };
}
