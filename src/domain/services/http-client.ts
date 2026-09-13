import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@domain/state/auth-store';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const httpClient = axios.create({
  baseURL: `${API_BASE_URL.replace(/\/+$/, '')}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Support Secure HttpOnly Cookies & Credential Exchange
  timeout: 15000,
});

// Request Interceptor: Attach Token and Active Outlet Context
httpClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const authState = useAuthStore.getState();
    const token = authState.accessToken;
    const currentOutlet = authState.currentOutlet;

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (currentOutlet?.id && config.headers) {
      config.headers['X-Outlet-Id'] = currentOutlet.id;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Flag to prevent multiple simultaneous refresh token requests
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response Interceptor: Handle 401 (Refresh Token) & 403 (Tenant Locked)
httpClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ message?: string; code?: string }>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle Tenant Lock (403 TENANT_LOCKED)
    if (
      error.response?.status === 403 &&
      (error.response?.data?.code === 'TENANT_LOCKED' ||
        error.response?.data?.message?.toLowerCase().includes('tenant is locked'))
    ) {
      useAuthStore.getState().setTenantLocked(true);
      return Promise.reject(error);
    }

    // Handle 401 Unauthorized (Token Expiration)
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return httpClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = useAuthStore.getState().refreshToken;

      if (!refreshToken) {
        useAuthStore.getState().logout();
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(
          `${API_BASE_URL.replace(/\/+$/, '')}/api/v1/auth/refresh`,
          { refreshToken },
          { withCredentials: true }
        );

        const newAccessToken = response.data?.data?.accessToken || response.data?.accessToken;
        const newRefreshToken = response.data?.data?.refreshToken || response.data?.refreshToken;

        useAuthStore.getState().setTokens(newAccessToken, newRefreshToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }

        processQueue(null, newAccessToken);
        return httpClient(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr as AxiosError, null);
        useAuthStore.getState().logout();
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
