import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { TenantLockGuard } from '@presentation/guards/tenant-lock-guard';
import { useAuthStore } from '@domain/state/auth-store';
import { useUiStore } from '@domain/state/ui-store';

export const AppLayout: React.FC = () => {
  const isTenantLocked = useAuthStore((state) => state.isTenantLocked);
  const { isMobileMenuOpen, closeMobileMenu } = useUiStore();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F8FAFC] relative">
      {/* Mobile Backdrop Overlay */}
      {isMobileMenuOpen && (
        <div
          onClick={closeMobileMenu}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* Dynamic RBAC Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Header />

        <main className="flex-1 overflow-y-auto p-3 sm:p-5 md:p-6">
          <Outlet />
        </main>
      </div>

      {/* Tenant Locked Overlay Screen */}
      {isTenantLocked && <TenantLockGuard />}
    </div>
  );
};
