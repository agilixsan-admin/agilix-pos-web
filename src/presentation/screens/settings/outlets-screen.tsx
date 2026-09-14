import React, { useState } from 'react';
import type { Outlet } from '@model/Auth';
import {
  useOutlets,
  useCreateOutletMutation,
  useUpdateOutletMutation,
} from '@domain/hooks';
import { Building2, Plus, Edit2 } from 'lucide-react';
import {
  Button,
  Badge,
  Card,
  Modal,
  FormInput,
  LoadingState,
  EmptyState,
} from '@presentation/components/ui';

export const OutletsScreen: React.FC = () => {
  const { data: outlets = [], isLoading: loading } = useOutlets();
  const createOutletMutation = useCreateOutletMutation();
  const updateOutletMutation = useUpdateOutletMutation();
  const submitting = createOutletMutation.isPending || updateOutletMutation.isPending;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOutlet, setEditingOutlet] = useState<Outlet | null>(null);
  const [formData, setFormData] = useState({ name: '', address: '', phone: '' });

  const handleOpenAdd = () => {
    setEditingOutlet(null);
    setFormData({ name: '', address: '', phone: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (o: Outlet) => {
    setEditingOutlet(o);
    setFormData({ name: o.name, address: o.address || '', phone: o.phone || '' });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingOutlet) {
        await updateOutletMutation.mutateAsync({
          id: editingOutlet.id,
          data: {
            name: formData.name,
            address: formData.address || undefined,
            phone: formData.phone || undefined,
          },
        });
      } else {
        await createOutletMutation.mutateAsync({
          name: formData.name,
          address: formData.address || undefined,
          phone: formData.phone || undefined,
          isActive: true,
        });
      }
      setIsModalOpen(false);
    } catch (err: unknown) {
      alert('Gagal menyimpan outlet.');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Manajemen Outlet / Cabang</h1>
          <p className="text-xs text-slate-500 mt-0.5">Kelola daftar cabang toko dan informasi lokasi bisnis.</p>
        </div>

        <Button
          variant="primary"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={handleOpenAdd}
        >
          Tambah Outlet
        </Button>
      </div>

      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Nama Outlet</th>
                <th className="py-3.5 px-4">Alamat</th>
                <th className="py-3.5 px-4">No. Telepon</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5}>
                    <LoadingState message="Memuat data outlet..." />
                  </td>
                </tr>
              ) : outlets.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState
                      icon={<Building2 className="w-8 h-8 opacity-30 mx-auto" />}
                      title="Belum ada outlet"
                      description='Klik tombol "+ Tambah Outlet" untuk menambahkan cabang baru.'
                    />
                  </td>
                </tr>
              ) : (
                outlets.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{o.name}</td>
                    <td className="py-3.5 px-4 text-slate-600">{o.address || '-'}</td>
                    <td className="py-3.5 px-4 text-slate-600 font-mono">{o.phone || '-'}</td>
                    <td className="py-3.5 px-4 text-center">
                      <Badge variant={o.isActive ? 'success' : 'danger'} dot>
                        {o.isActive ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEdit(o)}
                        leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                      >
                        Edit
                      </Button>
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
        title={editingOutlet ? 'Edit Outlet' : 'Tambah Outlet Baru'}
        maxWidth="sm"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormInput
            label="Nama Outlet"
            required
            autoFocus
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Contoh: Outlet Sudirman, Cabang Tebet"
          />

          <FormInput
            label="Alamat Lokasi"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="Jl. Jendral Sudirman No. 12"
          />

          <FormInput
            label="No. Telepon / WhatsApp"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="08123456789"
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
