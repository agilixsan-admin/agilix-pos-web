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

