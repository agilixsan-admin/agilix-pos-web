import React, { useEffect, useState } from 'react';
import type { Table } from '@model/Settings';
import { settingsService } from '@domain/services/settings-service';
import { useAuthStore } from '@domain/state/auth-store';
import { LayoutGrid, Plus, Edit2, Trash2, Loader2, X } from 'lucide-react';

export const TablesScreen: React.FC = () => {
  const currentOutlet = useAuthStore((state) => state.currentOutlet);
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [formData, setFormData] = useState({ name: '', capacity: '4' });

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
      alert((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Gagal menyimpan meja.');
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Manajemen Meja Dine-In</h1>
          <p className="text-xs text-slate-500 mt-0.5">Kelola denah nomor meja & kapasitas kursi untuk pesanan makan di tempat.</p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2 bg-[#0D5C53] hover:bg-[#094740] text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Meja</span>
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#0D5C53]" />
            <span>Memuat data meja...</span>
          </div>
        ) : tables.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 bg-white border border-slate-200 rounded-2xl">
            <LayoutGrid className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="font-semibold text-slate-600">Belum ada meja</p>
          </div>
        ) : (
          tables.map((table) => (
            <div
              key={table.id}
              className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between shadow-xs hover:border-[#0D5C53]/40 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      table.status === 'OCCUPIED' ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                  />
                  <span className="text-[10px] text-slate-400 font-medium">{table.capacity} Kursi</span>
                </div>
                <h4 className="font-bold text-slate-900 text-base">Meja {table.name}</h4>
                <span
                  className={`text-[10px] font-semibold ${
                    table.status === 'OCCUPIED' ? 'text-amber-700' : 'text-emerald-700'
                  }`}
                >
                  {table.status === 'OCCUPIED' ? 'Terisi' : 'Tersedia'}
                </span>
              </div>

              <div className="flex items-center justify-end gap-1 mt-4 pt-2 border-t border-slate-100">
                <button
                  onClick={() => handleOpenEdit(table)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(table.id)}
                  className="p-1 text-slate-400 hover:text-red-600 rounded-lg cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingTable ? 'Edit Meja' : 'Tambah Meja Baru'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="py-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nomor / Nama Meja</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: 01, VIP-A"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Kapasitas Kursi</label>
                <input
                  type="number"
                  required
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  placeholder="4"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53]"
                />
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
                  Simpan Meja
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

