import type { SplashSummary } from '@/features/splash/summary';
import { flowInstant, monthOf } from '@/lib/flow-key';
import type { RippleWithCategory } from '@/lib/queries/ripples';
import { todayIn } from '@/lib/time';

/**
 * Home's two view modes (SPEC 5): one rendered list, two presentations.
 * Switching is a refocus, not navigation.
 */
export type HomeMode = 'ripple' | 'splash';

/** Splash by default; reversible here, remembered per session. */
export const DEFAULT_HOME_MODE: HomeMode = 'splash';
export const MODE_STORAGE_KEY = 'during.home-mode';

/**
 * One flow, two lanes (SPEC 5): ripples on the left rope, splashes on the
 * right, both ordered by the diary's own key (H20c) and each splash sitting
 * at its latest fragment's point.
 */
export type FlowRow =
  | { kind: 'ripple'; id: string; key: number; ripple: RippleWithCategory }
  | { kind: 'splash'; id: string; key: number; splash: SplashSummary };

export type MonthSection = {
  /** `2026-08`, cut in the author's zone. */
  month: string;
  rows: FlowRow[];
};

export function buildFlow(
  ripples: RippleWithCategory[],
  splashes: SplashSummary[],
  timeZone: string,
): FlowRow[] {
  const rows: FlowRow[] = [
    ...ripples.map<FlowRow>((ripple) => ({
      kind: 'ripple',
      id: ripple.id,
      key: flowInstant(ripple, timeZone),
      ripple,
    })),
    ...splashes.map<FlowRow>((splash) => ({
      kind: 'splash',
      id: splash.id,
      key: splash.flowKey,
      splash,
    })),
  ];

  // Newest first; a later posting wins a tie (H20c). A splash ties with its
  // own latest fragment and sits just above it, so the board reads as the
  // shelf that fragment landed on.
  return rows.sort((a, b) => {
    if (b.key !== a.key) return b.key - a.key;
    if (a.kind !== b.kind) return a.kind === 'splash' ? -1 : 1;
    return Date.parse(createdAt(b)) - Date.parse(createdAt(a));
  });
}

function createdAt(row: FlowRow): string {
  return row.kind === 'ripple' ? row.ripple.created_at : row.splash.latestCreatedAt;
}

/** Month sections, newest first, by the same key the rows sort on. */
export function monthSections(rows: FlowRow[], timeZone: string): MonthSection[] {
  const sections: MonthSection[] = [];
  for (const row of rows) {
    const month =
      row.kind === 'ripple'
        ? monthOf(row.ripple, timeZone)
        : todayIn(timeZone, new Date(row.key)).slice(0, 7);
    const last = sections[sections.length - 1];
    if (last && last.month === month) last.rows.push(row);
    else sections.push({ month, rows: [row] });
  }
  return sections;
}

/** `2026 AUG`, the same label the Trail and Lanes gutters use. */
export function monthLabel(month: string): string {
  const at = new Date(`${month}-01T00:00:00Z`);
  return `${month.slice(0, 4)} ${at
    .toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' })
    .toUpperCase()}`;
}
