import { httpClient } from './http-client';
import type { Outlet } from '@model/Auth';
import type {
  Table,
  Role,
  CreateRolePayload,
  UpdateRolePayload,
  PermissionGroup,
  UserItem,
  UserManagementItem,
  CreateUserPayload,
  UpdateUserPayload,
  QueryUsersParams,
  PaginatedUsersResult,
  PrinterSetting,
  CreatePrinterPayload,
  UpdatePrinterPayload,
  PrinterRoutingRule,
  UpdatePrinterRoutingPayload,
  TaxItem,
  TaxSetting,
  CreateTaxPayload,
  UpdateTaxPayload,
  GlobalTaxConfig,
  UpdateGlobalTaxConfigPayload,
  DiscountItem,
  DiscountSetting,
  CreateDiscountPayload,
  UpdateDiscountPayload,
  QueryDiscountParams,
  AuditLogItem,
} from '@model/Settings';

export const settingsService = {
  getOutlets: async (): Promise<Outlet[]> => {
    const res = await httpClient.get('/outlets');
    return res.data?.data || res.data || [];
  },

  createOutlet: async (outletData: Partial<Outlet>): Promise<Outlet> => {
    const res = await httpClient.post('/outlets', outletData);
    return res.data?.data || res.data;
  },

  updateOutlet: async (id: string, outletData: Partial<Outlet>): Promise<Outlet> => {
    const res = await httpClient.put(`/outlets/${id}`, outletData);
    return res.data?.data || res.data;
  },

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

  createTable: async (tableData: Partial<Table>): Promise<Table> => {
    const payload = {
      outletId: tableData.outletId,
      tableNumber: tableData.tableNumber || tableData.name,
      capacity: tableData.capacity,
      status: tableData.status,
      section: tableData.section || 'Main Area',
    };
    const res = await httpClient.post('/tables', payload);
    const data = (res.data?.data || res.data) as {
      id: string;
      outletId: string;
      tableNumber?: string;
      name?: string;
      capacity: number;
      status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED';
      section?: string;
      currentOrderId?: string;
      isActive?: boolean;
    };
    return {
      ...data,
      name: data.name || data.tableNumber || '',
      tableNumber: data.tableNumber || data.name || '',
      section: data.section || 'Main Area',
    };
  },

  updateTable: async (id: string, tableData: Partial<Table>): Promise<Table> => {
    const payload: Record<string, unknown> = {};
    if (tableData.tableNumber || tableData.name) {
      payload.tableNumber = tableData.tableNumber || tableData.name;
    }
    if (tableData.capacity !== undefined) {
      payload.capacity = tableData.capacity;
    }
    if (tableData.status !== undefined) {
      payload.status = tableData.status;
    }
    if (tableData.section !== undefined) {
      payload.section = tableData.section;
    }

    const res = await httpClient.put(`/tables/${id}`, payload);
    const data = (res.data?.data || res.data) as {
      id: string;
      outletId: string;
      tableNumber?: string;
      name?: string;
      capacity: number;
      status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED';
      section?: string;
      currentOrderId?: string;
      isActive?: boolean;
    };
    return {
      ...data,
      name: data.name || data.tableNumber || '',
      tableNumber: data.tableNumber || data.name || '',
      section: data.section || 'Main Area',
    };
  },

  deleteTable: async (id: string): Promise<{ success: boolean; message: string }> => {
    const res = await httpClient.delete(`/tables/${id}`);
    return res.data || { success: true, message: 'Table deleted successfully' };
  },

  getRoles: async (params?: { outletId?: string }): Promise<Role[]> => {
    const res = await httpClient.get('/roles', { params });
    return res.data?.data || res.data || [];
  },

  getRoleById: async (id: string): Promise<Role> => {
    const res = await httpClient.get(`/roles/${id}`);
    return res.data?.data || res.data;
  },

  createRole: async (roleData: CreateRolePayload): Promise<Role> => {
    const res = await httpClient.post('/roles', roleData);
    return res.data?.data || res.data;
  },

  updateRole: async (id: string, roleData: UpdateRolePayload): Promise<Role> => {
    const res = await httpClient.put(`/roles/${id}`, roleData);
    return res.data?.data || res.data;
  },

  deleteRole: async (id: string): Promise<{ success: boolean; message: string }> => {
    const res = await httpClient.delete(`/roles/${id}`);
    return res.data || { success: true, message: 'Role deleted successfully' };
  },

  getPermissionsCatalog: async (): Promise<PermissionGroup[]> => {
    const res = await httpClient.get('/roles/permissions');
    return res.data?.data || res.data || [];
  },

  getUsers: async (params?: QueryUsersParams): Promise<PaginatedUsersResult> => {
    const res = await httpClient.get('/users', { params });
    const raw = res.data;
    if (Array.isArray(raw?.data)) {
      return {
        data: raw.data,
        meta: raw.meta || {
          page: raw.page || 1,
          limit: raw.limit || raw.data.length,
          total: raw.total ?? raw.data.length,
          totalPages: raw.totalPages || 1,
        },
      };
    }
    if (Array.isArray(raw)) {
      return {
        data: raw,
        meta: { page: 1, limit: raw.length, total: raw.length, totalPages: 1 },
      };
    }
    return {
      data: [],
      meta: { page: 1, limit: 10, total: 0, totalPages: 0 },
    };
  },

  getUserById: async (id: string): Promise<UserItem> => {
    const res = await httpClient.get(`/users/${id}`);
    return res.data?.data || res.data;
  },

  createUser: async (payload: CreateUserPayload): Promise<UserItem> => {
    const res = await httpClient.post('/users', payload);
    return res.data?.data || res.data;
  },

  updateUser: async (id: string, payload: UpdateUserPayload): Promise<UserItem> => {
    const res = await httpClient.put(`/users/${id}`, payload);
    return res.data?.data || res.data;
  },

  resendInvitation: async (id: string): Promise<{ success: boolean; message: string }> => {
    const res = await httpClient.post(`/users/${id}/resend-invitation`);
    return res.data || { success: true, message: 'Undangan berhasil dikirim ulang' };
  },

  deleteUser: async (id: string): Promise<{ success: boolean; message: string }> => {
    const res = await httpClient.delete(`/users/${id}`);
    return res.data || { success: true, message: 'Pengguna berhasil dinonaktifkan' };
  },

  getPrinters: async (outletId?: string): Promise<PrinterSetting[]> => {
    const res = await httpClient.get('/printers', { params: { outletId } });
    const rawData = res.data?.data ?? res.data;
    if (Array.isArray(rawData)) {
      return rawData;
    }
    if (rawData && Array.isArray(rawData.printers)) {
      return rawData.printers;
    }
    return [];
  },

  getPrinterById: async (id: string): Promise<PrinterSetting> => {
    const res = await httpClient.get(`/printers/${id}`);
    return res.data?.data || res.data;
  },

  createPrinter: async (payload: CreatePrinterPayload): Promise<PrinterSetting> => {
    const res = await httpClient.post('/printers', payload);
    return res.data?.data || res.data;
  },

  updatePrinter: async (id: string, payload: UpdatePrinterPayload): Promise<PrinterSetting> => {
    const res = await httpClient.put(`/printers/${id}`, payload);
    return res.data?.data || res.data;
  },

  deletePrinter: async (id: string): Promise<{ success: boolean; message: string }> => {
    const res = await httpClient.delete(`/printers/${id}`);
    return res.data || { success: true, message: 'Printer berhasil dihapus' };
  },

  testPrint: async (id: string): Promise<{ success: boolean; message: string }> => {
    const res = await httpClient.post(`/printers/${id}/test-print`);
    return res.data || { success: true, message: 'Test print berhasil dikirim' };
  },

  getPrinterRoutingRules: async (outletId: string): Promise<PrinterRoutingRule[]> => {
    const res = await httpClient.get('/printers/routing-rules', { params: { outletId } });
    const rawData = res.data?.data ?? res.data;
    if (Array.isArray(rawData)) {
      return rawData;
    }
    if (rawData && Array.isArray(rawData.rules)) {
      return rawData.rules;
    }
    return [];
  },

  updatePrinterRoutingRules: async (payload: UpdatePrinterRoutingPayload): Promise<PrinterRoutingRule[]> => {
    const res = await httpClient.put('/printers/routing-rules', payload);
    const rawData = res.data?.data ?? res.data;
    if (Array.isArray(rawData)) {
      return rawData;
    }
    if (rawData && Array.isArray(rawData.rules)) {
      return rawData.rules;
    }
    return [];
  },

  getTaxes: async (params?: { outletId?: string; status?: string; type?: string; search?: string }): Promise<TaxItem[]> => {
    const res = await httpClient.get('/settings/taxes', { params });
    return res.data?.data || res.data || [];
  },

  getTaxById: async (id: string): Promise<TaxItem> => {
    const res = await httpClient.get(`/settings/taxes/${id}`);
    return res.data?.data || res.data;
  },

  createTax: async (payload: CreateTaxPayload): Promise<TaxItem> => {
    const res = await httpClient.post('/settings/taxes', payload);
    return res.data?.data || res.data;
  },

  updateTax: async (id: string, payload: UpdateTaxPayload): Promise<TaxItem> => {
    const res = await httpClient.put(`/settings/taxes/${id}`, payload);
    return res.data?.data || res.data;
  },

  deleteTax: async (id: string): Promise<{ success: boolean; message: string }> => {
    const res = await httpClient.delete(`/settings/taxes/${id}`);
    return res.data || { success: true, message: 'Tax berhasil dihapus' };
  },

  getGlobalTaxConfig: async (outletId?: string): Promise<GlobalTaxConfig> => {
    const res = await httpClient.get('/settings/taxes/global-config', { params: { outletId } });
    return res.data?.data || res.data;
  },

  updateGlobalTaxConfig: async (payload: UpdateGlobalTaxConfigPayload): Promise<GlobalTaxConfig> => {
    const res = await httpClient.put('/settings/taxes/global-config', payload);
    return res.data?.data || res.data;
  },

  getDiscounts: async (params?: QueryDiscountParams): Promise<DiscountItem[]> => {
    const res = await httpClient.get('/settings/discounts', { params });
    return res.data?.data || res.data || [];
  },

  getDiscountById: async (id: string): Promise<DiscountItem> => {
    const res = await httpClient.get(`/settings/discounts/${id}`);
    return res.data?.data || res.data;
  },

  createDiscount: async (payload: CreateDiscountPayload): Promise<DiscountItem> => {
    const res = await httpClient.post('/settings/discounts', payload);
    return res.data?.data || res.data;
  },

  updateDiscount: async (id: string, payload: UpdateDiscountPayload): Promise<DiscountItem> => {
    const res = await httpClient.put(`/settings/discounts/${id}`, payload);
    return res.data?.data || res.data;
  },

  deleteDiscount: async (id: string): Promise<{ success: boolean; message: string }> => {
    const res = await httpClient.delete(`/settings/discounts/${id}`);
    return res.data || { success: true, message: 'Discount berhasil dihapus' };
  },

  getApplicableDiscounts: async (params?: {
    outletId?: string;
    orderAmount?: number;
    checkDate?: string;
  }): Promise<DiscountItem[]> => {
    const res = await httpClient.get('/settings/discounts/applicable', { params });
    return res.data?.data || res.data || [];
  },

  getAuditLogs: async (params?: {
    action?: string;
    actorType?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<{ items: AuditLogItem[]; total: number }> => {
    const res = await httpClient.get('/audit-logs', { params });
    const data = res.data;
    if (Array.isArray(data?.data)) {
      return { items: data.data, total: data.total || data.data.length };
    }
    if (Array.isArray(data?.items)) {
      return { items: data.items, total: data.total || data.items.length };
    }
    if (Array.isArray(data)) {
      return { items: data, total: data.length };
    }
    return { items: [], total: 0 };
  },
};
