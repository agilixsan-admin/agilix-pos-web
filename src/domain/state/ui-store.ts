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

// Ensure 'dark' class is completely purged from DOM and localStorage
if (typeof window !== 'undefined') {
  document.documentElement.classList.remove('dark');
  try {
    const raw = localStorage.getItem('agilix-pos-ui-storage');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.state?.theme) {
        delete parsed.state.theme;
        localStorage.setItem('agilix-pos-ui-storage', JSON.stringify(parsed));
      }
    }
  } catch {}
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
