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
  recipes?: any[];
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
  image?: string;
  description?: string;
  status?: 'ACTIVE' | 'INACTIVE' | string;
  isActive?: boolean;
  variants?: Variant[];
  recipes?: RecipeItem[];
}
