'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { createClient } from '@/lib/supabase/server';

import type { Session } from './shelves';

export type SessionResult = { ok: true; session: Session } | { ok: false; message: string };
export type Done = { ok: true } | { ok: false; message: string };

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const MONTH = /^\d{4}-\d{2}$/;

function revalidateShelves(id: string | null = null): void {
  revalidatePath('/');
  revalidatePath('/sessions');
  if (id) revalidatePath(`/sessions/${id}`);
}

/**
 * Titles a month (H21e). The month exists already — the calendar says so —
 * and this is the one thing that gives it a row. Clearing the title takes the
 * row away again, so a month is never stored for nothing.
 */
export async function titleMonth(month: string, title: string): Promise<Done> {
  if (!MONTH.test(month)) return { ok: false, message: 'That is not a month.' };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: 'Sign in again.' };

  const first = `${month}-01`;
  const trimmed = title.trim().slice(0, 120);
  const { data: existing } = await supabase
    .from('sessions')
    .select('id')
    .eq('owner_id', user.id)
    .eq('kind', 'monthly')
    .eq('month', first)
    .maybeSingle();

  if (trimmed.length === 0) {
    if (existing) {
      const { error } = await supabase.from('sessions').delete().eq('id', existing.id);
      if (error) return { ok: false, message: error.message };
    }
    revalidateShelves();
    return { ok: true };
  }

  const { error } = existing
    ? await supabase.from('sessions').update({ title: trimmed }).eq('id', existing.id)
    : await supabase
        .from('sessions')
        .insert({ owner_id: user.id, kind: 'monthly', title: trimmed, month: first });
  if (error) return { ok: false, message: error.message };

  revalidateShelves();
  return { ok: true };
}

const Custom = z.object({
  title: z.string().trim().min(1).max(120),
  declaredStart: z.string().regex(ISO_DATE).nullable(),
  declaredEnd: z.string().regex(ISO_DATE).nullable(),
  laneId: z.uuid().nullable(),
});

export type Custom = z.infer<typeof Custom>;

function refuse(custom: Custom): string | null {
  if (custom.declaredEnd && !custom.declaredStart) return 'An end date needs a start date.';
  if (custom.declaredEnd && custom.declaredStart && custom.declaredEnd < custom.declaredStart) {
    return 'That end is before the start.';
  }
  return null;
}

/** Makes a custom shelf (H21e): a title, an optional range, an optional lane. */
export async function createSession(input: Custom): Promise<SessionResult> {
  const parsed = Custom.safeParse(input);
  if (!parsed.success) return { ok: false, message: 'A session needs a title.' };
  const custom = parsed.data;
  const refused = refuse(custom);
  if (refused) return { ok: false, message: refused };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: 'Sign in again.' };

  const { data, error } = await supabase
    .from('sessions')
    .insert({
      owner_id: user.id,
      kind: 'custom',
      title: custom.title,
      declared_start: custom.declaredStart,
      declared_end: custom.declaredEnd,
      lane_id: custom.laneId,
    })
    .select('*')
    .single();
  if (error) return { ok: false, message: error.message };

  revalidateShelves(data.id);
  return { ok: true, session: data };
}

export async function updateSession(id: string, input: Custom): Promise<SessionResult> {
  const parsed = Custom.safeParse(input);
  if (!parsed.success) return { ok: false, message: 'A session needs a title.' };
  const custom = parsed.data;
  const refused = refuse(custom);
  if (refused) return { ok: false, message: refused };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('sessions')
    .update({
      title: custom.title,
      declared_start: custom.declaredStart,
      declared_end: custom.declaredEnd,
      lane_id: custom.laneId,
    })
    .eq('id', id)
    .select('*')
    .single();
  if (error) return { ok: false, message: error.message };

  revalidateShelves(id);
  return { ok: true, session: data };
}

/** Removes a shelf. Its posts are unshelved, never deleted: the FK sets null. */
export async function deleteSession(id: string): Promise<Done> {
  const supabase = await createClient();
  const { error } = await supabase.from('sessions').delete().eq('id', id);
  if (error) return { ok: false, message: error.message };
  revalidateShelves();
  return { ok: true };
}
