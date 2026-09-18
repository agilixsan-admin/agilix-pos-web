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
  unitPrice?: number;
  subtotal: number;
  notes?: string | null;
  status?: string;
  isVoid?: boolean;
}

export interface TransactionInfo {
  id: string;
  transactionNumber: string;
  amount: number;
  status: string;
  completedAt?: string;
  createdAt: string;
}

export interface PaymentInfo {
  id: string;
  orderId?: string;
  paymentMethod: PaymentMethod;
  amount: number;
  status: PaymentStatus;
  cashGiven?: number;
  changeAmount?: number;
  referenceNo?: string | null;
  createdAt: string;
}

export interface OrderCreator {
  id: string;
  name: string;
  email: string;
}

export interface OrderOutlet {
  id: string;
  name: string;
  code?: string;
  address?: string | null;
  phone?: string | null;
}

export interface OrderTable {
  id: string;
  name: string;
  tableNumber?: string;
  capacity?: number;
}

export interface Order {
  id: string;
  tenantId: string;
  outletId: string;
  tableId?: string | null;
  tableName?: string | null;
  tableNumber?: string | null;
  orderNumber: string;
  orderType: OrderType;
  status: OrderStatus;
  customerName?: string | null;
  customerPhone?: string | null;
  items: OrderItem[];
  subtotal: number;
  taxAmount: number;
  taxName?: string | null;
  taxRate?: number | null;
  taxType?: 'INCLUSIVE' | 'EXCLUSIVE' | null;
  serviceCharge: number;
  discountAmount: number;
  discountId?: string | null;
  discountName?: string | null;
  packagingFee?: number;
  totalAmount: number;
  paidAmount?: number;
  changeAmount?: number;
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
  cashierId?: string;
  cashierName?: string;
  notes?: string | null;
  transaction?: TransactionInfo | null;
  payments?: PaymentInfo[];
  creator?: OrderCreator | null;
  outlet?: OrderOutlet | null;
  table?: OrderTable | null;
  voids?: OrderVoidInfo[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderVoidInfo {
  id: string;
  orderId: string;
  orderItemId?: string | null;
  reason: string;
  voidedBy?: string | null;
  approvedBy?: string | null;
  voidedAt: string;
}

export interface CreateOrderPayload {
  outletId: string;
  tableId?: string;
  orderType: OrderType;
  customerName?: string;
  discountId?: string;
  discountAmount?: number;
  serviceCharge?: number;
  taxAmount?: number;
  packagingFee?: number;
  notes?: string;
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

export interface QueryOrderParams extends Record<string, unknown> {
  page?: number;
  limit?: number;
  outletId?: string;
  status?: string;
  orderType?: string;
  paymentMethod?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface PaginatedOrderResult {
  items: Order[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
