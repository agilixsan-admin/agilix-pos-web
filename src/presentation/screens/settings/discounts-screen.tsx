import React, { useState } from 'react';
import type { DiscountSetting } from '@model/Settings';
import { BadgePercent, Plus, Edit2, Check, X, Trash2 } from 'lucide-react';

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

  const handleDelete = (id: string) => {
    if (!confirm('Hapus promo diskon ini?')) return;
    setDiscounts(discounts.filter((d) => d.id !== id));
  };

  const handleToggleActive = (id: string) => {
    setDiscounts(discounts.map((d) => (d.id === id ? { ...d, isActive: !d.isActive } : d)));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Manajemen Diskon & Promo</h1>
          <p className="text-xs text-slate-500 mt-0.5">Atur potongan harga persentase, voucher nominal, dan promo kasir.</p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2 bg-[#0D5C53] hover:bg-[#094740] text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Diskon</span>
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-3.5 px-4">Nama Promo</th>
              <th className="py-3.5 px-4">Kode Promo</th>
              <th className="py-3.5 px-4">Nilai Potongan</th>
              <th className="py-3.5 px-4">Min. Pembelian</th>
              <th className="py-3.5 px-4">Maks. Diskon</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {discounts.map((d) => (
              <tr key={d.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="py-3.5 px-4 font-bold text-slate-900">{d.name}</td>
                <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">{d.code || '-'}</td>
                <td className="py-3.5 px-4 font-bold text-[#0D5C53]">
                  {d.type === 'PERCENTAGE' ? `${d.value}%` : `Rp ${d.value.toLocaleString('id-ID')}`}
                </td>
                <td className="py-3.5 px-4 text-slate-600">
                  {d.minPurchase ? `Rp ${d.minPurchase.toLocaleString('id-ID')}` : 'Tanpa Min.'}
                </td>
                <td className="py-3.5 px-4 text-slate-600">
                  {d.maxDiscount ? `Rp ${d.maxDiscount.toLocaleString('id-ID')}` : 'Tanpa Batas'}
                </td>
                <td className="py-3.5 px-4">
                  <button
                    onClick={() => handleToggleActive(d.id)}
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                      d.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {d.isActive ? <Check className="w-3 h-3" /> : null}
                    {d.isActive ? 'Aktif' : 'Non-Aktif'}
                  </button>
                </td>
                <td className="py-3.5 px-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(d)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(d.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
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
                {editingDiscount ? 'Edit Diskon' : 'Tambah Diskon Baru'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="py-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Diskon / Promo</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Diskon Member 10%"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'PERCENTAGE' })}
                  className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    formData.type === 'PERCENTAGE' ? 'bg-white text-[#0D5C53] shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Persentase (%)
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'FIXED' })}
                  className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    formData.type === 'FIXED' ? 'bg-white text-[#0D5C53] shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Nominal (Rp)
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nilai Potongan</label>
                  <input
                    type="number"
                    required
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    placeholder={formData.type === 'PERCENTAGE' ? '10' : '15000'}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kode Voucher (Opsional)</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="PROMO10"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Min. Belanja (Rp)</label>
                  <input
                    type="number"
                    value={formData.minPurchase}
                    onChange={(e) => setFormData({ ...formData, minPurchase: e.target.value })}
                    placeholder="0"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Maks. Diskon (Rp)</label>
                  <input
                    type="number"
                    value={formData.maxDiscount}
                    onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
                    placeholder="Opsional"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53]"
                  />
                </div>
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
                  Simpan Diskon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

