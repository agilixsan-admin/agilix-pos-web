import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financeService } from '@domain/services/finance-service';
import { financeKeys } from './query-keys';
import type {
  CreateAccountPayload,
  CreateTransferPayload,
  CreateExpensePayload,
  CreateAssetPayload,
  DisposeAssetPayload,
  CreateManualJournalPayload,
} from '@model/Finance';

// ─── Accounts (Kas & Bank) ──────────────────────────────────────────────────
export function useFinancialAccounts(outletId?: string) {
  return useQuery({
    queryKey: financeKeys.accounts(outletId),
    queryFn: () => financeService.getAccounts(outletId),
  });
}

export function useCreateAccountMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAccountPayload) => financeService.createAccount(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeKeys.all });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}

export function useUpdateAccountMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CreateAccountPayload> }) =>
      financeService.updateAccount(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeKeys.all });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}

// ─── Transfers ──────────────────────────────────────────────────────────────
export function useFinancialTransfers(params?: { startDate?: string; endDate?: string }) {
  return useQuery({
    queryKey: financeKeys.transfers(params),
    queryFn: () => financeService.getTransfers(params),
  });
}

export function useCreateTransferMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTransferPayload) => financeService.createTransfer(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeKeys.all });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}

// ─── Expenses (Biaya Operasional) ───────────────────────────────────────────
export function useExpenseCategories() {
  return useQuery({
    queryKey: financeKeys.categories(),
    queryFn: () => financeService.getExpenseCategories(),
  });
}

export function useCreateExpenseCategoryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { name: string; description?: string }) =>
      financeService.createExpenseCategory(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeKeys.categories() });
    },
  });
}

export function useExpenses(params?: {
  outletId?: string;
  categoryId?: string;
  startDate?: string;
  endDate?: string;
}) {
  return useQuery({
    queryKey: financeKeys.expenses(params),
    queryFn: () => financeService.getExpenses(params),
  });
}

export function useCreateExpenseMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateExpensePayload) => financeService.createExpense(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeKeys.all });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}

export function useDeleteExpenseMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => financeService.deleteExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeKeys.all });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}

// ─── Fixed Assets ───────────────────────────────────────────────────────────
export function useFixedAssets(outletId?: string, asOfDate?: string) {
  return useQuery({
    queryKey: financeKeys.assets({ outletId, asOfDate }),
    queryFn: () => financeService.getAssets(outletId, asOfDate),
  });
}

export function useCreateAssetMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAssetPayload) => financeService.createAsset(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeKeys.all });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}

export function useDisposeAssetMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: DisposeAssetPayload }) =>
      financeService.disposeAsset(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeKeys.all });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}

// ─── Chart of Accounts & General Ledger ─────────────────────────────────────
export function useChartOfAccounts() {
  return useQuery({
    queryKey: financeKeys.coa(),
    queryFn: () => financeService.getCoa(),
  });
}

export function useJournalEntries(params?: {
  outletId?: string;
  startDate?: string;
  endDate?: string;
  sourceType?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: financeKeys.journals(params),
    queryFn: () => financeService.getJournals(params),
  });
}

export function useCreateManualJournalMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateManualJournalPayload) =>
      financeService.createManualJournal(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeKeys.all });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}

