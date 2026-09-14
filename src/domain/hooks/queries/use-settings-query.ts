import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsService } from '@domain/services/settings-service';
import type { Outlet } from '@model/Auth';
import type {
  Table,
  Role,
  CreateRolePayload,
  UpdateRolePayload,
  PermissionGroup,
  UserItem,
  UserManagementItem,
  CreateUserPayload,
  UpdateUserPayload,
  QueryUsersParams,
  PrinterSetting,
  CreatePrinterPayload,
  UpdatePrinterPayload,
  PrinterRoutingRule,
  UpdatePrinterRoutingPayload,
  TaxItem,
  TaxSetting,
  CreateTaxPayload,
  UpdateTaxPayload,
  GlobalTaxConfig,
  UpdateGlobalTaxConfigPayload,
} from '@model/Settings';
import { settingsKeys } from './query-keys';

export function useOutlets() {
  return useQuery({
    queryKey: settingsKeys.outlets(),
    queryFn: () => settingsService.getOutlets(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useSettingsTables(outletId?: string) {
  return useQuery({
    queryKey: settingsKeys.tables(outletId),
    queryFn: () => settingsService.getTables(outletId),
    staleTime: 2 * 60 * 1000,
  });
}

export function useRoles(params?: { outletId?: string }) {
  return useQuery({
    queryKey: settingsKeys.roles(params),
    queryFn: () => settingsService.getRoles(params),
    staleTime: 5 * 60 * 1000,
  });
}

export function useRoleDetail(id?: string) {
  return useQuery({
    queryKey: settingsKeys.roleDetail(id || ''),
    queryFn: () => settingsService.getRoleById(id!),
    enabled: Boolean(id),
  });
}

export function usePermissionsCatalog() {
  return useQuery({
    queryKey: settingsKeys.permissionsCatalog(),
    queryFn: () => settingsService.getPermissionsCatalog(),
    staleTime: 60 * 60 * 1000, // Long cache for static RBAC catalog
  });
}

export function useUsers(params?: QueryUsersParams) {
  return useQuery({
    queryKey: settingsKeys.users(params as Record<string, unknown>),
    queryFn: () => settingsService.getUsers(params),
    staleTime: 2 * 60 * 1000,
  });
}

export function useUserDetail(id?: string) {
  return useQuery({
    queryKey: settingsKeys.userDetail(id || ''),
    queryFn: () => settingsService.getUserById(id!),
    enabled: Boolean(id),
  });
}

export function useAuditLogs(params?: {
  action?: string;
  actorType?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: settingsKeys.auditLogs(params),
    queryFn: () => settingsService.getAuditLogs(params),
  });
}

// Mutations
export function useCreateOutletMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Outlet>) => settingsService.createOutlet(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.outlets() });
    },
  });
}

export function useUpdateOutletMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Outlet> }) =>
      settingsService.updateOutlet(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.outlets() });
    },
  });
}

export function useCreateTableMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Table>) => settingsService.createTable(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.tables() });
    },
  });
}

export function useUpdateTableMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Table> }) =>
      settingsService.updateTable(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.tables() });
    },
  });
}

export function useDeleteTableMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => settingsService.deleteTable(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.tables() });
    },
  });
}

export function useCreateUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateUserPayload) => settingsService.createUser(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.users() });
      queryClient.invalidateQueries({ queryKey: settingsKeys.all });
    },
  });
}

export function useUpdateUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserPayload }) =>
      settingsService.updateUser(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.users() });
      queryClient.invalidateQueries({ queryKey: settingsKeys.userDetail(variables.id) });
      queryClient.invalidateQueries({ queryKey: settingsKeys.all });
    },
  });
}

export function useResendInvitationMutation() {
  return useMutation({
    mutationFn: (id: string) => settingsService.resendInvitation(id),
  });
}

export function useDeleteUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => settingsService.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.users() });
      queryClient.invalidateQueries({ queryKey: settingsKeys.all });
    },
  });
}

// Role Mutations
export function useCreateRoleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRolePayload) => settingsService.createRole(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.roles() });
      queryClient.invalidateQueries({ queryKey: settingsKeys.all });
    },
  });
}

export function useUpdateRoleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRolePayload }) =>
      settingsService.updateRole(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.roles() });
      queryClient.invalidateQueries({ queryKey: settingsKeys.roleDetail(variables.id) });
      queryClient.invalidateQueries({ queryKey: settingsKeys.all });
    },
  });
}

export function useDeleteRoleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => settingsService.deleteRole(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.roles() });
      queryClient.invalidateQueries({ queryKey: settingsKeys.all });
    },
  });
}

// Printer Queries & Mutations
export function usePrinters(outletId?: string) {
  return useQuery({
    queryKey: settingsKeys.printers(outletId),
    queryFn: () => settingsService.getPrinters(outletId),
    staleTime: 60 * 1000,
  });
}

export function usePrinterDetail(id?: string) {
  return useQuery({
    queryKey: settingsKeys.printerDetail(id || ''),
    queryFn: () => settingsService.getPrinterById(id!),
    enabled: Boolean(id),
  });
}

export function usePrinterRoutingRules(outletId?: string) {
  return useQuery({
    queryKey: settingsKeys.printerRoutingRules(outletId),
    queryFn: () => settingsService.getPrinterRoutingRules(outletId!),
    enabled: Boolean(outletId),
    staleTime: 60 * 1000,
  });
}

export function useCreatePrinterMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePrinterPayload) => settingsService.createPrinter(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.all });
    },
  });
}

export function useUpdatePrinterMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePrinterPayload }) =>
      settingsService.updatePrinter(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.all });
    },
  });
}

export function useDeletePrinterMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => settingsService.deletePrinter(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.all });
    },
  });
}

export function useTestPrintMutation() {
  return useMutation({
    mutationFn: (id: string) => settingsService.testPrint(id),
  });
}

export function useUpdatePrinterRoutingRulesMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdatePrinterRoutingPayload) =>
      settingsService.updatePrinterRoutingRules(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.all });
    },
  });
}

// Tax Queries & Mutations
export function useTaxes(params?: { outletId?: string; status?: string; type?: string; search?: string }) {
  return useQuery({
    queryKey: settingsKeys.taxes(params),
    queryFn: () => settingsService.getTaxes(params),
    staleTime: 60 * 1000,
  });
}

export function useTaxDetail(id?: string) {
  return useQuery({
    queryKey: settingsKeys.taxDetail(id || ''),
    queryFn: () => settingsService.getTaxById(id!),
    enabled: Boolean(id),
  });
}

export function useGlobalTaxConfig(outletId?: string) {
  return useQuery({
    queryKey: settingsKeys.taxGlobalConfig(outletId),
    queryFn: () => settingsService.getGlobalTaxConfig(outletId),
    staleTime: 60 * 1000,
  });
}

export function useCreateTaxMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTaxPayload) => settingsService.createTax(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.all });
    },
  });
}

export function useUpdateTaxMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTaxPayload }) =>
      settingsService.updateTax(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.all });
    },
  });
}

export function useDeleteTaxMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => settingsService.deleteTax(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.all });
    },
  });
}

export function useUpdateGlobalTaxConfigMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateGlobalTaxConfigPayload) =>
      settingsService.updateGlobalTaxConfig(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.all });
    },
  });
}



