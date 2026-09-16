import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryService } from '@domain/services/inventory-service';
import type {
  RawMaterial,
  InventoryCategory,
  PackagingItem,
  PackagingCategory,
  Supplier,
  Purchase,
  CreatePurchasePayload,
  UpdatePurchasePayload,
  ReceivePurchasePayload,
  CreateStockOpnamePayload,
  UpdateStockOpnameCountsPayload,
  CreateStockAdjustmentPayload,
  CreateReasonCategoryPayload,
} from '@model/Inventory';
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

export function useStockOverview(params?: {
  outletId?: string;
  search?: string;
  categoryId?: string;
  itemType?: string;
  status?: string;
  stockStatus?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
}) {
  return useQuery({
    queryKey: inventoryKeys.stock(params),
    queryFn: () => inventoryService.getStockOverview(params),
    staleTime: 1 * 60 * 1000,
  });
}

export function useStockItemDetail(id?: string, outletId?: string) {
  return useQuery({
    queryKey: inventoryKeys.stockDetail(id || '', outletId),
    queryFn: () => inventoryService.getInventoryItemStockById(id!, outletId),
    enabled: Boolean(id),
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
      costPrice?: number;
      extraPrice?: number;
      applyToOrderType?: 'TAKE_AWAY' | 'ALL' | 'CUSTOM';
      status?: string;
      outletId?: string;
      inventoryItemId?: string;
      unit?: string;
      minimumStock?: number;
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

// Purchase Queries
export function usePurchases(params?: {
  page?: number;
  limit?: number;
  status?: string;
  outletId?: string;
  supplierId?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}) {
  return useQuery({
    queryKey: inventoryKeys.purchases(params),
    queryFn: () => inventoryService.getPurchases(params),
  });
}

export function usePurchaseDetail(id?: string) {
  return useQuery({
    queryKey: inventoryKeys.purchaseDetail(id || ''),
    queryFn: () => inventoryService.getPurchaseById(id!),
    enabled: Boolean(id),
  });
}

// Purchase Mutations
export function useCreatePurchaseMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePurchasePayload) => inventoryService.createPurchase(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
    },
  });
}

export function useUpdatePurchaseMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePurchasePayload }) =>
      inventoryService.updatePurchase(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.purchaseDetail(variables.id) });
    },
  });
}

export function useDeletePurchaseMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => inventoryService.deletePurchase(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
    },
  });
}

export function useReceivePurchaseMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data?: ReceivePurchasePayload }) =>
      inventoryService.receivePurchase(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.purchaseDetail(variables.id) });
    },
  });
}

// Stock Opname Queries
export function useStockOpnames(params?: {
  outletId?: string;
  search?: string;
  status?: string;
  scope?: string;
  categoryId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: inventoryKeys.opnames(params),
    queryFn: () => inventoryService.getStockOpnames(params),
  });
}

export function useStockOpnameDetail(id?: string) {
  return useQuery({
    queryKey: inventoryKeys.opnameDetail(id || ''),
    queryFn: () => inventoryService.getStockOpnameById(id!),
    enabled: Boolean(id),
  });
}

// Stock Opname Mutations
export function useCreateStockOpnameMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateStockOpnamePayload) => inventoryService.createStockOpname(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.opnames() });
    },
  });
}

export function useUpdateStockOpnameCountsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateStockOpnameCountsPayload }) =>
      inventoryService.updateStockOpnameCounts(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.opnameDetail(variables.id) });
    },
  });
}

export function useFinalizeStockOpnameMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      inventoryService.finalizeStockOpname(id, notes),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.opnameDetail(variables.id) });
    },
  });
}

export function useCancelStockOpnameMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      inventoryService.cancelStockOpname(id, notes),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.opnameDetail(variables.id) });
    },
  });
}

// Stock Adjustment Queries
export function useStockAdjustments(params?: {
  outletId?: string;
  inventoryItemId?: string;
  reasonCategoryId?: string;
  type?: 'IN' | 'OUT';
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: inventoryKeys.adjustments(params),
    queryFn: () => inventoryService.getAdjustments(params),
  });
}

export function useStockAdjustmentDetail(id?: string) {
  return useQuery({
    queryKey: inventoryKeys.adjustmentDetail(id || ''),
    queryFn: () => inventoryService.getAdjustmentById(id!),
    enabled: Boolean(id),
  });
}

// Stock Adjustment Mutations
export function useCreateStockAdjustmentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateStockAdjustmentPayload) => inventoryService.createAdjustment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.adjustments() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.stock() });
    },
  });
}

// Reason Category Queries & Mutations
export function useReasonCategories(params?: { type?: string }) {
  return useQuery({
    queryKey: inventoryKeys.reasonCategories(params),
    queryFn: () => inventoryService.getReasonCategories(params),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateReasonCategoryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateReasonCategoryPayload) => inventoryService.createReasonCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.reasonCategories() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
    },
  });
}

export function useUploadAdjustmentProofMutation() {
  return useMutation({
    mutationFn: (file: File) => inventoryService.uploadAdjustmentProof(file),
  });
}




