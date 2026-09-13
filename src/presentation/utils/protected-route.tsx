import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@domain/state/auth-store';
import { useAccess } from '@domain/utils/hooks/use-access';
import { ShieldAlert } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredPermission }) => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const { hasAccess } = useAccess();
  const location = useLocation();

  if (!accessToken) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredPermission && !hasAccess(requiredPermission)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 mb-4 border border-amber-200">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-slate-800 mb-1">Akses Ditolak</h2>
        <p className="text-sm text-slate-500 max-w-sm mb-4">
          Akun Anda tidak memiliki izin akses (<code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">{requiredPermission}</code>) untuk membuka halaman ini.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};

