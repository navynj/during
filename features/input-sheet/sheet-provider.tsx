'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import type { SplashSummary } from '@/features/splash/summary';

/**
 * The one sheet (SPEC 6, H21): the post sheet, from the FAB on a phone; on a
 * wide screen the composer is always there in the right half instead. Every
 * later word is written on the post's page.
 *
 * The provider also carries the post just dropped — optimistically, before
 * the server has it (CLAUDE.md, the principle) — so the ground can seat its
 * pill at once and play the commit ripple there.
 */
export type OpenSheet = { kind: 'splash' } | null;

export type PendingDrop = { splash: SplashSummary; month: string; note: string | null };

type SheetApi = {
  sheet: OpenSheet;
  openSheet: () => void;
  closeSheet: () => void;
  /** The post just dropped, until the ground has read it back. */
  pendingDrop: PendingDrop | null;
  markDropped: (drop: PendingDrop) => void;
  clearDropped: () => void;
  /** What the server said when a drop was refused, for the ground to show. */
  dropMessage: string | null;
  dropFailed: (message: string) => void;
};

const Context = createContext<SheetApi | null>(null);

export function InputSheetProvider({ children }: { children: ReactNode }) {
  const [sheet, setSheet] = useState<OpenSheet>(null);
  const [pendingDrop, setPendingDrop] = useState<PendingDrop | null>(null);
  const [dropMessage, setDropMessage] = useState<string | null>(null);

  const openSheet = useCallback(() => setSheet({ kind: 'splash' }), []);
  const closeSheet = useCallback(() => setSheet(null), []);
  const markDropped = useCallback((drop: PendingDrop) => {
    setDropMessage(null);
    setPendingDrop(drop);
  }, []);
  const clearDropped = useCallback(() => setPendingDrop(null), []);
  const dropFailed = useCallback((message: string) => {
    setPendingDrop(null);
    setDropMessage(message);
  }, []);

  const value = useMemo(
    () => ({
      sheet,
      openSheet,
      closeSheet,
      pendingDrop,
      markDropped,
      clearDropped,
      dropMessage,
      dropFailed,
    }),
    [sheet, openSheet, closeSheet, pendingDrop, markDropped, clearDropped, dropMessage, dropFailed],
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useInputSheet(): SheetApi {
  const api = useContext(Context);
  if (!api) throw new Error('useInputSheet must be used inside InputSheetProvider');
  return api;
}
