'use client';

import { useLayoutEffect, useRef, useState, useTransition } from 'react';

import { COLUMN_MAX_WIDTH } from '@/components/ui/column';
import { AnnotationControl } from '@/features/input-sheet/annotation-control';
import {
  annotationVerdict,
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
import type { Session } from '@/features/sessions/shelves';
import { dropSplash } from '@/features/splash/actions';
import type { Splash } from '@/features/splash/summary';
import type { MyCategory } from '@/lib/queries/profile';
import { wallClockToInstant } from '@/lib/ripple-kind';
import type { IsoDate } from '@/lib/time';

import { SessionPicker } from './session-picker';
import { splitTitle } from './split-title';

export type SheetContext = {
  categories: MyCategory[];
  /** Custom shelves, recent first, for `+ Add to Session`. */
  sessions: Session[];
  timeZone: string;
  today: IsoDate;
};

/**
 * The sheet grows with its content to near-fullscreen, capped at the safe
 * area (SPEC 6). One expression, so the test and the screen agree on it.
 */
export const SHEET_MAX_HEIGHT = 'max-h-[calc(100dvh-env(safe-area-inset-top,0px)-2rem)]';

/**
 * The post sheet (SPEC 6, H21): one text area — the first line is the title,
 * everything after the first Enter is the first block's body — the lane chip
 * row (the declared lane), `+ Add Time`, `+ Add Image`, `+ Add to Session`,
 * and one full-width Drop. New posts only; every later word is written on
 * the post's page.
 *
 * A single line with no Enter commits as an untitled post whose line is its
 * block: the dump posture, kept on purpose.
 */
export function SplashSheet({
  context,
  onClose,
  onCommitted,
  onNewSession,
}: {
  context: SheetContext;
  onClose: () => void;
  /** The post that was made, and the month it landed in, for the ground to scope to. */
  onCommitted: (splash: Splash, month: string) => void;
  onNewSession?: () => void;
}) {
  const { categories, sessions, timeZone, today } = context;
  const [text, setText] = useState('');
  const [laneId, setLaneId] = useState<string | null>(null);
  const [annotation, setAnnotation] = useState<Annotation | null>(null);
  const [mediaPaths, setMediaPaths] = useState<string[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const media = useMediaAttach(mediaPaths, setMediaPaths);
  const field = useRef<HTMLTextAreaElement>(null);

  // The text area grows with its words; the sheet's cap does the clipping.
  useLayoutEffect(() => {
    const el = field.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [text]);

  const { title, body } = splitTitle(text);
  const hasContent =
    title.length > 0 || body.length > 0 || mediaPaths.length > 0 || laneId !== null;
  const annotationOk = !annotation || annotationVerdict(annotation) === 'ok';

  function commit(): void {
    setMessage(null);
    const a = annotation;
    const startInstant =
      a && a.time ? wallClockToInstant(a.date, a.time, timeZone).toISOString() : null;
    const span = a && !spanIsEmpty(a) ? spanKeys(a) : null;
    const endInstant = span?.end
      ? wallClockToInstant(span.end.slice(0, 10), span.end.slice(11), timeZone).toISOString()
      : null;

    startTransition(async () => {
      const result = await dropSplash({
        title,
        body,
        media: mediaPaths,
        declaredStart: null,
        declaredEnd: null,
        declaredLaneId: laneId,
        occurredOn: a?.date ?? null,
        occurredTime: a?.time ?? null,
        startInstant,
        endInstant,
        sessionId,
      });
      if (!result.ok) {
        setMessage(result.message);
        return;
      }
      onCommitted(result.splash, (a?.date ?? today).slice(0, 7));
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
        aria-label="Drop a splash"
        data-splash-sheet
        className={`sheet-rise relative mx-auto flex w-full ${COLUMN_MAX_WIDTH} ${SHEET_MAX_HEIGHT} flex-col overflow-hidden rounded-t-[32px] bg-white`}
      >
        <div
          className="flex min-h-0 flex-col gap-4 overflow-y-auto px-5 pt-6"
          style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom, 0px))' }}
        >
          <textarea
            ref={field}
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Drop your splash"
            rows={2}
            autoFocus
            aria-label="Your splash"
            className="text-ink placeholder:text-ink min-h-16 w-full resize-none text-xl/relaxed outline-none placeholder:opacity-20"
          />

          {/* The declared lane: where every block of this post starts (H21f). */}
          <LaneChips
            categories={categories}
            selectedId={laneId}
            onSelect={setLaneId}
            surface="white"
          />

          <div className="flex flex-wrap items-center gap-2">
            <AnnotationControl annotation={annotation} today={today} onChange={setAnnotation} />
            <AddImageAffordance attach={media.attach} busy={media.busy} input={media.input} />
            <SessionPicker
              sessions={sessions}
              selectedId={sessionId}
              onSelect={setSessionId}
              onNew={onNewSession}
            />
          </div>

          <MediaPreviews
            paths={mediaPaths}
            previews={media.previews}
            failed={media.failed}
            onChange={setMediaPaths}
          />

          {message ? (
            <p role="alert" className="text-pool-500 text-sm">
              {message}
            </p>
          ) : null}

          {/* Blue means action: the one filled thing here commits (H20f). */}
          <button
            type="button"
            disabled={pending || !hasContent || !annotationOk}
            onClick={commit}
            className="bg-main-900 w-full rounded-full py-2.5 text-xl font-medium text-white disabled:opacity-50"
          >
            Drop
          </button>
        </div>
      </section>
    </div>
  );
}
