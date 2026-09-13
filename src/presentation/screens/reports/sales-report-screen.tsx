import React from 'react';
import { TrendingUp, DollarSign, ShoppingCart } from 'lucide-react';
import { useAuthStore } from '@domain/state/auth-store';
import { KpiCard, Badge } from '@presentation/components/ui';

export const SalesReportScreen: React.FC = () => {
  const currentOutlet = useAuthStore((state) => state.currentOutlet);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Laporan Penjualan</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Analisis pendapatan dan ringkasan transaksi outlet {currentOutlet?.name || 'Utama'}.
          </p>
        </div>
      </div>

      {/* Reusable KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard
          title="Total Penjualan Hari Ini"
          value="Rp 3.450.000"
          icon={<TrendingUp className="w-4 h-4" />}
          theme="emerald"
          statusBadge={
            <Badge variant="success" size="sm">
              +12% dari kemarin
            </Badge>
          }
        />

        <KpiCard
          title="Total Transaksi"
          value="48 Struk"
          icon={<ShoppingCart className="w-4 h-4" />}
          theme="indigo"
          subtitle="Rata-rata Rp 71.875 / struk"
        />

        <KpiCard
          title="Pembayaran Terbanyak"
          value="QRIS (68%)"
          icon={<DollarSign className="w-4 h-4" />}
          theme="teal"
          subtitle="Tunai: 32%"
        />
      </div>
    </div>
  );
};
