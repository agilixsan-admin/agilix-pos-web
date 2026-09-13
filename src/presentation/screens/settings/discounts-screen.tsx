import React, { useState } from 'react';
import type { DiscountSetting } from '@model/Settings';
import { BadgePercent, Plus, Edit2, Trash2 } from 'lucide-react';
import {
  Button,
  Badge,
  Card,
  Modal,
  FormInput,
  FormSelect,
  EmptyState,
} from '@presentation/components/ui';

export const DiscountsScreen: React.FC = () => {
  const [discounts, setDiscounts] = useState<DiscountSetting[]>([
    {
      id: '1',
      name: 'Diskon Member 10%',
      code: 'MEMBER10',
      type: 'PERCENTAGE',
      value: 10,
      minPurchase: 50000,
      isActive: true,
    },
    {
      id: '2',
      name: 'Potongan Opening Rp 15.000',
      code: 'OPEN15K',
      type: 'FIXED',
      value: 15000,
      minPurchase: 100000,
      isActive: true,
    },
    {
      id: '3',
      name: 'Diskon Jumat Berkah 20%',
      code: 'JUMAT20',
      type: 'PERCENTAGE',
      value: 20,
      minPurchase: 75000,
      maxDiscount: 30000,
      isActive: false,
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<DiscountSetting | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED',
    value: '10',
    minPurchase: '0',
    maxDiscount: '',
    isActive: true,
  });

  const handleOpenAdd = () => {
    setEditingDiscount(null);
    setFormData({
      name: '',
      code: '',
      type: 'PERCENTAGE',
      value: '10',
      minPurchase: '0',
      maxDiscount: '',
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (d: DiscountSetting) => {
    setEditingDiscount(d);
    setFormData({
      name: d.name,
      code: d.code || '',
      type: d.type,
      value: d.value.toString(),
      minPurchase: d.minPurchase?.toString() || '0',
      maxDiscount: d.maxDiscount?.toString() || '',
      isActive: d.isActive,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingDiscount) {
      setDiscounts(
        discounts.map((d) =>
          d.id === editingDiscount.id
            ? {
                ...d,
                name: formData.name,
                code: formData.code,
                type: formData.type,
                value: Number(formData.value),
                minPurchase: Number(formData.minPurchase || 0),
                maxDiscount: formData.maxDiscount ? Number(formData.maxDiscount) : undefined,
                isActive: formData.isActive,
              }
            : d
        )
      );
    } else {
      const newDiscount: DiscountSetting = {
        id: Date.now().toString(),
        name: formData.name,
        code: formData.code,
        type: formData.type,
        value: Number(formData.value),
        minPurchase: Number(formData.minPurchase || 0),
        maxDiscount: formData.maxDiscount ? Number(formData.maxDiscount) : undefined,
        isActive: formData.isActive,
      };
      setDiscounts([...discounts, newDiscount]);
    }
    setIsModalOpen(false);
  };

  const handleToggleActive = (id: string) => {
    setDiscounts(discounts.map((d) => (d.id === id ? { ...d, isActive: !d.isActive } : d)));
  };

  const handleDelete = (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus diskon ini?')) return;
    setDiscounts(discounts.filter((d) => d.id !== id));
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Diskon & Promosi</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola kode promo, diskon persentase, atau potongan nominal langsung saat transaksi di kasir POS.
          </p>
        </div>

        <Button
          variant="primary"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={handleOpenAdd}
        >
          Tambah Diskon
        </Button>
      </div>

      {/* Discounts Table */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Nama Promo / Diskon</th>
                <th className="py-3.5 px-4">Kode Promo</th>
                <th className="py-3.5 px-4">Nilai Diskon</th>
                <th className="py-3.5 px-4 text-right">Min. Pembelian</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {discounts.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyState
                      icon={<BadgePercent className="w-8 h-8 opacity-30 mx-auto" />}
                      title="Belum ada program diskon"
                      description="Klik tombol '+ Tambah Diskon' untuk membuat promo diskon baru."
                    />
                  </td>
                </tr>
              ) : (
                discounts.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{d.name}</td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-600">
                      {d.code || '-'}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-[#0D5C53]">
                      {d.type === 'PERCENTAGE'
                        ? `${d.value}%`
                        : `Rp ${d.value.toLocaleString('id-ID')}`}
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium text-slate-800">
                      {d.minPurchase ? `Rp ${d.minPurchase.toLocaleString('id-ID')}` : 'Tanpa Minimum'}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleToggleActive(d.id)}
                        className="cursor-pointer"
                      >
                        <Badge variant={d.isActive ? 'success' : 'danger'} dot>
                          {d.isActive ? 'Aktif' : 'Nonaktif'}
                        </Badge>
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(d)}
                          leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(d.id)}
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
        title={editingDiscount ? 'Edit Diskon & Promo' : 'Tambah Diskon Baru'}
        maxWidth="sm"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormInput
            label="Nama Diskon"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Contoh: Diskon Karyawan 15%"
          />

          <FormInput
            label="Kode Promo (Opsional)"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            placeholder="Contoh: STAFF15"
          />

          <FormSelect
            label="Tipe Diskon"
            value={formData.type}
            onChange={(e) =>
              setFormData({ ...formData, type: e.target.value as 'PERCENTAGE' | 'FIXED' })
            }
          >
            <option value="PERCENTAGE">Persentase (%)</option>
            <option value="FIXED">Nominal Tetap (Rp)</option>
          </FormSelect>

          <FormInput
            label="Nilai Potongan"
            type="number"
            min="0"
            step="any"
            unit={formData.type === 'PERCENTAGE' ? '%' : 'Rp'}
            required
            value={formData.value}
            onChange={(e) => setFormData({ ...formData, value: e.target.value })}
            placeholder="10"
          />

          <FormInput
            label="Minimal Pembelian (Rp)"
            type="number"
            min="0"
            unit="Rp"
            value={formData.minPurchase}
            onChange={(e) => setFormData({ ...formData, minPurchase: e.target.value })}
            placeholder="0"
          />

          <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="rounded-md text-[#0D5C53] focus:ring-[#0D5C53]"
            />
            <span>Status Aktif</span>
          </label>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Batal
            </Button>
            <Button type="submit" variant="primary">
              Simpan
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
