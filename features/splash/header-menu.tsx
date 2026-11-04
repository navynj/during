'use client';

import { useState, useTransition } from 'react';
import { MoreHorizontal, Pin, PinOff } from 'lucide-react';

/**
 * A splash's quiet `…` menu: Pin, the description, Delete with its
 * confirmation. The header's, and the compact bar's once the header has
 * scrolled away (H75); each its own open state.
 */
export function HeaderMenu({
  pinned,
  count,
  canPin,
  canDelete,
  description,
  onPin,
  onDelete,
}: {
  pinned: boolean;
  /** Its blocks, named in the delete confirmation. */
  count: number;
  canPin: boolean;
  canDelete: boolean;
  description: { shown: boolean; onToggle: () => void } | null;
  onPin: (pinned: boolean) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [menu, setMenu] = useState<'closed' | 'open' | 'delete'>('closed');
  const [pending, startTransition] = useTransition();
  const run = (work: () => Promise<void>): void => startTransition(work);
  if (!canPin && !canDelete && !description) return null;
  return (
    <div className="relative shrink-0">
      <button
        type="button"
        aria-label="More"
        aria-expanded={menu !== 'closed'}
        onClick={() => setMenu(menu === 'closed' ? 'open' : 'closed')}
        className="text-pool-500 flex h-8 w-8 items-center justify-center"
      >
        <MoreHorizontal aria-hidden size={18} />
      </button>

      {menu === 'open' ? (
        <ul
          role="menu"
          data-header-menu
          className="border-pool-100 absolute top-full right-0 z-10 flex w-52 flex-col rounded-xl border bg-white py-1 text-sm shadow-lg"
        >
          {canPin ? (
            <li>
              <button
                type="button"
                role="menuitem"
                disabled={pending}
                onClick={() => {
                  setMenu('closed');
                  run(() => onPin(!pinned));
                }}
                className="text-ink hover:bg-pool-100 flex w-full items-center gap-2 px-3 py-2 text-left"
              >
                {pinned ? <PinOff aria-hidden size={14} /> : <Pin aria-hidden size={14} />}
                {pinned ? 'Unpin' : 'Pin'}
              </button>
            </li>
          ) : null}
          {description ? (
            <li>
              <button
                type="button"
                role="menuitem"
                data-description-toggle={description.shown ? 'hide' : 'add'}
                onClick={() => {
                  setMenu('closed');
                  description.onToggle();
                }}
                className="text-ink hover:bg-pool-100 flex w-full items-center gap-2 px-3 py-2 text-left"
              >
                {description.shown ? 'Hide description' : 'Add description'}
              </button>
            </li>
          ) : null}
          {canDelete ? (
            <li>
              <button
                type="button"
                role="menuitem"
                onClick={() => setMenu('delete')}
                className="text-pool-500 hover:bg-pool-100 flex w-full items-center gap-2 px-3 py-2 text-left"
              >
                Delete
              </button>
            </li>
          ) : null}
        </ul>
      ) : null}

      {menu === 'delete' ? (
        <div
          role="alertdialog"
          className="border-pool-100 absolute top-full right-0 z-10 flex w-60 flex-col gap-2 rounded-xl border bg-white px-3 py-2 text-sm shadow-lg"
        >
          <p data-delete-confirm className="text-pool-500">
            Deletes the post and its {count} block{count === 1 ? '' : 's'}.
          </p>
          <span className="flex gap-3">
            <button
              type="button"
              disabled={pending}
              onClick={() => run(onDelete)}
              className="text-main-900 font-medium disabled:opacity-50"
            >
              Delete
            </button>
            <button type="button" onClick={() => setMenu('closed')} className="text-pool-500">
              Keep
            </button>
          </span>
        </div>
      ) : null}
    </div>
  );
}
