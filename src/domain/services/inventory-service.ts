import { httpClient } from './http-client';
import type { RawMaterial, InventoryCategory, PackagingItem, Supplier, StockMovement, StockAdjustment } from '@model/Inventory';

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

  getPackagingItems: async (params?: { outletId?: string; search?: string }): Promise<PackagingItem[]> => {
    const res = await httpClient.get('/packagings', { params });
    return res.data?.items || res.data?.data || (Array.isArray(res.data) ? res.data : []);
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

