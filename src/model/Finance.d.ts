export type FinancialAccountType = 'CASH' | 'BANK' | 'EWALLET' | 'PAYMENT_GATEWAY';

export interface FinancialAccount {
  id: string;
  tenantId: string;
  outletId?: string | null;
  accountCode: string;
  accountName: string;
  accountType: FinancialAccountType;
  accountNumber?: string | null;
  bankName?: string | null;
  currentBalance: number;
  isActive: boolean;
  outlet?: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface FinancialTransfer {
  id: string;
  tenantId: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  transferDate: string;
  notes?: string | null;
  createdBy: string;
  fromAccount?: FinancialAccount;
  toAccount?: FinancialAccount;
  createdAt: string;
}

export interface ExpenseCategory {
  id: string;
  tenantId: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface Expense {
  id: string;
  tenantId: string;
  outletId: string;
  categoryId: string;
  financialAccountId: string;
  amount: number;
  expenseDate: string;
  recipient?: string | null;
  notes?: string | null;
  receiptUrl?: string | null;
  pettyCashId?: string | null;
  createdBy: string;
  category?: ExpenseCategory;
  financialAccount?: FinancialAccount;
  outlet?: {
    id: string;
    name: string;
  };
  createdAt: string;
}

export interface FixedAsset {
  id: string;
  tenantId: string;
  outletId?: string | null;
  name: string;
  category: string;
  purchaseDate: string;
  purchaseCost: number;
  financialAccountId?: string | null;
  usefulLifeMonths: number;
  salvageValue: number;
  depreciationMethod: string;
  status: 'ACTIVE' | 'DISPOSED';
  disposalDate?: string | null;
  disposalPrice?: number | null;
  disposalNotes?: string | null;
  createdBy?: string;
  monthlyDepreciation?: number;
  accumulatedDepreciation?: number;
  bookValue?: number;
  outlet?: {
    id: string;
    name: string;
  };
  createdAt: string;
}

export type CoaCategory = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
export type NormalBalance = 'DEBIT' | 'CREDIT';

export interface ChartOfAccount {
  id: string;
  tenantId: string;
  accountCode: string;
  name: string;
  category: CoaCategory;
  normalBalance: NormalBalance;
  isSystem: boolean;
  createdAt: string;
}

export interface JournalEntryLine {
  id: string;
  journalEntryId: string;
  accountId: string;
  debit: number;
  credit: number;
  notes?: string | null;
  account?: ChartOfAccount;
}

export interface JournalEntry {
  id: string;
  tenantId: string;
  outletId?: string | null;
  entryNumber: string;
  entryDate: string;
  sourceType: string;
  sourceId?: string | null;
  description: string;
  createdBy?: string;
  lines: JournalEntryLine[];
  outlet?: {
    id: string;
    name: string;
  };
  createdAt: string;
}

export interface CreateAccountPayload {
  accountCode: string;
  accountName: string;
  accountType: FinancialAccountType;
  accountNumber?: string;
  bankName?: string;
  initialBalance?: number;
  outletId?: string;
}

export interface CreateTransferPayload {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  transferDate?: string;
  notes?: string;
}

export interface CreateExpensePayload {
  outletId: string;
  categoryId: string;
  financialAccountId: string;
  amount: number;
  expenseDate?: string;
  recipient?: string;
  notes?: string;
  receiptUrl?: string;
}

export interface CreateAssetPayload {
  outletId?: string;
  name: string;
  category: string;
  purchaseDate: string;
  purchaseCost: number;
  financialAccountId?: string;
  usefulLifeMonths: number;
  salvageValue?: number;
}

export interface DisposeAssetPayload {
  disposalDate: string;
  disposalPrice?: number;
  disposalNotes?: string;
}

export interface CreateManualJournalPayload {
  outletId?: string;
  entryDate: string;
  description: string;
  lines: Array<{
    accountId: string;
    debit: number;
    credit: number;
    notes?: string;
  }>;
}

export type CapitalTransactionType =
  | 'CAPITAL_INJECTION'
  | 'OWNER_WITHDRAWAL'
  | 'LOAN_RECEIPT'
  | 'LOAN_REPAYMENT';

export interface CapitalTransaction {
  id: string;
  tenantId: string;
  outletId?: string | null;
  financialAccountId: string;
  type: CapitalTransactionType;
  amount: number;
  transactionDate: string;
  partyName?: string | null;
  referenceNumber?: string | null;
  notes?: string | null;
  createdBy: string;
  financialAccount?: FinancialAccount;
  outlet?: {
    id: string;
    name: string;
  };
  creator?: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
}

export interface CreateCapitalTransactionPayload {
  outletId?: string;
  financialAccountId: string;
  type: CapitalTransactionType;
  amount: number;
  transactionDate?: string;
  partyName?: string;
  referenceNumber?: string;
  notes?: string;
}

export interface QueryCapitalTransactionParams {
  outletId?: string;
  type?: CapitalTransactionType;
  startDate?: string;
  endDate?: string;
}


