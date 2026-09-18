export interface Category {
  id: string;
  name: string;
  code?: string;
  description?: string;
  icon?: string;
  itemCount?: number;
  status?: 'ACTIVE' | 'INACTIVE' | string;
  isActive?: boolean;
}

export interface Variant {
  id?: string;
  productId?: string;
  name: string;
  sku: string;
  barcode?: string;
  price: number;
  costPrice?: number;
  stock?: number;
  status?: string;
  isActive?: boolean;
  isAvailable?: boolean;
  isOutOfStock?: boolean;
  availableStock?: number;
  missingIngredients?: string[];
  recipes?: RecipeItem[];
}

export interface RecipeItem {
  id?: string;
  inventoryItemId?: string;
  materialId?: string;
  materialName?: string;
  quantity: number;
  unit: string;
  cost?: number;
}

export interface Product {
  id: string;
  tenantId: string;
  categoryId: string;
  categoryName?: string;
  name: string;
  sku: string;
  barcode?: string;
  price: number;
  costPrice?: number;
  minPrice?: number;
  maxPrice?: number;
  totalCogs?: number;
  profitMarginPercentage?: number;
  image?: string;
  imageUrl?: string;
  description?: string;
  status?: 'ACTIVE' | 'INACTIVE' | string;
  isActive?: boolean;
  isAvailable?: boolean;
  isOutOfStock?: boolean;
  isOutletActive?: boolean;
  availableStock?: number;
  missingIngredients?: string[];
  variants?: Variant[];
  recipes?: RecipeItem[];
}

export interface OutletProductAvailability {
  outletId: string;
  outletName: string;
  outletCode: string;
  isActive: boolean;
}
