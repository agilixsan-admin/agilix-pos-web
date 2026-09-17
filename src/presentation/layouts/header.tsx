import React, { useState } from 'react';
import { createPortal } from 'react-dom';
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
  User,
  KeyRound,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CustomOutletSelect, ResetPasswordModal } from '@presentation/components/ui';
import { useFloatingPortal } from '@presentation/components/ui/use-floating-portal';

export const Header: React.FC = () => {
  const { user, tenant, outlets, currentOutlet, setCurrentOutlet, isTenantLocked, logout } =
    useAuthStore();
  const {
    isSidebarCollapsed,
    toggleSidebarCollapsed,
    toggleMobileMenu,
  } = useUiStore();
  const navigate = useNavigate();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const { triggerRef, menuRef, coords } = useFloatingPortal({
    isOpen: isUserMenuOpen,
    onClose: () => setIsUserMenuOpen(false),
    align: 'right',
    minWidth: 220,
    expectedHeight: 260,
  });

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
          <CustomOutletSelect
            outlets={outlets}
            selectedOutletId={currentOutlet?.id}
            onSelectOutlet={(selected) => setCurrentOutlet(selected)}
          />
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
        {/* User Profile / Avatar Trigger Button */}
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setIsUserMenuOpen((prev) => !prev)}
          className={`flex items-center gap-2.5 p-1 -mr-1 rounded-2xl transition-all cursor-pointer ${
            isUserMenuOpen
              ? 'bg-slate-100 ring-2 ring-[#0D5C53]/15'
              : 'hover:bg-slate-50'
          }`}
          aria-haspopup="menu"
          aria-expanded={isUserMenuOpen}
          title={`Akun: ${user?.name || 'Kasir'}`}
        >
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-slate-800 leading-tight">
              {user?.name || 'Kasir'}
            </p>
            <div className="flex items-center justify-end gap-1 mt-0.5">
              <span className="text-[10px] font-medium text-slate-500">
                {user?.role?.name || user?.roleName || (user?.isSuperAdmin ? 'Super Admin' : 'Staff')}
              </span>
              {tenant?.name && (
                <span className="text-[9px] bg-slate-100 text-slate-600 px-1 py-0.2 rounded font-medium">
                  {tenant.name}
                </span>
              )}
            </div>
          </div>

          {/* User Avatar Circle */}
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-tr from-[#0D5C53] to-teal-500 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0 border border-teal-100/50">
            {getInitials(user?.name || 'Kasir')}
          </div>
          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 hidden sm:block ${
              isUserMenuOpen ? 'rotate-180 text-[#0D5C53]' : ''
            }`}
          />
        </button>

        <div className="h-6 sm:h-7 w-px bg-slate-200" />

        <button
          onClick={handleLogout}
          title="Keluar"
          className="p-1.5 sm:p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>

      {/* Floating User Menu Dropdown (Portaled) */}
      {isUserMenuOpen && coords && createPortal(
        <div
          ref={menuRef}
          style={{
            position: 'fixed',
            top: coords.top !== undefined ? `${coords.top}px` : 'auto',
            bottom: coords.bottom !== undefined ? `${coords.bottom}px` : 'auto',
            left: coords.left !== undefined ? `${coords.left}px` : 'auto',
            right: coords.right !== undefined ? `${coords.right}px` : 'auto',
            width: coords.width ? `${coords.width}px` : 'auto',
            minWidth: '220px',
            maxHeight: `${coords.maxHeight}px`,
            zIndex: 99999,
          }}
          className="bg-white border border-slate-200 rounded-2xl shadow-2xl p-1.5 overflow-y-auto animate-in fade-in-0 zoom-in-95 duration-100 w-60"
        >
          {/* User Info Header */}
          <div className="px-3 py-2.5 bg-slate-50 rounded-xl mb-1 border border-slate-100">
            <p className="text-xs font-bold text-slate-900 truncate">{user?.name || 'Kasir'}</p>
            <p className="text-[11px] text-slate-500 truncate font-mono mt-0.5">{user?.email || '-'}</p>
            <div className="mt-1.5 flex items-center gap-1.5">
              <span className="text-[10px] font-semibold bg-teal-50 text-[#0D5C53] border border-teal-200/60 px-2 py-0.5 rounded-full">
                {user?.role?.name || user?.roleName || (user?.isSuperAdmin ? 'Super Admin' : 'Staff')}
              </span>
            </div>
          </div>

          {/* Menu Item 1: Navigasi ke Halaman Profile */}
          <button
            type="button"
            onClick={() => {
              setIsUserMenuOpen(false);
              navigate('/profile');
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-slate-700 hover:text-slate-900 hover:bg-slate-100/80 rounded-xl transition-colors cursor-pointer text-left font-medium"
          >
            <User className="w-4 h-4 text-slate-500" />
            <span>Profil Pengguna</span>
          </button>

          {/* Menu Item 2: Reset Password */}
          <button
            type="button"
            onClick={() => {
              setIsUserMenuOpen(false);
              setIsResetModalOpen(true);
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-slate-700 hover:text-slate-900 hover:bg-slate-100/80 rounded-xl transition-colors cursor-pointer text-left font-medium"
          >
            <KeyRound className="w-4 h-4 text-slate-500" />
            <span>Reset Password</span>
          </button>

          <div className="h-px bg-slate-100 my-1" />

          {/* Menu Item 3: Keluar / Logout */}
          <button
            type="button"
            onClick={() => {
              setIsUserMenuOpen(false);
              handleLogout();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer text-left font-medium"
          >
            <LogOut className="w-4 h-4 text-rose-500" />
            <span>Keluar</span>
          </button>
        </div>,
        document.body
      )}

      {/* Reset Password Modal */}
      <ResetPasswordModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        targetUserName={user?.name}
      />
    </header>
  );
};
