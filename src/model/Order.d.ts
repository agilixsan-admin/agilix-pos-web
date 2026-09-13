export type OrderType = 'DINE_IN' | 'TAKE_AWAY' | 'DELIVERY';
export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'READY' | 'COMPLETED' | 'CANCELLED' | 'VOID';
export type PaymentMethod = 'CASH' | 'QRIS' | 'DEBIT' | 'CREDIT';
export type PaymentStatus = 'PENDING' | 'SETTLED' | 'CANCELLED' | 'EXPIRED' | 'REFUNDED';

export interface CartItem {
  id: string; // unique item id in cart
  productId: string;
  variantId?: string;
  name: string;
  variantName?: string;
  price: number;
  costPrice?: number;
  quantity: number;
  notes?: string;
  discountAmount?: number;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  variantId?: string;
  productName: string;
  variantName?: string;
  quantity: number;
  price: number;
  subtotal: number;
  notes?: string;
  status?: string;
  isVoid?: boolean;
}

export interface Order {
  id: string;
  tenantId: string;
  outletId: string;
  tableId?: string;
  tableName?: string;
  orderNumber: string;
  orderType: OrderType;
  status: OrderStatus;
  customerName?: string;
  customerPhone?: string;
  items: OrderItem[];
  subtotal: number;
  taxAmount: number;
  serviceCharge: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount?: number;
  changeAmount?: number;
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
  cashierId: string;
  cashierName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderPayload {
  outletId: string;
  tableId?: string;
  orderType: OrderType;
  customerName?: string;
  items: {
    productId: string;
    variantId?: string;
    quantity: number;
    notes?: string;
  }[];
}

export interface PaymentPayload {
  orderId: string;
  paymentMethod: PaymentMethod;
  amount: number;
  cashGiven?: number;
  referenceNo?: string;
}

