import React, { useEffect, useState } from 'react';
import type { Product, Category, Variant } from '@model/Product';
import type { Table } from '@model/Settings';
import type { Order, OrderType } from '@model/Order';
import { productService } from '@domain/services/product-service';
import { posService } from '@domain/services/pos-service';
import { useAuthStore } from '@domain/state/auth-store';
import { useCartStore } from '@domain/state/cart-store';
import { PaymentModal } from './payment-modal';
import { ReceiptModal } from './receipt-modal';
import { OpenOrdersModal } from './open-orders-modal';
import {
  Plus,
  Minus,
  Trash2,
  Utensils,
  ShoppingBag,
  Clock,
  CreditCard,
  Edit2,
  Coffee,
} from 'lucide-react';
import {
  Button,
  Badge,
  SearchInput,
  Modal,
  FormTextarea,
  LoadingState,
  EmptyState,
} from '@presentation/components/ui';

export const PosScreen: React.FC = () => {
  const currentOutlet = useAuthStore((state) => state.currentOutlet);
  const {
    items: cartItems,
    orderType,
    tableId,
    tableName,
    customerName,
    addItem,
    removeItem,
    updateQuantity,
    updateNotes,
    setOrderType,
    setTable,
    setCustomerName,
    clearCart,
    getSubtotal,
    getTax,
    getTotal,
    getDiscount,
    getItemCount,
  } = useCartStore();

  // State
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // Modals
  const [variantModalProduct, setVariantModalProduct] = useState<Product | null>(null);
  const [notesModalItem, setNotesModalItem] = useState<{ id: string; name: string; notes: string } | null>(null);
  const [activePaymentOrder, setActivePaymentOrder] = useState<Order | null>(null);
  const [completedOrderForReceipt, setCompletedOrderForReceipt] = useState<Order | null>(null);
  const [isOpenOrdersOpen, setIsOpenOrdersOpen] = useState<boolean>(false);
  const [orderProcessing, setOrderProcessing] = useState<boolean>(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [prodData, catData, tableData] = await Promise.all([
        productService.getProducts({ outletId: currentOutlet?.id }),
        productService.getCategories(),
        posService.getTables(currentOutlet?.id),
      ]);
      setProducts(prodData);
      setCategories(catData);
      setTables(tableData);
    } catch (err: unknown) {
      console.error('Failed to load POS data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentOutlet?.id]);

  // Filtered Products
  const filteredProducts = products.filter((product) => {
    const matchesCategory = selectedCategory === 'ALL' || product.categoryId === selectedCategory;
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleProductClick = (product: Product) => {
    if (product.variants && product.variants.length > 0) {
      setVariantModalProduct(product);
    } else {
      addItem({
        productId: product.id,
        productName: product.name,
        price: product.price,
        image: product.image,
      });
    }
  };

  const handleSelectVariant = (product: Product, variant: Variant) => {
    addItem({
      productId: product.id,
      productName: product.name,
      variantId: variant.id,
      variantName: variant.name,
      price: variant.price,
      image: product.image,
    });
    setVariantModalProduct(null);
  };

  // Direct Instant Checkout
  const handleCheckoutDirect = async () => {
    if (cartItems.length === 0) return;
    if (orderType === 'DINE_IN' && !tableId) {
      alert('Silakan pilih nomor meja untuk pesanan Dine In.');
      return;
    }

    setOrderProcessing(true);
    try {
      const payloadItems = cartItems.map((item) => ({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        notes: item.notes,
      }));

      const createdOrder = await posService.createOrder({
        outletId: currentOutlet?.id,
        orderType: orderType as OrderType,
        tableId: tableId || undefined,
        customerName: customerName || undefined,
        items: payloadItems,
      });

      clearCart();
      setActivePaymentOrder(createdOrder);
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Gagal membuat order transaksi.';
      alert(errorMsg);
    } finally {
      setOrderProcessing(false);
    }
  };

  // Save as Open Order
  const handleSaveOpenOrder = async () => {
    if (cartItems.length === 0) return;
    if (orderType === 'DINE_IN' && !tableId) {
      alert('Silakan pilih nomor meja untuk pesanan Dine In.');
      return;
    }

    setOrderProcessing(true);
    try {
      const payloadItems = cartItems.map((item) => ({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        notes: item.notes,
      }));

      await posService.createOrder({
        outletId: currentOutlet?.id,
        orderType: orderType as OrderType,
        tableId: tableId || undefined,
        customerName: customerName || undefined,
        items: payloadItems,
      });

      clearCart();
      alert('Pesanan berhasil disimpan ke Pesanan Berjalan (Open Orders).');
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Gagal menyimpan open order.';
      alert(errorMsg);
    } finally {
      setOrderProcessing(false);
    }
  };

  return (
    <div className="flex gap-4 h-[calc(100vh-6rem)] overflow-hidden">
      {/* Left: Product Catalog & Category Tabs */}
      <div className="flex-1 flex flex-col bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {/* Top Filter Bar */}
        <div className="p-4 border-b border-slate-100 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 max-w-md">
              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Cari menu, kopi, makanan..."
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              leftIcon={<Clock className="w-4 h-4 text-amber-600" />}
              onClick={() => setIsOpenOrdersOpen(true)}
            >
              Pesanan Berjalan
            </Button>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === 'ALL'
                  ? 'bg-[#0D5C53] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua Menu
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-[#0D5C53] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <LoadingState message="Memuat daftar menu..." className="h-full" />
          ) : filteredProducts.length === 0 ? (
            <EmptyState
              icon={<Coffee className="w-12 h-12 stroke-[1.5] mb-2 opacity-40 mx-auto" />}
              title="Menu tidak ditemukan"
              description="Coba ubah kata kunci pencarian atau kategori."
              className="h-full"
            />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3.5">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  onClick={() => handleProductClick(product)}
                  className="bg-white border border-slate-200 hover:border-[#0D5C53]/50 hover:shadow-md rounded-2xl p-3.5 flex flex-col justify-between transition-all cursor-pointer group active:scale-[0.98]"
                >
                  <div>
                    <div className="w-full h-24 bg-slate-100 rounded-xl mb-2.5 flex items-center justify-center overflow-hidden">
                      {product.image ? (
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <Coffee className="w-8 h-8 text-slate-300 group-hover:text-[#0D5C53] transition-colors" />
                      )}
                    </div>
                    <h4 className="font-semibold text-slate-800 text-sm leading-tight line-clamp-2 mb-1">
                      {product.name}
                    </h4>
                    {product.categoryName && (
                      <span className="text-[10px] text-slate-400 font-medium">{product.categoryName}</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
                    <span className="font-bold text-[#0D5C53] text-sm">
                      Rp {Number(product.price).toLocaleString('id-ID')}
                    </span>
                    {product.variants && product.variants.length > 0 ? (
                      <Badge variant="info" size="sm">
                        {product.variants.length} Varian
                      </Badge>
                    ) : (
                      <div className="w-7 h-7 bg-teal-50 hover:bg-[#0D5C53] text-[#0D5C53] hover:text-white rounded-lg flex items-center justify-center transition-colors">
                        <Plus className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right: Cart & Checkout Panel */}
      <div className="w-96 bg-white border border-slate-200 rounded-2xl shadow-xs flex flex-col overflow-hidden flex-shrink-0">
        {/* Cart Header & Order Type Toggle */}
        <div className="p-4 border-b border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-[#0D5C53]" />
              <span className="font-bold text-slate-800 text-sm">Keranjang ({getItemCount()})</span>
            </div>
            {cartItems.length > 0 && (
              <button
                onClick={clearCart}
                className="text-[11px] font-semibold text-rose-500 hover:text-rose-700 cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>

          {/* Dine In / Take Away */}
          <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setOrderType('DINE_IN')}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                orderType === 'DINE_IN'
                  ? 'bg-white text-[#0D5C53] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Utensils className="w-3.5 h-3.5" />
              <span>Dine In</span>
            </button>
            <button
              onClick={() => {
                setOrderType('TAKE_AWAY');
                setTable(null, null);
              }}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                orderType === 'TAKE_AWAY'
                  ? 'bg-white text-[#0D5C53] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Take Away</span>
            </button>
          </div>

          {/* Table & Customer Inputs */}
          <div className="grid grid-cols-2 gap-2">
            {orderType === 'DINE_IN' && (
              <div className="relative">
                <select
                  aria-label="Pilih Meja"
                  value={tableId || ''}
                  onChange={(e) => {
                    const sel = tables.find((t) => t.id === e.target.value);
                    setTable(sel ? sel.id : null, sel ? sel.name : null);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53] cursor-pointer"
                >
                  <option value="">Pilih Meja...</option>
                  {tables.map((t) => (
                    <option key={t.id} value={t.id}>
                      Meja {t.name} ({t.capacity} Kursi)
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className={orderType === 'DINE_IN' ? '' : 'col-span-2'}>
              <input
                type="text"
                placeholder="Nama Pelanggan (Opsional)"
                value={customerName || ''}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53]"
              />
            </div>
          </div>
        </div>

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto p-4 divide-y divide-slate-100">
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-300 py-8">
              <ShoppingBag className="w-10 h-10 stroke-[1.5] mb-2 opacity-30" />
              <p className="text-xs font-semibold text-slate-400">Keranjang Kosong</p>
              <p className="text-[11px] text-slate-300 text-center mt-0.5">
                Klik menu di sebelah kiri untuk menambahkan pesanan.
              </p>
            </div>
          ) : (
            cartItems.map((item) => (
              <div key={item.id} className="py-3 first:pt-0 last:pb-0 flex flex-col gap-1.5">
                <div className="flex items-start justify-between">
                  <div className="flex-1 pr-2">
                    <h5 className="font-semibold text-slate-800 text-xs leading-tight">{item.productName}</h5>
                    {item.variantName && (
                      <span className="text-[10px] text-slate-400 font-medium">Varian: {item.variantName}</span>
                    )}
                    {item.notes && (
                      <p className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                        {item.notes}
                      </p>
                    )}
                  </div>

                  <span className="font-bold text-slate-800 text-xs">
                    Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                  </span>
                </div>

                {/* Counter & Action Buttons */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={() =>
                      setNotesModalItem({
                        id: item.id,
                        name: item.productName,
                        notes: item.notes || '',
                      })
                    }
                    className="text-[11px] text-slate-400 hover:text-[#0D5C53] flex items-center gap-1 cursor-pointer"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Catatan</span>
                  </button>

                  <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg p-0.5">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-slate-200 rounded cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center text-xs font-bold text-slate-800">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-slate-200 rounded cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="w-6 h-6 flex items-center justify-center text-rose-500 hover:bg-rose-50 rounded ml-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Calculation & Action Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-3">
          <div className="space-y-1.5 text-xs text-slate-500">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-semibold text-slate-800">Rp {getSubtotal().toLocaleString('id-ID')}</span>
            </div>
            {getDiscount() > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Diskon</span>
                <span>-Rp {getDiscount().toLocaleString('id-ID')}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Pajak Resto (10%)</span>
              <span className="font-semibold text-slate-800">Rp {getTax().toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-1.5 border-t border-slate-200">
              <span>Total Tagihan</span>
              <span className="text-[#0D5C53] text-base">Rp {getTotal().toLocaleString('id-ID')}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <Button
              variant="outline"
              disabled={cartItems.length === 0 || orderProcessing}
              leftIcon={<Clock className="w-3.5 h-3.5" />}
              onClick={handleSaveOpenOrder}
            >
              Simpan Pesanan
            </Button>

            <Button
              variant="primary"
              disabled={cartItems.length === 0 || orderProcessing}
              isLoading={orderProcessing}
              leftIcon={<CreditCard className="w-4 h-4" />}
              onClick={handleCheckoutDirect}
            >
              Bayar Sekarang
            </Button>
          </div>
        </div>
      </div>

      {/* Reusable Variant Selection Modal */}
      <Modal
        isOpen={!!variantModalProduct}
        onClose={() => setVariantModalProduct(null)}
        title={`Pilih Varian ${variantModalProduct?.name || ''}`}
        maxWidth="sm"
      >
        <div className="space-y-2">
          {(variantModalProduct?.variants || []).map((v) => (
            <button
              key={v.id}
              onClick={() => handleSelectVariant(variantModalProduct!, v)}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-[#0D5C53] hover:bg-teal-50/40 transition-all cursor-pointer text-left"
            >
              <span className="font-semibold text-slate-800 text-xs">{v.name}</span>
              <span className="font-bold text-[#0D5C53] text-xs">
                Rp {Number(v.price).toLocaleString('id-ID')}
              </span>
            </button>
          ))}
        </div>
      </Modal>

      {/* Reusable Item Notes Modal */}
      <Modal
        isOpen={!!notesModalItem}
        onClose={() => setNotesModalItem(null)}
        title="Catatan Menu"
        subtitle={notesModalItem?.name}
        maxWidth="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setNotesModalItem(null)}>
              Batal
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                if (notesModalItem) {
                  updateNotes(notesModalItem.id, notesModalItem.notes);
                  setNotesModalItem(null);
                }
              }}
            >
              Simpan
            </Button>
          </>
        }
      >
        <FormTextarea
          value={notesModalItem?.notes || ''}
          onChange={(e) =>
            setNotesModalItem((prev) => (prev ? { ...prev, notes: e.target.value } : null))
          }
          placeholder="Contoh: Kurang manis, tanpa es batu, dll."
          rows={3}
        />
      </Modal>

      {/* Payment Modal */}
      {activePaymentOrder && (
        <PaymentModal
          order={activePaymentOrder}
          isOpen={!!activePaymentOrder}
          onClose={() => setActivePaymentOrder(null)}
          onPaymentSuccess={(completed) => {
            setActivePaymentOrder(null);
            setCompletedOrderForReceipt(completed);
            loadData();
          }}
        />
      )}

      {/* Receipt Print Modal */}
      {completedOrderForReceipt && (
        <ReceiptModal
          order={completedOrderForReceipt}
          isOpen={!!completedOrderForReceipt}
          onClose={() => setCompletedOrderForReceipt(null)}
        />
      )}

      {/* Open Orders Drawer / Modal */}
      <OpenOrdersModal
        isOpen={isOpenOrdersOpen}
        onClose={() => setIsOpenOrdersOpen(false)}
        onSelectForPayment={(order) => {
          setActivePaymentOrder(order);
        }}
        onOrderUpdated={loadData}
      />
    </div>
  );
};
