/**
 * How long a timed Ripple ran. Only timed Ripples carry one: E2 is explicit
 * that a drop makes no duration claim, and giving it a tag here would invent
 * the fake-duration the decision rejected.
 *
 * The chip foreground is #787BE2 — the one text use the palette allows it
 * (H8), and the timeline's first legitimate consumer of it.
 */
export function DurationChip({ minutes }: { minutes: number }) {
  return (
    <span className="bg-pool-100 text-main-400 rounded px-1.5 py-0.5 text-[11px] font-medium tabular-nums">
      {formatDuration(minutes)}
    </span>
  );
}

/** `45m`, `1h`, `1h 30m` — never `90m`, which reads as a number to compare. */
export function formatDuration(minutes: number): string {
  const whole = Math.max(0, Math.round(minutes));
  const hours = Math.floor(whole / 60);
  const rest = whole % 60;

  if (hours === 0) return `${rest}m`;
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
}
