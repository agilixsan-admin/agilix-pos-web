import React, { useState, useEffect } from 'react';
import type { Order } from '@model/Order';
import { useAuthStore } from '@domain/state/auth-store';
import { usePrinterStore } from '@domain/state/printer-store';
import { posService } from '@domain/services/pos-service';
import {
  CheckCircle2,
  Printer,
  Plus,
  QrCode,
  Banknote,
  AlertTriangle,
  RotateCw,
  Eye,
  X,
  FileText,
  Bluetooth,
} from 'lucide-react';
import { Modal, Button, Badge, toast } from '@presentation/components/ui';

interface PaymentSuccessModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
  onNewOrder: () => void;
  onViewReceipt: () => void;
}

export const PaymentSuccessModal: React.FC<PaymentSuccessModalProps> = ({
  order,
  isOpen,
  onClose,
  onNewOrder,
  onViewReceipt,
}) => {
  const { tenant, currentOutlet, user } = useAuthStore();
  const {
    isConnected: isPrinterConnected,
    deviceName: printerName,
    isConnecting: isPrinterConnecting,
    autoPrintOnPayment,
    connect: connectPrinter,
    disconnect: disconnectPrinter,
    setAutoPrint,
    printReceipt,
  } = usePrinterStore();

  const [printStatus, setPrintStatus] = useState<'IDLE' | 'PRINTING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isPrintingBluetooth, setIsPrintingBluetooth] = useState(false);

  const rawPayments = (order as unknown as { payments?: Array<{ amount?: number; changeAmount?: number }> }).payments;
  const latestPayment = Array.isArray(rawPayments) && rawPayments.length > 0 ? rawPayments[rawPayments.length - 1] : undefined;

  const totalAmount = Number(order.totalAmount || 0);
  const paidAmount = Number(
    order.paidAmount !== undefined
      ? order.paidAmount
      : latestPayment?.amount !== undefined
      ? latestPayment.amount
      : totalAmount
  );
  const changeAmount = Number(
    order.changeAmount !== undefined
      ? order.changeAmount
      : latestPayment?.changeAmount !== undefined
      ? latestPayment.changeAmount
      : Math.max(0, paidAmount - totalAmount)
  );
  const isCash = order.paymentMethod === 'CASH' || !order.paymentMethod;

  const handleBluetoothPrint = async () => {
    setIsPrintingBluetooth(true);
    setErrorMessage('');
    try {
      await printReceipt(order, {
        name: tenant?.name || currentOutlet?.name,
        address: currentOutlet?.address,
        phone: currentOutlet?.phone,
      });
      setPrintStatus('SUCCESS');
      toast.success('Struk berhasil dicetak ke printer Bluetooth!');
    } catch (err: unknown) {
      const msg = (err as Error)?.message || 'Gagal mencetak ke printer Bluetooth.';
      setErrorMessage(msg);
      setPrintStatus('ERROR');
      toast.error(msg);
    } finally {
      setIsPrintingBluetooth(false);
    }
  };

  const handleConnectBluetooth = async () => {
    try {
      await connectPrinter();
      toast.success('Printer Bluetooth berhasil terhubung!');
    } catch (err: unknown) {
      const msg = (err as Error)?.message || 'Batal atau gagal menghubungkan printer Bluetooth.';
      toast.warning(msg);
    }
  };

  // Auto-print receipt if Bluetooth printer is connected and autoPrint option is enabled
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (isOpen && autoPrintOnPayment && isPrinterConnected) {
      timer = setTimeout(() => {
        handleBluetoothPrint();
      }, 400);
    }
    return () => clearTimeout(timer);
  }, [isOpen, autoPrintOnPayment, isPrinterConnected]);

  const handleTriggerPrint = async () => {
    if (isPrinterConnected) {
      await handleBluetoothPrint();
      return;
    }
    setPrintStatus('PRINTING');
    setErrorMessage('');
    try {
      // Try printing via backend hardware printer driver
      const res = await posService.printOrderBill(order.id);
      if (res?.success) {
        setPrintStatus('SUCCESS');
      } else {
        // Fallback to browser print if hardware printer is not configured or offline
        window.print();
        setPrintStatus('SUCCESS');
      }
    } catch (err: unknown) {
      const errMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Printer kasir tidak terhubung. Gunakan browser print atau hubungkan printer Bluetooth.';
      setErrorMessage(errMsg);
      setPrintStatus('ERROR');
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Pembayaran Berhasil"
      subtitle={`Order #${order.orderNumber || order.id.slice(0, 8)} • Transaksi Selesai`}
      maxWidth="2xl"
    >
      <div className="space-y-4">

        {/* PRINTING LOADING OVERLAY */}
        {printStatus === 'PRINTING' && (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-teal-50 border-2 border-[#0D5C53] flex items-center justify-center animate-pulse">
              <Printer className="w-8 h-8 text-[#0D5C53] animate-bounce" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Mencetak Struk Pembayaran...</h3>
              <p className="text-xs text-slate-500 mt-1">
                Mohon tunggu, struk transaksi untuk Order #{order.orderNumber || order.id.slice(0, 8)} sedang dikirim ke printer.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  window.print();
                  setPrintStatus('SUCCESS');
                }}
              >
                Gunakan Browser Print
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setPrintStatus('SUCCESS')}
              >
                Selesai
              </Button>
            </div>
          </div>
        )}

        {/* PRINT ERROR STATE */}
        {printStatus === 'ERROR' && (
          <div className="space-y-4">
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-bold text-sm text-rose-900">Gagal Mencetak Struk Thermal</h4>
                <p className="text-xs text-rose-700 mt-0.5 leading-relaxed">
                  {errorMessage || 'Printer thermal tidak merespons atau sedang offline. Anda dapat mencoba lagi atau menggunakan cetak browser biasa.'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button
                variant="outline"
                leftIcon={<Printer className="w-4 h-4" />}
                onClick={() => window.print()}
              >
                Cetak via Browser (Manual)
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setPrintStatus('IDLE')}
                >
                  Kembali
                </Button>
                <Button
                  variant="primary"
                  leftIcon={<RotateCw className="w-4 h-4" />}
                  onClick={handleTriggerPrint}
                >
                  Coba Lagi (Retry Print)
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* MAIN SUCCESS VIEW (CASH OR QRIS) */}
        {(printStatus === 'IDLE' || printStatus === 'SUCCESS') && (
          <div className="space-y-6">
            {/* Header Success Badge */}
            <div className="text-center pt-2">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2.5 shadow-xs">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900">Pembayaran Berhasil!</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Transaksi telah selesai dicatat dan stok inventaris otomatis diperbarui.
              </p>
            </div>

            {/* Split Content: Left Details & Right Receipt Preview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left Card: Transaction Details */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <span className="text-xs font-semibold text-slate-500">ID Transaksi</span>
                    <span className="text-xs font-mono font-bold text-slate-800">
                      TRX-{order.id.slice(0, 8).toUpperCase()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <span className="text-xs font-semibold text-slate-500">No. Order</span>
                    <span className="text-xs font-mono font-bold text-slate-800">
                      {order.orderNumber || order.id.slice(0, 8)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <span className="text-xs font-semibold text-slate-500">Tipe Pesanan</span>
                    <Badge variant={order.orderType === 'DINE_IN' ? 'success' : 'info'}>
                      {order.orderType === 'DINE_IN'
                        ? `Dine In (${order.tableName || order.tableNumber || order.table?.name || 'Meja'})`
                        : 'Take Away'}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <span className="text-xs font-semibold text-slate-500">Metode Bayar</span>
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      {isCash ? <Banknote className="w-4 h-4 text-emerald-600" /> : <QrCode className="w-4 h-4 text-teal-600" />}
                      {order.paymentMethod || 'CASH'}
                    </span>
                  </div>
                </div>

                {/* Calculation Box */}
                <div className="space-y-2 pt-2 border-t border-slate-200">
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Total Tagihan</span>
                    <span className="font-bold text-slate-900">
                      Rp {totalAmount.toLocaleString('id-ID')}
                    </span>
                  </div>

                  {isCash && (
                    <div className="flex justify-between text-xs text-slate-600">
                      <span>Uang Diterima</span>
                      <span className="font-semibold text-slate-800 font-mono">
                        Rp {paidAmount.toLocaleString('id-ID')}
                      </span>
                    </div>
                  )}

                  {isCash && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-900">Kembalian:</span>
                      <span className="text-base font-extrabold text-emerald-700 font-mono">
                        Rp {changeAmount.toLocaleString('id-ID')}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Card: Bill Preview */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col justify-between font-mono text-xs text-slate-800">
                <div className="space-y-2">
                  <div className="text-center pb-2 border-b border-dashed border-slate-200">
                    <h5 className="font-bold text-sm tracking-wider uppercase">
                      {tenant?.businessName || tenant?.name || 'AGILIX POS'}
                    </h5>
                    <p className="text-[10px] text-slate-500">{currentOutlet?.name || 'Outlet Utama'}</p>
                    <p className="text-[9px] text-slate-400">
                      {new Date(order.createdAt || Date.now()).toLocaleString('id-ID')}
                    </p>
                  </div>

                  {/* Items preview */}
                  <div className="py-2 space-y-1 max-h-32 overflow-y-auto pr-1 text-[11px]">
                    {order.items?.map((item, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span className="truncate pr-1">
                          {item.quantity}x {item.productName}
                        </span>
                        <span>
                          Rp {Number(item.subtotal ?? (Number(item.unitPrice || item.price || 0) * item.quantity)).toLocaleString('id-ID')}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Summary */}
                  <div className="pt-2 border-t border-dashed border-slate-200 space-y-1 text-[11px]">
                    <div className="flex justify-between text-slate-500">
                      <span>Subtotal</span>
                      <span>Rp {Number(order.subtotal || totalAmount).toLocaleString('id-ID')}</span>
                    </div>
                    {Number(order.discountAmount || 0) > 0 && (
                      <div className="flex justify-between text-emerald-600">
                        <span>Diskon</span>
                        <span>-Rp {Number(order.discountAmount).toLocaleString('id-ID')}</span>
                      </div>
                    )}
                    {Number(order.packagingFee || 0) > 0 && (
                      <div className="flex justify-between text-slate-500">
                        <span>Biaya Kemasan</span>
                        <span>Rp {Number(order.packagingFee).toLocaleString('id-ID')}</span>
                      </div>
                    )}
                    {Number(order.serviceCharge || 0) > 0 && (
                      <div className="flex justify-between text-slate-500">
                        <span>Service Charge</span>
                        <span>Rp {Number(order.serviceCharge).toLocaleString('id-ID')}</span>
                      </div>
                    )}
                    {Number(order.taxAmount || 0) > 0 && (
                      <div className="flex justify-between text-slate-500">
                        <span>{order.taxName || 'Pajak'}</span>
                        <span>Rp {Number(order.taxAmount).toLocaleString('id-ID')}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-xs pt-1 border-t border-slate-200">
                      <span>TOTAL</span>
                      <span className="text-[#0D5C53]">
                        Rp {totalAmount.toLocaleString('id-ID')}
                      </span>
                    </div>
                    {isCash && (
                      <>
                        <div className="flex justify-between text-slate-500 pt-1 text-[11px]">
                          <span>Tunai</span>
                          <span>Rp {paidAmount.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex justify-between text-emerald-700 font-semibold text-[11px]">
                          <span>Kembalian</span>
                          <span>Rp {changeAmount.toLocaleString('id-ID')}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="text-center text-[10px] text-slate-400 pt-3">
                  Terima kasih atas kunjungan Anda!
                </div>
              </div>
            </div>

            {/* Bluetooth Thermal Printer Bar */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    isPrinterConnected
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  <Bluetooth className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-800 truncate">
                      {isPrinterConnected ? printerName || 'Printer Bluetooth' : 'Printer Bluetooth'}
                    </span>
                    <span
                      className={`inline-block w-2 h-2 rounded-full ${
                        isPrinterConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'
                      }`}
                    />
                    <span
                      className={`text-[10px] font-semibold uppercase ${
                        isPrinterConnected ? 'text-emerald-700' : 'text-slate-400'
                      }`}
                    >
                      {isPrinterConnected ? 'Terhubung' : 'Tidak Terhubung'}
                    </span>
                  </div>
                  <label className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoPrintOnPayment}
                      onChange={(e) => setAutoPrint(e.target.checked)}
                      className="rounded border-slate-300 text-[#0D5C53] focus:ring-[#0D5C53]/20 cursor-pointer"
                    />
                    <span>Cetak otomatis saat pembayaran sukses</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {isPrinterConnected ? (
                  <button
                    type="button"
                    onClick={disconnectPrinter}
                    className="text-xs text-rose-600 hover:text-rose-700 font-semibold px-2 py-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    Putus
                  </button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Bluetooth className="w-3.5 h-3.5 text-[#0D5C53]" />}
                    onClick={handleConnectBluetooth}
                    isLoading={isPrinterConnecting}
                    className="text-xs font-bold"
                  >
                    Hubungkan Printer
                  </Button>
                )}
              </div>
            </div>

            {/* Bottom Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                leftIcon={<Eye className="w-4 h-4" />}
                onClick={onViewReceipt}
              >
                Lihat Struk Lengkap
              </Button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                {isPrinterConnected ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.print()}
                      className="text-xs"
                    >
                      PDF / Browser
                    </Button>
                    <Button
                      variant="primary"
                      leftIcon={<Printer className="w-4 h-4" />}
                      onClick={handleBluetoothPrint}
                      isLoading={isPrintingBluetooth}
                      className="font-bold shadow-md shadow-teal-900/10"
                    >
                      Cetak Struk (Bluetooth)
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    leftIcon={<Printer className="w-4 h-4" />}
                    onClick={handleTriggerPrint}
                  >
                    Cetak Struk (Print)
                  </Button>
                )}

                <Button
                  variant="primary"
                  leftIcon={<Plus className="w-4 h-4" />}
                  onClick={onNewOrder}
                  className={`font-bold shadow-md shadow-teal-900/10 ${isPrinterConnected ? 'bg-slate-800 hover:bg-slate-900 text-white' : ''}`}
                >
                  + Pesanan Baru
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

