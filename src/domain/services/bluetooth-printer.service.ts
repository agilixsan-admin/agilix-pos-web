import type { Order } from '@model/Order';

// Web Bluetooth API Type Definitions
export interface BluetoothCharacteristicProperties {
  broadcast?: boolean;
  read?: boolean;
  writeWithoutResponse?: boolean;
  write?: boolean;
  notify?: boolean;
  indicate?: boolean;
}

export interface BluetoothRemoteGATTCharacteristic {
  uuid?: string;
  properties?: BluetoothCharacteristicProperties;
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
  '0000ffe0-0000-1000-8000-00805f9b34fb', // HM-10 / CC2541 BLE
  '0000fff0-0000-1000-8000-00805f9b34fb', // Common Mini Thermal POS
  '0000ae30-0000-1000-8000-00805f9b34fb', // Zhuhai / Xprinter BLE
  '0000af30-0000-1000-8000-00805f9b34fb', // MPT / GOOJPRT BLE
];

export interface PrintOptions {
  paperWidth?: '58mm' | '80mm';
  columns?: number;
  businessName?: string;
  outletName?: string;
  outletAddress?: string;
  outletPhone?: string;
  footerText?: string | null;
  logoUrl?: string | null;
  cashierName?: string;
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
      console.log('[WebBluetooth] Membuka jendela pemilih perangkat Bluetooth...');
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

      console.log('[WebBluetooth] Perangkat dipilih:', device.name || 'Unnamed', 'ID:', device.id);

      if (!device || !device.gatt) {
        throw new Error('Perangkat Bluetooth tidak memiliki layanan GATT.');
      }

      device.addEventListener('gattserverdisconnected', () => {
        console.warn('[WebBluetooth] Perangkat terputus (gattserverdisconnected).');
        this.characteristic = null;
        this.notifyStatus();
      });

      console.log('[WebBluetooth] Menghubungkan ke GATT server...');
      const server = await device.gatt.connect();
      console.log('[WebBluetooth] GATT Server terhubung! Mencari writable characteristic...');

      // Cari characteristic yang benar-benar memiliki izin tulis (write / writeWithoutResponse)
      let writableChar: BluetoothRemoteGATTCharacteristic | null = null;

      // Coba layanan-layanan printer yang sudah terdaftar
      for (const serviceUuid of PRINTER_SERVICES) {
        try {
          const service = await server.getPrimaryService(serviceUuid);
          console.log('[WebBluetooth] Menemukan primary service:', serviceUuid);
          const chars = await service.getCharacteristics();

          // Prioritas 1: Karakteristik dengan izin writeWithoutResponse (tercepat dan paling stabil di thermal printer)
          const writeNoRespChar = chars.find((c) => c.properties?.writeWithoutResponse);
          // Prioritas 2: Karakteristik dengan izin write standar
          const writeChar = chars.find((c) => c.properties?.write);

          if (writeNoRespChar) {
            writableChar = writeNoRespChar;
            console.log('[WebBluetooth] Memilih characteristic (writeWithoutResponse):', writableChar.uuid);
            break;
          } else if (writeChar) {
            writableChar = writeChar;
            console.log('[WebBluetooth] Memilih characteristic (write):', writableChar.uuid);
            break;
          }
        } catch {
          // Lanjut mencoba service berikutnya
        }
        if (writableChar) break;
      }

      // Jika belum ditemukan di known services, cari di seluruh service yang ada
      if (!writableChar) {
        try {
          const services = await server.getPrimaryServices();
          console.log('[WebBluetooth] Mencari di semua primary services (total:', services.length, ')...');
          for (const s of services) {
            const chars = await s.getCharacteristics();
            const writeNoRespChar = chars.find((c) => c.properties?.writeWithoutResponse);
            const writeChar = chars.find((c) => c.properties?.write);

            if (writeNoRespChar) {
              writableChar = writeNoRespChar;
              console.log('[WebBluetooth] Menemukan fallback characteristic (writeWithoutResponse):', writableChar.uuid);
              break;
            } else if (writeChar) {
              writableChar = writeChar;
              console.log('[WebBluetooth] Menemukan fallback characteristic (write):', writableChar.uuid);
              break;
            }
          }
        } catch {
          // Ignore
        }
      }

      if (!writableChar) {
        throw new Error('Tidak dapat menemukan jalur tulis (write characteristic) pada printer Bluetooth.');
      }

      this.device = device;
      this.characteristic = writableChar;
      this.notifyStatus();
      console.log('[WebBluetooth] Printer Bluetooth siap digunakan!');
      return true;
    } catch (err: unknown) {
      this.device = null;
      this.characteristic = null;
      this.notifyStatus();
      console.error('[WebBluetooth] Gagal menghubungkan:', err);
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

  /**
   * Konversi URL gambar menjadi ESC/POS raster bit image (GS v 0).
   * Jika gambar gagal dimuat (CORS, offline, URL rusak), mengembalikan null secara aman tanpa error.
   */
  private async convertImageToEscPosRaster(
    imageUrl: string,
    maxWidthDots = 200
  ): Promise<number[] | null> {
    if (typeof window === 'undefined' || !imageUrl) return null;

    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        try {
          const scale = Math.min(1, maxWidthDots / (img.width || 1));
          const targetWidth = Math.max(8, Math.floor(img.width * scale));
          const byteWidth = Math.ceil(targetWidth / 8);
          const actualWidth = byteWidth * 8;
          const actualHeight = Math.max(8, Math.floor(img.height * scale));

          const canvas = document.createElement('canvas');
          canvas.width = actualWidth;
          canvas.height = actualHeight;
          const ctx = canvas.getContext('2d');
          if (!ctx) return resolve(null);

          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, actualWidth, actualHeight);

          const offsetX = Math.floor((actualWidth - targetWidth) / 2);
          ctx.drawImage(img, offsetX, 0, targetWidth, actualHeight);

          const imgData = ctx.getImageData(0, 0, actualWidth, actualHeight);
          const pixels = imgData.data;

          const xL = byteWidth % 256;
          const xH = Math.floor(byteWidth / 256);
          const yL = actualHeight % 256;
          const yH = Math.floor(actualHeight / 256);

          // GS v 0 0 xL xH yL yH
          const rasterBytes: number[] = [0x1d, 0x76, 0x30, 0x00, xL, xH, yL, yH];

          for (let y = 0; y < actualHeight; y++) {
            for (let x = 0; x < byteWidth; x++) {
              let byteVal = 0;
              for (let b = 0; b < 8; b++) {
                const pixelX = x * 8 + b;
                const idx = (y * actualWidth + pixelX) * 4;
                const r = pixels[idx];
                const g = pixels[idx + 1];
                const bCol = pixels[idx + 2];
                const alpha = pixels[idx + 3];

                if (alpha >= 128) {
                  const lum = 0.299 * r + 0.587 * g + 0.114 * bCol;
                  if (lum < 160) {
                    byteVal |= 1 << (7 - b);
                  }
                }
              }
              rasterBytes.push(byteVal);
            }
          }

          resolve(rasterBytes);
        } catch {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = imageUrl;
    });
  }

  private async encodeReceipt(order: Order, options: PrintOptions = {}): Promise<Uint8Array> {
    const paperWidth = options.paperWidth || '58mm';
    // Standar printer thermal portabel 58mm menggunakan Font B (48 kolom).
    // Opsi kustom options.columns dapat diisi jika menggunakan konfigurasi khusus (mis. 32 kolom Font A).
    const cols = options.columns || (paperWidth === '80mm' ? 48 : 48);

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
    const ESC_FEED_4 = [0x1b, 0x64, 0x04];
    const ESC_CUT = [0x1d, 0x56, 0x41, 0x00];

    // 1. Initialize Printer
    add(...ESC_INIT);

    // 1b. Cetak Logo jika tersedia (ESC/POS Raster Bit Image)
    if (options.logoUrl) {
      try {
        const logoRaster = await this.convertImageToEscPosRaster(
          options.logoUrl,
          paperWidth === '80mm' ? 320 : 200
        );
        if (logoRaster && logoRaster.length > 0) {
          add(...ESC_ALIGN_CENTER);
          add(...logoRaster);
          addLine();
        }
      } catch {
        // Fallback hening jika logo gagal dimuat (CORS / offline)
      }
    }

    // 2. Header: Brand & Outlet Name (Center)
    add(...ESC_ALIGN_CENTER);
    if (options.businessName) {
      add(...ESC_BOLD_ON);
      add(...ESC_DOUBLE_SIZE);
      addLine(options.businessName.toUpperCase());
      add(...ESC_NORMAL_SIZE);
      add(...ESC_BOLD_OFF);

      if (options.outletName && options.outletName.trim().toLowerCase() !== options.businessName.trim().toLowerCase()) {
        addLine(options.outletName);
      }
    } else {
      add(...ESC_BOLD_ON);
      add(...ESC_DOUBLE_SIZE);
      addLine((options.outletName || 'AGILIX POS').toUpperCase());
      add(...ESC_NORMAL_SIZE);
      add(...ESC_BOLD_OFF);
    }

    if (options.outletAddress) {
      addLine(options.outletAddress);
    }
    if (options.outletPhone) {
      addLine(`Telp: ${options.outletPhone}`);
    }

    // 3. Order Metadata & Divider
    // Pindah ke RATA KIRI sebelum mencetak divider agar membentang penuh dari sisi kiri ke kanan
    add(...ESC_ALIGN_LEFT);
    addLine(divider('-'));

    const orderNum = order.orderNumber || (order.id ? order.id.slice(0, 8).toUpperCase() : '');
    addLine(leftRight('No. Order:', orderNum));

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
    addLine(leftRight('Waktu:', `${dateStr}, ${timeStr}`));

    const isDineIn =
      order.orderType === 'DINE_IN' ||
      Boolean(order.tableName || order.tableNumber || order.table?.name || order.table?.tableNumber);
    const tableIdentifier =
      order.tableName || order.tableNumber || order.table?.name || order.table?.tableNumber;
    const tipeLayanan = isDineIn
      ? `Dine-In${tableIdentifier ? ` (${tableIdentifier})` : ''}`
      : 'Take Away';
    addLine(leftRight('Tipe:', tipeLayanan));

    const cashierName =
      options.cashierName ||
      order.cashierName ||
      order.creator?.name ||
      (order as unknown as { user?: { name?: string } }).user?.name ||
      'Kasir';
    addLine(leftRight('Kasir:', cashierName));

    if (order.customerName) {
      addLine(leftRight('Pelanggan:', order.customerName));
    }

    addLine(divider('-'));

    // 4. Items List
    const activeItems = (order.items || []).filter(
      (i) => (!i.status || i.status === 'ACTIVE' || i.status !== 'VOID') && !i.isVoid
    );
    for (const item of activeItems) {
      const name = item.productName || 'Item';
      const isDefaultVariant =
        !item.variantName ||
        item.variantName.trim().toLowerCase().includes('default') ||
        item.variantName.trim().toLowerCase() === name.trim().toLowerCase();
      const variantName = !isDefaultVariant ? ` (${item.variantName})` : '';
      const fullName = `${name}${variantName}`;

      const itemSubtotal = formatRp(
        item.subtotal ?? Number(item.unitPrice || item.price || 0) * item.quantity
      );
      addLine(leftRight(fullName, itemSubtotal));

      const unitPriceVal = Number(
        item.unitPrice || item.price || (item.subtotal ? item.subtotal / item.quantity : 0)
      );
      const qtyPrice = `${item.quantity} x ${formatRp(unitPriceVal)}`;
      if (item.notes) {
        addLine(leftRight(qtyPrice, `(${item.notes})`));
      } else {
        addLine(qtyPrice);
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

    addLine(divider('-'));

    // Grand Total (Bold)
    add(...ESC_BOLD_ON);
    addLine(leftRight('TOTAL', formatRp(order.totalAmount)));
    add(...ESC_BOLD_OFF);

    // Payment Info
    const payMethod = order.paymentMethod || 'CASH';
    const paidAmt = Number(order.paidAmount || order.totalAmount);
    addLine(leftRight(`Metode: ${payMethod}`, `Bayar: ${formatRp(paidAmt)}`));

    if (Number(order.changeAmount || 0) > 0) {
      add(...ESC_BOLD_ON);
      addLine(leftRight('Kembalian', formatRp(order.changeAmount)));
      add(...ESC_BOLD_OFF);
    }

    addLine(divider('-'));

    // 6. Footer Notes
    add(...ESC_ALIGN_CENTER);
    if (options.footerText && options.footerText.trim()) {
      const lines = options.footerText.split('\n');
      for (const line of lines) {
        if (line.trim()) {
          addLine(line.trim());
        }
      }
      addLine();
    }
    addLine('Powered by SAJI * Agilix Tech Solution');

    // 7. Feed and Cut Paper
    addLine();
    addLine();
    addLine();
    add(...ESC_FEED_4);
    add(...ESC_CUT);

    return new Uint8Array(bytes);
  }

  /**
   * Mengirim byte mentah ESC/POS langsung ke printer Bluetooth
   */
  public async printRaw(data: Uint8Array): Promise<void> {
    if (!this.isConnected() || !this.characteristic) {
      throw new Error('Printer Bluetooth belum terhubung. Silakan hubungkan printer terlebih dahulu.');
    }

    console.log('[WebBluetooth] Mengirim raw ESC/POS ke printer:', data.length, 'bytes...');

    // Kirim data dalam ukuran chunk 20 bytes (standar aman BLE ATT MTU default untuk Android & printer thermal)
    const chunkSize = 20;
    const canWriteWithoutResp = Boolean(
      this.characteristic.properties?.writeWithoutResponse &&
      typeof this.characteristic.writeValueWithoutResponse === 'function'
    );

    for (let offset = 0; offset < data.length; offset += chunkSize) {
      const chunk = data.slice(offset, offset + chunkSize);
      if (canWriteWithoutResp && this.characteristic.writeValueWithoutResponse) {
        await this.characteristic.writeValueWithoutResponse(chunk);
      } else {
        await this.characteristic.writeValue(chunk);
      }
      // Delay 15ms per paket agar buffer mikrokontroler printer tidak overflow
      await new Promise((resolve) => setTimeout(resolve, 15));
    }
    console.log('[WebBluetooth] Pengiriman data selesai!');
  }

  public async printReceipt(order: Order, options: PrintOptions = {}): Promise<void> {
    const data = await this.encodeReceipt(order, options);
    await this.printRaw(data);
  }
}

export const bluetoothPrinter = new BluetoothPrinterService();

