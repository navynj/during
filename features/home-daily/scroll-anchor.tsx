'use client';

import { useEffect } from 'react';

import type { Anchor } from './depth';

/**
 * SPEC 5: today opens at the current time with the Add ripple slot in view;
 * any other day opens at the top. Moving the pager resets to these.
 *
 * `key` is the date, so React remounts this on every pager move and the reset
 * happens without watching for navigation. `auto` rather than `smooth`: this
 * is where the page opens, not a journey the reader should watch.
 */
export function ScrollAnchor({ anchor, targetId }: { anchor: Anchor; targetId: string }) {
  useEffect(() => {
    if (anchor === 'top') {
      window.scrollTo({ top: 0, behavior: 'auto' });
      return;
    }

    const target = document.getElementById(targetId);
    if (!target) {
      window.scrollTo({ top: 0, behavior: 'auto' });
      return;
    }
    target.scrollIntoView({ block: 'end', behavior: 'auto' });
  }, [anchor, targetId]);

  return null;
}
