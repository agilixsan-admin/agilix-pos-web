import React, { useState } from 'react';
import type { Category } from '@model/Product';
import {
  useCategories,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} from '@domain/hooks';
import { Plus, Tags, Edit2, Trash2 } from 'lucide-react';
import {
  Button,
  Badge,
  Card,
  Modal,
  FormInput,
  LoadingState,
  EmptyState,
  toast,
  confirmDialog,
} from '@presentation/components/ui';

export const CategoriesScreen: React.FC = () => {
  const { data: categories = [], isLoading: loading } = useCategories();
  const createCategoryMutation = useCreateCategoryMutation();
  const updateCategoryMutation = useUpdateCategoryMutation();
  const deleteCategoryMutation = useDeleteCategoryMutation();
  const submitting = createCategoryMutation.isPending || updateCategoryMutation.isPending;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ name: '' });

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setFormData({ name: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setEditingCategory(cat);
    setFormData({ name: cat.name });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await updateCategoryMutation.mutateAsync({
          id: editingCategory.id,
          data: {
            name: formData.name,
            status: (editingCategory as { status?: string }).status || 'ACTIVE',
          },
        });
      } else {
        await createCategoryMutation.mutateAsync({
          name: formData.name,
          status: 'ACTIVE',
        });
      }
      toast.success(editingCategory ? 'Kategori berhasil diperbarui.' : 'Kategori berhasil dibuat.');
      setIsModalOpen(false);
    } catch (err: unknown) {
      toast.error('Gagal menyimpan kategori.');
    }
  };

  const handleDelete = async (id: string) => {
    const ok = await confirmDialog({
      title: 'Hapus Kategori',
      message: 'Apakah Anda yakin ingin menghapus kategori ini?',
      confirmText: 'Hapus',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await deleteCategoryMutation.mutateAsync(id);
      toast.success('Kategori berhasil dihapus.');
    } catch (err: unknown) {
      toast.error('Gagal menghapus kategori.');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Kategori Produk</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola pengelompokan menu kasir seperti Minuman, Makanan, dsb.
          </p>
        </div>

        <Button
          variant="primary"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={handleOpenAdd}
        >
          Tambah Kategori
        </Button>
      </div>

      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Nama Kategori</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={3}>
                    <LoadingState message="Memuat kategori..." />
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={3}>
                    <EmptyState
                      icon={<Tags className="w-8 h-8 opacity-30 mx-auto" />}
                      title="Belum ada kategori"
                      description='Klik tombol "+ Tambah Kategori" untuk membuat klasifikasi menu baru.'
                    />
                  </td>
                </tr>
              ) : (
                categories.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{c.name}</td>
                    <td className="py-3.5 px-4 text-center">
                      <Badge variant="success" dot>
                        Aktif
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(c)}
                          leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(c.id)}
                          className="text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Reusable Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCategory ? 'Edit Kategori' : 'Tambah Kategori Baru'}
        maxWidth="sm"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormInput
            label="Nama Kategori"
            required
            autoFocus
            value={formData.name}
            onChange={(e) => setFormData({ name: e.target.value })}
            placeholder="Contoh: Coffee, Pastry, Non-Coffee"
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
