'use client';

// DORMANT (H21): `+ Add to Splash` belonged to the retired ripple sheet,
// which the dormant focus screen still hosts. Do not wire it back in.

import { useState } from 'react';
import { X } from 'lucide-react';

import { WaveRule } from '@/components/ui/waves/wave-rule';
import type { SplashSummary } from '@/features/splash/summary';

/**
 * `+ Add to Splash` (SPEC 6): a wave-underlined text link, bottom right above
 * the commit. Opens a small board picker, recent first, with *New splash* at
 * the end; once set, the board's **name** takes the link's place — blue, not
 * a chip — on a rule exactly the name's width, with a small × to detach.
 */
export function SplashPicker({
  splashes,
  selected,
  onSelect,
  onNew,
}: {
  splashes: SplashSummary[];
  selected: SplashSummary | null;
  onSelect: (id: string | null) => void;
  /** Hands over to the splash sheet; the new board comes back preset. */
  onNew: () => void;
}) {
  const [open, setOpen] = useState(false);

  if (selected) {
    return (
      <div className="flex justify-end">
        {/* Shrink-wrapped, so the rule underneath is the name's width and
            no more: stretched to the column, never sizing it. */}
        <span data-splash-chip className="flex flex-col items-end">
          <span className="text-main-900 flex items-center gap-1.5 text-base font-medium">
            {selected.title}
            <button
              type="button"
              aria-label="Remove from splash"
              onClick={() => onSelect(null)}
              className="text-pool-500"
            >
              <X aria-hidden size={12} />
            </button>
          </span>
          <span data-splash-rule className="mt-1 block self-stretch contain-inline-size">
            <WaveRule anchor="left" />
          </span>
        </span>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-end">
      {open ? (
        <ul
          role="listbox"
          aria-label="Splash"
          className="border-pool-100 absolute bottom-full mb-2 flex max-h-48 w-56 flex-col overflow-y-auto rounded-xl border bg-white py-1 shadow-lg"
        >
          {splashes.map((splash) => (
            <li key={splash.id}>
              <button
                type="button"
                role="option"
                aria-selected={false}
                onClick={() => {
                  onSelect(splash.id);
                  setOpen(false);
                }}
                className="text-ink hover:bg-pool-100 w-full truncate px-3 py-2 text-left text-sm"
              >
                {splash.title}
              </button>
            </li>
          ))}
          <li>
            <button
              type="button"
              role="option"
              aria-selected={false}
              onClick={() => {
                setOpen(false);
                onNew();
              }}
              className="text-main-900 hover:bg-pool-100 w-full px-3 py-2 text-left text-sm font-medium"
            >
              + New splash
            </button>
          </li>
        </ul>
      ) : null}

      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="text-main-900 flex flex-col items-end text-base font-medium"
      >
        + Add to Splash
        <Rule />
      </button>
    </div>
  );
}

/** The link's rule, which runs off the right edge per the mockup. */
function Rule() {
  return (
    <span data-splash-rule className="mt-1 -mr-5 block w-40">
      <WaveRule anchor="left" />
    </span>
  );
}
