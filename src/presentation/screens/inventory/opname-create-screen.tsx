import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Layers,
  Boxes,
  AlertCircle,
  PlayCircle,
  CheckCircle2,
} from 'lucide-react';
import { useAuthStore } from '@domain/state/auth-store';
import {
  useInventoryCategories,
  useRawMaterials,
  usePackagingItems,
  useCreateStockOpnameMutation,
} from '@domain/hooks';
import {
  Card,
  Button,
  FormInput,
  FormSelect,
  FormTextarea,
  Badge,
} from '@presentation/components/ui';

export const OpnameCreateScreen: React.FC = () => {
  const navigate = useNavigate();
  const currentOutlet = useAuthStore((state) => state.currentOutlet);

  // Queries
  const { data: categories = [] } = useInventoryCategories();
  const { data: rawMaterials = [] } = useRawMaterials();
  const { data: packagingItems = [] } = usePackagingItems();

  // Mutation
  const createMutation = useCreateStockOpnameMutation();

  // Form State
  const [opnameDate, setOpnameDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [scope, setScope] = useState<'ALL' | 'CATEGORY'>('ALL');
  const [categoryId, setCategoryId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [formError, setFormError] = useState<string>('');

  // Estimate total items in scope
  const totalItemCount =
    scope === 'ALL'
      ? rawMaterials.length + packagingItems.length
      : rawMaterials.filter((m) => m.categoryId === categoryId).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOutlet?.id) {
      setFormError('Outlet aktif belum terdeteksi. Silakan pilih outlet terlebih dahulu.');
      return;
    }

    if (scope === 'CATEGORY' && !categoryId) {
      setFormError('Silakan pilih kategori item yang akan dihitung.');
      return;
    }

    try {
      setFormError('');
      const payload = {
        outletId: currentOutlet.id,
        scope,
        categoryId: scope === 'CATEGORY' ? categoryId : undefined,
        opnameDate,
        notes: notes.trim() || undefined,
      };

      const result = await createMutation.mutateAsync(payload);
      navigate(`/inventory/opname/${result.id}/count`);
    } catch (err: any) {
      setFormError(
        err?.response?.data?.message || err?.message || 'Gagal memulai sesi stock opname'
      );
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Top Header & Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/inventory/opname')}
          className="p-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-slate-600 transition-colors shadow-xs cursor-pointer"
          title="Kembali ke Daftar Opname"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Link to="/inventory/opname" className="hover:text-[#0D5C53]">
              Stock Opname
            </Link>
            <span>/</span>
            <span className="text-slate-800 font-semibold">Buat Stock Opname</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight mt-0.5">
            Buat Stock Opname
          </h1>
        </div>
      </div>

      {formError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Detail Periode */}
        <Card header={<h3 className="text-sm font-bold text-slate-900">Detail Periode</h3>}>
          <div className="space-y-4">
            <div>
              <FormInput
                type="date"
                label="Tanggal Opname"
                required
                value={opnameDate}
                onChange={(e) => setOpnameDate(e.target.value)}
              />
            </div>

            <div>
              <FormSelect
                label="Cakupan Sesi"
                value={scope}
                onChange={(e) => {
                  setScope(e.target.value as 'ALL' | 'CATEGORY');
                  setCategoryId('');
                }}
              >
                <option value="ALL">Semua Item (Bahan Baku + Packaging)</option>
                <option value="CATEGORY">Kategori Tertentu Saja</option>
              </FormSelect>
            </div>

            {scope === 'CATEGORY' && (
              <div>
                <FormSelect
                  label="Pilih Kategori"
                  required
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                >
                  <option value="">-- Pilih Kategori --</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </FormSelect>
              </div>
            )}

            <div>
              <FormTextarea
                label="Catatan (Opsional)"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Tambahkan catatan khusus untuk periode opname ini..."
              />
            </div>
          </div>
        </Card>

        {/* Card 2: Cakupan Item */}
        <Card header={<h3 className="text-sm font-bold text-slate-900">Cakupan Item</h3>}>
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-slate-500 font-medium block">Pilihan Hitung</span>
                <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                  {totalItemCount} Item Terdaftar
                </span>
              </div>
              <Badge variant="info">
                {scope === 'ALL' ? 'Semua Item' : 'Kategori Spesifik'}
              </Badge>
            </div>

            <div className="space-y-2.5 pt-2">
              <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={scope === 'ALL'}
                  disabled
                  className="rounded text-[#0D5C53] focus:ring-[#0D5C53]"
                />
                <span className="font-semibold text-slate-800">
                  Bahan Baku ({rawMaterials.length} item)
                </span>
              </label>

              <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={scope === 'ALL'}
                  disabled
                  className="rounded text-[#0D5C53] focus:ring-[#0D5C53]"
                />
                <span className="font-semibold text-slate-800">
                  Packaging ({packagingItems.length} item)
                </span>
              </label>
            </div>

            {/* Informational Alert */}
            <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 flex items-start gap-2.5 mt-4">
              <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed text-[11px] text-blue-800">
                Sistem akan membuat <strong>snapshot stok fisik saat ini</strong> untuk mempermudah
                dalam melakukan evaluasi selisih saat opname berlangsung tanpa mengganggu operasional POS.
              </p>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/inventory/opname')}
              >
                Batal
              </Button>

              <Button
                type="submit"
                variant="primary"
                leftIcon={<PlayCircle className="w-4 h-4" />}
                isLoading={createMutation.isPending}
              >
                Mulai Stock Opname
              </Button>
            </div>
          </div>
        </Card>
      </form>
    </div>
  );
};
