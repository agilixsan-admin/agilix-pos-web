export interface Category {
  id: string;
  name: string;
  code?: string;
  description?: string;
  icon?: string;
  itemCount?: number;
}

export interface Variant {
  id: string;
  productId: string;
  name: string;
  sku: string;
  price: number;
  costPrice?: number;
  stock?: number;
  isActive: boolean;
}

export interface RecipeItem {
  id: string;
  materialId: string;
  materialName: string;
  quantity: number;
  unit: string;
  cost: number;
}

export interface Product {
  id: string;
  tenantId: string;
  categoryId: string;
  categoryName?: string;
  name: string;
  sku: string;
  price: number;
  costPrice?: number;
  image?: string;
  description?: string;
  isActive: boolean;
  variants: Variant[];
  recipes?: RecipeItem[];
}

