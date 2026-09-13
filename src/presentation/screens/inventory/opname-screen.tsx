import React from 'react';
import { ClipboardCheck } from 'lucide-react';
import { useAuthStore } from '@domain/state/auth-store';

export const OpnameScreen: React.FC = () => {
  const currentOutlet = useAuthStore((state) => state.currentOutlet);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Stock Opname</h1>
          <p className="text-xs text-slate-500 mt-0.5">Penghitungan fisik berkala untuk verifikasi selisih stok di {currentOutlet?.name || 'Outlet Utama'}.</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-12 text-center text-slate-400">
        <ClipboardCheck className="w-10 h-10 mx-auto mb-2 opacity-30 text-[#0D5C53]" />
        <h3 className="font-semibold text-slate-700 text-sm">Jadwal & Riwayat Stock Opname</h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
          Lakukan rekonsiliasi antara stok aktual fisik gudang dengan pencatatan sistem POS.
        </p>
      </div>
    </div>
  );
};

