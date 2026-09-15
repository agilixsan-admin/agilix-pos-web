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
  extraPrice?: number;
  applyToOrderType?: 'TAKE_AWAY' | 'ALL' | 'CUSTOM';
  description?: string;
  supplierId?: string;
  supplierName?: string;
  status?: 'ACTIVE' | 'INACTIVE' | string;
  isActive?: boolean;
  inventoryItemId?: string;
  inventoryItem?: InventoryItem;
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

export interface ReasonCategory {
  id: string;
  tenantId?: string;
  name: string;
  type: 'IN' | 'OUT' | 'BOTH';
  status: 'ACTIVE' | 'INACTIVE' | string;
  createdAt?: string;
  updatedAt?: string;
}

export interface StockAdjustment {
  id: string;
  tenantId: string;
  outletId: string;
  outlet?: {
    id: string;
    name: string;
  };
  adjustmentNumber: string;
  adjustmentDate: string;
  type: 'IN' | 'OUT';
  inventoryItemId: string;
  inventoryItem?: {
    id: string;
    name: string;
    sku?: string | null;
    unit?: string;
    itemType?: 'RAW_MATERIAL' | 'PACKAGING' | string;
    unitCost?: number;
    category?: {
      id: string;
      name: string;
    } | null;
  };
  previousStock: number;
  quantity: number;
  currentStock: number;
  reasonCategoryId?: string | null;
  reasonCategory?: ReasonCategory | null;
  notes?: string | null;
  imageUrl?: string | null;
  source: 'MANUAL' | 'STOCK_OPNAME';
  status: string;
  createdBy?: string | null;
  creator?: {
    id: string;
    name: string;
  } | null;
  createdAt: string;
  updatedAt?: string;
}

export interface StockAdjustmentSummary {
  totalAdjustments: number;
  totalIn: number;
  totalOut: number;
  totalLossValue: number;
}

export interface PaginatedStockAdjustmentsResult {
  data: StockAdjustment[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  summary: StockAdjustmentSummary;
}

export interface CreateStockAdjustmentPayload {
  outletId?: string;
  inventoryItemId: string;
  type: 'IN' | 'OUT';
  quantity: number;
  adjustmentDate?: string;
  reasonCategoryId?: string;
  notes?: string;
  imageUrl?: string;
  source?: 'MANUAL' | 'STOCK_OPNAME';
}

export interface CreateReasonCategoryPayload {
  name: string;
  type?: 'IN' | 'OUT' | 'BOTH';
  status?: string;
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

export type StockOpnameStatus = 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type StockOpnameItemStatus = 'UNCOUNTED' | 'MATCH' | 'DEFICIT' | 'SURPLUS';

export interface StockOpnameItem {
  id: string;
  tenantId?: string;
  stockOpnameId: string;
  inventoryItemId: string;
  inventoryItem?: {
    id: string;
    name: string;
    sku?: string | null;
    unit?: string;
    unitCost?: number;
    itemType?: 'RAW_MATERIAL' | 'PACKAGING' | string;
    category?: InventoryCategory | null;
  };
  systemStock: number;
  actualStock: number | null;
  difference: number;
  status: StockOpnameItemStatus;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface StockOpname {
  id: string;
  tenantId: string;
  outletId: string;
  outlet?: {
    id: string;
    name: string;
  };
  opnameNumber: string;
  opnameDate: string;
  status: StockOpnameStatus;
  scope: 'ALL' | 'CATEGORY';
  categoryId?: string | null;
  category?: InventoryCategory | null;
  totalItems: number;
  countedItems: number;
  matchedItems: number;
  deficitItems: number;
  surplusItems: number;
  totalDifferenceValue: number;
  notes?: string | null;
  finalizedAt?: string | null;
  finalizedBy?: string | null;
  finalizer?: {
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
  items: StockOpnameItem[];
}

export interface CreateStockOpnamePayload {
  outletId: string;
  scope?: 'ALL' | 'CATEGORY';
  categoryId?: string;
  opnameDate?: string;
  notes?: string;
}

export interface UpdateStockOpnameCountItemPayload {
  inventoryItemId: string;
  actualStock: number;
  notes?: string;
}

export interface UpdateStockOpnameCountsPayload {
  items: UpdateStockOpnameCountItemPayload[];
}

export interface PaginatedStockOpnamesResult {
  data: StockOpname[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}




