import {
  byRecency,
  summarizeSplash,
  type Splash,
  type SplashSummary,
} from '@/features/splash/summary';
import type { DuringClient } from '@/lib/queries/profile';
import type { RippleWithCategory } from '@/lib/queries/ripples';

/** My boards. RLS makes them mine; the filter makes the intent legible. */
export async function getMySplashes(supabase: DuringClient, ownerId: string): Promise<Splash[]> {
  const { data, error } = await supabase
    .from('splashes')
    .select('*')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

/** Every board summarised against the fragments it holds, recent first. */
export function summarizeSplashes(
  splashes: Splash[],
  ripples: RippleWithCategory[],
  timeZone: string,
  now: Date,
): SplashSummary[] {
  return splashes
    .map((splash) =>
      summarizeSplash(
        splash,
        ripples.filter((r) => r.splash_id === splash.id),
        timeZone,
        now,
      ),
    )
    .sort(byRecency);
}
