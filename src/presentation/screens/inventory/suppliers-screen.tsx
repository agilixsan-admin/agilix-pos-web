import React, { useEffect, useState } from 'react';
import type { Supplier } from '@model/Inventory';
import { inventoryService } from '@domain/services/inventory-service';
import { Truck, Search, Loader2 } from 'lucide-react';

export const SuppliersScreen: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await inventoryService.getSuppliers();
      setSuppliers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const rawList = Array.isArray(suppliers) ? suppliers : [];
  const filtered = rawList.filter((s) => {
    if (!s) return false;
    const nameStr = (s.name || '').toLowerCase();
    const picStr = (s.contactPerson || '').toLowerCase();
    const phoneStr = (s.phone || '').toLowerCase();
    const q = (search || '').toLowerCase();
    return nameStr.includes(q) || picStr.includes(q) || phoneStr.includes(q);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Daftar Supplier</h1>
          <p className="text-xs text-slate-500 mt-0.5">Pemasok bahan baku, packaging, dan perlengkapan outlet.</p>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari supplier / kontak..."
            className="bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53] w-64"
          />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-3.5 px-4">Nama Supplier</th>
              <th className="py-3.5 px-4">Kontak Person (PIC)</th>
              <th className="py-3.5 px-4">No. Telepon / WA</th>
              <th className="py-3.5 px-4">Email</th>
              <th className="py-3.5 px-4">Alamat</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#0D5C53]" />
                  <span>Memuat supplier...</span>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-400">
                  <Truck className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="font-semibold text-slate-600">Belum ada supplier</p>
                </td>
              </tr>
            ) : (
              filtered.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900">{s.name}</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-800">{s.contactPerson || '-'}</td>
                  <td className="py-3.5 px-4 text-slate-700 font-mono text-[11px]">{s.phone || '-'}</td>
                  <td className="py-3.5 px-4 text-slate-500">{s.email || '-'}</td>
                  <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">{s.address || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

