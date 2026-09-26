'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Plus, ShelvingUnit, Waves, type LucideIcon } from 'lucide-react';

import { WaveLine } from '@/components/ui/waves';
import { useInputSheet } from '@/features/input-sheet/sheet-provider';

/**
 * D3: tab slots are full by design and the bar grows only as screens ship.
 * Pools is deliberately absent until P3 — a dead tab is forbidden, so this
 * list is the shipped surface, not a plan.
 */
const TABS: ReadonlyArray<{ href: string; label: string; icon: LucideIcon }> = [
  { href: '/', label: 'Home', icon: Home },
  // Lanes are divisions of the water, which is what the glyph draws. The
  // mockup's icon is a lane-rope figure with no lucide equivalent.
  { href: '/lanes', label: 'Lanes', icon: Waves },
  // lucide calls the shelves glyph ShelvingUnit.
  { href: '/locker', label: 'Locker', icon: ShelvingUnit },
];

export function TabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="sticky bottom-0 z-20 bg-white"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {/* A fixed height, so anything sitting exactly on top of it can say so. */}
      <div className="mx-auto flex h-[var(--tab-bar-h)] max-w-xl items-center justify-between px-6">
        <AddSplashButton />

        <div className="flex items-center gap-8">
          {TABS.map((tab) => {
            const active =
              tab.href === '/'
                ? pathname === '/' || pathname.startsWith('/splash')
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

        <AddRippleButton />
      </div>
    </nav>
  );
}

/** The FAB, bottom right: the ripple sheet, in both modes (SPEC 5). */
function AddRippleButton() {
  const { openSheet } = useInputSheet();

  return (
    <button
      type="button"
      aria-label="Drop a ripple"
      onClick={() => openSheet()}
      className="bg-main-900 flex h-12 w-12 items-center justify-center rounded-full text-white"
    >
      <Plus aria-hidden size={24} />
    </button>
  );
}

/**
 * The bar's left `+ with wave`: the splash sheet, in both modes (SPEC 5). A
 * plus over a wave, per the mockup — the board is the water a ripple lands
 * in. Blue as action colour (H20f): it creates.
 */
function AddSplashButton() {
  const { openSplashSheet } = useInputSheet();

  return (
    <button
      type="button"
      aria-label="Drop a splash"
      onClick={openSplashSheet}
      className="text-main-900 flex flex-col items-center"
    >
      <span className="text-2xl leading-none font-medium">+</span>
      <WaveLine width={40} />
    </button>
  );
}
