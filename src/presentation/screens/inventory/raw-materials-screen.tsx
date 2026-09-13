import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import type { RawMaterial, InventoryCategory } from '@model/Inventory';
import { inventoryService } from '@domain/services/inventory-service';
import { useAuthStore } from '@domain/state/auth-store';
import {
  Wheat,
  Search,
  Loader2,
  Plus,
  Edit2,
  Trash2,
  Layers,
  Eye,
  AlertTriangle,
  FolderTree,
  Check,
  X,
} from 'lucide-react';

export const RawMaterialsScreen: React.FC = () => {
  const navigate = useNavigate();
  const currentOutlet = useAuthStore((state) => state.currentOutlet);

  // Tab State
  const [activeTab, setActiveTab] = useState<'materials' | 'categories'>('materials');

  // Materials State
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [loadingMaterials, setLoadingMaterials] = useState(true);
  const [searchMaterial, setSearchMaterial] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Categories State
  const [categories, setCategories] = useState<InventoryCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [searchCategory, setSearchCategory] = useState('');

  // Category Modal State
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<InventoryCategory | null>(null);
  const [catName, setCatName] = useState('');
  const [catStatus, setCatStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [savingCategory, setSavingCategory] = useState(false);

  // Load Data
  const loadMaterials = async () => {
    setLoadingMaterials(true);
    try {
      const data = await inventoryService.getRawMaterials({ outletId: currentOutlet?.id });
      setMaterials(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load raw materials:', err);
      setMaterials([]);
    } finally {
      setLoadingMaterials(false);
    }
  };

  const loadCategories = async () => {
    setLoadingCategories(true);
    try {
      const data = await inventoryService.getInventoryCategories();
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load categories:', err);
      setCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  };

  useEffect(() => {
    loadMaterials();
    loadCategories();
  }, [currentOutlet?.id]);

  // Handle Delete Material
  const handleDeleteMaterial = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus bahan baku "${name}"?`)) return;
    try {
      await inventoryService.deleteRawMaterial(id);
      loadMaterials();
    } catch (err: unknown) {
      alert((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Gagal menghapus bahan baku.');
    }
  };

  // Category Actions
  const handleOpenAddCategory = () => {
    setEditingCategory(null);
    setCatName('');
    setCatStatus('ACTIVE');
    setIsCatModalOpen(true);
  };

  const handleOpenEditCategory = (cat: InventoryCategory) => {
    setEditingCategory(cat);
    setCatName(cat.name);
    setCatStatus(cat.status || 'ACTIVE');
    setIsCatModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;

    setSavingCategory(true);
    try {
      if (editingCategory) {
        await inventoryService.updateInventoryCategory(editingCategory.id, {
          name: catName.trim(),
          status: catStatus,
        });
      } else {
        await inventoryService.createInventoryCategory({
          name: catName.trim(),
          status: catStatus,
        });
      }
      setIsCatModalOpen(false);
      loadCategories();
    } catch (err: unknown) {
      alert((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Gagal menyimpan kategori.');
    } finally {
      setSavingCategory(false);
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus kategori "${name}"?`)) return;
    try {
      await inventoryService.deleteInventoryCategory(id);
      loadCategories();
    } catch (err: unknown) {
      alert((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Gagal menghapus kategori.');
    }
  };

  // Filtered Materials
  const filteredMaterials = materials.filter((m) => {
    if (!m) return false;
    const nameStr = (m.name || '').toLowerCase();
    const codeStr = (m.sku || m.code || '').toLowerCase();
    const q = searchMaterial.toLowerCase();
    const matchesSearch = nameStr.includes(q) || codeStr.includes(q);

    const mCatId = m.categoryId || (typeof m.category === 'object' && m.category ? (m.category as any).id : '');
    const matchesCategory = filterCategory === 'ALL' || mCatId === filterCategory;

    const mStatus = m.status || 'ACTIVE';
    const matchesStatus = filterStatus === 'ALL' || mStatus === filterStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Filtered Categories
  const filteredCategories = categories.filter((c) => {
    if (!c) return false;
    const nameStr = (c.name || '').toLowerCase();
    return nameStr.includes(searchCategory.toLowerCase());
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Bahan Baku & Kategori</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manajemen master bahan mentah (raw materials) dan klasifikasi inventori untuk resep produk (BOM).
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'materials' ? (
            <button
              onClick={() => navigate('/inventory/raw-materials/create')}
              className="flex items-center gap-2 px-4 py-2 bg-[#0D5C53] hover:bg-[#094740] text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Bahan</span>
            </button>
          ) : (
            <button
              onClick={handleOpenAddCategory}
              className="flex items-center gap-2 px-4 py-2 bg-[#0D5C53] hover:bg-[#094740] text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Kategori</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="border-b border-slate-200 flex items-center gap-8">
        <button
          onClick={() => setActiveTab('materials')}
          className={`pb-3 text-xs font-bold transition-all relative cursor-pointer flex items-center gap-2 ${
            activeTab === 'materials'
              ? 'text-[#0D5C53] border-b-2 border-[#0D5C53]'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Wheat className="w-4 h-4" />
          <span>Semua Bahan Baku ({materials.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`pb-3 text-xs font-bold transition-all relative cursor-pointer flex items-center gap-2 ${
            activeTab === 'categories'
              ? 'text-[#0D5C53] border-b-2 border-[#0D5C53]'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <FolderTree className="w-4 h-4" />
          <span>Kategori Bahan Baku ({categories.length})</span>
        </button>
      </div>

      {/* TAB 1: SEMUA BAHAN BAKU */}
      {activeTab === 'materials' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 border border-slate-200 rounded-2xl shadow-xs">
            <div className="relative flex-1 max-w-xs">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchMaterial}
                onChange={(e) => setSearchMaterial(e.target.value)}
                placeholder="Cari nama atau SKU..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53]"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53] cursor-pointer"
              >
                <option value="ALL">Semua Kategori</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53] cursor-pointer"
              >
                <option value="ALL">Semua Status</option>
                <option value="ACTIVE">Aktif</option>
                <option value="INACTIVE">Nonaktif</option>
              </select>
            </div>
          </div>

          {/* Raw Materials Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3.5 px-4">SKU / Kode</th>
                    <th className="py-3.5 px-4">Nama Bahan Baku</th>
                    <th className="py-3.5 px-4">Kategori</th>
                    <th className="py-3.5 px-4">Satuan</th>
                    <th className="py-3.5 px-4 text-right">Stok Saat Ini</th>
                    <th className="py-3.5 px-4 text-right">Stok Min</th>
                    <th className="py-3.5 px-4 text-right">Unit Cost</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingMaterials ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#0D5C53]" />
                        <span>Memuat bahan baku...</span>
                      </td>
                    </tr>
                  ) : filteredMaterials.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        <Wheat className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p className="font-semibold text-slate-600">Belum ada bahan baku</p>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Klik "+ Tambah Bahan" untuk membuat bahan mentah baru.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredMaterials.map((m) => {
                      const skuVal = m.sku || m.code || '-';
                      const currentStock = Number(m.currentStock ?? 0);
                      const minStock = Number(m.minimumStock ?? m.minStock ?? 0);
                      const isLowStock = currentStock <= minStock;
                      const unitCostVal = Number(m.unitCost ?? m.costPrice ?? 0);
                      const catName =
                        typeof m.category === 'object' && m.category !== null
                          ? (m.category as { name?: string }).name
                          : m.categoryName || (typeof m.category === 'string' ? m.category : '-');

                      return (
                        <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 font-semibold">
                            {skuVal}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            <Link
                              to={`/inventory/raw-materials/${m.id}`}
                              className="hover:text-[#0D5C53] hover:underline"
                            >
                              {m.name}
                            </Link>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md font-medium text-[11px]">
                              {catName}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-slate-700">
                            {m.unit}
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                            <div className="flex items-center justify-end gap-1.5">
                              <span>{currentStock.toLocaleString('id-ID')}</span>
                              {isLowStock && (
                                <span title="Stok berada di bawah batas minimum" className="text-amber-500">
                                  <AlertTriangle className="w-3.5 h-3.5 inline" />
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-right text-slate-500">
                            {minStock.toLocaleString('id-ID')}
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold text-[#0D5C53]">
                            Rp {unitCostVal.toLocaleString('id-ID')}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                m.status === 'INACTIVE'
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  m.status === 'INACTIVE' ? 'bg-rose-500' : 'bg-emerald-500'
                                }`}
                              />
                              {m.status === 'INACTIVE' ? 'Inactive' : 'Active'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Link
                                to={`/inventory/raw-materials/${m.id}`}
                                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                                title="Lihat Detail"
                              >
                                <Eye className="w-4 h-4" />
                              </Link>
                              <Link
                                to={`/inventory/raw-materials/${m.id}/edit`}
                                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                                title="Edit Bahan Baku"
                              >
                                <Edit2 className="w-4 h-4" />
                              </Link>
                              <button
                                onClick={() => handleDeleteMaterial(m.id, m.name)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                                title="Hapus Bahan Baku"
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
        </div>
      )}

      {/* TAB 2: KATEGORI BAHAN BAKU */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          {/* Search Category */}
          <div className="flex items-center justify-between gap-3 bg-white p-3.5 border border-slate-200 rounded-2xl shadow-xs">
            <div className="relative flex-1 max-w-xs">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchCategory}
                onChange={(e) => setSearchCategory(e.target.value)}
                placeholder="Cari kategori bahan..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53]"
              />
            </div>
          </div>

          {/* Categories Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3.5 px-4">Nama Kategori</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4">Terakhir Diperbarui</th>
                    <th className="py-3.5 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingCategories ? (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-slate-400">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#0D5C53]" />
                        <span>Memuat kategori...</span>
                      </td>
                    </tr>
                  ) : filteredCategories.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-slate-400">
                        <FolderTree className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p className="font-semibold text-slate-600">Belum ada kategori</p>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Klik "+ Tambah Kategori" untuk membuat kategori bahan baku baru.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredCategories.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {c.name}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              c.status === 'INACTIVE'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                c.status === 'INACTIVE' ? 'bg-rose-500' : 'bg-emerald-500'
                              }`}
                            />
                            {c.status === 'INACTIVE' ? 'Inactive' : 'Active'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">
                          {c.updatedAt
                            ? new Date(c.updatedAt).toLocaleDateString('id-ID', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })
                            : '-'}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenEditCategory(c)}
                              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                              title="Edit Kategori"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(c.id, c.name)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                              title="Hapus Kategori"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {isCatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-sm shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                {editingCategory ? 'Edit Kategori' : 'Tambah Kategori Baru'}
              </h3>
              <button
                onClick={() => setIsCatModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Nama Kategori <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="Contoh: Biji Kopi, Dairy, Sirup"
                  required
                  autoFocus
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Status
                </label>
                <select
                  value={catStatus}
                  onChange={(e) => setCatStatus(e.target.value as 'ACTIVE' | 'INACTIVE')}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53] cursor-pointer"
                >
                  <option value="ACTIVE">Aktif</option>
                  <option value="INACTIVE">Nonaktif</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCatModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingCategory}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#0D5C53] hover:bg-[#094740] disabled:bg-slate-300 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  {savingCategory ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Simpan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
