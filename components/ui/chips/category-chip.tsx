'use client';

/**
 * A category chip. The one place #787BE2 is a foreground (H8): selected fills
 * with ink and reverses, unselected carries the chip colour on a pale ground.
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
      className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
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
