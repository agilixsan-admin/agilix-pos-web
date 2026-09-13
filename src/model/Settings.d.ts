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

export interface Role {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  permissions: string[];
  isSystem?: boolean;
}

export interface UserManagementItem {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  roleId: string;
  roleName: string;
  outletId?: string;
  outletName?: string;
  isActive: boolean;
  createdAt: string;
}
