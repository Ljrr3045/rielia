'use client';
import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react';
import type { RefObject } from 'react';
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const media = window.matchMedia(query);
      media.addEventListener('change', onChange);
      return () => media.removeEventListener('change', onChange);
    },
    [query],
  );
  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query]);
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}

export function useIsDetailOverlay(): boolean {
  return useMediaQuery('(max-width: 79.9375rem)');
}

export function useIsSidebarDrawer(): boolean {
  return useMediaQuery('(max-width: 63.9375rem)');
}

export function useIsNarrow(): boolean {
  return useMediaQuery('(max-width: 47.9375rem)');
}

let bodyLocks = 0;
let previousOverflow = '';

export function useBodyScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    if (bodyLocks === 0) {
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }
    bodyLocks += 1;
    return () => {
      bodyLocks = Math.max(0, bodyLocks - 1);
      if (bodyLocks === 0) document.body.style.overflow = previousOverflow;
    };
  }, [active]);
}

export function useFocusTrap<T extends HTMLElement>(
  ref: RefObject<T | null>,
  active: boolean,
  onEscape?: () => void,
) {
  const escapeRef = useRef(onEscape);
  escapeRef.current = onEscape;

  useEffect(() => {
    if (!active) return;
    const node = ref.current;
    if (node === null) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const autofocus = node.querySelector<HTMLElement>('[data-autofocus]') ?? node;
    const frame = requestAnimationFrame(() => autofocus.focus());

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        if (event.defaultPrevented) return;
        const escape = escapeRef.current;
        if (escape !== undefined) {
          event.preventDefault();
          escape();
        }
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = Array.from(
        node!.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => element.offsetParent !== null || element === document.activeElement);
      if (focusable.length === 0) {
        event.preventDefault();
        node!.focus();
        return;
      }
      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      const current = document.activeElement;
      if (event.shiftKey) {
        if (
          current === first ||
          current === autofocus ||
          current === node ||
          !node!.contains(current)
        ) {
          event.preventDefault();
          last.focus();
        }
      } else if (current === last || !node!.contains(current)) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('keydown', onKeyDown);
      if (previous?.isConnected) previous.focus();
    };
  }, [active, ref]);
}
