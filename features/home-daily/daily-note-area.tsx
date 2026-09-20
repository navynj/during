import type { RippleWithCategory } from '@/lib/queries/ripples';

/**
 * SPEC 5.3: records that belong to the date without a time. Several per day
 * are allowed (H5), so they stack rather than collapsing into one caption.
 * They sit above the axis because they have no position on it.
 */
export function DailyNoteArea({ notes }: { notes: RippleWithCategory[] }) {
  if (notes.length === 0) {
    return (
      // TODO(S5): final empty-state copy. The prompt is an invitation, never a
      // reproach — SPEC 1's no-guilt hypothesis. Ghosted the same way as the
      // Add ripple slot: #0507C9 faded, not a paler token.
      <p className="text-main-900 pb-3 text-sm" style={{ opacity: 0.35 }}>
        Add a Daily Note
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-1 pb-3">
      {notes.map((note) => (
        <li key={note.id} className="text-ink flex items-baseline gap-2 text-sm">
          {note.category?.icon ? <span aria-hidden>{note.category.icon}</span> : null}
          <span>{note.note}</span>
        </li>
      ))}
    </ul>
  );
}
