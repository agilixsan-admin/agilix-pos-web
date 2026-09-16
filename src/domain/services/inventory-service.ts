import { httpClient } from './http-client';
import type {
  RawMaterial,
  InventoryCategory,
  PackagingItem,
  PackagingCategory,
  Supplier,
  StockMovement,
  StockAdjustment,
  Purchase,
  CreatePurchasePayload,
  UpdatePurchasePayload,
  ReceivePurchasePayload,
  InventoryItemStock,
  PaginatedInventoryStockResult,
  StockOpname,
  CreateStockOpnamePayload,
  UpdateStockOpnameCountsPayload,
  PaginatedStockOpnamesResult,
  ReasonCategory,
  CreateReasonCategoryPayload,
  CreateStockAdjustmentPayload,
  PaginatedStockAdjustmentsResult,
} from '@model/Inventory';

export interface PaginatedPurchasesResult {
  data: Purchase[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}



export const inventoryService = {
  // Inventory Items (Raw Materials)
  getRawMaterials: async (params?: { outletId?: string; search?: string; categoryId?: string }): Promise<RawMaterial[]> => {
    const res = await httpClient.get('/inventory', { params: { ...params, itemType: 'RAW_MATERIAL' } });
    const rawList: any[] = res.data?.items || res.data?.data || (Array.isArray(res.data) ? res.data : []);
    return rawList.map((item: any) => ({
      ...item,
      unitCost: Number(item.unitCost ?? item.costPrice ?? 0),
      costPrice: Number(item.costPrice ?? item.unitCost ?? 0),
    }));
  },

  getRawMaterialById: async (id: string): Promise<RawMaterial> => {
    const res = await httpClient.get(`/inventory/${id}`);
    const item = res.data?.data || res.data;
    if (!item) return item;
    return {
      ...item,
      unitCost: Number(item.unitCost ?? item.costPrice ?? 0),
      costPrice: Number(item.costPrice ?? item.unitCost ?? 0),
    };
  },

  createRawMaterial: async (data: {
    name: string;
    sku?: string;
    categoryId?: string;
    description?: string;
    unit: string;
    minimumStock?: number;
    status?: string;
  }): Promise<RawMaterial> => {
    const res = await httpClient.post('/inventory', {
      ...data,
      itemType: 'RAW_MATERIAL',
    });
    return res.data?.data || res.data;
  },

  updateRawMaterial: async (id: string, data: Partial<RawMaterial>): Promise<RawMaterial> => {
    const res = await httpClient.put(`/inventory/${id}`, data);
    return res.data?.data || res.data;
  },

  deleteRawMaterial: async (id: string): Promise<void> => {
    await httpClient.delete(`/inventory/${id}`);
  },

  // Inventory Categories
  getInventoryCategories: async (params?: { search?: string }): Promise<InventoryCategory[]> => {
    const res = await httpClient.get('/inventory/categories', { params });
    return res.data?.items || res.data?.data || (Array.isArray(res.data) ? res.data : []);
  },

  createInventoryCategory: async (data: { name: string; description?: string; status?: string }): Promise<InventoryCategory> => {
    const res = await httpClient.post('/inventory/categories', data);
    return res.data?.data || res.data;
  },

  updateInventoryCategory: async (id: string, data: { name?: string; description?: string; status?: string }): Promise<InventoryCategory> => {
    const res = await httpClient.put(`/inventory/categories/${id}`, data);
    return res.data?.data || res.data;
  },

  deleteInventoryCategory: async (id: string): Promise<void> => {
    await httpClient.delete(`/inventory/categories/${id}`);
  },

  // Packaging Items
  getPackagingItems: async (params?: { outletId?: string; search?: string; categoryId?: string; status?: string }): Promise<PackagingItem[]> => {
    const res = await httpClient.get('/packagings', { params });
    const rawList: any[] = res.data?.items || res.data?.data || (Array.isArray(res.data) ? res.data : []);
    return rawList.map((item: any) => {
      const inv = item.inventoryItem;
      const stocks: any[] = inv?.stocks || item.stocks || [];
      const currentStock = typeof item.currentStock === 'number'
        ? item.currentStock
        : params?.outletId
        ? stocks
            .filter((s: any) => s.outletId === params.outletId)
            .reduce((sum: number, s: any) => sum + Number(s.quantity || 0), 0)
        : stocks.reduce((sum: number, s: any) => sum + Number(s.quantity || 0), 0);
      const minimumStock = Number(item.minimumStock ?? item.minStock ?? inv?.minimumStock ?? 0);
      const unit = item.unit || inv?.unit || 'pcs';
      const unitCost = Number(item.unitCost ?? item.costPrice ?? inv?.unitCost ?? 0);

      return {
        ...item,
        currentStock,
        minimumStock,
        minStock: minimumStock,
        unit,
        unitCost,
      };
    });
  },

  getPackagingById: async (id: string): Promise<PackagingItem> => {
    const res = await httpClient.get(`/packagings/${id}`);
    const item = res.data?.data || res.data;
    if (!item) return item;
    const inv = item.inventoryItem;
    const stocks: any[] = inv?.stocks || item.stocks || [];
    const currentStock = typeof item.currentStock === 'number'
      ? item.currentStock
      : stocks.reduce((sum: number, s: any) => sum + Number(s.quantity || 0), 0);
    const minimumStock = Number(item.minimumStock ?? item.minStock ?? inv?.minimumStock ?? 0);
    const unit = item.unit || inv?.unit || 'pcs';
    const unitCost = Number(item.unitCost ?? item.costPrice ?? inv?.unitCost ?? 0);

    return {
      ...item,
      currentStock,
      minimumStock,
      minStock: minimumStock,
      unit,
      unitCost,
    };
  },

  createPackaging: async (data: {
    name: string;
    sku?: string;
    categoryId?: string;
    description?: string;
    costPrice?: number;
    extraPrice?: number;
    applyToOrderType?: 'TAKE_AWAY' | 'ALL' | 'CUSTOM';
    status?: string;
    outletId?: string;
    inventoryItemId?: string;
    unit?: string;
    minimumStock?: number;
  }): Promise<PackagingItem> => {
    const payload = {
      name: data.name,
      sku: data.sku || undefined,
      categoryId: data.categoryId || undefined,
      description: data.description || undefined,
      costPrice: data.costPrice,
      extraPrice: data.extraPrice,
      applyToOrderType: data.applyToOrderType,
      status: data.status,
      outletId: data.outletId || undefined,
      inventoryItemId: data.inventoryItemId || undefined,
      unit: data.unit || undefined,
      minimumStock: data.minimumStock !== undefined ? data.minimumStock : undefined,
    };
    const res = await httpClient.post('/packagings', payload);
    return res.data?.data || res.data;
  },

  updatePackaging: async (id: string, data: Partial<PackagingItem>): Promise<PackagingItem> => {
    const payload = {
      name: data.name,
      sku: data.sku || undefined,
      categoryId: data.categoryId || (typeof data.category === 'object' && data.category ? (data.category as { id?: string }).id : undefined),
      description: data.description || undefined,
      costPrice: data.costPrice,
      extraPrice: data.extraPrice,
      applyToOrderType: data.applyToOrderType,
      status: data.status,
      outletId: data.outletId || undefined,
      inventoryItemId: data.inventoryItemId || undefined,
      unit: data.unit || undefined,
      minimumStock: data.minimumStock !== undefined ? data.minimumStock : undefined,
    };
    const res = await httpClient.put(`/packagings/${id}`, payload);
    return res.data?.data || res.data;
  },

  deletePackaging: async (id: string): Promise<void> => {
    await httpClient.delete(`/packagings/${id}`);
  },

  // Packaging Categories
  getPackagingCategories: async (params?: { search?: string; status?: string }): Promise<PackagingCategory[]> => {
    const res = await httpClient.get('/packagings/categories', { params });
    return res.data?.items || res.data?.data || (Array.isArray(res.data) ? res.data : []);
  },

  createPackagingCategory: async (data: { name: string; description?: string; status?: string }): Promise<PackagingCategory> => {
    const res = await httpClient.post('/packagings/categories', data);
    return res.data?.data || res.data;
  },

  updatePackagingCategory: async (id: string, data: { name?: string; description?: string; status?: string }): Promise<PackagingCategory> => {
    const res = await httpClient.put(`/packagings/categories/${id}`, data);
    return res.data?.data || res.data;
  },

  deletePackagingCategory: async (id: string): Promise<void> => {
    await httpClient.delete(`/packagings/categories/${id}`);
  },

  // Suppliers
  getSuppliers: async (params?: { search?: string; status?: string; page?: number; limit?: number }): Promise<Supplier[]> => {
    const res = await httpClient.get('/suppliers', { params });
    return res.data?.data || res.data?.items || (Array.isArray(res.data) ? res.data : []);
  },

  getSupplierById: async (id: string): Promise<Supplier> => {
    const res = await httpClient.get(`/suppliers/${id}`);
    return res.data?.data || res.data;
  },

  createSupplier: async (data: Partial<Supplier>): Promise<Supplier> => {
    const res = await httpClient.post('/suppliers', data);
    return res.data?.data || res.data;
  },

  updateSupplier: async (id: string, data: Partial<Supplier>): Promise<Supplier> => {
    const res = await httpClient.put(`/suppliers/${id}`, data);
    return res.data?.data || res.data;
  },

  deleteSupplier: async (id: string): Promise<void> => {
    await httpClient.delete(`/suppliers/${id}`);
  },

  getStockMovements: async (params?: {
    outletId?: string;
    itemId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<StockMovement[]> => {
    const res = await httpClient.get('/inventory/movements', { params });
    return res.data?.items || res.data?.data || (Array.isArray(res.data) ? res.data : []);
  },

  getAdjustments: async (params?: {
    outletId?: string;
    inventoryItemId?: string;
    reasonCategoryId?: string;
    type?: 'IN' | 'OUT';
    startDate?: string;
    endDate?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedStockAdjustmentsResult> => {
    const res = await httpClient.get('/inventory/adjustments', { params });
    if (res.data?.data && res.data?.meta && res.data?.summary) {
      return {
        data: res.data.data,
        meta: res.data.meta,
        summary: res.data.summary,
      };
    }
    const items = res.data?.items || res.data?.data || (Array.isArray(res.data) ? res.data : []);
    return {
      data: items,
      meta: {
        page: params?.page || 1,
        limit: params?.limit || 20,
        total: items.length,
        totalPages: 1,
      },
      summary: res.data?.summary || {
        totalAdjustments: items.length,
        totalIn: 0,
        totalOut: 0,
        totalLossValue: 0,
      },
    };
  },

  getAdjustmentById: async (id: string): Promise<StockAdjustment> => {
    const res = await httpClient.get(`/inventory/adjustments/${id}`);
    return res.data?.data || res.data;
  },

  createAdjustment: async (payload: CreateStockAdjustmentPayload): Promise<StockAdjustment> => {
    const res = await httpClient.post('/inventory/adjustments', payload);
    return res.data?.data || res.data;
  },

  getReasonCategories: async (params?: { type?: string }): Promise<ReasonCategory[]> => {
    const res = await httpClient.get('/inventory/reason-categories', { params });
    return res.data?.data || (Array.isArray(res.data) ? res.data : []);
  },

  createReasonCategory: async (payload: CreateReasonCategoryPayload): Promise<ReasonCategory> => {
    const res = await httpClient.post('/inventory/reason-categories', payload);
    return res.data?.data || res.data;
  },

  uploadAdjustmentProof: async (file: File): Promise<{ imageUrl: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await httpClient.post('/inventory/adjustments/upload-proof', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data?.data || res.data;
  },

  // Purchases
  getPurchases: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    outletId?: string;
    supplierId?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<PaginatedPurchasesResult> => {
    const res = await httpClient.get('/purchases', { params });
    if (res.data?.data && res.data?.meta) {
      return {
        data: res.data.data,
        meta: res.data.meta,
      };
    }
    const items = res.data?.items || res.data?.data || (Array.isArray(res.data) ? res.data : []);
    return {
      data: items,
      meta: {
        page: params?.page || 1,
        limit: params?.limit || 20,
        total: items.length,
        totalPages: 1,
      },
    };
  },

  getPurchaseById: async (id: string): Promise<Purchase> => {
    const res = await httpClient.get(`/purchases/${id}`);
    return res.data?.data || res.data;
  },

  createPurchase: async (data: CreatePurchasePayload): Promise<Purchase> => {
    const res = await httpClient.post('/purchases', data);
    return res.data?.data || res.data;
  },

  updatePurchase: async (id: string, data: UpdatePurchasePayload): Promise<Purchase> => {
    const res = await httpClient.put(`/purchases/${id}`, data);
    return res.data?.data || res.data;
  },

  deletePurchase: async (id: string): Promise<void> => {
    await httpClient.delete(`/purchases/${id}`);
  },

  receivePurchase: async (id: string, data?: ReceivePurchasePayload): Promise<Purchase> => {
    const res = await httpClient.post(`/purchases/${id}/receive`, data || {});
    return res.data?.data || res.data;
  },

  // Stock Overview & Summary
  getStockOverview: async (params?: {
    outletId?: string;
    search?: string;
    categoryId?: string;
    itemType?: string;
    status?: string;
    stockStatus?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<PaginatedInventoryStockResult> => {
    const res = await httpClient.get('/inventory', { params });
    if (res.data?.data && res.data?.meta && res.data?.summary) {
      return {
        data: res.data.data,
        meta: res.data.meta,
        summary: res.data.summary,
      };
    }
    const items = res.data?.items || res.data?.data || (Array.isArray(res.data) ? res.data : []);
    return {
      data: items,
      meta: {
        page: params?.page || 1,
        limit: params?.limit || 20,
        total: items.length,
        totalPages: 1,
      },
      summary: res.data?.summary || {
        totalItems: items.length,
        totalInventoryValue: 0,
        lowStockCount: 0,
        outOfStockCount: 0,
      },
    };
  },

  getInventoryItemStockById: async (id: string, outletId?: string): Promise<InventoryItemStock> => {
    const res = await httpClient.get(`/inventory/${id}`, { params: { outletId } });
    return res.data?.data || res.data;
  },

  // Stock Opnames
  getStockOpnames: async (params?: {
    outletId?: string;
    search?: string;
    status?: string;
    scope?: string;
    categoryId?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedStockOpnamesResult> => {
    const res = await httpClient.get('/stock-opnames', { params });
    if (res.data?.data && res.data?.meta) {
      return {
        data: res.data.data,
        meta: res.data.meta,
      };
    }
    const items = res.data?.items || res.data?.data || (Array.isArray(res.data) ? res.data : []);
    return {
      data: items,
      meta: {
        page: params?.page || 1,
        limit: params?.limit || 20,
        total: items.length,
        totalPages: 1,
      },
    };
  },

  getStockOpnameById: async (id: string): Promise<StockOpname> => {
    const res = await httpClient.get(`/stock-opnames/${id}`);
    return res.data?.data || res.data;
  },

  createStockOpname: async (data: CreateStockOpnamePayload): Promise<StockOpname> => {
    const res = await httpClient.post('/stock-opnames', data);
    return res.data?.data || res.data;
  },

  updateStockOpnameCounts: async (
    id: string,
    data: UpdateStockOpnameCountsPayload
  ): Promise<StockOpname> => {
    const res = await httpClient.put(`/stock-opnames/${id}/counts`, data);
    return res.data?.data || res.data;
  },

  finalizeStockOpname: async (id: string, notes?: string): Promise<StockOpname> => {
    const res = await httpClient.post(`/stock-opnames/${id}/finalize`, { notes });
    return res.data?.data || res.data;
  },

  cancelStockOpname: async (id: string, notes?: string): Promise<StockOpname> => {
    const res = await httpClient.post(`/stock-opnames/${id}/cancel`, { notes });
    return res.data?.data || res.data;
  },
};

