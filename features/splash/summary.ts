import type { Database } from '@/lib/database.types';
import { dayOf, flowInstant, type FlowKeyed } from '@/lib/flow-key';
import type { IsoDate } from '@/lib/time';

export type Splash = Database['public']['Tables']['splashes']['Row'];

/**
 * How long after its last fragment a board stays open (H20e). Tunable. Two
 * days is long enough that a weekend trip is one open story and short enough
 * that last month's is not still asking for drops.
 */
export const OPEN_WINDOW_HOURS = 48;

/** What a fragment contributes to its board: its key, its lane, its clock. */
export type SplashFragment = FlowKeyed & { category_id: string };

/**
 * A board as the surfaces read it: declared where declared, derived from its
 * fragments where not, and whether it is still open (H20e).
 */
export type SplashSummary = {
  id: string;
  title: string;
  laneIds: string[];
  /** Declared where declared, else first fragment to last; null when empty. */
  range: { start: IsoDate; end: IsoDate } | null;
  declared: boolean;
  count: number;
  /** The board's own chip: a declared lane, else the derived dominant one. */
  dominantCategoryId: string | null;
  /** When the board last received something, for recency and the open rule. */
  latestCreatedAt: string;
  /** Where the board sits in the flow: its latest fragment's key (H20c). */
  flowKey: number;
  open: boolean;
  createdAt: string;
};

/** A fragment within the window, or nothing thrown yet (H20e). */
export function isSplashOpen(count: number, latestCreatedAt: string | null, now: Date): boolean {
  if (count === 0 || latestCreatedAt === null) return true;
  return now.getTime() - Date.parse(latestCreatedAt) < OPEN_WINDOW_HOURS * 60 * 60 * 1000;
}

/**
 * The lane most of the fragments are in; a tie goes to the most recently
 * posted, because that is the one the author was just thinking about.
 */
export function dominantCategory(fragments: SplashFragment[]): string | null {
  if (fragments.length === 0) return null;
  const tally = new Map<string, { count: number; latest: number }>();
  for (const fragment of fragments) {
    const at = Date.parse(fragment.created_at);
    const current = tally.get(fragment.category_id) ?? { count: 0, latest: 0 };
    tally.set(fragment.category_id, {
      count: current.count + 1,
      latest: Math.max(current.latest, at),
    });
  }
  return [...tally.entries()].sort(
    ([, a], [, b]) => b.count - a.count || b.latest - a.latest,
  )[0][0];
}

export function summarizeSplash(
  splash: Splash,
  fragments: SplashFragment[],
  timeZone: string,
  now: Date,
): SplashSummary {
  const days = fragments.map((f) => dayOf(f, timeZone)).sort();
  const declared = splash.declared_start !== null;
  const range = declared
    ? { start: splash.declared_start!, end: splash.declared_end ?? splash.declared_start! }
    : days.length > 0
      ? { start: days[0], end: days[days.length - 1] }
      : null;

  const latestCreatedAt = fragments.reduce<string | null>(
    (latest, f) => (latest === null || f.created_at > latest ? f.created_at : latest),
    null,
  );
  const flowKey =
    fragments.length > 0
      ? Math.max(...fragments.map((f) => flowInstant(f, timeZone)))
      : Date.parse(splash.created_at);

  return {
    id: splash.id,
    title: splash.title,
    laneIds: splash.lane_ids,
    range,
    declared,
    count: fragments.length,
    dominantCategoryId: splash.lane_ids[0] ?? dominantCategory(fragments),
    latestCreatedAt: latestCreatedAt ?? splash.created_at,
    flowKey,
    open: isSplashOpen(fragments.length, latestCreatedAt, now),
    createdAt: splash.created_at,
  };
}

/** Recent first: the board something was just thrown at is the likely target. */
export function byRecency(a: SplashSummary, b: SplashSummary): number {
  return Date.parse(b.latestCreatedAt) - Date.parse(a.latestCreatedAt);
}

/** `2026. 8. 17 ~ 2026. 8. 20`, or one date, as the mockups write it. */
export function formatRange(range: { start: IsoDate; end: IsoDate } | null): string {
  if (!range) return '';
  const day = (date: IsoDate): string =>
    `${date.slice(0, 4)}. ${Number(date.slice(5, 7))}. ${Number(date.slice(8, 10))}`;
  return range.start === range.end ? day(range.start) : `${day(range.start)} ~ ${day(range.end)}`;
}
