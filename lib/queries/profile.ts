import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/lib/database.types';

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type MyCategory = Database['public']['Tables']['my_categories']['Row'];
export type DuringClient = SupabaseClient<Database>;

export async function getMyProfile(supabase: DuringClient): Promise<Profile | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // RLS already limits this to self and linked users; the filter is what makes
  // it a single row, not what makes it safe.
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getMyCategories(supabase: DuringClient): Promise<MyCategory[]> {
  const { data, error } = await supabase
    .from('my_categories')
    .select('*')
    .order('position', { ascending: true });

  if (error) throw error;
  return data;
}
