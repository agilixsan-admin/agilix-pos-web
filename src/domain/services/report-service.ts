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
    grossSales?: number;
    totalDiscount?: number;
    netSales?: number;
    totalCogs?: number;
    grossProfit?: number;
    marginPercentage?: number;
    totalTax?: number;
    totalService?: number;
    totalPackaging?: number;
    totalCollected?: number;
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

// ─── Laporan Rekonsiliasi Shift ─────────────────────────────────────────────
export interface ShiftReconciliationParams {
  startDate?: string;
  endDate?: string;
  outletId?: string;
  userId?: string;
}

export interface ShiftReconciliationItem {
  id: string;
  outletId: string;
  outletName: string;
  userId: string;
  cashierName: string;
  openedAt: string;
  closedAt?: string | null;
  status: 'OPEN' | 'CLOSED';
  openingCash: number;
  totalCashSales: number;
  totalCashOut: number;
  expectedCash: number;
  actualCash: number;
  cashDifference: number;
  differenceStatus: 'MATCH' | 'SURPLUS' | 'SHORT';
  notes?: string | null;
  pettyCashCount: number;
  pettyCashList: Array<{
    id: string;
    amount: number;
    category: string;
    notes?: string;
    receiptPhotoUrl: string;
    createdAt: string;
  }>;
}

export interface ShiftReconciliationData {
  shifts: ShiftReconciliationItem[];
  summary: {
    totalShifts: number;
    totalCashSales: number;
    totalCashOut: number;
    totalDifference: number;
    totalShortCount: number;
    totalSurplusCount: number;
  };
}

// ─── Tiga Laporan Keuangan Standar Akuntansi ────────────────────────────────
export interface IncomeStatementParams {
  startDate: string;
  endDate: string;
  outletId?: string;
}

export interface IncomeStatementData {
  revenue: {
    grossSales: number;
    discounts: number;
    netSales: number;
  };
  cogs: {
    rawMaterialCogs: number;
    totalCogs: number;
  };
  grossProfit: number;
  marginPercentage: number;
  operatingExpenses: {
    breakdown: Array<{
      category: string;
      amount: number;
    }>;
    totalExpenses: number;
  };
  netProfit: number;
  meta: {
    startDate: string;
    endDate: string;
    outletId: string | null;
  };
}

export interface BalanceSheetParams {
  asOfDate?: string;
  outletId?: string;
}

export interface BalanceSheetData {
  asOfDate: string;
  outletId: string | null;
  assets: {
    currentAssets: {
      cashInDrawer: number;
      bankAndEwallet: number;
      inventoryValuation: number;
      totalCurrentAssets: number;
    };
    fixedAssets: {
      totalAssetCost: number;
      totalAccumulatedDepreciation: number;
      netFixedAssets: number;
    };
    totalAssets: number;
  };
  liabilities: {
    taxPayables: number;
    accountsPayable: number;
    totalLiabilities: number;
  };
  equity: {
    retainedEarnings: number;
    totalEquity: number;
  };
}

export interface CashFlowParams {
  startDate: string;
  endDate: string;
  outletId?: string;
}

export interface CashFlowData {
  operatingActivities: {
    cashFromSales: number;
    cashPaidForExpenses: number;
    netOperatingCash: number;
  };
  investingActivities: {
    cashPaidForAssets: number;
    netInvestingCash: number;
  };
  financingActivities: {
    cashFromCapitalInjections?: number;
    cashFromLoans?: number;
    cashPaidForDrawings?: number;
    cashPaidForLoanRepayments?: number;
    netFinancingCash: number;
  };
  netCashChange: number;
  meta: {
    startDate: string;
    endDate: string;
    outletId: string | null;
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

  getShiftReconciliationReport: async (params: ShiftReconciliationParams): Promise<ShiftReconciliationData> => {
    const res = await httpClient.get<{ data: ShiftReconciliationData }>('/reports/shifts', { params });
    return res.data?.data ?? (res.data as unknown as ShiftReconciliationData);
  },

  getIncomeStatement: async (params: IncomeStatementParams): Promise<IncomeStatementData> => {
    const res = await httpClient.get<{ data: IncomeStatementData }>('/reports/financial/income-statement', { params });
    return res.data?.data ?? (res.data as unknown as IncomeStatementData);
  },

  getBalanceSheet: async (params: BalanceSheetParams): Promise<BalanceSheetData> => {
    const res = await httpClient.get<{ data: BalanceSheetData }>('/reports/financial/balance-sheet', { params });
    return res.data?.data ?? (res.data as unknown as BalanceSheetData);
  },

  getCashFlowStatement: async (params: CashFlowParams): Promise<CashFlowData> => {
    const res = await httpClient.get<{ data: CashFlowData }>('/reports/financial/cash-flow', { params });
    return res.data?.data ?? (res.data as unknown as CashFlowData);
  },
};
