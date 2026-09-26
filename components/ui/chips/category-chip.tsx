'use client';

/**
 * A category chip. Selected is an **ink fill with white text** — ink means
 * selection, blue means action (H20f), so the one blue thing in the sheet is
 * the Drop that commits. Unselected is white with muted text, per
 * `_docs/mockups/sheet-ripple.png`.
 */
export function CategoryChip({
  icon,
  name,
  selected,
  onSelect,
}: {
  icon: string | null;
  name: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      // Small on purpose: the row is the whole category vocabulary, and a
      // chip the size of a button showed three of them before scrolling.
      className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs transition-colors ${
        selected ? 'bg-ink text-white' : 'text-pool-500 hover:bg-pool-100 bg-white'
      }`}
    >
      {icon ? <span aria-hidden>{icon}</span> : null}
      {name}
    </button>
  );
}

/**
 * A lane named on a splash: outline only, never a fill (SPEC 5). The same
 * shape at a smaller size, so a board's chips and the sheet's read as one
 * vocabulary.
 */
export function OutlineChip({
  icon,
  name,
  className = '',
}: {
  icon: string | null;
  name: string;
  className?: string;
}) {
  return (
    <span
      className={`border-pool-100 text-pool-500 inline-flex h-5 shrink-0 items-center gap-1 rounded-full border bg-white px-2 text-[10px] ${className}`}
    >
      {icon ? <span aria-hidden>{icon}</span> : null}
      {name}
    </span>
  );
}
