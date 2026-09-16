import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { RawMaterial, PackagingItem } from '@model/Inventory';
import { productService } from '@domain/services/product-service';
import { useAuthStore } from '@domain/state/auth-store';
import {
  useCategories,
  useRawMaterials,
  usePackagingItems,
  useCreateProductMutation,
} from '@domain/hooks';
import {
  ArrowLeft,
  Check,
  ChevronRight,
  ChevronLeft,
  Plus,
  Trash2,
  Coffee,
  Wheat,
  Box,
  Sparkles,
  Loader2,
  Upload,
  Image as ImageIcon,
  X,
} from 'lucide-react';
import {
  Button,
  Badge,
  Card,
  FormInput,
  FormSelect,
  FormTextarea,
  LoadingState,
} from '@presentation/components/ui';

interface VariantFormItem {
  id: string;
  name: string;
  sku: string;
  price: number;
  costPrice: number;
  recipes: { materialId: string; materialName: string; quantity: number; unit: string; cost: number }[];
  packagings: { packagingId: string; packagingName: string; quantity: number; unit: string; cost: number }[];
}

const STEPS = [
  { step: 1, title: 'Informasi Dasar' },
  { step: 2, title: 'Varian Menu' },
  { step: 3, title: 'Resep Bahan (BOM)' },
  { step: 4, title: 'Packaging & Kemasan' },
  { step: 5, title: 'Penetapan Harga & HPP' },
  { step: 6, title: 'Review & Terbitkan' },
];

export const ProductCreateWizardScreen: React.FC = () => {
  const navigate = useNavigate();
  const currentOutlet = useAuthStore((state) => state.currentOutlet);

  // Query Hooks
  const { data: categories = [] } = useCategories();
  const { data: availableMaterials = [] } = useRawMaterials({ outletId: currentOutlet?.id });
  const { data: availablePackagings = [] } = usePackagingItems({ outletId: currentOutlet?.id });
  const createProductMutation = useCreateProductMutation();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Step 1: Basic Info
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Ukuran file maksimal adalah 5MB.');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  // Step 2: Has Variants toggle
  const [hasVariants, setHasVariants] = useState<boolean>(false);
  const [variants, setVariants] = useState<VariantFormItem[]>([
    {
      id: 'default',
      name: 'Standard / Regular',
      sku: '',
      price: 25000,
      costPrice: 0,
      recipes: [],
      packagings: [],
    },
  ]);

  // Active variant tab for Steps 3 & 4
  const [activeVariantId, setActiveVariantId] = useState<string>('default');

  // Set default category when categories load
  const selectedCatId = categoryId || (categories.length > 0 ? categories[0].id : '');

  // Variant Helpers
  const addVariant = () => {
    const newId = `var-${Date.now()}`;
    const newVariant: VariantFormItem = {
      id: newId,
      name: `Varian Baru`,
      sku: `${sku || 'SKU'}-${variants.length + 1}`,
      price: 25000,
      costPrice: 0,
      recipes: [],
      packagings: [],
    };
    setVariants([...variants, newVariant]);
    setActiveVariantId(newId);
  };

  const removeVariant = (id: string) => {
    if (variants.length <= 1) return;
    const remaining = variants.filter((v) => v.id !== id);
    setVariants(remaining);
    setActiveVariantId(remaining[0].id);
  };

  const updateVariantField = (id: string, field: keyof VariantFormItem, value: any) => {
    setVariants(variants.map((v) => (v.id === id ? { ...v, [field]: value } : v)));
  };

  // Recipe (BOM) Helpers
  const addRecipeItem = (material: RawMaterial) => {
    const costPerUnit = Number(material.unitCost ?? material.costPrice ?? 0);
    const defaultQty = 1;
    const current = variants.find((v) => v.id === activeVariantId);
    if (!current) return;

    if (current.recipes.some((r) => r.materialId === material.id)) return;

    const newItem = {
      materialId: material.id,
      materialName: material.name,
      quantity: defaultQty,
      unit: material.unit,
      cost: costPerUnit * defaultQty,
    };

    updateVariantField(activeVariantId, 'recipes', [...current.recipes, newItem]);
  };

  const updateRecipeQty = (materialId: string, qty: number) => {
    const current = variants.find((v) => v.id === activeVariantId);
    if (!current) return;

    const mat = availableMaterials.find((m) => m.id === materialId);
    const costPerUnit = Number(mat?.unitCost ?? mat?.costPrice ?? 0);

    const updated = current.recipes.map((r) =>
      r.materialId === materialId
        ? {
            ...r,
            quantity: qty,
            cost: costPerUnit * qty,
          }
        : r
    );
    updateVariantField(activeVariantId, 'recipes', updated);
  };

  const removeRecipeItem = (materialId: string) => {
    const current = variants.find((v) => v.id === activeVariantId);
    if (!current) return;
    updateVariantField(
      activeVariantId,
      'recipes',
      current.recipes.filter((r) => r.materialId !== materialId)
    );
  };

  // Packaging Helpers
  const addPackagingItem = (pkg: PackagingItem) => {
    const costPerUnit = Number(pkg.costPrice || 0);
    const current = variants.find((v) => v.id === activeVariantId);
    if (!current) return;

    if (current.packagings.some((p) => p.packagingId === pkg.id)) return;

    const newItem = {
      packagingId: pkg.id,
      packagingName: pkg.name,
      quantity: 1,
      unit: pkg.unit,
      cost: costPerUnit,
    };

    updateVariantField(activeVariantId, 'packagings', [...current.packagings, newItem]);
  };

  const updatePackagingQty = (packagingId: string, qty: number) => {
    const current = variants.find((v) => v.id === activeVariantId);
    if (!current) return;

    const pkg = availablePackagings.find((p) => p.id === packagingId);
    const costPerUnit = Number(pkg?.costPrice || 0);

    const updated = current.packagings.map((p) =>
      p.packagingId === packagingId
        ? {
            ...p,
            quantity: qty,
            cost: costPerUnit * qty,
          }
        : p
    );
    updateVariantField(activeVariantId, 'packagings', updated);
  };

  const removePackagingItem = (packagingId: string) => {
    const current = variants.find((v) => v.id === activeVariantId);
    if (!current) return;
    updateVariantField(
      activeVariantId,
      'packagings',
      current.packagings.filter((p) => p.packagingId !== packagingId)
    );
  };

  // COGS Calculation
  const calculateVariantCOGS = (variant: VariantFormItem) => {
    const recipeCost = variant.recipes.reduce((sum, r) => sum + r.cost, 0);
    const packCost = variant.packagings.reduce((sum, p) => sum + p.cost, 0);
    return recipeCost + packCost;
  };

  const calculateVariantMargin = (price: number, cogs: number) => {
    if (price <= 0) return { profit: 0, percentage: 0 };
    const profit = price - cogs;
    const percentage = Math.round((profit / price) * 100);
    return { profit, percentage };
  };

  // Final Submit
  const handlePublish = async () => {
    setSubmitting(true);
    try {
      const primaryVariant = variants[0];

      // Map variants to backend CreateVariantDto schema
      const formattedVariants = hasVariants
        ? variants.map((v) => ({
            name: v.name,
            sku: v.sku || `${sku}-${v.name}`,
            price: v.price,
            status: 'ACTIVE',
            recipes: v.recipes.length > 0
              ? v.recipes.map((r) => ({
                  inventoryItemId: r.materialId,
                  quantity: r.quantity,
                  unit: r.unit,
                }))
              : undefined,
          }))
        : undefined;

      const formattedRecipes = !hasVariants && primaryVariant.recipes.length > 0
        ? primaryVariant.recipes.map((r) => ({
            inventoryItemId: r.materialId,
            quantity: r.quantity,
            unit: r.unit,
          }))
        : undefined;

      const created = await createProductMutation.mutateAsync({
        name,
        sku: sku || undefined,
        categoryId: categoryId || undefined,
        description: description || undefined,
        price: primaryVariant.price,
        status: 'ACTIVE',
        recipes: formattedRecipes,
        variants: formattedVariants,
      });

      if (imageFile && created?.id) {
        try {
          await productService.uploadProductImage(created.id, imageFile);
        } catch (uploadErr) {
          console.error('Image upload failed:', uploadErr);
        }
      }

      navigate('/products');
    } catch (err: unknown) {
      alert((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Gagal menerbitkan produk.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 select-none">
      {/* Page Header with Back Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/products')}
            className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl transition-colors cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Tambah Produk Baru</h1>
          </div>
        </div>
      </div>

      {/* 6-Step Stepper Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs overflow-x-auto">
        <div className="flex items-center justify-between min-w-[720px] px-2">
          {STEPS.map((s, idx) => {
            const isCompleted = currentStep > s.step;
            const isActive = currentStep === s.step;
            return (
              <div key={s.step} className="flex items-center gap-2.5">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    isCompleted
                      ? 'bg-[#0D5C53] text-white'
                      : isActive
                      ? 'bg-[#0D5C53] text-white ring-4 ring-[#0D5C53]/15'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : s.step}
                </div>
                <div>
                  <span
                    className={`text-xs font-bold block leading-tight ${
                      isActive ? 'text-[#0D5C53]' : isCompleted ? 'text-slate-800' : 'text-slate-400'
                    }`}
                  >
                    {s.title}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">Langkah {s.step}</span>
                </div>
                {idx < STEPS.length - 1 && <div className="w-8 h-px bg-slate-200 mx-2" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Step Content Card */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-6 md:p-8 min-h-[460px] flex flex-col justify-between">
        <div>
          {/* STEP 1: Basic Information */}
          {currentStep === 1 && (
            <div className="max-w-xl mx-auto space-y-4">
              <h3 className="font-bold text-slate-900 text-base mb-4">Langkah 1: Informasi Dasar Produk</h3>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Produk *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Kopi Susu Aren Spesial"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kategori Menu *</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53]"
                  >
                    <option value="">
                      {categories.length === 0 ? '-- Belum ada kategori --' : '-- Pilih Kategori Menu --'}
                    </option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">SKU / Kode Induk</label>
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="Contoh: KPS-001"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Deskripsi Singkat</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Deskripsi cita rasa atau keunikan menu..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Foto Produk (Opsional)</label>
                {imagePreview ? (
                  <div className="flex items-center gap-4 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200">
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">{imageFile?.name || 'Foto Produk'}</p>
                      <p className="text-[11px] text-slate-500">
                        {imageFile ? `${(imageFile.size / 1024).toFixed(1)} KB` : 'Gambar terpilih'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                      title="Hapus foto"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-slate-200 hover:border-[#0D5C53]/50 hover:bg-emerald-50/20 rounded-2xl p-5 flex flex-col items-center justify-center cursor-pointer transition-colors group">
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/webp"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <div className="w-10 h-10 rounded-full bg-slate-100 group-hover:bg-[#0D5C53]/10 flex items-center justify-center text-slate-400 group-hover:text-[#0D5C53] mb-2 transition-colors">
                      <Upload className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-slate-700 group-hover:text-[#0D5C53]">
                      Klik untuk upload atau seret file gambar
                    </span>
                    <span className="text-[11px] text-slate-400 mt-0.5">PNG, JPG, WebP (Maks. 5MB)</span>
                  </label>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: Variant Setup */}
          {currentStep === 2 && (
            <div className="max-w-2xl mx-auto space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Langkah 2: Konfigurasi Varian Menu</h3>
                  <p className="text-xs text-slate-500">Pilih apakah produk memiliki varian ukuran, suhu, atau rasa.</p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="hasVariants"
                    checked={hasVariants}
                    onChange={(e) => {
                      setHasVariants(e.target.checked);
                      if (!e.target.checked) {
                        setVariants([
                          {
                            id: 'default',
                            name: 'Standard / Regular',
                            sku: sku || 'PRD-01',
                            price: 25000,
                            costPrice: 0,
                            recipes: [],
                            packagings: [],
                          },
                        ]);
                        setActiveVariantId('default');
                      }
                    }}
                    className="w-4 h-4 text-[#0D5C53] rounded"
                  />
                  <label htmlFor="hasVariants" className="text-xs font-bold text-slate-800 cursor-pointer">
                    Aktifkan Multi-Varian
                  </label>
                </div>
              </div>

              {hasVariants ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-700">Daftar Varian Produk:</span>
                    <button
                      type="button"
                      onClick={addVariant}
                      className="flex items-center gap-1 text-xs font-bold text-[#0D5C53] hover:underline cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Tambah Varian</span>
                    </button>
                  </div>

                  {variants.map((v, idx) => (
                    <div
                      key={v.id}
                      className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center gap-3"
                    >
                      <span className="w-7 h-7 rounded-full bg-white text-[#0D5C53] border border-slate-200 flex items-center justify-center font-bold text-xs">
                        {idx + 1}
                      </span>
                      <div className="flex-1 grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={v.name}
                          onChange={(e) => updateVariantField(v.id, 'name', e.target.value)}
                          placeholder="Nama Varian (cth: Large Ice)"
                          className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-semibold"
                        />
                        <input
                          type="text"
                          value={v.sku}
                          onChange={(e) => updateVariantField(v.id, 'sku', e.target.value)}
                          placeholder="SKU Varian"
                          className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-mono"
                        />
                      </div>
                      {variants.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeVariant(v.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center text-slate-500">
                  <Coffee className="w-12 h-12 mx-auto mb-2 opacity-30 text-[#0D5C53]" />
                  <p className="text-sm font-semibold text-slate-800">Produk Tunggal (Single Size)</p>
                  <p className="text-xs text-slate-400 mt-0.5">Produk ini hanya memiliki satu ukuran dan opsi standar.</p>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Recipe & Bill of Materials (BOM) */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Langkah 3: Komposisi Resep Bahan Baku</h3>
                  <p className="text-xs text-slate-500">Tentukan bahan baku mentah yang digunakan untuk menghitung modal HPP.</p>
                </div>
              </div>

              {hasVariants && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {variants.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setActiveVariantId(v.id)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        activeVariantId === v.id
                          ? 'bg-[#0D5C53] text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {v.name} ({v.recipes.length} Bahan)
                    </button>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                  <h5 className="text-xs font-bold text-slate-700 uppercase mb-3 flex items-center gap-1.5">
                    <Wheat className="w-4 h-4 text-[#0D5C53]" />
                    <span>Pilih Bahan Baku</span>
                  </h5>
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {availableMaterials.map((mat) => (
                      <button
                        key={mat.id}
                        type="button"
                        onClick={() => addRecipeItem(mat)}
                        className="w-full text-left bg-white border border-slate-200 hover:border-[#0D5C53] hover:bg-[#E6F4F1]/30 p-2.5 rounded-xl text-xs transition-colors flex justify-between items-center cursor-pointer"
                      >
                        <div>
                          <p className="font-bold text-slate-800">{mat.name}</p>
                          <span className="text-[10px] text-slate-400">
                            Rp {Number(mat.unitCost ?? mat.costPrice ?? 0).toLocaleString('id-ID')} / {mat.unit}
                          </span>
                        </div>
                        <Plus className="w-3.5 h-3.5 text-[#0D5C53]" />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="col-span-2 bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-slate-700 uppercase mb-3">
                      Komposisi: {variants.find((v) => v.id === activeVariantId)?.name}
                    </h5>

                    {variants.find((v) => v.id === activeVariantId)?.recipes.length === 0 ? (
                      <div className="py-16 text-center text-slate-400">
                        <Wheat className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        <p className="text-xs">Belum ada bahan baku ditambahkan untuk varian ini.</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-72 overflow-y-auto">
                        {variants
                          .find((v) => v.id === activeVariantId)
                          ?.recipes.map((r) => (
                            <div
                              key={r.materialId}
                              className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                            >
                              <div>
                                <p className="font-bold text-slate-800">{r.materialName}</p>
                                <span className="text-[10px] text-slate-500">
                                  Biaya: Rp {r.cost.toLocaleString('id-ID')}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  min="0.1"
                                  step="0.1"
                                  value={r.quantity}
                                  onChange={(e) => updateRecipeQty(r.materialId, Number(e.target.value))}
                                  className="w-20 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-center font-bold"
                                />
                                <span className="text-slate-500 text-xs w-8">{r.unit}</span>
                                <button
                                  type="button"
                                  onClick={() => removeRecipeItem(r.materialId)}
                                  className="p-1 text-slate-400 hover:text-red-600 rounded"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-medium">Subtotal Biaya Bahan:</span>
                    <span className="font-bold text-[#0D5C53] text-sm">
                      Rp{' '}
                      {(
                        variants.find((v) => v.id === activeVariantId)?.recipes.reduce((s, r) => s + r.cost, 0) || 0
                      ).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Packaging & Extras */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Langkah 4: Packaging & Kemasan Saji</h3>
                  <p className="text-xs text-slate-500">Tentukan kemasan (cup, paper bag, sedotan) per varian.</p>
                </div>
              </div>

              {hasVariants && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {variants.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setActiveVariantId(v.id)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        activeVariantId === v.id
                          ? 'bg-[#0D5C53] text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {v.name} ({v.packagings.length} Kemasan)
                    </button>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                  <h5 className="text-xs font-bold text-slate-700 uppercase mb-3 flex items-center gap-1.5">
                    <Box className="w-4 h-4 text-[#0D5C53]" />
                    <span>Pilih Packaging</span>
                  </h5>
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {availablePackagings.map((pkg) => (
                      <button
                        key={pkg.id}
                        type="button"
                        onClick={() => addPackagingItem(pkg)}
                        className="w-full text-left bg-white border border-slate-200 hover:border-[#0D5C53] hover:bg-[#E6F4F1]/30 p-2.5 rounded-xl text-xs transition-colors flex justify-between items-center cursor-pointer"
                      >
                        <div>
                          <p className="font-bold text-slate-800">{pkg.name}</p>
                          <span className="text-[10px] text-slate-400">
                            Rp {Number(pkg.costPrice || 0).toLocaleString('id-ID')} / {pkg.unit}
                          </span>
                        </div>
                        <Plus className="w-3.5 h-3.5 text-[#0D5C53]" />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="col-span-2 bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-slate-700 uppercase mb-3">
                      Kemasan: {variants.find((v) => v.id === activeVariantId)?.name}
                    </h5>

                    {variants.find((v) => v.id === activeVariantId)?.packagings.length === 0 ? (
                      <div className="py-16 text-center text-slate-400">
                        <Box className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        <p className="text-xs">Belum ada packaging ditambahkan.</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-72 overflow-y-auto">
                        {variants
                          .find((v) => v.id === activeVariantId)
                          ?.packagings.map((p) => (
                            <div
                              key={p.packagingId}
                              className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                            >
                              <div>
                                <p className="font-bold text-slate-800">{p.packagingName}</p>
                                <span className="text-[10px] text-slate-500">
                                  Biaya: Rp {p.cost.toLocaleString('id-ID')}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  min="1"
                                  value={p.quantity}
                                  onChange={(e) => updatePackagingQty(p.packagingId, Number(e.target.value))}
                                  className="w-20 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-center font-bold"
                                />
                                <span className="text-slate-500 text-xs w-8">{p.unit}</span>
                                <button
                                  type="button"
                                  onClick={() => removePackagingItem(p.packagingId)}
                                  className="p-1 text-slate-400 hover:text-red-600 rounded"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-medium">Subtotal Biaya Packaging:</span>
                    <span className="font-bold text-[#0D5C53] text-sm">
                      Rp{' '}
                      {(
                        variants
                          .find((v) => v.id === activeVariantId)
                          ?.packagings.reduce((s, p) => s + p.cost, 0) || 0
                      ).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Pricing & Cost Analysis */}
          {currentStep === 5 && (
            <div className="space-y-4 max-w-2xl mx-auto">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Langkah 5: Penetapan Harga & Analisis Margin Laba</h3>
                <p className="text-xs text-slate-500">
                  HPP terkalkulasi otomatis dari (Bahan + Kemasan). Masukkan harga jual kasir.
                </p>
              </div>

              <div className="space-y-3">
                {variants.map((v) => {
                  const cogs = calculateVariantCOGS(v);
                  const margin = calculateVariantMargin(v.price, cogs);

                  return (
                    <div
                      key={v.id}
                      className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-xs"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-800 text-sm">{v.name}</span>
                        <span
                          className={`text-xs font-bold px-3 py-1 rounded-full ${
                            margin.percentage >= 50
                              ? 'bg-emerald-50 text-emerald-700'
                              : margin.percentage >= 30
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          Margin Laba: {margin.percentage}%
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Total HPP (Modal)</span>
                          <p className="font-bold text-slate-800 text-base mt-1">
                            Rp {cogs.toLocaleString('id-ID')}
                          </p>
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Harga Jual Kasir (Rp)</span>
                          <div className="mt-1">
                            <input
                              type="number"
                              value={v.price}
                              onChange={(e) => updateVariantField(v.id, 'price', Number(e.target.value))}
                              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]"
                            />
                          </div>
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Estimasi Laba Bersih</span>
                          <p className="font-bold text-emerald-600 text-base mt-1">
                            +Rp {margin.profit.toLocaleString('id-ID')}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 6: Review & Publish */}
          {currentStep === 6 && (
            <div className="max-w-2xl mx-auto space-y-5">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Langkah 6: Review & Terbitkan Menu</h3>
                <p className="text-xs text-slate-500">Periksa ringkasan produk sebelum disimpan dan mulai dijual di kasir POS.</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5 shadow-xs">
                <div className="flex gap-4">
                  <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center flex-shrink-0 overflow-hidden border border-slate-200">
                    {imagePreview ? (
                      <img src={imagePreview} alt={name} className="w-full h-full object-cover" />
                    ) : (
                      <Coffee className="w-8 h-8 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">{name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Kategori: <strong className="text-slate-700">{categories.find((c) => c.id === categoryId)?.name}</strong> • SKU: {sku || '-'}
                    </p>
                    {description && <p className="text-xs text-slate-600 mt-2 italic">{description}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-700 uppercase">Tabel Varian, HPP, & Laba:</span>
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-bold">
                      <tr>
                        <th className="py-2.5 px-3">Varian</th>
                        <th className="py-2.5 px-3">HPP (Modal)</th>
                        <th className="py-2.5 px-3">Harga Jual</th>
                        <th className="py-2.5 px-3">Laba / Cup</th>
                        <th className="py-2.5 px-3">Margin</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {variants.map((v) => {
                        const cogs = calculateVariantCOGS(v);
                        const margin = calculateVariantMargin(v.price, cogs);
                        return (
                          <tr key={v.id}>
                            <td className="py-3 px-3 font-semibold text-slate-800">{v.name}</td>
                            <td className="py-3 px-3 text-slate-500">Rp {cogs.toLocaleString('id-ID')}</td>
                            <td className="py-3 px-3 font-bold text-[#0D5C53]">
                              Rp {v.price.toLocaleString('id-ID')}
                            </td>
                            <td className="py-3 px-3 font-semibold text-emerald-600">
                              Rp {margin.profit.toLocaleString('id-ID')}
                            </td>
                            <td className="py-3 px-3">
                              <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold">
                                {margin.percentage}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer Controls */}
        <div className="pt-6 border-t border-slate-100 flex items-center justify-between mt-8">
          <Button
            type="button"
            variant="outline"
            disabled={currentStep === 1}
            onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
            leftIcon={<ChevronLeft className="w-4 h-4" />}
          >
            Sebelumnya
          </Button>

          {currentStep < 6 ? (
            <Button
              type="button"
              variant="primary"
              disabled={currentStep === 1 && !name.trim()}
              onClick={() => setCurrentStep((prev) => Math.min(6, prev + 1))}
              rightIcon={<ChevronRight className="w-4 h-4" />}
            >
              Lanjut
            </Button>
          ) : (
            <Button
              type="button"
              variant="primary"
              size="lg"
              disabled={submitting}
              isLoading={submitting}
              onClick={handlePublish}
              leftIcon={<Check className="w-4 h-4" />}
            >
              Konfirmasi & Terbitkan Menu ke Kasir
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

