import { httpClient } from './http-client';
import type { Outlet } from '@model/Auth';
import type { Table, Role, UserManagementItem, AuditLogItem } from '@model/Settings';

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
    return res.data?.data || res.data || [];
  },

  createTable: async (tableData: Partial<Table>): Promise<Table> => {
    const res = await httpClient.post('/tables', tableData);
    return res.data?.data || res.data;
  },

  updateTable: async (id: string, tableData: Partial<Table>): Promise<Table> => {
    const res = await httpClient.put(`/tables/${id}`, tableData);
    return res.data?.data || res.data;
  },

  deleteTable: async (id: string): Promise<void> => {
    await httpClient.delete(`/tables/${id}`);
  },

  getRoles: async (): Promise<Role[]> => {
    const res = await httpClient.get('/roles');
    return res.data?.data || res.data || [];
  },

  getUsers: async (params?: { outletId?: string }): Promise<UserManagementItem[]> => {
    const res = await httpClient.get('/users', { params });
    return res.data?.data || res.data || [];
  },

  createUser: async (userData: Partial<UserManagementItem> & { password?: string }): Promise<UserManagementItem> => {
    const res = await httpClient.post('/users', userData);
    return res.data?.data || res.data;
  },

  updateUser: async (id: string, userData: Partial<UserManagementItem>): Promise<UserManagementItem> => {
    const res = await httpClient.put(`/users/${id}`, userData);
    return res.data?.data || res.data;
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
