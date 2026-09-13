import { httpClient } from './http-client';
import type { Product, Category } from '@model/Product';

export const productService = {
  getProducts: async (params?: { outletId?: string; categoryId?: string; search?: string }): Promise<Product[]> => {
    const res = await httpClient.get('/products', { params });
    return res.data?.data || res.data || [];
  },

  getProductById: async (id: string): Promise<Product> => {
    const res = await httpClient.get(`/products/${id}`);
    return res.data?.data || res.data;
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
    return res.data?.data || res.data || [];
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
};

