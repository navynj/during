'use client';

import { useRef, useState } from 'react';
import { X } from 'lucide-react';

import { downscale } from '@/lib/downscale';
import { MEDIA_BUCKET } from '@/lib/media-bucket';
import { createClient } from '@/lib/supabase/client';

import { QuietAffordance } from './annotation-control';

/**
 * Photos on a Ripple. Uploaded straight from the browser into the author's
 * own folder — the storage policy keys on that prefix, so a path is the only
 * thing that needs to be right.
 *
 * `ripples.media` holds **paths, never URLs**: a URL is a credential with an
 * expiry baked in, and storing one would mean the row rots. The detail sheet
 * signs them on demand instead.
 *
 * Two pieces, because the mockup puts them apart: the `+ Add Image` pill sits
 * under the note field and the thumbnails preview above the commit row.
 */
export function useMediaAttach(paths: string[], onChange: (next: string[]) => void) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);
  // Local previews for what was just picked; a path from an edit has none
  // and shows as a tile until the detail sheet signs it.
  const [previews, setPreviews] = useState<Record<string, string>>({});

  async function attach(files: FileList | null): Promise<void> {
    if (!files?.length) return;
    setBusy(true);
    setFailed(null);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Sign in again to attach a photo.');

      const added: string[] = [];
      const seen: Record<string, string> = {};
      for (const file of Array.from(files)) {
        const shrunk = await downscale(file);
        const path = `${user.id}/${crypto.randomUUID()}-${shrunk.name}`;

        const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, shrunk, {
          contentType: shrunk.type,
          upsert: false,
        });
        if (error) throw error;
        added.push(path);
        seen[path] = URL.createObjectURL(shrunk);
      }
      setPreviews((current) => ({ ...current, ...seen }));
      onChange([...paths, ...added]);
    } catch (thrown) {
      setFailed(thrown instanceof Error ? thrown.message : 'That photo would not upload.');
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  }

  return { input, busy, failed, previews, attach };
}

export function AddImageAffordance({
  attach,
  busy,
  input,
}: Pick<ReturnType<typeof useMediaAttach>, 'attach' | 'busy' | 'input'>) {
  return (
    <>
      <QuietAffordance
        onClick={() => input.current?.click()}
        label={busy ? 'Adding…' : '+ Add Image'}
        disabled={busy}
      />
      {/* Camera or gallery: the phone offers both for an image input. */}
      <input
        ref={input}
        type="file"
        accept="image/*"
        multiple
        hidden
        data-media-input
        onChange={(event) => attach(event.target.files)}
      />
    </>
  );
}

export function MediaPreviews({
  paths,
  previews,
  failed,
  onChange,
}: {
  paths: string[];
  previews: Record<string, string>;
  failed: string | null;
  onChange: (next: string[]) => void;
}) {
  if (paths.length === 0 && !failed) return null;

  return (
    <div className="flex flex-col gap-2">
      {paths.length > 0 ? (
        <ul data-media-previews className="flex gap-2 overflow-x-auto">
          {paths.map((path) => (
            <li
              key={path}
              className="bg-pool-100 relative h-16 w-16 shrink-0 overflow-hidden rounded-lg"
            >
              {previews[path] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previews[path]} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-pool-500 block truncate px-1 pt-5 text-center text-[10px]">
                  {path.split('/').pop()}
                </span>
              )}
              <button
                type="button"
                aria-label="Remove photo"
                onClick={() => onChange(paths.filter((p) => p !== path))}
                className="text-ink absolute top-1 right-1 rounded-full bg-white/80 p-0.5"
              >
                <X aria-hidden size={12} />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {failed ? (
        <p role="alert" className="text-pool-500 text-xs">
          {failed}
        </p>
      ) : null}
    </div>
  );
}
