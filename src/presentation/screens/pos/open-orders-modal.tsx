import React, { useEffect, useState } from 'react';
import type { Order } from '@model/Order';
import { posService } from '@domain/services/pos-service';
import { useAuthStore } from '@domain/state/auth-store';
import { useCartStore } from '@domain/state/cart-store';
import { Clock, PlusCircle, CreditCard, RefreshCw, Ban } from 'lucide-react';
import {
  Button,
  Badge,
  Modal,
  LoadingState,
  EmptyState,
  toast,
} from '@presentation/components/ui';
import { VoidItemModal } from './void-item-modal';

interface OpenOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectForPayment: (order: Order) => void;
  onSelectForAppend?: (order: Order) => void;
  onOrderUpdated: () => void;
}

export const OpenOrdersModal: React.FC<OpenOrdersModalProps> = ({
  isOpen,
  onClose,
  onSelectForPayment,
  onSelectForAppend,
  onOrderUpdated,
}) => {
  const authOutlet = useAuthStore((state) => state.currentOutlet);
  const outlets = useAuthStore((state) => state.outlets);
  const currentOutlet = authOutlet || (outlets && outlets.length > 0 ? outlets[0] : null);
  const { items: cartItems, clearCart } = useCartStore();

  const [openOrders, setOpenOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [voidTarget, setVoidTarget] = useState<{ orderId: string; itemId: string; name: string } | null>(null);

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
      if (onSelectForAppend) {
        onClose();
        onSelectForAppend(order);
        return;
      }
      toast.warning('Keranjang masih kosong. Pilih menu terlebih dahulu di layar kasir untuk ditambahkan.');
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
      toast.success('Tambahan menu berhasil ditambahkan ke pesanan.');
    } catch (err: unknown) {
      toast.error(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Gagal menambahkan menu ke pesanan.'
      );
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Daftar Pesanan Berjalan (Open Orders)"
      subtitle={`${currentOutlet?.name || 'Outlet'} • ${openOrders.length} pesanan aktif`}
      maxWidth="2xl"
      footer={
        <Button variant="outline" onClick={onClose}>
          Tutup
        </Button>
      }
    >
      <div className="space-y-4">
        {loading ? (
          <LoadingState message="Memuat pesanan aktif..." />
        ) : openOrders.length === 0 ? (
          <EmptyState
            icon={<Clock className="w-10 h-10 opacity-30 text-amber-500 mx-auto" />}
            title="Tidak Ada Pesanan Aktif"
            description="Semua pesanan saat ini telah diselesaikan pembayarannya."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-1">
            {openOrders.map((order) => (
              <div
                key={order.id}
                className="border border-slate-200 rounded-xl p-4 bg-white hover:border-[#0D5C53]/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-slate-900 text-sm">
                      {order.orderNumber || order.id.slice(0, 8)}
                    </span>
                    <Badge variant="warning" dot>
                      {order.tableName || order.tableNumber || order.table?.name || order.table?.tableNumber
                        ? `Meja ${order.tableName || order.tableNumber || order.table?.name || order.table?.tableNumber}`
                        : order.orderType === 'TAKE_AWAY'
                        ? 'Take Away'
                        : 'Dine In'}
                    </Badge>
                  </div>

                  <div className="text-xs text-slate-500 mb-3">
                    Pelanggan: <span className="text-slate-800 font-semibold">{order.customerName || 'Umum'}</span>
                  </div>

                  {/* Order Items Preview */}
                  <div className="bg-slate-50 rounded-lg p-2.5 space-y-1.5 mb-3 text-xs">
                    {order.items
                      ?.filter((item) => !item.status || item.status === 'ACTIVE')
                      .map((item, idx) => (
                        <div key={item.id || idx} className="flex items-center justify-between text-slate-600">
                          <span className="truncate pr-2">
                            {item.quantity}x {item.productName}
                            {item.variantName && !item.variantName.trim().toLowerCase().includes('default')
                              ? ` (${item.variantName})`
                              : ''}
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="font-mono">
                              Rp{' '}
                              {Number(
                                item.subtotal ??
                                  Number(item.unitPrice || item.price || 0) * item.quantity,
                              ).toLocaleString('id-ID')}
                            </span>
                            <button
                              type="button"
                              title="Batalkan menu ini (Void)"
                              onClick={() => {
                                setVoidTarget({
                                  orderId: order.id,
                                  itemId: item.id,
                                  name: `${item.productName}${
                                    item.variantName && !item.variantName.trim().toLowerCase().includes('default')
                                      ? ` (${item.variantName})`
                                      : ''
                                  }`,
                                });
                              }}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-100/80 rounded transition-colors"
                            >
                              <Ban className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center py-2 border-t border-slate-100 text-xs font-bold mb-3">
                    <span className="text-slate-700">Total Tagihan:</span>
                    <span className="text-sm text-[#0D5C53]">
                      Rp {Number(order.totalAmount).toLocaleString('id-ID')}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      isLoading={actionLoading === order.id}
                      leftIcon={<PlusCircle className="w-3.5 h-3.5" />}
                      onClick={() => handleAppendItems(order)}
                    >
                      + Tambah Menu
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      leftIcon={<CreditCard className="w-3.5 h-3.5" />}
                      onClick={() => {
                        onClose();
                        onSelectForPayment(order);
                      }}
                    >
                      Bayar
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {voidTarget && (
        <VoidItemModal
          isOpen={!!voidTarget}
          onClose={() => setVoidTarget(null)}
          itemName={voidTarget.name}
          onConfirmVoid={async (reason, password) => {
            await posService.voidOrderItem(
              voidTarget.orderId,
              voidTarget.itemId,
              reason,
              password,
            );
            await fetchOrders();
            onOrderUpdated();
            toast.success('Menu berhasil dibatalkan (void).');
          }}
        />
      )}
    </Modal>
  );
};
