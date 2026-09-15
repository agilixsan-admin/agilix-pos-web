import React, { useState, useEffect } from 'react';
import type { Product, Variant } from '@model/Product';
import type { Table } from '@model/Settings';
import type { Order, OrderType, OrderItem } from '@model/Order';
import { posService } from '@domain/services/pos-service';
import { useAuthStore } from '@domain/state/auth-store';
import { useCartStore } from '@domain/state/cart-store';
import {
  useDebounce,
  useKeyboardShortcuts,
  useBarcodeScanner,
  useProducts,
  useCategories,
  useTables,
  useOpenOrders,
  useGlobalTaxConfig,
  useOutlets,
} from '@domain/hooks';
import { OrderTypeModal } from './order-type-modal';
import { TableFloorView } from './table-floor-view';
import { VariantModal } from './variant-modal';
import { ItemNoteModal } from './item-note-modal';
import { VoidItemModal } from './void-item-modal';
import { DiscountModal } from './discount-modal';
import { PaymentModal } from './payment-modal';
import { PaymentSuccessModal } from './payment-success-modal';
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
  ArrowLeft,
  Tag,
  Search,
  Receipt,
  LayoutGrid,
  Building2,
} from 'lucide-react';
import {
  Button,
  Badge,
  SearchInput,
  LoadingState,
  EmptyState,
} from '@presentation/components/ui';

export const PosScreen: React.FC = () => {
  const { currentOutlet, setCurrentOutlet } = useAuthStore();
  const { data: rawOutlets = [] } = useOutlets();
  const outlets = Array.isArray(rawOutlets) && rawOutlets.length > 0
    ? rawOutlets
    : useAuthStore.getState().outlets || [];

  const effectiveOutlet = currentOutlet || (outlets.length > 0 ? outlets[0] : null);

  // Auto-select outlet on load if not set
  useEffect(() => {
    if (!currentOutlet && outlets.length > 0) {
      setCurrentOutlet(outlets[0]);
    }
  }, [currentOutlet, outlets, setCurrentOutlet]);

  const {
    items: cartItems,
    orderType,
    tableId,
    tableName,
    customerName,
    discountId,
    discountName,
    discountAmount,
    taxPercent,
    taxName,
    addItem,
    removeItem,
    updateQuantity,
    updateNotes,
    setOrderType,
    setTable,
    setCustomerName,
    setDiscount,
    setTax,
    clearCart,
    getSubtotal,
    getTax,
    getTotal,
    getDiscount,
    getItemCount,
  } = useCartStore();

  // Screen View Mode: 'FLOOR' (Table Floor Plan & Active Orders) | 'CATALOG' (Menu & Cart)
  const [viewMode, setViewMode] = useState<'FLOOR' | 'CATALOG'>('FLOOR');

  // Query Hooks
  const {
    data: products = [],
    isLoading: productsLoading,
    refetch: refetchProducts,
  } = useProducts({ outletId: effectiveOutlet?.id });

  const {
    data: categories = [],
    isLoading: categoriesLoading,
    refetch: refetchCategories,
  } = useCategories();

  const {
    data: tables = [],
    isLoading: tablesLoading,
    refetch: refetchTables,
  } = useTables(effectiveOutlet?.id);

  const {
    data: openOrders = [],
    isLoading: openOrdersLoading,
    refetch: refetchOpenOrders,
  } = useOpenOrders(effectiveOutlet?.id);

  const { data: taxConfig } = useGlobalTaxConfig(effectiveOutlet?.id);

  // Sync Tax Configuration with Cart Store
  useEffect(() => {
    if (taxConfig?.enableTaxCalculation && taxConfig.defaultGlobalTax) {
      setTax(
        Number(taxConfig.defaultGlobalTax.rate) || 0,
        taxConfig.defaultGlobalTax.name,
        taxConfig.defaultGlobalTax.type,
      );
    } else {
      setTax(0, null, null);
    }
  }, [taxConfig, setTax]);

  // Reset cart when switching outlet so that items, tables, and settings do not contaminate another branch
  useEffect(() => {
    clearCart();
  }, [currentOutlet?.id, clearCart]);

  const loading = productsLoading || categoriesLoading || tablesLoading;

  const refreshAllData = () => {
    refetchProducts();
    refetchCategories();
    refetchTables();
    refetchOpenOrders();
  };

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const debouncedSearch = useDebounce(searchQuery, 200);

  // Modals
  const [isOrderTypeModalOpen, setIsOrderTypeModalOpen] = useState<boolean>(false);
  const [pendingOrderType, setPendingOrderType] = useState<OrderType>('DINE_IN');
  const [variantModalProduct, setVariantModalProduct] = useState<Product | null>(null);
  const [notesModalItem, setNotesModalItem] = useState<{ id: string; name: string; notes: string } | null>(null);
  const [voidModalItem, setVoidModalItem] = useState<{ orderId: string; itemId: string; name: string } | null>(null);
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState<boolean>(false);
  const [activePaymentOrder, setActivePaymentOrder] = useState<Order | null>(null);
  const [successModalOrder, setSuccessModalOrder] = useState<Order | null>(null);
  const [receiptModalOrder, setReceiptModalOrder] = useState<Order | null>(null);
  const [isOpenOrdersOpen, setIsOpenOrdersOpen] = useState<boolean>(false);
  const [orderProcessing, setOrderProcessing] = useState<boolean>(false);

  // Filtered Products
  const filteredProducts = products.filter((product) => {
    const matchesCategory = selectedCategory === 'ALL' || product.categoryId === selectedCategory;
    const matchesSearch =
      product.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      product.sku?.toLowerCase().includes(debouncedSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Handle Product Click
  const handleProductClick = (product: Product) => {
    if (product.variants && product.variants.length > 1) {
      setVariantModalProduct(product);
    } else {
      addItem(product);
    }
  };

  const handleSelectVariant = (product: Product, variant: Variant) => {
    addItem(product, variant);
    setVariantModalProduct(null);
  };

  // Hardware Barcode Scanner Listener
  useBarcodeScanner((scannedCode) => {
    const matchedProduct = products.find(
      (p) =>
        p.sku?.toLowerCase() === scannedCode.toLowerCase() ||
        p.id === scannedCode ||
        p.barcode?.toLowerCase() === scannedCode.toLowerCase()
    );
    if (matchedProduct) {
      handleProductClick(matchedProduct);
    }
  });

  // Keyboard Shortcuts for Cashier
  useKeyboardShortcuts({
    F2: () => {
      if (cartItems.length > 0 && viewMode === 'CATALOG') {
        handleCheckoutDirect();
      }
    },
    F4: () => {
      if (cartItems.length > 0 && viewMode === 'CATALOG') {
        handleSaveOpenOrder();
      }
    },
    Escape: () => {
      setVariantModalProduct(null);
      setNotesModalItem(null);
      setVoidModalItem(null);
      setIsDiscountModalOpen(false);
      setIsOrderTypeModalOpen(false);
      setActivePaymentOrder(null);
      setIsOpenOrdersOpen(false);
    },
  });

  // Start New Order Trigger
  const handleInitiateNewOrder = () => {
    setPendingOrderType('DINE_IN');
    setIsOrderTypeModalOpen(true);
  };

  const handleConfirmOrderType = () => {
    setIsOrderTypeModalOpen(false);
    setOrderType(pendingOrderType);
    if (pendingOrderType === 'TAKE_AWAY') {
      setTable(null, null);
      setViewMode('CATALOG');
    } else {
      // If Dine In, stay in Floor view to pick table
      setViewMode('FLOOR');
    }
  };

  // Table Floor Plan Table Selection
  const handleSelectTableForOrder = (table: Table) => {
    setOrderType('DINE_IN');
    setTable(table.id, table.name);
    setViewMode('CATALOG');
  };

  // Direct Instant Checkout
  const handleCheckoutDirect = async () => {
    const activeOutlet = currentOutlet || effectiveOutlet;
    if (!activeOutlet?.id) {
      alert('Silakan pilih cabang/outlet aktif terlebih dahulu.');
      return;
    }
    if (!currentOutlet && activeOutlet) {
      setCurrentOutlet(activeOutlet);
    }
    if (cartItems.length === 0) return;
    if (orderType === 'DINE_IN' && !tableId) {
      alert('Silakan pilih nomor meja untuk pesanan Dine In.');
      setViewMode('FLOOR');
      return;
    }

    setOrderProcessing(true);
    try {
      const payloadItems = cartItems.map((item) => ({
        productId: item.productId,
        variantId: item.variantId || item.productId,
        quantity: item.quantity,
        notes: item.notes,
      }));

      const createdOrder = await posService.createOrder({
        outletId: activeOutlet.id,
        orderType: orderType as OrderType,
        tableId: tableId || undefined,
        customerName: customerName || undefined,
        discountId: discountId || undefined,
        discountAmount: discountAmount || undefined,
        taxAmount: getTax(),
        items: payloadItems,
      });

      clearCart();
      refreshAllData();
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
    const activeOutlet = currentOutlet || effectiveOutlet;
    if (!activeOutlet?.id) {
      alert('Silakan pilih cabang/outlet aktif terlebih dahulu.');
      return;
    }
    if (!currentOutlet && activeOutlet) {
      setCurrentOutlet(activeOutlet);
    }
    if (cartItems.length === 0) return;
    if (orderType === 'DINE_IN' && !tableId) {
      alert('Silakan pilih nomor meja untuk pesanan Dine In.');
      setViewMode('FLOOR');
      return;
    }

    setOrderProcessing(true);
    try {
      const payloadItems = cartItems.map((item) => ({
        productId: item.productId,
        variantId: item.variantId || item.productId,
        quantity: item.quantity,
        notes: item.notes,
      }));

      await posService.createOrder({
        outletId: activeOutlet.id,
        orderType: orderType as OrderType,
        tableId: tableId || undefined,
        customerName: customerName || undefined,
        discountId: discountId || undefined,
        discountAmount: discountAmount || undefined,
        taxAmount: getTax(),
        items: payloadItems,
      });

      clearCart();
      refreshAllData();
      setViewMode('FLOOR');
      alert('Pesanan berhasil disimpan ke Pesanan Berjalan (Open Orders).');
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Gagal menyimpan pesanan berjalan.';
      alert(errorMsg);
    } finally {
      setOrderProcessing(false);
    }
  };

  return (
    <div className="h-[calc(100vh-6rem)] overflow-hidden flex flex-col">
      {/* VIEW 1: TABLE FLOOR PLAN & ACTIVE ORDERS (HOME POS) */}
      {viewMode === 'FLOOR' ? (
        <TableFloorView
          tables={tables}
          openOrders={openOrders}
          loading={loading || openOrdersLoading}
          onSelectTableForOrder={handleSelectTableForOrder}
          onSelectOpenOrderForPayment={(order) => setActivePaymentOrder(order)}
          onSelectOpenOrderForAppend={(order) => {
            setOrderType(order.orderType);
            setTable(order.tableId || null, order.tableName || null);
            setCustomerName(order.customerName || '');
            setViewMode('CATALOG');
          }}
          onNewOrderClick={handleInitiateNewOrder}
        />
      ) : (
        /* VIEW 2: MENU CATALOG & CART MANAGEMENT */
        <div className="flex-1 flex gap-4 overflow-hidden p-4 bg-slate-50">
          {/* Left: Product Catalog & Category Tabs */}
          <div className="flex-1 flex flex-col bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            {/* Top Filter Bar */}
            <div className="p-4 border-b border-slate-100 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<ArrowLeft className="w-4 h-4" />}
                  onClick={() => setViewMode('FLOOR')}
                >
                  Denah Meja
                </Button>

                {outlets && outlets.length > 1 ? (
                  <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 shrink-0">
                    <Building2 className="w-3.5 h-3.5 text-[#0D5C53]" />
                    <select
                      aria-label="Pilih Cabang POS"
                      value={effectiveOutlet?.id || ''}
                      onChange={(e) => {
                        const found = outlets.find((o) => o.id === e.target.value);
                        if (found) setCurrentOutlet(found);
                      }}
                      className="bg-transparent text-xs font-bold text-slate-800 focus:outline-hidden cursor-pointer"
                    >
                      {outlets.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 shrink-0 text-xs font-semibold text-slate-700">
                    <Building2 className="w-3.5 h-3.5 text-[#0D5C53]" />
                    <span>{effectiveOutlet?.name || 'Outlet Utama'}</span>
                  </div>
                )}

                <div className="flex-1 max-w-md">
                  <SearchInput
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Cari menu kopi, makanan, cemilan..."
                  />
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Clock className="w-4 h-4 text-amber-600" />}
                  onClick={() => setIsOpenOrdersOpen(true)}
                >
                  Pesanan ({openOrders.length})
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
                  {filteredProducts.map((product) => {
                    const imageUrl = product.imageUrl || product.image;
                    const hasVariants = product.variants && product.variants.length > 1;

                    return (
                      <div
                        key={product.id}
                        onClick={() => handleProductClick(product)}
                        className="bg-white border border-slate-200 hover:border-[#0D5C53]/60 hover:shadow-md rounded-2xl p-3.5 flex flex-col justify-between transition-all cursor-pointer group active:scale-[0.98]"
                      >
                        <div>
                          {/* Product Thumbnail with Image Fallback */}
                          <div className="w-full h-28 bg-slate-100 rounded-xl mb-2.5 flex items-center justify-center overflow-hidden relative">
                            {imageUrl ? (
                              <img
                                src={imageUrl}
                                alt={product.name}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                onError={(e) => {
                                  // Hide broken image and fallback to icon
                                  (e.target as HTMLElement).style.display = 'none';
                                  const parent = (e.target as HTMLElement).parentElement;
                                  if (parent) {
                                    parent.classList.add('bg-teal-50/50');
                                  }
                                }}
                              />
                            ) : (
                              <Coffee className="w-8 h-8 text-slate-300 group-hover:text-[#0D5C53] transition-colors" />
                            )}

                            {hasVariants && (
                              <span className="absolute top-2 right-2 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                                {product.variants?.length} Varian
                              </span>
                            )}
                          </div>

                          <h4 className="font-bold text-slate-800 text-sm leading-snug line-clamp-2 mb-1 group-hover:text-[#0D5C53] transition-colors">
                            {product.name}
                          </h4>
                          {product.categoryName && (
                            <span className="text-[10px] text-slate-400 font-medium">{product.categoryName}</span>
                          )}
                        </div>

                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
                          <div>
                            {product.minPrice !== undefined && product.maxPrice !== undefined && product.maxPrice > product.minPrice ? (
                              <span className="font-bold text-[#0D5C53] text-xs">
                                Rp {Number(product.minPrice).toLocaleString('id-ID')} - {Number(product.maxPrice).toLocaleString('id-ID')}
                              </span>
                            ) : (
                              <span className="font-bold text-[#0D5C53] text-sm">
                                Rp {Number(product.price ?? product.minPrice ?? 0).toLocaleString('id-ID')}
                              </span>
                            )}
                          </div>

                          <div className="w-7 h-7 bg-teal-50 group-hover:bg-[#0D5C53] text-[#0D5C53] group-hover:text-white rounded-lg flex items-center justify-center transition-colors shadow-xs">
                            <Plus className="w-4 h-4" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right: Cart & Checkout Panel */}
          <div className="w-96 bg-white border border-slate-200 rounded-2xl shadow-xs flex flex-col overflow-hidden shrink-0">
            {/* Cart Header & Order Type Switcher */}
            <div className="p-4 border-b border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-[#0D5C53]" />
                  <span className="font-bold text-slate-800 text-sm">
                    Keranjang Pesanan ({getItemCount()})
                  </span>
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

              {/* Dine In / Take Away Switcher */}
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

              {/* Table & Customer Name Inputs */}
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

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-4 divide-y divide-slate-100">
              {cartItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-300 py-8">
                  <ShoppingBag className="w-10 h-10 stroke-[1.5] mb-2 opacity-30" />
                  <p className="text-xs font-semibold text-slate-400">Keranjang Masih Kosong</p>
                  <p className="text-[11px] text-slate-300 text-center mt-0.5">
                    Pilih menu di sebelah kiri untuk membuat pesanan.
                  </p>
                </div>
              ) : (
                cartItems.map((item) => (
                  <div key={item.id} className="py-3 first:pt-0 last:pb-0 flex flex-col gap-1.5">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 pr-2">
                        <h5 className="font-semibold text-slate-800 text-xs leading-tight">{item.name}</h5>
                        {item.variantName && (
                          <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                            Varian: {item.variantName}
                          </span>
                        )}
                        {item.notes && (
                          <p className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded mt-1 inline-block border border-amber-200">
                            Catatan: {item.notes}
                          </p>
                        )}
                      </div>

                      <span className="font-bold text-slate-800 text-xs">
                        Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                      </span>
                    </div>

                    {/* Counter & Edit Note Actions */}
                    <div className="flex items-center justify-between pt-1">
                      <button
                        onClick={() =>
                          setNotesModalItem({
                            id: item.id,
                            name: item.name,
                            notes: item.notes || '',
                          })
                        }
                        className="text-[11px] text-slate-400 hover:text-[#0D5C53] flex items-center gap-1 cursor-pointer"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>{item.notes ? 'Ubah Catatan' : '+ Catatan'}</span>
                      </button>

                      <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg p-0.5">
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

            {/* Cart Calculations & Checkout Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-3">
              <div className="space-y-1.5 text-xs text-slate-500">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-800">Rp {getSubtotal().toLocaleString('id-ID')}</span>
                </div>

                {/* Discount Trigger / Display */}
                <div className="flex justify-between items-center text-xs">
                  <button
                    onClick={() => setIsDiscountModalOpen(true)}
                    className="text-teal-700 hover:underline flex items-center gap-1 cursor-pointer font-medium"
                  >
                    <Tag className="w-3.5 h-3.5" />
                    <span>{discountName || '+ Tambah Diskon / Promo'}</span>
                  </button>
                  {getDiscount() > 0 && (
                    <span className="font-bold text-emerald-600">
                      -Rp {getDiscount().toLocaleString('id-ID')}
                    </span>
                  )}
                </div>

                {getTax() > 0 && (
                  <div className="flex justify-between">
                    <span>{taxName || 'Pajak'} ({taxPercent}%)</span>
                    <span className="font-semibold text-slate-800">Rp {getTax().toLocaleString('id-ID')}</span>
                  </div>
                )}

                <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-1.5 border-t border-slate-200">
                  <span>Total Tagihan</span>
                  <span className="text-[#0D5C53] text-base">Rp {getTotal().toLocaleString('id-ID')}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <Button
                  variant="outline"
                  disabled={cartItems.length === 0 || orderProcessing}
                  leftIcon={<Clock className="w-3.5 h-3.5 text-slate-500" />}
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
                  className="font-bold shadow-md shadow-teal-900/10"
                >
                  Bayar Sekarang
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: ORDER TYPE SELECTOR */}
      <OrderTypeModal
        isOpen={isOrderTypeModalOpen}
        onClose={() => setIsOrderTypeModalOpen(false)}
        selectedType={pendingOrderType}
        onSelectType={setPendingOrderType}
        onContinue={handleConfirmOrderType}
      />

      {/* MODAL 2: VARIANT SELECTOR */}
      <VariantModal
        isOpen={!!variantModalProduct}
        onClose={() => setVariantModalProduct(null)}
        product={variantModalProduct}
        onSelectVariant={handleSelectVariant}
      />

      {/* MODAL 3: ITEM NOTE EDITOR */}
      <ItemNoteModal
        isOpen={!!notesModalItem}
        onClose={() => setNotesModalItem(null)}
        itemName={notesModalItem?.name}
        initialNotes={notesModalItem?.notes}
        onSaveNotes={(notes) => {
          if (notesModalItem) {
            updateNotes(notesModalItem.id, notes);
          }
        }}
      />

      {/* MODAL 4: DISCOUNT & PROMO SELECTOR */}
      <DiscountModal
        isOpen={isDiscountModalOpen}
        onClose={() => setIsDiscountModalOpen(false)}
        subtotal={getSubtotal()}
        selectedDiscountId={discountId}
        onApplyDiscount={({ id, name, amount }) => {
          setDiscount(id, name, amount);
        }}
      />

      {/* MODAL 5: VOID ITEM CONFIRMATION */}
      {voidModalItem && (
        <VoidItemModal
          isOpen={!!voidModalItem}
          onClose={() => setVoidModalItem(null)}
          itemName={voidModalItem.name}
          onConfirmVoid={async (reason) => {
            await posService.voidOrderItem(voidModalItem.orderId, voidModalItem.itemId, reason);
            refreshAllData();
            alert('Item berhasil dibatalkan (void).');
          }}
        />
      )}

      {/* MODAL 6: PAYMENT CHECKOUT */}
      {activePaymentOrder && (
        <PaymentModal
          order={activePaymentOrder}
          isOpen={!!activePaymentOrder}
          onClose={() => setActivePaymentOrder(null)}
          onPaymentSuccess={(completed) => {
            setActivePaymentOrder(null);
            setSuccessModalOrder(completed);
            refreshAllData();
          }}
        />
      )}

      {/* MODAL 7: PAYMENT SUCCESS (FROM FIGMA IMAGE 3) */}
      {successModalOrder && (
        <PaymentSuccessModal
          order={successModalOrder}
          isOpen={!!successModalOrder}
          onClose={() => setSuccessModalOrder(null)}
          onNewOrder={() => {
            setSuccessModalOrder(null);
            clearCart();
            setViewMode('FLOOR');
          }}
          onViewReceipt={() => {
            setReceiptModalOrder(successModalOrder);
          }}
        />
      )}

      {/* MODAL 8: FULL THERMAL RECEIPT PRINT PREVIEW */}
      {receiptModalOrder && (
        <ReceiptModal
          order={receiptModalOrder}
          isOpen={!!receiptModalOrder}
          onClose={() => setReceiptModalOrder(null)}
        />
      )}

      {/* MODAL 9: OPEN ORDERS MODAL */}
      <OpenOrdersModal
        isOpen={isOpenOrdersOpen}
        onClose={() => setIsOpenOrdersOpen(false)}
        onSelectForPayment={(order) => {
          setActivePaymentOrder(order);
        }}
        onOrderUpdated={refreshAllData}
      />
    </div>
  );
};
