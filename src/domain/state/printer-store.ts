import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Order } from '@model/Order';
import { bluetoothPrinter } from '@domain/services/bluetooth-printer.service';
import { webusbPrinter } from '@domain/services/webusb-printer.service';

export type ActivePrinterConnectionType = 'USB' | 'BLUETOOTH' | 'BROWSER';

interface PrinterStoreState {
  activeConnectionType: ActivePrinterConnectionType;
  isUsbSupported: boolean;
  isBluetoothSupported: boolean;

  // USB State
  isUsbConnected: boolean;
  isUsbConnecting: boolean;
  usbDeviceName: string | null;

  // Bluetooth State
  isBluetoothConnected: boolean;
  isBluetoothConnecting: boolean;
  bluetoothDeviceName: string | null;

  // Unified State (Backward Compatibility)
  isConnected: boolean;
  deviceName: string | null;
  isConnecting: boolean;

  // Preferences
  autoPrintOnPayment: boolean;
  paperWidth: '58mm' | '80mm';
  autoCutPaper: boolean;
  autoOpenCashDrawer: boolean;

  // Actions
  setActiveConnectionType: (type: ActivePrinterConnectionType) => void;
  connectUsb: () => Promise<boolean>;
  disconnectUsb: () => Promise<void>;
  testPrintUsb: () => Promise<void>;

  connectBluetooth: () => Promise<boolean>;
  disconnectBluetooth: () => void;
  testPrintBluetooth: () => Promise<void>;

  openCashDrawer: () => Promise<void>;

  // Unified Actions
  connect: () => Promise<boolean>;
  disconnect: () => void;
  setAutoPrint: (enabled: boolean) => void;
  setPaperWidth: (width: '58mm' | '80mm') => void;
  setAutoCutPaper: (enabled: boolean) => void;
  setAutoOpenCashDrawer: (enabled: boolean) => void;

  printRaw: (payload: Uint8Array | string) => Promise<void>;
  printReceipt: (
    order: Order,
    outletInfo?: {
      businessName?: string;
      name?: string;
      outletName?: string;
      address?: string;
      phone?: string;
      footerText?: string | null;
      logoUrl?: string | null;
      cashierName?: string;
    }
  ) => Promise<void>;
}

export const usePrinterStore = create<PrinterStoreState>()(
  persist(
    (set, get) => {
      const usbSupported = webusbPrinter.isSupported();
      const btSupported = bluetoothPrinter.isSupported();

      // Listener status WebUSB
      webusbPrinter.onStatusChange((connected, devName) => {
        const isBt = get().isBluetoothConnected;
        set({
          isUsbConnected: connected,
          usbDeviceName: devName || null,
          isConnected: connected || isBt,
          deviceName: devName || (isBt ? get().bluetoothDeviceName : null),
        });
      });

      // Listener status Web Bluetooth
      bluetoothPrinter.onStatusChange((connected, devName) => {
        const isUsb = get().isUsbConnected;
        set({
          isBluetoothConnected: connected,
          bluetoothDeviceName: devName || null,
          isConnected: connected || isUsb,
          deviceName: (isUsb ? get().usbDeviceName : null) || devName || null,
        });
      });

      // Jalankan auto-reconnect WebUSB pada startup tanpa memblokir
      if (typeof window !== 'undefined' && usbSupported) {
        setTimeout(() => {
          webusbPrinter.autoReconnect().catch(() => {});
        }, 800);
      }

      return {
        activeConnectionType: 'USB',
        isUsbSupported: usbSupported,
        isBluetoothSupported: btSupported,

        isUsbConnected: webusbPrinter.isConnected(),
        isUsbConnecting: false,
        usbDeviceName: webusbPrinter.getConnectedDeviceName(),

        isBluetoothConnected: bluetoothPrinter.isConnected(),
        isBluetoothConnecting: false,
        bluetoothDeviceName: bluetoothPrinter.getConnectedDeviceName(),

        isConnected: webusbPrinter.isConnected() || bluetoothPrinter.isConnected(),
        deviceName: webusbPrinter.getConnectedDeviceName() || bluetoothPrinter.getConnectedDeviceName(),
        isConnecting: false,

        autoPrintOnPayment: true,
        paperWidth: '58mm',
        autoCutPaper: true,
        autoOpenCashDrawer: true,

        setActiveConnectionType: (type: ActivePrinterConnectionType) => {
          set({ activeConnectionType: type });
        },

        connectUsb: async () => {
          set({ isUsbConnecting: true, isConnecting: true });
          try {
            await webusbPrinter.requestAndConnect();
            const name = webusbPrinter.getConnectedDeviceName();
            set({
              activeConnectionType: 'USB',
              isUsbConnected: true,
              usbDeviceName: name,
              isConnected: true,
              deviceName: name,
              isUsbConnecting: false,
              isConnecting: false,
            });
            return true;
          } catch (err: unknown) {
            set({ isUsbConnecting: false, isConnecting: false });
            throw err;
          }
        },

        disconnectUsb: async () => {
          await webusbPrinter.disconnect();
          const isBt = get().isBluetoothConnected;
          set({
            isUsbConnected: false,
            usbDeviceName: null,
            isConnected: isBt,
            deviceName: isBt ? get().bluetoothDeviceName : null,
          });
        },

        testPrintUsb: async () => {
          const { paperWidth, autoOpenCashDrawer, autoCutPaper } = get();
          await webusbPrinter.testPrint({
            paperWidth,
            openCashDrawer: autoOpenCashDrawer,
            cutPaper: autoCutPaper,
          });
        },

        connectBluetooth: async () => {
          set({ isBluetoothConnecting: true, isConnecting: true });
          try {
            await bluetoothPrinter.connect();
            const name = bluetoothPrinter.getConnectedDeviceName();
            set({
              activeConnectionType: 'BLUETOOTH',
              isBluetoothConnected: true,
              bluetoothDeviceName: name,
              isConnected: true,
              deviceName: name,
              isBluetoothConnecting: false,
              isConnecting: false,
            });
            return true;
          } catch (err: unknown) {
            set({ isBluetoothConnecting: false, isConnecting: false });
            throw err;
          }
        },

        disconnectBluetooth: () => {
          bluetoothPrinter.disconnect();
          const isUsb = get().isUsbConnected;
          set({
            isBluetoothConnected: false,
            bluetoothDeviceName: null,
            isConnected: isUsb,
            deviceName: isUsb ? get().usbDeviceName : null,
          });
        },

        testPrintBluetooth: async () => {
          // Buat mock order sederhana untuk pengujian bluetooth
          const mockOrder: Order = {
            id: 'TEST-BT',
            orderNumber: 'TEST-001',
            orderType: 'DINE_IN',
            status: 'COMPLETED',
            totalAmount: 25000,
            subtotal: 25000,
            paidAmount: 25000,
            changeAmount: 0,
            paymentMethod: 'CASH',
            items: [
              {
                id: '1',
                orderId: 'TEST-BT',
                productId: 'test-1',
                productName: 'Uji Cetak Bluetooth',
                quantity: 1,
                unitPrice: 25000,
                subtotal: 25000,
                status: 'ACTIVE',
              },
            ],
            createdAt: new Date().toISOString(),
          } as unknown as Order;

          const { paperWidth } = get();
          await bluetoothPrinter.printReceipt(mockOrder, {
            paperWidth,
            outletName: 'AGILIX POS (TEST)',
            footerText: 'Test Cetak Printer Bluetooth Sukses',
          });
        },

        openCashDrawer: async () => {
          if (get().isUsbConnected) {
            await webusbPrinter.openCashDrawer();
          } else {
            throw new Error('Pembukaan laci kasir otomatis memerlukan koneksi printer USB terpasang.');
          }
        },

        // Unified connect: prioritas USB jika mode USB atau didukung, selain itu Bluetooth
        connect: async () => {
          const { activeConnectionType, isUsbSupported } = get();
          if (activeConnectionType === 'USB' || isUsbSupported) {
            return get().connectUsb();
          }
          return get().connectBluetooth();
        },

        disconnect: () => {
          if (get().isUsbConnected) {
            get().disconnectUsb();
          }
          if (get().isBluetoothConnected) {
            get().disconnectBluetooth();
          }
        },

        setAutoPrint: (enabled: boolean) => {
          set({ autoPrintOnPayment: enabled });
        },

        setPaperWidth: (width: '58mm' | '80mm') => {
          set({ paperWidth: width });
        },

        setAutoCutPaper: (enabled: boolean) => {
          set({ autoCutPaper: enabled });
        },

        setAutoOpenCashDrawer: (enabled: boolean) => {
          set({ autoOpenCashDrawer: enabled });
        },

        printRaw: async (payload: Uint8Array | string) => {
          let data: Uint8Array;
          if (typeof payload === 'string') {
            // Decode base64 payload dari backend
            const binaryString = atob(payload);
            data = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              data[i] = binaryString.charCodeAt(i);
            }
          } else {
            data = payload;
          }

          const { isUsbConnected, isBluetoothConnected } = get();

          if (isUsbConnected) {
            await webusbPrinter.printRaw(data);
            return;
          }

          if (isBluetoothConnected) {
            await bluetoothPrinter.printRaw(data);
            return;
          }

          throw new Error('Tidak ada printer USB atau Bluetooth yang terhubung.');
        },

        printReceipt: async (order: Order, outletInfo) => {
          const { paperWidth, isUsbConnected, isBluetoothConnected, autoOpenCashDrawer, autoCutPaper } = get();

          const resolvedBusinessName = outletInfo?.businessName;
          const resolvedOutletName = outletInfo?.outletName || outletInfo?.name;
          const resolvedCashier =
            outletInfo?.cashierName ||
            order.cashierName ||
            order.creator?.name ||
            (order as unknown as { user?: { name?: string } }).user?.name;

          if (isUsbConnected) {
            await webusbPrinter.printReceipt(order, {
              paperWidth,
              businessName: resolvedBusinessName,
              outletName: resolvedOutletName,
              outletAddress: outletInfo?.address,
              outletPhone: outletInfo?.phone,
              footerText: outletInfo?.footerText,
              logoUrl: outletInfo?.logoUrl,
              cashierName: resolvedCashier,
              openCashDrawer: autoOpenCashDrawer,
              cutPaper: autoCutPaper,
            });
            return;
          }

          if (isBluetoothConnected) {
            await bluetoothPrinter.printReceipt(order, {
              paperWidth,
              businessName: resolvedBusinessName,
              outletName: resolvedOutletName,
              outletAddress: outletInfo?.address,
              outletPhone: outletInfo?.phone,
              footerText: outletInfo?.footerText,
              logoUrl: outletInfo?.logoUrl,
              cashierName: resolvedCashier,
            });
            return;
          }

          throw new Error('Tidak ada printer USB atau Bluetooth yang terhubung.');
        },
      };
    },
    {
      name: 'agilix-pos-printer-storage',
      partialize: (state) => ({
        activeConnectionType: state.activeConnectionType,
        autoPrintOnPayment: state.autoPrintOnPayment,
        paperWidth: state.paperWidth,
        autoCutPaper: state.autoCutPaper,
        autoOpenCashDrawer: state.autoOpenCashDrawer,
      }),
    }
  )
);
