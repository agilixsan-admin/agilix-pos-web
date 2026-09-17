import React, { useState } from 'react';
import type { Order } from '@model/Order';
import { Printer, CheckCircle2, Bluetooth } from 'lucide-react';
import { useAuthStore } from '@domain/state/auth-store';
import { usePrinterStore } from '@domain/state/printer-store';
import { Button, Modal, Badge, toast } from '@presentation/components/ui';

interface ReceiptModalProps {
  order: Order;
  isOpen?: boolean;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  order,
  isOpen = true,
  onClose,
}) => {
  const { tenant, currentOutlet } = useAuthStore();
  const {
    isConnected: isPrinterConnected,
    deviceName: printerName,
    isConnecting: isPrinterConnecting,
    connect: connectPrinter,
    printReceipt,
  } = usePrinterStore();

  const [isPrinting, setIsPrinting] = useState(false);

  if (!isOpen) return null;

  const handleBrowserPrint = () => {
    window.print();
  };

  const handleBluetoothPrint = async () => {
    setIsPrinting(true);
    try {
      await printReceipt(order, {
        name: tenant?.name || currentOutlet?.name,
        address: currentOutlet?.address,
        phone: currentOutlet?.phone,
      });
      toast.success('Struk berhasil dicetak ke printer Bluetooth!');
    } catch (err: unknown) {
      toast.error((err as Error)?.message || 'Gagal mencetak ke printer Bluetooth.');
    } finally {
      setIsPrinting(false);
    }
  };

  const handleConnectBluetooth = async () => {
    try {
      await connectPrinter();
      toast.success('Printer Bluetooth berhasil terhubung!');
    } catch (err: unknown) {
      toast.warning((err as Error)?.message || 'Batal atau gagal menghubungkan printer Bluetooth.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Transaksi Berhasil"
      subtitle="Struk Pembayaran Siap Dicetak"
      maxWidth="sm"
      footer={
        <div className="w-full flex items-center justify-between gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Tutup
          </Button>
          <div className="flex items-center gap-2">
            {isPrinterConnected ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBrowserPrint}
                  className="text-xs"
                >
                  Browser / PDF
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Printer className="w-4 h-4" />}
                  onClick={handleBluetoothPrint}
                  isLoading={isPrinting}
                  className="font-bold shadow-md shadow-teal-900/10"
                >
                  Cetak (Bluetooth)
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Bluetooth className="w-3.5 h-3.5 text-[#0D5C53]" />}
                  onClick={handleConnectBluetooth}
                  isLoading={isPrinterConnecting}
                  className="text-xs font-semibold"
                >
                  Hubungkan Bluetooth
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Printer className="w-4 h-4" />}
                  onClick={handleBrowserPrint}
                >
                  Cetak Struk
                </Button>
              </>
            )}
          </div>
        </div>
      }
    >
      {/* Printable Thermal Receipt Area */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-center">
        <div
          id="printable-receipt"
          className="w-full bg-white p-5 shadow-xs border border-slate-200 text-slate-900 font-mono text-xs leading-relaxed"
        >
          {/* Header */}
          <div className="text-center pb-3 border-b border-dashed border-slate-300">
            <h3 className="font-bold text-sm tracking-wider uppercase">
              {tenant?.name || 'AGILIX POS'}
            </h3>
            <p className="text-[11px] text-slate-600">{currentOutlet?.name || 'Outlet Utama'}</p>
            {currentOutlet?.phone && (
              <p className="text-[10px] text-slate-500">Telp: {currentOutlet.phone}</p>
            )}
          </div>

          {/* Order Info */}
          <div className="py-2.5 border-b border-dashed border-slate-300 text-[11px] space-y-0.5">
            <div className="flex justify-between">
              <span>No. Order:</span>
              <span className="font-semibold">
                {order.orderNumber || order.id.slice(0, 8)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Waktu:</span>
              <span>
                {new Date(order.createdAt || Date.now()).toLocaleDateString('id-ID', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Tipe:</span>
              <span className="font-semibold">
                {order.orderType === 'DINE_IN'
                  ? `Dine-In (${order.tableName || order.tableNumber || order.table?.name || 'Meja'})`
                  : 'Take Away'}
              </span>
            </div>
            {order.customerName && (
              <div className="flex justify-between">
                <span>Pelanggan:</span>
                <span>{order.customerName}</span>
              </div>
            )}
          </div>

          {/* Items List */}
          <div className="py-3 border-b border-dashed border-slate-300 space-y-2">
            {order.items?.map((item, idx) => {
              const isDefaultVariant =
                !item.variantName ||
                item.variantName.trim().toLowerCase() === 'default' ||
                item.variantName.trim().toLowerCase() === item.productName?.trim().toLowerCase();

              return (
                <div key={idx} className="space-y-0.5">
                  <div className="flex justify-between font-semibold">
                    <span className="truncate pr-2">
                      {item.productName} {!isDefaultVariant ? `(${item.variantName})` : ''}
                    </span>
                    <span>
                      Rp {Number(item.subtotal ?? (Number(item.unitPrice || item.price || 0) * item.quantity)).toLocaleString('id-ID')}
                    </span>
                  </div>
                <div className="text-[10px] text-slate-500 flex justify-between">
                  <span>
                    {item.quantity} x Rp {Number(item.unitPrice || item.price || (item.subtotal ? item.subtotal / item.quantity : 0)).toLocaleString('id-ID')}
                  </span>
                  {item.notes && (
                    <span className="italic text-slate-400 max-w-[120px] truncate">
                      ({item.notes})
                    </span>
                  )}
                </div>
              </div>
            );
          })}
          </div>

          {/* Calculation Totals */}
          <div className="py-2.5 border-b border-dashed border-slate-300 text-[11px] space-y-1">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>Rp {Number(order.subtotal || 0).toLocaleString('id-ID')}</span>
            </div>
            {Number(order.discountAmount || 0) > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Diskon</span>
                <span>-Rp {Number(order.discountAmount).toLocaleString('id-ID')}</span>
              </div>
            )}
            {Number(order.taxAmount || 0) > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Pajak (PB1/PPN)</span>
                <span>Rp {Number(order.taxAmount).toLocaleString('id-ID')}</span>
              </div>
            )}
            {Number(order.serviceCharge || 0) > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Service Charge</span>
                <span>Rp {Number(order.serviceCharge).toLocaleString('id-ID')}</span>
              </div>
            )}
          </div>

          {/* Grand Total */}
          <div className="py-3 border-b border-dashed border-slate-300 space-y-1">
            <div className="flex justify-between text-sm font-bold">
              <span>TOTAL</span>
              <span>Rp {Number(order.totalAmount).toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-600">
              <span>Metode: {order.paymentMethod || 'CASH'}</span>
              <span>
                Bayar: Rp{' '}
                {Number(order.paidAmount || order.totalAmount).toLocaleString('id-ID')}
              </span>
            </div>
            {Number(order.changeAmount || 0) > 0 && (
              <div className="flex justify-between text-[11px] text-emerald-600 font-semibold">
                <span>Kembalian</span>
                <span>Rp {Number(order.changeAmount).toLocaleString('id-ID')}</span>
              </div>
            )}
          </div>

          {/* Footer Receipt Note */}
          <div className="text-center pt-3 text-[10px] text-slate-500 space-y-0.5">
            <p>Terima kasih atas kunjungan Anda!</p>
            <p className="text-[9px] text-slate-400">Powered by Agilix POS</p>
          </div>
        </div>
      </div>
    </Modal>
  );
};
