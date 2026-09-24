export type ShiftStatus = 'OPEN' | 'CLOSED';

export interface PettyCashTransaction {
  id: string;
  tenantId: string;
  outletId: string;
  shiftId: string;
  amount: number;
  category: string;
  notes?: string;
  receiptPhotoUrl: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface PosShift {
  id: string;
  tenantId: string;
  outletId: string;
  userId: string;
  openedAt: string;
  closedAt?: string | null;
  openingCash: number;
  expectedCash?: number | null;
  currentExpectedCash?: number;
  currentCashSales?: number;
  completedOrdersCount?: number;
  actualCash?: number | null;
  cashDifference?: number | null;
  totalCashSales: number;
  totalCashOut: number;
  notes?: string | null;
  status: ShiftStatus;
  outlet?: {
    id: string;
    name: string;
  };
  user?: {
    id: string;
    name: string;
    email: string;
  };
  pettyCashTransactions?: PettyCashTransaction[];
  createdAt: string;
  updatedAt: string;
}

export interface OpenShiftPayload {
  outletId: string;
  openingCash: number;
  notes?: string;
}

export interface PettyCashPayload {
  outletId: string;
  amount: number;
  category: string;
  notes?: string;
  receiptPhotoUrl: string;
}

export interface CloseShiftPayload {
  actualCash: number;
  notes?: string;
}

export interface ShiftSummaryData {
  shift: PosShift;
  cashierName: string;
  outletName: string;
  openedAt: string;
  closedAt: string;
  durationHours: number;
  openingCash: number;
  totalCashSales: number;
  totalCashOut: number;
  expectedCash: number;
  actualCash: number;
  cashDifference: number;
  differenceStatus: 'MATCH' | 'SURPLUS' | 'SHORT';
  pettyCashList: PettyCashTransaction[];
}

