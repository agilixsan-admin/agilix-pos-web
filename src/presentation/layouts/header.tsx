import React from 'react';
import { useAuthStore } from '@domain/state/auth-store';
import { useUiStore } from '@domain/state/ui-store';
import {
  Building2,
  LogOut,
  ChevronDown,
  Lock,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Header: React.FC = () => {
  const { user, tenant, outlets, currentOutlet, setCurrentOutlet, isTenantLocked, logout } =
    useAuthStore();
  const {
    isSidebarCollapsed,
    toggleSidebarCollapsed,
    toggleMobileMenu,
  } = useUiStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-3 sm:px-6 flex items-center justify-between flex-shrink-0 select-none">
      {/* Left: Toggles & Outlet Selector */}
      <div className="flex items-center gap-2 sm:gap-3 overflow-hidden">
        {/* Mobile / Tablet Hamburger Toggle */}
        <button
          onClick={toggleMobileMenu}
          aria-label="Buka Menu"
          className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Desktop Sidebar Collapse Toggle */}
        <button
          onClick={toggleSidebarCollapsed}
          aria-label={isSidebarCollapsed ? 'Perluas Sidebar' : 'Ciutkan Sidebar'}
          title={isSidebarCollapsed ? 'Buka Penuh Sidebar' : 'Tutup Sidebar (Mode Ikon Saja)'}
          className="hidden lg:flex p-2 text-slate-500 hover:text-[#0D5C53] hover:bg-teal-50 rounded-xl transition-colors cursor-pointer"
        >
          {isSidebarCollapsed ? (
            <PanelLeftOpen className="w-5 h-5" />
          ) : (
            <PanelLeftClose className="w-5 h-5" />
          )}
        </button>

        {/* Outlet Selector */}
        {outlets && outlets.length > 0 && (
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Building2 className="w-4 h-4 text-slate-500 shrink-0 hidden sm:block" />
            <div className="relative inline-block max-w-[140px] sm:max-w-[200px]">
              <select
                aria-label="Pilih Outlet"
                value={currentOutlet?.id || ''}
                onChange={(e) => {
                  const selected = outlets.find((o) => o.id === e.target.value);
                  if (selected) setCurrentOutlet(selected);
                }}
                className="appearance-none w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs sm:text-sm font-semibold rounded-lg pl-2.5 sm:pl-3 pr-7 sm:pr-8 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53] cursor-pointer truncate"
              >
                {outlets.map((outlet) => (
                  <option key={outlet.id} value={outlet.id}>
                    {outlet.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        )}

        {isTenantLocked && (
          <div className="flex items-center gap-1.5 bg-red-50 text-red-700 px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-semibold border border-red-200 shrink-0">
            <Lock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span className="hidden sm:inline">Akun Tenant Terkunci</span>
            <span className="sm:hidden">Terkunci</span>
          </div>
        )}
      </div>

      {/* Right: User Profile & Actions */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-semibold text-slate-800 leading-tight">
            {user?.name || 'Kasir'}
          </p>
          <div className="flex items-center justify-end gap-1.5 mt-0.5">
            <span className="text-[11px] font-medium text-slate-500">
              {user?.role?.name || user?.roleName || (user?.isSuperAdmin ? 'Super Admin' : 'Staff')}
            </span>
            {tenant?.name && (
              <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                {tenant.name}
              </span>
            )}
          </div>
        </div>

        {/* User Avatar */}
        <div
          title={user?.name || 'Kasir'}
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-tr from-[#0D5C53] to-teal-500 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0 border border-teal-100/50"
        >
          {getInitials(user?.name || 'Kasir')}
        </div>

        <div className="h-6 sm:h-7 w-px bg-slate-200" />

        <button
          onClick={handleLogout}
          title="Keluar"
          className="p-1.5 sm:p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>
    </header>
  );
};
