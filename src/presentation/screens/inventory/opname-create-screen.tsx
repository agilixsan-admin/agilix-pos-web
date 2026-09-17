import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Layers,
  Boxes,
  AlertCircle,
  PlayCircle,
  CheckCircle2,
  Store,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { useAuthStore } from '@domain/state/auth-store';
import {
  useInventoryCategories,
  useRawMaterials,
  usePackagingItems,
  useCreateStockOpnameMutation,
  useStockOpnames,
  useOutlets,
} from '@domain/hooks';
import {
  Card,
  Button,
  FormInput,
  FormSelect,
  FormTextarea,
  Badge,
  FormDatePicker,
} from '@presentation/components/ui';

export const OpnameCreateScreen: React.FC = () => {
  const navigate = useNavigate();
  const currentOutlet = useAuthStore((state) => state.currentOutlet);
  const { data: outlets = [] } = useOutlets();

  // Target Outlet Lock State
  const [targetOutletId, setTargetOutletId] = useState<string>(
    currentOutlet?.id || (outlets.length > 0 ? outlets[0].id : '')
  );

  useEffect(() => {
    if (!targetOutletId && (currentOutlet?.id || outlets[0]?.id)) {
      setTargetOutletId(currentOutlet?.id || outlets[0]?.id || '');
    }
  }, [currentOutlet, outlets, targetOutletId]);

  const targetOutlet = outlets.find((o) => o.id === targetOutletId) || currentOutlet;

  // Form State
  const [opnameDate, setOpnameDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [scope, setScope] = useState<'ALL' | 'CATEGORY'>('ALL');
  const [categoryId, setCategoryId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [formError, setFormError] = useState<string>('');

  // Queries
  const { data: categories = [] } = useInventoryCategories();
  const { data: rawMaterials = [] } = useRawMaterials();
  const { data: packagingItems = [] } = usePackagingItems();

  // Query existing stock opnames for the target outlet to validate constraints
  const { data: opnamesData } = useStockOpnames({
    outletId: targetOutletId || undefined,
    limit: 50,
  });
  const existingOpnames = opnamesData?.data || [];

  // 1. Cek apakah outlet masih memiliki sesi yang belum final (IN_PROGRESS / DRAFT)
  const unfinishedOpname = useMemo(() => {
    if (!targetOutletId) return null;
    return existingOpnames.find(
      (o) => o.outletId === targetOutletId && (o.status === 'IN_PROGRESS' || o.status === 'DRAFT')
    );
  }, [existingOpnames, targetOutletId]);

  // 2. Cek apakah outlet sudah memiliki sesi pada tanggal yang sama (status bukan CANCELLED)
  const sameDateOpname = useMemo(() => {
    if (!targetOutletId || !opnameDate) return null;
    return existingOpnames.find((o) => {
      if (o.outletId !== targetOutletId) return false;
      if (o.status === 'CANCELLED') return false;
      const oDateStr = o.opnameDate ? o.opnameDate.split('T')[0] : '';
      return oDateStr === opnameDate;
    });
  }, [existingOpnames, targetOutletId, opnameDate]);

  const isBlocked = Boolean(unfinishedOpname || sameDateOpname);

  // Format Date Helper
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  // Mutation
  const createMutation = useCreateStockOpnameMutation();

  // Estimate total items in scope
  const totalItemCount =
    scope === 'ALL'
      ? rawMaterials.length + packagingItems.length
      : rawMaterials.filter((m) => m.categoryId === categoryId).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetOutletId) {
      setFormError('Silakan pilih outlet target penghitungan fisik terlebih dahulu.');
      return;
    }

    if (scope === 'CATEGORY' && !categoryId) {
      setFormError('Silakan pilih kategori item yang akan dihitung.');
      return;
    }

    if (unfinishedOpname) {
      setFormError(
        `Cabang ini masih memiliki sesi Stock Opname yang belum final (${unfinishedOpname.opnameNumber}). Selesaikan atau batalkan sesi tersebut terlebih dahulu.`
      );
      return;
    }

    if (sameDateOpname) {
      setFormError(
        `Cabang ini sudah memiliki sesi Stock Opname pada tanggal ${formatDate(opnameDate)} (${sameDateOpname.opnameNumber}). Setiap outlet tidak boleh membuat lebih dari satu sesi di tanggal yang sama.`
      );
      return;
    }

    try {
      setFormError('');
      const payload = {
        outletId: targetOutletId,
        scope,
        categoryId: scope === 'CATEGORY' ? categoryId : undefined,
        opnameDate,
        notes: notes.trim() || undefined,
      };

      const result = await createMutation.mutateAsync(payload);
      navigate(`/inventory/opname/${result.id}/count`);
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ||
        (err as { message?: string })?.message ||
        'Gagal memulai sesi stock opname';
      setFormError(errorMsg);
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

      {/* Unfinished Opname Alert Banner */}
      {unfinishedOpname && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-100 text-amber-800 rounded-xl shrink-0 mt-0.5">
                <Clock className="w-5 h-5 text-amber-700" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wide">
                  Sesi Stock Opname Belum Selesai
                </h4>
                <p className="text-xs text-amber-900 leading-relaxed">
                  Cabang <strong>{targetOutlet?.name || 'terpilih'}</strong> masih memiliki sesi Stock Opname yang belum final (
                  <strong className="font-mono text-amber-950">{unfinishedOpname.opnameNumber}</strong>
                  {unfinishedOpname.opnameDate && `, Periode: ${formatDate(unfinishedOpname.opnameDate)}`}).
                  Selesaikan atau batalkan sesi tersebut sebelum memulai sesi baru.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 sm:self-center">
              <Button
                type="button"
                variant="primary"
                size="sm"
                leftIcon={<PlayCircle className="w-4 h-4" />}
                onClick={() => navigate(`/inventory/opname/${unfinishedOpname.id}/count`)}
                className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs whitespace-nowrap shadow-xs"
              >
                Lanjut Hitung ({unfinishedOpname.opnameNumber})
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Duplicate Date Alert Banner (if no unfinished opname blocking) */}
      {!unfinishedOpname && sameDateOpname && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 shadow-xs flex items-start gap-3">
          <div className="p-2 bg-rose-100 text-rose-700 rounded-xl shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-rose-950 uppercase tracking-wide">
              Tanggal Sudah Memiliki Sesi Opname
            </h4>
            <p className="text-xs text-rose-800 leading-relaxed">
              Cabang <strong>{targetOutlet?.name || 'terpilih'}</strong> sudah memiliki sesi Stock Opname pada tanggal{' '}
              <strong>{formatDate(opnameDate)}</strong> (
              <strong className="font-mono text-rose-950">{sameDateOpname.opnameNumber}</strong>, Status: {sameDateOpname.status}).
              Setiap outlet tidak diperbolehkan membuat lebih dari satu sesi di tanggal yang sama. Silakan pilih tanggal lain.
            </p>
          </div>
        </div>
      )}

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
              <FormSelect
                label="Cabang Target Penghitungan Fisik"
                value={targetOutletId}
                onChange={(e) => setTargetOutletId(e.target.value)}
                required
                helperText="Pilih cabang gudang tempat penghitungan fisik stok dilakukan."
              >
                {outlets.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </FormSelect>
            </div>

            <div>
              <FormDatePicker
                label="Tanggal Opname"
                required
                value={opnameDate}
                onChange={(val) => setOpnameDate(val)}
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
                Sistem akan membuat <strong>snapshot stok fisik saat ini</strong> untuk gudang cabang{' '}
                <strong>{targetOutlet?.name || 'terpilih'}</strong> guna mempermudah evaluasi selisih saat opname berlangsung tanpa mengganggu operasional POS.
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
                disabled={isBlocked || createMutation.isPending}
                title={
                  unfinishedOpname
                    ? 'Selesaikan sesi aktif terlebih dahulu'
                    : sameDateOpname
                    ? 'Tanggal ini sudah memiliki sesi Stock Opname'
                    : 'Mulai Stock Opname'
                }
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

