import { httpClient } from './http-client';

export interface SummaryReportParams {
  startDate: string;
  endDate: string;
  outletId?: string;
}

export interface SummaryReportData {
  summary: {
    totalRevenue: number;
    totalOrders: number;
    totalTransactions: number;
    averageOrderValue: number;
  };
  byPaymentMethod: Array<{
    method: string;
    total: number;
    count: number;
  }>;
  meta: {
    startDate: string;
    endDate: string;
    outletId: string | null;
  };
}

export interface SalesReportParams {
  startDate: string;
  endDate: string;
  outletId?: string;
}

export interface SalesReportData {
  byDate: Array<{
    date: string;
    revenue: string | number;
    transactions: string | number;
    orders?: number;
  }>;
  byProduct: Array<{
    productId: string;
    variantId?: string;
    productName: string;
    variantName?: string;
    quantitySold: string | number;
    revenue: string | number;
  }>;
  byPaymentMethod: Array<{
    method: string;
    total: string | number;
    count: string | number;
  }>;
  summary: {
    totalRevenue: number;
    totalOrders: number;
    totalTransactions: number;
    averageOrderValue: number;
  };
  meta: {
    startDate: string;
    endDate: string;
    outletId: string | null;
  };
}

export interface InventoryReportParams {
  outletId?: string;
  search?: string;
}

export interface InventoryReportData {
  items: Array<{
    id: string;
    name: string;
    sku?: string;
    category?: string;
    currentStock: number;
    minimumStock: number;
    unit: string;
    isLowStock: boolean;
    valuation: number;
  }>;
  summary: {
    totalItems: number;
    lowStockItems: number;
    totalValuation: number;
  };
}

export const reportService = {
  getSummary: async (params: SummaryReportParams): Promise<SummaryReportData> => {
    const res = await httpClient.get<SummaryReportData>('/reports', { params });
    return res.data;
  },

  getSalesReport: async (params: SalesReportParams): Promise<SalesReportData> => {
    const res = await httpClient.get<SalesReportData>('/reports/sales', { params });
    return res.data;
  },

  getInventoryReport: async (params: InventoryReportParams): Promise<InventoryReportData> => {
    const res = await httpClient.get<InventoryReportData>('/reports/inventory', { params });
    return res.data;
  },
};

