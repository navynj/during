'use client';

import { useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronDown, ChevronUp } from 'lucide-react';

import { DeletedRowsHidden, PendingDropHead } from '@/features/splash/pending-drop';
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
 * the post's blocks instead. The card minimises to one line (review), so the
 * Trail beneath can be read on its own; the choice is remembered per
 * browser.
 */
const MINIMIZED_KEY = 'during.composer-minimized';

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
  const [minimized, setMinimized] = useState(() => {
    try {
      return window.localStorage.getItem(MINIMIZED_KEY) === '1';
    } catch {
      return false;
    }
  });
  if (pathname.startsWith('/splash/')) return null;

  function minimize(next: boolean): void {
    setMinimized(next);
    try {
      window.localStorage.setItem(MINIMIZED_KEY, next ? '1' : '0');
    } catch {
      // Not remembered, then.
    }
  }

  return (
    <aside
      data-composer-panel
      className={`no-scrollbar hidden lg:sticky lg:top-0 lg:flex lg:h-[calc(100dvh-var(--tab-bar-h))] lg:w-1/2 lg:shrink-0 lg:flex-col lg:items-center lg:gap-8 lg:overflow-y-auto lg:p-8 ${
        onWater ? 'water-ground' : 'bg-pool-100'
      }`}
    >
      {minimized ? (
        // One line, with the invitation still on it: tap to open the composer back up.
        <button
          type="button"
          aria-label="Open the composer"
          data-composer-minimized
          onClick={() => minimize(false)}
          className="flex w-full max-w-xl shrink-0 items-center justify-between rounded-[32px] bg-white px-8 py-5 text-left"
        >
          <span className="text-main-900 text-2xl font-semibold opacity-20">Drop your splash</span>
          <ChevronDown aria-hidden size={18} className="text-pool-500" />
        </button>
      ) : (
        <div className="relative w-full max-w-xl shrink-0 rounded-[32px] bg-white px-8 py-8">
          <button
            type="button"
            aria-label="Minimize the composer"
            data-composer-minimize
            onClick={() => minimize(true)}
            className="text-pool-500 absolute top-4 right-5 flex h-8 w-8 items-center justify-center"
          >
            <ChevronUp aria-hidden size={18} />
          </button>
          <SplashComposer context={context} onDrop={drop} autoFocus={false} />
        </div>
      )}
      {/* The Trail, in its own white card: the Locker on a wide screen. */}
      <div data-panel-trail className="w-full max-w-xl shrink-0 rounded-[32px] bg-white px-8 py-6">
        <PendingDropHead today={context.today} />
        <DeletedRowsHidden />
        {trail}
      </div>
    </aside>
  );
}
