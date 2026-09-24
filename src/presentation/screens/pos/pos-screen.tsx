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
import { PaymentModal } from './payment-modal';
import { PaymentSuccessModal } from './payment-success-modal';
import { ReceiptModal } from './receipt-modal';
import { OpenOrdersModal } from './open-orders-modal';
import { OpenShiftModal } from './open-shift-modal';
import { PettyCashModal } from './petty-cash-modal';
import { CloseShiftModal } from './close-shift-modal';
import { useCurrentShift } from '@domain/hooks/queries/use-shift-query';
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
  Search,
  Receipt,
  ArrowUpRight,
  Lock,
  Banknote,
  LayoutGrid,
  Building2,
  Send,
  X,
  ChevronRight,
  Ban,
} from 'lucide-react';
import {
  Button,
  Badge,
  SearchInput,
  LoadingState,
  EmptyState,
  toast,
  CustomTableSelect,
  CustomOutletSelect,
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
    servicePercent,
    serviceChargeName,
    addItem,
    removeItem,
    updateQuantity,
    updateNotes,
    setOrderType,
    setTable,
    setCustomerName,
    setDiscount,
    setTax,
    setServicePercent,
    clearCart,
    getSubtotal,
    getTax,
    getServiceCharge,
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
  } = useProducts(effectiveOutlet?.id ? { outletId: effectiveOutlet.id } : undefined);

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

  // Sync Tax & Service Charge Configuration with Cart Store
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

    if (taxConfig?.serviceChargeEnabled) {
      setServicePercent(
        Number(taxConfig.serviceChargeRate || 0),
        taxConfig.serviceChargeName,
        taxConfig.serviceChargeApplicableTo,
      );
    } else {
      setServicePercent(0, null, null);
    }
  }, [taxConfig, setTax, setServicePercent]);

  // Reset cart when switching outlet so that items, tables, and settings do not contaminate another branch
  useEffect(() => {
    clearCart();
  }, [currentOutlet?.id, clearCart]);

  const {
    data: currentShift,
    isLoading: shiftLoading,
    refetch: refetchShift,
  } = useCurrentShift(effectiveOutlet?.id);

  const loading = productsLoading || categoriesLoading || tablesLoading;

  const refreshAllData = () => {
    refetchProducts();
    refetchCategories();
    refetchTables();
    refetchOpenOrders();
    refetchShift();
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
  const [activePaymentOrder, setActivePaymentOrder] = useState<Order | null>(null);
  const [activeAppendOrder, setActiveAppendOrder] = useState<Order | null>(null);
  const [successModalOrder, setSuccessModalOrder] = useState<Order | null>(null);
  const [receiptModalOrder, setReceiptModalOrder] = useState<Order | null>(null);
  const [isOpenOrdersOpen, setIsOpenOrdersOpen] = useState<boolean>(false);
  const [isOpenShiftModalOpen, setIsOpenShiftModalOpen] = useState<boolean>(false);
  const [isPettyCashModalOpen, setIsPettyCashModalOpen] = useState<boolean>(false);
  const [isCloseShiftModalOpen, setIsCloseShiftModalOpen] = useState<boolean>(false);
  const [closingShift, setClosingShift] = useState<PosShift | null>(null);
  const [orderProcessing, setOrderProcessing] = useState<boolean>(false);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState<boolean>(false);

  // Preserve shift object during close shift modal workflow
  useEffect(() => {
    if (currentShift && isCloseShiftModalOpen) {
      setClosingShift(currentShift);
    }
  }, [currentShift, isCloseShiftModalOpen]);

  // Auto-prompt Open Shift Modal when cashier opens POS and has no active shift
  useEffect(() => {
    if (!shiftLoading && effectiveOutlet?.id && currentShift === null && !isCloseShiftModalOpen && !closingShift) {
      setIsOpenShiftModalOpen(true);
    }
  }, [shiftLoading, effectiveOutlet?.id, currentShift, isCloseShiftModalOpen, closingShift]);

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
    if (!currentShift) {
      toast.warning('Shift kasir belum dibuka. Silakan buka shift terlebih dahulu untuk memasukkan pesanan.');
      setIsOpenShiftModalOpen(true);
      return;
    }

    if (product.isOutletActive === false) {
      toast.error(`Menu "${product.name}" sedang dinonaktifkan di cabang ini.`);
      return;
    }

    const isOutOfStock = product.isOutOfStock || product.isAvailable === false;
    if (isOutOfStock) {
      toast.error(`Menu "${product.name}" sedang habis (stok bahan baku kosong).`);
      return;
    }

    if (product.variants && product.variants.length > 1) {
      setVariantModalProduct(product);
    } else {
      const primaryVariant = product.variants?.[0];
      if (primaryVariant && (primaryVariant.isOutOfStock || primaryVariant.isAvailable === false)) {
        toast.error(`Menu "${product.name}" sedang habis (stok bahan baku kosong).`);
        return;
      }
      addItem(product);
    }
  };

  const handleSelectVariant = (product: Product, variant: Variant) => {
    if (!currentShift) {
      toast.warning('Shift kasir belum dibuka. Silakan buka shift terlebih dahulu untuk memasukkan pesanan.');
      setIsOpenShiftModalOpen(true);
      return;
    }

    if (product.isOutletActive === false) {
      toast.error(`Menu "${product.name}" sedang dinonaktifkan di cabang ini.`);
      return;
    }
    if (variant.isOutOfStock || variant.isAvailable === false) {
      toast.error(`Varian "${variant.name}" sedang habis (stok bahan baku kosong).`);
      return;
    }
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
      setIsOrderTypeModalOpen(false);
      setActivePaymentOrder(null);
      setIsOpenOrdersOpen(false);
    },
  });

  // Start New Order Trigger
  const handleInitiateNewOrder = () => {
    if (!currentShift) {
      toast.warning('Shift kasir belum dibuka. Silakan buka shift terlebih dahulu untuk memulai pesanan.');
      setIsOpenShiftModalOpen(true);
      return;
    }
    setActiveAppendOrder(null);
    clearCart();
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
    if (!currentShift) {
      toast.warning('Shift kasir belum dibuka. Silakan buka shift terlebih dahulu untuk memilih meja.');
      setIsOpenShiftModalOpen(true);
      return;
    }
    setActiveAppendOrder(null);
    clearCart();
    setOrderType('DINE_IN');
    setTable(table.id, table.name);
    setViewMode('CATALOG');
  };

  // Select Open Order for Append Mode (Mode Tambah Menu ke Pesanan Berjalan)
  const handleSelectOpenOrderForAppend = async (order: Order) => {
    if (!currentShift) {
      toast.warning('Shift kasir belum dibuka. Silakan buka shift terlebih dahulu untuk menambah menu.');
      setIsOpenShiftModalOpen(true);
      return;
    }
    // 1. Clear cart first so we start with empty additional items without wiping table/customer
    clearCart();

    // 2. Set append order state immediately so UI transitions to catalog immediately
    setActiveAppendOrder(order);
    setOrderType(order.orderType || 'DINE_IN');

    // 3. Resolve table & customer
    const clean = (s?: string | null) =>
      (s || '').toLowerCase().replace(/^(meja\s*)/i, '').trim();

    const resolvedTableName =
      order.tableName ||
      order.tableNumber ||
      order.table?.name ||
      order.table?.tableNumber ||
      null;

    const matchedTable = tables.find(
      (t) =>
        (order.tableId && t.id === order.tableId) ||
        (order.table?.id && t.id === order.table?.id) ||
        (resolvedTableName &&
          (t.name.toLowerCase() === resolvedTableName.toLowerCase() ||
            t.tableNumber?.toLowerCase() === resolvedTableName.toLowerCase() ||
            clean(t.name) === clean(resolvedTableName) ||
            clean(t.tableNumber) === clean(resolvedTableName))),
    );

    const finalTableId = matchedTable
      ? matchedTable.id
      : order.tableId || order.table?.id || (resolvedTableName ? `custom_${resolvedTableName}` : null);
    const finalTableName = resolvedTableName || matchedTable?.name || null;

    setTable(finalTableId, finalTableName);
    setCustomerName(order.customerName || '');
    setViewMode('CATALOG');

    // 4. Fetch fresh order details with full items list to guarantee all ordered items are visible
    try {
      const freshOrder = await posService.getOrderById(order.id);
      if (freshOrder) {
        setActiveAppendOrder(freshOrder);
        if (freshOrder.customerName) {
          setCustomerName(freshOrder.customerName);
        }
        const freshTableName =
          freshOrder.tableName ||
          freshOrder.tableNumber ||
          freshOrder.table?.name ||
          freshOrder.table?.tableNumber ||
          finalTableName;
        const freshMatchedTable = tables.find(
          (t) =>
            (freshOrder.tableId && t.id === freshOrder.tableId) ||
            (freshOrder.table?.id && t.id === freshOrder.table?.id) ||
            (freshTableName &&
              (t.name.toLowerCase() === freshTableName.toLowerCase() ||
                t.tableNumber?.toLowerCase() === freshTableName.toLowerCase() ||
                clean(t.name) === clean(freshTableName) ||
                clean(t.tableNumber) === clean(freshTableName))),
        );
        const freshTableId = freshMatchedTable
          ? freshMatchedTable.id
          : freshOrder.tableId || freshOrder.table?.id || (freshTableName ? `custom_${freshTableName}` : finalTableId);
        setTable(freshTableId, freshTableName);
      }
    } catch {
      // Fallback silently if offline or network hiccup
    }
  };

  // Direct Instant Checkout
  const handleCheckoutDirect = async () => {
    if (!currentShift) {
      toast.warning('Shift kasir belum dibuka. Silakan buka shift terlebih dahulu sebelum menyelesaikan transaksi.');
      setIsOpenShiftModalOpen(true);
      return;
    }

    const activeOutlet = currentOutlet || effectiveOutlet;
    if (!activeOutlet?.id) {
      toast.warning('Silakan pilih cabang/outlet aktif terlebih dahulu.');
      return;
    }
    if (!currentOutlet && activeOutlet) {
      setCurrentOutlet(activeOutlet);
    }
    if (!activeAppendOrder && cartItems.length === 0) return;

    setOrderProcessing(true);
    try {
      const payloadItems = cartItems.map((item) => ({
        productId: item.productId,
        variantId: item.variantId || item.productId,
        quantity: item.quantity,
        notes: item.notes,
      }));

      if (activeAppendOrder) {
        if (cartItems.length === 0) {
          // Kasir langsung ingin bayar pesanan berjalan tanpa ada tambahan menu baru
          setActivePaymentOrder(activeAppendOrder);
          setActiveAppendOrder(null);
          return;
        }

        // APPEND MODE: Tambah item ke order berjalan terlebih dahulu, lalu buka pembayaran
        const updatedOrder = await posService.addItemsToOrder(activeAppendOrder.id, payloadItems);
        clearCart();
        setActiveAppendOrder(null);
        refreshAllData();
        setActivePaymentOrder(updatedOrder);
        return;
      }

      if (orderType === 'DINE_IN' && !tableId) {
        toast.warning('Silakan pilih nomor meja untuk pesanan Dine In.');
        setViewMode('FLOOR');
        return;
      }

      const createdOrder = await posService.createOrder({
        outletId: activeOutlet.id,
        orderType: orderType as OrderType,
        tableId: tableId || undefined,
        customerName: customerName || undefined,
        discountId: discountId || undefined,
        discountAmount: discountAmount || undefined,
        serviceCharge: getServiceCharge(),
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
      toast.error(errorMsg);
    } finally {
      setOrderProcessing(false);
    }
  };

  // Save as Open Order
  const handleSaveOpenOrder = async () => {
    if (!currentShift) {
      toast.warning('Shift kasir belum dibuka. Silakan buka shift terlebih dahulu sebelum menyimpan transaksi.');
      setIsOpenShiftModalOpen(true);
      return;
    }

    const activeOutlet = currentOutlet || effectiveOutlet;
    if (!activeOutlet?.id) {
      toast.warning('Silakan pilih cabang/outlet aktif terlebih dahulu.');
      return;
    }
    if (!currentOutlet && activeOutlet) {
      setCurrentOutlet(activeOutlet);
    }
    if (cartItems.length === 0) return;

    setOrderProcessing(true);
    try {
      const payloadItems = cartItems.map((item) => ({
        productId: item.productId,
        variantId: item.variantId || item.productId,
        quantity: item.quantity,
        notes: item.notes,
      }));

      if (activeAppendOrder) {
        // APPEND MODE: Tambah item ke order berjalan yang sudah ada
        await posService.addItemsToOrder(activeAppendOrder.id, payloadItems);
        clearCart();
        setActiveAppendOrder(null);
        refreshAllData();
        setViewMode('FLOOR');
        toast.success('Tambahan menu berhasil dikirim ke pesanan.');
        return;
      }

      if (orderType === 'DINE_IN' && !tableId) {
        toast.warning('Silakan pilih nomor meja untuk pesanan Dine In.');
        setViewMode('FLOOR');
        return;
      }

      await posService.createOrder({
        outletId: activeOutlet.id,
        orderType: orderType as OrderType,
        tableId: tableId || undefined,
        customerName: customerName || undefined,
        discountId: discountId || undefined,
        discountAmount: discountAmount || undefined,
        serviceCharge: getServiceCharge(),
        taxAmount: getTax(),
        items: payloadItems,
      });

      clearCart();
      refreshAllData();
      setViewMode('FLOOR');
      toast.success('Pesanan berhasil dikirim.');
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Gagal mengirim pesanan.';
      toast.error(errorMsg);
    } finally {
      setOrderProcessing(false);
    }
  };

  const renderCartContent = (isMobileSheet = false) => {
    const clean = (s?: string | null) =>
      (s || '').toLowerCase().replace(/^(meja\s*)/i, '').trim();

    const resolvedAppendTableName =
      activeAppendOrder?.tableName ||
      activeAppendOrder?.tableNumber ||
      activeAppendOrder?.table?.name ||
      activeAppendOrder?.table?.tableNumber ||
      null;
    const matchedAppendTable = activeAppendOrder
      ? tables.find(
          (t) =>
            (activeAppendOrder.tableId && t.id === activeAppendOrder.tableId) ||
            (activeAppendOrder.table?.id && t.id === activeAppendOrder.table?.id) ||
            (resolvedAppendTableName &&
              (t.name.toLowerCase() === resolvedAppendTableName.toLowerCase() ||
                t.tableNumber?.toLowerCase() === resolvedAppendTableName.toLowerCase() ||
                clean(t.name) === clean(resolvedAppendTableName) ||
                clean(t.tableNumber) === clean(resolvedAppendTableName))),
        )
      : undefined;
    const effectiveTableId = activeAppendOrder
      ? matchedAppendTable?.id ||
        activeAppendOrder.tableId ||
        activeAppendOrder.table?.id ||
        tableId ||
        (resolvedAppendTableName ? `custom_${resolvedAppendTableName}` : null)
      : tableId;
    const effectiveCustomerName = activeAppendOrder
      ? (activeAppendOrder.customerName ?? customerName ?? '')
      : customerName;
    const effectiveOrderType = activeAppendOrder
      ? (activeAppendOrder.orderType || 'DINE_IN')
      : orderType;

    const previousSubtotal = activeAppendOrder
      ? Number(activeAppendOrder.subtotal || 0)
      : 0;
    const previousTotalAmount = activeAppendOrder
      ? Number(activeAppendOrder.totalAmount || 0)
      : 0;
    const currentTotalAmount = getTotal();
    const grandTotal = activeAppendOrder
      ? cartItems.length > 0
        ? previousTotalAmount + currentTotalAmount
        : previousTotalAmount
      : currentTotalAmount;

    return (
      <div
        className={`flex flex-col h-full overflow-hidden ${isMobileSheet ? 'bg-white' : ''}`}
      >
        {/* Cart Header & Order Type Switcher */}
        <div className="p-3 sm:p-4 border-b border-slate-100 space-y-3 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-[#0D5C53]" />
              <span className="font-bold text-slate-800 text-sm">
                Keranjang Pesanan ({cartItems.length})
              </span>
            </div>
            <div className="flex items-center gap-2">
              {cartItems.length > 0 && (
                <button
                  onClick={() => {
                    if (activeAppendOrder) {
                      useCartStore.setState({ items: [] });
                    } else {
                      clearCart();
                    }
                  }}
                  className="text-xs font-semibold text-rose-500 hover:text-rose-700 cursor-pointer"
                >
                  Reset
                </button>
              )}
              {isMobileSheet && (
                <button
                  onClick={() => setIsMobileCartOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Dine In / Take Away Switcher */}
          <div
            className={`grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl ${activeAppendOrder ? 'opacity-70 pointer-events-none' : ''}`}
          >
            <button
              onClick={() => setOrderType('DINE_IN')}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                effectiveOrderType === 'DINE_IN'
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
                effectiveOrderType === 'TAKE_AWAY'
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
            {effectiveOrderType === 'DINE_IN' && (
              <CustomTableSelect
                tables={tables}
                selectedTableId={effectiveTableId}
                disabled={Boolean(activeAppendOrder)}
                resolvedAppendTableName={resolvedAppendTableName}
                onSelectTable={(sel) => setTable(sel ? sel.id : null, sel ? sel.name : null)}
              />
            )}

            <div
              className={effectiveOrderType === 'DINE_IN' ? '' : 'col-span-2'}
            >
              <input
                type="text"
                disabled={Boolean(activeAppendOrder)}
                placeholder="Nama Pelanggan (Opsional)"
                value={effectiveCustomerName || ''}
                onChange={(e) => setCustomerName(e.target.value)}
                className={`w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53] ${activeAppendOrder ? 'opacity-95 font-medium bg-slate-100/90 text-slate-800 cursor-not-allowed' : ''}`}
              />
            </div>
          </div>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 divide-y divide-slate-100 min-h-[160px] space-y-3">
          {/* SECTION 1: EXISTING ACTIVE ORDER ITEMS */}
          {activeAppendOrder && (
            <div className="pb-3 space-y-2">
              <div className="flex items-center justify-between pb-1.5 border-b border-amber-200">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse inline-block" />
                  Pesanan Berjalan (Sudah Dikirim)
                </span>
                <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                  {(
                    activeAppendOrder.items?.filter(
                      (i) => !i.status || i.status === 'ACTIVE',
                    ) || []
                  ).length}{' '}
                  Menu
                </span>
              </div>

              {!activeAppendOrder.items || activeAppendOrder.items.length === 0 ? (
                <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200/80 text-center text-xs text-amber-800">
                  Memuat rincian menu pesanan...
                </div>
              ) : (
                <div className="bg-amber-50/70 rounded-xl p-2.5 border border-amber-200/80 space-y-2 max-h-48 overflow-y-auto">
                  {activeAppendOrder.items
                    .filter((item) => !item.status || item.status === 'ACTIVE')
                    .map((item, idx) => (
                      <div
                        key={item.id || idx}
                        className="flex items-start justify-between text-xs"
                      >
                        <div className="flex-1 pr-2">
                          <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                            <span className="font-bold text-amber-900 bg-amber-100 px-1.5 py-0.5 rounded text-[10px]">
                              {item.quantity}x
                            </span>
                            <span>{item.productName}</span>
                          </div>
                          {item.variantName && !item.variantName.trim().toLowerCase().includes('default') && (
                            <span className="text-[10px] text-slate-500 block pl-6">
                              Varian: {item.variantName}
                            </span>
                          )}
                          {item.notes && (
                            <span className="text-[10px] text-amber-800 italic block pl-6">
                              Catatan: {item.notes}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="font-mono text-xs font-semibold text-slate-700">
                            Rp{' '}
                            {Number(
                              item.subtotal ??
                                Number(item.unitPrice || item.price || 0) *
                                  item.quantity,
                            ).toLocaleString('id-ID')}
                          </span>
                          <button
                            type="button"
                            title="Batalkan menu ini (Void)"
                            onClick={() =>
                              setVoidModalItem({
                                orderId: activeAppendOrder.id,
                                itemId: item.id,
                                name: `${item.productName}${
                                  item.variantName &&
                                  !item.variantName.trim().toLowerCase().includes('default')
                                    ? ` (${item.variantName})`
                                    : ''
                                }`,
                              })
                            }
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-100/80 rounded transition-colors"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}

                  <div className="pt-2 mt-1 border-t border-amber-200 flex justify-between text-xs font-bold text-amber-950">
                    <span>Subtotal Terpesan</span>
                    <span className="font-mono">
                      Rp {previousSubtotal.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SECTION 2: NEW ITEMS HEADER */}
          {activeAppendOrder && (
            <div className="pt-2 pb-1">
              <div className="flex items-center justify-between pb-1 border-b border-teal-200">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#0D5C53] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#0D5C53] inline-block" />
                  Tambahan Menu Baru
                </span>
                {cartItems.length > 0 && (
                  <span className="text-[10px] bg-teal-100 text-teal-800 font-bold px-2 py-0.5 rounded-full">
                    {cartItems.length} Menu Baru
                  </span>
                )}
              </div>
            </div>
          )}

          {/* SECTION 3: NEW ITEMS LIST OR EMPTY PLACEHOLDER */}
          {cartItems.length === 0 ? (
            <div className="py-6 flex flex-col items-center justify-center text-slate-300">
              <ShoppingBag className="w-8 h-8 stroke-[1.5] mb-1.5 opacity-30 text-teal-700" />
              <p className="text-xs font-semibold text-slate-500">
                {activeAppendOrder
                  ? 'Belum Ada Tambahan Menu'
                  : 'Keranjang Masih Kosong'}
              </p>
              <p className="text-[11px] text-slate-400 text-center mt-0.5 max-w-[220px]">
                {activeAppendOrder
                  ? 'Pilih menu di sebelah kiri untuk menambah menu ke pesanan ini.'
                  : 'Pilih menu di sebelah kiri untuk membuat pesanan.'}
              </p>
            </div>
          ) : (
            cartItems.map((item) => (
              <div
                key={item.id}
                className="py-2.5 first:pt-0 last:pb-0 flex flex-col gap-1.5"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 pr-2">
                    <h5 className="font-semibold text-slate-800 text-xs leading-tight">
                      {item.name}
                    </h5>
                    {item.variantName && !item.variantName.trim().toLowerCase().includes('default') && (
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
                    <span className="w-6 text-center text-xs font-bold text-slate-800">
                      {item.quantity}
                    </span>
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
        <div className="p-3 sm:p-4 border-t border-slate-100 bg-slate-50/50 space-y-3 shrink-0">
          <div className="space-y-1.5 text-xs text-slate-500">
            {activeAppendOrder && (
              <div className="flex justify-between text-amber-900 font-medium">
                <span>Pesanan Sebelumnya</span>
                <span className="font-mono">
                  Rp {previousTotalAmount.toLocaleString('id-ID')}
                </span>
              </div>
            )}

            <div className="flex justify-between">
              <span>
                {activeAppendOrder ? 'Tambahan Menu Baru' : 'Subtotal'}
              </span>
              <span className="font-semibold text-slate-800">
                Rp {getSubtotal().toLocaleString('id-ID')}
              </span>
            </div>

            {getDiscount() > 0 && (
              <div className="flex justify-between items-center text-xs text-emerald-600">
                <span>Diskon</span>
                <span className="font-bold">
                  -Rp {getDiscount().toLocaleString('id-ID')}
                </span>
              </div>
            )}

            {getServiceCharge() > 0 && (
              <div className="flex justify-between">
                <span>
                  {serviceChargeName || 'Service Charge'} ({servicePercent}%)
                </span>
                <span className="font-semibold text-slate-800">
                  Rp {getServiceCharge().toLocaleString('id-ID')}
                </span>
              </div>
            )}

            {getTax() > 0 && (
              <div className="flex justify-between">
                <span>
                  {taxName || 'Pajak'} ({taxPercent}%)
                </span>
                <span className="font-semibold text-slate-800">
                  Rp {getTax().toLocaleString('id-ID')}
                </span>
              </div>
            )}

            <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-1.5 border-t border-slate-200">
              <span>
                {activeAppendOrder ? 'Total Tagihan Meja' : 'Total Tagihan'}
              </span>
              <span className="text-[#0D5C53] text-base font-mono">
                Rp {grandTotal.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          {!currentShift && (
            <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-800">
              <div className="flex items-center gap-1.5 font-medium">
                <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Shift kasir belum dibuka</span>
              </div>
              <button
                type="button"
                onClick={() => setIsOpenShiftModalOpen(true)}
                className="text-[11px] font-bold text-emerald-800 hover:text-emerald-900 underline cursor-pointer"
              >
                Buka Shift
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 pt-1">
            <Button
              variant="outline"
              disabled={cartItems.length === 0 || orderProcessing || !currentShift}
              leftIcon={<Send className="w-3.5 h-3.5 text-teal-700" />}
              onClick={() => {
                if (!currentShift) {
                  toast.warning('Shift kasir belum dibuka. Silakan buka shift terlebih dahulu.');
                  setIsOpenShiftModalOpen(true);
                  return;
                }
                if (isMobileSheet) setIsMobileCartOpen(false);
                handleSaveOpenOrder();
              }}
            >
              {activeAppendOrder ? 'Kirim Tambahan' : 'Kirim Pesanan'}
            </Button>

            <Button
              variant="primary"
              disabled={
                orderProcessing ||
                (!activeAppendOrder && cartItems.length === 0) ||
                !currentShift
              }
              isLoading={orderProcessing}
              leftIcon={<CreditCard className="w-4 h-4" />}
              onClick={() => {
                if (!currentShift) {
                  toast.warning('Shift kasir belum dibuka. Silakan buka shift terlebih dahulu.');
                  setIsOpenShiftModalOpen(true);
                  return;
                }
                if (isMobileSheet) setIsMobileCartOpen(false);
                handleCheckoutDirect();
              }}
              className="font-bold shadow-md shadow-teal-900/10"
            >
              {activeAppendOrder
                ? cartItems.length > 0
                  ? 'Tambah & Bayar'
                  : 'Bayar Langsung'
                : 'Bayar Sekarang'}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-[calc(100vh-6rem)] overflow-hidden flex flex-col">
      {/* VIEW 1: TABLE FLOOR PLAN & ACTIVE ORDERS (HOME POS) */}
      {viewMode === 'FLOOR' ? (
        <TableFloorView
          tables={tables}
          openOrders={openOrders}
          loading={loading || openOrdersLoading}
          currentShift={currentShift}
          onSelectTableForOrder={handleSelectTableForOrder}
          onSelectOpenOrderForPayment={(order) => setActivePaymentOrder(order)}
          onSelectOpenOrderForAppend={handleSelectOpenOrderForAppend}
          onNewOrderClick={handleInitiateNewOrder}
          onOpenShiftClick={() => setIsOpenShiftModalOpen(true)}
          onPettyCashClick={() => setIsPettyCashModalOpen(true)}
          onCloseShiftClick={() => setIsCloseShiftModalOpen(true)}
        />
      ) : (
        /* VIEW 2: MENU CATALOG & CART MANAGEMENT */
        <div className="flex-1 flex gap-3 sm:gap-4 overflow-hidden p-2 sm:p-4 bg-slate-50 relative">
          {/* Left: Product Catalog & Category Tabs */}
          <div className="flex-1 flex flex-col bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            {/* Top Filter Bar */}
            <div className="p-2.5 sm:p-4 border-b border-slate-100 space-y-2.5 sm:space-y-3">
              <div className="flex items-center justify-between gap-2 sm:gap-3 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<ArrowLeft className="w-4 h-4" />}
                  onClick={() => {
                    setActiveAppendOrder(null);
                    clearCart();
                    setViewMode('FLOOR');
                  }}
                >
                  <span className="hidden sm:inline">Denah Meja</span>
                  <span className="sm:hidden">Meja</span>
                </Button>

                {outlets && outlets.length > 1 ? (
                  <CustomOutletSelect
                    outlets={outlets}
                    selectedOutletId={effectiveOutlet?.id}
                    onSelectOutlet={(found) => setCurrentOutlet(found)}
                    compact
                  />
                ) : (
                  <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 shrink-0 text-xs font-semibold text-slate-700">
                    <Building2 className="w-3.5 h-3.5 text-[#0D5C53]" />
                    <span>{effectiveOutlet?.name || 'Outlet Utama'}</span>
                  </div>
                )}

                <div className="flex-1 max-w-md min-w-[120px]">
                  <SearchInput
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Cari menu kopi, makanan, cemilan..."
                  />
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Clock className="w-4 h-4 text-amber-600" />}
                    onClick={() => setIsOpenOrdersOpen(true)}
                  >
                    <span className="hidden sm:inline">Pesanan ({openOrders.length})</span>
                    <span className="sm:hidden">({openOrders.length})</span>
                  </Button>

                  {currentShift ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<ArrowUpRight className="w-3.5 h-3.5 text-rose-600" />}
                        onClick={() => setIsPettyCashModalOpen(true)}
                        className="text-xs font-semibold text-rose-700 hover:bg-rose-50 border-rose-200"
                      >
                        <span className="hidden sm:inline">Kas Keluar / Beli Bahan</span>
                        <span className="sm:hidden">Beli Bahan</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<Lock className="w-3.5 h-3.5 text-slate-600" />}
                        onClick={() => setIsCloseShiftModalOpen(true)}
                        className="text-xs font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        <span className="hidden sm:inline">Tutup Shift</span>
                        <span className="sm:hidden">Tutup</span>
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<Banknote className="w-3.5 h-3.5 text-emerald-600" />}
                      onClick={() => setIsOpenShiftModalOpen(true)}
                      className="text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border-emerald-300"
                    >
                      Buka Shift
                    </Button>
                  )}
                </div>
              </div>

              {/* Shift Not Open Warning Banner in Catalog */}
              {!currentShift && (
                <div className="bg-amber-500/10 border border-amber-300 rounded-2xl p-3 sm:p-3.5 flex items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
                      <Lock className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-amber-900">Shift Kasir Belum Dibuka</h4>
                      <p className="text-[11px] text-amber-700">
                        Buka shift terlebih dahulu dengan memasukkan modal awal kasir untuk memulai transaksi pesanan.
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => setIsOpenShiftModalOpen(true)}
                    leftIcon={<Banknote className="w-3.5 h-3.5" />}
                    className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0 shadow-xs"
                  >
                    Buka Shift
                  </Button>
                </div>
              )}

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
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 pb-24 lg:pb-4">
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
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3.5">
                  {filteredProducts.map((product) => {
                    const rawImageUrl = product.imageUrl || product.image;
                    const imageUrl = rawImageUrl?.startsWith('htts://')
                      ? rawImageUrl.replace(/^htts:\/\//, 'https://')
                      : rawImageUrl;
                    const hasVariants = product.variants && product.variants.length > 1;
                    const isInactiveInOutlet = product.isOutletActive === false;
                    const isOutOfStock = !isInactiveInOutlet && (product.isOutOfStock || product.isAvailable === false);
                    const isUnavailable = isInactiveInOutlet || isOutOfStock;

                    return (
                      <div
                        key={product.id}
                        onClick={() => handleProductClick(product)}
                        className={`rounded-2xl p-3.5 flex flex-col justify-between transition-all select-none ${
                          isUnavailable
                            ? 'bg-slate-100/70 border border-slate-200 opacity-60 grayscale cursor-not-allowed shadow-none'
                            : 'bg-white border border-slate-200 hover:border-[#0D5C53]/60 hover:shadow-md cursor-pointer group active:scale-[0.98]'
                        }`}
                      >
                        <div>
                          {/* Product Thumbnail with Image Fallback */}
                          <div className="w-full h-28 bg-slate-100 rounded-xl mb-2.5 flex items-center justify-center overflow-hidden relative">
                            {imageUrl ? (
                              <img
                                src={imageUrl}
                                alt={product.name}
                                className={`w-full h-full object-cover transition-transform duration-300 ${
                                  isUnavailable ? 'grayscale' : 'group-hover:scale-105'
                                }`}
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
                              <Coffee
                                className={`w-8 h-8 text-slate-300 transition-colors ${
                                  isUnavailable ? 'text-slate-400' : 'group-hover:text-[#0D5C53]'
                                }`}
                              />
                            )}

                            {/* Nonaktif di Cabang vs Habis Overlay Badge on Image */}
                            {isInactiveInOutlet ? (
                              <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[1px] flex items-center justify-center z-10 p-1 text-center">
                                <span className="bg-slate-800 text-slate-100 font-bold text-[10px] sm:text-xs px-2.5 py-1 rounded-full shadow-md border border-slate-600/60">
                                  Nonaktif di Cabang
                                </span>
                              </div>
                            ) : isOutOfStock ? (
                              <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[1px] flex items-center justify-center z-10">
                                <span className="bg-rose-600 text-white font-black text-xs px-3 py-1 rounded-full uppercase tracking-wider shadow-md border border-rose-400/40 animate-pulse">
                                  Habis
                                </span>
                              </div>
                            ) : null}

                            {hasVariants && (
                              <span className="absolute top-2 right-2 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs z-20">
                                {product.variants?.length} Varian
                              </span>
                            )}
                          </div>

                          <h4
                            className={`font-bold text-sm leading-snug line-clamp-2 mb-1 transition-colors ${
                              isUnavailable
                                ? 'text-slate-500 line-through decoration-slate-400'
                                : 'text-slate-800 group-hover:text-[#0D5C53]'
                            }`}
                          >
                            {product.name}
                          </h4>
                          {product.categoryName && (
                            <span className="text-[10px] text-slate-400 font-medium">{product.categoryName}</span>
                          )}
                        </div>

                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
                          <div>
                            {product.minPrice !== undefined && product.maxPrice !== undefined && product.maxPrice > product.minPrice ? (
                              <span
                                className={`font-bold text-xs ${
                                  isUnavailable ? 'text-slate-400' : 'text-[#0D5C53]'
                                }`}
                              >
                                Rp {Number(product.minPrice).toLocaleString('id-ID')} - {Number(product.maxPrice).toLocaleString('id-ID')}
                              </span>
                            ) : (
                              <span
                                className={`font-bold text-sm ${
                                  isUnavailable ? 'text-slate-400' : 'text-[#0D5C53]'
                                }`}
                              >
                                Rp {Number(product.price ?? product.minPrice ?? 0).toLocaleString('id-ID')}
                              </span>
                            )}
                          </div>

                          {isInactiveInOutlet ? (
                            <div className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-bold border border-slate-300">
                              Nonaktif
                            </div>
                          ) : isOutOfStock ? (
                            <div className="px-2 py-0.5 bg-rose-50 text-rose-600 rounded-md text-[10px] font-bold border border-rose-200/80">
                              Habis
                            </div>
                          ) : (
                            <div className="w-7 h-7 bg-teal-50 group-hover:bg-[#0D5C53] text-[#0D5C53] group-hover:text-white rounded-lg flex items-center justify-center transition-colors shadow-xs">
                              <Plus className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right: Desktop Cart & Checkout Panel */}
          <div className="hidden lg:flex w-84 xl:w-96 bg-white border border-slate-200 rounded-2xl shadow-xs flex-col overflow-hidden shrink-0">
            {renderCartContent(false)}
          </div>
        </div>
      )}

      {/* Floating Bottom Cart Bar on Mobile / Tablet Portrait */}
      {cartItems.length > 0 && viewMode === 'CATALOG' && (
        <div className="lg:hidden fixed bottom-4 left-4 right-4 z-30 animate-in slide-in-from-bottom duration-300">
          <button
            onClick={() => setIsMobileCartOpen(true)}
            className="w-full bg-[#0D5C53] hover:bg-[#0A4841] text-white px-4 py-3.5 rounded-2xl shadow-xl flex items-center justify-between font-semibold active:scale-[0.99] transition-transform cursor-pointer border border-teal-600/30"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center font-bold text-xs text-white">
                {getItemCount()}
              </div>
              <div className="text-left">
                <p className="text-[11px] text-teal-100 font-medium leading-none">Total Tagihan</p>
                <p className="text-sm font-bold text-white leading-tight mt-0.5">
                  Rp {getTotal().toLocaleString('id-ID')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-xl transition-colors">
              <span>Lihat Keranjang</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      )}

      {/* Mobile Cart Bottom Sheet Modal */}
      {isMobileCartOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            onClick={() => setIsMobileCartOpen(false)}
            className="flex-1 w-full"
          />
          <div className="bg-white rounded-t-3xl max-h-[85vh] h-[80vh] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300">
            {renderCartContent(true)}
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


      {/* MODAL 5: VOID ITEM CONFIRMATION */}
      {voidModalItem && (
        <VoidItemModal
          isOpen={!!voidModalItem}
          onClose={() => setVoidModalItem(null)}
          itemName={voidModalItem.name}
          onConfirmVoid={async (reason, password) => {
            const result = await posService.voidOrderItem(
              voidModalItem.orderId,
              voidModalItem.itemId,
              reason,
              password,
            );
            refreshAllData();
            if (result?.order?.status === 'VOID') {
              setActiveAppendOrder(null);
              clearCart();
              toast.success('Seluruh menu dibatalkan. Meja telah dikosongkan.');
            } else if (result?.order) {
              setActiveAppendOrder(result.order);
              toast.success('Menu berhasil dibatalkan (void).');
            } else {
              toast.success('Menu berhasil dibatalkan (void).');
            }
          }}
        />
      )}

      {/* MODAL 6: PAYMENT CHECKOUT */}
      {activePaymentOrder && (
        <PaymentModal
          order={activePaymentOrder}
          isOpen={!!activePaymentOrder}
          taxName={taxName || taxConfig?.defaultGlobalTax?.name}
          onClose={() => setActivePaymentOrder(null)}
          onPaymentSuccess={(completed) => {
            setActivePaymentOrder(null);
            setActiveAppendOrder(null);
            clearCart();
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
          taxName={taxName || taxConfig?.defaultGlobalTax?.name}
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
        onSelectForAppend={handleSelectOpenOrderForAppend}
        onOrderUpdated={refreshAllData}
      />

      {/* MODAL 10: OPEN SHIFT MODAL */}
      <OpenShiftModal
        isOpen={isOpenShiftModalOpen}
        onClose={() => setIsOpenShiftModalOpen(false)}
        outletId={effectiveOutlet?.id || ''}
        outletName={effectiveOutlet?.name || 'Outlet Utama'}
      />

      {/* MODAL 11: PETTY CASH (KAS KELUAR) MODAL */}
      <PettyCashModal
        isOpen={isPettyCashModalOpen}
        onClose={() => setIsPettyCashModalOpen(false)}
        outletId={effectiveOutlet?.id || ''}
        currentExpectedCash={currentShift?.currentExpectedCash}
      />

      {/* MODAL 12: CLOSE SHIFT MODAL */}
      {(currentShift || closingShift) && (
        <CloseShiftModal
          isOpen={isCloseShiftModalOpen}
          onClose={() => {
            setIsCloseShiftModalOpen(false);
            setClosingShift(null);
            refreshAllData();
          }}
          currentShift={currentShift || closingShift!}
          openOrders={openOrders}
          onShiftClosedSuccess={() => {
            refreshAllData();
          }}
        />
      )}
    </div>
  );
};
