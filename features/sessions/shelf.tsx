'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { ChevronLeft, MoreHorizontal } from 'lucide-react';

import { setSplashSession } from '@/features/splash/actions';
import { SplashPill } from '@/features/splash/splash-pill';
import { formatRange, type SplashSummary } from '@/features/splash/summary';
import { EMPTY } from '@/lib/empty-states';
import type { MyCategory } from '@/lib/queries/profile';

import { deleteSession, updateSession } from './actions';
import { SessionForm } from './session-form';
import { groupByLane, sessionRange, type Seat, type Session } from './shelves';

/**
 * A custom shelf (SPEC 5, H21e): the ratified lane-first grouping — groups as
 * columns where width allows, stacked sections on a phone, each headed by a
 * ghost emoji and the lane name; a shelf with one lane, or none, renders
 * flat; posts oldest first as the home pill. Posts are added from here with
 * the picker; a post sits on at most one shelf, so the picker says *moves
 * from …* rather than refusing.
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
  const [pending, startTransition] = useTransition();
  const groups = groupByLane(seats, categories, session);
  const range = sessionRange(session, seats);
  const lane = categories.find((c) => c.id === session.lane_id) ?? null;
  const flat = groups.length === 1 && groups[0].lane === null;

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
          <h1 className="text-ink text-3xl font-semibold">{session.title}</h1>
          {range ? (
            <p data-range className="text-pool-500 text-xs tabular-nums">
              {formatRange(range)}
              {session.declared_start ? null : <span className="opacity-60"> · derived</span>}
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
                Removes this shelf. Its {seats.length} post{seats.length === 1 ? '' : 's'} stay.
              </p>
              <span className="flex gap-3">
                <button
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      const result = await deleteSession(session.id);
                      if (result.ok) router.push('/sessions');
                    })
                  }
                  className="text-main-900 font-medium disabled:opacity-50"
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
            session={session}
            pending={pending}
            onCancel={() => setMenu('closed')}
            onSubmit={(input) =>
              startTransition(async () => {
                const result = await updateSession(session.id, input);
                if (result.ok) {
                  setMenu('closed');
                  router.refresh();
                }
              })
            }
          />
        </div>
      ) : null}

      {seats.length === 0 ? (
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
            {others.map((splash) => {
              const elsewhere = sessions.find((s) => s.id === splash.sessionId) ?? null;
              return (
                <li key={splash.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={false}
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        const result = await setSplashSession(splash.id, session.id);
                        if (result.ok) {
                          setPicking(false);
                          router.refresh();
                        }
                      })
                    }
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
