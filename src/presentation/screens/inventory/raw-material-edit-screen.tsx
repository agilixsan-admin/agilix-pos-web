import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  useRawMaterialDetail,
  useInventoryCategories,
  useUpdateRawMaterialMutation,
  useCreateInventoryCategoryMutation,
} from '@domain/hooks';
import {
  ArrowLeft,
  Lock,
  Plus,
  AlertCircle,
} from 'lucide-react';
import {
  Button,
  Card,
  FormInput,
  FormSelect,
  FormTextarea,
  Modal,
  LoadingState,
  toast,
} from '@presentation/components/ui';

export const RawMaterialEditScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Query & Mutation Hooks
  const { data: item, isLoading: loadingItem } = useRawMaterialDetail(id);
  const { data: categories = [], isLoading: loadingCats } = useInventoryCategories();
  const updateMaterialMutation = useUpdateRawMaterialMutation();
  const createCategoryMutation = useCreateInventoryCategoryMutation();
  const submitting = updateMaterialMutation.isPending;
  const creatingCat = createCategoryMutation.isPending;

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

  useEffect(() => {
    if (item) {
      setName(item.name || '');
      setSku(item.sku || item.code || '');
      setCategoryId(
        item.categoryId ||
          (typeof item.category === 'object' && item.category
            ? (item.category as any).id
            : '')
      );
      setDescription(item.description || '');
      setStatus((item.status as 'ACTIVE' | 'INACTIVE') || 'ACTIVE');
      setUnit(item.unit || 'g');
      setMinimumStock(String(item.minimumStock ?? item.minStock ?? 0));
      setUnitCost(Number(item.unitCost ?? item.costPrice ?? 0));
    }
  }, [item]);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      const created = await createCategoryMutation.mutateAsync({
        name: newCatName.trim(),
        status: 'ACTIVE',
      });
      setIsCatModalOpen(false);
      setNewCatName('');
      if (created?.id) {
        setCategoryId(created.id);
      }
      toast.success('Kategori baru berhasil dibuat.');
    } catch (err: unknown) {
      toast.error(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Gagal membuat kategori.'
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    if (!name.trim()) {
      toast.warning('Nama bahan baku wajib diisi.');
      return;
    }

    try {
      await updateMaterialMutation.mutateAsync({
        id,
        data: {
          name: name.trim(),
          sku: sku.trim() || undefined,
          categoryId: categoryId || undefined,
          description: description.trim() || undefined,
          minimumStock: Number(minimumStock || 0),
          status,
        },
      });

      toast.success('Bahan baku berhasil diperbarui.');
      navigate('/inventory/raw-materials');
    } catch (err: unknown) {
      toast.error(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Gagal memperbarui bahan baku.'
      );
    }
  };

  if (loadingItem) {
    return <LoadingState message="Memuat formulir edit..." className="min-h-[400px]" />;
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
          {/* Kolom Kiri: Informasi Dasar */}
          <Card
            header={
              <h2 className="text-sm font-bold text-slate-900">
                Informasi Dasar
              </h2>
            }
          >
            <div className="space-y-4">
              <FormInput
                label="Nama Bahan Baku"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Biji Kopi Arabika House Blend"
              />

              <FormInput
                label="SKU / Kode Bahan Baku"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="Contoh: RM-COF-001"
              />

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
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
                label="Deskripsi / Catatan"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Catatan spesifikasi penyimpanan atau informasi tambahan..."
              />
            </div>
          </Card>

          {/* Kolom Kanan: Unit & Pengaturan */}
          <div className="space-y-6">
            <Card
              header={
                <h2 className="text-sm font-bold text-slate-900">
                  Unit, Batas Stok & Status
                </h2>
              }
            >
              <div className="space-y-4">
                {/* Satuan Dasar (Locked) */}
                <div>
                  <FormInput
                    label="Satuan Dasar (Base Unit)"
                    value={unit}
                    isLocked
                    disabled
                  />
                  {/* Notice Alert */}
                  <div className="mt-2.5 p-3 bg-amber-50/80 border border-amber-200 rounded-xl flex items-start gap-2 text-amber-800">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-[11px] leading-relaxed">
                      <strong>Base unit terkunci:</strong> Satuan dasar tidak dapat diubah karena bahan baku sudah terdaftar dalam sistem inventori dan mungkin telah terhubung ke resep produk atau mutasi stok.
                    </p>
                  </div>
                </div>

                <FormInput
                  label="Batas Stok Minimum (Alert Threshold)"
                  type="number"
                  min="0"
                  step="any"
                  unit={unit}
                  value={minimumStock}
                  onChange={(e) => setMinimumStock(e.target.value)}
                  placeholder="0"
                  helperText='Sistem akan menandai status "Stok Rendah" jika stok mencapai atau di bawah angka ini.'
                />

                <FormSelect
                  label="Status Operasional"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'ACTIVE' | 'INACTIVE')}
                >
                  <option value="ACTIVE">Aktif (Dapat Digunakan di Resep & Pengadaan)</option>
                  <option value="INACTIVE">Nonaktif (Diarsipkan dari Menu Baru)</option>
                </FormSelect>
              </div>
            </Card>

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
          <Link to={`/inventory/raw-materials/${id}`}>
            <Button type="button" variant="outline">
              Batal
            </Button>
          </Link>
          <Button
            type="submit"
            variant="primary"
            isLoading={submitting}
          >
            Simpan Perubahan
          </Button>
        </div>
      </form>

      {/* Reusable Category Modal */}
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
            placeholder="Contoh: Dairy & Susu"
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
