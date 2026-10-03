'use client';

import { usePathname, useRouter } from 'next/navigation';

import { RecentBlocks, type RecentItem } from '@/features/splash/recent-blocks';
import { SplashComposer } from '@/features/splash-sheet/splash-composer';
import {
  SplashSheet,
  type DropHandoff,
  type SheetContext,
} from '@/features/splash-sheet/splash-sheet';

import { useInputSheet } from './sheet-provider';

/**
 * A drop, handed over (CLAUDE.md, the principle): the ground seats the pill
 * and plays the ripple at once, the view scopes to the post's month, and the
 * action runs behind it; a refusal takes the pill back and says why.
 */
function useDrop(): (drop: DropHandoff) => void {
  const { markDropped, dropFailed } = useInputSheet();
  const router = useRouter();
  return (drop) => {
    markDropped({ splash: drop.splash, month: drop.month, note: drop.note });
    router.push(`/?m=${drop.month}`);
    void drop.commit().then((result) => {
      if (!result.ok) dropFailed(result.message);
      else router.refresh();
    });
  };
}

/**
 * Mounts the post sheet when the provider says it is open: the phone's way
 * in, from the FAB. Lives in the shell, so the FAB reaches it from every tab.
 */
export function SheetHost({ context }: { context: SheetContext }) {
  const { sheet, closeSheet } = useInputSheet();
  const drop = useDrop();

  if (!sheet) return null;

  return (
    <div className="lg:hidden">
      <SplashSheet
        context={context}
        onClose={closeSheet}
        onDrop={(handoff) => {
          closeSheet();
          drop(handoff);
        }}
      />
    </div>
  );
}

/**
 * The wide screen's composer (review): not a sheet but a rounded white card
 * standing in the right half, always there with *Drop your splash* waiting,
 * and beneath it the recent column: my latest blocks under their posts'
 * titles. On Home it floats on the water; elsewhere it sits on the page.
 * Not on a post's page, whose right half holds the post's blocks instead.
 */
export function ComposerPanel({
  context,
  recent = [],
}: {
  context: SheetContext;
  recent?: RecentItem[];
}) {
  const pathname = usePathname();
  const drop = useDrop();
  const onWater = pathname === '/';
  if (pathname.startsWith('/splash/')) return null;

  return (
    <aside
      data-composer-panel
      className={`no-scrollbar hidden lg:sticky lg:top-0 lg:flex lg:h-[calc(100dvh-var(--tab-bar-h))] lg:w-1/2 lg:shrink-0 lg:flex-col lg:items-center lg:gap-8 lg:overflow-y-auto lg:p-8 ${
        onWater ? 'water-ground' : 'bg-pool-100'
      }`}
    >
      <div className="w-full max-w-xl shrink-0 rounded-[32px] bg-white px-8 py-8">
        <SplashComposer context={context} onDrop={drop} autoFocus={false} />
      </div>
      {/* The column reads white on the water; on a page it reads in ink. */}
      <div
        className={`flex w-full max-w-xl flex-col ${onWater ? '' : '[&_[data-recent-title]]:text-ink [&_[data-recent-preview]]:text-ink/80 [&_[data-recent-day]]:text-pool-500'}`}
      >
        <RecentBlocks items={recent} today={context.today} />
      </div>
    </aside>
  );
}
