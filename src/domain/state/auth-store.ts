import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Outlet, Tenant } from '@model/Auth';

interface AuthStoreState {
  user: User | null;
  tenant: Tenant | null;
  outlets: Outlet[];
  currentOutlet: Outlet | null;
  accessToken: string | null;
  refreshToken: string | null;
  isTenantLocked: boolean;
  
  // Actions
  setAuth: (payload: {
    user: User;
    tenant: Tenant;
    outlets: Outlet[];
    accessToken: string;
    refreshToken?: string;
  }) => void;
  setCurrentOutlet: (outlet: Outlet) => void;
  setTokens: (accessToken: string, refreshToken?: string) => void;
  setTenantLocked: (locked: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStoreState>()(
  persist(
    (set, get) => ({
      user: null,
      tenant: null,
      outlets: [],
      currentOutlet: null,
      accessToken: null,
      refreshToken: null,
      isTenantLocked: false,

      setAuth: ({ user, tenant, outlets, accessToken, refreshToken }) => {
        const rawTenant =
          tenant ||
          (user as unknown as { tenant?: Tenant & { businessName?: string } })?.tenant ||
          null;
        const normalizedTenant = rawTenant
          ? {
              ...rawTenant,
              name: rawTenant.businessName || rawTenant.name || '',
              businessName: rawTenant.businessName || rawTenant.name || '',
            }
          : null;
        const defaultOutlet = outlets.find((o) => o.id === user.outletId) || outlets[0] || null;
        set({
          user,
          tenant: normalizedTenant,
          outlets,
          currentOutlet: get().currentOutlet || defaultOutlet,
          accessToken,
          refreshToken: refreshToken || null,
          isTenantLocked:
            normalizedTenant?.status === 'LOCKED' || normalizedTenant?.status === 'SUSPENDED',
        });
      },

      setCurrentOutlet: (outlet) => set({ currentOutlet: outlet }),

      setTokens: (accessToken, refreshToken) =>
        set((state) => ({
          accessToken,
          refreshToken: refreshToken || state.refreshToken,
        })),

      setTenantLocked: (locked) => set({ isTenantLocked: locked }),

      logout: () => {
        set({
          user: null,
          tenant: null,
          outlets: [],
          currentOutlet: null,
          accessToken: null,
          refreshToken: null,
          isTenantLocked: false,
        });
        localStorage.removeItem('agilix_pos_auth');
      },
    }),
    {
      name: 'agilix_pos_auth',
      partialize: (state) => ({
        user: state.user,
        tenant: state.tenant,
        outlets: state.outlets,
        currentOutlet: state.currentOutlet,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isTenantLocked: state.isTenantLocked,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          const rawTenant =
            state.tenant ||
            (state.user as unknown as { tenant?: Tenant & { businessName?: string } })?.tenant;
          if (rawTenant) {
            const resolvedName = rawTenant.businessName || rawTenant.name || '';
            state.tenant = {
              ...rawTenant,
              name: resolvedName,
              businessName: rawTenant.businessName || resolvedName,
            };
          }
        }
      },
    }
  )
);

