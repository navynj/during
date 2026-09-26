'use client';

import { WaveLine } from '@/components/ui/waves';

import type { HomeMode } from './flow';

/**
 * The header toggle (SPEC 5): one wave = ripple mode, two waves = splash
 * mode. The active segment is an **ink fill** — ink means selection, blue
 * means action (H20f) — with the wave drawn white against it.
 */
export function ModeToggle({
  mode,
  onChange,
}: {
  mode: HomeMode;
  onChange: (next: HomeMode) => void;
}) {
  return (
    <div role="group" aria-label="View" className="bg-pool-100 inline-flex rounded-full p-0.5">
      <Segment
        label="Ripples"
        lines={1}
        selected={mode === 'ripple'}
        onClick={() => onChange('ripple')}
      />
      <Segment
        label="Splashes"
        lines={2}
        selected={mode === 'splash'}
        onClick={() => onChange('splash')}
      />
    </div>
  );
}

function Segment({
  label,
  lines,
  selected,
  onClick,
}: {
  label: string;
  lines: number;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={selected}
      onClick={onClick}
      className={`flex h-6 w-8 flex-col items-center justify-center gap-px rounded-full transition-colors ${
        selected ? 'bg-ink text-white' : 'text-ink'
      }`}
      style={{ ['--wave-ink' as string]: selected ? '#ffffff' : 'var(--color-ink)' }}
    >
      {Array.from({ length: lines }, (_, index) => (
        <WaveLine key={index} width={16} />
      ))}
    </button>
  );
}
