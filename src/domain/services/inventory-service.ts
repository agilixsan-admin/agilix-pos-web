import { httpClient } from './http-client';
import type { RawMaterial, InventoryCategory, PackagingItem, PackagingCategory, Supplier, StockMovement, StockAdjustment } from '@model/Inventory';

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

  getSuppliers: async (): Promise<Supplier[]> => {
    const res = await httpClient.get('/suppliers');
    return res.data?.data || res.data?.items || (Array.isArray(res.data) ? res.data : []);
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

  getAdjustments: async (params?: { outletId?: string }): Promise<StockAdjustment[]> => {
    const res = await httpClient.get('/inventory/adjustments', { params });
    return res.data?.items || res.data?.data || (Array.isArray(res.data) ? res.data : []);
  },

  createAdjustment: async (payload: {
    outletId: string;
    adjustmentDate: string;
    items: {
      itemId: string;
      itemName: string;
      itemType: string;
      systemStock: number;
      actualStock: number;
      reasonCategory: string;
      notes?: string;
    }[];
    notes?: string;
  }): Promise<StockAdjustment> => {
    const res = await httpClient.post('/inventory/adjustments', payload);
    return res.data?.data || res.data;
  },
};

