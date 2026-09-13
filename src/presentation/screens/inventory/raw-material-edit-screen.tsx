import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import type { RawMaterial, InventoryCategory } from '@model/Inventory';
import { inventoryService } from '@domain/services/inventory-service';
import {
  ArrowLeft,
  Lock,
  Plus,
  Loader2,
  Check,
  X,
  AlertCircle,
  Package,
} from 'lucide-react';

export const RawMaterialEditScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [categories, setCategories] = useState<InventoryCategory[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [loadingItem, setLoadingItem] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [unit, setUnit] = useState('g');
  const [minimumStock, setMinimumStock] = useState('0');
  const [unitCost, setUnitCost] = useState(0);

  // Inline Category Modal State
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [creatingCat, setCreatingCat] = useState(false);

  const loadData = async () => {
    if (!id) return;
    setLoadingItem(true);
    setLoadingCats(true);
    try {
      const [cats, item] = await Promise.all([
        inventoryService.getInventoryCategories(),
        inventoryService.getRawMaterialById(id),
      ]);

      setCategories(Array.isArray(cats) ? cats : []);
      if (item) {
        setName(item.name || '');
        setSku(item.sku || item.code || '');
        setCategoryId(item.categoryId || (typeof item.category === 'object' && item.category ? (item.category as any).id : ''));
        setDescription(item.description || '');
        setStatus((item.status as 'ACTIVE' | 'INACTIVE') || 'ACTIVE');
        setUnit(item.unit || 'g');
        setMinimumStock(String(item.minimumStock ?? item.minStock ?? 0));
        setUnitCost(Number(item.unitCost ?? item.costPrice ?? 0));
      }
    } catch (err) {
      console.error('Failed to load raw material data for edit:', err);
    } finally {
      setLoadingItem(false);
      setLoadingCats(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

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
      const data = await inventoryService.getInventoryCategories();
      setCategories(Array.isArray(data) ? data : []);
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
    if (!id) return;
    if (!name.trim()) {
      alert('Nama bahan baku wajib diisi.');
      return;
    }

    setSubmitting(true);
    try {
      await inventoryService.updateRawMaterial(id, {
        name: name.trim(),
        sku: sku.trim() || undefined,
        categoryId: categoryId || undefined,
        description: description.trim() || undefined,
        minimumStock: Number(minimumStock || 0),
        status,
      });

      navigate(`/inventory/raw-materials/${id}`);
    } catch (err: unknown) {
      alert((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Gagal menyimpan perubahan.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingItem) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-[#0D5C53] mb-2" />
        <p className="text-xs font-medium">Memuat formulir edit...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(`/inventory/raw-materials/${id}`)}
            className="p-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-slate-600 transition-colors shadow-xs cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Edit Bahan Baku</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Perbarui rincian, klasifikasi kategori, atau batas stok minimum bahan baku.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column: Informasi Dasar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
              Informasi Dasar
            </h2>

            {/* Nama Bahan Baku */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Nama Bahan Baku <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Biji Kopi Arabika House Blend"
                required
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53]"
              />
            </div>

            {/* SKU / Kode Bahan Baku */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                SKU / Kode Bahan Baku
              </label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="Contoh: RM-COF-001"
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53]"
              />
            </div>

            {/* Kategori Bahan Baku */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Kategori Bahan Baku
                </label>
                <button
                  type="button"
                  onClick={() => setIsCatModalOpen(true)}
                  className="text-[11px] font-semibold text-[#0D5C53] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>+ Kategori Baru</span>
                </button>
              </div>

              {loadingCats ? (
                <div className="text-xs text-slate-400 py-2">Memuat kategori...</div>
              ) : (
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53] cursor-pointer"
                >
                  <option value="">Pilih Kategori...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Deskripsi */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Deskripsi / Catatan
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Catatan spesifikasi penyimpanan atau informasi tambahan..."
                className="w-full bg-white border border-slate-200 rounded-xl p-3.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53]"
              />
            </div>
          </div>

          {/* Right Column: Unit & Pengaturan */}
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
              <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
                Unit, Batas Stok & Status
              </h2>

              {/* Satuan Dasar / Base Unit (Locked) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Satuan Dasar (Base Unit)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={unit}
                    disabled
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-500 font-semibold cursor-not-allowed"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                </div>
                
                {/* Notice Alert */}
                <div className="mt-2.5 p-3 bg-amber-50/80 border border-amber-200 rounded-xl flex items-start gap-2 text-amber-800">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-relaxed">
                    <strong>Base unit terkunci:</strong> Satuan dasar tidak dapat diubah karena bahan baku sudah terdaftar dalam sistem inventori dan mungkin telah terhubung ke resep produk atau mutasi stok.
                  </p>
                </div>
              </div>

              {/* Stok Minimum */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Batas Stok Minimum (Alert Threshold)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={minimumStock}
                    onChange={(e) => setMinimumStock(e.target.value)}
                    placeholder="0"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53]"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 uppercase">
                    {unit}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Sistem akan menandai "Stok Rendah" jika jumlah stok mencapai atau di bawah angka ini.
                </p>
              </div>

              {/* Status Bahan */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Status Operasional
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'ACTIVE' | 'INACTIVE')}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53] cursor-pointer"
                >
                  <option value="ACTIVE">Aktif (Dapat Digunakan di Resep & Pengadaan)</option>
                  <option value="INACTIVE">Nonaktif (Diarsipkan dari Menu Baru)</option>
                </select>
              </div>
            </div>

            {/* Unit Cost Information Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
              <div className="flex items-center gap-2 text-slate-700 font-bold text-xs mb-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Unit Cost (HPP Satuan): Rp {unitCost.toLocaleString('id-ID')} / {unit}</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Unit cost dihitung secara otomatis melalui metode Cumulative Moving Average saat barang diterima dari Purchase Order supplier.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Actions Bar */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <Link
            to={`/inventory/raw-materials/${id}`}
            className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Batal
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#0D5C53] hover:bg-[#094740] disabled:bg-slate-300 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Simpan Perubahan</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Quick Category Modal */}
      {isCatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-sm shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Tambah Kategori Baru</h3>
              <button
                onClick={() => setIsCatModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Nama Kategori <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="Contoh: Dairy & Susu"
                  required
                  autoFocus
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53]"
                />
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
                  disabled={creatingCat}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#0D5C53] hover:bg-[#094740] disabled:bg-slate-300 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  {creatingCat ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Simpan Kategori</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

