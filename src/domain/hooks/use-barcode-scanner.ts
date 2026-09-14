import { useEffect, useRef } from 'react';

export interface BarcodeScannerOptions {
  /**
   * Maximum interval in milliseconds between keystrokes to be considered scanner input.
   * Hardware scanners typically fire keystrokes in < 25-40ms.
   * Default: 50ms
   */
  maxIntervalMs?: number;

  /**
   * Minimum length of barcode string before triggering onScan.
   * Default: 3
   */
  minLength?: number;

  /**
   * Whether scanner listener is enabled.
   * Default: true
   */
  enabled?: boolean;
}

/**
 * Hook to listen for USB / Bluetooth hardware Barcode Scanner inputs.
 * Barcode scanners act as virtual keyboards that type scanned characters at ultra-fast speeds
 * followed by an 'Enter' key.
 *
 * @param onScan Callback invoked with the scanned barcode string
 * @param options Scanner tuning options
 */
export function useBarcodeScanner(
  onScan: (barcode: string) => void,
  options: BarcodeScannerOptions = {}
): void {
  const { maxIntervalMs = 50, minLength = 3, enabled = true } = options;

  const bufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const now = Date.now();
      const interval = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      // When Enter is pressed
      if (event.key === 'Enter') {
        if (bufferRef.current.length >= minLength) {
          event.preventDefault();
          const scannedCode = bufferRef.current.trim();
          bufferRef.current = '';
          onScan(scannedCode);
        } else {
          bufferRef.current = '';
        }
        return;
      }

      // If key is single printable character
      if (event.key.length === 1) {
        // If interval is larger than scanner speed threshold, reset buffer (user is typing manually)
        if (interval > maxIntervalMs && bufferRef.current.length > 0) {
          bufferRef.current = '';
        }
        bufferRef.current += event.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onScan, maxIntervalMs, minLength, enabled]);
}

