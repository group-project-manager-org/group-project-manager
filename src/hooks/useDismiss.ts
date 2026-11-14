'use client';

import { useEffect, type RefObject } from 'react';

/**
 * Calls `onDismiss` when the user presses Escape or clicks/taps outside `ref`.
 * Only active while `active` is true.
 */
export function useDismiss(
  ref: RefObject<HTMLElement | null>,
  active: boolean,
  onDismiss: () => void,
): void {
  useEffect(() => {
    if (!active) return;

    function onPointerDown(e: PointerEvent) {
      const el = ref.current;
      if (el && e.target instanceof Node && !el.contains(e.target)) onDismiss();
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onDismiss();
      }
    }

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [ref, active, onDismiss]);
}
