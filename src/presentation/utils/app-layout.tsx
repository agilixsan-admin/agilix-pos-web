import React from 'react';
import { Outlet } from 'react-router-dom';
import { WithSidebar } from './with-sidebar';
import { WithHeader } from './with-header';
import { TenantLockScreen } from './tenant-lock-screen';
import { useAuthStore } from '@domain/state/auth-store';

export const AppLayout: React.FC = () => {
  const isTenantLocked = useAuthStore((state) => state.isTenantLocked);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F8FAFC]">
      {/* Dynamic RBAC Sidebar */}
      <WithSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <WithHeader />
        
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>

      {/* Tenant Locked Overlay Screen */}
      {isTenantLocked && <TenantLockScreen />}
    </div>
  );
};

