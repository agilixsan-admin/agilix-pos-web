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
    return res.data?.items || res.data?.data || (Array.isArray(res.data) ? res.data : []);
  },

  getRawMaterialById: async (id: string): Promise<RawMaterial> => {
    const res = await httpClient.get(`/inventory/${id}`);
    return res.data?.data || res.data;
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
    try {
      const res = await httpClient.get('/packagings', { params });
      return res.data?.items || res.data?.data || (Array.isArray(res.data) ? res.data : []);
    } catch {
      // Fallback to /inventory?itemType=PACKAGING if /packagings is not active
      const res = await httpClient.get('/inventory', { params: { ...params, itemType: 'PACKAGING' } });
      return res.data?.items || res.data?.data || (Array.isArray(res.data) ? res.data : []);
    }
  },

  getPackagingById: async (id: string): Promise<PackagingItem> => {
    try {
      const res = await httpClient.get(`/packagings/${id}`);
      return res.data?.data || res.data;
    } catch {
      const res = await httpClient.get(`/inventory/${id}`);
      return res.data?.data || res.data;
    }
  },

  createPackaging: async (data: {
    name: string;
    sku?: string;
    categoryId?: string;
    description?: string;
    unit?: string;
    unitCost?: number;
    minimumStock?: number;
    status?: string;
    outletId?: string;
  }): Promise<PackagingItem> => {
    try {
      const res = await httpClient.post('/packagings', data);
      return res.data?.data || res.data;
    } catch {
      const res = await httpClient.post('/inventory', {
        ...data,
        itemType: 'PACKAGING',
      });
      return res.data?.data || res.data;
    }
  },

  updatePackaging: async (id: string, data: Partial<PackagingItem>): Promise<PackagingItem> => {
    try {
      const res = await httpClient.put(`/packagings/${id}`, data);
      return res.data?.data || res.data;
    } catch {
      const res = await httpClient.put(`/inventory/${id}`, data);
      return res.data?.data || res.data;
    }
  },

  deletePackaging: async (id: string): Promise<void> => {
    try {
      await httpClient.delete(`/packagings/${id}`);
    } catch {
      await httpClient.delete(`/inventory/${id}`);
    }
  },

  // Packaging Categories
  getPackagingCategories: async (params?: { search?: string; status?: string }): Promise<PackagingCategory[]> => {
    try {
      const res = await httpClient.get('/packagings/categories', { params });
      return res.data?.items || res.data?.data || (Array.isArray(res.data) ? res.data : []);
    } catch {
      const res = await httpClient.get('/inventory/categories', { params });
      return res.data?.items || res.data?.data || (Array.isArray(res.data) ? res.data : []);
    }
  },

  createPackagingCategory: async (data: { name: string; description?: string; status?: string }): Promise<PackagingCategory> => {
    try {
      const res = await httpClient.post('/packagings/categories', data);
      return res.data?.data || res.data;
    } catch {
      const res = await httpClient.post('/inventory/categories', data);
      return res.data?.data || res.data;
    }
  },

  updatePackagingCategory: async (id: string, data: { name?: string; description?: string; status?: string }): Promise<PackagingCategory> => {
    try {
      const res = await httpClient.put(`/packagings/categories/${id}`, data);
      return res.data?.data || res.data;
    } catch {
      const res = await httpClient.put(`/inventory/categories/${id}`, data);
      return res.data?.data || res.data;
    }
  },

  deletePackagingCategory: async (id: string): Promise<void> => {
    try {
      await httpClient.delete(`/packagings/categories/${id}`);
    } catch {
      await httpClient.delete(`/inventory/categories/${id}`);
    }
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

