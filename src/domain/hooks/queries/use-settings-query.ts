import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsService } from '@domain/services/settings-service';
import type { Outlet } from '@model/Auth';
import type { Table, UserManagementItem } from '@model/Settings';
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

export function useRoles() {
  return useQuery({
    queryKey: settingsKeys.roles(),
    queryFn: () => settingsService.getRoles(),
    staleTime: 10 * 60 * 1000,
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
