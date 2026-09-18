import { httpClient } from './http-client';
import type { Product, Category, OutletProductAvailability } from '@model/Product';

export const productService = {
  getProducts: async (params?: { outletId?: string; categoryId?: string; search?: string }): Promise<Product[]> => {
    const res = await httpClient.get('/products', { params });
    const raw = res.data?.data || res.data || [];
    return (Array.isArray(raw) ? raw : []).map((p: Product) => {
      let imageUrl = p.imageUrl || p.image;
      if (imageUrl && imageUrl.startsWith('htts://')) {
        imageUrl = imageUrl.replace(/^htts:\/\//, 'https://');
      }
      return {
        ...p,
        image: imageUrl,
        imageUrl,
      };
    });
  },

  getProductById: async (id: string, outletId?: string): Promise<Product> => {
    const res = await httpClient.get(`/products/${id}`, {
      params: outletId ? { outletId } : undefined,
    });
    const p = res.data?.data || res.data;
    if (!p) return p;
    let imageUrl = p.imageUrl || p.image;
    if (imageUrl && imageUrl.startsWith('htts://')) {
      imageUrl = imageUrl.replace(/^htts:\/\//, 'https://');
    }
    return {
      ...p,
      image: imageUrl,
      imageUrl,
    };
  },

  createProduct: async (productData: Partial<Product>): Promise<Product> => {
    const res = await httpClient.post('/products', productData);
    return res.data?.data || res.data;
  },

  updateProduct: async (id: string, productData: Partial<Product>): Promise<Product> => {
    const res = await httpClient.put(`/products/${id}`, productData);
    return res.data?.data || res.data;
  },

  deleteProduct: async (id: string): Promise<void> => {
    await httpClient.delete(`/products/${id}`);
  },

  getCategories: async (): Promise<Category[]> => {
    const res = await httpClient.get('/categories');
    return res.data?.data || res.data?.items || (Array.isArray(res.data) ? res.data : []);
  },

  createCategory: async (categoryData: Partial<Category>): Promise<Category> => {
    const res = await httpClient.post('/categories', categoryData);
    return res.data?.data || res.data;
  },

  updateCategory: async (id: string, categoryData: Partial<Category>): Promise<Category> => {
    const res = await httpClient.put(`/categories/${id}`, categoryData);
    return res.data?.data || res.data;
  },

  deleteCategory: async (id: string): Promise<void> => {
    await httpClient.delete(`/categories/${id}`);
  },

  uploadProductImage: async (id: string, file: File): Promise<Product> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await httpClient.post(`/products/${id}/image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data?.data || res.data;
  },

  deleteProductImage: async (id: string): Promise<Product> => {
    const res = await httpClient.delete(`/products/${id}/image`);
    return res.data?.data || res.data;
  },

  getProductOutletAvailability: async (id: string): Promise<OutletProductAvailability[]> => {
    const res = await httpClient.get(`/products/${id}/outlet-availability`);
    return res.data?.data || res.data || [];
  },

  updateProductOutletAvailability: async (
    id: string,
    outletId: string,
    isActive: boolean,
  ): Promise<{ productId: string; outletId: string; isActive: boolean }> => {
    const res = await httpClient.put(`/products/${id}/outlet-availability`, {
      outletId,
      isActive,
    });
    return res.data?.data || res.data;
  },

  batchUpdateOutletAvailability: async (
    outletId: string,
    productIds: string[],
    isActive: boolean,
  ): Promise<{ updatedCount: number }> => {
    const res = await httpClient.put('/products/outlet-availability/batch', {
      outletId,
      productIds,
      isActive,
    });
    return res.data?.data || res.data;
  },
};

