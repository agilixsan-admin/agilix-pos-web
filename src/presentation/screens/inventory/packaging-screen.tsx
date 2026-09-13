import React, { useEffect, useState } from 'react';
import type { PackagingItem } from '@model/Inventory';
import { inventoryService } from '@domain/services/inventory-service';
import { useAuthStore } from '@domain/state/auth-store';
import { Box, Search, Loader2 } from 'lucide-react';

export const PackagingScreen: React.FC = () => {
  const currentOutlet = useAuthStore((state) => state.currentOutlet);
  const [packagings, setPackagings] = useState<PackagingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await inventoryService.getPackagingItems({ outletId: currentOutlet?.id });
      setPackagings(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentOutlet?.id]);

  const filtered = packagings.filter(
    (p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.code?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Packaging & Kemasan</h1>
          <p className="text-xs text-slate-500 mt-0.5">Daftar cup, kantong, box, sedotan, dan kemasan take away.</p>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari packaging..."
            className="bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53] w-64"
          />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-3.5 px-4">Kode</th>
              <th className="py-3.5 px-4">Nama Kemasan</th>
              <th className="py-3.5 px-4">Stok Saat Ini</th>
              <th className="py-3.5 px-4">Min. Stok</th>
              <th className="py-3.5 px-4">Satuan</th>
              <th className="py-3.5 px-4">Biaya Satuan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#0D5C53]" />
                  <span>Memuat packaging...</span>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400">
                  <Box className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="font-semibold text-slate-600">Belum ada packaging</p>
                </td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">{p.code || '-'}</td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">{p.name}</td>
                  <td className="py-3.5 px-4 font-bold text-[#0D5C53]">
                    {Number(p.currentStock).toLocaleString('id-ID')}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500">{Number(p.minimumStock).toLocaleString('id-ID')}</td>
                  <td className="py-3.5 px-4 font-medium text-slate-700">{p.unit}</td>
                  <td className="py-3.5 px-4 text-slate-600">
                    Rp {Number(p.costPrice || 0).toLocaleString('id-ID')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

