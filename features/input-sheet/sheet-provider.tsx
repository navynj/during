'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

/**
 * The one sheet (SPEC 6, H21): the post sheet, from the FAB and nowhere
 * else. Every later word is written on the post's page. The provider also
 * carries the id of the post just dropped, so the ground can play the
 * commit ripple at its pill once the page has re-read.
 */
export type OpenSheet = { kind: 'splash' } | null;

type SheetApi = {
  sheet: OpenSheet;
  openSheet: () => void;
  closeSheet: () => void;
  /** The post the sheet just made; cleared once the ground has seen it. */
  justDropped: string | null;
  markDropped: (splashId: string) => void;
  clearDropped: () => void;
};

const Context = createContext<SheetApi | null>(null);

export function InputSheetProvider({ children }: { children: ReactNode }) {
  const [sheet, setSheet] = useState<OpenSheet>(null);
  const [justDropped, setJustDropped] = useState<string | null>(null);

  const openSheet = useCallback(() => setSheet({ kind: 'splash' }), []);
  const closeSheet = useCallback(() => setSheet(null), []);
  const markDropped = useCallback((splashId: string) => setJustDropped(splashId), []);
  const clearDropped = useCallback(() => setJustDropped(null), []);

  const value = useMemo(
    () => ({ sheet, openSheet, closeSheet, justDropped, markDropped, clearDropped }),
    [sheet, openSheet, closeSheet, justDropped, markDropped, clearDropped],
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useInputSheet(): SheetApi {
  const api = useContext(Context);
  if (!api) throw new Error('useInputSheet must be used inside InputSheetProvider');
  return api;
}
