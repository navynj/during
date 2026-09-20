'use client';

import { useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import { InputSheet, type SheetContext } from '@/features/input-sheet/input-sheet';
import type { RippleWithCategory } from '@/lib/queries/ripples';

import { DetailSheet } from './detail-sheet';
import { defaultInnerTime } from './inner-slot';

type Api = { openRipple: (id: string) => void };
const Context = createContext<Api | null>(null);

export function useRippleSheet(): Api {
  const api = useContext(Context);
  // A settled row outside the host is not a bug worth crashing for; it simply
  // does not open.
  return api ?? { openRipple: () => {} };
}

/**
 * Holds the detail sheet, and hands over to the input sheet when Edit is
 * pressed. One editor: Edit is the same sheet in a different mode, not a
 * second place that knows how to describe a Ripple.
 */
export function RippleSheetHost({
  ripples,
  inner,
  lockedIds,
  sheetContext,
  children,
}: {
  ripples: RippleWithCategory[];
  inner: RippleWithCategory[];
  lockedIds: string[];
  sheetContext: SheetContext;
  children: ReactNode;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const router = useRouter();

  const openRipple = useCallback((id: string) => {
    setOpenId(id);
    setEditing(false);
    setAddingTo(null);
  }, []);
  const api = useMemo(() => ({ openRipple }), [openRipple]);

  // An inner ripple is a record like any other, so it is looked up in both
  // lists and opens the same sheet.
  const ripple = ripples.find((r) => r.id === openId) ?? inner.find((r) => r.id === openId) ?? null;
  const locked = ripple ? lockedIds.includes(ripple.id) : false;
  const innerOf = ripple ? inner.filter((child) => child.parent_ripple_id === ripple.id) : [];
  const parentOf = ripple?.parent_ripple_id
    ? (ripples.find((r) => r.id === ripple.parent_ripple_id) ?? null)
    : null;

  const addParent = addingTo
    ? (ripples.find((r) => r.id === addingTo) ?? inner.find((r) => r.id === addingTo) ?? null)
    : null;

  function close(): void {
    setOpenId(null);
    setEditing(false);
    setAddingTo(null);
  }

  return (
    <Context.Provider value={api}>
      {children}

      {ripple && !editing && !addingTo ? (
        <DetailSheet
          ripple={ripple}
          inner={innerOf}
          locked={locked}
          timeZone={sheetContext.timeZone}
          onClose={close}
          onEdit={() => setEditing(true)}
          onOpenInner={openRipple}
          onAddInner={() => setAddingTo(ripple.id)}
        />
      ) : null}

      {ripple && editing ? (
        <InputSheet
          context={sheetContext}
          // Editing an inner ripple stays in inner mode: the parent is what it
          // has to fit inside, so the sheet keeps saying so.
          prefill={{ parentRippleId: parentOf?.id ?? ripple.parent_ripple_id ?? undefined }}
          editing={{ ripple, locked }}
          onClose={close}
          onCommitted={() => {
            close();
            router.refresh();
          }}
        />
      ) : null}

      {addParent ? (
        <InputSheet
          context={sheetContext}
          prefill={{
            parentRippleId: addParent.id,
            time: defaultInnerTime(
              addParent,
              inner.filter((child) => child.parent_ripple_id === addParent.id),
              sheetContext.timeZone,
            ),
          }}
          onClose={close}
          onCommitted={() => {
            close();
            router.refresh();
          }}
        />
      ) : null}
    </Context.Provider>
  );
}
