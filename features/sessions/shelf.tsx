'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ChevronLeft, MoreHorizontal } from 'lucide-react';

import { setSplashSession } from '@/features/splash/actions';
import { SplashPill } from '@/features/splash/splash-pill';
import { formatRange, type SplashSummary } from '@/features/splash/summary';
import { EMPTY } from '@/lib/empty-states';
import type { MyCategory } from '@/lib/queries/profile';
import { useOptimisticAction } from '@/lib/use-optimistic-action';

import { deleteSession, updateSession } from './actions';
import { SessionForm } from './session-form';
import { groupByLane, sessionRange, type Seat, type Session } from './shelves';

/** The shelf as one value: its row and what sits on it. */
type ShelfState = { session: Session; seats: Seat[] };

/**
 * A custom shelf (SPEC 5, H21e): the ratified lane-first grouping — groups as
 * columns where width allows, stacked sections on a phone, each headed by a
 * ghost emoji and the lane name; a shelf with one lane, or none, renders
 * flat; posts oldest first as the home pill. Posts are added from here with
 * the picker; a post sits on at most one shelf, so the picker says *moves
 * from …* rather than refusing.
 *
 * A post added, a correction made, show at once; the action runs behind
 * (CLAUDE.md, the principle).
 */
export function Shelf({
  session,
  seats,
  others,
  sessions,
  categories,
}: {
  session: Session;
  seats: Seat[];
  /** Every post not on this shelf, recent first, for the picker. */
  others: SplashSummary[];
  sessions: Session[];
  categories: MyCategory[];
}) {
  const router = useRouter();
  const [picking, setPicking] = useState(false);
  const [menu, setMenu] = useState<'closed' | 'open' | 'edit' | 'delete'>('closed');
  const { value: shelf, run, message } = useOptimisticAction<ShelfState>({ session, seats });
  const groups = groupByLane(shelf.seats, categories, shelf.session);
  const range = sessionRange(shelf.session, shelf.seats);
  const lane = categories.find((c) => c.id === shelf.session.lane_id) ?? null;
  const flat = groups.length === 1 && groups[0].lane === null;

  function add(splash: SplashSummary): void {
    setPicking(false);
    const date = splash.range?.start ?? splash.createdAt.slice(0, 10);
    run(
      (current) => ({
        ...current,
        seats: [
          ...current.seats,
          {
            splash: { ...splash, sessionId: session.id },
            instant: Date.parse(`${date}T00:00:00Z`),
            date,
            span: splash.range ?? { start: date, end: date },
          },
        ].sort((a, b) => a.instant - b.instant),
      }),
      () => setSplashSession(splash.id, session.id),
    );
  }

  return (
    <div data-shelf className="flex flex-1 flex-col pt-3 pb-10">
      <Link
        href="/"
        data-back-chip
        className="text-main-900 -ml-1 flex w-fit items-center gap-0.5 pb-5 text-sm font-medium"
      >
        <ChevronLeft aria-hidden size={16} />
        Home
      </Link>

      <header className="flex items-start justify-between gap-3 pb-6">
        <div className="flex min-w-0 flex-col gap-1">
          {lane ? (
            <span className="text-pool-500 text-[10px]">
              {lane.icon} {lane.name}
            </span>
          ) : null}
          <h1 className="text-ink text-3xl font-semibold">{shelf.session.title}</h1>
          {range ? (
            <p data-range className="text-pool-500 text-xs tabular-nums">
              {formatRange(range)}
              {shelf.session.declared_start ? null : <span className="opacity-60"> · derived</span>}
            </p>
          ) : null}
        </div>
        <div className="relative shrink-0">
          <button
            type="button"
            aria-label="More"
            aria-expanded={menu !== 'closed'}
            onClick={() => setMenu(menu === 'closed' ? 'open' : 'closed')}
            className="text-pool-500 flex h-8 w-8 items-center justify-center"
          >
            <MoreHorizontal aria-hidden size={18} />
          </button>
          {menu === 'open' ? (
            <ul
              role="menu"
              className="border-pool-100 absolute top-full right-0 z-10 flex w-44 flex-col rounded-xl border bg-white py-1 text-sm shadow-lg"
            >
              <li>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => setMenu('edit')}
                  className="text-ink hover:bg-pool-100 w-full px-3 py-2 text-left"
                >
                  Edit
                </button>
              </li>
              <li>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => setMenu('delete')}
                  className="text-pool-500 hover:bg-pool-100 w-full px-3 py-2 text-left"
                >
                  Delete
                </button>
              </li>
            </ul>
          ) : null}
          {menu === 'delete' ? (
            <div
              role="alertdialog"
              className="border-pool-100 absolute top-full right-0 z-10 flex w-60 flex-col gap-2 rounded-xl border bg-white px-3 py-2 text-sm shadow-lg"
            >
              <p className="text-pool-500">
                Removes this shelf. Its {shelf.seats.length} post
                {shelf.seats.length === 1 ? '' : 's'} stay.
              </p>
              <span className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    // Gone the moment it is asked for; the row follows.
                    router.push('/');
                    void deleteSession(session.id).then(() => router.refresh());
                  }}
                  className="text-main-900 font-medium"
                >
                  Delete
                </button>
                <button type="button" onClick={() => setMenu('closed')} className="text-pool-500">
                  Keep
                </button>
              </span>
            </div>
          ) : null}
        </div>
      </header>

      {menu === 'edit' ? (
        <div className="pb-6">
          <SessionForm
            categories={categories}
            session={shelf.session}
            pending={false}
            onCancel={() => setMenu('closed')}
            onSubmit={(input) => {
              setMenu('closed');
              run(
                (current) => ({
                  ...current,
                  session: {
                    ...current.session,
                    title: input.title.trim(),
                    declared_start: input.declaredStart,
                    declared_end: input.declaredEnd,
                    lane_id: input.laneId,
                  },
                }),
                () => updateSession(session.id, input),
              );
            }}
          />
        </div>
      ) : null}

      {message ? (
        <p role="alert" className="text-pool-500 pb-4 text-sm">
          {message}
        </p>
      ) : null}

      {shelf.seats.length === 0 ? (
        <p data-empty-shelf className="text-pool-500 pb-6 text-sm">
          {EMPTY.shelf}
        </p>
      ) : null}

      <div
        data-lane-groups
        data-flat={flat ? '' : undefined}
        className={flat ? 'flex flex-col' : 'grid grid-cols-1 gap-6 sm:grid-cols-2'}
      >
        {groups.map((group) => (
          <section key={group.lane?.id ?? 'unlaned'} data-lane-group={group.lane?.id ?? ''}>
            {group.lane && !flat ? (
              <h2 className="text-pool-500 flex items-center gap-1.5 pb-2 text-xs font-semibold">
                <span aria-hidden className="text-lg/none opacity-60">
                  {group.lane.icon}
                </span>
                {group.lane.name}
              </h2>
            ) : null}
            <ol className="flex flex-col gap-2">
              {group.seats.map(({ splash, span }) => (
                <li key={splash.id} data-seat={splash.id}>
                  <SplashPill
                    splash={splash}
                    range={span}
                    categories={categories}
                    href={`/splash/${splash.id}?from=session:${session.id}`}
                    ground="page"
                  />
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>

      <div className="pt-6">
        {picking ? (
          <ul
            role="listbox"
            aria-label="Add a post"
            data-add-existing
            className="border-pool-100 flex max-h-64 flex-col overflow-y-auto rounded-xl border bg-white py-1 text-sm"
          >
            {others
              .filter((splash) => !shelf.seats.some((seat) => seat.splash.id === splash.id))
              .map((splash) => {
                const elsewhere = sessions.find((s) => s.id === splash.sessionId) ?? null;
                return (
                  <li key={splash.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={false}
                      onClick={() => add(splash)}
                      className="text-ink hover:bg-pool-100 flex w-full flex-col px-3 py-2 text-left"
                    >
                      <span className="truncate">
                        {splash.title.trim() || splash.ghostTitle || 'Untitled'}
                      </span>
                      {elsewhere ? (
                        <span data-moves-from className="text-pool-500 text-[10px]">
                          moves from {elsewhere.title}
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            {others.length === 0 ? (
              <li className="text-pool-500 px-3 py-2">Every post is already here.</li>
            ) : null}
            <li>
              <button
                type="button"
                onClick={() => setPicking(false)}
                className="text-pool-500 w-full px-3 py-2 text-left"
              >
                Cancel
              </button>
            </li>
          </ul>
        ) : (
          <button
            type="button"
            onClick={() => setPicking(true)}
            className="text-main-900 text-sm font-medium"
          >
            + Add a post
          </button>
        )}
      </div>
    </div>
  );
}
