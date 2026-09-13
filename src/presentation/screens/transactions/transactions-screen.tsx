import React, { useEffect, useState } from 'react';
import type { Order } from '@model/Order';
import { posService } from '@domain/services/pos-service';
import { useAuthStore } from '@domain/state/auth-store';
import { ReceiptModal } from '../pos/receipt-modal';
import {
  History,
  Search,
  Printer,
  Calendar,
  Loader2,
  Eye,
  CheckCircle2,
  Clock,
  Ban,
  X,
} from 'lucide-react';

export const TransactionsScreen: React.FC = () => {
  const currentOutlet = useAuthStore((state) => state.currentOutlet);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const data = await posService.getOrderHistory({ outletId: currentOutlet?.id });
      setOrders(data.items);
    } catch (err: unknown) {
      console.error('Failed to fetch transaction history', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [currentOutlet?.id]);

  const filteredOrders = orders.filter((order) => {
    const q = searchQuery.toLowerCase();
    return (
      order.orderNumber?.toLowerCase().includes(q) ||
      order.customerName?.toLowerCase().includes(q) ||
      order.tableName?.toLowerCase().includes(q) ||
      order.id.toLowerCase().includes(q)
    );
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs px-2.5 py-0.5 rounded-full font-semibold">
            <CheckCircle2 className="w-3 h-3" /> Selesai
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 text-xs px-2.5 py-0.5 rounded-full font-semibold">
            <Clock className="w-3 h-3" /> Berjalan
          </span>
        );
      case 'VOID':
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 border border-red-200 text-xs px-2.5 py-0.5 rounded-full font-semibold">
            <Ban className="w-3 h-3" /> Dibatalkan
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 text-xs px-2.5 py-0.5 rounded-full font-semibold">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Riwayat Transaksi</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar seluruh transaksi dan invoice pesanan pada outlet {currentOutlet?.name || 'Utama'}.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari no. order, tamu, meja..."
              className="bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53] w-64"
            />
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">No. Order</th>
                <th className="py-3.5 px-4">Waktu</th>
                <th className="py-3.5 px-4">Tipe / Meja</th>
                <th className="py-3.5 px-4">Pelanggan</th>
                <th className="py-3.5 px-4">Metode Bayar</th>
                <th className="py-3.5 px-4">Total</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#0D5C53]" />
                    <span>Memuat riwayat transaksi...</span>
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <History className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="font-semibold text-slate-600">Belum ada transaksi</p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {order.orderNumber || order.id.slice(0, 8)}
                    </td>
                    <td className="py-3.5 px-4">
                      {new Date(order.createdAt).toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3.5 px-4">
                      {order.orderType === 'DINE_IN' ? (
                        <span className="font-semibold text-slate-700">Dine-In ({order.tableName || 'Meja'})</span>
                      ) : (
                        <span className="text-slate-600">Take Away</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">{order.customerName || 'Tamu'}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">{order.paymentMethod || '-'}</td>
                    <td className="py-3.5 px-4 font-bold text-[#0D5C53]">
                      Rp {Number(order.totalAmount || 0).toLocaleString('id-ID')}
                    </td>
                    <td className="py-3.5 px-4">{getStatusBadge(order.status)}</td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          title="Lihat Detail"
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setReceiptOrder(order)}
                          title="Cetak Struk"
                          className="p-1.5 text-slate-400 hover:text-[#0D5C53] hover:bg-[#E6F4F1] rounded-lg transition-colors cursor-pointer"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Detail Order #{selectedOrder.orderNumber || selectedOrder.id.slice(0, 8)}
                </h3>
                <p className="text-xs text-slate-500">
                  {new Date(selectedOrder.createdAt).toLocaleString('id-ID')}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 flex-1 overflow-y-auto space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Tipe Pesanan</span>
                  <p className="font-semibold text-slate-800">{selectedOrder.orderType}</p>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Pelanggan</span>
                  <p className="font-semibold text-slate-800">{selectedOrder.customerName || 'Tamu'}</p>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-slate-500 font-bold uppercase text-[10px]">Item Pesanan</span>
                {selectedOrder.items?.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2 rounded-lg border border-slate-100">
                    <div>
                      <p className="font-semibold text-slate-800">
                        {item.quantity}x {item.productName}
                      </p>
                      {item.notes && <p className="text-[10px] text-amber-600 italic">{item.notes}</p>}
                    </div>
                    <span className="font-bold text-slate-800">
                      Rp {(Number(item.price) * item.quantity).toLocaleString('id-ID')}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-1 text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>Rp {Number(selectedOrder.subtotal || 0).toLocaleString('id-ID')}</span>
                </div>
                {Number(selectedOrder.discountAmount || 0) > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Diskon</span>
                    <span>-Rp {Number(selectedOrder.discountAmount).toLocaleString('id-ID')}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Pajak Resto (PB1)</span>
                  <span>Rp {Number(selectedOrder.taxAmount || 0).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 text-sm pt-1 border-t border-slate-200">
                  <span>Total Tagihan</span>
                  <span className="text-[#0D5C53]">
                    Rp {Number(selectedOrder.totalAmount || 0).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex gap-2">
              <button
                onClick={() => {
                  setReceiptOrder(selectedOrder);
                  setSelectedOrder(null);
                }}
                className="flex-1 py-2.5 bg-[#0D5C53] hover:bg-[#094740] text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Struk</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {receiptOrder && (
        <ReceiptModal
          order={receiptOrder}
          isOpen={!!receiptOrder}
          onClose={() => setReceiptOrder(null)}
        />
      )}
    </div>
  );
};

