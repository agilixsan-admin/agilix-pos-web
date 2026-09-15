import React, { useState, useEffect } from 'react';
import type {
  DiscountItem,
  DiscountCalculationType,
  DiscountValidityType,
  DiscountScope,
  DiscountStatus,
} from '@model/Settings';
import {
  useDiscounts,
  useCreateDiscountMutation,
  useUpdateDiscountMutation,
  useDeleteDiscountMutation,
  useProducts,
  useOutlets,
} from '@domain/hooks';
import { useAuthStore } from '@domain/state/auth-store';
import {
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Search,
  Check,
  Calendar,
  Clock,
  Infinity as InfinityIcon,
  Percent,
  DollarSign,
  Store,
  Globe,
} from 'lucide-react';
import {
  Button,
  Card,
  Modal,
  FormInput,
  LoadingState,
  EmptyState,
} from '@presentation/components/ui';

const DAYS_OF_WEEK = [
  { key: 'MONDAY', label: 'Sen', full: 'Senin' },
  { key: 'TUESDAY', label: 'Sel', full: 'Selasa' },
  { key: 'WEDNESDAY', label: 'Rab', full: 'Rabu' },
  { key: 'THURSDAY', label: 'Kam', full: 'Kamis' },
  { key: 'FRIDAY', label: 'Jum', full: 'Jumat' },
  { key: 'SATURDAY', label: 'Sab', full: 'Sabtu' },
  { key: 'SUNDAY', label: 'Min', full: 'Minggu' },
];

export const DiscountsScreen: React.FC = () => {
  const currentOutlet = useAuthStore((state) => state.currentOutlet);
  const { data: outlets = [], isLoading: outletsLoading } = useOutlets();

  // Selected Outlet: '' means "Semua Cabang (Global PT)"
  const [selectedOutletId, setSelectedOutletId] = useState<string>('');

  // Auto-select outlet on load if not set
  useEffect(() => {
    if (!selectedOutletId && currentOutlet?.id) {
      setSelectedOutletId(currentOutlet.id);
    }
  }, [currentOutlet, selectedOutletId]);

  const activeOutlet = outlets.find((o) => o.id === selectedOutletId);

  // Queries
  const {
    data: discounts = [],
    isLoading: discountsLoading,
    error,
  } = useDiscounts(selectedOutletId ? { outletId: selectedOutletId } : undefined);

  const { data: products = [] } = useProducts();

  // Mutations
  const createDiscountMutation = useCreateDiscountMutation();
  const updateDiscountMutation = useUpdateDiscountMutation();
  const deleteDiscountMutation = useDeleteDiscountMutation();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<DiscountItem | null>(null);
  const [deletingDiscount, setDeletingDiscount] = useState<DiscountItem | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    type: 'PERCENTAGE' as DiscountCalculationType,
    value: '10',
    validityType: 'ALWAYS_ACTIVE' as DiscountValidityType,
    recurringDays: [] as string[],
    startDate: '',
    endDate: '',
    minOrderAmount: '0',
    maxDiscountAmount: '',
    applicableScope: 'ALL_PRODUCTS' as DiscountScope,
    productIds: [] as string[],
    status: 'ACTIVE' as DiscountStatus,
    scope: 'GLOBAL' as 'GLOBAL' | 'OUTLET',
    outletId: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleOpenAdd = () => {
    setEditingDiscount(null);
    setFormData({
      name: '',
      type: 'PERCENTAGE',
      value: '10',
      validityType: 'ALWAYS_ACTIVE',
      recurringDays: ['SATURDAY', 'SUNDAY'],
      startDate: '',
      endDate: '',
      minOrderAmount: '0',
      maxDiscountAmount: '',
      applicableScope: 'ALL_PRODUCTS',
      productIds: [],
      status: 'ACTIVE',
      scope: selectedOutletId ? 'OUTLET' : 'GLOBAL',
      outletId: selectedOutletId || (outlets[0]?.id || ''),
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEdit = (d: DiscountItem) => {
    setEditingDiscount(d);
    setFormData({
      name: d.name,
      type: d.type,
      value: d.value.toString(),
      validityType: d.validityType || 'ALWAYS_ACTIVE',
      recurringDays: d.recurringDays || [],
      startDate: d.startDate ? new Date(d.startDate).toISOString().slice(0, 10) : '',
      endDate: d.endDate ? new Date(d.endDate).toISOString().slice(0, 10) : '',
      minOrderAmount: d.minOrderAmount?.toString() || (d.minPurchase?.toString() || '0'),
      maxDiscountAmount: d.maxDiscountAmount?.toString() || (d.maxDiscount?.toString() || ''),
      applicableScope: d.applicableScope || 'ALL_PRODUCTS',
      productIds: d.productIds || d.products?.map((p) => p.id) || [],
      status: d.status || (d.isActive ? 'ACTIVE' : 'INACTIVE'),
      scope: d.isGlobal || !d.outletId ? 'GLOBAL' : 'OUTLET',
      outletId: d.outletId || selectedOutletId || (outlets[0]?.id || ''),
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const toggleRecurringDay = (dayKey: string) => {
    setFormData((prev) => {
      const exists = prev.recurringDays.includes(dayKey);
      return {
        ...prev,
        recurringDays: exists
          ? prev.recurringDays.filter((d) => d !== dayKey)
          : [...prev.recurringDays, dayKey],
      };
    });
  };

  const toggleProductSelection = (productId: string) => {
    setFormData((prev) => {
      const exists = prev.productIds.includes(productId);
      return {
        ...prev,
        productIds: exists
          ? prev.productIds.filter((id) => id !== productId)
          : [...prev.productIds, productId],
      };
    });
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) {
      errors.name = 'Nama diskon wajib diisi';
    }
    const val = parseFloat(formData.value);
    if (isNaN(val) || val <= 0) {
      errors.value = 'Nilai diskon harus lebih dari 0';
    } else if (formData.type === 'PERCENTAGE' && val > 100) {
      errors.value = 'Diskon persentase tidak boleh lebih dari 100%';
    }

    if (formData.scope === 'OUTLET' && !formData.outletId) {
      errors.outletId = 'Silakan pilih cabang outlet';
    }

    if (formData.validityType === 'RECURRING_WEEKLY' && formData.recurringDays.length === 0) {
      errors.recurringDays = 'Pilih minimal satu hari berulang';
    }

    if (formData.validityType === 'DATE_RANGE') {
      if (!formData.startDate) {
        errors.startDate = 'Tanggal mulai wajib diisi';
      }
      if (!formData.endDate) {
        errors.endDate = 'Tanggal berakhir wajib diisi';
      }
      if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
        errors.endDate = 'Tanggal berakhir harus setelah tanggal mulai';
      }
    }

    if (formData.applicableScope === 'SPECIFIC_PRODUCTS' && formData.productIds.length === 0) {
      errors.productIds = 'Pilih minimal satu produk';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const valueNum = parseFloat(formData.value);
    const minOrderNum = parseFloat(formData.minOrderAmount) || 0;
    const maxDiscountNum = formData.maxDiscountAmount ? parseFloat(formData.maxDiscountAmount) : undefined;
    const isGlobalScope = formData.scope === 'GLOBAL';
    const targetOutletId = isGlobalScope ? undefined : formData.outletId;

    try {
      if (editingDiscount) {
        await updateDiscountMutation.mutateAsync({
          id: editingDiscount.id,
          data: {
            name: formData.name.trim(),
            type: formData.type,
            value: valueNum,
            validityType: formData.validityType,
            recurringDays: formData.validityType === 'RECURRING_WEEKLY' ? formData.recurringDays : null,
            startDate: formData.validityType === 'DATE_RANGE' && formData.startDate ? new Date(formData.startDate).toISOString() : null,
            endDate: formData.validityType === 'DATE_RANGE' && formData.endDate ? new Date(formData.endDate).toISOString() : null,
            minOrderAmount: minOrderNum,
            maxDiscountAmount: formData.type === 'PERCENTAGE' ? maxDiscountNum : null,
            applicableScope: formData.applicableScope,
            productIds: formData.applicableScope === 'SPECIFIC_PRODUCTS' ? formData.productIds : [],
            status: formData.status,
            isGlobal: isGlobalScope,
            outletId: isGlobalScope ? null : targetOutletId,
          },
        });
        showToast('Diskon berhasil diperbarui');
      } else {
        await createDiscountMutation.mutateAsync({
          name: formData.name.trim(),
          type: formData.type,
          value: valueNum,
          validityType: formData.validityType,
          recurringDays: formData.validityType === 'RECURRING_WEEKLY' ? formData.recurringDays : undefined,
          startDate: formData.validityType === 'DATE_RANGE' && formData.startDate ? new Date(formData.startDate).toISOString() : undefined,
          endDate: formData.validityType === 'DATE_RANGE' && formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
          minOrderAmount: minOrderNum,
          maxDiscountAmount: formData.type === 'PERCENTAGE' ? maxDiscountNum : undefined,
          applicableScope: formData.applicableScope,
          productIds: formData.applicableScope === 'SPECIFIC_PRODUCTS' ? formData.productIds : undefined,
          status: formData.status,
          isGlobal: isGlobalScope,
          outletId: targetOutletId,
        });
        showToast('Diskon baru berhasil ditambahkan');
      }
      setIsModalOpen(false);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      showToast(
        error.response?.data?.message || error.message || 'Terjadi kesalahan saat menyimpan diskon',
        'error'
      );
    }
  };

  const handleDelete = async () => {
    if (!deletingDiscount) return;
    try {
      await deleteDiscountMutation.mutateAsync(deletingDiscount.id);
      showToast(`Diskon "${deletingDiscount.name}" berhasil dihapus`);
      setDeletingDiscount(null);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      showToast(
        error.response?.data?.message || error.message || 'Gagal menghapus diskon',
        'error'
      );
    }
  };

  // Helper formatting validity column
  const renderValidity = (d: DiscountItem) => {
    const validityType = d.validityType || 'ALWAYS_ACTIVE';

    if (validityType === 'ALWAYS_ACTIVE') {
      return (
        <div>
          <div className="font-semibold text-slate-900 text-xs">Always Active</div>
          <div className="text-[11px] text-slate-400 mt-0.5">No end date</div>
        </div>
      );
    }

    if (validityType === 'RECURRING_WEEKLY') {
      const days = d.recurringDays || [];
      let label = 'Weekly';
      if (days.includes('SATURDAY') && days.includes('SUNDAY') && days.length === 2) {
        label = 'Sabtu - Minggu';
      } else if (
        days.length === 5 &&
        ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'].every((k) => days.includes(k))
      ) {
        label = 'Senin - Jumat';
      } else if (days.length > 0) {
        label = days
          .map((k) => {
            const found = DAYS_OF_WEEK.find((item) => item.key === k);
            return found ? found.label : k;
          })
          .join(', ');
      }

      return (
        <div>
          <div className="font-semibold text-slate-900 text-xs">{label}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Berulang mingguan</div>
        </div>
      );
    }

    if (validityType === 'DATE_RANGE') {
      const startStr = d.startDate
        ? new Date(d.startDate).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })
        : '-';
      const endStr = d.endDate
        ? new Date(d.endDate).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })
        : '-';

      const isExpired = d.endDate && new Date(d.endDate) < new Date();

      return (
        <div>
          <div className="font-semibold text-slate-900 text-xs">
            {startStr} - {endStr}
          </div>
          <div
            className={`text-[11px] font-medium mt-0.5 ${
              isExpired ? 'text-red-500' : 'text-emerald-600'
            }`}
          >
            {isExpired ? 'Kedaluwarsa' : 'Periode Aktif'}
          </div>
        </div>
      );
    }

    return <span className="text-slate-400 text-xs">-</span>;
  };

  // Filtered discounts
  const filteredDiscounts = discounts.filter((d) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      d.name.toLowerCase().includes(q) ||
      (d.code && d.code.toLowerCase().includes(q));
    const isActive = d.status === 'ACTIVE' || d.isActive;
    const matchStatus =
      statusFilter === 'ALL'
        ? true
        : statusFilter === 'ACTIVE'
        ? isActive
        : !isActive;
    return matchSearch && matchStatus;
  });

  const isSaving = createDiscountMutation.isPending || updateDiscountMutation.isPending;
  const isDeleting = deleteDiscountMutation.isPending;
  const isLoading = discountsLoading || outletsLoading;

  if (isLoading) {
    return (
      <div className="py-12">
        <LoadingState message="Memuat data diskon & promosi..." />
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
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Pengaturan Diskon</h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Multi-Outlet
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Kelola master diskon dan program promo harga per cabang outlet atau tingkat kebijakan PT.
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
            + Tambah Diskon
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Gagal memuat data diskon dari server. Silakan muat ulang halaman.</span>
        </div>
      )}

      {/* Main Table Card */}
      <Card className="border border-slate-200/90 shadow-sm overflow-hidden" padding="none">
        {/* Card Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Daftar Diskon {activeOutlet ? `— Cabang ${activeOutlet.name}` : '(Seluruh Cabang)'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {activeOutlet
                ? `Menampilkan diskon khusus outlet ${activeOutlet.name} dan diskon global PT.`
                : 'Menampilkan seluruh program promosi yang berlaku di semua cabang.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nama diskon atau promo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50/70 border border-slate-200 rounded-lg text-xs text-slate-700 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53] transition-all"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'ALL' | 'ACTIVE' | 'INACTIVE')}
              className="bg-slate-50/70 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53]"
            >
              <option value="ALL">Semua Status</option>
              <option value="ACTIVE">Aktif Saja</option>
              <option value="INACTIVE">Nonaktif Saja</option>
            </select>
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-5">NAMA & CAKUPAN</th>
                <th className="py-3.5 px-5">TIPE</th>
                <th className="py-3.5 px-5">NILAI DISKON</th>
                <th className="py-3.5 px-5">MASA BERLAKU</th>
                <th className="py-3.5 px-5">STATUS</th>
                <th className="py-3.5 px-5 text-right">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDiscounts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12">
                    <EmptyState
                      title={searchQuery ? 'Tidak ada diskon yang cocok' : 'Belum ada program diskon'}
                      description={
                        searchQuery
                          ? `Tidak ditemukan diskon dengan kata kunci "${searchQuery}".`
                          : 'Klik tombol "+ Tambah Diskon" untuk membuat program diskon atau promosi baru.'
                      }
                    />
                  </td>
                </tr>
              ) : (
                filteredDiscounts.map((discount) => {
                  const isActive = discount.status === 'ACTIVE' || discount.isActive;
                  const isGlobalDiscount = discount.isGlobal || !discount.outletId;
                  const outletName = discount.outlet?.name || outlets.find((o) => o.id === discount.outletId)?.name;

                  return (
                    <tr
                      key={discount.id}
                      className="hover:bg-slate-50/70 transition-colors group"
                    >
                      {/* Name & Scope */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 text-sm">{discount.name}</span>
                          {/* Scope Badge */}
                          {isGlobalDiscount ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                              <Globe className="w-3 h-3" />
                              Global PT
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              <Store className="w-3 h-3" />
                              Cabang: {outletName || 'Khusus Cabang'}
                            </span>
                          )}
                        </div>
                        {discount.minOrderAmount > 0 && (
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            Min. order Rp{Number(discount.minOrderAmount).toLocaleString('id-ID')}
                          </div>
                        )}
                      </td>

                      {/* Type */}
                      <td className="py-4 px-5 text-slate-600 font-medium">
                        {discount.type === 'PERCENTAGE' ? 'Percentage' : 'Fixed Amount'}
                      </td>

                      {/* Value */}
                      <td className="py-4 px-5">
                        <span className="font-bold text-slate-900 text-base">
                          {discount.type === 'PERCENTAGE'
                            ? `${discount.value}%`
                            : `Rp${Number(discount.value).toLocaleString('id-ID')}`}
                        </span>
                      </td>

                      {/* Validity */}
                      <td className="py-4 px-5">{renderValidity(discount)}</td>

                      {/* Status */}
                      <td className="py-4 px-5">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-500 border border-slate-200'
                          }`}
                        >
                          {isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5 opacity-90 group-hover:opacity-100">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEdit(discount)}
                            leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                            className="text-xs text-slate-700 hover:text-[#0D5C53]"
                          >
                            Edit
                          </Button>
                          <button
                            onClick={() => setDeletingDiscount(discount)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Hapus Diskon"
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
      </Card>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingDiscount ? 'Edit Diskon' : 'Tambah Diskon Baru'}
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
          {/* Discount Name */}
          <FormInput
            label="Nama Diskon"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Contoh: Promo Member 10%, Weekend Sale, Launching Outlet"
            error={formErrors.name}
          />

          {/* Scope Selector: Global vs Outlet Specific */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Cakupan Penerapan Diskon <span className="text-red-500">*</span>
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
                  Berlaku umum untuk transaksi di semua cabang outlet PT.
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
                  Hanya berlaku khusus pada outlet yang dipilih.
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

          {/* Discount Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Tipe Diskon <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'PERCENTAGE' })}
                className={`p-3 rounded-xl border text-left transition-all ${
                  formData.type === 'PERCENTAGE'
                    ? 'border-[#0D5C53] bg-teal-50/50 ring-1 ring-[#0D5C53]'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Percent className="w-4 h-4 text-[#0D5C53]" />
                    <span className="text-xs font-bold text-slate-900">Persentase (%)</span>
                  </div>
                  {formData.type === 'PERCENTAGE' && (
                    <Check className="w-4 h-4 text-[#0D5C53]" />
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Potongan harga berdasarkan persentase total belanja.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'FIXED' })}
                className={`p-3 rounded-xl border text-left transition-all ${
                  formData.type === 'FIXED'
                    ? 'border-[#0D5C53] bg-teal-50/50 ring-1 ring-[#0D5C53]'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-[#0D5C53]" />
                    <span className="text-xs font-bold text-slate-900">Nominal Tetap (Rp)</span>
                  </div>
                  {formData.type === 'FIXED' && (
                    <Check className="w-4 h-4 text-[#0D5C53]" />
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Potongan nominal langsung dalam rupiah (Rp).
                </p>
              </button>
            </div>
          </div>

          {/* Value & Maximum Discount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormInput
              label={`Nilai Diskon (${formData.type === 'PERCENTAGE' ? '%' : 'Rp'})`}
              type="number"
              min="0"
              step="any"
              unit={formData.type === 'PERCENTAGE' ? '%' : 'Rp'}
              required
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              placeholder={formData.type === 'PERCENTAGE' ? '10' : '10000'}
              error={formErrors.value}
            />

            {formData.type === 'PERCENTAGE' ? (
              <FormInput
                label="Batas Maksimal Diskon (Rp - Opsional)"
                type="number"
                min="0"
                unit="Rp"
                value={formData.maxDiscountAmount}
                onChange={(e) => setFormData({ ...formData, maxDiscountAmount: e.target.value })}
                placeholder="Contoh: 50000 (Kosongkan jika tanpa batas)"
              />
            ) : (
              <FormInput
                label="Minimal Belanja Order (Rp)"
                type="number"
                min="0"
                unit="Rp"
                value={formData.minOrderAmount}
                onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                placeholder="0"
              />
            )}
          </div>

          {formData.type === 'PERCENTAGE' && (
            <FormInput
              label="Minimal Belanja Order (Rp)"
              type="number"
              min="0"
              unit="Rp"
              value={formData.minOrderAmount}
              onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
              placeholder="0"
            />
          )}

          {/* Validity Type */}
          <div className="pt-2 border-t border-slate-100">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Aturan Masa Berlaku <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, validityType: 'ALWAYS_ACTIVE' })}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  formData.validityType === 'ALWAYS_ACTIVE'
                    ? 'border-[#0D5C53] bg-teal-50/50 text-[#0D5C53] font-bold'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                <InfinityIcon className="w-4 h-4 mx-auto mb-1 opacity-80" />
                <span className="text-xs">Always Active</span>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, validityType: 'RECURRING_WEEKLY' })}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  formData.validityType === 'RECURRING_WEEKLY'
                    ? 'border-[#0D5C53] bg-teal-50/50 text-[#0D5C53] font-bold'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                <Clock className="w-4 h-4 mx-auto mb-1 opacity-80" />
                <span className="text-xs">Berulang Mingguan</span>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, validityType: 'DATE_RANGE' })}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  formData.validityType === 'DATE_RANGE'
                    ? 'border-[#0D5C53] bg-teal-50/50 text-[#0D5C53] font-bold'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                <Calendar className="w-4 h-4 mx-auto mb-1 opacity-80" />
                <span className="text-xs">Rentang Tanggal</span>
              </button>
            </div>

            {/* Sub-config for RECURRING_WEEKLY */}
            {formData.validityType === 'RECURRING_WEEKLY' && (
              <div className="mt-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                <label className="block text-[11px] font-semibold text-slate-700">
                  Pilih Hari Berlaku:
                </label>
                <div className="flex flex-wrap gap-2">
                  {DAYS_OF_WEEK.map((day) => {
                    const selected = formData.recurringDays.includes(day.key);
                    return (
                      <button
                        key={day.key}
                        type="button"
                        onClick={() => toggleRecurringDay(day.key)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          selected
                            ? 'bg-[#0D5C53] text-white shadow-xs'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {day.label} ({day.full})
                      </button>
                    );
                  })}
                </div>
                {formErrors.recurringDays && (
                  <p className="text-[11px] text-red-500">{formErrors.recurringDays}</p>
                )}
              </div>
            )}

            {/* Sub-config for DATE_RANGE */}
            {formData.validityType === 'DATE_RANGE' && (
              <div className="mt-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormInput
                  label="Tanggal Mulai"
                  type="date"
                  required
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  error={formErrors.startDate}
                />
                <FormInput
                  label="Tanggal Berakhir"
                  type="date"
                  required
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  error={formErrors.endDate}
                />
              </div>
            )}
          </div>

          {/* Applicable Scope */}
          <div className="pt-2 border-t border-slate-100">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Cakupan Produk
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, applicableScope: 'ALL_PRODUCTS' })}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  formData.applicableScope === 'ALL_PRODUCTS'
                    ? 'border-[#0D5C53] bg-teal-50/50 text-[#0D5C53] font-bold'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                <span className="text-xs">Semua Produk</span>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, applicableScope: 'SPECIFIC_PRODUCTS' })}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  formData.applicableScope === 'SPECIFIC_PRODUCTS'
                    ? 'border-[#0D5C53] bg-teal-50/50 text-[#0D5C53] font-bold'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                <span className="text-xs">Produk Tertentu</span>
              </button>
            </div>

            {formData.applicableScope === 'SPECIFIC_PRODUCTS' && (
              <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200 max-h-40 overflow-y-auto space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Centang produk yang memenuhi syarat diskon:
                </span>
                {products.length === 0 ? (
                  <p className="text-xs text-slate-400">Tidak ada produk tersedia di cabang ini.</p>
                ) : (
                  products.map((prod) => (
                    <label
                      key={prod.id}
                      className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white text-xs text-slate-800 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.productIds.includes(prod.id)}
                        onChange={() => toggleProductSelection(prod.id)}
                        className="rounded text-[#0D5C53] focus:ring-[#0D5C53]"
                      />
                      <span>{prod.name}</span>
                      <span className="text-slate-400 ml-auto">
                        Rp{Number(prod.price || 0).toLocaleString('id-ID')}
                      </span>
                    </label>
                  ))
                )}
                {formErrors.productIds && (
                  <p className="text-[11px] text-red-500">{formErrors.productIds}</p>
                )}
              </div>
            )}
          </div>

          {/* Status Toggle */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between p-3 rounded-xl bg-slate-50/70 border border-slate-200/70">
            <div>
              <span className="text-xs font-semibold text-slate-900">Status Aktif</span>
              <p className="text-[11px] text-slate-500">Diskon aktif dapat diterapkan pada kasir POS.</p>
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

          {/* Modal Actions */}
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
              {isSaving ? 'Menyimpan...' : editingDiscount ? 'Perbarui Diskon' : 'Simpan Diskon'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deletingDiscount)}
        onClose={() => setDeletingDiscount(null)}
        title="Hapus Master Diskon"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-red-50 text-red-800 text-xs">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <div>
              <p className="font-semibold">Tindakan ini tidak dapat dibatalkan.</p>
              <p className="mt-0.5 text-red-700">
                Apakah Anda yakin ingin menghapus program diskon <strong>"{deletingDiscount?.name}"</strong>?
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeletingDiscount(null)}
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
              {isDeleting ? 'Menghapus...' : 'Ya, Hapus Diskon'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
