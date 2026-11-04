'use client';

import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';

/**
 * The header in one line, once its title has scrolled away (H75): the
 * splash's emoji, its title truncated, the Audience chip and the `…` menu,
 * pinned to the top of the scroll on white, about 48px. It takes no room in
 * the flow, so its arrival moves nothing; it fades in, and out again as
 * the title comes back — and is not there at all while hidden, so its
 * chip and menu are never a second copy of the header's. Tabs, when there
 * are any, pin under it.
 */
export function CompactBar({
  shown,
  icon,
  title,
  untitled,
  audience,
  menu,
  ruled,
}: {
  shown: boolean;
  icon: string | null;
  title: string;
  /** Read in place of an empty title, faint, as the header does. */
  untitled: string;
  audience: ReactNode;
  menu: ReactNode;
  /** No tab row under it: its own hairline. */
  ruled: boolean;
}) {
  return (
    <div className="sticky top-0 z-20 h-0">
      <AnimatePresence>
        {shown ? (
          <motion.div
            data-compact-bar
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className={`absolute -inset-x-6 top-0 flex h-12 items-center gap-2 bg-white px-6 lg:-inset-x-8 lg:px-8 ${
              ruled ? 'border-pool-100 border-b' : ''
            }`}
          >
            {icon ? (
              <span aria-hidden className="shrink-0 text-lg/none">
                {icon}
              </span>
            ) : null}
            <p
              data-compact-title
              className="text-ink min-w-0 flex-1 truncate text-base font-semibold"
            >
              {title.trim() ? title : <span className="opacity-30">{untitled}</span>}
            </p>
            {audience}
            {menu}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
