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
  const isDark =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  if (isDark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
};

const getInitialTheme = (): ThemeMode => {
  if (typeof window === 'undefined') return 'system';
  try {
    const raw = localStorage.getItem('agilix-pos-ui-storage');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.state?.theme) {
        return parsed.state.theme;
      }
    }
  } catch {}
  return 'system';
};

// Immediate DOM sync to prevent flash of wrong theme
const initialTheme = getInitialTheme();
applyThemeToDocument(initialTheme);

// Listen to system preference changes if in system mode
if (typeof window !== 'undefined') {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.addEventListener('change', () => {
    const currentTheme = useUiStore.getState()?.theme;
    if (currentTheme === 'system') {
      applyThemeToDocument('system');
    }
  });
}

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
        let next: ThemeMode;
        if (current === 'system') {
          const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          next = isSystemDark ? 'light' : 'dark';
        } else {
          next = current === 'dark' ? 'light' : 'dark';
        }
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
        if (state?.theme) {
          applyThemeToDocument(state.theme);
        }
      },
    },
  ),
);


