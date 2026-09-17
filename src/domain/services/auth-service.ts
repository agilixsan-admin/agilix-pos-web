import { httpClient } from './http-client';
import type { LoginResponse, User, InvitationVerification, SetPasswordPayload } from '@model/Auth';

export const authService = {
  login: async (credentials: { email: string; password: string }): Promise<LoginResponse> => {
    const res = await httpClient.post('/auth/login', credentials);
    return res.data?.data || res.data;
  },

  getProfile: async (): Promise<User> => {
    const res = await httpClient.get('/auth/me');
    return res.data?.data || res.data;
  },

  refreshToken: async (refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> => {
    const res = await httpClient.post('/auth/refresh', { refreshToken });
    return res.data?.data || res.data;
  },

  verifyInvitation: async (token: string): Promise<InvitationVerification> => {
    const res = await httpClient.get('/auth/verify-invitation', { params: { token } });
    return res.data?.data || res.data;
  },

  setPassword: async (payload: SetPasswordPayload): Promise<LoginResponse> => {
    const res = await httpClient.post('/auth/set-password', payload);
    return res.data?.data || res.data;
  },

  changePassword: async (newPassword: string): Promise<{ success: boolean; message: string }> => {
    const res = await httpClient.post('/auth/change-password', { newPassword });
    return res.data;
  },
};


