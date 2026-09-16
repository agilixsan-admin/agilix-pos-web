import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import type { PackagingItem, PackagingCategory } from '@model/Inventory';
import { useAuthStore } from '@domain/state/auth-store';
import {
  usePackagingItems,
  usePackagingCategories,
  useDeletePackagingMutation,
  useCreatePackagingCategoryMutation,
  useUpdatePackagingCategoryMutation,
  useDeletePackagingCategoryMutation,
  useDebounce,
} from '@domain/hooks';
import {
  Box,
  Plus,
  Edit2,
  Trash2,
  Eye,
  FolderTree,
  ChevronLeft,
  ChevronRight,
  Package,
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
  FormTextarea,
} from '@presentation/components/ui';

export const PackagingScreen: React.FC = () => {
  const navigate = useNavigate();
  const currentOutlet = useAuthStore((state) => state.currentOutlet);

  // Tab State ('packagings' | 'categories')
  const [activeTab, setActiveTab] = useState<string>('packagings');

  // Queries
  const { data: packagings = [], isLoading: loadingPackagings } = usePackagingItems({
    outletId: currentOutlet?.id,
  });
  const { data: categories = [], isLoading: loadingCategories } = usePackagingCategories();

  // Mutations
  const deletePackagingMutation = useDeletePackagingMutation();
  const createCategoryMutation = useCreatePackagingCategoryMutation();
  const updateCategoryMutation = useUpdatePackagingCategoryMutation();
  const deleteCategoryMutation = useDeletePackagingCategoryMutation();
  const savingCategory = createCategoryMutation.isPending || updateCategoryMutation.isPending;

  // Packaging Filter State
  const [searchPackaging, setSearchPackaging] = useState('');
  const debouncedSearchPackaging = useDebounce(searchPackaging, 200);
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterStockStatus, setFilterStockStatus] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Category Filter State
  const [searchCategory, setSearchCategory] = useState('');
  const debouncedSearchCategory = useDebounce(searchCategory, 200);

  // Category Modal State
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<PackagingCategory | null>(null);
  const [catName, setCatName] = useState('');
  const [catDescription, setCatDescription] = useState('');
  const [catStatus, setCatStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');

  // Filtered Packagings
  const filteredPackagings = useMemo(() => {
    return packagings.filter((pkg) => {
      // Search
      if (debouncedSearchPackaging) {
        const query = debouncedSearchPackaging.toLowerCase();
        const matchName = pkg.name.toLowerCase().includes(query);
        const matchSku = (pkg.sku || pkg.code || '').toLowerCase().includes(query);
        if (!matchName && !matchSku) return false;
      }

      // Category filter
      if (filterCategory !== 'ALL') {
        const pkgCatId =
          typeof pkg.category === 'object' && pkg.category !== null
            ? (pkg.category as PackagingCategory).id
            : pkg.categoryId;
        if (pkgCatId !== filterCategory) return false;
      }

      // Stock status filter
      const current = typeof pkg.currentStock === 'number'
        ? pkg.currentStock
        : ((pkg as any).inventoryItem?.stocks || []).reduce((sum: number, s: any) => sum + Number(s.quantity || 0), 0);
      const min = Number(pkg.minimumStock ?? pkg.minStock ?? (pkg as any).inventoryItem?.minimumStock ?? 0);
      if (filterStockStatus === 'OUT_OF_STOCK' && current > 0) return false;
      if (filterStockStatus === 'LOW_STOCK' && (current <= 0 || current > min)) return false;
      if (filterStockStatus === 'IN_STOCK' && current <= min) return false;

      return true;
    });
  }, [packagings, debouncedSearchPackaging, filterCategory, filterStockStatus]);

  // Paginated Packagings
  const totalItems = filteredPackagings.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedPackagings = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPackagings.slice(start, start + pageSize);
  }, [filteredPackagings, currentPage, pageSize]);

  // Filtered Categories
  const filteredCategories = useMemo(() => {
    return categories.filter((cat) => {
      if (!debouncedSearchCategory) return true;
      const query = debouncedSearchCategory.toLowerCase();
      return (
        cat.name.toLowerCase().includes(query) ||
        (cat.description || '').toLowerCase().includes(query)
      );
    });
  }, [categories, debouncedSearchCategory]);

  // Format Currency
  const formatRupiah = (val: number) => {
    return `Rp ${new Intl.NumberFormat('id-ID').format(val)}`;
  };

  // Format Date
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

  // Actions
  const handleDeletePackaging = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus packaging "${name}"?`)) return;
    try {
      await deletePackagingMutation.mutateAsync(id);
    } catch (err: unknown) {
      alert(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Gagal menghapus packaging.'
      );
    }
  };

  const handleOpenAddCategory = () => {
    setEditingCategory(null);
    setCatName('');
    setCatDescription('');
    setCatStatus('ACTIVE');
    setIsCatModalOpen(true);
  };

  const handleOpenEditCategory = (cat: PackagingCategory) => {
    setEditingCategory(cat);
    setCatName(cat.name);
    setCatDescription(cat.description || '');
    setCatStatus(cat.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE');
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
            description: catDescription.trim() || undefined,
            status: catStatus,
          },
        });
      } else {
        await createCategoryMutation.mutateAsync({
          name: catName.trim(),
          description: catDescription.trim() || undefined,
          status: catStatus,
        });
      }
      setIsCatModalOpen(false);
    } catch (err: unknown) {
      alert(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Gagal menyimpan kategori packaging.'
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
          'Gagal menghapus kategori packaging.'
      );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Packaging</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola material packaging yang digunakan dalam operasional dan perhitungan HPP produk.
          </p>
        </div>

        <Button
          variant="primary"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => navigate('/inventory/packaging/create')}
        >
          Tambah Packaging
        </Button>
      </div>

      {/* Tabs */}
      <Tabs
        activeTab={activeTab}
        onChange={(tabId) => {
          setActiveTab(tabId);
          setCurrentPage(1);
        }}
        tabs={[
          {
            id: 'packagings',
            label: 'Semua Packaging',
            icon: <Box className="w-4 h-4" />,
            count: packagings.length,
          },
          {
            id: 'categories',
            label: 'Kategori',
            icon: <FolderTree className="w-4 h-4" />,
            count: categories.length,
          },
        ]}
      />

      {/* TAB 1: SEMUA PACKAGING */}
      {activeTab === 'packagings' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="sm:col-span-2">
              <SearchInput
                placeholder="Cari nama packaging..."
                value={searchPackaging}
                onChange={(val) => {
                  setSearchPackaging(val);
                  setCurrentPage(1);
                }}
                onClear={() => setSearchPackaging('')}
              />
            </div>

            <div>
              <FormSelect
                value={filterCategory}
                onChange={(e) => {
                  setFilterCategory(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="ALL">Kategori: Semua</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </FormSelect>
            </div>

            <div>
              <FormSelect
                value={filterStockStatus}
                onChange={(e) => {
                  setFilterStockStatus(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="ALL">Stock Status: Semua</option>
                <option value="IN_STOCK">In Stock (Aman)</option>
                <option value="LOW_STOCK">Low Stock (Menipis)</option>
                <option value="OUT_OF_STOCK">Out of Stock (Habis)</option>
              </FormSelect>
            </div>
          </div>

          {/* Packaging Table */}
          <Card padding="none">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3.5 px-4">Nama Packaging</th>
                    <th className="py-3.5 px-4">Kategori</th>
                    <th className="py-3.5 px-4">Unit / Satuan</th>
                    <th className="py-3.5 px-4">Unit Cost</th>
                    <th className="py-3.5 px-4 text-right">Current Stock</th>
                    <th className="py-3.5 px-4 text-right">Min Stock</th>
                    <th className="py-3.5 px-4 text-center">Stock Status</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingPackagings ? (
                    <tr>
                      <td colSpan={9}>
                        <LoadingState message="Memuat daftar packaging..." />
                      </td>
                    </tr>
                  ) : paginatedPackagings.length === 0 ? (
                    <tr>
                      <td colSpan={9}>
                        <EmptyState
                          icon={<Box className="w-8 h-8 opacity-30 mx-auto" />}
                          title="Belum ada packaging"
                          description={
                            searchPackaging || filterCategory !== 'ALL' || filterStockStatus !== 'ALL'
                              ? 'Tidak ada packaging yang cocok dengan filter yang dipilih.'
                              : 'Tambahkan material packaging pertama Anda untuk mulai mengelola stok kemasan.'
                          }
                          action={
                            !searchPackaging && filterCategory === 'ALL' && filterStockStatus === 'ALL' ? (
                              <Button
                                variant="primary"
                                size="sm"
                                leftIcon={<Plus className="w-4 h-4" />}
                                onClick={() => navigate('/inventory/packaging/create')}
                              >
                                Tambah Packaging
                              </Button>
                            ) : undefined
                          }
                        />
                      </td>
                    </tr>
                  ) : (
                    paginatedPackagings.map((item) => {
                      const current = typeof item.currentStock === 'number'
                        ? item.currentStock
                        : ((item as any).inventoryItem?.stocks || []).reduce((sum: number, s: any) => sum + Number(s.quantity || 0), 0);
                      const min = Number(item.minimumStock ?? item.minStock ?? (item as any).inventoryItem?.minimumStock ?? 0);
                      const cost = Number(item.unitCost ?? item.costPrice ?? (item as any).inventoryItem?.unitCost ?? 0);
                      const unit = item.unit || (item as any).inventoryItem?.unit || 'pcs';
                      const categoryName =
                        typeof item.category === 'object' && item.category !== null
                          ? (item.category as PackagingCategory).name
                          : item.categoryName || (typeof item.category === 'string' ? item.category : 'Umum');
                      const sku = item.sku || item.code || '-';

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-slate-100/80 text-slate-600 rounded-xl shrink-0">
                                <Box className="w-4 h-4" />
                              </div>
                              <div>
                                <Link
                                  to={`/inventory/packaging/${item.id}`}
                                  className="font-bold text-slate-900 hover:text-[#0D5C53] transition-colors"
                                >
                                  {item.name}
                                </Link>
                                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                                  {sku}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <Badge variant="neutral">{categoryName}</Badge>
                          </td>

                          <td className="py-3.5 px-4 font-medium text-slate-700">
                            {unit}
                          </td>

                          <td className="py-3.5 px-4 font-semibold text-slate-900">
                            {formatRupiah(cost)}
                          </td>

                          <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                            {current.toLocaleString('id-ID')} <span className="text-[11px] font-normal text-slate-400">{unit}</span>
                          </td>

                          <td className="py-3.5 px-4 text-right text-slate-500 font-medium">
                            {min.toLocaleString('id-ID')} <span className="text-[11px] text-slate-400">{unit}</span>
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            {current === 0 ? (
                              <Badge variant="danger" dot>
                                Out of Stock
                              </Badge>
                            ) : current <= min ? (
                              <Badge variant="warning" dot>
                                Low Stock
                              </Badge>
                            ) : (
                              <Badge variant="success" dot>
                                In Stock
                              </Badge>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            <Badge
                              variant={item.status === 'INACTIVE' ? 'neutral' : 'success'}
                              dot
                            >
                              {item.status === 'INACTIVE' ? 'Nonaktif' : 'Aktif'}
                            </Badge>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Link to={`/inventory/packaging/${item.id}`}>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-slate-600 hover:text-[#0D5C53]"
                                  title="Lihat Detail"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </Button>
                              </Link>
                              <Link to={`/inventory/packaging/${item.id}/edit`}>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-slate-600 hover:text-blue-600"
                                  title="Edit Packaging"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </Button>
                              </Link>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeletePackaging(item.id, item.name)}
                                className="text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                                title="Hapus Packaging"
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

            {/* Pagination Footer */}
            {totalItems > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t border-slate-200 gap-3 text-xs text-slate-500">
                <span>
                  Menampilkan{' '}
                  <strong className="text-slate-700 font-semibold">
                    {(currentPage - 1) * pageSize + 1}
                  </strong>{' '}
                  -{' '}
                  <strong className="text-slate-700 font-semibold">
                    {Math.min(currentPage * pageSize, totalItems)}
                  </strong>{' '}
                  dari <strong className="text-slate-700 font-semibold">{totalItems}</strong> packaging
                </span>

                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
                  >
                    Sebelumnya
                  </Button>

                  <div className="flex items-center gap-1 px-2 font-semibold text-slate-700">
                    <span>{currentPage}</span>
                    <span className="text-slate-400">/</span>
                    <span>{totalPages}</span>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                  >
                    Selanjutnya
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* TAB 2: KATEGORI PACKAGING */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Kategori Packaging</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Kelola kategori untuk mengelompokkan material packaging.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-48 sm:w-64">
                <SearchInput
                  placeholder="Cari kategori..."
                  value={searchCategory}
                  onChange={(val) => setSearchCategory(val)}
                  onClear={() => setSearchCategory('')}
                />
              </div>

              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={handleOpenAddCategory}
              >
                Tambah Kategori
              </Button>
            </div>
          </div>

          <Card padding="none">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3.5 px-4">Nama Kategori</th>
                    <th className="py-3.5 px-4">Deskripsi</th>
                    <th className="py-3.5 px-4 text-center">Jumlah Packaging</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4">Terakhir Diubah</th>
                    <th className="py-3.5 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingCategories ? (
                    <tr>
                      <td colSpan={6}>
                        <LoadingState message="Memuat kategori packaging..." />
                      </td>
                    </tr>
                  ) : filteredCategories.length === 0 ? (
                    <tr>
                      <td colSpan={6}>
                        <EmptyState
                          icon={<FolderTree className="w-8 h-8 opacity-30 mx-auto" />}
                          title="Belum ada kategori"
                          description='Klik tombol "+ Tambah Kategori" untuk mengelompokkan packaging baru.'
                        />
                      </td>
                    </tr>
                  ) : (
                    filteredCategories.map((cat) => {
                      const count = cat.packagingCount ?? cat.itemCount ?? 0;
                      return (
                        <tr key={cat.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5 font-bold text-slate-900">
                              <FolderTree className="w-4 h-4 text-slate-400 shrink-0" />
                              <span>{cat.name}</span>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">
                            {cat.description || '-'}
                          </td>

                          <td className="py-3.5 px-4 text-center font-semibold text-slate-700">
                            {count} packaging
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            <Badge
                              variant={cat.status === 'INACTIVE' ? 'neutral' : 'success'}
                              dot
                            >
                              {cat.status === 'INACTIVE' ? 'Nonaktif' : 'Aktif'}
                            </Badge>
                          </td>

                          <td className="py-3.5 px-4 text-slate-500 font-mono">
                            {formatDate(cat.updatedAt || cat.createdAt)}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenEditCategory(cat)}
                                leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteCategory(cat.id, cat.name)}
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
        </div>
      )}

      {/* Category Create/Edit Modal */}
      <Modal
        isOpen={isCatModalOpen}
        onClose={() => setIsCatModalOpen(false)}
        title={editingCategory ? 'Edit Kategori Packaging' : 'Tambah Kategori Packaging'}
        maxWidth="md"
      >
        <form onSubmit={handleSaveCategory} className="space-y-4">
          <FormInput
            label="Nama Kategori"
            required
            autoFocus
            value={catName}
            onChange={(e) => setCatName(e.target.value)}
            placeholder="Contoh: Cup, Paper Bag, Box, Straw"
          />

          <FormTextarea
            label="Deskripsi (Opsional)"
            value={catDescription}
            onChange={(e) => setCatDescription(e.target.value)}
            placeholder="Catatan mengenai jenis packaging ini..."
            rows={3}
          />

          <FormSelect
            label="Status"
            value={catStatus}
            onChange={(e) => setCatStatus(e.target.value as 'ACTIVE' | 'INACTIVE')}
          >
            <option value="ACTIVE">Aktif</option>
            <option value="INACTIVE">Nonaktif</option>
          </FormSelect>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
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
