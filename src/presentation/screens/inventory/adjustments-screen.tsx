import React, { useEffect, useState } from 'react';
import type { RawMaterial, PackagingItem, StockAdjustment } from '@model/Inventory';
import { inventoryService } from '@domain/services/inventory-service';
import { useAuthStore } from '@domain/state/auth-store';
import { SlidersHorizontal, Plus, Search, Loader2, X, CheckCircle2 } from 'lucide-react';

export const AdjustmentsScreen: React.FC = () => {
  const currentOutlet = useAuthStore((state) => state.currentOutlet);
  const [adjustments, setAdjustments] = useState<StockAdjustment[]>([]);
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [packagings, setPackagings] = useState<PackagingItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Create Adjustment Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [itemType, setItemType] = useState<'RAW_MATERIAL' | 'PACKAGING'>('RAW_MATERIAL');
  const [actualStock, setActualStock] = useState('');
  const [reasonCategory, setReasonCategory] = useState<'DAMAGED' | 'EXPIRED' | 'LOST' | 'COUNTING_ERROR' | 'OTHER'>('DAMAGED');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [adjRes, matRes, packRes] = await Promise.allSettled([
        inventoryService.getAdjustments({ outletId: currentOutlet?.id }),
        inventoryService.getRawMaterials({ outletId: currentOutlet?.id }),
        inventoryService.getPackagingItems({ outletId: currentOutlet?.id }),
      ]);
      setAdjustments(adjRes.status === 'fulfilled' && Array.isArray(adjRes.value) ? adjRes.value : []);
      setMaterials(matRes.status === 'fulfilled' && Array.isArray(matRes.value) ? matRes.value : []);
      setPackagings(packRes.status === 'fulfilled' && Array.isArray(packRes.value) ? packRes.value : []);
    } catch (err) {
      console.error('Failed to load adjustments data:', err);
      setAdjustments([]);
      setMaterials([]);
      setPackagings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentOutlet?.id]);

  const selectedItem =
    itemType === 'RAW_MATERIAL'
      ? materials.find((m) => m.id === selectedItemId)
      : packagings.find((p) => p.id === selectedItemId);

  const systemStock = Number(selectedItem?.currentStock || 0);
  const diff = actualStock !== '' ? Number(actualStock) - systemStock : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) {
      alert('Pilih item terlebih dahulu.');
      return;
    }

    setSubmitting(true);
    try {
      await inventoryService.createAdjustment({
        outletId: currentOutlet?.id || '',
        adjustmentDate: new Date().toISOString(),
        items: [
          {
            itemId: selectedItem.id,
            itemName: selectedItem.name,
            itemType,
            systemStock,
            actualStock: Number(actualStock),
            reasonCategory,
            notes,
          },
        ],
        notes,
      });

      setIsModalOpen(false);
      loadData();
    } catch (err: unknown) {
      alert((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Gagal menyimpan penyesuaian stok.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Stock Adjustment (Penyesuaian Stok)</h1>
          <p className="text-xs text-slate-500 mt-0.5">Catat koreksi stok barang rusak, kadaluwarsa, hilang, atau selisih hitung.</p>
        </div>

        <button
          onClick={() => {
            setSelectedItemId(materials[0]?.id || packagings[0]?.id || '');
            setActualStock('');
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-[#0D5C53] hover:bg-[#094740] text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Penyesuaian Baru</span>
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-3.5 px-4">Tanggal</th>
              <th className="py-3.5 px-4">Item</th>
              <th className="py-3.5 px-4">Stok Sistem</th>
              <th className="py-3.5 px-4">Stok Aktual</th>
              <th className="py-3.5 px-4">Selisih</th>
              <th className="py-3.5 px-4">Alasan</th>
              <th className="py-3.5 px-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#0D5C53]" />
                  <span>Memuat data penyesuaian stok...</span>
                </td>
              </tr>
            ) : adjustments.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  <SlidersHorizontal className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="font-semibold text-slate-600">Belum ada riwayat penyesuaian</p>
                </td>
              </tr>
            ) : (
              adjustments.map((adj) =>
                adj.items?.map((item, idx) => (
                  <tr key={`${adj.id}-${idx}`} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      {new Date(adj.adjustmentDate || adj.createdAt).toLocaleDateString('id-ID')}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{item.itemName}</td>
                    <td className="py-3.5 px-4 text-slate-600">{item.systemStock}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">{item.actualStock}</td>
                    <td className="py-3.5 px-4 font-bold">
                      <span className={item.difference >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                        {item.difference > 0 ? `+${item.difference}` : item.difference}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">{item.reasonCategory}</td>
                    <td className="py-3.5 px-4">
                      <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold">
                        Diterapkan
                      </span>
                    </td>
                  </tr>
                ))
              )
            )}
          </tbody>
        </table>
      </div>

      {/* New Adjustment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Form Penyesuaian Stok (Adjustment)</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="py-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setItemType('RAW_MATERIAL');
                    setSelectedItemId(materials[0]?.id || '');
                  }}
                  className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    itemType === 'RAW_MATERIAL' ? 'bg-white text-[#0D5C53] shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Bahan Baku
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setItemType('PACKAGING');
                    setSelectedItemId(packagings[0]?.id || '');
                  }}
                  className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    itemType === 'PACKAGING' ? 'bg-white text-[#0D5C53] shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Packaging
                </button>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Pilih Item</label>
                <select
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53]"
                >
                  {(itemType === 'RAW_MATERIAL' ? materials : packagings).map((it) => (
                    <option key={it.id} value={it.id}>
                      {it.name} (Stok: {it.currentStock} {it.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Stok Sistem</span>
                  <p className="text-base font-extrabold text-slate-800">
                    {systemStock} {selectedItem?.unit}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Selisih Hitung</span>
                  <p className={`text-base font-extrabold ${diff >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {diff > 0 ? `+${diff}` : diff} {selectedItem?.unit}
                  </p>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Stok Fisik Aktual</label>
                <input
                  type="number"
                  required
                  value={actualStock}
                  onChange={(e) => setActualStock(e.target.value)}
                  placeholder="Masukkan jumlah stok fisik sebenarnya"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Kategori Alasan</label>
                <select
                  value={reasonCategory}
                  onChange={(e) => setReasonCategory(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53]"
                >
                  <option value="DAMAGED">Barang Rusak / Pecah (DAMAGED)</option>
                  <option value="EXPIRED">Kadaluwarsa / Basi (EXPIRED)</option>
                  <option value="LOST">Hilang (LOST)</option>
                  <option value="COUNTING_ERROR">Salah Hitung Sebelumnya (COUNTING_ERROR)</option>
                  <option value="OTHER">Lainnya (OTHER)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Catatan Tambahan</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Keterangan..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53]"
                />
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-[#0D5C53] hover:bg-[#094740] text-white font-semibold rounded-xl cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {submitting ? 'Menyimpan...' : 'Konfirmasi Koreksi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

