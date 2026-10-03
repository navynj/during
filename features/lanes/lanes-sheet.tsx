'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

import { COLUMN_MAX_WIDTH } from '@/components/ui/column';
import type { MyCategory } from '@/lib/queries/profile';

import { reorderLanes, saveLane } from './actions';

/**
 * The lanes sheet: every lane in a row, its icon and its name edited in
 * place and its order moved with the chevrons, one Save for whatever
 * changed. Opened from the pencil beside the
 * `+` in Home's lane header — the lanes view's own editor now that the
 * Lanes tab has retired (H21 review). Delete stays out: a lane with records
 * refuses it anyway (H19), and an empty one is rare enough to wait.
 */
export function LanesSheet({
  categories,
  onClose,
}: {
  categories: MyCategory[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [rows, setRows] = useState(() =>
    categories.map((lane) => ({ id: lane.id, name: lane.name, icon: lane.icon ?? '' })),
  );
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const changed = rows.filter((row) => {
    const was = categories.find((lane) => lane.id === row.id)!;
    return row.name.trim() !== was.name || row.icon.trim() !== (was.icon ?? '');
  });
  const complete = rows.every((row) => row.name.trim().length > 0 && row.icon.trim().length > 0);
  const reordered = rows.some((row, index) => row.id !== categories[index]?.id);

  function edit(id: string, patch: Partial<{ name: string; icon: string }>): void {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  function move(id: string, by: -1 | 1): void {
    setRows((current) => {
      const from = current.findIndex((row) => row.id === id);
      const to = from + by;
      if (from === -1 || to < 0 || to >= current.length) return current;
      const next = [...current];
      [next[from], next[to]] = [next[to], next[from]];
      return next;
    });
  }

  function save(): void {
    setMessage(null);
    startTransition(async () => {
      for (const row of changed) {
        const result = await saveLane({ id: row.id, name: row.name.trim(), icon: row.icon.trim() });
        if (!result.ok) {
          setMessage(result.message);
          return;
        }
      }
      if (reordered) {
        const result = await reorderLanes(rows.map((row) => row.id));
        if (!result.ok) {
          setMessage(result.message);
          return;
        }
      }
      onClose();
      router.refresh();
    });
  }

  return (
    <div className="fixed inset-0 z-40 flex flex-col justify-end">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="bg-main-900/60 scrim-in absolute inset-0"
      />
      <section
        role="dialog"
        aria-label="Edit lanes"
        data-lanes-sheet
        className={`sheet-rise relative mx-auto flex max-h-[calc(100dvh-env(safe-area-inset-top,0px)-2rem)] w-full ${COLUMN_MAX_WIDTH} flex-col overflow-hidden rounded-t-[32px] bg-white`}
      >
        <div
          className="flex min-h-0 flex-col gap-4 overflow-y-auto px-7 pt-8"
          style={{ paddingBottom: 'calc(1.75rem + env(safe-area-inset-bottom, 0px))' }}
        >
          <h2 className="text-main-900 text-2xl font-semibold">Lanes</h2>

          <ol className="flex flex-col gap-2">
            {rows.map((row, index) => (
              <li key={row.id} data-lane-row={row.id} className="flex items-center gap-3">
                <span className="flex shrink-0 flex-col">
                  <button
                    type="button"
                    aria-label={`Move ${row.name || 'this lane'} up`}
                    disabled={index === 0}
                    onClick={() => move(row.id, -1)}
                    className="text-pool-500 flex h-5 w-6 items-center justify-center disabled:opacity-20"
                  >
                    <ChevronUp aria-hidden size={14} />
                  </button>
                  <button
                    type="button"
                    aria-label={`Move ${row.name || 'this lane'} down`}
                    disabled={index === rows.length - 1}
                    onClick={() => move(row.id, 1)}
                    className="text-pool-500 flex h-5 w-6 items-center justify-center disabled:opacity-20"
                  >
                    <ChevronDown aria-hidden size={14} />
                  </button>
                </span>
                <input
                  value={row.icon}
                  onChange={(event) => edit(row.id, { icon: event.target.value })}
                  aria-label={`Icon for ${row.name || 'this lane'}`}
                  maxLength={8}
                  className="bg-pool-100 h-12 w-12 shrink-0 rounded-full text-center text-xl outline-none"
                />
                <input
                  value={row.name}
                  onChange={(event) => edit(row.id, { name: event.target.value })}
                  aria-label="Lane name"
                  placeholder="Enter the lane name"
                  maxLength={24}
                  className="text-ink placeholder:text-pool-500 border-pool-100 min-w-0 flex-1 border-b py-2 text-base outline-none"
                />
              </li>
            ))}
          </ol>

          {message ? (
            <p role="alert" className="text-pool-500 text-sm">
              {message}
            </p>
          ) : null}

          <div className="flex items-center justify-end gap-3 pt-2 text-sm">
            <button type="button" onClick={onClose} className="text-pool-500">
              Cancel
            </button>
            {/* Blue means action: the one filled thing here saves (H20f). */}
            <button
              type="button"
              disabled={pending || (changed.length === 0 && !reordered) || !complete}
              onClick={save}
              className="bg-main-900 rounded-full px-5 py-2 font-medium text-white disabled:opacity-50"
            >
              Save
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
