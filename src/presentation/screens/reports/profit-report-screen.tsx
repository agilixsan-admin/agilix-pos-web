import React from 'react';
import { CircleDollarSign } from 'lucide-react';
import { useAuthStore } from '@domain/state/auth-store';
import { Card, EmptyState } from '@presentation/components/ui';

export const ProfitReportScreen: React.FC = () => {
  const currentOutlet = useAuthStore((state) => state.currentOutlet);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Laporan Profit & Laba Kotor</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Analisis margin keuntungan dan selisih omzet vs HPP di {currentOutlet?.name || 'Utama'}.
          </p>
        </div>
      </div>

      <Card>
        <EmptyState
          icon={<CircleDollarSign className="w-10 h-10 opacity-30 text-[#0D5C53] mx-auto" />}
          title="Laporan Margin & Profitabilitas"
          description="Perhitungan laba kotor otomatis berdasarkan harga modal resep menu dan harga jual transaksi kasir."
        />
      </Card>
    </div>
  );
};
