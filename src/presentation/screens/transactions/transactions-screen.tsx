import React, { useState } from 'react';
import type { Order } from '@model/Order';
import { useAuthStore } from '@domain/state/auth-store';
import { useOrderHistory, useDebounce } from '@domain/hooks';
import { ReceiptModal } from '../pos/receipt-modal';
import {
  History,
  Printer,
  Eye,
  CheckCircle2,
  Clock,
  Ban,
} from 'lucide-react';
import {
  Button,
  Badge,
  Card,
  SearchInput,
  Modal,
  LoadingState,
  EmptyState,
} from '@presentation/components/ui';

export const TransactionsScreen: React.FC = () => {
  const currentOutlet = useAuthStore((state) => state.currentOutlet);
  const { data, isLoading: loading } = useOrderHistory({ outletId: currentOutlet?.id });
  const orders = data?.items || [];

  const [searchQuery, setSearchQuery] = useState<string>('');
  const debouncedSearch = useDebounce(searchQuery, 200);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);

  const filteredOrders = orders.filter((order) => {
    const q = debouncedSearch.toLowerCase();
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
          <Badge variant="success" dot>
            Selesai
          </Badge>
        );
      case 'PENDING':
        return (
          <Badge variant="warning" dot>
            Berjalan
          </Badge>
        );
      case 'VOID':
      case 'CANCELLED':
        return (
          <Badge variant="danger" dot>
            Dibatalkan
          </Badge>
        );
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Riwayat Transaksi</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar seluruh transaksi dan invoice pesanan pada outlet {currentOutlet?.name || 'Utama'}.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="w-64">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Cari no. order, meja, nama..."
          />
        </div>
      </div>

      {/* Transactions Table */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">No. Order / Transaksi</th>
                <th className="py-3.5 px-4">Waktu</th>
                <th className="py-3.5 px-4">Meja / Tipe</th>
                <th className="py-3.5 px-4">Pelanggan</th>
                <th className="py-3.5 px-4 text-right">Total Tagihan</th>
                <th className="py-3.5 px-4 text-center">Metode Bayar</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8}>
                    <LoadingState message="Memuat riwayat transaksi..." />
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <EmptyState
                      icon={<History className="w-8 h-8 opacity-30 mx-auto" />}
                      title="Belum ada transaksi"
                      description="Transaksi yang diproses di kasir POS akan langsung tercatat di sini."
                    />
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {order.orderNumber || order.id.slice(0, 8)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">
                      {new Date(order.createdAt).toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant="neutral">
                        {order.tableName ? `Meja ${order.tableName}` : order.orderType || 'Take Away'}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      {order.customerName || 'Tamu / Umum'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-[#0D5C53]">
                      Rp {Number(order.totalAmount).toLocaleString('id-ID')}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-semibold text-slate-700">
                        {order.paymentMethod || 'CASH'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">{getStatusBadge(order.status)}</td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedOrder(order)}
                          leftIcon={<Eye className="w-3.5 h-3.5" />}
                        >
                          Detail
                        </Button>
                        {order.status === 'COMPLETED' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setReceiptOrder(order)}
                            leftIcon={<Printer className="w-3.5 h-3.5 text-teal-600" />}
                          >
                            Struk
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Reusable Detail Modal */}
      <Modal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={`Rincian Pesanan: ${selectedOrder?.orderNumber || selectedOrder?.id.slice(0, 8)}`}
        maxWidth="md"
      >
        {selectedOrder && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <div>
                <span className="text-slate-400 block mb-0.5">Waktu Transaksi</span>
                <span className="font-semibold text-slate-800">
                  {new Date(selectedOrder.createdAt).toLocaleString('id-ID')}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Pelanggan / Meja</span>
                <span className="font-semibold text-slate-800">
                  {selectedOrder.customerName || 'Umum'} (
                  {selectedOrder.tableName ? `Meja ${selectedOrder.tableName}` : selectedOrder.orderType}
                  )
                </span>
              </div>
            </div>

            <div>
              <span className="text-slate-500 font-semibold block mb-2">Daftar Item Pesanan</span>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700">
                    <tr>
                      <th className="p-2.5">Menu</th>
                      <th className="p-2.5 text-center">Qty</th>
                      <th className="p-2.5 text-right">Harga</th>
                      <th className="p-2.5 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedOrder.items?.map((item) => (
                      <tr key={item.id}>
                        <td className="p-2.5 font-medium text-slate-900">
                          {item.productName}
                          {item.variantName && (
                            <span className="text-[11px] text-slate-400 block">
                              Varian: {item.variantName}
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 text-center font-bold text-slate-800">{item.quantity}</td>
                        <td className="p-2.5 text-right text-slate-600">
                          Rp {Number(item.price).toLocaleString('id-ID')}
                        </td>
                        <td className="p-2.5 text-right font-bold text-slate-900">
                          Rp {(Number(item.price) * item.quantity).toLocaleString('id-ID')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1.5 text-right">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal:</span>
                <span>Rp {Number(selectedOrder.subtotal || selectedOrder.totalAmount).toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 text-sm pt-1 border-t border-slate-200">
                <span>Total Pembayaran:</span>
                <span className="text-[#0D5C53]">
                  Rp {Number(selectedOrder.totalAmount).toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setSelectedOrder(null)}
              >
                Tutup
              </Button>
              {selectedOrder.status === 'COMPLETED' && (
                <Button
                  variant="primary"
                  leftIcon={<Printer className="w-4 h-4" />}
                  onClick={() => {
                    setReceiptOrder(selectedOrder);
                    setSelectedOrder(null);
                  }}
                >
                  Cetak Struk
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Receipt Modal */}
      {receiptOrder && (
        <ReceiptModal
          order={receiptOrder}
          onClose={() => setReceiptOrder(null)}
        />
      )}
    </div>
  );
};
