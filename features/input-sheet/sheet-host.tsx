'use client';

import type { ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { PendingDropHead } from '@/features/splash/pending-drop';
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
 * and beneath it the Locker's Trail — a wide screen has no Locker tab; the
 * archive reads here, under the composer. On Home it floats on the water;
 * elsewhere it sits on the page. Not on a post's page, whose right half holds
 * the post's blocks instead.
 */
export function ComposerPanel({
  context,
  trail,
}: {
  context: SheetContext;
  /** The Trail, rendered by the server layout. */
  trail?: ReactNode;
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
      {/* The Trail, in its own white card: the Locker on a wide screen. */}
      <div data-panel-trail className="w-full max-w-xl shrink-0 rounded-[32px] bg-white px-8 py-6">
        <PendingDropHead today={context.today} />
        {trail}
      </div>
    </aside>
  );
}
