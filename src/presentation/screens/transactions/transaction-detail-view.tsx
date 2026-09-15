import React, { useState } from 'react';
import type { Order } from '@model/Order';
import { useAuthStore } from '@domain/state/auth-store';
import { posService } from '@domain/services/pos-service';
import { PrintErrorModal } from './print-error-modal';
import { ReceiptModal } from '../pos/receipt-modal';
import {
  ArrowLeft,
  Printer,
  Calendar,
  Utensils,
  ShoppingBag,
  User,
  Coffee,
  CheckCircle2,
  Banknote,
  QrCode,
  Tag,
  Receipt,
  FileText,
} from 'lucide-react';
import { Button, Badge, Card } from '@presentation/components/ui';

interface TransactionDetailViewProps {
  order: Order;
  onBack: () => void;
}

export const TransactionDetailView: React.FC<TransactionDetailViewProps> = ({
  order,
  onBack,
}) => {
  const { tenant, currentOutlet } = useAuthStore();
  const [printLoading, setPrintLoading] = useState<boolean>(false);
  const [isPrintErrorOpen, setIsPrintErrorOpen] = useState<boolean>(false);
  const [printErrorMessage, setPrintErrorMessage] = useState<string>('');
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState<boolean>(false);

  const totalAmount = Number(order.totalAmount || 0);
  const subtotal = Number(order.subtotal || totalAmount);
  const discountAmount = Number(order.discountAmount || 0);
  const taxAmount = Number(order.taxAmount || 0);
  const serviceCharge = Number(order.serviceCharge || 0);

  const primaryPayment = order.payments?.[0];
  const paymentMethod = primaryPayment?.paymentMethod || order.paymentMethod || 'CASH';
  const cashGiven = primaryPayment?.cashGiven || order.paidAmount || totalAmount;
  const changeAmount = primaryPayment?.changeAmount || order.changeAmount || Math.max(0, cashGiven - totalAmount);

  const handlePrint = async () => {
    setPrintLoading(true);
    setPrintErrorMessage('');
    try {
      const res = await posService.printOrderBill(order.id, { isDuplicate: true });
      if (res?.success) {
        setIsReceiptModalOpen(true);
      } else {
        window.print();
      }
    } catch (err: unknown) {
      const errMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Koneksi printer thermal tidak merespons. Silakan coba lagi atau gunakan cetak browser.';
      setPrintErrorMessage(errMsg);
      setIsPrintErrorOpen(true);
    } finally {
      setPrintLoading(false);
    }
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            onClick={onBack}
          >
            Kembali
          </Button>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">Detail Transaksi</h2>
              <Badge variant={order.status === 'COMPLETED' ? 'success' : order.status === 'PENDING' ? 'warning' : 'danger'}>
                {order.status === 'COMPLETED' ? 'Selesai' : order.status === 'PENDING' ? 'Berjalan' : 'Dibatalkan'}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-mono">
              {order.transaction?.transactionNumber || `TRX-${order.id.slice(0, 8).toUpperCase()}`} • Order #{order.orderNumber || order.id.slice(0, 8)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="md"
            isLoading={printLoading}
            leftIcon={<Printer className="w-4 h-4" />}
            onClick={handlePrint}
            className="font-bold shadow-md shadow-teal-900/10"
          >
            Cetak Ulang Struk
          </Button>
        </div>
      </div>

      {/* Top Info Metric Grid: Transaction Info */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block mb-1 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            Waktu Transaksi
          </span>
          <span className="text-xs font-bold text-slate-800 font-mono">
            {new Date(order.createdAt).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>

        <div>
          <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block mb-1 flex items-center gap-1">
            {order.orderType === 'DINE_IN' ? <Utensils className="w-3.5 h-3.5" /> : <ShoppingBag className="w-3.5 h-3.5" />}
            Tipe Layanan
          </span>
          <Badge variant={order.orderType === 'DINE_IN' ? 'success' : 'info'} size="sm">
            {order.orderType === 'DINE_IN' ? 'Dine In' : 'Take Away'}
          </Badge>
        </div>

        <div>
          <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block mb-1">
            Nomor Meja
          </span>
          <span className="text-xs font-bold text-slate-800">
            {order.tableName || order.tableNumber ? `Meja ${order.tableName || order.tableNumber}` : '-'}
          </span>
        </div>

        <div>
          <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block mb-1 flex items-center gap-1">
            <User className="w-3.5 h-3.5 text-slate-400" />
            Kasir / Staff
          </span>
          <span className="text-xs font-bold text-slate-800">
            {order.creator?.name || order.cashierName || 'Staff POS'}
          </span>
        </div>

        <div>
          <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block mb-1">
            Pelanggan
          </span>
          <span className="text-xs font-bold text-slate-800">
            {order.customerName || 'Tamu / Umum'}
          </span>
        </div>
      </div>

      {/* Main Split Grid: Left Order Items & Right Financial Summary + Thermal Bill Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Order Items (7 Cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Coffee className="w-4 h-4 text-[#0D5C53]" />
                Daftar Menu Pesanan ({order.items?.length || 0} Item)
              </h3>
            </div>

            {/* Item Rows */}
            <div className="divide-y divide-slate-100 mt-2">
              {order.items?.map((item) => (
                <div key={item.id} className="py-3.5 first:pt-2 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 shrink-0 mt-0.5 border border-slate-200/60">
                      <Coffee className="w-5 h-5 text-slate-500" />
                    </div>

                    <div>
                      <h4 className="font-bold text-xs text-slate-900 leading-snug">
                        {item.productName}
                      </h4>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        {item.variantName && (
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-semibold">
                            Varian: {item.variantName}
                          </span>
                        )}
                        {item.notes && (
                          <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-md">
                            Catatan: {item.notes}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 block mt-1">
                        {item.quantity} x Rp {Number(item.price || item.unitPrice || 0).toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-bold text-slate-900 text-xs font-mono">
                      Rp {(Number(item.price || item.unitPrice || 0) * item.quantity).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {order.notes && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
              <span className="font-bold text-slate-700 block mb-0.5">Catatan Pesanan Keseluruhan:</span>
              <p>{order.notes}</p>
            </div>
          )}
        </div>

        {/* Right Column: Financial Summary & Thermal Receipt Preview (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Summary Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 pb-3 border-b border-slate-100">
              <Receipt className="w-4 h-4 text-slate-500" />
              Rincian Pembayaran
            </h3>

            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal Pesanan</span>
                <span className="font-semibold text-slate-900 font-mono">
                  Rp {subtotal.toLocaleString('id-ID')}
                </span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span className="flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5" />
                    Potongan Diskon
                  </span>
                  <span className="font-bold font-mono">
                    -Rp {discountAmount.toLocaleString('id-ID')}
                  </span>
                </div>
              )}

              {taxAmount > 0 && (
                <div className="flex justify-between">
                  <span>Pajak Resto (PB1 10%)</span>
                  <span className="font-semibold text-slate-900 font-mono">
                    Rp {taxAmount.toLocaleString('id-ID')}
                  </span>
                </div>
              )}

              {serviceCharge > 0 && (
                <div className="flex justify-between">
                  <span>Service Charge</span>
                  <span className="font-semibold text-slate-900 font-mono">
                    Rp {serviceCharge.toLocaleString('id-ID')}
                  </span>
                </div>
              )}

              <div className="flex justify-between font-extrabold text-sm text-slate-900 pt-2 border-t border-slate-200">
                <span>TOTAL AKHIR</span>
                <span className="text-[#0D5C53] text-base font-mono">
                  Rp {totalAmount.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* Payment Mode Box */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                  {paymentMethod === 'CASH' ? (
                    <Banknote className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <QrCode className="w-4 h-4 text-teal-600" />
                  )}
                  Metode Bayar: {paymentMethod}
                </span>
                <Badge variant="success" size="sm">
                  Lunas
                </Badge>
              </div>

              {paymentMethod === 'CASH' ? (
                <div className="flex justify-between text-slate-500 pt-1 border-t border-slate-200">
                  <span>Uang Diterima: Rp {cashGiven.toLocaleString('id-ID')}</span>
                  <span className="font-bold text-emerald-700">
                    Kembalian: Rp {changeAmount.toLocaleString('id-ID')}
                  </span>
                </div>
              ) : (
                <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200 font-mono">
                  Ref ID: {primaryPayment?.referenceNo || `QRIS-${order.id.slice(0, 8)}`}
                </div>
              )}
            </div>
          </div>

          {/* Thermal Bill Preview Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-xs">
            <div className="text-xs font-bold text-slate-700 mb-2.5 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-slate-400" />
              Pratinjau Struk Kasir (Thermal 58/80mm)
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 font-mono text-[11px] text-slate-800 space-y-2 shadow-xs">
              <div className="text-center pb-2 border-b border-dashed border-slate-300">
                <h4 className="font-bold text-xs uppercase tracking-wider">
                  {tenant?.name || 'AGILIX POS'}
                </h4>
                <p className="text-[10px] text-slate-500">{currentOutlet?.name || 'Outlet Utama'}</p>
                <p className="text-[9px] text-slate-400">
                  {new Date(order.createdAt).toLocaleString('id-ID')}
                </p>
              </div>

              <div className="space-y-1 py-1 border-b border-dashed border-slate-300">
                {order.items?.map((i, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span className="truncate pr-1">
                      {i.quantity}x {i.productName}
                    </span>
                    <span>Rp {(Number(i.price || i.unitPrice || 0) * i.quantity).toLocaleString('id-ID')}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-0.5 pt-1 text-[10px]">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal</span>
                  <span>Rp {subtotal.toLocaleString('id-ID')}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Diskon</span>
                    <span>-Rp {discountAmount.toLocaleString('id-ID')}</span>
                  </div>
                )}
                {taxAmount > 0 && (
                  <div className="flex justify-between text-slate-500">
                    <span>Pajak (PB1)</span>
                    <span>Rp {taxAmount.toLocaleString('id-ID')}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-xs pt-1 border-t border-slate-200">
                  <span>TOTAL</span>
                  <span>Rp {totalAmount.toLocaleString('id-ID')}</span>
                </div>
              </div>

              <div className="text-center pt-2 text-[9px] text-slate-400">
                *** TERIMA KASIH ***
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print Error Recovery Modal */}
      <PrintErrorModal
        isOpen={isPrintErrorOpen}
        onClose={() => setIsPrintErrorOpen(false)}
        errorMessage={printErrorMessage}
        onRetry={handlePrint}
        onBrowserPrintFallback={() => {
          setIsPrintErrorOpen(false);
          window.print();
        }}
      />

      {/* Receipt Modal */}
      {isReceiptModalOpen && (
        <ReceiptModal
          order={order}
          isOpen={isReceiptModalOpen}
          onClose={() => setIsReceiptModalOpen(false)}
        />
      )}
    </div>
  );
};

