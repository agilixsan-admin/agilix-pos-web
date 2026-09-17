import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, OrderType } from '@model/Order';
import type { Product, Variant } from '@model/Product';

interface CartStoreState {
  items: CartItem[];
  orderType: OrderType;
  tableId: string | null;
  tableName: string | null;
  customerName: string;
  taxPercent: number;
  taxName: string | null;
  taxType: 'INCLUSIVE' | 'EXCLUSIVE' | null;
  servicePercent: number;
  discountId: string | null;
  discountName: string | null;
  discountAmount: number;

  // Actions
  addItem: (product: Product, variant?: Variant, quantity?: number, notes?: string) => void;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  updateNotes: (cartItemId: string, notes: string) => void;
  setOrderType: (type: OrderType) => void;
  setTable: (tableId: string | null, tableName: string | null) => void;
  setCustomerName: (name: string) => void;
  setDiscount: (discountId: string | null, discountName: string | null, amount: number) => void;
  setDiscountAmount: (discount: number) => void;
  setTax: (taxPercent: number, taxName?: string | null, taxType?: 'INCLUSIVE' | 'EXCLUSIVE' | null) => void;
  setTaxPercent: (taxPercent: number) => void;
  setServicePercent: (servicePercent: number) => void;
  clearCart: () => void;

  // Getters & Calculations
  getSubtotal: () => number;
  getDiscount: () => number;
  getTax: () => number;
  getServiceCharge: () => number;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartStoreState>()(
  persist(
    (set, get) => ({
      items: [],
      orderType: 'DINE_IN',
      tableId: null,
      tableName: null,
      customerName: '',
      taxPercent: 0,
      taxName: null,
      taxType: null,
      servicePercent: 0,
      discountId: null,
      discountName: null,
      discountAmount: 0,

      addItem: (product, variant, quantity = 1, notes = '') => {
        // Prevent adding out-of-stock items (raw material exhausted)
        const selectedVariant = variant || (product.variants && product.variants.length > 0 ? product.variants[0] : undefined);
        if (product.isOutOfStock || product.isAvailable === false) {
          return;
        }
        if (selectedVariant && (selectedVariant.isOutOfStock || selectedVariant.isAvailable === false)) {
          return;
        }

        set((state) => {
          const variantId = selectedVariant?.id;
          const itemId = variantId ? `${product.id}-${variantId}` : `${product.id}-default`;
          const existingIndex = state.items.findIndex((item) => item.id === itemId);
          const price = selectedVariant ? Number(selectedVariant.price) : Number(product.price ?? 0);

          if (existingIndex > -1) {
            const updated = [...state.items];
            updated[existingIndex] = {
              ...updated[existingIndex],
              quantity: updated[existingIndex].quantity + quantity,
              notes: notes || updated[existingIndex].notes,
            };
            return { items: updated };
          }

          const rawVariantName = selectedVariant?.name;
          const isDefaultVariant =
            !rawVariantName ||
            rawVariantName.trim().toLowerCase() === 'default' ||
            rawVariantName.trim().toLowerCase() === product.name.trim().toLowerCase();

          const newItem: CartItem = {
            id: itemId,
            productId: product.id,
            variantId: variantId,
            name: product.name,
            variantName: isDefaultVariant ? undefined : rawVariantName,
            price,
            costPrice: selectedVariant?.costPrice || product.costPrice || 0,
            quantity,
            notes,
          };

          return { items: [...state.items, newItem] };
        });
      },

      removeItem: (cartItemId) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== cartItemId),
        }));
      },

      updateQuantity: (cartItemId, quantity) => {
        set((state) => {
          if (quantity <= 0) {
            return { items: state.items.filter((item) => item.id !== cartItemId) };
          }
          return {
            items: state.items.map((item) =>
              item.id === cartItemId ? { ...item, quantity } : item
            ),
          };
        });
      },

      updateNotes: (cartItemId, notes) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === cartItemId ? { ...item, notes } : item
          ),
        }));
      },

      setOrderType: (orderType) => set({ orderType }),

      setTable: (tableId, tableName) => set({ tableId, tableName }),

      setCustomerName: (customerName) => set({ customerName }),

      setDiscount: (discountId, discountName, discountAmount) =>
        set({ discountId, discountName, discountAmount }),

      setDiscountAmount: (discountAmount) => set({ discountAmount }),

      setTax: (taxPercent, taxName = null, taxType = null) =>
        set({ taxPercent, taxName: taxName || null, taxType: taxType || null }),

      setTaxPercent: (taxPercent) => set({ taxPercent }),

      setServicePercent: (servicePercent) => set({ servicePercent }),

      clearCart: () =>
        set({
          items: [],
          customerName: '',
          tableId: null,
          tableName: null,
          discountId: null,
          discountName: null,
          discountAmount: 0,
        }),

      getSubtotal: () => {
        return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      },

      getDiscount: () => {
        const subtotal = get().getSubtotal();
        const discount = get().discountAmount;
        return Math.min(discount, subtotal);
      },

      getServiceCharge: () => {
        const subtotal = get().getSubtotal();
        const discount = get().getDiscount();
        const taxable = Math.max(0, subtotal - discount);
        const rate = get().servicePercent / 100;
        return Math.round(taxable * rate);
      },

      getTax: () => {
        const rate = get().taxPercent;
        if (!rate || rate <= 0) return 0;
        const subtotal = get().getSubtotal();
        const discount = get().getDiscount();
        const service = get().getServiceCharge();
        const taxable = Math.max(0, subtotal - discount + service);

        if (get().taxType === 'INCLUSIVE') {
          return Math.round(taxable - taxable / (1 + rate / 100));
        }
        return Math.round((taxable * rate) / 100);
      },

      getTotal: () => {
        const subtotal = get().getSubtotal();
        const discount = get().getDiscount();
        const service = get().getServiceCharge();
        const isInclusive = get().taxType === 'INCLUSIVE';
        const tax = isInclusive ? 0 : get().getTax();
        return Math.max(0, subtotal - discount + service + tax);
      },

      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0);
      },
    }),
    {
      name: 'agilix_pos_cart',
      partialize: (state) => ({
        items: state.items,
        orderType: state.orderType,
        tableId: state.tableId,
        tableName: state.tableName,
        customerName: state.customerName,
        taxPercent: state.taxPercent,
        taxName: state.taxName,
        taxType: state.taxType,
        servicePercent: state.servicePercent,
        discountId: state.discountId,
        discountName: state.discountName,
        discountAmount: state.discountAmount,
      }),
    }
  )
);
