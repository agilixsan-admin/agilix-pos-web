import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'light' | 'dark' | 'system';

interface UiStoreState {
  isSidebarCollapsed: boolean;
  isMobileMenuOpen: boolean;
  theme: ThemeMode;
  toggleSidebarCollapsed: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleMobileMenu: () => void;
  setMobileMenu: (open: boolean) => void;
  closeMobileMenu: () => void;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

export const applyThemeToDocument = (theme: ThemeMode) => {
  if (typeof window === 'undefined') return;
  const root = document.documentElement;
  const isDark = theme === 'dark';

  if (isDark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
};

const getInitialTheme = (): ThemeMode => {
  if (typeof window === 'undefined') return 'light';
  try {
    const raw = localStorage.getItem('agilix-pos-ui-storage');
    if (raw) {
      const parsed = JSON.parse(raw);
      // Ensure we switch to light mode on load as requested by user
      if (parsed?.state?.theme === 'dark' || parsed?.state?.theme === 'system') {
        parsed.state.theme = 'light';
        localStorage.setItem('agilix-pos-ui-storage', JSON.stringify(parsed));
        return 'light';
      }
      if (parsed?.state?.theme) {
        return parsed.state.theme;
      }
    }
  } catch {}
  return 'light';
};

// Immediate DOM sync to prevent flash of wrong theme
const initialTheme = getInitialTheme();
applyThemeToDocument(initialTheme);

export const useUiStore = create<UiStoreState>()(
  persist(
    (set, get) => ({
      isSidebarCollapsed: false,
      isMobileMenuOpen: false,
      theme: initialTheme,
      toggleSidebarCollapsed: () =>
        set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
      setSidebarCollapsed: (collapsed: boolean) =>
        set({ isSidebarCollapsed: collapsed }),
      toggleMobileMenu: () =>
        set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
      setMobileMenu: (open: boolean) => set({ isMobileMenuOpen: open }),
      closeMobileMenu: () => set({ isMobileMenuOpen: false }),
      setTheme: (theme: ThemeMode) => {
        applyThemeToDocument(theme);
        set({ theme });
      },
      toggleTheme: () => {
        const current = get().theme;
        const next: ThemeMode = current === 'dark' ? 'light' : 'dark';
        applyThemeToDocument(next);
        set({ theme: next });
      },
    }),
    {
      name: 'agilix-pos-ui-storage',
      partialize: (state) => ({
        isSidebarCollapsed: state.isSidebarCollapsed,
        theme: state.theme,
      }),
      onRehydrateStorage: () => (state) => {
        const targetTheme = state?.theme || 'light';
        applyThemeToDocument(targetTheme);
      },
    },
  ),
);


