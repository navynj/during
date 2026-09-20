'use client';

import { useInputSheet } from '@/features/input-sheet/sheet-provider';
import { useRippleSheet } from '@/features/ripple-sheet/sheet-host';
import type { RippleWithCategory } from '@/lib/queries/ripples';

/**
 * SPEC 5.3: records that belong to the date without a time. Several per day
 * are allowed (H5), so they stack rather than collapsing into one caption.
 * They sit above the axis because they have no position on it.
 */
export function DailyNoteArea({ notes }: { notes: RippleWithCategory[] }) {
  const { openRipple } = useRippleSheet();
  const { openSheet } = useInputSheet();
  if (notes.length === 0) {
    return (
      // An invitation, never a reproach — SPEC 1's no-guilt hypothesis.
      // Ghosted like the Add ripple slot: #0507C9 faded, not a paler token.
      // It opens the sheet with no time, which is what a Daily Note is.
      <button
        type="button"
        onClick={() => openSheet({ allDay: true })}
        className="text-main-900 pb-3 text-left text-sm"
        style={{ opacity: 0.35 }}
      >
        Add a Daily Note
      </button>
    );
  }

  return (
    <ul className="flex flex-col gap-1 pb-3">
      {notes.map((note) => (
        <li key={note.id}>
          <button
            type="button"
            onClick={() => openRipple(note.id)}
            className="text-ink flex items-baseline gap-2 text-left text-sm"
          >
            {note.category?.icon ? <span aria-hidden>{note.category.icon}</span> : null}
            <span>{note.note}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
