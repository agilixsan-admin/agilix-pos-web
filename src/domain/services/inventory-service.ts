import { httpClient } from './http-client';
import type { RawMaterial, PackagingItem, Supplier, StockMovement, StockAdjustment } from '@model/Inventory';

export const inventoryService = {
  getRawMaterials: async (params?: { outletId?: string; search?: string }): Promise<RawMaterial[]> => {
    const res = await httpClient.get('/inventory', { params });
    return res.data?.items || res.data?.data || (Array.isArray(res.data) ? res.data : []);
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

