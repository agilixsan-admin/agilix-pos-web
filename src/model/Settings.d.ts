export interface Table {
  id: string;
  outletId: string;
  name: string;
  capacity: number;
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED';
  currentOrderId?: string;
  isActive: boolean;
}

export interface OrderTypeSetting {
  id: string;
  name: string;
  code: string;
  requiresTable: boolean;
  isActive: boolean;
}

export interface TaxSetting {
  id: string;
  name: string;
  code: string;
  rate: number; // e.g. 10 for 10%
  type: 'PERCENTAGE' | 'FIXED';
  isIncludedInPrice: boolean;
  isActive: boolean;
}

export interface DiscountSetting {
  id: string;
  name: string;
  code?: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number; // e.g. 10 (%) or 15000 (Rp)
  minPurchase?: number;
  maxDiscount?: number;
  isActive: boolean;
}

export type PrinterType = 'RECEIPT' | 'KITCHEN' | 'BAR';
export type PrinterConnectionType = 'BLUETOOTH' | 'NETWORK' | 'USB';
export type PrinterPaperSize = '58mm' | '80mm';
export type PrinterStatus = 'ACTIVE' | 'INACTIVE';

export interface PrinterSetting {
  id: string;
  tenantId: string;
  outletId: string;
  name: string;
  type: PrinterType;
  connectionType: PrinterConnectionType;
  paperSize: PrinterPaperSize;
  paperWidth?: '58mm' | '80mm';
  ipAddress?: string | null;
  port?: number | null;
  bluetoothMac?: string | null;
  isDefault: boolean;
  status: PrinterStatus;
  isActive?: boolean;
  targetRole?: PrinterType;
  autoCut?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type PrinterItem = PrinterSetting;

export interface CreatePrinterPayload {
  outletId: string;
  name: string;
  type: PrinterType;
  connectionType: PrinterConnectionType;
  paperSize?: PrinterPaperSize;
  ipAddress?: string;
  port?: number;
  bluetoothMac?: string;
  isDefault?: boolean;
}

export interface UpdatePrinterPayload {
  name?: string;
  type?: PrinterType;
  connectionType?: PrinterConnectionType;
  paperSize?: PrinterPaperSize;
  ipAddress?: string;
  port?: number;
  bluetoothMac?: string;
  isDefault?: boolean;
  status?: PrinterStatus;
}

export interface PrinterRoutingRule {
  categoryId: string;
  categoryName: string;
  printerId: string;
  printerName: string;
  printerType: PrinterType;
}

export interface UpdatePrinterRoutingPayload {
  outletId: string;
  routings: Array<{ categoryId: string; printerId: string }>;
}

export interface AuditLogItem {
  id: string;
  tenantId: string;
  actorType: string;
  actorId: string | null;
  actorName?: string;
  action: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface PermissionItem {
  code: string;
  name: string;
  description: string;
  action: string;
}

export interface PermissionSubGroup {
  key: string;
  title: string;
  permissions: PermissionItem[];
}

export interface PermissionGroup {
  groupKey: string;
  groupTitle: string;
  description: string;
  subGroups: PermissionSubGroup[];
}

export interface Role {
  id: string;
  tenantId: string;
  outletId: string;
  outlet?: {
    id: string;
    name: string;
  };
  name: string;
  description?: string | null;
  menuAccess?: string[];
  permissions?: string[];
  status: 'ACTIVE' | 'INACTIVE' | string;
  isSystem?: boolean;
  userCount?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateRolePayload {
  name: string;
  outletId: string;
  description?: string;
  permissions: string[];
  status?: string;
}

export interface UpdateRolePayload {
  name?: string;
  description?: string;
  permissions?: string[];
  status?: string;
}

export interface UserItem {
  id: string;
  tenantId: string;
  outletId: string | null;
  roleId: string | null;
  name: string;
  email: string;
  isSuperAdmin: boolean;
  status: 'ACTIVE' | 'INACTIVE' | string;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
  role?: {
    id: string;
    name: string;
    permissions?: string[];
    description?: string;
  } | null;
  outlet?: {
    id: string;
    name: string;
    address?: string;
  } | null;
  tenant?: {
    id: string;
    businessName: string;
  };
}

export type UserManagementItem = UserItem & {
  roleName?: string;
  outletName?: string;
  isActive?: boolean;
};

export interface CreateUserPayload {
  name: string;
  email: string;
  password?: string;
  isSuperAdmin?: boolean;
  roleId?: string;
  outletId?: string;
  status?: string;
}

export interface UpdateUserPayload {
  name?: string;
  password?: string;
  isSuperAdmin?: boolean;
  roleId?: string;
  outletId?: string;
  status?: string;
}

export interface QueryUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  outletId?: string;
  roleId?: string;
  isSuperAdmin?: boolean;
  status?: string;
}

export interface PaginatedUsersResult {
  data: UserItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

