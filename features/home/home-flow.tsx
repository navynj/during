'use client';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';

import { usePrefersReducedMotion } from '@/components/ui/waves/use-reduced-motion';
import type { SplashSummary } from '@/features/splash/summary';
import { monthsBack } from '@/features/lanes/matrix';
import { depthSurface } from '@/lib/depth';
import { EMPTY } from '@/lib/empty-states';
import type { MyCategory } from '@/lib/queries/profile';
import type { IsoDate } from '@/lib/time';

import {
  DEFAULT_HOME_MODE,
  MODE_STORAGE_KEY,
  monthLabel,
  type FlowRow,
  type HomeMode,
  type MonthSection,
} from './flow';
import { ModeToggle } from './mode-toggle';
import { onHomeModeToggle } from './mode-bus';
import { RippleFlowRow } from './ripple-flow-row';
import { Rope } from './rope';
import { SplashFlowRow } from './splash-flow-row';
import { TailGhost } from './tail-ghost';

/**
 * Home (SPEC 5, H20): one screen, one scroll, two view modes. One rendered
 * list with mode-conditional presentation, so switching is a refocus rather
 * than navigation — every row keeps its node, and the scroll position is
 * shared because there is only one.
 *
 * Sections are months, sinking per law 1 as the scroll goes back, each under
 * a compact sticky header that also carries the toggle.
 */
export function HomeFlow({
  sections,
  splashes,
  categories,
  thumbnails,
  timeZone,
  today,
}: {
  sections: MonthSection[];
  splashes: SplashSummary[];
  categories: MyCategory[];
  /** Signed URLs for the first few photos on each ripple, by ripple id. */
  thumbnails: Record<string, string[]>;
  timeZone: string;
  today: IsoDate;
}) {
  // Remembered per session (SPEC 5). The stored mode is read as an external
  // store, so the server and the hydrating client agree on the default and
  // the remembered mode lands the moment hydration is done; a switch made on
  // this page overrides it from then on.
  const stored = useSyncExternalStore(subscribeToStorage, readStoredMode, () => null);
  const [chosen, setChosen] = useState<HomeMode | null>(null);
  const mode: HomeMode = chosen ?? stored ?? DEFAULT_HOME_MODE;
  const reducedMotion = usePrefersReducedMotion();
  const list = useRef<HTMLDivElement>(null);
  // The row to keep in view across a switch: the tapped quiet mark, or the
  // first row on screen when the toggle is used.
  const focus = useRef<{ id: string; offset: number } | null>(null);

  const switchTo = useCallback(
    (next: HomeMode, focusId?: string): void => {
      if (next === mode) return;
      const anchor = focusId ? rowById(list.current, focusId) : firstRowInView(list.current);
      focus.current = anchor
        ? { id: anchor.dataset.flowId!, offset: anchor.getBoundingClientRect().top }
        : null;
      setChosen(next);
      try {
        window.sessionStorage.setItem(MODE_STORAGE_KEY, next);
      } catch {
        // Not remembered, then.
      }
    },
    [mode],
  );

  // The third path (SPEC 5): the Home tab re-tapped while already here flips
  // the mode the way the header toggle does — anchored on the first row in
  // view, so the reader keeps their place.
  useEffect(
    () => onHomeModeToggle(() => switchTo(mode === 'ripple' ? 'splash' : 'ripple')),
    [mode, switchTo],
  );

  // After the presentation changes, put the anchored row back where it was:
  // the reader's place is the row they were looking at, not a pixel offset.
  useLayoutEffect(() => {
    const anchor = focus.current;
    if (!anchor) return;
    focus.current = null;
    const row = rowById(list.current, anchor.id);
    if (!row) return;
    const delta = row.getBoundingClientRect().top - anchor.offset;
    if (delta !== 0) window.scrollBy({ top: delta, behavior: 'instant' });
  }, [mode]);

  const empty = sections.length === 0;
  const newest = sections[0]?.month ?? today.slice(0, 7);
  const splashById = new Map(splashes.map((s) => [s.id, s]));

  return (
    <div
      ref={list}
      data-home-mode={mode}
      data-reduced-motion={reducedMotion || undefined}
      className="flex-1"
    >
      {empty ? (
        <>
          <header className="flex items-center justify-between py-4">
            <span />
            <ModeToggle mode={mode} onChange={(next) => switchTo(next)} />
          </header>
          <p className="text-pool-500 py-8 text-sm">{EMPTY.trail}</p>
        </>
      ) : null}

      {!empty && mode === 'splash' && splashes.length === 0 ? (
        <p data-empty-splashes className="text-pool-500 pt-4 text-right text-sm">
          {EMPTY.splashes}
        </p>
      ) : null}

      {sections.map((section) => {
        const surface = depthSurface(monthsBack(newest, section.month));
        return (
          <section
            key={section.month}
            data-flow-month={section.month}
            className="-mx-6 px-6"
            style={{ background: surface, ['--row-surface' as string]: surface }}
          >
            {/* The header is opaque so it can stick over the rows, so it
                carries its own stretch of the rope: the line is unbroken
                whether or not the header is pinned. */}
            <header
              className="sticky top-0 z-[1] flex items-center justify-between py-2"
              style={{ background: surface }}
            >
              <Rope />
              <p className="text-main-900 text-xs font-medium">{monthLabel(section.month)}</p>
              <ModeToggle mode={mode} onChange={(next) => switchTo(next)} />
            </header>

            {/* The rope is drawn once behind the whole month, and the list is
                a flow root: quiet marks are floats that the full rows flow
                past (SPEC 5), and the month contains them. */}
            <ol className="relative flow-root">
              <Rope />
              {section.rows.map((row) =>
                row.kind === 'ripple' ? (
                  <RippleFlowRow
                    key={row.id}
                    ripple={row.ripple}
                    mode={mode}
                    splashTitle={
                      row.ripple.splash_id
                        ? (splashById.get(row.ripple.splash_id)?.title ?? null)
                        : null
                    }
                    thumbnails={thumbnails[row.ripple.id] ?? []}
                    timeZone={timeZone}
                    today={today}
                    onQuietTap={() => switchTo('ripple', row.id)}
                  />
                ) : (
                  <SplashFlowRow
                    key={row.id}
                    splash={row.splash}
                    mode={mode}
                    categories={categories}
                    onQuietTap={() => switchTo('splash', row.id)}
                  />
                ),
              )}
            </ol>
          </section>
        );
      })}

      <TailGhost mode={mode} />
    </div>
  );
}

function rowById(root: HTMLElement | null, id: string): HTMLElement | null {
  return root?.querySelector<HTMLElement>(`[data-flow-id="${CSS.escape(id)}"]`) ?? null;
}

/** The first row whose top edge is on screen, below the sticky header. */
function firstRowInView(root: HTMLElement | null): HTMLElement | null {
  if (!root) return null;
  const rows = root.querySelectorAll<HTMLElement>('[data-flow-id]');
  for (const row of rows) {
    if (row.getBoundingClientRect().bottom > 48) return row;
  }
  return null;
}

export type { FlowRow };

function subscribeToStorage(onChange: () => void): () => void {
  window.addEventListener('storage', onChange);
  return () => window.removeEventListener('storage', onChange);
}

function readStoredMode(): HomeMode | null {
  try {
    const stored = window.sessionStorage.getItem(MODE_STORAGE_KEY);
    return stored === 'ripple' || stored === 'splash' ? stored : null;
  } catch {
    // Storage may be unavailable; the default is fine.
    return null;
  }
}
