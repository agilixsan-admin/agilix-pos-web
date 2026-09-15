import React, { useState, useEffect } from 'react';
import type { TaxItem, TaxType, TaxStatus } from '@model/Settings';
import {
  useTaxes,
  useGlobalTaxConfig,
  useCreateTaxMutation,
  useUpdateTaxMutation,
  useDeleteTaxMutation,
  useUpdateGlobalTaxConfigMutation,
  useOutlets,
} from '@domain/hooks';
import { useAuthStore } from '@domain/state/auth-store';
import {
  Receipt,
  Plus,
  Edit2,
  Globe,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Search,
  Check,
  Store,
  Layers,
} from 'lucide-react';
import {
  Button,
  Card,
  Modal,
  FormInput,
  LoadingState,
  EmptyState,
} from '@presentation/components/ui';

export const TaxesScreen: React.FC = () => {
  const currentOutlet = useAuthStore((state) => state.currentOutlet);
  const { data: outlets = [], isLoading: outletsLoading } = useOutlets();

  // Selected Outlet for filtering & configuring: '' means "Semua Cabang (Global PT)"
  const [selectedOutletId, setSelectedOutletId] = useState<string>('');

  // Auto-initialize selected outlet from user's current outlet once loaded
  useEffect(() => {
    if (!selectedOutletId && currentOutlet?.id) {
      setSelectedOutletId(currentOutlet.id);
    }
  }, [currentOutlet, selectedOutletId]);

  const activeOutlet = outlets.find((o) => o.id === selectedOutletId);

  // Queries
  const {
    data: taxes = [],
    isLoading: taxesLoading,
    error: taxesError,
  } = useTaxes(selectedOutletId ? { outletId: selectedOutletId } : undefined);

  const {
    data: globalConfig,
    isLoading: configLoading,
  } = useGlobalTaxConfig(selectedOutletId || undefined);

  // Mutations
  const createTaxMutation = useCreateTaxMutation();
  const updateTaxMutation = useUpdateTaxMutation();
  const deleteTaxMutation = useDeleteTaxMutation();
  const updateGlobalTaxConfigMutation = useUpdateGlobalTaxConfigMutation();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTax, setEditingTax] = useState<TaxItem | null>(null);
  const [deletingTax, setDeletingTax] = useState<TaxItem | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    rate: '11',
    type: 'EXCLUSIVE' as TaxType,
    status: 'ACTIVE' as TaxStatus,
    scope: 'GLOBAL' as 'GLOBAL' | 'OUTLET',
    outletId: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleOpenAdd = () => {
    setEditingTax(null);
    setFormData({
      name: '',
      description: '',
      rate: '11',
      type: 'EXCLUSIVE',
      status: 'ACTIVE',
      scope: selectedOutletId ? 'OUTLET' : 'GLOBAL',
      outletId: selectedOutletId || (outlets[0]?.id || ''),
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEdit = (tax: TaxItem) => {
    setEditingTax(tax);
    setFormData({
      name: tax.name,
      description: tax.description || '',
      rate: tax.rate.toString(),
      type: tax.type,
      status: tax.status || (tax.isActive ? 'ACTIVE' : 'INACTIVE'),
      scope: tax.isGlobal || !tax.outletId ? 'GLOBAL' : 'OUTLET',
      outletId: tax.outletId || selectedOutletId || (outlets[0]?.id || ''),
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) {
      errors.name = 'Nama pajak wajib diisi';
    }
    const rateNum = parseFloat(formData.rate);
    if (isNaN(rateNum) || rateNum < 0 || rateNum > 100) {
      errors.rate = 'Tarif harus berupa angka antara 0 - 100%';
    }
    if (formData.scope === 'OUTLET' && !formData.outletId) {
      errors.outletId = 'Silakan pilih cabang outlet';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const rate = parseFloat(formData.rate);
    const isGlobalScope = formData.scope === 'GLOBAL';
    const targetOutletId = isGlobalScope ? undefined : formData.outletId;

    try {
      if (editingTax) {
        await updateTaxMutation.mutateAsync({
          id: editingTax.id,
          data: {
            name: formData.name.trim(),
            description: formData.description.trim() || undefined,
            rate,
            type: formData.type,
            status: formData.status,
            isGlobal: isGlobalScope,
            outletId: isGlobalScope ? null : targetOutletId,
          },
        });
        showToast('Pajak berhasil diperbarui');
      } else {
        await createTaxMutation.mutateAsync({
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          rate,
          type: formData.type,
          status: formData.status,
          isGlobal: isGlobalScope,
          outletId: targetOutletId,
        });
        showToast('Pajak baru berhasil ditambahkan');
      }
      setIsModalOpen(false);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      showToast(
        error.response?.data?.message || error.message || 'Terjadi kesalahan saat menyimpan pajak',
        'error'
      );
    }
  };

  const handleDelete = async () => {
    if (!deletingTax) return;
    try {
      await deleteTaxMutation.mutateAsync(deletingTax.id);
      showToast(`Pajak "${deletingTax.name}" berhasil dihapus`);
      setDeletingTax(null);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      showToast(
        error.response?.data?.message || error.message || 'Gagal menghapus pajak',
        'error'
      );
    }
  };

  const handleToggleCalculation = async (enabled: boolean) => {
    try {
      await updateGlobalTaxConfigMutation.mutateAsync({
        enableTaxCalculation: enabled,
        defaultGlobalTaxId: globalConfig?.defaultGlobalTaxId ?? null,
        outletId: selectedOutletId || undefined,
      });
      showToast(
        enabled
          ? `Perhitungan pajak diaktifkan untuk ${activeOutlet ? activeOutlet.name : 'seluruh cabang'}`
          : `Perhitungan pajak dinonaktifkan untuk ${activeOutlet ? activeOutlet.name : 'seluruh cabang'}`
      );
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      showToast(
        error.response?.data?.message || error.message || 'Gagal memperbarui konfigurasi pajak',
        'error'
      );
    }
  };

  const handleDefaultTaxChange = async (taxId: string) => {
    try {
      await updateGlobalTaxConfigMutation.mutateAsync({
        enableTaxCalculation: globalConfig?.enableTaxCalculation ?? true,
        defaultGlobalTaxId: taxId ? taxId : null,
        outletId: selectedOutletId || undefined,
      });
      showToast(`Pajak default ${activeOutlet ? activeOutlet.name : 'global'} berhasil diperbarui`);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      showToast(
        error.response?.data?.message || error.message || 'Gagal memperbarui pajak default',
        'error'
      );
    }
  };

  // Filtered taxes based on search query
  const filteredTaxes = taxes.filter((t) => {
    const q = searchQuery.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      (t.description && t.description.toLowerCase().includes(q)) ||
      (t.code && t.code.toLowerCase().includes(q))
    );
  });

  const isSaving = createTaxMutation.isPending || updateTaxMutation.isPending;
  const isDeleting = deleteTaxMutation.isPending;
  const isUpdatingConfig = updateGlobalTaxConfigMutation.isPending;
  const isLoading = taxesLoading || configLoading || outletsLoading;

  if (isLoading) {
    return (
      <div className="py-12">
        <LoadingState message="Memuat data pengaturan pajak..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`flex items-center gap-2.5 p-4 rounded-xl border text-xs font-semibold shadow-md animate-in fade-in slide-in-from-top-3 duration-200 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header with Outlet Switcher */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Pengaturan Pajak</h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Multi-Outlet
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Kelola tarif pajak dan konfigurasi pemungutan pajak per cabang outlet atau tingkat kebijakan PT.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-3">
          {/* Outlet Switcher Dropdown */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 shadow-xs">
            <Store className="w-4 h-4 text-[#0D5C53] shrink-0" />
            <span className="text-xs font-medium text-slate-600 shrink-0">Cabang:</span>
            <select
              value={selectedOutletId}
              onChange={(e) => setSelectedOutletId(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-800 outline-none cursor-pointer pr-1"
            >
              <option value="">🌐 Semua Cabang (Kebijakan Global PT)</option>
              {outlets.map((outlet) => (
                <option key={outlet.id} value={outlet.id}>
                  🏪 {outlet.name}
                </option>
              ))}
            </select>
          </div>

          <Button
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={handleOpenAdd}
            className="bg-[#0D5C53] hover:bg-[#09423c] text-white shadow-sm"
          >
            + Tambah Pajak
          </Button>
        </div>
      </div>

      {taxesError && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Gagal memuat data dari server. Silakan muat ulang halaman.</span>
        </div>
      )}

      {/* Card 1: Configuration per Selected Outlet or Global */}
      <Card className="border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-teal-50 text-[#0D5C53] flex items-center justify-center border border-teal-100/70">
              {activeOutlet ? <Store className="w-5 h-5" /> : <Globe className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm font-bold text-slate-900">
                  Konfigurasi Pajak: {activeOutlet ? activeOutlet.name : 'Kebijakan Global PT (Semua Cabang)'}
                </h2>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                    activeOutlet
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-blue-50 text-blue-700 border-blue-200'
                  }`}
                >
                  {activeOutlet ? 'Khusus Cabang Ini' : 'Berlaku Global'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {activeOutlet
                  ? `Pengaturan pemungutan pajak khusus yang diterapkan pada kasir POS cabang ${activeOutlet.name}.`
                  : 'Pengaturan pemungutan pajak default yang menjadi acuan standar bagi seluruh cabang.'}
              </p>
            </div>
          </div>
        </div>

        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Box 1: Enable Tax Calculation */}
            <div className="p-4.5 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-4">
              <div>
                <h3 className="text-xs font-bold text-slate-900">Aktifkan Perhitungan Pajak</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Hitung dan kenakan pajak secara otomatis pada transaksi POS di {activeOutlet ? activeOutlet.name : 'seluruh outlet'}.
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={globalConfig?.enableTaxCalculation ?? false}
                  disabled={isUpdatingConfig}
                  onChange={(e) => handleToggleCalculation(e.target.checked)}
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0D5C53]"></div>
              </label>
            </div>

            {/* Box 2: Default Tax */}
            <div className="p-4.5 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50/80 transition-colors flex flex-col justify-between gap-3">
              <div>
                <h3 className="text-xs font-bold text-slate-900">Pajak Standar (Default Tax)</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Tarif pajak yang otomatis dipilih saat membuat order kasir.
                </p>
              </div>

              <div>
                <select
                  value={globalConfig?.defaultGlobalTaxId || ''}
                  disabled={!(globalConfig?.enableTaxCalculation) || isUpdatingConfig}
                  onChange={(e) => handleDefaultTaxChange(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53] outline-none disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed transition-all"
                >
                  <option value="">-- None (Tidak Ada Pajak Default) --</option>
                  {taxes
                    .filter((t) => t.status === 'ACTIVE' || t.isActive)
                    .map((tax) => (
                      <option key={tax.id} value={tax.id}>
                        {tax.name} ({tax.rate}%) - {tax.type === 'INCLUSIVE' ? 'Inclusive' : 'Exclusive'} {tax.isGlobal ? '[Global]' : ''}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Card 2: Tax Master List */}
      <Card className="border border-slate-200/90 shadow-sm overflow-hidden" padding="none">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-teal-50 text-[#0D5C53] flex items-center justify-center border border-teal-100/70">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Daftar Tarif Pajak (Tax Master)</h2>
              <p className="text-xs text-slate-500">
                {activeOutlet
                  ? `Menampilkan tarif pajak yang berlaku untuk outlet ${activeOutlet.name} (termasuk pajak global PT).`
                  : 'Menampilkan seluruh master tarif pajak (kebijakan global PT dan cabang).'}
              </p>
            </div>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama pajak..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50/70 border border-slate-200 rounded-lg text-xs text-slate-700 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53] transition-all"
            />
          </div>
        </div>

        <div className="p-5">
          {filteredTaxes.length === 0 ? (
            <div className="py-8">
              <EmptyState
                icon={<Receipt className="w-10 h-10 text-slate-300 mx-auto" />}
                title={searchQuery ? 'Tidak ada pajak yang cocok' : 'Belum ada data master pajak'}
                description={
                  searchQuery
                    ? `Tidak ditemukan pajak dengan kata kunci "${searchQuery}".`
                    : 'Tambahkan master pajak untuk mengaktifkan perhitungan pajak pada pesanan POS.'
                }
              />
              {!searchQuery && (
                <div className="text-center mt-4">
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<Plus className="w-4 h-4" />}
                    onClick={handleOpenAdd}
                  >
                    Tambah Pajak Pertama
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTaxes.map((tax) => {
                const isActive = tax.status === 'ACTIVE' || tax.isActive;
                const isGlobalTax = tax.isGlobal || !tax.outletId;
                const outletName = tax.outlet?.name || outlets.find((o) => o.id === tax.outletId)?.name;

                return (
                  <div
                    key={tax.id}
                    className="p-4 rounded-xl border border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    {/* Left Details */}
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-teal-50/80 text-[#0D5C53] flex items-center justify-center shrink-0 border border-teal-100/60">
                        <Receipt className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 text-sm">{tax.name}</span>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              isActive
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-500 border border-slate-200'
                            }`}
                          >
                            {isActive ? 'Active' : 'Inactive'}
                          </span>

                          {/* Outlet Scope Badge */}
                          {isGlobalTax ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                              <Globe className="w-3 h-3" />
                              Global (Semua Cabang)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              <Store className="w-3 h-3" />
                              Cabang: {outletName || 'Khusus Cabang'}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {tax.description || 'Standard Tax Rate'}
                        </p>
                      </div>
                    </div>

                    {/* Right Info & Actions */}
                    <div className="flex items-center justify-between sm:justify-end gap-6 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <div className="text-left sm:text-right">
                        <div className="text-base font-bold text-slate-900 tracking-tight">
                          {Number(tax.rate).toFixed(2)}%
                        </div>
                        <div className="text-[11px] font-medium text-slate-500 capitalize">
                          {tax.type === 'INCLUSIVE' ? 'Inclusive' : 'Exclusive'}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEdit(tax)}
                          leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                          className="text-xs font-semibold text-slate-700"
                        >
                          Edit
                        </Button>
                        <button
                          onClick={() => setDeletingTax(tax)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg border border-slate-200 transition-colors"
                          title="Hapus Pajak"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>

      {/* Add / Edit Tax Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTax ? 'Edit Pajak' : 'Tambah Pajak Baru'}
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormInput
            label="Nama Pajak"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Contoh: PB1 10% atau PPN 11%"
            error={formErrors.name}
          />

          <FormInput
            label="Deskripsi (Opsional)"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Contoh: Pajak Restoran Daerah"
          />

          <FormInput
            label="Tarif Pajak (%)"
            type="number"
            min="0"
            max="100"
            step="0.01"
            unit="%"
            required
            value={formData.rate}
            onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
            placeholder="10.00"
            error={formErrors.rate}
          />

          {/* Tax Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Tipe Perhitungan Pajak <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'EXCLUSIVE' })}
                className={`p-3 rounded-xl border text-left transition-all ${
                  formData.type === 'EXCLUSIVE'
                    ? 'border-[#0D5C53] bg-teal-50/50 ring-1 ring-[#0D5C53]'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">Exclusive</span>
                  {formData.type === 'EXCLUSIVE' && (
                    <Check className="w-4 h-4 text-[#0D5C53]" />
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Ditambahkan di luar harga produk (pada subtotal order).
                </p>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'INCLUSIVE' })}
                className={`p-3 rounded-xl border text-left transition-all ${
                  formData.type === 'INCLUSIVE'
                    ? 'border-[#0D5C53] bg-teal-50/50 ring-1 ring-[#0D5C53]'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">Inclusive</span>
                  {formData.type === 'INCLUSIVE' && (
                    <Check className="w-4 h-4 text-[#0D5C53]" />
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Harga produk sudah termasuk pajak di dalamnya.
                </p>
              </button>
            </div>
          </div>

          {/* Multi-Outlet Scope Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Cakupan Penerapan Pajak <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, scope: 'GLOBAL' })}
                className={`p-3 rounded-xl border text-left transition-all ${
                  formData.scope === 'GLOBAL'
                    ? 'border-[#0D5C53] bg-teal-50/50 ring-1 ring-[#0D5C53]'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-[#0D5C53]" />
                    <span className="text-xs font-bold text-slate-900">Global PT</span>
                  </div>
                  {formData.scope === 'GLOBAL' && <Check className="w-4 h-4 text-[#0D5C53]" />}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Berlaku umum untuk semua cabang outlet PT.
                </p>
              </button>

              <button
                type="button"
                onClick={() =>
                  setFormData({
                    ...formData,
                    scope: 'OUTLET',
                    outletId: formData.outletId || selectedOutletId || (outlets[0]?.id || ''),
                  })
                }
                className={`p-3 rounded-xl border text-left transition-all ${
                  formData.scope === 'OUTLET'
                    ? 'border-[#0D5C53] bg-teal-50/50 ring-1 ring-[#0D5C53]'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Store className="w-3.5 h-3.5 text-[#0D5C53]" />
                    <span className="text-xs font-bold text-slate-900">Khusus Cabang</span>
                  </div>
                  {formData.scope === 'OUTLET' && <Check className="w-4 h-4 text-[#0D5C53]" />}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Hanya berlaku spesifik untuk outlet tertentu.
                </p>
              </button>
            </div>
          </div>

          {/* Outlet Selection when Scope is OUTLET */}
          {formData.scope === 'OUTLET' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pilih Cabang Outlet <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.outletId}
                onChange={(e) => setFormData({ ...formData, outletId: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53] outline-none"
              >
                {outlets.map((outlet) => (
                  <option key={outlet.id} value={outlet.id}>
                    🏪 {outlet.name}
                  </option>
                ))}
              </select>
              {formErrors.outletId && (
                <p className="text-[11px] text-red-500 mt-1">{formErrors.outletId}</p>
              )}
            </div>
          )}

          {/* Status Toggle */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 border border-slate-200/70">
              <div>
                <span className="text-xs font-semibold text-slate-900">Status Aktif</span>
                <p className="text-[11px] text-slate-500">Pajak aktif dapat digunakan saat transaksi penjualan kasir.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={formData.status === 'ACTIVE'}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      status: e.target.checked ? 'ACTIVE' : 'INACTIVE',
                    })
                  }
                />
                <div className="w-10 h-5.5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-[#0D5C53]"></div>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={isSaving}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSaving}
              className="bg-[#0D5C53] hover:bg-[#09423c] text-white"
            >
              {isSaving ? 'Menyimpan...' : editingTax ? 'Perbarui Pajak' : 'Simpan Pajak'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deletingTax)}
        onClose={() => setDeletingTax(null)}
        title="Hapus Master Pajak"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-red-50 text-red-800 text-xs">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <div>
              <p className="font-semibold">Tindakan ini tidak dapat dibatalkan.</p>
              <p className="mt-0.5 text-red-700">
                Apakah Anda yakin ingin menghapus pajak <strong>"{deletingTax?.name}"</strong> ({deletingTax?.rate}%)?
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeletingTax(null)}
              disabled={isDeleting}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Menghapus...' : 'Ya, Hapus Pajak'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
