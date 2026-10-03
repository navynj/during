'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { ChevronLeft, ChevronRight, Pencil } from 'lucide-react';

import { monthHref } from '@/features/home/scope';
import type { MyCategory } from '@/lib/queries/profile';
import type { IsoDate } from '@/lib/time';

import { createSession, titleMonth } from './actions';
import { SessionForm } from './session-form';
import { monthlyTitle, monthName, monthsOfYear, type Session } from './shelves';

/**
 * The session schedule (SPEC 5, H21e), inside the sheet the scrubber's `=`
 * opens: a year pager; one row per month of that year up to the current one
 * — the month small, the title large if titled, the post count at the right,
 * the current month in blue; tapping a month scopes Home to it (H21h), and
 * titling one from its row's edit affordance makes its lazy row. Custom
 * sessions in a second section.
 */
export function SessionSchedule({
  sessions,
  counts,
  customCounts,
  categories,
  earliestYear,
  today,
  openNew = false,
  onScope,
}: {
  sessions: Session[];
  /** Posts per month, by `2026-09`. */
  counts: Record<string, number>;
  /** Posts per custom session, by id. */
  customCounts: Record<string, number>;
  categories: MyCategory[];
  earliestYear: number;
  today: IsoDate;
  /** Opened from the post sheet's *New session*: the create form starts open. */
  openNew?: boolean;
  /** Scoping a month closes the sheet before Home re-reads. */
  onScope?: () => void;
}) {
  const router = useRouter();
  const currentYear = Number(today.slice(0, 4));
  const [year, setYear] = useState(currentYear);
  const [creating, setCreating] = useState(openNew);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const current = today.slice(0, 7);
  const custom = sessions
    .filter((s) => s.kind === 'custom')
    .sort((a, b) => b.created_at.localeCompare(a.created_at));

  return (
    <div data-session-schedule className="flex flex-col gap-8">
      <section className="flex flex-col gap-2">
        <div data-year-pager className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Earlier year"
            disabled={year <= earliestYear}
            onClick={() => setYear((y) => y - 1)}
            className="text-main-900 flex h-7 w-7 items-center justify-center disabled:opacity-20"
          >
            <ChevronLeft aria-hidden size={16} />
          </button>
          <span className="text-main-900 text-base font-semibold tabular-nums">{year}</span>
          <button
            type="button"
            aria-label="Later year"
            disabled={year >= currentYear}
            onClick={() => setYear((y) => y + 1)}
            className="text-main-900 flex h-7 w-7 items-center justify-center disabled:opacity-20"
          >
            <ChevronRight aria-hidden size={16} />
          </button>
        </div>

        <ol data-month-rows className="flex flex-col gap-1">
          {monthsOfYear(year, today)
            .reverse()
            .map((month) => (
              <MonthRow
                key={month}
                month={month}
                titled={monthlyTitle(sessions, month)}
                count={counts[month] ?? 0}
                current={month === current}
                onScope={onScope}
                onTitle={(title) =>
                  startTransition(async () => {
                    const result = await titleMonth(month, title);
                    if (result.ok) router.refresh();
                    else setMessage(result.message);
                  })
                }
              />
            ))}
        </ol>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-pool-500 text-xs font-semibold">Sessions</h2>
        {custom.length === 0 && !creating ? (
          <p className="text-pool-500 text-sm">A shelf for anything that is not a month.</p>
        ) : null}
        <ol data-custom-rows className="flex flex-col gap-1">
          {custom.map((session) => (
            <li key={session.id}>
              <Link
                href={`/sessions/${session.id}`}
                onClick={onScope}
                data-session-row={session.id}
                className="hover:bg-pool-100 flex items-baseline justify-between gap-3 rounded-xl px-3 py-2"
              >
                <span className="flex min-w-0 flex-col">
                  <span className="text-ink truncate text-lg font-semibold">{session.title}</span>
                  <span className="text-pool-500 text-[10px] tabular-nums">
                    {session.declared_start
                      ? `${session.declared_start}${session.declared_end ? ` ~ ${session.declared_end}` : ''}`
                      : 'range from its posts'}
                    {session.lane_id
                      ? ` · ${categories.find((c) => c.id === session.lane_id)?.name ?? ''}`
                      : ''}
                  </span>
                </span>
                <span className="text-pool-500 shrink-0 text-xs tabular-nums">
                  {customCounts[session.id] ?? 0}
                </span>
              </Link>
            </li>
          ))}
        </ol>

        {creating ? (
          <SessionForm
            categories={categories}
            pending={pending}
            onCancel={() => setCreating(false)}
            onSubmit={(input) =>
              startTransition(async () => {
                const result = await createSession(input);
                if (result.ok) {
                  setCreating(false);
                  router.refresh();
                } else setMessage(result.message);
              })
            }
          />
        ) : (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="text-main-900 self-start px-3 text-sm font-medium"
          >
            + New session
          </button>
        )}

        {message ? (
          <p role="alert" className="text-pool-500 text-sm">
            {message}
          </p>
        ) : null}
      </section>
    </div>
  );
}

function MonthRow({
  month,
  titled,
  count,
  current,
  onScope,
  onTitle,
}: {
  month: string;
  titled: Session | null;
  count: number;
  current: boolean;
  onScope?: () => void;
  onTitle: (title: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(titled?.title ?? '');
  // The current month in the action colour, by the review of the refounding:
  // #0507C9 text, no fill. The other rows read in ink.
  const surface = current ? 'text-main-900 hover:bg-pool-100' : 'text-ink hover:bg-pool-100';
  const muted = current ? 'text-main-900/60' : 'text-pool-500';

  return (
    <li
      data-month-row={month}
      data-current={current ? '' : undefined}
      className={`flex items-center gap-2 rounded-xl px-3 py-2 ${surface}`}
    >
      <Link
        href={monthHref(month)}
        onClick={onScope}
        className="flex min-w-0 flex-1 items-baseline justify-between gap-3"
      >
        <span className="flex min-w-0 flex-col">
          <span className={`text-[10px] font-medium ${muted}`}>{monthName(month)}</span>
          {editing ? null : titled ? (
            <span data-month-title className="truncate text-lg font-semibold">
              {titled.title}
            </span>
          ) : (
            <span className={`text-lg font-medium ${muted}`}>{monthName(month)}</span>
          )}
        </span>
        <span className={`shrink-0 text-xs tabular-nums ${muted}`}>{count > 0 ? count : ''}</span>
      </Link>

      {editing ? (
        <input
          value={title}
          autoFocus
          aria-label={`Title for ${monthName(month)}`}
          maxLength={120}
          onChange={(event) => setTitle(event.target.value)}
          onBlur={() => {
            setEditing(false);
            if (title.trim() !== (titled?.title ?? '')) onTitle(title);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') event.currentTarget.blur();
            if (event.key === 'Escape') {
              setTitle(titled?.title ?? '');
              setEditing(false);
            }
          }}
          className="text-ink bg-pool-100 min-w-0 flex-1 rounded px-2 py-1 text-base outline-none"
        />
      ) : (
        <button
          type="button"
          aria-label={`Title ${monthName(month)}`}
          onClick={() => setEditing(true)}
          className={`flex h-7 w-7 shrink-0 items-center justify-center ${muted}`}
        >
          <Pencil aria-hidden size={13} />
        </button>
      )}
    </li>
  );
}
