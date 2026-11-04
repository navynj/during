/**
 * The pool lane I last picked by hand for a pool, on this device (0033;
 * per pool since H75, no longer per my lane too): a per-viewer convenience
 * in localStorage. Only a lane chosen in a pool's lane picker is
 * remembered, never one the composer filled in. It only starts a pool on a
 * lane; it never turns sharing on. Storage may be missing or refuse (a
 * private window): then nothing is remembered.
 */
const KEY = 'weming.audience.lastPickByPool';

function readAll(): Record<string, string> {
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, string>) : {};
  } catch {
    return {};
  }
}

export function lastPicked(poolId: string): string | null {
  if (typeof window === 'undefined') return null;
  return readAll()[poolId] ?? null;
}

export function rememberPick(poolId: string, poolLaneId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const all = readAll();
    all[poolId] = poolLaneId;
    window.localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    // Not remembered: the next record starts with no chip, as on a new device.
  }
}
