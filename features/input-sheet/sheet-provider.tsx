'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import type { Prefill } from './draft';

/**
 * Which sheet is open. The entry path decides (SPEC 6): the FAB, a board's
 * +Drop and a splash screen's add slot open the ripple sheet; the tab bar's
 * `+ with wave` and the `+ Drop New Splash` ghost open the splash sheet.
 */
export type OpenSheet = { kind: 'ripple'; prefill: Prefill } | { kind: 'splash' } | null;

type SheetApi = {
  sheet: OpenSheet;
  openSheet: (prefill?: Prefill) => void;
  openSplashSheet: () => void;
  closeSheet: () => void;
};

const Context = createContext<SheetApi | null>(null);

export function InputSheetProvider({ children }: { children: ReactNode }) {
  const [sheet, setSheet] = useState<OpenSheet>(null);

  const openSheet = useCallback(
    (prefill: Prefill = {}) => setSheet({ kind: 'ripple', prefill }),
    [],
  );
  const openSplashSheet = useCallback(() => setSheet({ kind: 'splash' }), []);
  const closeSheet = useCallback(() => setSheet(null), []);

  const value = useMemo(
    () => ({ sheet, openSheet, openSplashSheet, closeSheet }),
    [sheet, openSheet, openSplashSheet, closeSheet],
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useInputSheet(): SheetApi {
  const api = useContext(Context);
  if (!api) throw new Error('useInputSheet must be used inside InputSheetProvider');
  return api;
}
