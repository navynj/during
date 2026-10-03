import { TabBar } from '@/components/ui/tab-bar';
import { SheetHost } from '@/features/input-sheet/sheet-host';
import { InputSheetProvider } from '@/features/input-sheet/sheet-provider';
import { getMyCategories, getMyProfile } from '@/lib/queries/profile';
import { createClient } from '@/lib/supabase/server';
import { todayIn } from '@/lib/time';

/**
 * The shell: the page, the tab bar, and the one sheet. The sheet lives here
 * rather than on a page because its entry point does — the FAB is on every
 * screen. The sheet needs the lanes only: sessions are date-based, so the
 * sheet has no session field. Each page lays out its own column, because Home's ground is
 * full-bleed and the white pages are not.
 */
export default async function ShellLayout({ children }: LayoutProps<'/'>) {
  const supabase = await createClient();
  const profile = await getMyProfile(supabase);

  // The sheet needs the lanes and the shelves; a page without a profile
  // redirects to sign-in on its own, so the shell just renders around it.
  const context = profile
    ? await (async () => {
        const categories = await getMyCategories(supabase);
        return {
          categories,
          timeZone: profile.timezone,
          today: todayIn(profile.timezone),
        };
      })()
    : null;

  return (
    <InputSheetProvider>
      <div className="flex min-h-dvh flex-col">
        {children}
        <TabBar />
      </div>
      {context ? <SheetHost context={context} /> : null}
    </InputSheetProvider>
  );
}
