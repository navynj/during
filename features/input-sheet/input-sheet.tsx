'use client';

import { useState, useTransition } from 'react';
import { Timer } from 'lucide-react';

import { CategoryChip } from '@/components/ui/chips/category-chip';
import type { MyCategory } from '@/lib/queries/profile';
import type { RippleWithCategory } from '@/lib/queries/ripples';
import { wallClockToInstant } from '@/lib/ripple-kind';

import { commitRipple, stopSession, type CommitResult } from './commit';
import { canRunTimer, draftFrom, emptyDraft, isPlanned, type Draft, type Prefill } from './draft';
import { MediaField } from './media-field';
import { updateRipple } from '@/features/ripple-sheet/actions';
import { MiniAxis } from './mini-axis';
import { AudienceChip, TimeControl } from './sheet-controls';
import { CollisionNotice } from './collision-notice';
import { RunningTimerNotice } from './running-timer-notice';

export type SheetContext = {
  categories: MyCategory[];
  ripples: RippleWithCategory[];
  running: RippleWithCategory | null;
  timeZone: string;
  date: string;
};

/**
 * SPEC 6, the most-opened screen. First paint is completable: chips, one note
 * field, and a commit — no autofocus, so the keyboard does not cover the rail
 * the moment it opens.
 */
export function InputSheet({
  context,
  prefill,
  editing,
  onClose,
  onCommitted,
}: {
  context: SheetContext;
  prefill: Prefill;
  /** Present in edit mode: the same sheet, correcting instead of composing. */
  editing?: { ripple: RippleWithCategory; locked: boolean } | null;
  onClose: () => void;
  onCommitted: (rippleId: string) => void;
}) {
  const { categories, ripples, running, timeZone, date } = context;
  const [draft, setDraft] = useState<Draft>(() =>
    editing ? draftFrom(editing.ripple, editing.locked) : emptyDraft(categories, timeZone, prefill),
  );
  const [result, setResult] = useState<CommitResult | null>(null);
  const [askingToSwap, setAskingToSwap] = useState(false);
  // H13: the rail is instrumentation for a time that is not now. In the
  // default state the sheet is chips, note, toggle and commit — nothing else.
  const [openedAt] = useState(() => draft.time);
  const isEdit = Boolean(editing);
  const [nestInto, setNestInto] = useState<string | null>(prefill.parentRippleId ?? null);
  const parentRippleId = nestInto;
  const inner = parentRippleId !== null;
  const parent = inner && running?.id === parentRippleId ? running : null;
  const [pickingTime, setPickingTime] = useState(false);
  const [pending, startTransition] = useTransition();

  const planned = isPlanned(draft, timeZone);
  const timerAvailable = canRunTimer(draft, timeZone) && !inner;
  const selected = categories.find((c) => c.id === draft.categoryId) ?? null;
  const railOpen = draft.time !== null && (pickingTime || draft.time !== openedAt);

  function commit(mode: 'drop' | 'timer', parent: string | null = parentRippleId) {
    if (!draft.categoryId) return;
    setResult(null);

    const startInstant =
      draft.time === null ? null : wallClockToInstant(date, draft.time, timeZone).toISOString();

    if (editing) {
      startTransition(async () => {
        const outcome = await updateRipple({
          id: editing.ripple.id,
          categoryId: draft.categoryId!,
          note: draft.note,
          occurredOn: editing.ripple.occurred_on,
          occurredTime: draft.time,
          locked: draft.audience === 'only-me',
          media: draft.media,
          startInstant,
        });
        if (outcome.ok) onCommitted(outcome.rippleId);
        else setResult(outcome);
      });
      return;
    }

    startTransition(async () => {
      const outcome = await commitRipple({
        categoryId: draft.categoryId!,
        note: draft.note,
        occurredOn: date,
        occurredTime: draft.time,
        mode,
        planned,
        locked: draft.audience === 'only-me',
        parentRippleId: parent,
        startInstant,
      });

      if (outcome.ok) {
        onCommitted(outcome.rippleId);
        return;
      }
      setResult(outcome);
    });
  }

  return (
    <div className="fixed inset-0 z-40 flex flex-col justify-end">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="bg-ink/40 absolute inset-0"
      />

      <section
        role="dialog"
        aria-label={isEdit ? 'Edit this ripple' : inner ? 'Add into this session' : 'Add a ripple'}
        className="relative flex max-h-[82vh] flex-col overflow-hidden rounded-t-3xl bg-white"
      >
        {/* Containment, said in the grammar rather than in words: inside the
            blue is inside the session, the same rule the now band uses. */}
        {inner ? (
          <p data-parent-band className="live-surface px-5 py-2 text-sm font-medium text-white">
            Into {parent?.category?.name ?? 'this session'}
            {parent?.note ? ` · ${parent.note}` : ''}
          </p>
        ) : null}

        <div
          className="flex flex-col gap-4 px-5 pt-5"
          style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom, 0px))' }}
        >
          <div className="flex min-h-0 gap-4">
            {/* H12's landing surface, H13's progressive disclosure: it slides in
              when the time is touched and retracts when it returns to now. */}
            <div
              aria-hidden={!railOpen}
              className={`shrink-0 overflow-hidden transition-all duration-200 motion-reduce:transition-none ${
                railOpen ? 'w-[4.5rem] opacity-100' : 'w-0 opacity-0'
              }`}
            >
              <div className="w-[4.5rem] overflow-y-auto">
                <MiniAxis
                  ripples={ripples}
                  draft={draft}
                  emoji={selected?.icon ?? null}
                  timeZone={timeZone}
                  date={date}
                />
              </div>
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-3">
              {/* No scroll indicator: a bar under a row of chips reads as a
                gauge, which law 2 forbids. They scroll silently. */}
              <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1">
                {categories.map((category) => (
                  <CategoryChip
                    key={category.id}
                    icon={category.icon}
                    name={category.name}
                    selected={category.id === draft.categoryId}
                    onSelect={() => setDraft((d) => ({ ...d, categoryId: category.id }))}
                  />
                ))}
              </div>

              {/* One field, no title/content split (E5). No autofocus (SPEC 6). */}
              <textarea
                value={draft.note}
                onChange={(event) => setDraft((d) => ({ ...d, note: event.target.value }))}
                placeholder="Anything, or nothing"
                rows={3}
                aria-label="Note"
                className="text-ink placeholder:text-pool-500 min-h-20 w-full resize-none text-base outline-none"
              />

              <MediaField
                paths={draft.media}
                onChange={(media) => setDraft((d) => ({ ...d, media }))}
              />

              <TimeControl
                draft={draft}
                planned={planned}
                timeZone={timeZone}
                onChange={(time) => setDraft((d) => ({ ...d, time }))}
                onEditingChange={setPickingTime}
                allowAllDay={!inner}
              />

              {askingToSwap && running ? (
                <RunningTimerNotice
                  running={running}
                  pending={pending}
                  onCancel={() => setAskingToSwap(false)}
                  onSwap={() =>
                    startTransition(async () => {
                      await stopSession(running.id);
                      setAskingToSwap(false);
                      commit('timer');
                    })
                  }
                />
              ) : null}

              {result && !result.ok ? (
                <CollisionNotice
                  result={result}
                  onNest={(parentId) => {
                    setNestInto(parentId);
                    setResult(null);
                  }}
                  pending={pending}
                />
              ) : null}
            </div>
          </div>

          <div className="border-pool-200 flex items-center gap-3 border-t pt-3">
            <AudienceChip
              audience={draft.audience}
              onChange={(audience) => setDraft((d) => ({ ...d, audience }))}
            />

            <button
              type="button"
              disabled={pending || !draft.categoryId}
              onClick={() => commit('drop')}
              // Drop is the primary action, always: H8 gives chrome primary
              // actions the action colour, and an outlined Drop beside a filled
              // Timer read as the weaker of the two.
              className="bg-main-900 flex-1 rounded-full py-3 text-base font-medium text-white disabled:opacity-50"
            >
              {isEdit ? 'Update' : inner ? 'Drop into session' : planned ? 'Save as plan' : 'Drop'}
            </button>

            {/* Drop-only inside a session: timed children exist today only as
              Breaks, and generalising them is an open item (SPEC 10). */}
            <button
              type="button"
              hidden={inner || isEdit}
              disabled={pending || !timerAvailable}
              // One running timer at a time (H10). A second is a choice to
              // offer, not an error to report after the fact.
              onClick={() => (running ? setAskingToSwap(true) : commit('timer'))}
              aria-label="Start a timer"
              title={timerAvailable ? 'Start a timer' : 'A plan has not started yet'}
              // Outlined, not filled: Drop is the primary action, and two solid
              // action-coloured buttons side by side name two primaries.
              className="border-main-900 text-main-900 flex h-12 w-12 items-center justify-center rounded-full border disabled:opacity-40"
            >
              <Timer aria-hidden size={20} />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
