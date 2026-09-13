import React, { useEffect, useState } from 'react';
import type { Supplier } from '@model/Inventory';
import { inventoryService } from '@domain/services/inventory-service';
import { Truck } from 'lucide-react';
import {
  Card,
  SearchInput,
  LoadingState,
  EmptyState,
} from '@presentation/components/ui';

export const SuppliersScreen: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await inventoryService.getSuppliers();
      setSuppliers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const rawList = Array.isArray(suppliers) ? suppliers : [];
  const filtered = rawList.filter((s) => {
    if (!s) return false;
    const nameStr = (s.name || '').toLowerCase();
    const picStr = (s.contactPerson || '').toLowerCase();
    const phoneStr = (s.phone || '').toLowerCase();
    const q = (search || '').toLowerCase();
    return nameStr.includes(q) || picStr.includes(q) || phoneStr.includes(q);
  });

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Daftar Supplier</h1>
          <p className="text-xs text-slate-500 mt-0.5">Pemasok bahan baku, packaging, dan perlengkapan outlet.</p>
        </div>

        <div className="w-64">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Cari supplier / kontak..."
          />
        </div>
      </div>

      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Nama Supplier</th>
                <th className="py-3.5 px-4">Kontak Person (PIC)</th>
                <th className="py-3.5 px-4">No. Telepon / WA</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4">Alamat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5}>
                    <LoadingState message="Memuat supplier..." />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState
                      icon={<Truck className="w-8 h-8 opacity-30 mx-auto" />}
                      title="Belum ada supplier"
                      description="Data supplier pengadaan barang akan ditampilkan di sini."
                    />
                  </td>
                </tr>
              ) : (
                filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{s.name}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">{s.contactPerson || '-'}</td>
                    <td className="py-3.5 px-4 text-slate-700 font-mono text-[11px]">{s.phone || '-'}</td>
                    <td className="py-3.5 px-4 text-slate-500">{s.email || '-'}</td>
                    <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">{s.address || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
