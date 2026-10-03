'use client';

import { COLUMN_MAX_WIDTH } from '@/components/ui/column';

import { SessionSchedule } from './session-schedule';

/**
 * The sessions sheet: session management lives here, not in a tab. Opened
 * from the `=` at the left of the month scrubber (H21e, review): a white
 * bottom sheet on the dimmed ground carrying the regular session schedule
 * and the custom shelves.
 */
export function SessionsSheet({
  onClose,
  ...schedule
}: Parameters<typeof SessionSchedule>[0] & { onClose: () => void }) {
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
        aria-label="Sessions"
        data-sessions-sheet
        className={`sheet-rise relative mx-auto flex max-h-[calc(100dvh-env(safe-area-inset-top,0px)-2rem)] w-full ${COLUMN_MAX_WIDTH} flex-col overflow-hidden rounded-t-[32px] bg-white`}
      >
        <div
          className="flex min-h-0 flex-col overflow-y-auto px-5 pt-6"
          style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom, 0px))' }}
        >
          <SessionSchedule {...schedule} onScope={onClose} />
        </div>
      </section>
    </div>
  );
}
