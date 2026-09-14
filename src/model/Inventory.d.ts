export type MovementType = 'IN' | 'OUT' | 'ADJUSTMENT' | 'SALE' | 'VOID' | 'WASTE';

export interface InventoryCategory {
  id: string;
  tenantId?: string;
  name: string;
  description?: string;
  status: 'ACTIVE' | 'INACTIVE' | string;
  itemCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface PackagingCategory {
  id: string;
  tenantId?: string;
  name: string;
  description?: string;
  status: 'ACTIVE' | 'INACTIVE' | string;
  itemCount?: number;
  packagingCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface RawMaterial {
  id: string;
  tenantId: string;
  outletId?: string;
  name: string;
  sku?: string;
  code?: string;
  categoryId?: string;
  category?: string | InventoryCategory;
  categoryName?: string;
  unit: string;
  currentStock?: number;
  minimumStock?: number;
  minStock?: number;
  unitCost?: number;
  costPrice?: number;
  storageLocation?: string;
  description?: string;
  status?: 'ACTIVE' | 'INACTIVE' | string;
  createdAt?: string;
  updatedAt?: string;
  stocks?: { outletId: string; quantity: number }[];
}

export interface PackagingItem {
  id: string;
  tenantId?: string;
  outletId?: string;
  name: string;
  sku?: string;
  code?: string;
  categoryId?: string;
  category?: string | PackagingCategory | InventoryCategory;
  categoryName?: string;
  unit: string;
  currentStock?: number;
  minimumStock?: number;
  minStock?: number;
  unitCost?: number;
  costPrice?: number;
  description?: string;
  supplierId?: string;
  supplierName?: string;
  status?: 'ACTIVE' | 'INACTIVE' | string;
  isActive?: boolean;
  inventoryItemId?: string;
  inventoryItem?: any;
  createdAt?: string;
  updatedAt?: string;
  stocks?: { outletId: string; quantity: number }[];
}

export interface Supplier {
  id: string;
  tenantId?: string;
  code?: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  notes?: string;
  status?: 'ACTIVE' | 'INACTIVE' | string;
  isActive?: boolean;
  totalPurchases?: number;
  lastPurchaseDate?: string;
  createdByName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface StockMovement {
  id: string;
  tenantId: string;
  outletId: string;
  itemId?: string;
  inventoryItemId?: string;
  itemName?: string;
  itemType?: 'RAW_MATERIAL' | 'PACKAGING' | 'PRODUCT' | string;
  quantity: number;
  direction?: 'IN' | 'OUT';
  type?: MovementType | string;
  movementType?: string;
  referenceType?: string | null;
  referenceId?: string | null;
  reason?: string | null;
  notes?: string | null;
  movementDate?: string;
  createdBy?: string | null;
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

export type PurchaseStatus = 'DRAFT' | 'RECEIVED' | 'CANCELLED';

export interface PurchaseItem {
  id: string;
  tenantId?: string;
  purchaseId: string;
  inventoryItemId: string;
  inventoryItem?: {
    id: string;
    name: string;
    sku?: string | null;
    unit?: string;
    itemType?: 'RAW_MATERIAL' | 'PACKAGING' | string;
    unitCost?: number;
  };
  quantityOrdered: number;
  quantityReceived: number;
  unitCost: number;
  subtotal: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Purchase {
  id: string;
  tenantId: string;
  outletId: string;
  outlet?: {
    id: string;
    name: string;
  };
  supplierId: string;
  supplier?: Supplier;
  purchaseNumber: string;
  purchaseDate: string;
  status: PurchaseStatus;
  totalItems: number;
  subtotal: number;
  totalAmount: number;
  notes?: string | null;
  receivedAt?: string | null;
  receivedBy?: string | null;
  receiver?: {
    id: string;
    name: string;
  } | null;
  createdBy?: string | null;
  creator?: {
    id: string;
    name: string;
  } | null;
  createdAt: string;
  updatedAt: string;
  items: PurchaseItem[];
}

export interface CreatePurchaseItemPayload {
  inventoryItemId: string;
  quantityOrdered: number;
  unitCost: number;
}

export interface CreatePurchasePayload {
  outletId: string;
  supplierId: string;
  purchaseNumber?: string;
  purchaseDate?: string;
  notes?: string;
  items: CreatePurchaseItemPayload[];
}

export interface UpdatePurchasePayload {
  outletId?: string;
  supplierId?: string;
  purchaseDate?: string;
  notes?: string;
  items?: CreatePurchaseItemPayload[];
}

export interface ReceivePurchaseItemPayload {
  itemId: string;
  quantityReceived: number;
}

export interface ReceivePurchasePayload {
  items?: ReceivePurchaseItemPayload[];
  notes?: string;
}

export type StockStatus = 'NORMAL' | 'LOW_STOCK' | 'OUT_OF_STOCK';

export interface StockSummary {
  totalItems: number;
  totalInventoryValue: number;
  lowStockCount: number;
  outOfStockCount: number;
}

export interface InventoryItemStock {
  id: string;
  tenantId: string;
  itemType: 'RAW_MATERIAL' | 'PACKAGING' | string;
  name: string;
  sku?: string | null;
  description?: string | null;
  unit: string;
  unitCost: number;
  minimumStock: number;
  status: string;
  categoryId?: string | null;
  category?: InventoryCategory | null;
  stocks?: { id?: string; outletId: string; quantity: number }[];
  currentStock: number;
  stockValue: number;
  stockStatus: StockStatus | string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaginatedInventoryStockResult {
  data: InventoryItemStock[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  summary: StockSummary;
}



