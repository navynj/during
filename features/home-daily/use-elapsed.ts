'use client';

import { useEffect, useState } from 'react';

/**
 * Minutes since an instant, on a slow tick.
 *
 * The clock is read inside the interval callback, never during render: a
 * render that calls `Date.now()` is impure, and its result would change
 * whenever the component happened to re-render for some other reason. The
 * first paint uses the server's own figure, so the markup hydrates to exactly
 * what was sent.
 */
export function useElapsed(since: string, initialMinutes: number, everyMs = 15_000): number {
  const [minutes, setMinutes] = useState(initialMinutes);

  useEffect(() => {
    const tick = (): void =>
      setMinutes(Math.max(0, Math.round((Date.now() - Date.parse(since)) / 60_000)));
    const id = setInterval(tick, everyMs);
    return () => clearInterval(id);
  }, [since, everyMs]);

  return minutes;
}

/** Seconds since an instant, for the focus screen's display clock. */
export function useElapsedSeconds(since: string, initialSeconds: number): number {
  const [seconds, setSeconds] = useState(initialSeconds);

  useEffect(() => {
    const tick = (): void =>
      setSeconds(Math.max(0, Math.floor((Date.now() - Date.parse(since)) / 1000)));
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [since]);

  return seconds;
}

/** `23:41`, and `1:23:41` once it has run past an hour. */
export function formatStopwatch(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number): string => String(n).padStart(2, '0');

  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
}
