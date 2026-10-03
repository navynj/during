'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

import { QuietAffordance } from '@/features/input-sheet/annotation-control';
import type { Session } from '@/features/sessions/shelves';

/**
 * `+ Add to Session` (SPEC 6): a picker of custom shelves, recent first, plus
 * *New session*. Once set, the shelf's name takes the affordance's place with
 * a small × to take it off. One post sits on at most one shelf, so choosing
 * replaces.
 */
export function SessionPicker({
  sessions,
  selectedId,
  onSelect,
  onNew,
}: {
  sessions: Session[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  /** Hands over to the Sessions tab's create form. */
  onNew?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = sessions.find((s) => s.id === selectedId) ?? null;

  if (selected) {
    return (
      <span
        data-session-chip
        className="bg-pool-100 text-ink inline-flex h-[23px] items-center gap-1 rounded-[5px] px-2 text-[10px]"
      >
        {selected.title}
        <button type="button" aria-label="Remove from session" onClick={() => onSelect(null)}>
          <X aria-hidden size={11} />
        </button>
      </span>
    );
  }

  return (
    <span className="relative">
      {open ? (
        <ul
          role="listbox"
          aria-label="Session"
          className="border-pool-100 absolute bottom-full left-0 mb-2 flex max-h-48 w-56 flex-col overflow-y-auto rounded-xl border bg-white py-1 shadow-lg"
        >
          {sessions.map((session) => (
            <li key={session.id}>
              <button
                type="button"
                role="option"
                aria-selected={false}
                onClick={() => {
                  onSelect(session.id);
                  setOpen(false);
                }}
                className="text-ink hover:bg-pool-100 w-full truncate px-3 py-2 text-left text-sm"
              >
                {session.title}
              </button>
            </li>
          ))}
          {onNew ? (
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
                + New session
              </button>
            </li>
          ) : null}
          {sessions.length === 0 && !onNew ? (
            <li className="text-pool-500 px-3 py-2 text-sm">No sessions yet.</li>
          ) : null}
        </ul>
      ) : null}
      <QuietAffordance onClick={() => setOpen((v) => !v)} label="+ Add to Session" />
    </span>
  );
}
