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

export const posService = {
  getTables: async (outletId?: string): Promise<Table[]> => {
    const res = await httpClient.get('/tables', { params: { outletId } });
    return res.data?.data || res.data || [];
  },

  createOrder: async (payload: CreateOrderPayload): Promise<Order> => {
    const res = await httpClient.post('/orders', payload);
    return res.data?.data || res.data;
  },

  getOpenOrders: async (outletId?: string): Promise<Order[]> => {
    const res = await httpClient.get('/orders', {
      params: { status: 'PENDING', outletId },
    });
    return res.data?.data || res.data || [];
  },

  getOrderHistory: async (params?: QueryOrderParams): Promise<PaginatedOrderResult> => {
    const res = await httpClient.get('/orders', { params });
    const rawData = res.data;
    const items: Order[] = Array.isArray(rawData?.data)
      ? rawData.data
      : Array.isArray(rawData)
      ? rawData
      : [];

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
    return res.data?.data || res.data;
  },

  addItemsToOrder: async (
    orderId: string,
    items: { productId: string; variantId?: string; quantity: number; notes?: string }[]
  ): Promise<Order> => {
    const res = await httpClient.post(`/orders/${orderId}/items`, { items });
    return res.data?.data || res.data;
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
    order: Order;
  }> => {
    const res = await httpClient.post('/payments', payload);
    return res.data?.data || res.data;
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

