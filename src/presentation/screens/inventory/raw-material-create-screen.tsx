import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import type { InventoryCategory } from '@model/Inventory';
import { inventoryService } from '@domain/services/inventory-service';
import {
  ArrowLeft,
  Lock,
  Plus,
} from 'lucide-react';
import {
  Button,
  Card,
  FormInput,
  FormSelect,
  FormTextarea,
  Modal,
} from '@presentation/components/ui';

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
      alert(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Gagal membuat kategori.'
      );
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
      alert(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Gagal menyimpan bahan baku.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/inventory/raw-materials')}
            className="p-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-slate-600 transition-colors shadow-xs cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Tambah Bahan Baku</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Daftarkan bahan mentah baru yang digunakan untuk komposisi resep menu (BOM).
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
                placeholder="Contoh: Biji Kopi Espresso Blend"
              />

              <FormInput
                label="SKU / Kode Bahan Baku"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="Contoh: RM-COF-001"
                helperText="Kode unik untuk identifikasi dan barcode scanning."
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
                placeholder="Catatan spesifikasi penyimpanan atau informasi tambahan..."
                rows={3}
              />
            </div>
          </Card>

          {/* Kolom Kanan: Unit & Stok */}
          <div className="space-y-6">
            <Card
              header={
                <h2 className="text-sm font-bold text-slate-900">
                  Unit & Batas Stok
                </h2>
              }
            >
              <div className="space-y-4">
                <FormSelect
                  label="Satuan Dasar (Base Unit)"
                  required
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  helperText="Satuan terkecil yang digunakan untuk takaran resep (contoh: gram, ml, pcs)."
                >
                  <option value="g">Gram (g) - Berat</option>
                  <option value="ml">Mililiter (ml) - Volume</option>
                  <option value="pcs">Pcs - Satuan</option>
                  <option value="kg">Kilogram (kg)</option>
                  <option value="l">Liter (l)</option>
                  <option value="shot">Shot - Takaran Kopi</option>
                  <option value="slice">Slice / Lembar</option>
                </FormSelect>

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
                  label="Status Bahan Baku"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'ACTIVE' | 'INACTIVE')}
                >
                  <option value="ACTIVE">Aktif (Dapat digunakan di Resep & Pembelian)</option>
                  <option value="INACTIVE">Nonaktif (Diarsipkan)</option>
                </FormSelect>
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
        </div>

        {/* Bottom Actions Bar */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <Link to="/inventory/raw-materials">
            <Button type="button" variant="outline">
              Batal
            </Button>
          </Link>
          <Button
            type="submit"
            variant="primary"
            isLoading={submitting}
          >
            Simpan Bahan Baku
          </Button>
        </div>
      </form>

      {/* Reusable Quick Category Modal */}
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
