'use client';

import { ChevronDown, ChevronUp, type LucideIcon } from 'lucide-react';

/**
 * The month navigator (SPEC 5): the sticky header's label names the month on
 * top, and the chevrons beside it jump to the newer month (up, the way the
 * scroll goes) or the older (down). Disabled at either end. Chrome, not
 * content: inactive is the item faded, never a paler token.
 */
export function MonthNav({
  label,
  newer,
  older,
  onJump,
}: {
  label: string;
  /** The adjacent months, `null` at an end. */
  newer: string | null;
  older: string | null;
  onJump: (month: string) => void;
}) {
  return (
    <div data-month-nav className="flex items-center gap-1">
      <p className="text-main-900 text-xs font-medium">{label}</p>
      <Step label="Newer month" month={newer} icon={ChevronUp} onJump={onJump} />
      <Step label="Older month" month={older} icon={ChevronDown} onJump={onJump} />
    </div>
  );
}

function Step({
  label,
  month,
  icon: Icon,
  onJump,
}: {
  label: string;
  month: string | null;
  icon: LucideIcon;
  onJump: (month: string) => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={month === null}
      onClick={() => month !== null && onJump(month)}
      className="text-main-900 flex h-6 w-6 items-center justify-center disabled:opacity-20"
    >
      <Icon aria-hidden size={14} />
    </button>
  );
}
