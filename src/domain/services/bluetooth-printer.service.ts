import type { Order } from '@model/Order';

// Web Bluetooth API Type Definitions
export interface BluetoothRemoteGATTCharacteristic {
  writeValue(value: BufferSource): Promise<void>;
  writeValueWithoutResponse?(value: BufferSource): Promise<void>;
}

export interface BluetoothRemoteGATTService {
  getCharacteristic(characteristic: string | number): Promise<BluetoothRemoteGATTCharacteristic>;
  getCharacteristics(): Promise<BluetoothRemoteGATTCharacteristic[]>;
}

export interface BluetoothRemoteGATTServer {
  connected: boolean;
  connect(): Promise<BluetoothRemoteGATTServer>;
  disconnect(): void;
  getPrimaryService(service: string | number): Promise<BluetoothRemoteGATTService>;
  getPrimaryServices(): Promise<BluetoothRemoteGATTService[]>;
}

export interface BluetoothDevice extends EventTarget {
  id: string;
  name?: string;
  gatt?: BluetoothRemoteGATTServer;
}

// Known GATT Service UUIDs for Bluetooth Thermal Printers
const PRINTER_SERVICES = [
  '000018f0-0000-1000-8000-00805f9b34fb', // Standard POS Printer Service
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2', // Serial Port Service (SPP)
  '49535343-fe7d-4ae5-8fa9-9fafd205e455', // ISSC Transparent TX Service
  '0000ff00-0000-1000-8000-00805f9b34fb', // Common ESC/POS Service
  '0000fee7-0000-1000-8000-00805f9b34fb', // Microchip / Tencent Thermal
];

export interface PrintOptions {
  paperWidth?: '58mm' | '80mm';
  outletName?: string;
  outletAddress?: string;
  outletPhone?: string;
}

class BluetoothPrinterService {
  private device: BluetoothDevice | null = null;
  private characteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private onStatusChangeListeners: Array<(connected: boolean, deviceName?: string) => void> = [];

  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'bluetooth' in navigator;
  }

  public isConnected(): boolean {
    return Boolean(this.device?.gatt?.connected && this.characteristic);
  }

  public getConnectedDeviceName(): string | null {
    return this.isConnected() ? this.device?.name || 'Printer Bluetooth' : null;
  }

  public onStatusChange(callback: (connected: boolean, deviceName?: string) => void): () => void {
    this.onStatusChangeListeners.push(callback);
    return () => {
      this.onStatusChangeListeners = this.onStatusChangeListeners.filter((l) => l !== callback);
    };
  }

  private notifyStatus() {
    const connected = this.isConnected();
    const name = this.getConnectedDeviceName() || undefined;
    this.onStatusChangeListeners.forEach((fn) => fn(connected, name));
  }

  public async connect(): Promise<boolean> {
    if (!this.isSupported()) {
      throw new Error(
        'Browser Anda tidak mendukung Web Bluetooth. Silakan gunakan Google Chrome atau Microsoft Edge.'
      );
    }

    try {
      const navBluetooth = (navigator as unknown as {
        bluetooth: {
          requestDevice(options: {
            acceptAllDevices?: boolean;
            optionalServices?: string[];
          }): Promise<BluetoothDevice>;
        };
      }).bluetooth;

      const device = await navBluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: PRINTER_SERVICES,
      });

      if (!device || !device.gatt) {
        throw new Error('Perangkat Bluetooth tidak memiliki layanan GATT.');
      }

      device.addEventListener('gattserverdisconnected', () => {
        this.characteristic = null;
        this.notifyStatus();
      });

      const server = await device.gatt.connect();

      // Find writable characteristic
      let writableChar: BluetoothRemoteGATTCharacteristic | null = null;

      // Try known services first
      for (const serviceUuid of PRINTER_SERVICES) {
        try {
          const service = await server.getPrimaryService(serviceUuid);
          const chars = await service.getCharacteristics();
          for (const char of chars) {
            writableChar = char;
            break;
          }
        } catch {
          // Continue trying other services
        }
        if (writableChar) break;
      }

      // If not found in known services, try any primary service
      if (!writableChar) {
        try {
          const services = await server.getPrimaryServices();
          for (const s of services) {
            const chars = await s.getCharacteristics();
            if (chars.length > 0) {
              writableChar = chars[0];
              break;
            }
          }
        } catch {
          // Ignore
        }
      }

      if (!writableChar) {
        throw new Error('Tidak dapat menemukan jalur tulis (write characteristic) pada printer.');
      }

      this.device = device;
      this.characteristic = writableChar;
      this.notifyStatus();
      return true;
    } catch (err: unknown) {
      this.device = null;
      this.characteristic = null;
      this.notifyStatus();
      throw err;
    }
  }

  public disconnect(): void {
    if (this.device?.gatt?.connected) {
      this.device.gatt.disconnect();
    }
    this.device = null;
    this.characteristic = null;
    this.notifyStatus();
  }

  private encodeReceipt(order: Order, options: PrintOptions = {}): Uint8Array {
    const paperWidth = options.paperWidth || '58mm';
    const cols = paperWidth === '80mm' ? 48 : 32;

    const encoder = new TextEncoder();
    const bytes: number[] = [];

    const add = (...data: number[]) => bytes.push(...data);
    const addText = (text: string) => {
      const encoded = encoder.encode(text);
      for (let i = 0; i < encoded.length; i++) {
        bytes.push(encoded[i]);
      }
    };
    const addLine = (text = '') => {
      addText(text + '\n');
    };

    const center = (text: string): string => {
      if (text.length >= cols) return text.slice(0, cols);
      const pad = Math.floor((cols - text.length) / 2);
      return ' '.repeat(pad) + text;
    };

    const leftRight = (left: string, right: string): string => {
      const spaceNeeded = cols - left.length - right.length;
      if (spaceNeeded >= 1) {
        return left + ' '.repeat(spaceNeeded) + right;
      }
      return left + '\n' + ' '.repeat(Math.max(0, cols - right.length)) + right;
    };

    const divider = (char = '-'): string => char.repeat(cols);

    const formatRp = (val?: number | string | null): string => {
      const n = Number(val || 0);
      return `Rp ${n.toLocaleString('id-ID')}`;
    };

    // ESC/POS Commands
    const ESC_INIT = [0x1b, 0x40];
    const ESC_ALIGN_CENTER = [0x1b, 0x61, 0x01];
    const ESC_ALIGN_LEFT = [0x1b, 0x61, 0x00];
    const ESC_BOLD_ON = [0x1b, 0x45, 0x01];
    const ESC_BOLD_OFF = [0x1b, 0x45, 0x00];
    const ESC_DOUBLE_SIZE = [0x1d, 0x21, 0x11];
    const ESC_NORMAL_SIZE = [0x1d, 0x21, 0x00];
    const ESC_FEED_3 = [0x1b, 0x64, 0x03];
    const ESC_CUT = [0x1d, 0x56, 0x41, 0x00];

    // 1. Initialize Printer
    add(...ESC_INIT);

    // 2. Header: Outlet Name (Double size, bold, center)
    add(...ESC_ALIGN_CENTER);
    add(...ESC_BOLD_ON);
    add(...ESC_DOUBLE_SIZE);
    addLine(options.outletName || 'AGILIX POS');
    add(...ESC_NORMAL_SIZE);
    add(...ESC_BOLD_OFF);

    if (options.outletAddress) {
      addLine(options.outletAddress);
    }
    if (options.outletPhone) {
      addLine(`Telp: ${options.outletPhone}`);
    }

    addLine(divider('-'));

    // 3. Order Metadata
    add(...ESC_ALIGN_LEFT);
    const orderNum = order.orderNumber || (order.id ? order.id.slice(0, 8).toUpperCase() : '');
    addLine(`No. Order : #${orderNum}`);

    const now = new Date(order.createdAt || Date.now());
    const dateStr = now.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    const timeStr = now.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });
    addLine(`Waktu     : ${dateStr} ${timeStr}`);

    const tableName = order.table?.name ? `Meja ${order.table.name}` : 'Take Away';
    addLine(`Layanan   : ${tableName}`);

    if (order.customerName) {
      addLine(`Pelanggan : ${order.customerName}`);
    }

    addLine(divider('-'));

    // 4. Items List
    const activeItems = (order.items || []).filter((i) => !i.status || i.status === 'ACTIVE');
    for (const item of activeItems) {
      const name = item.productName || 'Item';
      const isDefaultVariant =
        !item.variantName ||
        item.variantName.trim().toLowerCase().includes('default') ||
        item.variantName.trim().toLowerCase() === name.trim().toLowerCase();
      const variantName = !isDefaultVariant ? ` (${item.variantName})` : '';
      const fullName = `${name}${variantName}`;
      addLine(fullName);

      const qtyPrice = `  ${item.quantity} x ${formatRp(item.unitPrice)}`;
      const itemSubtotal = formatRp(item.subtotal || item.quantity * Number(item.unitPrice));
      addLine(leftRight(qtyPrice, itemSubtotal));

      if (item.notes) {
        addLine(`  * Note: ${item.notes}`);
      }
    }

    addLine(divider('-'));

    // 5. Totals Breakdown
    addLine(leftRight('Subtotal', formatRp(order.subtotal || order.totalAmount)));

    if (Number(order.discountAmount || 0) > 0) {
      addLine(leftRight('Diskon', `-${formatRp(order.discountAmount)}`));
    }
    if (Number(order.packagingFee || 0) > 0) {
      addLine(leftRight('Biaya Kemasan', formatRp(order.packagingFee)));
    }
    if (Number(order.serviceCharge || 0) > 0) {
      addLine(leftRight('Service Charge', formatRp(order.serviceCharge)));
    }
    if (Number(order.taxAmount || 0) > 0) {
      const taxLabel = order.taxName || 'Pajak';
      addLine(leftRight(taxLabel, formatRp(order.taxAmount)));
    }

    addLine(divider('='));

    // Grand Total (Bold)
    add(...ESC_BOLD_ON);
    addLine(leftRight('TOTAL', formatRp(order.totalAmount)));
    add(...ESC_BOLD_OFF);

    // Payment Info
    const payMethod = order.paymentMethod || 'CASH';
    const paidAmt = Number(order.paidAmount || order.totalAmount);
    addLine(leftRight(`Bayar (${payMethod})`, formatRp(paidAmt)));

    if (Number(order.changeAmount || 0) > 0) {
      add(...ESC_BOLD_ON);
      addLine(leftRight('Kembalian', formatRp(order.changeAmount)));
      add(...ESC_BOLD_OFF);
    }

    addLine(divider('-'));

    // 6. Footer Notes
    add(...ESC_ALIGN_CENTER);
    addLine('Terima kasih atas kunjungan Anda!');
    addLine('Powered by Agilix POS');

    // 7. Feed and Cut Paper
    add(...ESC_FEED_3);
    add(...ESC_CUT);

    return new Uint8Array(bytes);
  }

  public async printReceipt(order: Order, options: PrintOptions = {}): Promise<void> {
    if (!this.isConnected() || !this.characteristic) {
      throw new Error('Printer Bluetooth belum terhubung. Silakan hubungkan printer terlebih dahulu.');
    }

    const data = this.encodeReceipt(order, options);

    // Send data in chunks of 100 bytes to avoid BLE buffer overflow
    const chunkSize = 100;
    for (let offset = 0; offset < data.length; offset += chunkSize) {
      const chunk = data.slice(offset, offset + chunkSize);
      if (this.characteristic.writeValueWithoutResponse) {
        await this.characteristic.writeValueWithoutResponse(chunk);
      } else {
        await this.characteristic.writeValue(chunk);
      }
      // Small pause between chunks
      await new Promise((resolve) => setTimeout(resolve, 25));
    }
  }
}

export const bluetoothPrinter = new BluetoothPrinterService();

