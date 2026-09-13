import React from 'react';
import { ShoppingBag } from 'lucide-react';
import { useAuthStore } from '@domain/state/auth-store';
import { Card, EmptyState } from '@presentation/components/ui';

export const PurchasesScreen: React.FC = () => {
  const currentOutlet = useAuthStore((state) => state.currentOutlet);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Pembelian (Purchasing)</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Catatan pengadaan barang & invoice supplier di {currentOutlet?.name || 'Outlet Utama'}.
          </p>
        </div>
      </div>

      <Card>
        <EmptyState
          icon={<ShoppingBag className="w-10 h-10 opacity-30 text-[#0D5C53] mx-auto" />}
          title="Pencatatan Pembelian Inventori"
          description="Modul pengadaan barang dan penerimaan purchase order dari supplier siap digunakan."
        />
      </Card>
    </div>
  );
};
