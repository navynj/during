'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import type { EditableSplash } from '@/features/splash/splash-sheet';

import type { Prefill } from './draft';

/**
 * Which sheet is open. The entry path decides (SPEC 6): the FAB, a board's
 * +Drop and a splash screen's add slot open the ripple sheet; the tab bar's
 * `+ with wave` and the `+ Drop New Splash` ghost open the splash sheet; a
 * splash screen's Edit opens it preset to that board.
 */
export type OpenSheet =
  | { kind: 'ripple'; prefill: Prefill }
  | { kind: 'splash'; editing: EditableSplash | null; firstNote: string }
  | null;

type SheetApi = {
  sheet: OpenSheet;
  openSheet: (prefill?: Prefill) => void;
  openSplashSheet: () => void;
  /** The ripple sheet's *New splash*: the splash editor, the note carried. */
  newSplashFrom: (note: string) => void;
  editSplash: (splash: EditableSplash) => void;
  closeSheet: () => void;
};

const Context = createContext<SheetApi | null>(null);

export function InputSheetProvider({ children }: { children: ReactNode }) {
  const [sheet, setSheet] = useState<OpenSheet>(null);

  const openSheet = useCallback(
    (prefill: Prefill = {}) => setSheet({ kind: 'ripple', prefill }),
    [],
  );
  const openSplashSheet = useCallback(
    () => setSheet({ kind: 'splash', editing: null, firstNote: '' }),
    [],
  );
  const newSplashFrom = useCallback(
    (note: string) => setSheet({ kind: 'splash', editing: null, firstNote: note }),
    [],
  );
  const editSplash = useCallback(
    (splash: EditableSplash) => setSheet({ kind: 'splash', editing: splash, firstNote: '' }),
    [],
  );
  const closeSheet = useCallback(() => setSheet(null), []);

  const value = useMemo(
    () => ({ sheet, openSheet, openSplashSheet, newSplashFrom, editSplash, closeSheet }),
    [sheet, openSheet, openSplashSheet, newSplashFrom, editSplash, closeSheet],
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useInputSheet(): SheetApi {
  const api = useContext(Context);
  if (!api) throw new Error('useInputSheet must be used inside InputSheetProvider');
  return api;
}
