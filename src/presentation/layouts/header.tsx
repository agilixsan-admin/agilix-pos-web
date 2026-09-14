import React from 'react';
import { useAuthStore } from '@domain/state/auth-store';
import { Building2, LogOut, ChevronDown, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Header: React.FC = () => {
  const { user, tenant, outlets, currentOutlet, setCurrentOutlet, isTenantLocked, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between flex-shrink-0 select-none">
      {/* Left: Outlet Selector */}
      <div className="flex items-center gap-4">
        {outlets && outlets.length > 0 && (
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-500" />
            <div className="relative inline-block">
              <select
                aria-label="Pilih Outlet"
                value={currentOutlet?.id || ''}
                onChange={(e) => {
                  const selected = outlets.find((o) => o.id === e.target.value);
                  if (selected) setCurrentOutlet(selected);
                }}
                className="appearance-none bg-slate-50 border border-slate-200 text-slate-800 text-sm font-semibold rounded-lg pl-3 pr-8 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53] cursor-pointer"
              >
                {outlets.map((outlet) => (
                  <option key={outlet.id} value={outlet.id}>
                    {outlet.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        )}

        {isTenantLocked && (
          <div className="flex items-center gap-1.5 bg-red-50 text-red-700 px-3 py-1 rounded-full text-xs font-semibold border border-red-200">
            <Lock className="w-3.5 h-3.5" />
            <span>Akun Tenant Terkunci</span>
          </div>
        )}
      </div>

      {/* Right: User Profile & Actions */}
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-semibold text-slate-800 leading-tight">{user?.name || 'Kasir'}</p>
          <div className="flex items-center justify-end gap-1.5 mt-0.5">
            <span className="text-[11px] font-medium text-slate-500">{user?.roleName || 'Staff'}</span>
            {tenant?.name && (
              <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                {tenant.name}
              </span>
            )}
          </div>
        </div>

        <div className="h-8 w-px bg-slate-200" />

        <button
          onClick={handleLogout}
          title="Keluar"
          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};

