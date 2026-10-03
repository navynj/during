'use client';

import { useState, useTransition } from 'react';
import { Lock, Unlock } from 'lucide-react';

import { AnnotationControl } from '@/features/input-sheet/annotation-control';
import { commitRipple } from '@/features/input-sheet/commit';
import {
  annotationVerdict,
  draftFrom,
  spanIsEmpty,
  spanKeys,
  type Annotation,
} from '@/features/input-sheet/draft';
import { LaneChips } from '@/features/input-sheet/lane-chips';
import {
  AddImageAffordance,
  MediaPreviews,
  useMediaAttach,
} from '@/features/input-sheet/media-field';
import { deleteRipple, setRippleLock, updateRipple } from '@/features/ripple-sheet/actions';
import type { MyCategory } from '@/lib/queries/profile';
import type { RippleWithCategory } from '@/lib/queries/ripples';
import { wallClockToInstant } from '@/lib/ripple-kind';
import type { IsoDate } from '@/lib/time';

export type EditorTarget =
  { kind: 'edit'; block: RippleWithCategory; locked: boolean } | { kind: 'add'; splashId: string };

/**
 * A block, edited in place on the post's page (SPEC 5, H21): blog-editor
 * style, no sheet. The cursor goes into the words; the lane chips, `+ Add
 * Time`, `+ Add Image`, the lock toggle and Delete sit beneath them; Cancel
 * and Save close it. A new block starts at the post's declared lane and, with
 * no annotation, rests at its declared date (H21f).
 */
export function BlockEditor({
  target,
  categories,
  defaultLaneId,
  timeZone,
  today,
  onDone,
  onCancel,
}: {
  target: EditorTarget;
  categories: MyCategory[];
  /** The post's declared lane, where a new block starts (H21f). */
  defaultLaneId: string | null;
  timeZone: string;
  today: IsoDate;
  onDone: () => void;
  onCancel: () => void;
}) {
  const editing = target.kind === 'edit' ? target.block : null;
  const draft = editing ? draftFrom(editing, timeZone) : null;
  const [note, setNote] = useState(draft?.note ?? '');
  const [categoryId, setCategoryId] = useState<string | null>(draft?.categoryId ?? defaultLaneId);
  const [annotation, setAnnotation] = useState<Annotation | null>(draft?.annotation ?? null);
  const [media, setMedia] = useState<string[]>(draft?.media ?? []);
  const [locked, setLocked] = useState(target.kind === 'edit' ? target.locked : false);
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const attach = useMediaAttach(media, setMedia);

  const hasContent = note.trim().length > 0 || media.length > 0;
  const annotationOk = !annotation || annotationVerdict(annotation) === 'ok';

  function save(): void {
    setMessage(null);
    const a = annotation;
    const startInstant =
      a && a.time ? wallClockToInstant(a.date, a.time, timeZone).toISOString() : null;
    const span = a && !spanIsEmpty(a) ? spanKeys(a) : null;
    const endInstant = span?.end
      ? wallClockToInstant(span.end.slice(0, 10), span.end.slice(11), timeZone).toISOString()
      : null;
    const fields = {
      categoryId,
      note,
      media,
      occurredOn: a?.date ?? null,
      occurredTime: a?.time ?? null,
      startInstant,
      endInstant,
    };

    startTransition(async () => {
      const outcome = editing
        ? await updateRipple({ ...fields, id: editing.id, splashId: editing.splash_id })
        : await commitRipple({
            ...fields,
            splashId: target.kind === 'add' ? target.splashId : null,
          });
      if (outcome.ok) onDone();
      else setMessage(outcome.reason === 'error' ? outcome.message : 'That could not be saved.');
    });
  }

  return (
    <div data-block-editor={editing?.id ?? 'new'} className="flex flex-col gap-3 py-2">
      <textarea
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder="Drop your words here"
        rows={3}
        autoFocus
        aria-label="Block"
        className="text-ink placeholder:text-ink min-h-20 w-full resize-none text-[15px]/[1.65] outline-none placeholder:opacity-20"
      />

      <LaneChips
        categories={categories}
        selectedId={categoryId}
        onSelect={setCategoryId}
        surface="white"
      />

      <div className="flex flex-wrap items-center gap-2">
        <AnnotationControl annotation={annotation} today={today} onChange={setAnnotation} />
        <AddImageAffordance attach={attach.attach} busy={attach.busy} input={attach.input} />
      </div>

      <MediaPreviews
        paths={media}
        previews={attach.previews}
        failed={attach.failed}
        onChange={setMedia}
      />

      {message ? (
        <p role="alert" className="text-pool-500 text-sm">
          {message}
        </p>
      ) : null}

      <div className="flex items-center gap-3 text-sm">
        {editing ? (
          <>
            {/* Everyone / Only me: one spectrum, and the lock is one end of
                it (C8). It lives beside the block, where it is edited (H21). */}
            <button
              type="button"
              aria-pressed={locked}
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const next = !locked;
                  const result = await setRippleLock(editing.id, next);
                  if (result.ok) setLocked(next);
                })
              }
              className="text-pool-500 flex items-center gap-1 disabled:opacity-50"
            >
              {locked ? <Lock aria-hidden size={13} /> : <Unlock aria-hidden size={13} />}
              {locked ? 'Only me' : 'Everyone'}
            </button>

            {confirming ? (
              <span className="flex items-center gap-2">
                <span className="text-pool-500">Deletes this block</span>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      await deleteRipple(editing.id);
                      onDone();
                    })
                  }
                  className="text-main-900 font-medium disabled:opacity-50"
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  className="text-pool-500"
                >
                  Keep
                </button>
              </span>
            ) : (
              <button type="button" onClick={() => setConfirming(true)} className="text-pool-500">
                Delete
              </button>
            )}
          </>
        ) : null}

        <span className="flex-1" />

        <button type="button" onClick={onCancel} className="text-pool-500">
          Cancel
        </button>
        <button
          type="button"
          disabled={pending || !hasContent || !annotationOk}
          onClick={save}
          className="bg-main-900 rounded-full px-4 py-1.5 font-medium text-white disabled:opacity-50"
        >
          Save
        </button>
      </div>
    </div>
  );
}
