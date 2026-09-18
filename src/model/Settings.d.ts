export interface Table {
  id: string;
  outletId: string;
  name: string;
  tableNumber?: string;
  capacity: number;
  section?: string;
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED';
  currentOrderId?: string;
  isActive?: boolean;
}

export interface OrderTypeSetting {
  id: string;
  name: string;
  code: string;
  requiresTable: boolean;
  isActive: boolean;
}

export type TaxType = 'INCLUSIVE' | 'EXCLUSIVE';
export type TaxStatus = 'ACTIVE' | 'INACTIVE';

export interface TaxItem {
  id: string;
  tenantId: string;
  outletId?: string | null;
  outlet?: {
    id: string;
    name: string;
  } | null;
  name: string;
  description?: string | null;
  rate: number;
  type: TaxType;
  status: TaxStatus;
  isGlobal: boolean;
  code?: string;
  isIncludedInPrice?: boolean;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type TaxSetting = TaxItem;

export interface CreateTaxPayload {
  name: string;
  description?: string;
  rate: number;
  type: TaxType;
  status?: TaxStatus;
  isGlobal?: boolean;
  outletId?: string;
}

export interface UpdateTaxPayload {
  name?: string;
  description?: string;
  rate?: number;
  type?: TaxType;
  status?: TaxStatus;
  isGlobal?: boolean;
  outletId?: string | null;
}

export type VoidVerificationMode = 'NONE' | 'SELF_PASSWORD' | 'SUPERVISOR_APPROVAL';

export interface GlobalTaxConfig {
  enableTaxCalculation: boolean;
  defaultGlobalTaxId?: string | null;
  defaultGlobalTax?: TaxItem | null;
  serviceChargeEnabled?: boolean;
  serviceChargeRate?: number;
  serviceChargeName?: string;
  serviceChargeApplicableTo?: 'ALL' | 'DINE_IN';
  voidVerificationMode?: VoidVerificationMode;
}

export interface UpdateGlobalTaxConfigPayload {
  enableTaxCalculation?: boolean;
  defaultGlobalTaxId?: string | null;
  outletId?: string;
  serviceChargeEnabled?: boolean;
  serviceChargeRate?: number;
  serviceChargeName?: string;
  serviceChargeApplicableTo?: 'ALL' | 'DINE_IN';
  voidVerificationMode?: VoidVerificationMode;
}

export interface PosSettings {
  id: string;
  tenantId: string;
  outletId?: string | null;
  taxEnabled: boolean;
  taxRate: number;
  taxName: string;
  discountEnabled: boolean;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  cashEnabled: boolean;
  qrisEnabled: boolean;
  voidVerificationMode: VoidVerificationMode;
  billLogoUrl?: string | null;
  billFooterText?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdatePosSettingsPayload {
  outletId?: string | null;
  taxEnabled?: boolean;
  taxRate?: number;
  taxName?: string;
  discountEnabled?: boolean;
  discountType?: 'PERCENTAGE' | 'FIXED';
  discountValue?: number;
  cashEnabled?: boolean;
  qrisEnabled?: boolean;
  voidVerificationMode?: VoidVerificationMode;
  billLogoUrl?: string | null;
  billFooterText?: string | null;
}

export type DiscountCalculationType = 'PERCENTAGE' | 'FIXED';
export type DiscountValidityType = 'ALWAYS_ACTIVE' | 'RECURRING_WEEKLY' | 'DATE_RANGE';
export type DiscountScope = 'ALL_PRODUCTS' | 'SPECIFIC_PRODUCTS';
export type DiscountStatus = 'ACTIVE' | 'INACTIVE';

export interface DiscountItem {
  id: string;
  tenantId: string;
  outletId?: string | null;
  outlet?: {
    id: string;
    name: string;
  } | null;
  isGlobal?: boolean;
  name: string;
  type: DiscountCalculationType;
  value: number;
  validityType: DiscountValidityType;
  recurringDays?: string[] | null;
  startDate?: string | null;
  endDate?: string | null;
  minOrderAmount: number;
  maxDiscountAmount?: number | null;
  applicableScope: DiscountScope;
  status: DiscountStatus;
  productIds?: string[];
  products?: { id: string; name: string; price: number }[];
  code?: string;
  minPurchase?: number;
  maxDiscount?: number;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type DiscountSetting = DiscountItem;

export interface CreateDiscountPayload {
  outletId?: string;
  isGlobal?: boolean;
  name: string;
  type: DiscountCalculationType;
  value: number;
  validityType: DiscountValidityType;
  recurringDays?: string[];
  startDate?: string;
  endDate?: string;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  applicableScope?: DiscountScope;
  productIds?: string[];
  status?: DiscountStatus;
}

export interface UpdateDiscountPayload {
  outletId?: string | null;
  isGlobal?: boolean;
  name?: string;
  type?: DiscountCalculationType;
  value?: number;
  validityType?: DiscountValidityType;
  recurringDays?: string[] | null;
  startDate?: string | null;
  endDate?: string | null;
  minOrderAmount?: number;
  maxDiscountAmount?: number | null;
  applicableScope?: DiscountScope;
  productIds?: string[];
  status?: DiscountStatus;
}

export interface QueryDiscountParams {
  outletId?: string;
  status?: DiscountStatus;
  validityType?: DiscountValidityType;
  search?: string;
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
    menuAccess?: string[];
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

