import React, { useEffect, useState } from 'react';
import type { Table } from '@model/Settings';
import { settingsService } from '@domain/services/settings-service';
import { useAuthStore } from '@domain/state/auth-store';
import { LayoutGrid, Plus, Edit2, Trash2 } from 'lucide-react';
import {
  Button,
  Badge,
  Card,
  Modal,
  FormInput,
  LoadingState,
  EmptyState,
} from '@presentation/components/ui';

export const TablesScreen: React.FC = () => {
  const currentOutlet = useAuthStore((state) => state.currentOutlet);
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [formData, setFormData] = useState({ name: '', capacity: '4' });
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await settingsService.getTables(currentOutlet?.id);
      setTables(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentOutlet?.id]);

  const handleOpenAdd = () => {
    setEditingTable(null);
    setFormData({ name: '', capacity: '4' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (t: Table) => {
    setEditingTable(t);
    setFormData({ name: t.name, capacity: t.capacity.toString() });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingTable) {
        await settingsService.updateTable(editingTable.id, {
          name: formData.name,
          capacity: Number(formData.capacity),
        });
      } else {
        await settingsService.createTable({
          outletId: currentOutlet?.id || '',
          name: formData.name,
          capacity: Number(formData.capacity),
          status: 'AVAILABLE',
          isActive: true,
        });
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: unknown) {
      alert(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Gagal menyimpan meja.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus meja ini?')) return;
    try {
      await settingsService.deleteTable(id);
      loadData();
    } catch (err: unknown) {
      alert('Gagal menghapus meja.');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Manajemen Meja Dine-In</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola denah nomor meja & kapasitas kursi untuk pesanan makan di tempat.
          </p>
        </div>

        <Button
          variant="primary"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={handleOpenAdd}
        >
          Tambah Meja
        </Button>
      </div>

      {loading ? (
        <LoadingState message="Memuat data meja..." className="min-h-[200px]" />
      ) : tables.length === 0 ? (
        <Card>
          <EmptyState
            icon={<LayoutGrid className="w-10 h-10 opacity-30 mx-auto" />}
            title="Belum ada meja"
            description='Klik tombol "+ Tambah Meja" untuk mendaftarkan nomor meja baru.'
            action={
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={handleOpenAdd}
              >
                Tambah Meja
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {tables.map((t) => (
            <Card
              key={t.id}
              className="flex flex-col justify-between hover:border-[#0D5C53]/40 transition-colors p-4"
              padding="none"
            >
              <div className="p-4 flex flex-col justify-between h-full">
                <div className="flex items-center justify-between mb-3">
                  <Badge
                    variant={t.status === 'AVAILABLE' ? 'success' : 'warning'}
                    size="sm"
                    dot
                  >
                    {t.status === 'AVAILABLE' ? 'Kosong' : 'Terisi'}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(t)}
                      className="p-1 text-slate-400 hover:text-slate-700 rounded-md cursor-pointer transition-colors"
                      title="Edit Meja"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(t.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded-md cursor-pointer transition-colors"
                      title="Hapus Meja"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="text-center py-2">
                  <h3 className="font-bold text-slate-900 text-lg">{t.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{t.capacity} Kursi</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Reusable Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTable ? 'Edit Data Meja' : 'Tambah Meja Baru'}
        maxWidth="sm"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormInput
            label="Nomor / Nama Meja"
            required
            autoFocus
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Contoh: Meja 01, VIP 1"
          />

          <FormInput
            label="Kapasitas Kursi"
            type="number"
            min="1"
            unit="Orang"
            required
            value={formData.capacity}
            onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
            placeholder="4"
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
