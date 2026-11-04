'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { ImagePlus } from 'lucide-react';

import { WaveRule } from '@/components/ui/waves/wave-rule';
import { MediaPreviews, useMediaAttach } from '@/features/input-sheet/media-field';
import { Avatar } from '@/features/people/avatar';
import { videosIn } from '@/lib/youtube';
import type { IsoDate } from '@/lib/time';

import { defaultBlockDay, isRange } from './block-day';
import type { BlockDraft } from './block-editor';
import { DayChip } from './day-chip';
import { VideoPreviewsSwitch } from './video-previews-switch';
import type { DateRange } from './summary';

/** Up to this many words go without asking; past it, or with a photo, Cancel asks. */
const FEW_WORDS = 3;

/**
 * The seat of the next block, at the foot of a splash (H75): a thin wave
 * apart from what is above — the title's own wave, faint — then one row: my
 * face, a borderless field whose placeholder says what it does (*Add to this
 * splash* on mine, *Add yours too* on someone else's), and a photo button.
 * In focus the field opens to a few lines with Cancel and Drop at the
 * row's end; left empty, it folds back to one row. Cancel clears it, asking
 * first when there is more to lose than a few words; Escape only leaves
 * the field, the draft kept and the panel open. Its words linking a video,
 * the editor's *Show video previews* switch shows. No card, no ring, no title:
 * Reply under each ripple is the comment, this is a record of your own.
 */
export function AddRow({
  label,
  me,
  initials,
  range = null,
  today,
  autoFocus = false,
  onSubmit,
}: {
  label: string;
  me: string | null;
  initials: string;
  /** The post's range: a day chip while open, when it spans days (0031). */
  range?: DateRange | null;
  today: IsoDate;
  /** Opened to write (Board view's "Add your side"): the cursor here from the start. */
  autoFocus?: boolean;
  onSubmit: (draft: BlockDraft) => void;
}) {
  const [note, setNote] = useState('');
  const [media, setMedia] = useState<string[]>([]);
  const [day, setDay] = useState<IsoDate | null>(() =>
    isRange(range) ? defaultBlockDay(range, today) : null,
  );
  const [open, setOpen] = useState(autoFocus);
  // Cancel asked "Discard this?" and waits for an answer.
  const [asking, setAsking] = useState(false);
  // Show video previews (part 5): on unless turned off before Drop.
  const [videos, setVideos] = useState(true);
  const linksVideos = videosIn(note).length > 0;
  const { input, busy, failed, previews, attach, meta, progress, change, keep } = useMediaAttach(
    media,
    setMedia,
  );
  const row = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLTextAreaElement>(null);
  const hasContent = note.trim().length > 0 || media.length > 0;
  // Open while in focus or holding something; empty and left, one row again.
  const shown = open || hasContent;

  // The words grow the field; the field never scrolls inside the page.
  useLayoutEffect(() => {
    const el = field.current;
    if (!el) return;
    el.style.height = 'auto';
    if (el.scrollHeight > 0) el.style.height = `${el.scrollHeight}px`;
  }, [note, shown]);

  function drop(): void {
    onSubmit({
      id: crypto.randomUUID(),
      note,
      media,
      mediaMeta: meta,
      uploaded: keep(media),
      ...(day ? { occurredOn: day } : {}),
      ...(linksVideos ? { videoPreviews: videos } : {}),
    });
    setNote('');
    setMedia([]);
    setVideos(true);
    setOpen(false);
    field.current?.blur();
  }

  function discard(): void {
    // Through `change`, so the photos already uploaded are removed too.
    change([]);
    setNote('');
    setVideos(true);
    setAsking(false);
    setOpen(false);
    field.current?.blur();
  }

  function cancel(): void {
    const words = note.trim().split(/\s+/).filter(Boolean).length;
    if (media.length > 0 || words > FEW_WORDS) setAsking(true);
    else discard();
  }

  return (
    <div data-add-slot className="mt-2 pb-10">
      <div data-add-wave className="py-3 opacity-25">
        <WaveRule anchor="left" />
      </div>
      <div
        ref={row}
        data-add-row
        data-open={shown ? '' : undefined}
        onBlur={(event) => {
          // Moving within the row (the photo button, a day) keeps it open.
          if (row.current?.contains(event.relatedTarget as Node | null)) return;
          setOpen(false);
        }}
        className="flex flex-col gap-2"
      >
        <div className={`flex gap-2.5 ${shown ? 'items-start' : 'items-center'}`}>
          <Avatar
            id={me}
            initials={initials}
            className="bg-pool-100 text-pool-500 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-medium"
          />
          <textarea
            ref={field}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            onFocus={() => setOpen(true)}
            onKeyDown={(event) => {
              // Leaves the field and keeps the draft; the panel ignores an
              // Escape from a field, so it stays open.
              if (event.key === 'Escape') event.currentTarget.blur();
            }}
            placeholder={label}
            aria-label={label}
            rows={shown ? 3 : 1}
            autoFocus={autoFocus}
            data-add-field
            className="text-ink placeholder:text-pool-500 min-w-0 flex-1 resize-none overflow-hidden bg-transparent py-0.5 text-[15px]/[1.65] outline-none"
          />
          <button
            type="button"
            data-add-photo
            aria-label="Add a photo"
            disabled={busy}
            onClick={() => input.current?.click()}
            className="text-pool-500 flex h-7 w-7 shrink-0 items-center justify-center disabled:opacity-50"
          >
            <ImagePlus aria-hidden size={18} />
          </button>
          {/* Camera or gallery, as the editor's own: the phone offers both. */}
          <input
            ref={input}
            type="file"
            accept="image/*"
            multiple
            hidden
            data-media-input
            onChange={(event) => {
              setOpen(true);
              void attach(event.target.files);
            }}
          />
          {shown ? (
            <button
              type="button"
              data-add-cancel
              onClick={cancel}
              className="text-pool-500 shrink-0 py-1 text-sm"
            >
              Cancel
            </button>
          ) : null}
          {shown ? (
            // Blue means action: the one filled thing here commits (H20f).
            <button
              type="button"
              data-add-drop
              disabled={!hasContent || busy}
              onClick={drop}
              className="bg-main-900 shrink-0 rounded-full px-4 py-1 text-sm font-medium text-white disabled:opacity-50"
            >
              Drop
            </button>
          ) : null}
        </div>
        {shown && (media.length > 0 || (day && isRange(range)) || linksVideos) ? (
          <div className="flex flex-col items-start gap-2 pl-8">
            {day && isRange(range) ? <DayChip range={range} value={day} onChange={setDay} /> : null}
            <MediaPreviews paths={media} previews={previews} failed={failed} onChange={change} />
            {linksVideos ? <VideoPreviewsSwitch on={videos} onChange={setVideos} /> : null}
          </div>
        ) : null}
        {asking ? (
          <p data-add-discard className="flex items-center gap-3 pl-8 text-sm">
            <span className="text-ink">Discard this?</span>
            <button type="button" onClick={discard} className="text-main-900 font-medium">
              Discard
            </button>
            <button type="button" onClick={() => setAsking(false)} className="text-pool-500">
              Keep writing
            </button>
          </p>
        ) : null}
        {busy && progress ? <p className="text-pool-500 pl-8 text-xs">{progress}</p> : null}
      </div>
    </div>
  );
}
