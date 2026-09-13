import React from 'react';
import { TrendingUp, DollarSign, ShoppingCart, Calendar } from 'lucide-react';
import { useAuthStore } from '@domain/state/auth-store';

export const SalesReportScreen: React.FC = () => {
  const currentOutlet = useAuthStore((state) => state.currentOutlet);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Laporan Penjualan</h1>
          <p className="text-xs text-slate-500 mt-0.5">Analisis pendapatan dan ringkasan transaksi outlet {currentOutlet?.name || 'Utama'}.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Total Penjualan Hari Ini</span>
            <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">Rp 3.450.000</p>
          <span className="text-[11px] text-emerald-600 font-semibold mt-1 inline-block">+12% dari kemarin</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Total Transaksi</span>
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">48 Struk</p>
          <span className="text-[11px] text-slate-400 mt-1 inline-block">Rata-rata Rp 71.875 / struk</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Pembayaran Terbanyak</span>
            <div className="w-8 h-8 bg-[#E6F4F1] rounded-lg flex items-center justify-center text-[#0D5C53]">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#0D5C53] mt-2">QRIS (68%)</p>
          <span className="text-[11px] text-slate-500 mt-1 inline-block">Tunai: 32%</span>
        </div>
      </div>
    </div>
  );
};

