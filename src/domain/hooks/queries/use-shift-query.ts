import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { shiftService } from '@domain/services/shift-service';
import { shiftKeys } from './query-keys';
import type { OpenShiftPayload, PettyCashPayload, CloseShiftPayload } from '@model/Shift';

export function useCurrentShift(outletId?: string) {
  return useQuery({
    queryKey: shiftKeys.current(outletId),
    queryFn: () => shiftService.getCurrentShift(outletId),
  });
}

export function useShiftSummary(shiftId?: string) {
  return useQuery({
    queryKey: shiftId ? shiftKeys.summary(shiftId) : ['shifts', 'summary', 'none'],
    queryFn: () => (shiftId ? shiftService.getShiftSummary(shiftId) : null),
    enabled: Boolean(shiftId),
  });
}

export function useOpenShiftMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: OpenShiftPayload) => shiftService.openShift(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: shiftKeys.all });
      queryClient.invalidateQueries({ queryKey: shiftKeys.current(variables.outletId) });
    },
  });
}

export function usePettyCashMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: PettyCashPayload) => shiftService.recordPettyCash(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: shiftKeys.current(variables.outletId) });
      queryClient.invalidateQueries({ queryKey: ['finance'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}

export function useCloseShiftMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ shiftId, payload }: { shiftId: string; payload: CloseShiftPayload }) =>
      shiftService.closeShift(shiftId, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: shiftKeys.all });
      if (data?.outletId) {
        queryClient.invalidateQueries({ queryKey: shiftKeys.current(data.outletId) });
      }
      queryClient.invalidateQueries({ queryKey: ['finance'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}

