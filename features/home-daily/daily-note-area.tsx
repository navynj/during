'use client';

import { useInputSheet } from '@/features/input-sheet/sheet-provider';
import type { RippleWithCategory } from '@/lib/queries/ripples';

import { DailyNoteRow } from './daily-note-row';

/**
 * SPEC 5.3: records that belong to the date without a time. Several per day
 * are allowed (H5), so they stack rather than collapsing into one caption.
 * They sit above the axis because they have no position on it.
 */
export function DailyNoteArea({ notes }: { notes: RippleWithCategory[] }) {
  const { openSheet } = useInputSheet();

  return (
    <div className="flex flex-col gap-1 pb-3">
      {notes.map((note) => (
        <DailyNoteRow key={note.id} note={note} />
      ))}

      {/*
        The prompt stays whether or not the day already has notes: several are
        allowed per day (H5), so it is a standing invitation rather than an
        empty state. An invitation, never a reproach — SPEC 1's no-guilt
        hypothesis. Ghosted like the Add ripple slot: #0507C9 faded, not a
        paler token. It opens the sheet with no time, which is what a Daily
        Note is.
      */}
      <button
        type="button"
        onClick={() => openSheet({ allDay: true })}
        className="text-main-900 self-start text-left text-sm"
        style={{ opacity: 0.35 }}
      >
        Add a Daily Note
      </button>
    </div>
  );
}
