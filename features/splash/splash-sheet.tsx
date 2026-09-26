'use client';

import { useState, useTransition } from 'react';
import { X } from 'lucide-react';

import { CategoryChip } from '@/components/ui/chips/category-chip';
import { QuietAffordance } from '@/features/input-sheet/annotation-control';
import type { MyCategory } from '@/lib/queries/profile';
import type { IsoDate } from '@/lib/time';

import { createSplash } from './actions';
import type { Splash } from './summary';

/**
 * The splash sheet (SPEC 6, `_docs/mockups/sheet-splash.png`): `Add Lanes`
 * on top, an autofocused title, `+ Add Date` beneath it, one full-width Drop.
 * Same commit verb as the ripple sheet; the placeholder differentiates.
 *
 * After commit the host opens the ripple sheet preset to the new board, so
 * creating and first-throwing is one motion.
 */
export function SplashSheet({
  categories,
  today,
  onClose,
  onCreated,
}: {
  categories: MyCategory[];
  today: IsoDate;
  onClose: () => void;
  onCreated: (splash: Splash) => void;
}) {
  const [title, setTitle] = useState('');
  const [laneIds, setLaneIds] = useState<string[]>([]);
  const [range, setRange] = useState<{ start: IsoDate; end: IsoDate | null } | null>(null);
  const [pickingDate, setPickingDate] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const rangeOk = !range || range.end === null || range.end >= range.start;

  function toggleLane(id: string): void {
    setLaneIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
  }

  return (
    <div className="fixed inset-0 z-40 flex flex-col justify-end">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="bg-ink/40 scrim-in absolute inset-0"
      />

      <section
        role="dialog"
        aria-label="Drop a splash"
        className="sheet-rise bg-pool-100 relative flex max-h-[88vh] flex-col overflow-hidden rounded-t-[32px]"
      >
        {/* Declared lanes, several allowed: they govern by inheritance (H20e). */}
        <div className="flex flex-col gap-2 px-5 pt-3 pb-3">
          <p className="text-ink text-base opacity-20">Add Lanes</p>
          <div
            role="group"
            aria-label="Lanes"
            className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1"
          >
            {categories.map((category) => (
              <CategoryChip
                key={category.id}
                icon={category.icon}
                name={category.name}
                selected={laneIds.includes(category.id)}
                onSelect={() => toggleLane(category.id)}
              />
            ))}
          </div>
        </div>

        <div
          className="flex min-h-0 flex-col items-center gap-3 overflow-y-auto rounded-t-[32px] bg-white px-5 pt-8"
          style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom, 0px))' }}
        >
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Drop your splash"
            autoFocus
            maxLength={80}
            aria-label="Title"
            className="text-ink placeholder:text-ink w-full text-center text-2xl outline-none placeholder:opacity-20"
          />

          {range && !pickingDate ? (
            <span
              data-range-chip
              className="bg-pool-100 text-ink inline-flex h-[23px] items-center gap-1 rounded-[5px] px-2 text-[10px] tabular-nums"
            >
              <button type="button" onClick={() => setPickingDate(true)}>
                {range.end && range.end !== range.start
                  ? `${range.start} ~ ${range.end}`
                  : range.start}
              </button>
              <button type="button" aria-label="Remove the date" onClick={() => setRange(null)}>
                <X aria-hidden size={11} />
              </button>
            </span>
          ) : pickingDate ? (
            <div className="bg-pool-100 flex flex-wrap items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs">
              <input
                type="date"
                lang="en"
                aria-label="Start date"
                value={range?.start ?? today}
                onChange={(event) =>
                  event.target.value &&
                  setRange({ start: event.target.value, end: range?.end ?? null })
                }
                className="text-ink rounded bg-white px-2 py-1 tabular-nums"
              />
              <span aria-hidden className="text-pool-500">
                ~
              </span>
              <input
                type="date"
                lang="en"
                aria-label="End date"
                value={range?.end ?? ''}
                onChange={(event) =>
                  setRange({ start: range?.start ?? today, end: event.target.value || null })
                }
                className="text-ink rounded bg-white px-2 py-1 tabular-nums"
              />
              {!rangeOk ? (
                <span role="alert" className="text-pool-500">
                  ends before it starts
                </span>
              ) : null}
              <button
                type="button"
                disabled={!rangeOk}
                onClick={() => {
                  if (!range) setRange({ start: today, end: null });
                  setPickingDate(false);
                }}
                className="text-main-900 font-medium disabled:opacity-40"
              >
                Done
              </button>
            </div>
          ) : (
            <QuietAffordance
              onClick={() => {
                setRange({ start: today, end: null });
                setPickingDate(true);
              }}
              label="+ Add Date"
            />
          )}

          {message ? (
            <p role="alert" className="text-pool-500 text-sm">
              {message}
            </p>
          ) : null}

          <div className="min-h-16 flex-1" />

          <button
            type="button"
            disabled={pending || title.trim().length === 0 || !rangeOk}
            onClick={() =>
              startTransition(async () => {
                const result = await createSplash({
                  title,
                  laneIds,
                  declaredStart: range?.start ?? null,
                  declaredEnd: range?.end ?? null,
                });
                if (result.ok) onCreated(result.splash);
                else setMessage(result.message);
              })
            }
            className="bg-main-900 w-full rounded-full py-2.5 text-xl font-medium text-white disabled:opacity-50"
          >
            Drop
          </button>
        </div>
      </section>
    </div>
  );
}
