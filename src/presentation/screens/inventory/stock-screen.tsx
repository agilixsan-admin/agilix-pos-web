import React, { useEffect, useState } from 'react';
import type { RawMaterial, PackagingItem } from '@model/Inventory';
import { inventoryService } from '@domain/services/inventory-service';
import { useAuthStore } from '@domain/state/auth-store';
import { Boxes, AlertTriangle } from 'lucide-react';
import {
  Badge,
  Card,
  SearchInput,
  LoadingState,
  EmptyState,
} from '@presentation/components/ui';

export const StockScreen: React.FC = () => {
  const currentOutlet = useAuthStore((state) => state.currentOutlet);
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [packagings, setPackagings] = useState<PackagingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [matRes, packRes] = await Promise.allSettled([
        inventoryService.getRawMaterials({ outletId: currentOutlet?.id }),
        inventoryService.getPackagingItems({ outletId: currentOutlet?.id }),
      ]);
      setMaterials(matRes.status === 'fulfilled' && Array.isArray(matRes.value) ? matRes.value : []);
      setPackagings(packRes.status === 'fulfilled' && Array.isArray(packRes.value) ? packRes.value : []);
    } catch (err) {
      console.error('Failed to load stock data:', err);
      setMaterials([]);
      setPackagings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentOutlet?.id]);

  const rawList = Array.isArray(materials) ? materials : [];
  const packList = Array.isArray(packagings) ? packagings : [];

  const allItems = [
    ...rawList.map((m) => ({ ...m, type: 'Bahan Baku' })),
    ...packList.map((p) => ({ ...p, type: 'Packaging' })),
  ].filter((item) => {
    if (!item) return false;
    const nameStr = (item.name || '').toLowerCase();
    const codeStr = ((item as { sku?: string }).sku || item.code || '').toLowerCase();
    const q = (search || '').toLowerCase();
    return nameStr.includes(q) || codeStr.includes(q);
  });

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Ringkasan Stok Inventori</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Pemantauan stok bahan baku & packaging pada {currentOutlet?.name || 'Outlet Utama'}.
          </p>
        </div>

        <div className="w-64">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Cari item stok..."
          />
        </div>
      </div>

      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Kode / SKU</th>
                <th className="py-3.5 px-4">Nama Item</th>
                <th className="py-3.5 px-4">Tipe</th>
                <th className="py-3.5 px-4 text-right">Stok Saat Ini</th>
                <th className="py-3.5 px-4 text-right">Min. Stok</th>
                <th className="py-3.5 px-4">Satuan</th>
                <th className="py-3.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7}>
                    <LoadingState message="Memuat stok..." />
                  </td>
                </tr>
              ) : allItems.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <EmptyState
                      icon={<Boxes className="w-8 h-8 opacity-30 mx-auto" />}
                      title="Belum ada data stok"
                      description="Data stok bahan baku dan packaging akan tampil otomatis setelah ditambahkan."
                    />
                  </td>
                </tr>
              ) : (
                allItems.map((item) => {
                  const isLow =
                    Number(item.currentStock ?? 0) <=
                    Number((item as any).minimumStock ?? (item as any).minStock ?? 0);
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-500 text-[11px]">
                        {(item as { sku?: string }).sku || item.code || '-'}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">{item.name}</td>
                      <td className="py-3.5 px-4">
                        <Badge variant="neutral">{item.type}</Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                        <div className="flex items-center justify-end gap-1.5">
                          <span>{Number(item.currentStock || 0).toLocaleString('id-ID')}</span>
                          {isLow && (
                            <span title="Stok di bawah batas minimum" className="text-amber-500">
                              <AlertTriangle className="w-3.5 h-3.5 inline" />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-500">
                        {Number((item as any).minimumStock ?? (item as any).minStock ?? 0).toLocaleString('id-ID')}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700">{item.unit}</td>
                      <td className="py-3.5 px-4 text-center">
                        <Badge variant={isLow ? 'warning' : 'success'} dot>
                          {isLow ? 'Stok Rendah' : 'Aman'}
                        </Badge>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
