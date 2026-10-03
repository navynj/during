'use client';

import { useState } from 'react';

import { CategoryChip } from '@/components/ui/chips/category-chip';
import type { MyCategory } from '@/lib/queries/profile';
import type { IsoDate } from '@/lib/time';

import type { Custom } from './actions';
import type { Session } from './shelves';

/** Makes or corrects a custom shelf: a title, an optional range, an optional lane. */
export function SessionForm({
  categories,
  session = null,
  pending,
  onSubmit,
  onCancel,
}: {
  categories: MyCategory[];
  session?: Session | null;
  pending: boolean;
  onSubmit: (input: Custom) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(session?.title ?? '');
  const [start, setStart] = useState<IsoDate | ''>(session?.declared_start ?? '');
  const [end, setEnd] = useState<IsoDate | ''>(session?.declared_end ?? '');
  const [laneId, setLaneId] = useState<string | null>(session?.lane_id ?? null);
  const rangeOk = !end || !start || end >= start;

  return (
    <form
      data-session-form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({
          title,
          declaredStart: start || null,
          declaredEnd: end || null,
          laneId,
        });
      }}
      className="bg-pool-100 flex flex-col gap-3 rounded-xl px-3 py-3"
    >
      <input
        value={title}
        autoFocus
        aria-label="Session title"
        placeholder="A shelf for…"
        maxLength={120}
        onChange={(event) => setTitle(event.target.value)}
        className="text-ink placeholder:text-pool-500 rounded bg-white px-2 py-1.5 text-base outline-none"
      />
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <input
          type="date"
          lang="en"
          aria-label="Start date"
          value={start}
          onChange={(event) => setStart(event.target.value)}
          className="text-ink rounded bg-white px-2 py-1 tabular-nums"
        />
        <span aria-hidden className="text-pool-500">
          ~
        </span>
        <input
          type="date"
          lang="en"
          aria-label="End date"
          value={end}
          onChange={(event) => setEnd(event.target.value)}
          className="text-ink rounded bg-white px-2 py-1 tabular-nums"
        />
        {!rangeOk ? (
          <span role="alert" className="text-pool-500">
            ends before it starts
          </span>
        ) : null}
      </div>
      <div role="group" aria-label="Lane" className="no-scrollbar flex gap-1.5 overflow-x-auto">
        {categories.map((lane) => (
          <CategoryChip
            key={lane.id}
            icon={lane.icon}
            name={lane.name}
            selected={lane.id === laneId}
            onSelect={() => setLaneId(lane.id === laneId ? null : lane.id)}
          />
        ))}
      </div>
      <div className="flex items-center justify-end gap-3 text-sm">
        <button type="button" onClick={onCancel} className="text-pool-500">
          Cancel
        </button>
        <button
          type="submit"
          disabled={pending || title.trim().length === 0 || !rangeOk}
          className="bg-main-900 rounded-full px-4 py-1.5 font-medium text-white disabled:opacity-50"
        >
          {session ? 'Save' : 'Make the shelf'}
        </button>
      </div>
    </form>
  );
}
