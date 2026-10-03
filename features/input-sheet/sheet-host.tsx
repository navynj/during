'use client';

import { useRouter } from 'next/navigation';

import { SplashSheet, type SheetContext } from '@/features/splash-sheet/splash-sheet';

import { useInputSheet } from './sheet-provider';

/**
 * Mounts the post sheet when the provider says it is open. Lives in the
 * shell, so the FAB reaches it from every tab.
 *
 * After a commit the ground scopes to the month the post landed in and
 * re-reads, and the provider remembers the post's id so the ripple can play
 * at its pill once it is on screen (SPEC 6): the signature moment.
 */
export function SheetHost({ context }: { context: SheetContext }) {
  const { sheet, closeSheet, markDropped } = useInputSheet();
  const router = useRouter();

  if (!sheet) return null;

  return (
    <SplashSheet
      context={context}
      onClose={closeSheet}
      onCommitted={(splash, month) => {
        closeSheet();
        markDropped(splash.id);
        router.push(`/?m=${month}`);
        router.refresh();
      }}
    />
  );
}
