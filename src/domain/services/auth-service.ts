import { httpClient } from './http-client';
import type { LoginResponse, User } from '@model/Auth';

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
};

