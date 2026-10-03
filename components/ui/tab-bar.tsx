'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Plus, ShelvingUnit, type LucideIcon } from 'lucide-react';

import { COLUMN_MAX_WIDTH } from '@/components/ui/column';
import { useInputSheet } from '@/features/input-sheet/sheet-provider';

/**
 * D3: tab slots are full by design and the bar grows only as screens ship.
 * Pools and Friends are reserved seats — a dead tab is forbidden, so this
 * list is the shipped surface, not a plan. Home / Locker (H21, review): the
 * lanes view is Home's header, and session management is the sheet the
 * scrubber's `=` opens.
 */
const TABS: ReadonlyArray<{ href: string; label: string; icon: LucideIcon }> = [
  { href: '/', label: 'Home', icon: Home },
  // lucide calls the shelves glyph ShelvingUnit.
  { href: '/locker', label: 'Locker', icon: ShelvingUnit },
];

export function TabBar() {
  const pathname = usePathname();

  return (
    // The bar's top corners are cut large and it overlaps the page above it
    // by that radius (`-mt-10`), so on the ground the blue shows through the
    // corners as the mockup draws it; pages pad their bottoms by the same
    // amount so nothing hides under the overlap.
    <nav
      data-tab-bar
      className="sticky bottom-0 z-20 -mt-10 rounded-t-[40px] bg-white"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {/* A fixed height, so anything sitting exactly on top of it can say so. */}
      <div
        className={`mx-auto flex h-[var(--tab-bar-h)] ${COLUMN_MAX_WIDTH} items-center justify-between px-6`}
      >
        <div className="flex items-center gap-7">
          {TABS.map((tab) => {
            // A post's page and a shelf are reached from Home, so Home stays lit.
            const active =
              tab.href === '/'
                ? pathname === '/' ||
                  pathname.startsWith('/splash') ||
                  pathname.startsWith('/sessions')
                : pathname.startsWith(tab.href);
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={active ? 'page' : undefined}
                className={`flex flex-col items-center gap-1 ${
                  active ? 'text-main-900 font-semibold' : 'text-main-900 font-medium opacity-20'
                }`}
              >
                {/* The label carries the meaning; the glyph is decoration. */}
                <Icon aria-hidden size={20} strokeWidth={active ? 2.25 : 2} />
                <span className="text-xs/none">{tab.label}</span>
              </Link>
            );
          })}
        </div>

        <AddSplashButton />
      </div>
    </nav>
  );
}

/** The FAB, bottom right: the phone's one entry (SPEC 5, H21); a wide screen has the standing composer instead. */
function AddSplashButton() {
  const { openSheet } = useInputSheet();

  return (
    <button
      type="button"
      aria-label="Drop a splash"
      onClick={openSheet}
      className="bg-main-900 flex h-12 w-12 items-center justify-center rounded-full text-white lg:hidden"
    >
      <Plus aria-hidden size={24} />
    </button>
  );
}
