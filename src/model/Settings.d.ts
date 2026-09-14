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

export interface PrinterSetting {
  id: string;
  name: string;
  type: 'BLUETOOTH' | 'NETWORK' | 'USB';
  paperWidth: '58mm' | '80mm';
  ipAddress?: string;
  targetRole: 'RECEIPT' | 'KITCHEN' | 'BAR';
  autoCut: boolean;
  isActive: boolean;
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

export interface UserManagementItem {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  roleId: string;
  roleName: string;
  role?: { id: string; name: string };
  outletId?: string;
  outletName?: string;
  outlet?: { id: string; name: string };
  isActive: boolean;
  createdAt: string;
}
