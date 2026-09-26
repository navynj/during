import { TabBar } from '@/components/ui/tab-bar';
import { SheetHost } from '@/features/input-sheet/sheet-host';
import { InputSheetProvider } from '@/features/input-sheet/sheet-provider';
import { getMyCategories, getMyProfile } from '@/lib/queries/profile';
import { getMySplashes, summarizeSplashes } from '@/lib/queries/splashes';
import { createClient } from '@/lib/supabase/server';
import { todayIn } from '@/lib/time';

/**
 * The shell: the page, the tab bar, and the two input sheets. The sheets live
 * here rather than on a page because their entry points do — the FAB and the
 * tab bar's splash button are on every screen, and a board's +Drop is on two.
 */
export default async function ShellLayout({ children }: LayoutProps<'/'>) {
  const supabase = await createClient();
  const profile = await getMyProfile(supabase);

  // The sheets need the lanes and the boards; a page without a profile
  // redirects to sign-in on its own, so the shell just renders around it.
  const context = profile
    ? await (async () => {
        const [categories, splashes, members] = await Promise.all([
          getMyCategories(supabase),
          getMySplashes(supabase, profile.id),
          supabase
            .from('ripples')
            .select('splash_id, category_id, occurred_on, occurred_time, created_at')
            .eq('author_id', profile.id)
            .not('splash_id', 'is', null),
        ]);
        return {
          categories,
          splashes: summarizeSplashes(
            splashes,
            (members.data ?? []) as Parameters<typeof summarizeSplashes>[1],
            profile.timezone,
            new Date(),
          ),
          timeZone: profile.timezone,
          today: todayIn(profile.timezone),
        };
      })()
    : null;

  return (
    <InputSheetProvider>
      <div className="flex min-h-dvh flex-col">
        <div className="mx-auto flex w-full max-w-xl flex-1 flex-col px-6">{children}</div>
        <TabBar />
      </div>
      {context ? <SheetHost context={context} /> : null}
    </InputSheetProvider>
  );
}
