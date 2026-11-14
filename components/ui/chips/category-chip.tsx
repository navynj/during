'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';

/**
 * A category chip. Selected is an **ink fill with white text** — ink means
 * selection, blue means action (H20f), so the one blue thing in the sheet is
 * the Drop that commits. Unselected is a quiet surface with muted text, so
 * the row reads on a white page as well as on the old sheet's grey band.
 * `onInk` is the same chip set inside an ink-filled one — a pool turned on
 * in Share to (H75) — a lighter wash of white so it stays legible there.
 */
export function CategoryChip({
  icon,
  name,
  selected,
  onSelect,
  onInk = false,
  trailing = null,
  className = '',
  ...rest
}: {
  icon: string | null;
  name: string;
  selected: boolean;
  onSelect: () => void;
  /** Inside an ink-filled chip (H75). */
  onInk?: boolean;
  /** After the name: a chevron where the chip opens a picker. */
  trailing?: ReactNode;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick' | 'type' | 'children'>) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={onInk ? undefined : selected}
      {...rest}
      // Small on purpose: the row is the whole category vocabulary, and a
      // chip the size of a button showed three of them before scrolling.
      className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs transition-colors ${
        onInk
          ? 'bg-white/20 text-white hover:bg-white/30'
          : selected
            ? 'bg-(--accent-fill) text-(--accent-contrast)'
            : 'text-pool-500 hover:bg-pool-200 bg-pool-100'
      } ${className}`}
    >
      {icon ? <span aria-hidden>{icon}</span> : null}
      {name}
      {trailing}
    </button>
  );
}

/**
 * A lane named on a splash: outline only, never a fill (SPEC 5). The same
 * shape at a smaller size, so a board's chips and the sheet's read as one
 * vocabulary. A board with several lanes shows one chip and a `+N` at its
 * right end, rather than a row of chips.
 */
export function OutlineChip({
  icon,
  name,
  more = 0,
  className = '',
}: {
  icon: string | null;
  name: string;
  /** How many further lanes the chip stands for. */
  more?: number;
  className?: string;
}) {
  return (
    <span
      className={`border-pool-100 text-pool-500 inline-flex h-5 shrink-0 items-center gap-1 rounded-full border bg-white px-2 text-[10px] ${className}`}
    >
      {icon ? <span aria-hidden>{icon}</span> : null}
      {name}
      {more > 0 ? (
        <span data-more-lanes className="text-ink pl-0.5">
          +{more}
        </span>
      ) : null}
    </span>
  );
}
