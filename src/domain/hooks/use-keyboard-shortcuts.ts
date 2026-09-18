import { useEffect } from 'react';

export type ShortcutHandler = (event: KeyboardEvent) => void;

export interface KeyboardShortcutConfig {
  [keyCombo: string]: ShortcutHandler;
}

/**
 * Hook to listen for keyboard shortcuts in POS / Cashier operations.
 * Examples of key combinations:
 * - 'F2': Open Payment Modal
 * - 'F3' or 'Space': Focus Search Input
 * - 'F4': Hold / Save Order
 * - 'Escape': Close active modal or clear selection
 * - 'ctrl+k' or 'meta+k': Command palette / Quick Action
 *
 * @param shortcuts Map of key combo string to handler function
 * @param enabled Whether shortcuts are active (default: true)
 */
export function useKeyboardShortcuts(
  shortcuts: KeyboardShortcutConfig,
  enabled: boolean = true
): void {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if user is typing inside an input/textarea (ignore single letter shortcuts like 'Space' unless explicit)
      const target = event.target as HTMLElement | null;
      const isTyping =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);

      // Build key string
      const pressedKey = event.key;
      if (!pressedKey) return;

      const isCtrl = event.ctrlKey || event.metaKey;
      const isAlt = event.altKey;
      const isShift = event.shiftKey;

      for (const [combo, handler] of Object.entries(shortcuts)) {
        const normalizedCombo = combo.toLowerCase().trim();
        const parts = normalizedCombo.split('+').map((p) => p.trim());
        const mainKey = parts[parts.length - 1];

        const reqCtrl = parts.includes('ctrl') || parts.includes('meta') || parts.includes('cmd');
        const reqAlt = parts.includes('alt');
        const reqShift = parts.includes('shift');

        const keyMatches =
          pressedKey.toLowerCase() === mainKey ||
          (mainKey === 'space' && event.code === 'Space') ||
          (mainKey === 'esc' && pressedKey === 'Escape') ||
          (mainKey === 'enter' && pressedKey === 'Enter');

        const modifierMatches =
          Boolean(reqCtrl) === Boolean(isCtrl) &&
          Boolean(reqAlt) === Boolean(isAlt) &&
          Boolean(reqShift) === Boolean(isShift);

        if (keyMatches && modifierMatches) {
          // If typing and the shortcut is Escape or a Function key (F1-F12), allow it.
          // Otherwise prevent triggering plain character shortcuts while typing in a form.
          const isSpecialKey =
            pressedKey.startsWith('F') ||
            pressedKey === 'Escape' ||
            reqCtrl ||
            reqAlt;

          if (!isTyping || isSpecialKey) {
            event.preventDefault();
            handler(event);
            break;
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcuts, enabled]);
}

