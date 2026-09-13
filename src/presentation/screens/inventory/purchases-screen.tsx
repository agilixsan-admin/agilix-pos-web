import React from 'react';
import { ShoppingBag, Calendar } from 'lucide-react';
import { useAuthStore } from '@domain/state/auth-store';

export const PurchasesScreen: React.FC = () => {
  const currentOutlet = useAuthStore((state) => state.currentOutlet);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Pembelian (Purchasing)</h1>
          <p className="text-xs text-slate-500 mt-0.5">Catatan pengadaan barang & invoice supplier di {currentOutlet?.name || 'Outlet Utama'}.</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-12 text-center text-slate-400">
        <ShoppingBag className="w-10 h-10 mx-auto mb-2 opacity-30 text-[#0D5C53]" />
        <h3 className="font-semibold text-slate-700 text-sm">Pencatatan Pembelian Inventori</h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
          Modul pengadaan barang dan penerimaan purchase order dari supplier siap digunakan.
        </p>
      </div>
    </div>
  );
};

