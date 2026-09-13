export type MovementType = 'IN' | 'OUT' | 'ADJUSTMENT' | 'SALE' | 'VOID' | 'WASTE';

export interface RawMaterial {
  id: string;
  tenantId: string;
  outletId: string;
  name: string;
  code: string;
  category: string;
  unit: string;
  currentStock: number;
  minimumStock: number;
  costPrice: number;
  updatedAt: string;
}

export interface PackagingItem {
  id: string;
  tenantId: string;
  outletId: string;
  name: string;
  code: string;
  unit: string;
  currentStock: number;
  minimumStock: number;
  costPrice: number;
  updatedAt: string;
}

export interface Supplier {
  id: string;
  tenantId: string;
  name: string;
  contactPerson: string;
  phone: string;
  email?: string;
  address?: string;
  isActive: boolean;
}

export interface StockMovement {
  id: string;
  tenantId: string;
  outletId: string;
  itemId: string;
  itemName: string;
  itemType: 'RAW_MATERIAL' | 'PACKAGING' | 'PRODUCT';
  quantity: number;
  direction: 'IN' | 'OUT';
  type: MovementType;
  referenceId?: string;
  reason?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
}

export interface StockAdjustmentItem {
  itemId: string;
  itemName: string;
  itemType: 'RAW_MATERIAL' | 'PACKAGING' | 'PRODUCT';
  systemStock: number;
  actualStock: number;
  difference: number;
  reasonCategory: 'DAMAGED' | 'EXPIRED' | 'LOST' | 'COUNTING_ERROR' | 'OTHER';
  notes?: string;
}

export interface StockAdjustment {
  id: string;
  tenantId: string;
  outletId: string;
  adjustmentDate: string;
  items: StockAdjustmentItem[];
  status: 'DRAFT' | 'CONFIRMED' | 'CANCELLED';
  notes?: string;
  createdByName?: string;
  createdAt: string;
}

