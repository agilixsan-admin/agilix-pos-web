import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  SlidersHorizontal,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Layers,
  Boxes,
  UploadCloud,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  FileText,
  Image as ImageIcon,
  User,
  Clock,
  ArrowRight,
  Plus,
  Store,
} from 'lucide-react';
import { useAuthStore } from '@domain/state/auth-store';
import {
  useRawMaterials,
  usePackagingItems,
  useReasonCategories,
  useCreateReasonCategoryMutation,
  useCreateStockAdjustmentMutation,
  useUploadAdjustmentProofMutation,
  useOutlets,
} from '@domain/hooks';
import type { RawMaterial, PackagingItem, ReasonCategory } from '@model/Inventory';
import {
  Card,
  Badge,
  Button,
  FormInput,
  FormSelect,
  FormTextarea,
  Modal,
  CustomSelect,
  toast,
  confirmDialog,
} from '@presentation/components/ui';

export const AdjustmentCreateScreen: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentOutlet = useAuthStore((state) => state.currentOutlet);
  const user = useAuthStore((state) => state.user);
  const { data: outlets = [] } = useOutlets();

  // Multi-Outlet Scoping
  const queryOutletId = searchParams.get('outletId');
  const [selectedOutletId, setSelectedOutletId] = useState<string>(queryOutletId || '');

  useEffect(() => {
    if (!selectedOutletId && (currentOutlet?.id || outlets[0]?.id)) {
      setSelectedOutletId(currentOutlet?.id || outlets[0]?.id || '');
    }
  }, [currentOutlet, outlets, selectedOutletId]);

  const effectiveOutletId =
    selectedOutletId ||
    currentOutlet?.id ||
    (outlets.length > 0 ? outlets[0].id : '');
  const activeOutlet =
    outlets.find((o) => o.id === effectiveOutletId) || currentOutlet;
  const activeBranchName = activeOutlet?.name || 'Cabang Utama';

  // Step state: 1 = Form & Live Preview, 2 = Review & Confirm
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  // Queries (Scoped to effectiveOutletId)
  const { data: rawMaterials = [] } = useRawMaterials({ outletId: effectiveOutletId });
  const { data: packagingItems = [] } = usePackagingItems({ outletId: effectiveOutletId });
  const { data: reasonCategories = [] } = useReasonCategories();

  // Mutations
  const createAdjustmentMutation = useCreateStockAdjustmentMutation();
  const createReasonMutation = useCreateReasonCategoryMutation();
  const uploadProofMutation = useUploadAdjustmentProofMutation();

  // Form State
  const [adjustmentDate, setAdjustmentDate] = useState<string>(() => {
    const now = new Date();
    // Local ISO format: YYYY-MM-DDTHH:mm
    const tzOffset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - tzOffset).toISOString().slice(0, 16);
  });
  const [adjustmentType, setAdjustmentType] = useState<'IN' | 'OUT'>('OUT');
  const [itemCategoryType, setItemCategoryType] = useState<'ALL' | 'RAW_MATERIAL' | 'PACKAGING'>('ALL');
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [reasonCategoryId, setReasonCategoryId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imagePreview, setImagePreview] = useState<string>('');
  const [formError, setFormError] = useState<string>('');

  // Add New Reason Modal
  const [isAddReasonModalOpen, setIsAddReasonModalOpen] = useState(false);
  const [newReasonName, setNewReasonName] = useState('');
  const [newReasonType, setNewReasonType] = useState<'IN' | 'OUT' | 'BOTH'>('BOTH');

  // Combined item list
  const allItems = useMemo(() => {
    const items: Array<{
      id: string;
      name: string;
      sku?: string | null;
      unit: string;
      itemType: 'RAW_MATERIAL' | 'PACKAGING';
      currentStock: number;
      unitCost?: number;
      categoryName?: string;
    }> = [];

    const getCatName = (cat: unknown): string | undefined => {
      if (!cat) return undefined;
      if (typeof cat === 'string') return cat;
      if (typeof cat === 'object' && 'name' in (cat as Record<string, unknown>)) {
        return String((cat as Record<string, unknown>).name);
      }
      return undefined;
    };

    rawMaterials.forEach((m) => {
      items.push({
        id: m.id,
        name: m.name,
        sku: m.sku,
        unit: m.unit || 'unit',
        itemType: 'RAW_MATERIAL',
        currentStock: Number(m.currentStock || 0),
        unitCost: Number(m.unitCost || 0),
        categoryName: getCatName(m.category),
      });
    });

    packagingItems.forEach((p) => {
      items.push({
        id: p.id,
        name: p.name,
        sku: p.sku,
        unit: p.unit || 'pcs',
        itemType: 'PACKAGING',
        currentStock: Number(p.currentStock || 0),
        unitCost: Number(p.unitCost || 0),
        categoryName: getCatName(p.category),
      });
    });

    return items;
  }, [rawMaterials, packagingItems]);

  // Filtered item list for selector
  const filteredItems = useMemo(() => {
    if (itemCategoryType === 'ALL') return allItems;
    return allItems.filter((i) => i.itemType === itemCategoryType);
  }, [allItems, itemCategoryType]);

  // Selected Item Object
  const selectedItem = useMemo(() => {
    return allItems.find((i) => i.id === selectedItemId);
  }, [allItems, selectedItemId]);

  // Filtered Reasons for current type
  const availableReasons = useMemo(() => {
    return reasonCategories.filter(
      (r) => r.type === 'BOTH' || r.type === adjustmentType
    );
  }, [reasonCategories, adjustmentType]);

  // Calculations
  const systemStock = selectedItem ? Number(selectedItem.currentStock || 0) : 0;
  const adjQty = Math.max(0, Number(quantity) || 0);
  const calculatedEndStock =
    adjustmentType === 'IN' ? systemStock + adjQty : Math.max(0, systemStock - adjQty);
  const selectedReason = reasonCategories.find((r) => r.id === reasonCategoryId);

  // File Upload Handler
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show local preview
    setImagePreview(URL.createObjectURL(file));

    try {
      const res = await uploadProofMutation.mutateAsync(file);
      if (res?.imageUrl) {
        setImageUrl(res.imageUrl);
      }
    } catch (err) {
      console.warn('Proof upload to server skipped/failed, using local preview', err);
    }
  };

  // Create New Reason Category
  const handleCreateReason = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReasonName.trim()) return;

    try {
      const newReason = await createReasonMutation.mutateAsync({
        name: newReasonName.trim(),
        type: newReasonType,
      });
      toast.success('Kategori alasan berhasil ditambahkan.');
      setIsAddReasonModalOpen(false);
      setNewReasonName('');
      setReasonCategoryId(newReason.id);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menambahkan kategori alasan');
    }
  };

  // Validate & Proceed to Review Step
  const handleProceedToReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!selectedItemId || !selectedItem) {
      setFormError('Silakan pilih bahan baku atau packaging yang akan disesuaikan.');
      return;
    }

    if (!quantity || Number(quantity) <= 0) {
      setFormError('Jumlah penyesuaian harus lebih besar dari 0.');
      return;
    }

    if (adjustmentType === 'OUT' && adjQty > systemStock) {
      // Warning for negative stock
      const proceed = await confirmDialog({
        title: 'Peringatan Stok Negatif',
        message: `Pengurangan stok (${adjQty} ${selectedItem.unit}) melebihi stok sistem saat ini (${systemStock} ${selectedItem.unit}). Lanjutkan?`,
        confirmText: 'Lanjutkan',
        variant: 'danger',
      });
      if (!proceed) {
        return;
      }
    }

    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Final Submit
  const handleConfirmAdjustment = async () => {
    if (!selectedItemId || !effectiveOutletId) {
      setFormError('Outlet atau item tidak valid.');
      return;
    }

    try {
      setFormError('');
      const payload = {
        outletId: effectiveOutletId,
        inventoryItemId: selectedItemId,
        type: adjustmentType,
        quantity: adjQty,
        adjustmentDate: new Date(adjustmentDate).toISOString(),
        reasonCategoryId: reasonCategoryId || undefined,
        notes: notes.trim() || undefined,
        imageUrl: imageUrl || undefined,
        source: 'MANUAL' as const,
      };

      const result = await createAdjustmentMutation.mutateAsync(payload);
      navigate(`/inventory/adjustments/${result.id}?outletId=${effectiveOutletId}`);
    } catch (err: any) {
      setFormError(
        err?.response?.data?.message || err?.message || 'Gagal menyimpan penyesuaian stok'
      );
    }
  };

  // Format Date for Review
  const formatDisplayDate = (dt: string) => {
    try {
      const d = new Date(dt);
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dt;
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-20">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (currentStep === 2) {
                setCurrentStep(1);
              } else {
                navigate(`/inventory/adjustments?outletId=${effectiveOutletId}`);
              }
            }}
            className="p-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-slate-600 transition-colors shadow-xs cursor-pointer"
            title="Kembali"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Link to={`/inventory/adjustments?outletId=${effectiveOutletId}`} className="hover:text-[#0D5C53]">
                Stock Adjustment
              </Link>
              <span>/</span>
              <span className="text-slate-800 font-semibold">
                {currentStep === 1 ? 'Buat Adjustment' : 'Review Adjustment'}
              </span>
            </div>
            <div className="flex items-center gap-2.5 mt-0.5">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                {currentStep === 1 ? 'Buat Adjustment' : 'Review Stock Adjustment'}
              </h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {activeBranchName}
              </span>
            </div>
          </div>
        </div>

        {/* Branch Switcher Dropdown (Available in Step 1) */}
        {currentStep === 1 && (
          <div className="flex items-center gap-2">
            <CustomSelect
              ariaLabel="Cabang Target"
              icon={<Store className="w-4 h-4 text-[#0D5C53]" />}
              value={effectiveOutletId}
              onChange={(val) => {
                setSelectedOutletId(val);
                setSearchParams({ outletId: val });
                setSelectedItemId('');
              }}
              options={outlets.map((outlet) => ({
                value: outlet.id,
                label: outlet.name,
              }))}
              buttonClassName="bg-slate-50 border-slate-200 text-xs py-2 px-3 rounded-xl font-semibold"
            />
          </div>
        )}
      </div>

      {/* Stepper Wizard Indicator */}
      <div className="flex items-center justify-center max-w-md mx-auto py-1">
        <div className="flex items-center w-full">
          {/* Step 1 Indicator */}
          <div className="flex flex-col items-center relative flex-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                currentStep >= 1
                  ? 'bg-[#0D5C53] text-white ring-4 ring-[#0D5C53]/20'
                  : 'bg-slate-100 text-slate-400'
              }`}
            >
              {currentStep > 1 ? <CheckCircle2 className="w-4 h-4" /> : '1'}
            </div>
            <span className="text-[11px] font-semibold text-slate-800 mt-1.5">Informasi</span>
          </div>

          <div
            className={`h-0.5 w-full -mt-4 transition-all ${
              currentStep === 2 ? 'bg-[#0D5C53]' : 'bg-slate-200'
            }`}
          />

          {/* Step 2 Indicator */}
          <div className="flex flex-col items-center relative flex-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                currentStep === 2
                  ? 'bg-[#0D5C53] text-white ring-4 ring-[#0D5C53]/20'
                  : 'bg-slate-100 text-slate-400'
              }`}
            >
              2
            </div>
            <span className="text-[11px] font-semibold text-slate-800 mt-1.5">Review</span>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {formError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 1: CREATE & LIVE PREVIEW (Matching Figma Screen 1)                    */}
      {/* ========================================================================= */}
      {currentStep === 1 && (
        <form onSubmit={handleProceedToReview} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Form Column */}
          <div className="lg:col-span-8 space-y-6">
            {/* 1. Informasi Dasar */}
            <Card header={<h3 className="text-sm font-bold text-slate-900">1. Informasi Dasar</h3>}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <FormInput
                    type="datetime-local"
                    label="Tanggal & Waktu Adjustment"
                    required
                    value={adjustmentDate}
                    onChange={(e) => setAdjustmentDate(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jenis Adjustment <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setAdjustmentType('IN')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        adjustmentType === 'IN'
                          ? 'border-emerald-600 bg-emerald-50/80 text-emerald-800 shadow-xs ring-1 ring-emerald-500'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                      Masuk (IN / +)
                    </button>

                    <button
                      type="button"
                      onClick={() => setAdjustmentType('OUT')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        adjustmentType === 'OUT'
                          ? 'border-rose-600 bg-rose-50/80 text-rose-800 shadow-xs ring-1 ring-rose-500'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <ArrowDownLeft className="w-4 h-4 text-rose-600" />
                      Keluar (OUT / -)
                    </button>
                  </div>
                </div>
              </div>
            </Card>

            {/* 2. Pilih Item */}
            <Card header={<h3 className="text-sm font-bold text-slate-900">2. Pilih Item</h3>}>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-1">
                    <FormSelect
                      label="Filter Tipe Item"
                      value={itemCategoryType}
                      onChange={(e) => {
                        setItemCategoryType(e.target.value as any);
                        setSelectedItemId('');
                      }}
                    >
                      <option value="ALL">Semua Jenis</option>
                      <option value="RAW_MATERIAL">Bahan Baku</option>
                      <option value="PACKAGING">Packaging</option>
                    </FormSelect>
                  </div>

                  <div className="sm:col-span-2">
                    <FormSelect
                      label="Pilih Bahan Baku / Packaging"
                      required
                      value={selectedItemId}
                      onChange={(e) => setSelectedItemId(e.target.value)}
                    >
                      <option value="">-- Pilih Item --</option>
                      {filteredItems.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} {item.sku ? `(${item.sku})` : ''} — Stok: {item.currentStock}{' '}
                          {item.unit}
                        </option>
                      ))}
                    </FormSelect>
                  </div>
                </div>

                {/* Selected Item Stock Banner */}
                {selectedItem && (
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-slate-500 block">Stok Sistem Saat Ini</span>
                      <span className="font-mono font-bold text-slate-900 text-sm mt-0.5 block">
                        {systemStock.toLocaleString('id-ID')} {selectedItem.unit}
                      </span>
                    </div>
                    <div className="text-right">
                      <Badge variant={selectedItem.itemType === 'PACKAGING' ? 'info' : 'neutral'}>
                        {selectedItem.itemType === 'PACKAGING' ? 'Packaging' : 'Bahan Baku'}
                      </Badge>
                      {selectedItem.categoryName && (
                        <span className="text-[11px] text-slate-500 block mt-1">
                          {selectedItem.categoryName}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Upload Bukti / Foto */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Upload Bukti / Foto Fisik (Opsional)
                  </label>
                  <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer text-center">
                    {imagePreview ? (
                      <div className="relative group">
                        <img
                          src={imagePreview}
                          alt="Bukti adjustment"
                          className="max-h-36 rounded-lg object-contain border border-slate-200"
                        />
                        <span className="text-[11px] text-[#0D5C53] font-semibold mt-2 block group-hover:underline">
                          Ganti Foto
                        </span>
                      </div>
                    ) : (
                      <>
                        <UploadCloud className="w-8 h-8 text-slate-400 mb-1.5" />
                        <span className="text-xs font-semibold text-slate-700">
                          Klik untuk upload foto bukti fisik
                        </span>
                        <span className="text-[11px] text-slate-400 mt-0.5">
                          Format JPG, PNG (Maks 5MB)
                        </span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </Card>

            {/* 3. Detail Perubahan */}
            <Card header={<h3 className="text-sm font-bold text-slate-900">3. Detail Perubahan</h3>}>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <FormInput
                      label="Jumlah Adjustment"
                      type="number"
                      min="0.001"
                      step="any"
                      required
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder="0"
                      unit={selectedItem?.unit || 'unit'}
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-700">
                        Alasan Adjustment
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsAddReasonModalOpen(true)}
                        className="text-[11px] text-[#0D5C53] font-semibold hover:underline flex items-center gap-0.5 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" /> Tambah Alasan
                      </button>
                    </div>
                    <FormSelect
                      value={reasonCategoryId}
                      onChange={(e) => setReasonCategoryId(e.target.value)}
                    >
                      <option value="">-- Pilih Alasan --</option>
                      {availableReasons.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </FormSelect>
                  </div>
                </div>

                <div>
                  <FormTextarea
                    label="Catatan (Opsional)"
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Tambahkan keterangan rinci mengenai alasan penyesuaian stok ini..."
                  />
                </div>
              </div>
            </Card>
          </div>

          {/* Right Live Preview Column (Matching Figma Screen 1) */}
          <div className="lg:col-span-4 space-y-4">
            <Card
              header={
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#0D5C53] animate-pulse" />
                  <h3 className="text-sm font-bold text-slate-900">Live Preview</h3>
                </div>
              }
              className="sticky top-6"
            >
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Stok Sistem</span>
                  <span className="font-mono font-bold text-slate-800">
                    {systemStock.toLocaleString('id-ID')} {selectedItem?.unit || 'unit'}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Adjustment</span>
                  <span
                    className={`font-mono font-bold ${
                      adjustmentType === 'IN' ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {adjustmentType === 'IN' ? `+ ${adjQty}` : `- ${adjQty}`}{' '}
                    {selectedItem?.unit || 'unit'}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 mt-2">
                  <span className="text-slate-500 block text-[11px] font-medium">
                    Estimasi Stok Akhir
                  </span>
                  <span className="font-mono font-bold text-xl text-slate-900 block mt-1">
                    {calculatedEndStock.toLocaleString('id-ID')} {selectedItem?.unit || 'unit'}
                  </span>
                </div>

                {/* Submit button */}
                <div className="pt-3 space-y-2">
                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full justify-center"
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Review Adjustment
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-center"
                    onClick={() => navigate('/inventory/adjustments')}
                  >
                    Batal
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: REVIEW STOCK ADJUSTMENT (Matching Figma Screen 2)                  */}
      {/* ========================================================================= */}
      {currentStep === 2 && selectedItem && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Review Column */}
          <div className="lg:col-span-8 space-y-6">
            {/* Adjustment Summary */}
            <Card header={<h3 className="text-sm font-bold text-slate-900">Adjustment Summary</h3>}>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400 block font-medium">ITEM NAME</span>
                    <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                      {selectedItem.name}
                    </span>
                    {selectedItem.sku && (
                      <span className="font-mono text-slate-500 text-[11px] block mt-0.5">
                        SKU: {selectedItem.sku}
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="text-slate-400 block font-medium">REASON</span>
                    <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                      {selectedReason?.name || 'Manual Adjustment'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[11px] font-semibold text-slate-500 block uppercase tracking-wider">
                      Adjustment Value
                    </span>
                    <span
                      className={`font-mono font-bold text-xl block mt-1 ${
                        adjustmentType === 'IN' ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {adjustmentType === 'IN' ? `+ ${adjQty}` : `- ${adjQty}`}{' '}
                      <span className="text-xs text-slate-500 font-normal">{selectedItem.unit}</span>
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[11px] font-semibold text-slate-500 block uppercase tracking-wider">
                      Stok Akhir Sistem
                    </span>
                    <span className="font-mono font-bold text-xl text-slate-900 block mt-1">
                      {calculatedEndStock.toLocaleString('id-ID')}{' '}
                      <span className="text-xs text-slate-500 font-normal">{selectedItem.unit}</span>
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Metadata Verification */}
            <Card
              header={<h3 className="text-sm font-bold text-slate-900">Metadata Verification</h3>}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <span className="text-slate-400 block font-medium">WAKTU ADJUSTMENT</span>
                  <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {formatDisplayDate(adjustmentDate)}
                  </div>
                  <span className="text-[11px] text-slate-400 block">Manual Entry</span>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-400 block font-medium">ADJUSTMENT TYPE</span>
                  <div className="flex items-center gap-2">
                    <Badge variant={adjustmentType === 'IN' ? 'success' : 'danger'} dot>
                      {adjustmentType === 'IN' ? 'Masuk (IN)' : 'Keluar (OUT)'}
                    </Badge>
                  </div>
                  <div className="text-slate-600 flex items-center gap-1.5 mt-1">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Dibuat Oleh: <strong>{user?.name || 'Administrator'}</strong></span>
                  </div>
                </div>

                <div className="sm:col-span-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-slate-400 font-medium">CABANG OUTLET TARGET</span>
                  <span className="font-semibold text-emerald-700 flex items-center gap-1">
                    <Store className="w-3.5 h-3.5" />
                    {activeBranchName}
                  </span>
                </div>

                {notes && (
                  <div className="sm:col-span-2 pt-2 border-t border-slate-100">
                    <span className="text-slate-400 block font-medium mb-1">CATATAN</span>
                    <p className="text-slate-700 italic bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      {notes}
                    </p>
                  </div>
                )}

                {imagePreview && (
                  <div className="sm:col-span-2 pt-2 border-t border-slate-100">
                    <span className="text-slate-400 block font-medium mb-1.5">BUKTI FISIK</span>
                    <img
                      src={imagePreview}
                      alt="Bukti penyesuaian"
                      className="max-h-48 rounded-xl object-contain border border-slate-200"
                    />
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Right Action & Warning Column */}
          <div className="lg:col-span-4 space-y-4">
            {/* Important Notice */}
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-rose-800">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Important Notice</span>
              </div>
              <p className="leading-relaxed text-rose-800">
                Setelah dikonfirmasi, penyesuaian stok tidak dapat diedit/dibatalkan dan mutasi stok
                akan langsung dicatat secara permanen ke kartu stok (<strong>Stock Movement</strong>).
              </p>
            </div>

            {/* Action Card */}
            <Card padding="md" className="space-y-3">
              <Button
                type="button"
                variant="primary"
                className="w-full justify-center"
                onClick={handleConfirmAdjustment}
                isLoading={createAdjustmentMutation.isPending}
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
              >
                Konfirmasi Adjustment
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full justify-center"
                disabled={createAdjustmentMutation.isPending}
                onClick={() => setCurrentStep(1)}
              >
                Kembali ke Edit
              </Button>
            </Card>
          </div>
        </div>
      )}

      {/* Add Reason Category Modal */}
      <Modal
        isOpen={isAddReasonModalOpen}
        onClose={() => setIsAddReasonModalOpen(false)}
        title="Tambah Kategori Alasan Adjustment"
        maxWidth="md"
      >
        <form onSubmit={handleCreateReason} className="space-y-4">
          <div>
            <FormInput
              label="Nama Alasan"
              required
              value={newReasonName}
              onChange={(e) => setNewReasonName(e.target.value)}
              placeholder="Contoh: Salah Hitung Kasir, Sampling Produk, Kadaluwarsa..."
            />
          </div>

          <div>
            <FormSelect
              label="Tipe Berlaku"
              value={newReasonType}
              onChange={(e) => setNewReasonType(e.target.value as any)}
            >
              <option value="BOTH">Berlaku untuk Masuk & Keluar (BOTH)</option>
              <option value="IN">Khusus Penambahan (IN)</option>
              <option value="OUT">Khusus Pengurangan (OUT)</option>
            </FormSelect>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddReasonModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={createReasonMutation.isPending}
            >
              Simpan Alasan
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

