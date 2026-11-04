'use client';

/**
 * A block's YouTube links as players, or left as links (part 5): shown
 * only while its words link a video, saved with the block.
 */
export function VideoPreviewsSwitch({
  on,
  onChange,
}: {
  on: boolean;
  onChange: (on: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      data-video-previews
      onClick={() => onChange(!on)}
      className="text-pool-500 flex items-center gap-2 self-start text-sm"
    >
      <span
        className={`flex h-4 w-7 items-center rounded-full p-0.5 ${on ? 'bg-ink justify-end' : 'bg-pool-200 justify-start'}`}
      >
        <span className="h-3 w-3 rounded-full bg-white" />
      </span>
      Show video previews
    </button>
  );
}
