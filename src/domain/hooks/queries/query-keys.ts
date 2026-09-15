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
  stockDetail: (id: string, outletId?: string) => [...inventoryKeys.all, 'stock', 'detail', id, outletId || ''] as const,
  packagings: (filters?: Record<string, unknown>) => [...inventoryKeys.all, 'packagings', filters || {}] as const,
  packagingDetail: (id: string) => [...inventoryKeys.all, 'packagings', 'detail', id] as const,
  packagingCategories: (filters?: Record<string, unknown>) => [...inventoryKeys.all, 'packagingCategories', filters || {}] as const,
  suppliers: (filters?: Record<string, unknown>) => [...inventoryKeys.all, 'suppliers', filters || {}] as const,
  supplierDetail: (id: string) => [...inventoryKeys.all, 'suppliers', 'detail', id] as const,
  movements: (filters?: Record<string, unknown>) => [...inventoryKeys.all, 'movements', filters || {}] as const,
  adjustments: (filters?: Record<string, unknown>) => [...inventoryKeys.all, 'adjustments', filters || {}] as const,
  adjustmentDetail: (id: string) => [...inventoryKeys.all, 'adjustments', 'detail', id] as const,
  reasonCategories: (filters?: Record<string, unknown>) => [...inventoryKeys.all, 'reasonCategories', filters || {}] as const,
  purchases: (filters?: Record<string, unknown>) => [...inventoryKeys.all, 'purchases', filters || {}] as const,
  purchaseDetail: (id: string) => [...inventoryKeys.all, 'purchases', 'detail', id] as const,
  opnames: (filters?: Record<string, unknown>) => [...inventoryKeys.all, 'opnames', filters || {}] as const,
  opnameDetail: (id: string) => [...inventoryKeys.all, 'opnames', 'detail', id] as const,
};

import type { QueryOrderParams } from '@model/Order';

export const posKeys = {
  all: ['pos'] as const,
  tables: (outletId?: string) => [...posKeys.all, 'tables', outletId || 'all'] as const,
  orders: (filters?: QueryOrderParams | Record<string, unknown>) => [...posKeys.all, 'orders', filters || {}] as const,
  openOrders: (outletId?: string) => [...posKeys.all, 'openOrders', outletId || 'all'] as const,
  orderDetail: (id: string) => [...posKeys.all, 'orderDetail', id] as const,
};

export const settingsKeys = {
  all: ['settings'] as const,
  outlets: () => [...settingsKeys.all, 'outlets'] as const,
  tables: (outletId?: string) => [...settingsKeys.all, 'tables', outletId || 'all'] as const,
  roles: (filters?: Record<string, unknown>) => [...settingsKeys.all, 'roles', filters || {}] as const,
  roleDetail: (id: string) => [...settingsKeys.all, 'roles', 'detail', id] as const,
  permissionsCatalog: () => [...settingsKeys.all, 'permissionsCatalog'] as const,
  users: (filters?: Record<string, unknown>) => [...settingsKeys.all, 'users', filters || {}] as const,
  userDetail: (id: string) => [...settingsKeys.all, 'users', 'detail', id] as const,
  printers: (outletId?: string) => [...settingsKeys.all, 'printers', outletId || 'all'] as const,
  printerDetail: (id: string) => [...settingsKeys.all, 'printers', 'detail', id] as const,
  printerRoutingRules: (outletId?: string) => [...settingsKeys.all, 'printers', 'routing', outletId || 'all'] as const,
  taxes: (filters?: Record<string, unknown>) => [...settingsKeys.all, 'taxes', filters || {}] as const,
  taxDetail: (id: string) => [...settingsKeys.all, 'taxes', 'detail', id] as const,
  taxGlobalConfig: (outletId?: string) => [...settingsKeys.all, 'taxes', 'globalConfig', outletId || 'all'] as const,
  discounts: (filters?: Record<string, unknown>) => [...settingsKeys.all, 'discounts', filters || {}] as const,
  discountDetail: (id: string) => [...settingsKeys.all, 'discounts', 'detail', id] as const,
  applicableDiscounts: (filters?: Record<string, unknown>) => [...settingsKeys.all, 'discounts', 'applicable', filters || {}] as const,
  auditLogs: (filters?: Record<string, unknown>) => [...settingsKeys.all, 'auditLogs', filters || {}] as const,
};

export const reportKeys = {
  all: ['reports'] as const,
  sales: (filters?: Record<string, unknown>) => [...reportKeys.all, 'sales', filters || {}] as const,
  profit: (filters?: Record<string, unknown>) => [...reportKeys.all, 'profit', filters || {}] as const,
  inventory: (filters?: Record<string, unknown>) => [...reportKeys.all, 'inventory', filters || {}] as const,
};

