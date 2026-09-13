import React from 'react';
import type { Order } from '@model/Order';
import { Printer, X, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '@domain/state/auth-store';

interface ReceiptModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ order, isOpen, onClose }) => {
  const { tenant, currentOutlet } = useAuthStore();

  if (!isOpen) return null;

  const handleBrowserPrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#0D5C53]">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span className="font-bold text-slate-800 text-sm">Transaksi Berhasil</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Thermal Receipt Area */}
        <div className="p-6 overflow-y-auto bg-slate-50 flex justify-center">
          <div
            id="printable-receipt"
            className="w-72 bg-white p-5 shadow-xs border border-slate-200 text-slate-900 font-mono text-xs leading-relaxed"
          >
            {/* Header */}
            <div className="text-center pb-3 border-b border-dashed border-slate-300">
              <h3 className="font-bold text-sm tracking-wider uppercase">{tenant?.name || 'AGILIX POS'}</h3>
              <p className="text-[11px] text-slate-600">{currentOutlet?.name || 'Outlet Utama'}</p>
              {currentOutlet?.phone && <p className="text-[10px] text-slate-500">Telp: {currentOutlet.phone}</p>}
            </div>

            {/* Order Info */}
            <div className="py-2.5 border-b border-dashed border-slate-300 text-[11px] space-y-0.5">
              <div className="flex justify-between">
                <span>No. Order:</span>
                <span className="font-semibold">{order.orderNumber || order.id.slice(0, 8)}</span>
              </div>
              <div className="flex justify-between">
                <span>Waktu:</span>
                <span>{new Date(order.createdAt || Date.now()).toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className="flex justify-between">
                <span>Tipe:</span>
                <span className="font-semibold">{order.orderType === 'DINE_IN' ? `Dine-In (${order.tableName || 'Meja'})` : 'Take Away'}</span>
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
                    <span className="truncate pr-2">{item.productName || (item as unknown as { name?: string }).name} {item.variantName ? `(${item.variantName})` : ''}</span>
                    <span>Rp {(Number(item.price) * item.quantity).toLocaleString('id-ID')}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 flex justify-between">
                    <span>{item.quantity} x Rp {Number(item.price).toLocaleString('id-ID')}</span>
                    {item.notes && <span className="italic text-slate-400 max-w-[120px] truncate">({item.notes})</span>}
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
              {Number(order.serviceCharge || 0) > 0 && (
                <div className="flex justify-between">
                  <span>Service</span>
                  <span>Rp {Number(order.serviceCharge).toLocaleString('id-ID')}</span>
                </div>
              )}
              {Number(order.taxAmount || 0) > 0 && (
                <div className="flex justify-between">
                  <span>Pajak (PB1)</span>
                  <span>Rp {Number(order.taxAmount).toLocaleString('id-ID')}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-xs pt-1 border-t border-slate-200">
                <span>TOTAL</span>
                <span>Rp {Number(order.totalAmount || 0).toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between pt-1">
                <span>Bayar ({order.paymentMethod || 'CASH'})</span>
                <span>Rp {Number(order.paidAmount || order.totalAmount || 0).toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Kembalian</span>
                <span>Rp {Number(order.changeAmount || 0).toLocaleString('id-ID')}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-4 text-center text-[10px] text-slate-500 space-y-0.5">
              <p className="font-semibold">Terima Kasih Atas Kunjungan Anda!</p>
              <p>Simpan struk ini sebagai bukti pembayaran.</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-white border-t border-slate-100 flex gap-2">
          <button
            onClick={handleBrowserPrint}
            className="flex-1 bg-[#0D5C53] hover:bg-[#094740] text-white py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-xs cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Struk</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};

