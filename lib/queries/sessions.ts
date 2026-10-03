import type { Session } from '@/features/sessions/shelves';
import type { DuringClient } from '@/lib/queries/profile';

/** My shelves, monthly and custom. RLS makes them mine. */
export async function getMySessions(supabase: DuringClient, ownerId: string): Promise<Session[]> {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}
