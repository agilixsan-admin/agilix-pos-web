import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Order } from '@model/Order';
import { bluetoothPrinter } from '@domain/services/bluetooth-printer.service';

interface PrinterStoreState {
  isConnected: boolean;
  deviceName: string | null;
  isConnecting: boolean;
  autoPrintOnPayment: boolean;
  paperWidth: '58mm' | '80mm';

  connect: () => Promise<boolean>;
  disconnect: () => void;
  setAutoPrint: (enabled: boolean) => void;
  setPaperWidth: (width: '58mm' | '80mm') => void;
  printReceipt: (
    order: Order,
    outletInfo?: { name?: string; address?: string; phone?: string; footerText?: string | null }
  ) => Promise<void>;
}

export const usePrinterStore = create<PrinterStoreState>()(
  persist(
    (set, get) => {
      // Listen to Bluetooth status changes
      bluetoothPrinter.onStatusChange((connected, deviceName) => {
        set({ isConnected: connected, deviceName: deviceName || null });
      });

      return {
        isConnected: bluetoothPrinter.isConnected(),
        deviceName: bluetoothPrinter.getConnectedDeviceName(),
        isConnecting: false,
        autoPrintOnPayment: true,
        paperWidth: '58mm',

        connect: async () => {
          set({ isConnecting: true });
          try {
            await bluetoothPrinter.connect();
            set({
              isConnected: true,
              deviceName: bluetoothPrinter.getConnectedDeviceName(),
              isConnecting: false,
            });
            return true;
          } catch (err: unknown) {
            set({ isConnecting: false });
            throw err;
          }
        },

        disconnect: () => {
          bluetoothPrinter.disconnect();
          set({ isConnected: false, deviceName: null });
        },

        setAutoPrint: (enabled: boolean) => {
          set({ autoPrintOnPayment: enabled });
        },

        setPaperWidth: (width: '58mm' | '80mm') => {
          set({ paperWidth: width });
        },

        printReceipt: async (order: Order, outletInfo) => {
          const { paperWidth } = get();
          await bluetoothPrinter.printReceipt(order, {
            paperWidth,
            outletName: outletInfo?.name,
            outletAddress: outletInfo?.address,
            outletPhone: outletInfo?.phone,
            footerText: outletInfo?.footerText,
          });
        },
      };
    },
    {
      name: 'agilix-pos-printer-storage',
      partialize: (state) => ({
        autoPrintOnPayment: state.autoPrintOnPayment,
        paperWidth: state.paperWidth,
      }),
    }
  )
);

