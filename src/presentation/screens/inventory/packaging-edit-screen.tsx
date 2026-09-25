import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  usePackagingDetail,
  usePackagingCategories,
  useUpdatePackagingMutation,
  useCreatePackagingCategoryMutation,
} from '@domain/hooks';
import {
  ArrowLeft,
  Box,
  Plus,
  Sparkles,
  Package,
  Lock,
} from 'lucide-react';
import {
  Button,
  Card,
  FormInput,
  FormSelect,
  FormTextarea,
  Modal,
  LoadingState,
  EmptyState,
  toast,
} from '@presentation/components/ui';

export const PackagingEditScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Queries & Mutations
  const { data: packaging, isLoading: loadingItem } = usePackagingDetail(id);
  const { data: categories = [], isLoading: loadingCats } = usePackagingCategories();
  const updatePackagingMutation = useUpdatePackagingMutation();
  const createCategoryMutation = useCreatePackagingCategoryMutation();
  const submitting = updatePackagingMutation.isPending;
  const creatingCat = createCategoryMutation.isPending;

  // Form State
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [unit, setUnit] = useState('pcs');
  const [minimumStock, setMinimumStock] = useState('0');

  // Inline Category Modal State
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  // Sync state when data loads
  useEffect(() => {
    if (packaging) {
      setName(packaging.name || '');
      setSku(packaging.sku || packaging.code || '');
      const catId =
        typeof packaging.category === 'object' && packaging.category !== null
          ? (packaging.category as { id?: string }).id || ''
          : packaging.categoryId || '';
      setCategoryId(catId);
      setDescription(packaging.description || '');
      setStatus(packaging.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE');
      setUnit(packaging.unit || packaging.inventoryItem?.unit || 'pcs');
      setMinimumStock(String(packaging.minimumStock ?? packaging.minStock ?? packaging.inventoryItem?.minimumStock ?? 0));
    }
  }, [packaging]);

  const handleGenerateSku = () => {
    const prefix = 'PKG';
    const cleaned = name
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 6);
    const rand = Math.floor(100 + Math.random() * 900);
    setSku(`${prefix}-${cleaned || 'ITEM'}-${rand}`);
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      const created = await createCategoryMutation.mutateAsync({
        name: newCatName.trim(),
        description: newCatDesc.trim() || undefined,
        status: 'ACTIVE',
      });
      setIsCatModalOpen(false);
      setNewCatName('');
      setNewCatDesc('');
      if (created?.id) {
        setCategoryId(created.id);
      }
      toast.success('Kategori packaging baru berhasil dibuat.');
    } catch (err: unknown) {
      toast.error(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Gagal membuat kategori packaging.'
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    if (!name.trim()) {
      toast.warning('Nama packaging wajib diisi.');
      return;
    }

    try {
      await updatePackagingMutation.mutateAsync({
        id,
        data: {
          name: name.trim(),
          sku: sku.trim() || undefined,
          categoryId: categoryId || undefined,
          description: description.trim() || undefined,
          status,
          unit,
          minimumStock: parseFloat(minimumStock) || 0,
        },
      });

      toast.success('Packaging berhasil diperbarui.');
      navigate(`/inventory/packaging/${id}`);
    } catch (err: unknown) {
      toast.error(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Gagal memperbarui data packaging.'
      );
    }
  };

  if (loadingItem) {
    return <LoadingState message="Memuat data packaging..." className="min-h-[400px]" />;
  }

  if (!packaging) {
    return (
      <Card className="max-w-md mx-auto my-12 text-center p-8">
        <EmptyState
          icon={<Package className="w-10 h-10 text-slate-300 mx-auto" />}
          title="Packaging Tidak Ditemukan"
          description="Material packaging yang ingin Anda edit tidak tersedia atau telah dihapus."
          action={
            <Link to="/inventory/packaging">
              <Button variant="primary" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Kembali ke Daftar
              </Button>
            </Link>
          }
        />
      </Card>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      {/* Top Header with Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(`/inventory/packaging/${id}`)}
            className="p-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-slate-600 transition-colors shadow-xs cursor-pointer"
            title="Kembali ke Detail Packaging"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
              <Link to="/inventory/packaging" className="hover:text-slate-600">
                Inventory
              </Link>
              <span>/</span>
              <Link to="/inventory/packaging" className="hover:text-slate-600">
                Packaging
              </Link>
              <span>/</span>
              <span className="text-slate-700">Edit Packaging</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight mt-0.5">
              Edit Packaging: {packaging.name}
            </h1>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/inventory/packaging/${id}`)}
          >
            Batal
          </Button>
          <Button
            type="submit"
            form="edit-packaging-form"
            variant="primary"
            isLoading={submitting}
          >
            Simpan Perubahan
          </Button>
        </div>
      </div>

      {/* Main 2-Column Form */}
      <form id="edit-packaging-form" onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Basic Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card title="Informasi Dasar">
            <div className="space-y-4">
              <FormInput
                label="Nama Packaging"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Cup 16 oz, Paper Bag M"
              />

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700">
                    SKU / Kode Packaging
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateSku}
                    className="text-[11px] font-semibold text-[#0D5C53] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" /> Auto Generate
                  </button>
                </div>
                <FormInput
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="Contoh: PKG-CUP-16OZ"
                />
              </div>

              {/* Category Select */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700">
                    Kategori <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCatModalOpen(true)}
                    className="text-[11px] font-semibold text-[#0D5C53] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> Tambah Kategori
                  </button>
                </div>
                {loadingCats ? (
                  <div className="text-xs text-slate-400 py-2">Memuat kategori...</div>
                ) : (
                  <FormSelect
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                  >
                    <option value="">Pilih Kategori...</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </FormSelect>
                )}
              </div>

              <FormTextarea
                label="Deskripsi"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tambahkan deskripsi atau catatan khusus untuk packaging ini..."
                rows={3}
              />

              {/* Status Radio */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="block text-xs font-semibold text-slate-700">
                  Status Operasional
                </label>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                    <input
                      type="radio"
                      name="packaging-status"
                      checked={status === 'ACTIVE'}
                      onChange={() => setStatus('ACTIVE')}
                      className="w-4 h-4 text-[#0D5C53] focus:ring-[#0D5C53]"
                    />
                    <span>Aktif</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                    <input
                      type="radio"
                      name="packaging-status"
                      checked={status === 'INACTIVE'}
                      onChange={() => setStatus('INACTIVE')}
                      className="w-4 h-4 text-[#0D5C53] focus:ring-[#0D5C53]"
                    />
                    <span>Nonaktif</span>
                  </label>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Inventory Configuration & Unit Cost */}
        <div className="space-y-6">
          <Card title="Konfigurasi Stok">
            <div className="space-y-4">
              <FormSelect
                label="Unit / Satuan"
                required
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
              >
                <option value="pcs">pcs (Pieces)</option>
                <option value="roll">roll (Gulungan)</option>
                <option value="pack">pack (Kemasan Pack)</option>
                <option value="box">box (Dus/Kotak)</option>
                <option value="lembar">lembar (Lembar)</option>
                <option value="rim">rim (500 Lembar)</option>
                <option value="botol">botol (Botol)</option>
                <option value="cup">cup (Gelas)</option>
              </FormSelect>

              <FormInput
                label="Minimum Stok"
                type="number"
                min="0"
                value={minimumStock}
                onChange={(e) => setMinimumStock(e.target.value)}
                unit={unit}
                helperText="Peringatan stok menipis akan aktif jika stok di bawah nilai ini."
              />
            </div>
          </Card>

          {/* Locked Unit Cost Information Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-xs mb-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Unit Cost (HPP Satuan Otomatis)</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Unit cost dihitung secara otomatis oleh sistem menggunakan metode <strong>Cumulative Weighted Moving Average</strong> saat barang masuk atau Purchase Order (PO) diterima dari supplier.
            </p>
          </div>
        </div>
      </form>

      {/* Quick Add Category Modal */}
      <Modal
        isOpen={isCatModalOpen}
        onClose={() => setIsCatModalOpen(false)}
        title="Tambah Kategori Baru"
        maxWidth="sm"
      >
        <form onSubmit={handleCreateCategory} className="space-y-4">
          <FormInput
            label="Nama Kategori"
            required
            autoFocus
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            placeholder="Contoh: Cup, Paper Bag, Box"
          />

          <FormTextarea
            label="Deskripsi (Opsional)"
            value={newCatDesc}
            onChange={(e) => setNewCatDesc(e.target.value)}
            placeholder="Catatan kategori..."
            rows={2}
          />

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCatModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={creatingCat}
            >
              Simpan Kategori
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

