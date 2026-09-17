import { httpClient } from './http-client';
import type {
  Order,
  CreateOrderPayload,
  PaymentPayload,
  OrderItem,
  QueryOrderParams,
  PaginatedOrderResult,
} from '@model/Order';
import type { Table } from '@model/Settings';

const normalizeOrder = (order: Order): Order => {
  if (!order) return order;
  const rawPayments = (order as unknown as { payments?: Array<{ amount?: number; changeAmount?: number; paymentMethod?: PaymentMethod }> }).payments;
  const latestPayment =
    Array.isArray(rawPayments) && rawPayments.length > 0
      ? rawPayments[rawPayments.length - 1]
      : undefined;

  return {
    ...order,
    tableName: order.tableName || order.tableNumber || order.table?.name || order.table?.tableNumber || null,
    tableNumber: order.tableNumber || order.tableName || order.table?.tableNumber || order.table?.name || null,
    paidAmount:
      order.paidAmount !== undefined
        ? Number(order.paidAmount)
        : latestPayment?.amount !== undefined
        ? Number(latestPayment.amount)
        : undefined,
    changeAmount:
      order.changeAmount !== undefined
        ? Number(order.changeAmount)
        : latestPayment?.changeAmount !== undefined
        ? Number(latestPayment.changeAmount)
        : undefined,
    paymentMethod:
      order.paymentMethod ||
      latestPayment?.paymentMethod ||
      undefined,
  };
};

export const posService = {
  getTables: async (outletId?: string): Promise<Table[]> => {
    const res = await httpClient.get('/tables', { params: { outletId } });
    const items = (res.data?.data || res.data || []) as Array<{
      id: string;
      outletId: string;
      tableNumber?: string;
      name?: string;
      capacity: number;
      status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED';
      section?: string;
      currentOrderId?: string;
      isActive?: boolean;
    }>;
    return items.map((t) => ({
      ...t,
      name: t.name || t.tableNumber || '',
      tableNumber: t.tableNumber || t.name || '',
      section: t.section || 'Main Area',
    }));
  },

  createOrder: async (payload: CreateOrderPayload): Promise<Order> => {
    const res = await httpClient.post('/orders', payload);
    return normalizeOrder(res.data?.data || res.data);
  },

  getOpenOrders: async (outletId?: string): Promise<Order[]> => {
    const res = await httpClient.get('/orders', {
      params: { status: 'PENDING', outletId, limit: 100 },
    });
    const rawList = (res.data?.data || res.data || []) as Order[];
    return rawList.map(normalizeOrder);
  },

  getOrderHistory: async (params?: QueryOrderParams): Promise<PaginatedOrderResult> => {
    const res = await httpClient.get('/orders', { params });
    const rawData = res.data;
    const rawItems: Order[] = Array.isArray(rawData?.data)
      ? rawData.data
      : Array.isArray(rawData)
      ? rawData
      : [];
    const items = rawItems.map(normalizeOrder);

    const meta = rawData?.meta || {
      page: params?.page || 1,
      limit: params?.limit || (items.length || 20),
      total: items.length,
      totalPages: Math.ceil((items.length || 1) / (params?.limit || 20)),
    };

    return {
      items,
      meta,
    };
  },

  getOrderById: async (orderId: string): Promise<Order> => {
    const res = await httpClient.get(`/orders/${orderId}`);
    return normalizeOrder(res.data?.data || res.data);
  },

  addItemsToOrder: async (
    orderId: string,
    items: { productId: string; variantId?: string; quantity: number; notes?: string }[]
  ): Promise<Order> => {
    const res = await httpClient.post(`/orders/${orderId}/items`, { items });
    return normalizeOrder(res.data?.data || res.data);
  },

  voidOrderItem: async (orderId: string, itemId: string, reason: string): Promise<OrderItem> => {
    const res = await httpClient.post(`/orders/${orderId}/void`, { orderItemId: itemId, reason });
    return res.data?.data || res.data;
  },

  printOrderBill: async (
    orderId: string,
    options?: { printerId?: string; isDuplicate?: boolean }
  ): Promise<{ success: boolean; message: string; data?: unknown }> => {
    const res = await httpClient.post(`/orders/${orderId}/print`, options || {});
    return res.data;
  },

  processPayment: async (payload: PaymentPayload): Promise<{
    paymentId: string;
    status: string;
    qrString?: string;
    changeAmount?: number;
    payment?: { amount?: number; changeAmount?: number; paymentMethod?: PaymentMethod };
    transaction?: unknown;
    order: Order;
  }> => {
    const res = await httpClient.post('/payments', payload);
    const data = (res.data?.data || res.data) as {
      paymentId?: string;
      status?: string;
      qrString?: string;
      changeAmount?: number;
      payment?: { amount?: number; changeAmount?: number; paymentMethod?: PaymentMethod };
      transaction?: unknown;
      order?: Order;
    };

    if (data && data.order) {
      const p = data.payment;
      const orderTotal = Number(data.order.totalAmount || 0);
      const paid =
        p?.amount !== undefined
          ? Number(p.amount)
          : payload.cashGiven ?? payload.amount;
      const change =
        p?.changeAmount !== undefined
          ? Number(p.changeAmount)
          : payload.cashGiven !== undefined
          ? Math.max(0, Number(payload.cashGiven) - orderTotal)
          : 0;

      data.order = normalizeOrder({
        ...data.order,
        paidAmount: paid,
        changeAmount: change,
        paymentMethod: p?.paymentMethod || payload.paymentMethod,
        transaction: data.transaction as unknown as Order['transaction'],
      });
    }

    return data as {
      paymentId: string;
      status: string;
      qrString?: string;
      changeAmount?: number;
      payment?: { amount?: number; changeAmount?: number; paymentMethod?: PaymentMethod };
      transaction?: unknown;
      order: Order;
    };
  },

  getQrisStatus: async (paymentId: string): Promise<{ status: string; isPaid: boolean }> => {
    const res = await httpClient.get(`/payments/qris-status/${paymentId}`);
    return res.data?.data || res.data;
  },

  dispatchKitchenTicket: async (orderId: string): Promise<{ success: boolean; message: string }> => {
    const res = await httpClient.post(`/orders/${orderId}/dispatch`);
    return res.data?.data || res.data;
  },
};

