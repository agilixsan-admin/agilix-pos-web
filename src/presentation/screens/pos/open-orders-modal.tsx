import React, { useEffect, useState } from 'react';
import type { Order } from '@model/Order';
import { posService } from '@domain/services/pos-service';
import { useAuthStore } from '@domain/state/auth-store';
import { useCartStore } from '@domain/state/cart-store';
import { X, Clock, PlusCircle, CreditCard, Loader2, RefreshCw } from 'lucide-react';

interface OpenOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectForPayment: (order: Order) => void;
  onOrderUpdated: () => void;
}

export const OpenOrdersModal: React.FC<OpenOrdersModalProps> = ({
  isOpen,
  onClose,
  onSelectForPayment,
  onOrderUpdated,
}) => {
  const currentOutlet = useAuthStore((state) => state.currentOutlet);
  const { items: cartItems, clearCart } = useCartStore();

  const [openOrders, setOpenOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await posService.getOpenOrders(currentOutlet?.id);
      setOpenOrders(data);
    } catch (err: unknown) {
      setError('Gagal memuat pesanan aktif.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchOrders();
    }
  }, [isOpen, currentOutlet?.id]);

  if (!isOpen) return null;

  const handleAppendItems = async (order: Order) => {
    if (cartItems.length === 0) {
      alert('Keranjang masih kosong. Pilih menu terlebih dahulu di layar kasir untuk ditambahkan.');
      return;
    }

    setActionLoading(order.id);
    try {
      const payloadItems = cartItems.map((item) => ({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        notes: item.notes,
      }));

      await posService.addItemsToOrder(order.id, payloadItems);
      clearCart();
      onOrderUpdated();
      onClose();
    } catch (err: unknown) {
      alert(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Gagal menambahkan menu ke pesanan.'
      );
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Daftar Pesanan Berjalan (Open Orders)</h3>
              <p className="text-xs text-slate-500">
                {currentOutlet?.name || 'Outlet'} • {openOrders.length} pesanan aktif
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchOrders}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-[#0D5C53] mb-2" />
              <p className="text-xs">Memuat pesanan berjalan...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-700 text-xs p-4 rounded-xl text-center">{error}</div>
          ) : openOrders.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-semibold text-slate-600 text-sm">Tidak ada pesanan berjalan</p>
              <p className="text-xs text-slate-400 mt-0.5">Seluruh transaksi saat ini telah selesai dibayar.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {openOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-slate-50 hover:bg-white border border-slate-200 hover:border-[#0D5C53]/40 rounded-xl p-4 transition-all shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-slate-800 text-sm">
                        {order.tableName ? `Meja ${order.tableName}` : order.orderNumber || order.id.slice(0, 8)}
                      </span>
                      <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {order.orderType}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 mb-1">
                      Pelanggan: <strong className="text-slate-700">{order.customerName || 'Tamu'}</strong>
                    </p>

                    <div className="text-xs text-slate-600 space-y-0.5 my-2 bg-white p-2.5 rounded-lg border border-slate-100">
                      {order.items?.slice(0, 3).map((item, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span className="truncate pr-2">
                            {item.quantity}x {item.productName}
                          </span>
                          <span className="font-medium">
                            Rp {(Number(item.price) * item.quantity).toLocaleString('id-ID')}
                          </span>
                        </div>
                      ))}
                      {(order.items?.length || 0) > 3 && (
                        <p className="text-[10px] text-slate-400 italic">
                          + {order.items.length - 3} item lainnya...
                        </p>
                      )}
                    </div>

                    <div className="flex justify-between items-center text-xs pt-1">
                      <span className="text-slate-500">Total Sementara:</span>
                      <span className="font-bold text-[#0D5C53] text-sm">
                        Rp {Number(order.totalAmount || 0).toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-200/60">
                    <button
                      onClick={() => handleAppendItems(order)}
                      disabled={actionLoading === order.id}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 bg-white border border-slate-300 hover:border-[#0D5C53] hover:text-[#0D5C53] text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      {actionLoading === order.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <PlusCircle className="w-3.5 h-3.5" />
                      )}
                      <span>+ Tambah Menu</span>
                    </button>

                    <button
                      onClick={() => {
                        onClose();
                        onSelectForPayment(order);
                      }}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 bg-[#0D5C53] hover:bg-[#094740] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Bayar</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

