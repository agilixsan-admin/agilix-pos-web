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
    unitCogs?: number;
    totalCogs?: number;
    profit?: number;
    marginPercentage?: number;
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
    const res = await httpClient.get<any>('/reports/inventory', { params });
    const raw = res.data;
    const rawList: any[] = Array.isArray(raw?.items)
      ? raw.items
      : Array.isArray(raw?.data)
      ? raw.data
      : Array.isArray(raw)
      ? raw
      : [];

    const items = rawList.map((item: any) => {
      const currentStock = Number(item.currentStock ?? item.totalStock ?? 0);
      const minimumStock = Number(item.minimumStock ?? 0);
      const unitCost = Number(item.unitCost ?? 0);
      const valuation =
        typeof item.valuation === 'number'
          ? item.valuation
          : currentStock * unitCost;
      const isLowStock =
        typeof item.isLowStock === 'boolean'
          ? item.isLowStock
          : currentStock <= minimumStock;

      return {
        id: item.id || item.itemId,
        name: item.name || item.itemName,
        sku: item.sku || undefined,
        category:
          typeof item.category === 'string'
            ? item.category
            : item.category?.name || 'Umum',
        currentStock,
        minimumStock,
        unit: item.unit || 'pcs',
        isLowStock,
        valuation,
      };
    });

    const summary = raw?.summary || {
      totalItems: items.length,
      lowStockItems: items.filter((i) => i.isLowStock).length,
      totalValuation: items.reduce((sum, i) => sum + (i.valuation || 0), 0),
    };

    return {
      items,
      summary,
    };
  },
};

