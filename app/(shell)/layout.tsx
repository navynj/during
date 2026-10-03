import { TabBar } from '@/components/ui/tab-bar';
import { ComposerPanel, SheetHost } from '@/features/input-sheet/sheet-host';
import { InputSheetProvider } from '@/features/input-sheet/sheet-provider';
import { getMyCategories, getMyProfile } from '@/lib/queries/profile';
import { getMyTrail } from '@/lib/queries/trail';
import { recentItems } from '@/features/splash/recent-blocks';
import { createClient } from '@/lib/supabase/server';
import { todayIn } from '@/lib/time';

/**
 * The shell: the page, the tab bar, and the composer — a bottom sheet from
 * the FAB on a phone, a standing card in the right half on a wide screen
 * (review). Each page lays out its own column, because Home's ground is
 * full-bleed and the white pages are not. The composer needs the lanes
 * only: sessions are date-based, so it has no session field.
 */
export default async function ShellLayout({ children }: LayoutProps<'/'>) {
  const supabase = await createClient();
  const profile = await getMyProfile(supabase);

  // A page without a profile redirects to sign-in on its own, so the shell
  // just renders around it.
  const context = profile
    ? {
        categories: await getMyCategories(supabase),
        timeZone: profile.timezone,
        today: todayIn(profile.timezone),
      }
    : null;
  // The recent column under the wide screen's composer: the Trail's head.
  const recent =
    profile && context
      ? recentItems(await getMyTrail(supabase, profile.id, profile.timezone), profile.timezone)
      : [];

  return (
    <InputSheetProvider>
      <div className="flex min-h-dvh flex-col">
        <div className="flex flex-1 flex-col lg:flex-row">
          <div className="flex min-w-0 flex-1 flex-col">{children}</div>
          {context ? <ComposerPanel context={context} recent={recent} /> : null}
        </div>
        <TabBar />
      </div>
      {context ? <SheetHost context={context} /> : null}
    </InputSheetProvider>
  );
}
