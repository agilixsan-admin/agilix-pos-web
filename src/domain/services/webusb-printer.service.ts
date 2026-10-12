import type { Order } from '@model/Order';

// WebUSB API Type Definitions
export interface USBEndpoint {
  endpointNumber: number;
  direction: 'in' | 'out';
  type: 'bulk' | 'interrupt' | 'isochronous';
  packetSize: number;
}

export interface USBAlternateInterface {
  alternateSetting: number;
  interfaceClass: number;
  interfaceSubclass: number;
  interfaceProtocol: number;
  interfaceName?: string;
  endpoints: USBEndpoint[];
}

export interface USBInterface {
  interfaceNumber: number;
  alternate: USBAlternateInterface;
  alternates: USBAlternateInterface[];
  claimed: boolean;
}

export interface USBConfiguration {
  configurationValue: number;
  configurationName?: string;
  interfaces: USBInterface[];
}

export interface USBDevice {
  vendorId: number;
  productId: number;
  opened: boolean;
  productName?: string;
  manufacturerName?: string;
  serialNumber?: string;
  configuration: USBConfiguration | null;
  configurations: USBConfiguration[];
  open(): Promise<void>;
  close(): Promise<void>;
  selectConfiguration(configurationValue: number): Promise<void>;
  claimInterface(interfaceNumber: number): Promise<void>;
  releaseInterface(interfaceNumber: number): Promise<void>;
  transferOut(endpointNumber: number, data: BufferSource): Promise<USBOutTransferResult>;
}

export interface USBOutTransferResult {
  bytesWritten: number;
  status: 'ok' | 'stall' | 'babble';
}

export interface USBDeviceFilter {
  vendorId?: number;
  productId?: number;
  classCode?: number;
  subclassCode?: number;
  protocolCode?: number;
  serialNumber?: string;
}

export interface WebUsbPrintOptions {
  paperWidth?: '58mm' | '80mm';
  outletName?: string;
  outletAddress?: string;
  outletPhone?: string;
  footerText?: string | null;
  openCashDrawer?: boolean;
  cutPaper?: boolean;
}

class WebUsbPrinterService {
  private device: USBDevice | null = null;
  private interfaceNumber: number | null = null;
  private endpointNumber: number | null = null;
  private onStatusChangeListeners: Array<(connected: boolean, deviceName?: string) => void> = [];
  private isListeningDisconnect = false;

  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'usb' in navigator;
  }

  public isConnected(): boolean {
    return Boolean(this.device && this.device.opened && this.endpointNumber !== null);
  }

  public getConnectedDeviceName(): string | null {
    if (!this.isConnected() || !this.device) return null;
    return (
      this.device.productName ||
      this.device.manufacturerName ||
      `USB Printer (${this.device.vendorId.toString(16)}:${this.device.productId.toString(16)})`
    );
  }

  public getConnectedDeviceInfo(): {
    vendorId?: number;
    productId?: number;
    productName?: string;
    manufacturerName?: string;
    serialNumber?: string;
  } | null {
    if (!this.isConnected() || !this.device) return null;
    return {
      vendorId: this.device.vendorId,
      productId: this.device.productId,
      productName: this.device.productName,
      manufacturerName: this.device.manufacturerName,
      serialNumber: this.device.serialNumber,
    };
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

  private setupDisconnectListener() {
    if (this.isListeningDisconnect || !this.isSupported()) return;
    const navUsb = (navigator as unknown as { usb: EventTarget }).usb;
    navUsb.addEventListener('disconnect', (event: Event) => {
      const disconnectedDevice = (event as unknown as { device: USBDevice }).device;
      if (
        this.device &&
        disconnectedDevice &&
        this.device.vendorId === disconnectedDevice.vendorId &&
        this.device.productId === disconnectedDevice.productId
      ) {
        this.disconnect();
      }
    });
    this.isListeningDisconnect = true;
  }

  /**
   * Coba hubungkan kembali ke printer USB yang sebelumnya sudah diizinkan oleh pengguna
   * tanpa menampilkan popup dialog browser lagi.
   */
  public async autoReconnect(): Promise<boolean> {
    if (!this.isSupported() || this.isConnected()) return false;
    this.setupDisconnectListener();

    try {
      const navUsb = (navigator as unknown as { usb: { getDevices(): Promise<USBDevice[]> } }).usb;
      const devices = await navUsb.getDevices();
      if (!devices || devices.length === 0) return false;

      // Pilih perangkat yang cocok
      for (const dev of devices) {
        try {
          await this.connectDevice(dev);
          return true;
        } catch {
          // Lanjut ke perangkat berikutnya jika gagal claim
        }
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Membuka pemilih perangkat browser (navigator.usb.requestDevice)
   * dan menghubungkan printer USB yang dipilih kasir.
   */
  public async requestAndConnect(): Promise<boolean> {
    if (!this.isSupported()) {
      throw new Error(
        'Browser Anda tidak mendukung WebUSB API. Silakan gunakan Google Chrome, Microsoft Edge, atau Opera.'
      );
    }
    this.setupDisconnectListener();

    const navUsb = (
      navigator as unknown as {
        usb: {
          requestDevice(options: { filters: USBDeviceFilter[] }): Promise<USBDevice>;
        };
      }
    ).usb;

    let device: USBDevice;
    try {
      device = await navUsb.requestDevice({ filters: [] });
    } catch (err: unknown) {
      if ((err as Error)?.name === 'NotFoundError') {
        throw new Error('Pemilihan printer USB dibatalkan.');
      }
      throw err;
    }

    if (!device) {
      throw new Error('Tidak ada perangkat USB yang dipilih.');
    }

    return this.connectDevice(device);
  }

  public async connectDevice(device: USBDevice): Promise<boolean> {
    try {
      await device.open();

      // Pilih konfigurasi pertama jika belum aktif
      if (!device.configuration) {
        const configValue = device.configurations?.[0]?.configurationValue ?? 1;
        await device.selectConfiguration(configValue);
      }

      // Cari interface dan OUT endpoint untuk mengirim byte ESC/POS
      let foundInterfaceNumber: number | null = null;
      let foundEndpointNumber: number | null = null;

      const interfaces = device.configuration?.interfaces || [];

      // Prioritas 1: Cari interface dengan class 7 (Printer)
      for (const iface of interfaces) {
        const alternate = iface.alternate || iface.alternates?.[0];
        if (alternate && alternate.interfaceClass === 7) {
          const outEp = alternate.endpoints?.find((ep) => ep.direction === 'out');
          if (outEp) {
            foundInterfaceNumber = iface.interfaceNumber;
            foundEndpointNumber = outEp.endpointNumber;
            break;
          }
        }
      }

      // Prioritas 2: Jika tidak spesifik class 7 (banyak printer POS vendor-specific class 255),
      // cari interface manapun yang memiliki bulk endpoint arah 'out'
      if (foundInterfaceNumber === null || foundEndpointNumber === null) {
        for (const iface of interfaces) {
          const alternates = iface.alternates || (iface.alternate ? [iface.alternate] : []);
          for (const alternate of alternates) {
            const outEp = alternate.endpoints?.find(
              (ep) => ep.direction === 'out' && (ep.type === 'bulk' || ep.type === 'interrupt')
            );
            if (outEp) {
              foundInterfaceNumber = iface.interfaceNumber;
              foundEndpointNumber = outEp.endpointNumber;
              break;
            }
          }
          if (foundInterfaceNumber !== null) break;
        }
      }

      if (foundInterfaceNumber === null || foundEndpointNumber === null) {
        await device.close().catch(() => {});
        throw new Error(
          'Perangkat USB yang dipilih tidak memiliki jalur transfer data cetak (OUT endpoint).'
        );
      }

      // Claim interface
      await device.claimInterface(foundInterfaceNumber);

      this.device = device;
      this.interfaceNumber = foundInterfaceNumber;
      this.endpointNumber = foundEndpointNumber;
      this.notifyStatus();
      return true;
    } catch (err: unknown) {
      this.device = null;
      this.interfaceNumber = null;
      this.endpointNumber = null;
      this.notifyStatus();

      const errMsg = (err as Error)?.message || '';
      if (errMsg.includes('Access denied') || errMsg.includes('SecurityError')) {
        throw new Error(
          'Akses USB ditolak oleh sistem operasi. Jika menggunakan Windows, pastikan printer tidak sedang dikunci oleh driver eksklusif spooler.'
        );
      }
      throw err;
    }
  }

  public async disconnect(): Promise<void> {
    if (this.device) {
      try {
        if (this.interfaceNumber !== null) {
          await this.device.releaseInterface(this.interfaceNumber).catch(() => {});
        }
        if (this.device.opened) {
          await this.device.close().catch(() => {});
        }
      } catch {
        // Abaikan saat shutdown
      }
    }
    this.device = null;
    this.interfaceNumber = null;
    this.endpointNumber = null;
    this.notifyStatus();
  }

  /**
   * Mengirim byte mentah ESC/POS langsung ke printer USB
   */
  public async printRaw(data: Uint8Array): Promise<void> {
    if (!this.isConnected() || !this.device || this.endpointNumber === null) {
      throw new Error('Printer USB belum terhubung. Hubungkan perangkat printer terlebih dahulu.');
    }

    // Kirim data dalam ukuran buffer 1024 bytes
    const chunkSize = 1024;
    for (let offset = 0; offset < data.length; offset += chunkSize) {
      const chunk = data.slice(offset, offset + chunkSize);
      await this.device.transferOut(this.endpointNumber, chunk);
      // Jeda sangat singkat untuk printer kecepatan tinggi
      await new Promise((resolve) => setTimeout(resolve, 5));
    }
  }

  /**
   * Membuka laci kasir (Cash Drawer) via sinyal ESC/POS kick pulse
   */
  public async openCashDrawer(): Promise<void> {
    // Standard ESC p 0 25 250 (Pin 2) & ESC p 1 25 250 (Pin 5)
    const DRAWER_KICK = new Uint8Array([
      0x1b, 0x70, 0x00, 0x19, 0xfa,
      0x1b, 0x70, 0x01, 0x19, 0xfa,
    ]);
    await this.printRaw(DRAWER_KICK);
  }

  /**
   * Memotong kertas thermal (Auto-cut)
   */
  public async cutPaper(partial = true): Promise<void> {
    // Feed 3 baris lalu potong kertas
    const CUT_COMMAND = partial
      ? new Uint8Array([0x1b, 0x64, 0x03, 0x1d, 0x56, 0x42, 0x00]) // GS V 66 0 (Partial cut)
      : new Uint8Array([0x1b, 0x64, 0x03, 0x1d, 0x56, 0x41, 0x00]); // GS V 65 0 (Full cut)
    await this.printRaw(CUT_COMMAND);
  }

  /**
   * Membuat byte data ESC/POS untuk struk pesanan
   */
  private encodeReceipt(order: Order, options: WebUsbPrintOptions = {}): Uint8Array {
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
    const ESC_DRAWER_KICK = [0x1b, 0x70, 0x00, 0x19, 0xfa, 0x1b, 0x70, 0x01, 0x19, 0xfa];
    const ESC_CUT_PARTIAL = [0x1d, 0x56, 0x42, 0x00];

    // 1. Initialize Printer
    add(...ESC_INIT);

    // 2. Header: Nama Toko / Outlet (Double size, bold, center)
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

    // 3. Metadata Pesanan
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

    // 4. Daftar Item Pesanan
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
        addLine(`  * Catatan: ${item.notes}`);
      }
    }

    addLine(divider('-'));

    // 5. Total dan Rincian Tagihan
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

    // Informasi Pembayaran
    const payMethod = order.paymentMethod || 'CASH';
    const paidAmt = Number(order.paidAmount || order.totalAmount);
    addLine(leftRight(`Bayar (${payMethod})`, formatRp(paidAmt)));

    if (Number(order.changeAmount || 0) > 0) {
      add(...ESC_BOLD_ON);
      addLine(leftRight('Kembalian', formatRp(order.changeAmount)));
      add(...ESC_BOLD_OFF);
    }

    addLine(divider('-'));

    // 6. Catatan Kaki / Footer
    if (options.footerText && options.footerText.trim()) {
      add(...ESC_ALIGN_CENTER);
      const lines = options.footerText.split('\n');
      for (const line of lines) {
        if (line.trim()) {
          addLine(line.trim());
        }
      }
    }

    // 7. Buka Cash Drawer (jika aktif)
    if (options.openCashDrawer !== false) {
      add(...ESC_DRAWER_KICK);
    }

    // 8. Feed Kertas dan Potong (Auto-cut)
    add(...ESC_FEED_4);
    if (options.cutPaper !== false) {
      add(...ESC_CUT_PARTIAL);
    }

    return new Uint8Array(bytes);
  }

  /**
   * Mencetak struk pembayaran langsung ke printer USB
   */
  public async printReceipt(order: Order, options: WebUsbPrintOptions = {}): Promise<void> {
    if (!this.isConnected()) {
      throw new Error('Printer USB belum terhubung. Silakan hubungkan printer terlebih dahulu.');
    }
    const data = this.encodeReceipt(order, options);
    await this.printRaw(data);
  }

  /**
   * Menjalankan tes cetak hardware mandiri (Test Print)
   * Menguji teks tebal, perataan, pembukaan laci kasir, dan pemotong kertas otomatis.
   */
  public async testPrint(options: { paperWidth?: '58mm' | '80mm'; openCashDrawer?: boolean; cutPaper?: boolean } = {}): Promise<void> {
    if (!this.isConnected()) {
      throw new Error('Printer USB belum terhubung. Silakan hubungkan printer terlebih dahulu.');
    }

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
    const addLine = (text = '') => addText(text + '\n');
    const divider = (char = '-') => char.repeat(cols);

    // ESC/POS Commands
    const ESC_INIT = [0x1b, 0x40];
    const ESC_ALIGN_CENTER = [0x1b, 0x61, 0x01];
    const ESC_ALIGN_LEFT = [0x1b, 0x61, 0x00];
    const ESC_BOLD_ON = [0x1b, 0x45, 0x01];
    const ESC_BOLD_OFF = [0x1b, 0x45, 0x00];
    const ESC_DOUBLE_SIZE = [0x1d, 0x21, 0x11];
    const ESC_NORMAL_SIZE = [0x1d, 0x21, 0x00];
    const ESC_FEED_4 = [0x1b, 0x64, 0x04];
    const ESC_DRAWER_KICK = [0x1b, 0x70, 0x00, 0x19, 0xfa, 0x1b, 0x70, 0x01, 0x19, 0xfa];
    const ESC_CUT_PARTIAL = [0x1d, 0x56, 0x42, 0x00];

    // 1. Init
    add(...ESC_INIT);

    // 2. Header
    add(...ESC_ALIGN_CENTER);
    add(...ESC_BOLD_ON);
    add(...ESC_DOUBLE_SIZE);
    addLine('AGILIX POS');
    add(...ESC_NORMAL_SIZE);
    addLine('PENGUJIAN HARDWARE PRINTER');
    add(...ESC_BOLD_OFF);
    addLine(divider('='));

    // 3. Body
    add(...ESC_ALIGN_LEFT);
    const devName = this.getConnectedDeviceName() || 'Thermal Printer (USB)';
    addLine(`Perangkat : ${devName}`);
    addLine(`Koneksi   : WebUSB API (Direct Raw)`);
    addLine(`Ukuran    : ${paperWidth} (${cols} kolom)`);

    const now = new Date();
    const dateStr = now.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    const timeStr = now.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    addLine(`Waktu Tes : ${dateStr} ${timeStr}`);
    addLine(divider('-'));

    addLine('Hasil Uji Fitur Hardware:');
    add(...ESC_BOLD_ON);
    addLine('[OK] Stream Data ESC/POS Terkirim');
    addLine('[OK] Format Cetak Tebal & Rata');
    if (options.openCashDrawer !== false) {
      addLine('[OK] Perintah Buka Laci (Cash Drawer)');
    }
    if (options.cutPaper !== false) {
      addLine('[OK] Perintah Potong Kertas (Auto-Cut)');
    }
    add(...ESC_BOLD_OFF);
    addLine(divider('-'));

    add(...ESC_ALIGN_CENTER);
    addLine('Agilix POS Hardware System');
    addLine('Status: Siap Digunakan');

    // 4. Trigger Cash Drawer
    if (options.openCashDrawer !== false) {
      add(...ESC_DRAWER_KICK);
    }

    // 5. Feed and Auto-Cut
    add(...ESC_FEED_4);
    if (options.cutPaper !== false) {
      add(...ESC_CUT_PARTIAL);
    }

    const testData = new Uint8Array(bytes);
    await this.printRaw(testData);
  }
}

export const webusbPrinter = new WebUsbPrinterService();

