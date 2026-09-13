import React from 'react';
import { ScrollText } from 'lucide-react';
import { useAuthStore } from '@domain/state/auth-store';
import { Card, EmptyState } from '@presentation/components/ui';

export const InventoryReportScreen: React.FC = () => {
  const currentOutlet = useAuthStore((state) => state.currentOutlet);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Laporan Inventori & Valuasi</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Analisis perputaran stok, nilai total aset gudang, dan barang waste di {currentOutlet?.name || 'Utama'}.
          </p>
        </div>
      </div>

      <Card>
        <EmptyState
          icon={<ScrollText className="w-10 h-10 opacity-30 text-[#0D5C53] mx-auto" />}
          title="Laporan Pemakaian & Valuasi Stok"
          description="Lacak riwayat mutasi stok, pengurangan otomatis dari penjualan, dan total valuasi nilai bahan baku."
        />
      </Card>
    </div>
  );
};
