import React, { useEffect, useState } from 'react';
import type { RawMaterial, PackagingItem } from '@model/Inventory';
import { inventoryService } from '@domain/services/inventory-service';
import { useAuthStore } from '@domain/state/auth-store';
import { Boxes, Search, AlertTriangle, Loader2 } from 'lucide-react';

export const StockScreen: React.FC = () => {
  const currentOutlet = useAuthStore((state) => state.currentOutlet);
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [packagings, setPackagings] = useState<PackagingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [mat, pack] = await Promise.all([
        inventoryService.getRawMaterials({ outletId: currentOutlet?.id }),
        inventoryService.getPackagingItems({ outletId: currentOutlet?.id }),
      ]);
      setMaterials(mat);
      setPackagings(pack);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentOutlet?.id]);

  const allItems = [
    ...materials.map((m) => ({ ...m, type: 'Bahan Baku' })),
    ...packagings.map((p) => ({ ...p, type: 'Packaging' })),
  ].filter((item) => item.name.toLowerCase().includes(search.toLowerCase()) || item.code?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Ringkasan Stok Inventori</h1>
          <p className="text-xs text-slate-500 mt-0.5">Pemantauan stok bahan baku & packaging pada {currentOutlet?.name || 'Outlet Utama'}.</p>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari item stok..."
            className="bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53] w-64"
          />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-3.5 px-4">Kode</th>
              <th className="py-3.5 px-4">Nama Item</th>
              <th className="py-3.5 px-4">Tipe</th>
              <th className="py-3.5 px-4">Stok Saat Ini</th>
              <th className="py-3.5 px-4">Min. Stok</th>
              <th className="py-3.5 px-4">Satuan</th>
              <th className="py-3.5 px-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#0D5C53]" />
                  <span>Memuat stok...</span>
                </td>
              </tr>
            ) : allItems.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  <Boxes className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="font-semibold text-slate-600">Belum ada data stok</p>
                </td>
              </tr>
            ) : (
              allItems.map((item) => {
                const isLow = Number(item.currentStock) <= Number(item.minimumStock);
                return (
                  <tr key={`${item.type}-${item.id}`} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">{item.code || '-'}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{item.name}</td>
                    <td className="py-3.5 px-4">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-medium">
                        {item.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800 text-sm">
                      {Number(item.currentStock).toLocaleString('id-ID')}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">{Number(item.minimumStock).toLocaleString('id-ID')}</td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">{item.unit}</td>
                    <td className="py-3.5 px-4">
                      {isLow ? (
                        <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
                          <AlertTriangle className="w-3 h-3" /> Menipis
                        </span>
                      ) : (
                        <span className="inline-flex items-center bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-bold">
                          Aman
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

