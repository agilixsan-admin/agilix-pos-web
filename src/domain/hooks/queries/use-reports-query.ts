import { useQuery } from '@tanstack/react-query';
import {
  reportService,
  type SummaryReportParams,
  type SalesReportParams,
  type InventoryReportParams,
  type ShiftReconciliationParams,
  type IncomeStatementParams,
  type BalanceSheetParams,
  type CashFlowParams,
} from '@domain/services/report-service';
import { reportKeys } from './query-keys';

export function useSummaryReport(params: SummaryReportParams) {
  return useQuery({
    queryKey: reportKeys.sales({ type: 'summary', ...params }),
    queryFn: () => reportService.getSummary(params),
    enabled: Boolean(params.startDate && params.endDate),
  });
}

export function useSalesReport(params: SalesReportParams) {
  return useQuery({
    queryKey: reportKeys.sales(params as unknown as Record<string, unknown>),
    queryFn: () => reportService.getSalesReport(params),
    enabled: Boolean(params.startDate && params.endDate),
  });
}

export function useInventoryReport(params: InventoryReportParams) {
  return useQuery({
    queryKey: reportKeys.inventory(params as unknown as Record<string, unknown>),
    queryFn: () => reportService.getInventoryReport(params),
  });
}

export function useShiftReconciliationReport(params: ShiftReconciliationParams) {
  return useQuery({
    queryKey: reportKeys.shiftReconciliation(params as unknown as Record<string, unknown>),
    queryFn: () => reportService.getShiftReconciliationReport(params),
  });
}

export function useIncomeStatement(params: IncomeStatementParams) {
  return useQuery({
    queryKey: reportKeys.incomeStatement(params as unknown as Record<string, unknown>),
    queryFn: () => reportService.getIncomeStatement(params),
    enabled: Boolean(params.startDate && params.endDate),
  });
}

export function useBalanceSheet(params: BalanceSheetParams) {
  return useQuery({
    queryKey: reportKeys.balanceSheet(params as unknown as Record<string, unknown>),
    queryFn: () => reportService.getBalanceSheet(params),
  });
}

export function useCashFlowStatement(params: CashFlowParams) {
  return useQuery({
    queryKey: reportKeys.cashFlow(params as unknown as Record<string, unknown>),
    queryFn: () => reportService.getCashFlowStatement(params),
    enabled: Boolean(params.startDate && params.endDate),
  });
}
