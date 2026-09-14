import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryService } from '@domain/services/inventory-service';
import type { RawMaterial, InventoryCategory, PackagingItem, PackagingCategory, Supplier } from '@model/Inventory';
import { inventoryKeys } from './query-keys';

export function useRawMaterials(params?: { outletId?: string; search?: string; categoryId?: string }) {
  return useQuery({
    queryKey: inventoryKeys.materials(params),
    queryFn: () => inventoryService.getRawMaterials(params),
    staleTime: 2 * 60 * 1000,
  });
}

export function useRawMaterialDetail(id?: string) {
  return useQuery({
    queryKey: inventoryKeys.materialDetail(id || ''),
    queryFn: () => inventoryService.getRawMaterialById(id!),
    enabled: Boolean(id),
  });
}

export function useInventoryCategories(params?: { search?: string }) {
  return useQuery({
    queryKey: inventoryKeys.categories(params),
    queryFn: () => inventoryService.getInventoryCategories(params),
    staleTime: 5 * 60 * 1000,
  });
}

export function usePackagingItems(params?: { outletId?: string; search?: string; categoryId?: string; status?: string }) {
  return useQuery({
    queryKey: inventoryKeys.packagings(params),
    queryFn: () => inventoryService.getPackagingItems(params),
    staleTime: 3 * 60 * 1000,
  });
}

export function usePackagingDetail(id?: string) {
  return useQuery({
    queryKey: inventoryKeys.packagingDetail(id || ''),
    queryFn: () => inventoryService.getPackagingById(id!),
    enabled: Boolean(id),
  });
}

export function usePackagingCategories(params?: { search?: string; status?: string }) {
  return useQuery({
    queryKey: inventoryKeys.packagingCategories(params),
    queryFn: () => inventoryService.getPackagingCategories(params),
    staleTime: 5 * 60 * 1000,
  });
}

export function useSuppliers(params?: { search?: string; status?: string }) {
  return useQuery({
    queryKey: inventoryKeys.suppliers(params),
    queryFn: () => inventoryService.getSuppliers(params),
    staleTime: 5 * 60 * 1000,
  });
}

export function useSupplierDetail(id?: string) {
  return useQuery({
    queryKey: inventoryKeys.supplierDetail(id || ''),
    queryFn: () => inventoryService.getSupplierById(id!),
    enabled: Boolean(id),
  });
}

export function useStockMovements(params?: { outletId?: string; itemId?: string; startDate?: string; endDate?: string }) {
  return useQuery({
    queryKey: inventoryKeys.movements(params),
    queryFn: () => inventoryService.getStockMovements(params),
  });
}

export function useStockAdjustments(params?: { outletId?: string }) {
  return useQuery({
    queryKey: inventoryKeys.adjustments(params),
    queryFn: () => inventoryService.getAdjustments(params),
  });
}

// Mutations
export function useCreateRawMaterialMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      name: string;
      sku?: string;
      categoryId?: string;
      description?: string;
      unit: string;
      minimumStock?: number;
      status?: string;
    }) => inventoryService.createRawMaterial(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
    },
  });
}

export function useUpdateRawMaterialMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<RawMaterial> }) =>
      inventoryService.updateRawMaterial(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.materialDetail(variables.id) });
    },
  });
}

export function useDeleteRawMaterialMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => inventoryService.deleteRawMaterial(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
    },
  });
}

export function useCreateInventoryCategoryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; description?: string; status?: string }) =>
      inventoryService.createInventoryCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.categories() });
    },
  });
}

export function useUpdateInventoryCategoryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; description?: string; status?: string } }) =>
      inventoryService.updateInventoryCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.categories() });
    },
  });
}

export function useDeleteInventoryCategoryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => inventoryService.deleteInventoryCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.categories() });
    },
  });
}

// Packaging Item Mutations
export function useCreatePackagingMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      name: string;
      sku?: string;
      categoryId?: string;
      description?: string;
      unit?: string;
      unitCost?: number;
      minimumStock?: number;
      status?: string;
      outletId?: string;
    }) => inventoryService.createPackaging(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
    },
  });
}

export function useUpdatePackagingMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PackagingItem> }) =>
      inventoryService.updatePackaging(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.packagingDetail(variables.id) });
    },
  });
}

export function useDeletePackagingMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => inventoryService.deletePackaging(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
    },
  });
}

// Packaging Category Mutations
export function useCreatePackagingCategoryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; description?: string; status?: string }) =>
      inventoryService.createPackagingCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.packagingCategories() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.categories() });
    },
  });
}

export function useUpdatePackagingCategoryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; description?: string; status?: string } }) =>
      inventoryService.updatePackagingCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.packagingCategories() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.categories() });
    },
  });
}

export function useDeletePackagingCategoryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => inventoryService.deletePackagingCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.packagingCategories() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.categories() });
    },
  });
}

// Supplier Mutations
export function useCreateSupplierMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Supplier>) => inventoryService.createSupplier(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.suppliers() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
    },
  });
}

export function useUpdateSupplierMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Supplier> }) =>
      inventoryService.updateSupplier(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.suppliers() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.supplierDetail(variables.id) });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
    },
  });
}

export function useDeleteSupplierMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => inventoryService.deleteSupplier(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.suppliers() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
    },
  });
}

