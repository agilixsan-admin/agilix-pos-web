import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UiStoreState {
  isSidebarCollapsed: boolean;
  isMobileMenuOpen: boolean;
  toggleSidebarCollapsed: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleMobileMenu: () => void;
  setMobileMenu: (open: boolean) => void;
  closeMobileMenu: () => void;
}

export const useUiStore = create<UiStoreState>()(
  persist(
    (set) => ({
      isSidebarCollapsed: false,
      isMobileMenuOpen: false,
      toggleSidebarCollapsed: () =>
        set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
      setSidebarCollapsed: (collapsed: boolean) =>
        set({ isSidebarCollapsed: collapsed }),
      toggleMobileMenu: () =>
        set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
      setMobileMenu: (open: boolean) => set({ isMobileMenuOpen: open }),
      closeMobileMenu: () => set({ isMobileMenuOpen: false }),
    }),
    {
      name: 'agilix-pos-ui-storage',
      partialize: (state) => ({
        isSidebarCollapsed: state.isSidebarCollapsed,
      }),
    },
  ),
);

