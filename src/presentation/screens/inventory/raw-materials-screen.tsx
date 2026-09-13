import React, { useEffect, useState } from 'react';
import type { RawMaterial } from '@model/Inventory';
import { inventoryService } from '@domain/services/inventory-service';
import { useAuthStore } from '@domain/state/auth-store';
import { Wheat, Search, Loader2, Plus, Edit2, Trash2, X } from 'lucide-react';
import { httpClient } from '@domain/services/http-client';

export const RawMaterialsScreen: React.FC = () => {
  const currentOutlet = useAuthStore((state) => state.currentOutlet);
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RawMaterial | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    unit: 'g',
    unitCost: '0',
    minStock: '0',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await inventoryService.getRawMaterials({ outletId: currentOutlet?.id });
      setMaterials(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load raw materials:', err);
      setMaterials([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentOutlet?.id]);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      sku: '',
      unit: 'g',
      unitCost: '0',
      minStock: '0',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (m: RawMaterial) => {
    setEditingItem(m);
    setFormData({
      name: m.name || '',
      sku: (m as { sku?: string }).sku || m.code || '',
      unit: m.unit || 'g',
      unitCost: String((m as { unitCost?: number }).unitCost ?? m.costPrice ?? 0),
      minStock: String((m as { minStock?: number }).minStock ?? m.minimumStock ?? 0),
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await httpClient.put(`/inventory/${editingItem.id}`, {
          name: formData.name,
          sku: formData.sku || undefined,
          unit: formData.unit,
          unitCost: Number(formData.unitCost || 0),
          minStock: Number(formData.minStock || 0),
          itemType: 'RAW_MATERIAL',
        });
      } else {
        await httpClient.post('/inventory', {
          name: formData.name,
          sku: formData.sku || undefined,
          unit: formData.unit,
          unitCost: Number(formData.unitCost || 0),
          minStock: Number(formData.minStock || 0),
          itemType: 'RAW_MATERIAL',
        });
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: unknown) {
      alert(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Gagal menyimpan bahan baku.'
      );
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus bahan baku ini?')) return;
    try {
      await httpClient.delete(`/inventory/${id}`);
      loadData();
    } catch (err: unknown) {
      alert('Gagal menghapus bahan baku.');
    }
  };

  const rawList = Array.isArray(materials) ? materials : [];
  const filtered = rawList.filter((m) => {
    if (!m) return false;
    const nameStr = (m.name || '').toLowerCase();
    const codeStr = ((m as { sku?: string }).sku || m.code || '').toLowerCase();
    const q = (search || '').toLowerCase();
    return nameStr.includes(q) || codeStr.includes(q);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Bahan Baku (Raw Materials)</h1>
          <p className="text-xs text-slate-500 mt-0.5">Daftar bahan mentah untuk resep produk & minuman (BOM).</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari bahan baku..."
              className="bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53] w-56"
            />
          </div>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2 bg-[#0D5C53] hover:bg-[#094740] text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Bahan</span>
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">SKU / Kode</th>
                <th className="py-3.5 px-4">Nama Bahan</th>
                <th className="py-3.5 px-4">Satuan Unit</th>
                <th className="py-3.5 px-4">Estimasi HPP / Satuan</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#0D5C53]" />
                    <span>Memuat bahan baku...</span>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <Wheat className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="font-semibold text-slate-600">Belum ada bahan baku</p>
                    <p className="text-[11px] text-slate-400 mt-1">Klik "+ Tambah Bahan" untuk menambahkan bahan mentah baru.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((m) => {
                  const skuVal = (m as { sku?: string }).sku || m.code || '-';
                  const unitCostVal = Number((m as { unitCost?: number }).unitCost ?? m.costPrice ?? 0);

                  return (
                    <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">{skuVal}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">{m.name}</td>
                      <td className="py-3.5 px-4">
                        <span className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md font-semibold text-[11px]">
                          {m.unit}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-[#0D5C53]">
                        Rp {unitCostVal.toLocaleString('id-ID')} / {m.unit}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(m)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(m.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingItem ? 'Edit Bahan Baku' : 'Tambah Bahan Baku Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="py-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Bahan Baku *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Biji Kopi Arabika, Susu Segar, Gula Aren"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">SKU / Kode (Opsional)</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="Contoh: MAT-001"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Satuan Unit *</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53]"
                  >
                    <option value="g">Gram (g)</option>
                    <option value="kg">Kilogram (kg)</option>
                    <option value="ml">Mililiter (ml)</option>
                    <option value="L">Liter (L)</option>
                    <option value="pcs">Pcs / Butir</option>
                    <option value="shot">Shot</option>
                    <option value="slice">Slice</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Harga Beli / Satuan (Rp)</label>
                  <input
                    type="number"
                    value={formData.unitCost}
                    onChange={(e) => setFormData({ ...formData, unitCost: e.target.value })}
                    placeholder="150"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Batas Minimum Stok</label>
                  <input
                    type="number"
                    value={formData.minStock}
                    onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                    placeholder="100"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53]"
                  />
                </div>
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
                  className="flex-1 py-2.5 bg-[#0D5C53] hover:bg-[#094740] text-white font-semibold rounded-xl cursor-pointer shadow-xs"
                >
                  Simpan Bahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

