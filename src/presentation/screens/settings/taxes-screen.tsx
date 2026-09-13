import React, { useState } from 'react';
import type { TaxSetting } from '@model/Settings';
import { Receipt, Plus, Edit2, Check, X } from 'lucide-react';

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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Pajak & Biaya Layanan</h1>
          <p className="text-xs text-slate-500 mt-0.5">Atur persentase PB1 Resto, PPN, dan Service Charge pada struk kasir.</p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2 bg-[#0D5C53] hover:bg-[#094740] text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Pajak / Biaya</span>
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-3.5 px-4">Nama Pajak / Biaya</th>
              <th className="py-3.5 px-4">Kode</th>
              <th className="py-3.5 px-4">Tarif (%)</th>
              <th className="py-3.5 px-4">Termasuk di Harga Menu</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {taxes.map((tax) => (
              <tr key={tax.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="py-3.5 px-4 font-bold text-slate-900">{tax.name}</td>
                <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">{tax.code}</td>
                <td className="py-3.5 px-4 font-bold text-[#0D5C53] text-sm">{tax.rate}%</td>
                <td className="py-3.5 px-4 font-medium text-slate-600">
                  {tax.isIncludedInPrice ? 'Ya (Harga Netto)' : 'Tidak (Ditambahkan di Total)'}
                </td>
                <td className="py-3.5 px-4">
                  <button
                    onClick={() => handleToggleActive(tax.id)}
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                      tax.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {tax.isActive ? <Check className="w-3 h-3" /> : null}
                    {tax.isActive ? 'Aktif' : 'Non-Aktif'}
                  </button>
                </td>
                <td className="py-3.5 px-4 text-right">
                  <button
                    onClick={() => handleOpenEdit(tax)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingTax ? 'Edit Pajak / Biaya' : 'Tambah Pajak Baru'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="py-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Pajak / Biaya</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Pajak Resto PB1"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kode</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="PB1"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tarif (%)</label>
                  <input
                    type="number"
                    required
                    value={formData.rate}
                    onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                    placeholder="10"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isIncluded"
                  checked={formData.isIncludedInPrice}
                  onChange={(e) => setFormData({ ...formData, isIncludedInPrice: e.target.checked })}
                  className="w-4 h-4 text-[#0D5C53] rounded"
                />
                <label htmlFor="isIncluded" className="text-slate-700 font-medium cursor-pointer">
                  Sudah termasuk dalam harga produk
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-[#0D5C53] rounded"
                />
                <label htmlFor="isActive" className="text-slate-700 font-medium cursor-pointer">
                  Aktifkan di transaksi kasir
                </label>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#0D5C53] hover:bg-[#094740] text-white font-semibold rounded-xl cursor-pointer shadow-xs"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

