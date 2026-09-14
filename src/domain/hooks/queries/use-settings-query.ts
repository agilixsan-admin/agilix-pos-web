import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsService } from '@domain/services/settings-service';
import type { Outlet } from '@model/Auth';
import type {
  Table,
  Role,
  CreateRolePayload,
  UpdateRolePayload,
  PermissionGroup,
  UserManagementItem,
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

export function useUsers(params?: { outletId?: string }) {
  return useQuery({
    queryKey: settingsKeys.users(params),
    queryFn: () => settingsService.getUsers(params),
    staleTime: 2 * 60 * 1000,
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
    mutationFn: (data: Partial<UserManagementItem> & { password?: string }) =>
      settingsService.createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.users() });
    },
  });
}

export function useUpdateUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<UserManagementItem> }) =>
      settingsService.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.users() });
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

