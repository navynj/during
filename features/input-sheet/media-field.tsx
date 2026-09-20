'use client';

import { useRef, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';

import { downscale } from '@/lib/downscale';
import { MEDIA_BUCKET } from '@/lib/media-bucket';
import { createClient } from '@/lib/supabase/client';

/**
 * Photos on a Ripple. Uploaded straight from the browser into the author's
 * own folder — the storage policy keys on that prefix, so a path is the only
 * thing that needs to be right.
 *
 * `ripples.media` holds **paths, never URLs**: a URL is a credential with an
 * expiry baked in, and storing one would mean the row rots. The detail sheet
 * signs them on demand instead.
 */
export function MediaField({
  paths,
  onChange,
}: {
  paths: string[];
  onChange: (next: string[]) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);

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
      for (const file of Array.from(files)) {
        const shrunk = await downscale(file);
        const path = `${user.id}/${crypto.randomUUID()}-${shrunk.name}`;

        const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, shrunk, {
          contentType: shrunk.type,
          upsert: false,
        });
        if (error) throw error;
        added.push(path);
      }
      onChange([...paths, ...added]);
    } catch (thrown) {
      setFailed(thrown instanceof Error ? thrown.message : 'That photo would not upload.');
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {paths.map((path) => (
          <span
            key={path}
            className="bg-pool-100 text-pool-500 flex items-center gap-1 rounded px-2 py-1 text-xs"
          >
            {/* Paths, not previews: the sheet has not signed them, and signing
                on every keystroke would spend a round trip on a draft. */}
            <span className="max-w-32 truncate">{path.split('/').pop()}</span>
            <button
              type="button"
              aria-label="Remove photo"
              onClick={() => onChange(paths.filter((p) => p !== path))}
            >
              <X aria-hidden size={12} />
            </button>
          </span>
        ))}

        <button
          type="button"
          disabled={busy}
          onClick={() => input.current?.click()}
          className="text-pool-500 hover:bg-pool-100 flex items-center gap-1.5 rounded-full px-2 py-1 text-xs disabled:opacity-50"
        >
          <ImagePlus aria-hidden size={14} />
          {busy ? 'Adding…' : 'Photo'}
        </button>

        <input
          ref={input}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(event) => attach(event.target.files)}
        />
      </div>

      {failed ? (
        <p role="alert" className="text-pool-500 text-xs">
          {failed}
        </p>
      ) : null}
    </div>
  );
}
