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
  Search,
  Plus,
  Minus,
  Trash2,
  Utensils,
  ShoppingBag,
  Clock,
  ArrowRight,
  Loader2,
  CreditCard,
  Edit2,
  X,
  Coffee,
} from 'lucide-react';

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
      addItem(product);
    }
  };

  const handleSelectVariant = (product: Product, variant: Variant) => {
    addItem(product, variant);
    setVariantModalProduct(null);
  };

  const handleCheckoutDirect = async () => {
    if (cartItems.length === 0) return;
    if (orderType === 'DINE_IN' && !tableId) {
      alert('Silakan pilih nomor meja untuk pesanan Dine-In.');
      return;
    }

    setOrderProcessing(true);
    try {
      const createdOrder = await posService.createOrder({
        outletId: currentOutlet?.id || '',
        tableId: tableId || undefined,
        orderType,
        customerName: customerName || undefined,
        items: cartItems.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          notes: item.notes,
        })),
      });

      clearCart();
      setActivePaymentOrder(createdOrder);
    } catch (err: unknown) {
      alert(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Gagal membuat pesanan.'
      );
    } finally {
      setOrderProcessing(false);
    }
  };

  const handleSaveOpenOrder = async () => {
    if (cartItems.length === 0) return;
    if (orderType === 'DINE_IN' && !tableId) {
      alert('Silakan pilih nomor meja untuk pesanan Dine-In.');
      return;
    }

    setOrderProcessing(true);
    try {
      await posService.createOrder({
        outletId: currentOutlet?.id || '',
        tableId: tableId || undefined,
        orderType,
        customerName: customerName || undefined,
        items: cartItems.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          notes: item.notes,
        })),
      });

      clearCart();
      alert('Pesanan berhasil disimpan ke Pesanan Berjalan (Open Orders).');
    } catch (err: unknown) {
      alert(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Gagal menyimpan pesanan.'
      );
    } finally {
      setOrderProcessing(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-5rem)] gap-6 select-none">
      {/* Left: Catalog & Menu Grid */}
      <div className="flex-1 flex flex-col min-w-0 bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {/* Top Controls: Search, Category Filter, and Open Orders Button */}
        <div className="p-4 border-b border-slate-100 space-y-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari menu makanan atau minuman..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53]"
              />
            </div>

            <button
              onClick={() => setIsOpenOrdersOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex-shrink-0"
            >
              <Clock className="w-4 h-4 text-amber-600" />
              <span>Pesanan Berjalan</span>
            </button>
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
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-[#0D5C53] mb-2" />
              <p className="text-xs">Memuat daftar menu...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <Coffee className="w-12 h-12 stroke-[1.5] mb-2 opacity-40" />
              <p className="font-semibold text-slate-600 text-sm">Menu tidak ditemukan</p>
              <p className="text-xs text-slate-400">Coba ubah kata kunci pencarian atau kategori.</p>
            </div>
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
                      <span className="text-[10px] bg-emerald-50 text-[#0D5C53] font-semibold px-2 py-0.5 rounded-md">
                        {product.variants.length} Varian
                      </span>
                    ) : (
                      <button
                        title="Tambah ke Keranjang"
                        className="w-7 h-7 bg-[#E6F4F1] hover:bg-[#0D5C53] text-[#0D5C53] hover:text-white rounded-lg flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
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
                className="text-[11px] font-semibold text-red-500 hover:text-red-700 cursor-pointer"
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
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold rounded-xl px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53] cursor-pointer"
                >
                  <option value="">Pilih Meja</option>
                  {tables.map((t) => (
                    <option key={t.id} value={t.id}>
                      Meja {t.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Nama Tamu (Opsional)"
              className={`bg-slate-50 border border-slate-200 text-slate-800 text-xs font-medium rounded-xl px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53] ${
                orderType !== 'DINE_IN' ? 'col-span-2' : ''
              }`}
            />
          </div>
        </div>

        {/* Cart Item Rows */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12">
              <ShoppingBag className="w-10 h-10 stroke-[1.5] mb-2 opacity-30" />
              <p className="font-medium text-xs">Keranjang masih kosong</p>
              <p className="text-[11px] text-slate-400">Pilih menu di sebelah kiri untuk memesan.</p>
            </div>
          ) : (
            cartItems.map((item) => (
              <div
                key={item.id}
                className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3 space-y-2"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="font-bold text-slate-800 text-xs leading-tight">{item.name}</h5>
                    {item.variantName && (
                      <span className="text-[10px] text-slate-500 font-medium">({item.variantName})</span>
                    )}
                  </div>
                  <span className="font-bold text-slate-800 text-xs">
                    Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                  </span>
                </div>

                {item.notes && (
                  <p className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60 inline-block italic">
                    Catatan: {item.notes}
                  </p>
                )}

                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={() => setNotesModalItem({ id: item.id, name: item.name, notes: item.notes || '' })}
                    className="text-[10px] font-semibold text-[#0D5C53] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>{item.notes ? 'Ubah Catatan' : '+ Catatan'}</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-6 h-6 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-700 cursor-pointer"
                    >
                      {item.quantity === 1 ? <Trash2 className="w-3 h-3 text-red-500" /> : <Minus className="w-3 h-3" />}
                    </button>
                    <span className="text-xs font-bold text-slate-800 w-4 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-6 h-6 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-700 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Calculation Totals & Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3">
          <div className="space-y-1.5 text-xs text-slate-600">
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
            <button
              onClick={handleSaveOpenOrder}
              disabled={cartItems.length === 0 || orderProcessing}
              className="py-3 px-3 bg-white border border-slate-300 hover:border-slate-400 active:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Simpan Pesanan</span>
            </button>

            <button
              onClick={handleCheckoutDirect}
              disabled={cartItems.length === 0 || orderProcessing}
              className="py-3 px-4 bg-[#0D5C53] hover:bg-[#094740] active:scale-[0.98] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
            >
              {orderProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  <span>Bayar Sekarang</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Variant Selection Modal */}
      {variantModalProduct && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 select-none">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-bold text-slate-800 text-sm">Pilih Varian {variantModalProduct.name}</h4>
              <button
                onClick={() => setVariantModalProduct(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2">
              {(variantModalProduct.variants || []).map((v) => (
                <button
                  key={v.id}
                  onClick={() => handleSelectVariant(variantModalProduct, v)}
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-[#0D5C53] hover:bg-[#E6F4F1]/30 transition-all cursor-pointer text-left"
                >
                  <span className="font-semibold text-slate-800 text-xs">{v.name}</span>
                  <span className="font-bold text-[#0D5C53] text-xs">
                    Rp {Number(v.price).toLocaleString('id-ID')}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Item Notes Modal */}
      {notesModalItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 select-none">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
            <h4 className="font-bold text-slate-800 text-sm mb-1">Catatan Menu</h4>
            <p className="text-xs text-slate-500 mb-3">{notesModalItem.name}</p>
            <textarea
              rows={3}
              value={notesModalItem.notes}
              onChange={(e) =>
                setNotesModalItem({ ...notesModalItem, notes: e.target.value })
              }
              placeholder="Contoh: Kurang manis, tanpa es batu, dll."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53] mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setNotesModalItem(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  updateNotes(notesModalItem.id, notesModalItem.notes);
                  setNotesModalItem(null);
                }}
                className="flex-1 py-2.5 bg-[#0D5C53] hover:bg-[#094740] text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

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

