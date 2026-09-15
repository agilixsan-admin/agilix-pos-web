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
  taxPercent: number; // default 10% (PB1)
  servicePercent: number; // default 0% or customizable
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
      taxPercent: 10,
      servicePercent: 0,
      discountId: null,
      discountName: null,
      discountAmount: 0,

      addItem: (product, variant, quantity = 1, notes = '') => {
        set((state) => {
          const selectedVariant = variant || (product.variants && product.variants.length > 0 ? product.variants[0] : undefined);
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

          const newItem: CartItem = {
            id: itemId,
            productId: product.id,
            variantId: variantId,
            name: product.name,
            variantName: selectedVariant?.name,
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
        const subtotal = get().getSubtotal();
        const discount = get().getDiscount();
        const service = get().getServiceCharge();
        const taxable = Math.max(0, subtotal - discount + service);
        const rate = get().taxPercent / 100;
        return Math.round(taxable * rate);
      },

      getTotal: () => {
        const subtotal = get().getSubtotal();
        const discount = get().getDiscount();
        const service = get().getServiceCharge();
        const tax = get().getTax();
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
        servicePercent: state.servicePercent,
        discountId: state.discountId,
        discountName: state.discountName,
        discountAmount: state.discountAmount,
      }),
    }
  )
);
