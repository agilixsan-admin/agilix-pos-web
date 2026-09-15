import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { posService } from '@domain/services/pos-service';
import type { CreateOrderPayload, PaymentPayload, QueryOrderParams } from '@model/Order';
import { posKeys } from './query-keys';

export function useTables(outletId?: string) {
  return useQuery({
    queryKey: posKeys.tables(outletId),
    queryFn: () => posService.getTables(outletId),
    staleTime: 2 * 60 * 1000,
  });
}

export function useOpenOrders(outletId?: string) {
  return useQuery({
    queryKey: posKeys.openOrders(outletId),
    queryFn: () => posService.getOpenOrders(outletId),
    refetchInterval: 10 * 1000, // auto poll open orders every 10s
  });
}

export function useOrderHistory(params?: QueryOrderParams) {
  return useQuery({
    queryKey: posKeys.orders(params),
    queryFn: () => posService.getOrderHistory(params),
  });
}

export function useOrderDetail(orderId?: string) {
  return useQuery({
    queryKey: posKeys.orderDetail(orderId || ''),
    queryFn: () => posService.getOrderById(orderId!),
    enabled: Boolean(orderId),
  });
}

export function useCreateOrderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateOrderPayload) => posService.createOrder(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: posKeys.all });
    },
  });
}

export function useProcessPaymentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: PaymentPayload) => posService.processPayment(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: posKeys.all });
    },
  });
}

