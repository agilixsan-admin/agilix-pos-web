import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Product } from '@model/Product';
import { useAuthStore } from '@domain/state/auth-store';
import {
  useProducts,
  useCategories,
  useOutlets,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useUpdateProductOutletAvailabilityMutation,
  useDebounce,
} from '@domain/hooks';
import { Plus, Edit2, Trash2, Coffee, Store } from 'lucide-react';
import {
  Button,
  Badge,
  Card,
  SearchInput,
  Modal,
  FormInput,
  FormSelect,
  FormTextarea,
  LoadingState,
  EmptyState,
  CustomSelect,
  toast,
} from '@presentation/components/ui';

export const ProductsScreen: React.FC = () => {
  const navigate = useNavigate();
  const currentOutlet = useAuthStore((state) => state.currentOutlet);
  const [selectedOutletId, setSelectedOutletId] = useState<string>(currentOutlet?.id || '');

  // Outlets
  const { data: outlets = [], isLoading: outletsLoading } = useOutlets();

  // Query Hooks
  const { data: products = [], isLoading: productsLoading } = useProducts(
    selectedOutletId ? { outletId: selectedOutletId } : undefined
  );
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const loading = productsLoading || categoriesLoading || outletsLoading;

  // Mutations
  const createProductMutation = useCreateProductMutation();
  const updateProductMutation = useUpdateProductMutation();
  const deleteProductMutation = useDeleteProductMutation();
  const updateOutletAvailabilityMutation = useUpdateProductOutletAvailabilityMutation();
  const submitting = createProductMutation.isPending || updateProductMutation.isPending;

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 200);
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Modal State for quick edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    categoryId: '',
    price: '',
    costPrice: '',
    description: '',
  });

  const handleOpenAdd = () => {
    navigate('/products/create');
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      sku: p.sku || '',
      categoryId: p.categoryId,
      price: (p.price ?? p.minPrice ?? p.variants?.[0]?.price ?? 0).toString(),
      costPrice: p.costPrice?.toString() || '',
      description: p.description || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await updateProductMutation.mutateAsync({
          id: editingProduct.id,
          data: {
            name: formData.name,
            sku: formData.sku || undefined,
            categoryId: formData.categoryId || undefined,
            price: Number(formData.price),
            description: formData.description || undefined,
            status: 'ACTIVE',
          },
        });
      } else {
        await createProductMutation.mutateAsync({
          name: formData.name,
          sku: formData.sku || undefined,
          categoryId: formData.categoryId || undefined,
          price: Number(formData.price),
          description: formData.description || undefined,
          status: 'ACTIVE',
        });
      }
      setIsModalOpen(false);
    } catch (err: unknown) {
      alert(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Gagal menyimpan produk.'
      );
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus produk ini?')) return;
    try {
      await deleteProductMutation.mutateAsync(id);
    } catch (err: unknown) {
      alert('Gagal menghapus produk.');
    }
  };

  const handleToggleOutletStatus = async (p: Product) => {
    if (!selectedOutletId) return;
    const newActive = !(p.isOutletActive !== false);
    try {
      await updateOutletAvailabilityMutation.mutateAsync({
        id: p.id,
        outletId: selectedOutletId,
        isActive: newActive,
      });
      toast.success(
        newActive
          ? `Menu "${p.name}" telah diaktifkan di cabang ini.`
          : `Menu "${p.name}" telah dinonaktifkan di cabang ini.`
      );
    } catch (err: unknown) {
      toast.error(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Gagal mengubah status ketersediaan cabang.'
      );
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCat = selectedCategory === 'ALL' || p.categoryId === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Daftar Menu & Produk</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola katalog menu makanan, minuman, harga jual, dan ketersediaan per cabang.
          </p>
        </div>

        <Button
          variant="primary"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={handleOpenAdd}
        >
          Buat Produk Baru (Wizard)
        </Button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 border border-slate-200 rounded-2xl shadow-xs relative z-30">
        <div className="flex-1 max-w-xs">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Cari nama atau SKU produk..."
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <CustomSelect
            ariaLabel="Pilih Cabang"
            value={selectedOutletId}
            onChange={(val) => setSelectedOutletId(val)}
            options={[
              { value: '', label: 'Semua Cabang (Master Global)' },
              ...outlets.map((o) => ({
                value: o.id,
                label: `${o.name} (${o.code})`,
              })),
            ]}
            buttonClassName="bg-slate-50 border-slate-200 text-xs py-2 px-3 rounded-xl min-w-[210px]"
          />

          <CustomSelect
            ariaLabel="Filter Kategori"
            value={selectedCategory}
            onChange={(val) => setSelectedCategory(val)}
            options={[
              { value: 'ALL', label: 'Semua Kategori' },
              ...categories.map((c) => ({
                value: c.id,
                label: c.name,
              })),
            ]}
            buttonClassName="bg-slate-50 border-slate-200 text-xs py-2 px-3 rounded-xl"
          />
        </div>
      </div>

      {/* Mode Cabang Active Banner */}
      {selectedOutletId && (
        <div className="bg-teal-50/80 border border-teal-200/80 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-teal-950 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-100 flex items-center justify-center text-teal-700 shrink-0">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-slate-900">
                Mode Cabang: {outlets.find((o) => o.id === selectedOutletId)?.name || 'Cabang Terpilih'}
              </p>
              <p className="text-slate-600 text-[11px] mt-0.5">
                Klik tombol toggle status di tabel untuk mengaktifkan atau menonaktifkan penjualan menu di cabang ini secara instan.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setSelectedOutletId('')}
            className="text-teal-800 hover:bg-teal-100/60 self-start sm:self-auto text-xs"
          >
            Kembali ke Master Global
          </Button>
        </div>
      )}

      {/* Products Table */}
      <Card padding="none" className="relative z-10">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">SKU</th>
                <th className="py-3.5 px-4">Nama Produk</th>
                <th className="py-3.5 px-4">Kategori</th>
                <th className="py-3.5 px-4 text-right">Harga Jual</th>
                <th className="py-3.5 px-4 text-center">Varian</th>
                <th className="py-3.5 px-4 text-center">
                  {selectedOutletId ? 'Status Cabang' : 'Status Master'}
                </th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7}>
                    <LoadingState message="Memuat katalog produk..." />
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <EmptyState
                      icon={<Coffee className="w-8 h-8 opacity-30 mx-auto" />}
                      title="Belum ada produk"
                      description='Klik tombol "+ Buat Produk Baru" untuk menambahkan menu ke katalog POS.'
                    />
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const catName = categories.find((c) => c.id === p.categoryId)?.name || '-';
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 font-semibold">
                        {p.sku || '-'}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">{p.name}</td>
                      <td className="py-3.5 px-4">
                        <Badge variant="neutral">{catName}</Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-[#0D5C53]">
                        {p.minPrice !== undefined && p.maxPrice !== undefined && p.maxPrice > p.minPrice
                          ? `Rp ${Number(p.minPrice).toLocaleString('id-ID')} - ${Number(p.maxPrice).toLocaleString('id-ID')}`
                          : `Rp ${Number(p.price ?? p.minPrice ?? p.variants?.[0]?.price ?? 0).toLocaleString('id-ID')}`}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="text-slate-600 font-medium">
                          {p.variants?.length ? `${p.variants.length} Varian` : 'Single Item'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {selectedOutletId ? (
                          <button
                            type="button"
                            onClick={() => handleToggleOutletStatus(p)}
                            disabled={updateOutletAvailabilityMutation.isPending}
                            title="Klik untuk ubah ketersediaan menu di cabang ini"
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                              p.isOutletActive !== false
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100 hover:border-emerald-400'
                                : 'bg-slate-100 text-slate-500 border border-slate-300 hover:bg-slate-200'
                            }`}
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${
                                p.isOutletActive !== false ? 'bg-emerald-500' : 'bg-slate-400'
                              }`}
                            />
                            {p.isOutletActive !== false ? 'Aktif di Cabang' : 'Nonaktif'}
                          </button>
                        ) : (
                          <Badge variant={p.isActive !== false ? 'success' : 'danger'} dot>
                            {p.isActive !== false ? 'Aktif' : 'Nonaktif'}
                          </Badge>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEdit(p)}
                            leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(p.id)}
                            className="text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
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

      {/* Reusable Quick Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? 'Edit Informasi Produk' : 'Tambah Produk'}
        maxWidth="sm"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormInput
            label="Nama Menu / Produk"
            required
            autoFocus
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Contoh: Caramel Macchiato"
          />

          <FormInput
            label="SKU / Barcode"
            value={formData.sku}
            onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
            placeholder="Contoh: BEV-MAC-01"
          />

          <FormSelect
            label="Kategori Menu"
            required
            value={formData.categoryId}
            onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
          >
            <option value="">Pilih Kategori...</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </FormSelect>

          <FormInput
            label="Harga Jual (Rp)"
            type="number"
            min="0"
            unit="Rp"
            required
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            placeholder="35000"
          />

          <FormTextarea
            label="Deskripsi Menu"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Catatan bahan atau rasa..."
            rows={2}
          />

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={submitting}
            >
              Simpan
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
