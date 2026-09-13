import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import type { InventoryCategory } from '@model/Inventory';
import { inventoryService } from '@domain/services/inventory-service';
import {
  ArrowLeft,
  Lock,
  Plus,
  Loader2,
  Check,
  X,
} from 'lucide-react';

export const RawMaterialCreateScreen: React.FC = () => {
  const navigate = useNavigate();

  const [categories, setCategories] = useState<InventoryCategory[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [unit, setUnit] = useState('g');
  const [minimumStock, setMinimumStock] = useState('0');

  // Inline Category Modal State
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [creatingCat, setCreatingCat] = useState(false);

  const loadCategories = async () => {
    setLoadingCats(true);
    try {
      const data = await inventoryService.getInventoryCategories();
      setCategories(Array.isArray(data) ? data : []);
      if (data.length > 0 && !categoryId) {
        setCategoryId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setLoadingCats(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setCreatingCat(true);
    try {
      const created = await inventoryService.createInventoryCategory({
        name: newCatName.trim(),
        status: 'ACTIVE',
      });
      setIsCatModalOpen(false);
      setNewCatName('');
      await loadCategories();
      if (created?.id) {
        setCategoryId(created.id);
      }
    } catch (err: unknown) {
      alert((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Gagal membuat kategori.');
    } finally {
      setCreatingCat(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Nama bahan baku wajib diisi.');
      return;
    }

    setSubmitting(true);
    try {
      await inventoryService.createRawMaterial({
        name: name.trim(),
        sku: sku.trim() || undefined,
        categoryId: categoryId || undefined,
        description: description.trim() || undefined,
        unit,
        minimumStock: Number(minimumStock || 0),
        status,
      });

      navigate('/inventory/raw-materials');
    } catch (err: unknown) {
      alert((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Gagal menyimpan bahan baku.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 select-none">
      {/* Breadcrumb & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <Link to="/inventory/stock" className="hover:text-slate-800 transition-colors">
              Inventory
            </Link>
            <span>/</span>
            <Link to="/inventory/raw-materials" className="hover:text-slate-800 transition-colors">
              Bahan Baku
            </Link>
            <span>/</span>
            <span className="text-[#0D5C53] font-semibold">Tambah Bahan Baku</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Tambah Bahan Baku</h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/inventory/raw-materials')}
            className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-2 px-4 py-2 bg-[#0D5C53] hover:bg-[#094740] text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <span>Simpan Bahan Baku</span>
            )}
          </button>
        </div>
      </div>

      {/* 2-Column Form Layout matching Mockup */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Informasi Dasar (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
              Informasi Dasar
            </h2>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Nama Bahan Baku <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Biji Kopi Arabika"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  SKU / Kode (Opsional)
                </label>
                <input
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="AUTO / MAT-001"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">Kategori</label>
                  <button
                    type="button"
                    onClick={() => setIsCatModalOpen(true)}
                    className="text-[11px] font-semibold text-[#0D5C53] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Tambah Kategori</span>
                  </button>
                </div>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53]"
                >
                  <option value="">
                    {loadingCats
                      ? 'Memuat kategori...'
                      : categories.length === 0
                      ? '-- Belum ada kategori --'
                      : 'Pilih Kategori...'}
                  </option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Deskripsi (Opsional)
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detail spesifikasi bahan baku, cara penyimpanan, atau catatan supplier..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53]"
              />
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-800">Status Aktif</p>
                <p className="text-[11px] text-slate-400">
                  Bahan baku dapat digunakan dalam resep dan pembelian.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStatus(status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE')}
                className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${
                  status === 'ACTIVE' ? 'bg-[#0D5C53]' : 'bg-slate-200'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                    status === 'ACTIVE' ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Unit & Stock (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
              Unit & Stock
            </h2>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Base Unit <span className="text-red-500">*</span>
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53]"
              >
                <option value="g">Gram (g)</option>
                <option value="kg">Kilogram (kg)</option>
                <option value="ml">Mililiter (ml)</option>
                <option value="L">Liter (L)</option>
                <option value="pcs">Pcs / Butir</option>
                <option value="shot">Shot</option>
                <option value="slice">Slice</option>
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                Satuan terkecil yang digunakan saat menakar resep.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Minimum Stock Alert
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  value={minimumStock}
                  onChange={(e) => setMinimumStock(e.target.value)}
                  placeholder="0"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3.5 pr-12 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53]"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  {unit}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Peringatan jika stok di bawah batas ini.
              </p>
            </div>

            {/* Unit Cost Locked Card (Mockup Feature) */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Unit Cost (Otomatis)</span>
                <Lock className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <p className="text-xs text-slate-400 italic">Belum tersedia</p>
              <p className="text-[11px] text-slate-500 leading-relaxed pt-1 border-t border-slate-200/60">
                Unit cost dihitung otomatis ketika ada rincian pembelian (Moving Average).
              </p>
            </div>
          </div>
        </div>
      </form>

      {/* Inline Quick Category Modal */}
      {isCatModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Tambah Kategori Bahan</h3>
              <button
                type="button"
                onClick={() => setIsCatModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="py-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Kategori *</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="Contoh: Dairy, Coffee, Syrup, Flour"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53]"
                />
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsCatModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={creatingCat}
                  className="flex-1 py-2.5 bg-[#0D5C53] hover:bg-[#094740] text-white font-semibold rounded-xl cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {creatingCat ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

