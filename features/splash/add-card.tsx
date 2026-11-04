'use client';

import { useRef } from 'react';
import { ImagePlus } from 'lucide-react';

import { GhostRing } from '@/components/ui/ghost-ring';

/**
 * The seat of the next block, at the foot of a splash (H75): a small
 * compose card — a field and a photo button — so adding your own record to
 * the splash never reads as a comment box; Reply under each ripple is the
 * comment. *Add to this splash* on mine, *Add yours too* on someone else's.
 * The ring ripples as the one invitation (law 3).
 */
export function AddCard({
  label,
  placeholder,
  onWrite,
  onPhotos,
}: {
  label: string;
  placeholder: string;
  onWrite: () => void;
  /** Photos picked here, inside the tap, for the editor to take in. */
  onPhotos: (files: FileList) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <div data-add-card className="border-pool-200 flex flex-col gap-3 rounded-2xl border p-4">
      <div className="flex items-center gap-2">
        <GhostRing label={label} onClick={onWrite} />
        <span data-add-label className="text-ink text-sm font-semibold">
          {label}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          data-add-field
          onClick={onWrite}
          className="bg-pool-100 text-pool-500 min-w-0 flex-1 truncate rounded-xl px-3 py-2.5 text-left text-[15px]"
        >
          {placeholder}
        </button>
        <button
          type="button"
          data-add-photo
          aria-label="Add a photo"
          onClick={() => input.current?.click()}
          className="bg-pool-100 text-ink flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
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
          data-add-photo-input
          onChange={(event) => {
            if (event.target.files?.length) onPhotos(event.target.files);
          }}
        />
      </div>
    </div>
  );
}
