'use client';

import { useEffect, useState, useTransition } from 'react';
import { Lock, Pencil, Trash2 } from 'lucide-react';

import { DurationChip } from '@/components/ui/chips/duration-chip';
import { signRippleMedia } from '@/lib/media';
import type { RippleWithCategory } from '@/lib/queries/ripples';
import { rippleDurationMinutes, rippleKind } from '@/lib/ripple-kind';

import { deleteRipple } from './actions';

/**
 * SPEC 10's Ripple detail half-sheet: note, time, media, lock state, and for a
 * session the records inside it.
 *
 * No view count — counting needs an audience, which arrives in P2. No swipe
 * person-paging, for the same reason. Edit and Delete live here and nowhere
 * else: a record is changed where it is read, not from the surface that lists
 * it.
 */
export function DetailSheet({
  ripple,
  inner,
  locked,
  timeZone,
  onClose,
  onEdit,
}: {
  ripple: RippleWithCategory;
  inner: RippleWithCategory[];
  locked: boolean;
  timeZone: string;
  onClose: () => void;
  onEdit: () => void;
}) {
  const kind = rippleKind(ripple, timeZone);
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();
  const [media, setMedia] = useState<string[]>([]);

  useEffect(() => {
    let live = true;
    // Signed on open, not stored: `ripples.media` holds paths, and a signed
    // URL is a short-lived credential rather than part of the record.
    void signRippleMedia(ripple.id).then((urls) => {
      if (live) setMedia(urls);
    });
    return () => {
      live = false;
    };
  }, [ripple.id]);

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
        aria-label="Ripple"
        className="relative flex max-h-[82vh] flex-col gap-4 overflow-y-auto rounded-t-3xl bg-white px-5 pt-5"
        style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <header className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            <p className="text-pool-500 flex items-center gap-2 text-xs">
              <Clock ripple={ripple} kind={kind} timeZone={timeZone} />
              {locked ? (
                <span className="text-pool-500 flex items-center gap-1">
                  <Lock aria-hidden size={11} />
                  Only me
                </span>
              ) : (
                <span>Everyone</span>
              )}
            </p>
            <p className="text-ink text-base">
              {ripple.category?.icon ? <span aria-hidden>{ripple.category.icon} </span> : null}
              {ripple.note ?? <span className="text-pool-500">No note</span>}
            </p>
          </div>

          {kind === 'timed' && ripple.ended_at ? (
            <DurationChip minutes={rippleDurationMinutes(ripple, timeZone)} />
          ) : null}
        </header>

        {media.length > 0 ? (
          <ul className="flex gap-2 overflow-x-auto">
            {media.map((url) => (
              <li key={url}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="h-32 w-auto rounded-lg object-cover" />
              </li>
            ))}
          </ul>
        ) : null}

        {inner.length > 0 ? <InnerList inner={inner} timeZone={timeZone} /> : null}

        <footer className="border-pool-200 flex items-center gap-3 border-t pt-3">
          <button
            type="button"
            onClick={onEdit}
            className="text-main-900 flex items-center gap-1.5 text-sm font-medium"
          >
            <Pencil aria-hidden size={14} />
            Edit
          </button>

          <span className="flex-1" />

          {confirming ? (
            <span className="flex items-center gap-3 text-sm">
              <span className="text-pool-500">
                {inner.length > 0
                  ? `Deletes this session and ${inner.length} record${inner.length === 1 ? '' : 's'} inside it`
                  : 'Deletes this record'}
              </span>
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    await deleteRipple(ripple.id);
                    onClose();
                  })
                }
                className="text-main-900 font-medium disabled:opacity-50"
              >
                Delete
              </button>
              <button type="button" onClick={() => setConfirming(false)} className="text-pool-500">
                Keep
              </button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="text-pool-500 flex items-center gap-1.5 text-sm"
            >
              <Trash2 aria-hidden size={14} />
              Delete
            </button>
          )}
        </footer>
      </section>
    </div>
  );
}

function Clock({
  ripple,
  kind,
  timeZone,
}: {
  ripple: RippleWithCategory;
  kind: string;
  timeZone: string;
}) {
  if (!ripple.occurred_time) return <span>All day</span>;
  const start = ripple.occurred_time.slice(0, 5);
  if (kind !== 'timed' || !ripple.ended_at) return <span>{start}</span>;

  const end = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(ripple.ended_at));

  return (
    <span>
      {start}–{end}
    </span>
  );
}

/**
 * The records inside a session. A break's first visible face: it carries its
 * parent's category (H15a2), so what distinguishes it here is its span.
 */
function InnerList({ inner, timeZone }: { inner: RippleWithCategory[]; timeZone: string }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-pool-500 text-xs font-medium">Inside this session</h2>
      <ul className="divide-pool-200 divide-y">
        {inner.map((child) => {
          const minutes = rippleDurationMinutes(child, timeZone);
          return (
            <li key={child.id} className="flex items-baseline gap-2 py-2 text-sm">
              <span className="text-pool-500 w-12 shrink-0 text-xs tabular-nums">
                {child.occurred_time?.slice(0, 5)}
              </span>
              <span className="text-ink min-w-0 flex-1">
                {child.category?.icon ? <span aria-hidden>{child.category.icon} </span> : null}
                {child.note ?? (minutes > 0 ? 'Break' : 'No note')}
              </span>
              {minutes > 0 ? <DurationChip minutes={minutes} /> : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
