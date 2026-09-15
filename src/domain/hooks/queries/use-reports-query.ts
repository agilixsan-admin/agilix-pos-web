import { useQuery } from '@tanstack/react-query';
import {
  reportService,
  type SummaryReportParams,
  type SalesReportParams,
  type InventoryReportParams,
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

