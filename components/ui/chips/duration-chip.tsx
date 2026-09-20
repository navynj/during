'use client';

import { useEffect, useState } from 'react';

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

/**
 * A running timer's chip counts up. Ticking every 15s rather than every
 * second: the label is minutes, so a faster clock would re-render for nothing,
 * and law 3 only licenses movement for things that are actually alive.
 *
 * The elapsed value is derived during render and the interval only schedules
 * the re-render — no state is written from the effect, so there is no
 * cascading render. The first paint uses the server's own figure, so the
 * markup hydrates to exactly what was sent.
 */
export function LiveDurationChip({
  since,
  initialMinutes,
}: {
  since: string;
  initialMinutes: number;
}) {
  const [ticks, setTicks] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTicks((n) => n + 1), 15_000);
    return () => clearInterval(id);
  }, []);

  const minutes = ticks === 0 ? initialMinutes : elapsedSince(since);
  return <DurationChip minutes={minutes} />;
}

function elapsedSince(since: string): number {
  return Math.max(0, Math.round((Date.now() - Date.parse(since)) / 60_000));
}

/** `45m`, `1h`, `1h 30m` — never `90m`, which reads as a number to compare. */
export function formatDuration(minutes: number): string {
  const whole = Math.max(0, Math.round(minutes));
  const hours = Math.floor(whole / 60);
  const rest = whole % 60;

  if (hours === 0) return `${rest}m`;
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
}
