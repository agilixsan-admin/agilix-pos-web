import React, { useState } from 'react';
import type { TaxSetting } from '@model/Settings';
import { Receipt, Plus, Edit2 } from 'lucide-react';
import {
  Button,
  Badge,
  Card,
  Modal,
  FormInput,
  EmptyState,
} from '@presentation/components/ui';

export const TaxesScreen: React.FC = () => {
  const [taxes, setTaxes] = useState<TaxSetting[]>([
    {
      id: '1',
      name: 'Pajak Resto (PB1)',
      code: 'PB1',
      rate: 10,
      type: 'PERCENTAGE',
      isIncludedInPrice: false,
      isActive: true,
    },
    {
      id: '2',
      name: 'Biaya Layanan (Service Charge)',
      code: 'SERVICE',
      rate: 5,
      type: 'PERCENTAGE',
      isIncludedInPrice: false,
      isActive: true,
    },
    {
      id: '3',
      name: 'PPN',
      code: 'PPN_11',
      rate: 11,
      type: 'PERCENTAGE',
      isIncludedInPrice: false,
      isActive: false,
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTax, setEditingTax] = useState<TaxSetting | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    rate: '10',
    isIncludedInPrice: false,
    isActive: true,
  });

  const handleOpenAdd = () => {
    setEditingTax(null);
    setFormData({ name: '', code: '', rate: '10', isIncludedInPrice: false, isActive: true });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (t: TaxSetting) => {
    setEditingTax(t);
    setFormData({
      name: t.name,
      code: t.code,
      rate: t.rate.toString(),
      isIncludedInPrice: t.isIncludedInPrice,
      isActive: t.isActive,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTax) {
      setTaxes(
        taxes.map((t) =>
          t.id === editingTax.id
            ? {
                ...t,
                name: formData.name,
                code: formData.code,
                rate: Number(formData.rate),
                isIncludedInPrice: formData.isIncludedInPrice,
                isActive: formData.isActive,
              }
            : t
        )
      );
    } else {
      const newTax: TaxSetting = {
        id: Date.now().toString(),
        name: formData.name,
        code: formData.code || 'TAX',
        rate: Number(formData.rate),
        type: 'PERCENTAGE',
        isIncludedInPrice: formData.isIncludedInPrice,
        isActive: formData.isActive,
      };
      setTaxes([...taxes, newTax]);
    }
    setIsModalOpen(false);
  };

  const handleToggleActive = (id: string) => {
    setTaxes(taxes.map((t) => (t.id === id ? { ...t, isActive: !t.isActive } : t)));
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Pajak & Biaya Tambahan</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola pajak restoran (PB1), PPN, dan biaya layanan (*service charge*) pada transaksi POS.
          </p>
        </div>

        <Button
          variant="primary"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={handleOpenAdd}
        >
          Tambah Pajak / Biaya
        </Button>
      </div>

      {/* Taxes Table */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Nama Pajak / Biaya</th>
                <th className="py-3.5 px-4">Kode</th>
                <th className="py-3.5 px-4">Persentase Tarif</th>
                <th className="py-3.5 px-4">Tipe Perhitungan</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {taxes.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyState
                      icon={<Receipt className="w-8 h-8 opacity-30 mx-auto" />}
                      title="Belum ada konfigurasi pajak"
                      description="Klik tombol '+ Tambah Pajak / Biaya' untuk menambahkan komponen baru."
                    />
                  </td>
                </tr>
              ) : (
                taxes.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{t.name}</td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-600">{t.code}</td>
                    <td className="py-3.5 px-4 font-bold text-[#0D5C53]">{t.rate}%</td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {t.isIncludedInPrice ? 'Termasuk dalam harga (Inclusive)' : 'Ditambahkan pada total (Exclusive)'}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleToggleActive(t.id)}
                        className="cursor-pointer"
                      >
                        <Badge variant={t.isActive ? 'success' : 'danger'} dot>
                          {t.isActive ? 'Aktif' : 'Nonaktif'}
                        </Badge>
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEdit(t)}
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
        title={editingTax ? 'Edit Pajak / Biaya' : 'Tambah Pajak / Biaya'}
        maxWidth="sm"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormInput
            label="Nama Pajak / Biaya"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Contoh: Pajak Resto (PB1)"
          />

          <FormInput
            label="Kode Unik"
            required
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            placeholder="Contoh: PB1"
          />

          <FormInput
            label="Persentase Tarif"
            type="number"
            min="0"
            max="100"
            step="any"
            unit="%"
            required
            value={formData.rate}
            onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
            placeholder="10"
          />

          <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={formData.isIncludedInPrice}
              onChange={(e) => setFormData({ ...formData, isIncludedInPrice: e.target.checked })}
              className="rounded-md text-[#0D5C53] focus:ring-[#0D5C53]"
            />
            <span>Termasuk dalam harga menu (*Tax Inclusive*)</span>
          </label>

          <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
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
