import React from 'react';
import type { Order } from '@model/Order';
import { Printer, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '@domain/state/auth-store';
import { Button, Modal, Badge } from '@presentation/components/ui';

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

  if (!isOpen) return null;

  const handleBrowserPrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Transaksi Berhasil"
      subtitle="Struk Pembayaran Siap Dicetak"
      maxWidth="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Selesai / Tutup
          </Button>
          <Button
            variant="primary"
            leftIcon={<Printer className="w-4 h-4" />}
            onClick={handleBrowserPrint}
          >
            Cetak Struk
          </Button>
        </>
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
                  ? `Dine-In (${order.tableName || 'Meja'})`
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
            {order.items?.map((item, idx) => (
              <div key={idx} className="space-y-0.5">
                <div className="flex justify-between font-semibold">
                  <span className="truncate pr-2">
                    {item.productName} {item.variantName ? `(${item.variantName})` : ''}
                  </span>
                  <span>
                    Rp {(Number(item.price) * item.quantity).toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 flex justify-between">
                  <span>
                    {item.quantity} x Rp {Number(item.price).toLocaleString('id-ID')}
                  </span>
                  {item.notes && (
                    <span className="italic text-slate-400 max-w-[120px] truncate">
                      ({item.notes})
                    </span>
                  )}
                </div>
              </div>
            ))}
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
