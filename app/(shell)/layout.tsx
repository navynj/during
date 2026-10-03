import { TabBar } from '@/components/ui/tab-bar';
import { SheetHost } from '@/features/input-sheet/sheet-host';
import { InputSheetProvider } from '@/features/input-sheet/sheet-provider';
import { customSessions } from '@/features/sessions/shelves';
import { getMyCategories, getMyProfile } from '@/lib/queries/profile';
import { getMySessions } from '@/lib/queries/sessions';
import { createClient } from '@/lib/supabase/server';
import { todayIn } from '@/lib/time';

/**
 * The shell: the page, the tab bar, and the one sheet. The sheet lives here
 * rather than on a page because its entry point does — the FAB is on every
 * screen. Each page lays out its own column, because Home's ground is
 * full-bleed and the white pages are not.
 */
export default async function ShellLayout({ children }: LayoutProps<'/'>) {
  const supabase = await createClient();
  const profile = await getMyProfile(supabase);

  // The sheet needs the lanes and the shelves; a page without a profile
  // redirects to sign-in on its own, so the shell just renders around it.
  const context = profile
    ? await (async () => {
        const [categories, sessions] = await Promise.all([
          getMyCategories(supabase),
          getMySessions(supabase, profile.id),
        ]);
        return {
          categories,
          sessions: customSessions(sessions),
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
