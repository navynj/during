'use client';

import { useRouter } from 'next/navigation';

import { SplashSheet } from '@/features/splash/splash-sheet';
import { summarizeSplash } from '@/features/splash/summary';

import { InputSheet, type SheetContext } from './input-sheet';
import { useInputSheet } from './sheet-provider';

/**
 * Mounts whichever sheet the provider says is open. Lives in the shell, so
 * the FAB, the tab bar's splash button, a board's +Drop and the splash
 * screen's add slot all reach the same two sheets.
 *
 * Committing a splash hands straight over to the ripple sheet preset to the
 * new board: creating and first-throwing is one motion (SPEC 6), and
 * dismissing that second sheet is fine.
 */
export function SheetHost({ context }: { context: SheetContext }) {
  const { sheet, openSheet, openSplashSheet, closeSheet } = useInputSheet();
  const router = useRouter();

  if (!sheet) return null;

  if (sheet.kind === 'splash') {
    return (
      <SplashSheet
        categories={context.categories}
        today={context.today}
        onClose={closeSheet}
        onCreated={(splash) => {
          router.refresh();
          openSheet({ splash: summarizeSplash(splash, [], context.timeZone, new Date()) });
        }}
      />
    );
  }

  return (
    <InputSheet
      context={context}
      prefill={sheet.prefill}
      onClose={closeSheet}
      onNewSplash={openSplashSheet}
      onCommitted={() => {
        closeSheet();
        // The row is new, so the page has to re-read before it can show it.
        router.refresh();
      }}
    />
  );
}
