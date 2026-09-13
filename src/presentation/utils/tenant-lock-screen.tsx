import React from 'react';
import { Lock, AlertTriangle, LogOut } from 'lucide-react';
import { useAuthStore } from '@domain/state/auth-store';
import { useNavigate } from 'react-router-dom';

export const TenantLockScreen: React.FC = () => {
  const { tenant, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center border border-slate-200">
        <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-5 text-red-600">
          <Lock className="w-8 h-8" />
        </div>

        <h2 className="text-xl font-bold text-slate-900 mb-2">
          Akun Toko Ditangguhkan
        </h2>

        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
          Layanan POS untuk <strong className="text-slate-800">{tenant?.name || 'Toko ini'}</strong> saat ini sedang dikunci oleh sistem pusat (Agilix Console). Seluruh operasional kasir dan transaksi dihentikan sementara.
        </p>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 mb-6 text-left flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-amber-800">
            <p className="font-semibold mb-0.5">Tindakan Diperlukan</p>
            <p>Silakan hubungi pemilik usaha (Owner) atau Administrator Agilix Console untuk memeriksa status langganan.</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Kembali ke Halaman Login</span>
        </button>
      </div>
    </div>
  );
};

