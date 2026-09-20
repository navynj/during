'use client';

/**
 * A category chip. Selected takes the action colour as a fill (H8); ink is a
 * text colour and never a surface. Unselected is an outline carrying #787BE2,
 * the one place the palette allows it as a foreground.
 *
 * Shape follows _docs/mockups/Home - Input.png by eye — a first pass, to be
 * replaced by the Figma export's radius and padding.
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
      className={`flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
        selected
          ? 'border-ink bg-ink text-white'
          : 'border-pool-200 text-main-400 hover:bg-pool-100 bg-white'
      }`}
    >
      {icon ? <span aria-hidden>{icon}</span> : null}
      {name}
    </button>
  );
}
