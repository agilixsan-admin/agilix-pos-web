import React, { useEffect, useState } from 'react';
import type { PackagingItem } from '@model/Inventory';
import { inventoryService } from '@domain/services/inventory-service';
import { useAuthStore } from '@domain/state/auth-store';
import { Box, Plus, Edit2, Trash2 } from 'lucide-react';
import { httpClient } from '@domain/services/http-client';
import {
  Button,
  Badge,
  Card,
  SearchInput,
  Modal,
  FormInput,
  FormSelect,
  LoadingState,
  EmptyState,
} from '@presentation/components/ui';

export const PackagingScreen: React.FC = () => {
  const currentOutlet = useAuthStore((state) => state.currentOutlet);
  const [packagings, setPackagings] = useState<PackagingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PackagingItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    unit: 'pcs',
    unitCost: '0',
    minStock: '0',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await inventoryService.getPackagingItems({ outletId: currentOutlet?.id });
      setPackagings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load packaging items:', err);
      setPackagings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentOutlet?.id]);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      sku: '',
      unit: 'pcs',
      unitCost: '0',
      minStock: '0',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: PackagingItem) => {
    setEditingItem(p);
    setFormData({
      name: p.name || '',
      sku: (p as { sku?: string }).sku || p.code || '',
      unit: p.unit || 'pcs',
      unitCost: String((p as { unitCost?: number }).unitCost ?? p.costPrice ?? 0),
      minStock: String((p as { minStock?: number }).minStock ?? p.minimumStock ?? 0),
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingItem) {
        await httpClient.put(`/packagings/${editingItem.id}`, {
          name: formData.name,
          sku: formData.sku || undefined,
          unit: formData.unit,
          unitCost: Number(formData.unitCost || 0),
          minStock: Number(formData.minStock || 0),
        });
      } else {
        await httpClient.post('/packagings', {
          name: formData.name,
          sku: formData.sku || undefined,
          unit: formData.unit,
          unitCost: Number(formData.unitCost || 0),
          minStock: Number(formData.minStock || 0),
        });
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: unknown) {
      alert(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Gagal menyimpan packaging.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus kemasan ini?')) return;
    try {
      await httpClient.delete(`/packagings/${id}`);
      loadData();
    } catch (err: unknown) {
      alert('Gagal menghapus packaging.');
    }
  };

  const rawList = Array.isArray(packagings) ? packagings : [];
  const filtered = rawList.filter((p) => {
    if (!p) return false;
    const nameStr = (p.name || '').toLowerCase();
    const codeStr = ((p as { sku?: string }).sku || p.code || '').toLowerCase();
    const q = (search || '').toLowerCase();
    return nameStr.includes(q) || codeStr.includes(q);
  });

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Kemasan & Packaging</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manajemen inventori wadah, paper cup, sedotan, dan kantong kemasan take-away.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-56">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Cari kemasan..."
            />
          </div>

          <Button
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={handleOpenAdd}
          >
            Tambah Kemasan
          </Button>
        </div>
      </div>

      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">SKU / Kode</th>
                <th className="py-3.5 px-4">Nama Kemasan</th>
                <th className="py-3.5 px-4">Satuan Unit</th>
                <th className="py-3.5 px-4">Estimasi HPP / Satuan</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5}>
                    <LoadingState message="Memuat daftar kemasan..." />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState
                      icon={<Box className="w-8 h-8 opacity-30 mx-auto" />}
                      title="Belum ada data kemasan"
                      description='Klik tombol "+ Tambah Kemasan" untuk menambahkan item kemasan baru.'
                    />
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const skuVal = (p as { sku?: string }).sku || p.code || '-';
                  const unitCostVal = Number((p as { unitCost?: number }).unitCost ?? p.costPrice ?? 0);

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 font-semibold">
                        {skuVal}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">{p.name}</td>
                      <td className="py-3.5 px-4">
                        <Badge variant="neutral">{p.unit}</Badge>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-[#0D5C53]">
                        Rp {unitCostVal.toLocaleString('id-ID')} / {p.unit}
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

      {/* Reusable Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Kemasan Packaging' : 'Tambah Kemasan Baru'}
        maxWidth="sm"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormInput
            label="Nama Kemasan"
            required
            autoFocus
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Contoh: Paper Cup Hot 8oz, Sedotan Boba"
          />

          <FormInput
            label="SKU / Kode Kemasan"
            value={formData.sku}
            onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
            placeholder="Contoh: PKG-CUP-08"
          />

          <FormSelect
            label="Satuan Unit"
            value={formData.unit}
            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
          >
            <option value="pcs">Pcs / Buah</option>
            <option value="pack">Pack</option>
            <option value="box">Box</option>
            <option value="roll">Roll</option>
          </FormSelect>

          <FormInput
            label="Estimasi HPP Satuan (Rp)"
            type="number"
            min="0"
            unit="Rp"
            value={formData.unitCost}
            onChange={(e) => setFormData({ ...formData, unitCost: e.target.value })}
            placeholder="0"
          />

          <FormInput
            label="Batas Stok Minimum"
            type="number"
            min="0"
            unit={formData.unit}
            value={formData.minStock}
            onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
            placeholder="0"
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
