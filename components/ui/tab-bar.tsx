'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/**
 * D3: tab slots are full by design and the bar grows only as screens ship.
 * Lanes and Pools are deliberately absent until v1b and v1.5 — a dead tab is
 * forbidden, so this list is the shipped surface, not a plan.
 */
const TABS = [
  { href: '/', label: 'Home' },
  { href: '/locker', label: 'Locker' },
] as const;

export function TabBar() {
  const pathname = usePathname();

  return (
    <nav className="border-pool-200 sticky bottom-0 border-t bg-white">
      <div className="mx-auto flex max-w-xl items-center justify-around px-6 py-3">
        {TABS.map((tab) => {
          const active = tab.href === '/' ? pathname === '/' : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? 'page' : undefined}
              className={
                active ? 'text-main-900 text-sm font-semibold' : 'text-pool-500 text-sm font-medium'
              }
            >
              {tab.label}
            </Link>
          );
        })}
        <AddRippleButton />
      </div>
    </nav>
  );
}

function AddRippleButton() {
  // The FAB is one of the input sheet's three entry points (E6, blank prefill).
  // The sheet itself lands in S3; until then the button is present but inert.
  return (
    <button
      type="button"
      aria-label="Add ripple"
      className="bg-main-900 h-12 w-12 rounded-full text-2xl leading-none text-white"
    >
      +
    </button>
  );
}
