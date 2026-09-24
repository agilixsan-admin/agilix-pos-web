import { httpClient } from './http-client';
import type {
  PosShift,
  PettyCashTransaction,
  OpenShiftPayload,
  PettyCashPayload,
  CloseShiftPayload,
  ShiftSummaryData,
} from '@model/Shift';

export const shiftService = {
  getCurrentShift: async (outletId?: string): Promise<PosShift | null> => {
    try {
      const res = await httpClient.get<{ data: PosShift | null }>('/shifts/current', {
        params: outletId ? { outletId } : undefined,
      });
      if (res.data && typeof res.data === 'object' && 'data' in res.data) {
        return res.data.data;
      }
      return res.data ?? null;
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 404) {
        return null;
      }
      throw err;
    }
  },

  openShift: async (payload: OpenShiftPayload): Promise<PosShift> => {
    const res = await httpClient.post<{ data: PosShift }>('/shifts/open', payload);
    return res.data && typeof res.data === 'object' && 'data' in res.data
      ? res.data.data
      : (res.data as unknown as PosShift);
  },

  recordPettyCash: async (payload: PettyCashPayload): Promise<PettyCashTransaction> => {
    const res = await httpClient.post<{ data: PettyCashTransaction }>('/shifts/petty-cash', payload);
    return res.data && typeof res.data === 'object' && 'data' in res.data
      ? res.data.data
      : (res.data as unknown as PettyCashTransaction);
  },

  uploadReceipt: async (file: File): Promise<{ url: string; filename: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await httpClient.post<{ data: { url: string; filename: string } }>(
      '/shifts/upload-receipt',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return res.data && typeof res.data === 'object' && 'data' in res.data
      ? res.data.data
      : (res.data as unknown as { url: string; filename: string });
  },

  closeShift: async (shiftId: string, payload: CloseShiftPayload): Promise<PosShift> => {
    const res = await httpClient.post<{ data: PosShift }>(`/shifts/${shiftId}/close`, payload);
    return res.data && typeof res.data === 'object' && 'data' in res.data
      ? res.data.data
      : (res.data as unknown as PosShift);
  },

  getShiftSummary: async (shiftId: string): Promise<ShiftSummaryData> => {
    const res = await httpClient.get<{ data: ShiftSummaryData }>(`/shifts/${shiftId}/summary`);
    return res.data && typeof res.data === 'object' && 'data' in res.data
      ? res.data.data
      : (res.data as unknown as ShiftSummaryData);
  },
};

