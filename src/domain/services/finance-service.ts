import { httpClient } from './http-client';
import type {
  FinancialAccount,
  FinancialTransfer,
  ExpenseCategory,
  Expense,
  FixedAsset,
  ChartOfAccount,
  JournalEntry,
  CreateAccountPayload,
  CreateTransferPayload,
  CreateExpensePayload,
  CreateAssetPayload,
  DisposeAssetPayload,
  CreateManualJournalPayload,
  CapitalTransaction,
  CreateCapitalTransactionPayload,
  QueryCapitalTransactionParams,
} from '@model/Finance';

export const financeService = {
  // ─── Accounts (Kas & Bank) ────────────────────────────────────────────────
  getAccounts: async (outletId?: string): Promise<FinancialAccount[]> => {
    const res = await httpClient.get<{ data: FinancialAccount[] }>('/finance/accounts', {
      params: outletId ? { outletId } : undefined,
    });
    return res.data?.data ?? (res.data as unknown as FinancialAccount[]) ?? [];
  },

  createAccount: async (payload: CreateAccountPayload): Promise<FinancialAccount> => {
    const res = await httpClient.post<{ data: FinancialAccount }>('/finance/accounts', payload);
    return res.data?.data ?? (res.data as unknown as FinancialAccount);
  },

  updateAccount: async (id: string, payload: Partial<CreateAccountPayload>): Promise<FinancialAccount> => {
    const res = await httpClient.patch<{ data: FinancialAccount }>(`/finance/accounts/${id}`, payload);
    return res.data?.data ?? (res.data as unknown as FinancialAccount);
  },

  // ─── Transfers ────────────────────────────────────────────────────────────
  createTransfer: async (payload: CreateTransferPayload): Promise<FinancialTransfer> => {
    const res = await httpClient.post<{ data: FinancialTransfer }>('/finance/transfers', payload);
    return res.data?.data ?? (res.data as unknown as FinancialTransfer);
  },

  getTransfers: async (params?: { startDate?: string; endDate?: string }): Promise<FinancialTransfer[]> => {
    const res = await httpClient.get<{ data: FinancialTransfer[] }>('/finance/transfers', { params });
    return res.data?.data ?? (res.data as unknown as FinancialTransfer[]) ?? [];
  },

  // ─── Expenses (Biaya Operasional) ─────────────────────────────────────────
  getExpenseCategories: async (): Promise<ExpenseCategory[]> => {
    const res = await httpClient.get<{ data: ExpenseCategory[] }>('/finance/expense-categories');
    return res.data?.data ?? (res.data as unknown as ExpenseCategory[]) ?? [];
  },

  createExpenseCategory: async (payload: { name: string; description?: string }): Promise<ExpenseCategory> => {
    const res = await httpClient.post<{ data: ExpenseCategory }>('/finance/expense-categories', payload);
    return res.data?.data ?? (res.data as unknown as ExpenseCategory);
  },

  getExpenses: async (params?: {
    outletId?: string;
    categoryId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<Expense[]> => {
    const res = await httpClient.get<{ data: Expense[] }>('/finance/expenses', { params });
    return res.data?.data ?? (res.data as unknown as Expense[]) ?? [];
  },

  createExpense: async (payload: CreateExpensePayload): Promise<Expense> => {
    const res = await httpClient.post<{ data: Expense }>('/finance/expenses', payload);
    return res.data?.data ?? (res.data as unknown as Expense);
  },

  deleteExpense: async (id: string): Promise<void> => {
    await httpClient.delete(`/finance/expenses/${id}`);
  },

  // ─── Fixed Assets ─────────────────────────────────────────────────────────
  getAssets: async (outletId?: string, asOfDate?: string): Promise<FixedAsset[]> => {
    const res = await httpClient.get<{ data: FixedAsset[] }>('/finance/assets', {
      params: { outletId, asOfDate },
    });
    return res.data?.data ?? (res.data as unknown as FixedAsset[]) ?? [];
  },

  createAsset: async (payload: CreateAssetPayload): Promise<FixedAsset> => {
    const res = await httpClient.post<{ data: FixedAsset }>('/finance/assets', payload);
    return res.data?.data ?? (res.data as unknown as FixedAsset);
  },

  disposeAsset: async (id: string, payload: DisposeAssetPayload): Promise<FixedAsset> => {
    const res = await httpClient.post<{ data: FixedAsset }>(`/finance/assets/${id}/dispose`, payload);
    return res.data?.data ?? (res.data as unknown as FixedAsset);
  },

  // ─── Chart of Accounts & General Ledger ───────────────────────────────────
  getCoa: async (): Promise<ChartOfAccount[]> => {
    const res = await httpClient.get<{ data: ChartOfAccount[] }>('/finance/coa');
    return res.data?.data ?? (res.data as unknown as ChartOfAccount[]) ?? [];
  },

  getJournals: async (params?: {
    outletId?: string;
    startDate?: string;
    endDate?: string;
    sourceType?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: JournalEntry[]; total: number; page: number; limit: number; totalPages: number }> => {
    const res = await httpClient.get<{
      data: JournalEntry[];
      meta?: { total: number; page: number; limit: number; totalPages: number };
    }>('/finance/journals', { params });

    const raw = res.data;
    if (Array.isArray(raw)) {
      return { data: raw, total: raw.length, page: 1, limit: raw.length, totalPages: 1 };
    }
    return {
      data: raw?.data || [],
      total: raw?.meta?.total || (raw?.data?.length ?? 0),
      page: raw?.meta?.page || 1,
      limit: raw?.meta?.limit || 20,
      totalPages: raw?.meta?.totalPages || 1,
    };
  },

  createManualJournal: async (payload: CreateManualJournalPayload): Promise<JournalEntry> => {
    const res = await httpClient.post<{ data: JournalEntry }>('/finance/journals/manual', payload);
    return res.data?.data ?? (res.data as unknown as JournalEntry);
  },

  // ─── Capital & Financing Transactions (Modal & Pendanaan) ──────────────────
  getCapitalTransactions: async (params?: QueryCapitalTransactionParams): Promise<CapitalTransaction[]> => {
    const res = await httpClient.get<{ data: CapitalTransaction[] }>('/finance/capital-transactions', { params });
    return res.data?.data ?? (res.data as unknown as CapitalTransaction[]) ?? [];
  },

  createCapitalTransaction: async (payload: CreateCapitalTransactionPayload): Promise<CapitalTransaction> => {
    const res = await httpClient.post<{ data: CapitalTransaction }>('/finance/capital-transactions', payload);
    return res.data?.data ?? (res.data as unknown as CapitalTransaction);
  },

  deleteCapitalTransaction: async (id: string): Promise<void> => {
    await httpClient.delete(`/finance/capital-transactions/${id}`);
  },
};

