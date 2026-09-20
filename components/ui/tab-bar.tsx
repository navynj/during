'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Plus, ShelvingUnit, type LucideIcon } from 'lucide-react';

import { useInputSheet } from '@/features/input-sheet/sheet-provider';

/**
 * D3: tab slots are full by design and the bar grows only as screens ship.
 * Lanes and Pools are deliberately absent until v1b and v1.5 — a dead tab is
 * forbidden, so this list is the shipped surface, not a plan.
 */
const TABS: ReadonlyArray<{ href: string; label: string; icon: LucideIcon }> = [
  { href: '/', label: 'Home', icon: Home },
  // lucide calls the shelves glyph ShelvingUnit.
  { href: '/locker', label: 'Locker', icon: ShelvingUnit },
];

export function TabBar() {
  const pathname = usePathname();

  return (
    <nav className="border-pool-200 sticky bottom-0 border-t bg-white">
      <div className="mx-auto flex max-w-xl items-center justify-around px-6 py-3">
        {TABS.map((tab) => {
          const active = tab.href === '/' ? pathname === '/' : pathname.startsWith(tab.href);
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
        <AddRippleButton />
      </div>
    </nav>
  );
}

function AddRippleButton() {
  // The FAB is one of the input sheet's three entry points (E6): blank prefill.
  const { openSheet } = useInputSheet();

  return (
    <button
      type="button"
      aria-label="Add ripple"
      onClick={() => openSheet()}
      className="bg-main-900 flex h-12 w-12 items-center justify-center rounded-full text-white"
    >
      <Plus aria-hidden size={24} />
    </button>
  );
}
