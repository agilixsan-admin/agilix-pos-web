/**
 * Centralized, Type-Safe Query Keys Factory for TanStack React Query
 */

export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...productKeys.lists(), filters || {}] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (id: string) => [...productKeys.details(), id] as const,
  categories: () => [...productKeys.all, 'categories'] as const,
};

export const inventoryKeys = {
  all: ['inventory'] as const,
  materials: (filters?: Record<string, unknown>) => [...inventoryKeys.all, 'materials', filters || {}] as const,
  materialDetail: (id: string) => [...inventoryKeys.all, 'materials', 'detail', id] as const,
  categories: (filters?: Record<string, unknown>) => [...inventoryKeys.all, 'categories', filters || {}] as const,
  stock: (filters?: Record<string, unknown>) => [...inventoryKeys.all, 'stock', filters || {}] as const,
  packagings: (filters?: Record<string, unknown>) => [...inventoryKeys.all, 'packagings', filters || {}] as const,
  packagingDetail: (id: string) => [...inventoryKeys.all, 'packagings', 'detail', id] as const,
  packagingCategories: (filters?: Record<string, unknown>) => [...inventoryKeys.all, 'packagingCategories', filters || {}] as const,
  suppliers: () => [...inventoryKeys.all, 'suppliers'] as const,
  movements: (filters?: Record<string, unknown>) => [...inventoryKeys.all, 'movements', filters || {}] as const,
  adjustments: (filters?: Record<string, unknown>) => [...inventoryKeys.all, 'adjustments', filters || {}] as const,
  purchases: (filters?: Record<string, unknown>) => [...inventoryKeys.all, 'purchases', filters || {}] as const,
  opnames: (filters?: Record<string, unknown>) => [...inventoryKeys.all, 'opnames', filters || {}] as const,
};

export const posKeys = {
  all: ['pos'] as const,
  tables: (outletId?: string) => [...posKeys.all, 'tables', outletId || 'all'] as const,
  orders: (filters?: Record<string, unknown>) => [...posKeys.all, 'orders', filters || {}] as const,
  openOrders: (outletId?: string) => [...posKeys.all, 'openOrders', outletId || 'all'] as const,
  orderDetail: (id: string) => [...posKeys.all, 'orderDetail', id] as const,
};

export const settingsKeys = {
  all: ['settings'] as const,
  outlets: () => [...settingsKeys.all, 'outlets'] as const,
  tables: (outletId?: string) => [...settingsKeys.all, 'tables', outletId || 'all'] as const,
  roles: () => [...settingsKeys.all, 'roles'] as const,
  users: (filters?: Record<string, unknown>) => [...settingsKeys.all, 'users', filters || {}] as const,
  auditLogs: (filters?: Record<string, unknown>) => [...settingsKeys.all, 'auditLogs', filters || {}] as const,
};

export const reportKeys = {
  all: ['reports'] as const,
  sales: (filters?: Record<string, unknown>) => [...reportKeys.all, 'sales', filters || {}] as const,
  profit: (filters?: Record<string, unknown>) => [...reportKeys.all, 'profit', filters || {}] as const,
  inventory: (filters?: Record<string, unknown>) => [...reportKeys.all, 'inventory', filters || {}] as const,
};

