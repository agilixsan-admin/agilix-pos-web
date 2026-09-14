import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import type { RawMaterial, InventoryCategory } from '@model/Inventory';
import { useAuthStore } from '@domain/state/auth-store';
import {
  useRawMaterials,
  useInventoryCategories,
  useDeleteRawMaterialMutation,
  useCreateInventoryCategoryMutation,
  useUpdateInventoryCategoryMutation,
  useDeleteInventoryCategoryMutation,
  useDebounce,
} from '@domain/hooks';
import {
  Wheat,
  Plus,
  Edit2,
  Trash2,
  Eye,
  AlertTriangle,
  FolderTree,
} from 'lucide-react';
import {
  Button,
  Badge,
  Tabs,
  SearchInput,
  Modal,
  EmptyState,
  LoadingState,
  Card,
  FormInput,
  FormSelect,
} from '@presentation/components/ui';

export const RawMaterialsScreen: React.FC = () => {
  const navigate = useNavigate();
  const currentOutlet = useAuthStore((state) => state.currentOutlet);

  // Tab State
  const [activeTab, setActiveTab] = useState<string>('materials');

  // Query Hooks
  const { data: materials = [], isLoading: loadingMaterials } = useRawMaterials({ outletId: currentOutlet?.id });
  const { data: categories = [], isLoading: loadingCategories } = useInventoryCategories();

  // Mutations
  const deleteMaterialMutation = useDeleteRawMaterialMutation();
  const createCategoryMutation = useCreateInventoryCategoryMutation();
  const updateCategoryMutation = useUpdateInventoryCategoryMutation();
  const deleteCategoryMutation = useDeleteInventoryCategoryMutation();
  const savingCategory = createCategoryMutation.isPending || updateCategoryMutation.isPending;

  // Materials Filter State
  const [searchMaterial, setSearchMaterial] = useState('');
  const debouncedSearchMaterial = useDebounce(searchMaterial, 200);
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Categories Filter State
  const [searchCategory, setSearchCategory] = useState('');
  const debouncedSearchCategory = useDebounce(searchCategory, 200);

  // Category Modal State
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<InventoryCategory | null>(null);
  const [catName, setCatName] = useState('');
  const [catStatus, setCatStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');

  // Handle Delete Material
  const handleDeleteMaterial = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus bahan baku "${name}"?`)) return;
    try {
      await deleteMaterialMutation.mutateAsync(id);
    } catch (err: unknown) {
      alert(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Gagal menghapus bahan baku.'
      );
    }
  };

  // Category Actions
  const handleOpenAddCategory = () => {
    setEditingCategory(null);
    setCatName('');
    setCatStatus('ACTIVE');
    setIsCatModalOpen(true);
  };

  const handleOpenEditCategory = (cat: InventoryCategory) => {
    setEditingCategory(cat);
    setCatName(cat.name);
    setCatStatus(cat.status || 'ACTIVE');
    setIsCatModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;

    try {
      if (editingCategory) {
        await updateCategoryMutation.mutateAsync({
          id: editingCategory.id,
          data: {
            name: catName.trim(),
            status: catStatus,
          },
        });
      } else {
        await createCategoryMutation.mutateAsync({
          name: catName.trim(),
          status: catStatus,
        });
      }
      setIsCatModalOpen(false);
    } catch (err: unknown) {
      alert(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Gagal menyimpan kategori.'
      );
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus kategori "${name}"?`)) return;
    try {
      await deleteCategoryMutation.mutateAsync(id);
    } catch (err: unknown) {
      alert(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Gagal menghapus kategori.'
      );
    }
  };

  // Filtered Materials
  const filteredMaterials = materials.filter((m) => {
    if (!m) return false;
    const nameStr = (m.name || '').toLowerCase();
    const codeStr = (m.sku || m.code || '').toLowerCase();
    const q = debouncedSearchMaterial.toLowerCase();
    const matchesSearch = nameStr.includes(q) || codeStr.includes(q);

    const mCatId = m.categoryId || (typeof m.category === 'object' && m.category ? (m.category as any).id : '');
    const matchesCategory = filterCategory === 'ALL' || mCatId === filterCategory;

    const mStatus = m.status || 'ACTIVE';
    const matchesStatus = filterStatus === 'ALL' || mStatus === filterStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Filtered Categories
  const filteredCategories = categories.filter((c) => {
    if (!c) return false;
    const nameStr = (c.name || '').toLowerCase();
    return nameStr.includes(debouncedSearchCategory.toLowerCase());
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Bahan Baku & Kategori</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manajemen master bahan mentah (raw materials) dan klasifikasi inventori untuk resep produk (BOM).
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'materials' ? (
            <Button
              variant="primary"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => navigate('/inventory/raw-materials/create')}
            >
              Tambah Bahan
            </Button>
          ) : (
            <Button
              variant="primary"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={handleOpenAddCategory}
            >
              Tambah Kategori
            </Button>
          )}
        </div>
      </div>

      {/* Tabs Switcher */}
      <Tabs
        activeTab={activeTab}
        onChange={setActiveTab}
        tabs={[
          {
            id: 'materials',
            label: 'Semua Bahan Baku',
            icon: <Wheat className="w-4 h-4" />,
            count: materials.length,
          },
          {
            id: 'categories',
            label: 'Kategori Bahan Baku',
            icon: <FolderTree className="w-4 h-4" />,
            count: categories.length,
          },
        ]}
      />

      {/* TAB 1: SEMUA BAHAN BAKU */}
      {activeTab === 'materials' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 border border-slate-200 rounded-2xl shadow-xs">
            <div className="flex-1 max-w-xs">
              <SearchInput
                value={searchMaterial}
                onChange={setSearchMaterial}
                placeholder="Cari nama atau SKU..."
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53] cursor-pointer"
              >
                <option value="ALL">Semua Kategori</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53] cursor-pointer"
              >
                <option value="ALL">Semua Status</option>
                <option value="ACTIVE">Aktif</option>
                <option value="INACTIVE">Nonaktif</option>
              </select>
            </div>
          </div>

          {/* Raw Materials Table */}
          <Card padding="none">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3.5 px-4">SKU / Kode</th>
                    <th className="py-3.5 px-4">Nama Bahan Baku</th>
                    <th className="py-3.5 px-4">Kategori</th>
                    <th className="py-3.5 px-4">Satuan</th>
                    <th className="py-3.5 px-4 text-right">Stok Saat Ini</th>
                    <th className="py-3.5 px-4 text-right">Stok Min</th>
                    <th className="py-3.5 px-4 text-right">Unit Cost</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingMaterials ? (
                    <tr>
                      <td colSpan={9}>
                        <LoadingState message="Memuat data bahan baku..." />
                      </td>
                    </tr>
                  ) : filteredMaterials.length === 0 ? (
                    <tr>
                      <td colSpan={9}>
                        <EmptyState
                          icon={<Wheat className="w-8 h-8 opacity-30 mx-auto" />}
                          title="Belum ada bahan baku"
                          description="Klik tombol '+ Tambah Bahan' untuk membuat bahan mentah baru."
                        />
                      </td>
                    </tr>
                  ) : (
                    filteredMaterials.map((m) => {
                      const skuVal = m.sku || m.code || '-';
                      const currentStock = Number(m.currentStock ?? 0);
                      const minStock = Number(m.minimumStock ?? m.minStock ?? 0);
                      const isLowStock = currentStock <= minStock;
                      const unitCostVal = Number(m.unitCost ?? m.costPrice ?? 0);
                      const catName =
                        typeof m.category === 'object' && m.category !== null
                          ? (m.category as { name?: string }).name
                          : m.categoryName || (typeof m.category === 'string' ? m.category : '-');

                      return (
                        <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 font-semibold">
                            {skuVal}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            <Link
                              to={`/inventory/raw-materials/${m.id}`}
                              className="hover:text-[#0D5C53] hover:underline"
                            >
                              {m.name}
                            </Link>
                          </td>
                          <td className="py-3.5 px-4">
                            <Badge variant="neutral">{catName}</Badge>
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-slate-700">
                            {m.unit}
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                            <div className="flex items-center justify-end gap-1.5">
                              <span>{currentStock.toLocaleString('id-ID')}</span>
                              {isLowStock && (
                                <span title="Stok berada di bawah batas minimum" className="text-amber-500">
                                  <AlertTriangle className="w-3.5 h-3.5 inline" />
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-right text-slate-500">
                            {minStock.toLocaleString('id-ID')}
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold text-[#0D5C53]">
                            Rp {unitCostVal.toLocaleString('id-ID')}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <Badge
                              variant={m.status === 'INACTIVE' ? 'danger' : 'success'}
                              dot
                            >
                              {m.status === 'INACTIVE' ? 'Inactive' : 'Active'}
                            </Badge>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Link
                                to={`/inventory/raw-materials/${m.id}`}
                                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                                title="Lihat Detail"
                              >
                                <Eye className="w-4 h-4" />
                              </Link>
                              <Link
                                to={`/inventory/raw-materials/${m.id}/edit`}
                                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                                title="Edit Bahan Baku"
                              >
                                <Edit2 className="w-4 h-4" />
                              </Link>
                              <button
                                onClick={() => handleDeleteMaterial(m.id, m.name)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                                title="Hapus Bahan Baku"
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
        </div>
      )}

      {/* TAB 2: KATEGORI BAHAN BAKU */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          {/* Search Category */}
          <div className="flex items-center justify-between gap-3 bg-white p-3.5 border border-slate-200 rounded-2xl shadow-xs">
            <div className="flex-1 max-w-xs">
              <SearchInput
                value={searchCategory}
                onChange={setSearchCategory}
                placeholder="Cari kategori bahan..."
              />
            </div>
          </div>

          {/* Categories Table */}
          <Card padding="none">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3.5 px-4">Nama Kategori</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4">Terakhir Diperbarui</th>
                    <th className="py-3.5 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingCategories ? (
                    <tr>
                      <td colSpan={4}>
                        <LoadingState message="Memuat kategori..." />
                      </td>
                    </tr>
                  ) : filteredCategories.length === 0 ? (
                    <tr>
                      <td colSpan={4}>
                        <EmptyState
                          icon={<FolderTree className="w-8 h-8 opacity-30 mx-auto" />}
                          title="Belum ada kategori"
                          description="Klik tombol '+ Tambah Kategori' untuk membuat kategori baru."
                        />
                      </td>
                    </tr>
                  ) : (
                    filteredCategories.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {c.name}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <Badge
                            variant={c.status === 'INACTIVE' ? 'danger' : 'success'}
                            dot
                          >
                            {c.status === 'INACTIVE' ? 'Inactive' : 'Active'}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">
                          {c.updatedAt
                            ? new Date(c.updatedAt).toLocaleDateString('id-ID', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })
                            : '-'}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenEditCategory(c)}
                              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                              title="Edit Kategori"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(c.id, c.name)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                              title="Hapus Kategori"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Reusable Category Modal */}
      <Modal
        isOpen={isCatModalOpen}
        onClose={() => setIsCatModalOpen(false)}
        title={editingCategory ? 'Edit Kategori' : 'Tambah Kategori Baru'}
        maxWidth="sm"
      >
        <form onSubmit={handleSaveCategory} className="space-y-4">
          <FormInput
            label="Nama Kategori"
            value={catName}
            onChange={(e) => setCatName(e.target.value)}
            placeholder="Contoh: Biji Kopi, Dairy, Sirup"
            required
            autoFocus
          />

          <FormSelect
            label="Status"
            value={catStatus}
            onChange={(e) => setCatStatus(e.target.value as 'ACTIVE' | 'INACTIVE')}
          >
            <option value="ACTIVE">Aktif</option>
            <option value="INACTIVE">Nonaktif</option>
          </FormSelect>

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
              isLoading={savingCategory}
            >
              Simpan
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
