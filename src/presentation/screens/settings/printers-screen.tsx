import React, { useState } from 'react';
import type { PrinterSetting } from '@model/Settings';
import { Printer, Plus, Edit2, Check, X, Wifi, Bluetooth, Play, Trash2 } from 'lucide-react';

export const PrintersScreen: React.FC = () => {
  const [printers, setPrinters] = useState<PrinterSetting[]>([
    {
      id: '1',
      name: 'Printer Kasir Utama',
      type: 'BLUETOOTH',
      paperWidth: '58mm',
      targetRole: 'RECEIPT',
      autoCut: true,
      isActive: true,
    },
    {
      id: '2',
      name: 'Printer Dapur (Kitchen)',
      type: 'NETWORK',
      paperWidth: '80mm',
      ipAddress: '192.168.1.200',
      targetRole: 'KITCHEN',
      autoCut: true,
      isActive: true,
    },
    {
      id: '3',
      name: 'Printer Bar Minuman',
      type: 'NETWORK',
      paperWidth: '58mm',
      ipAddress: '192.168.1.201',
      targetRole: 'BAR',
      autoCut: false,
      isActive: false,
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPrinter, setEditingPrinter] = useState<PrinterSetting | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'BLUETOOTH' as 'BLUETOOTH' | 'NETWORK' | 'USB',
    paperWidth: '58mm' as '58mm' | '80mm',
    ipAddress: '',
    targetRole: 'RECEIPT' as 'RECEIPT' | 'KITCHEN' | 'BAR',
    autoCut: true,
    isActive: true,
  });

  const handleOpenAdd = () => {
    setEditingPrinter(null);
    setFormData({
      name: '',
      type: 'BLUETOOTH',
      paperWidth: '58mm',
      ipAddress: '',
      targetRole: 'RECEIPT',
      autoCut: true,
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: PrinterSetting) => {
    setEditingPrinter(p);
    setFormData({
      name: p.name,
      type: p.type,
      paperWidth: p.paperWidth,
      ipAddress: p.ipAddress || '',
      targetRole: p.targetRole,
      autoCut: p.autoCut,
      isActive: p.isActive,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPrinter) {
      setPrinters(
        printers.map((p) =>
          p.id === editingPrinter.id
            ? {
                ...p,
                ...formData,
              }
            : p
        )
      );
    } else {
      const newPrinter: PrinterSetting = {
        id: Date.now().toString(),
        ...formData,
      };
      setPrinters([...printers, newPrinter]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (!confirm('Hapus konfigurasi printer ini?')) return;
    setPrinters(printers.filter((p) => p.id !== id));
  };

  const handleTestPrint = (printer: PrinterSetting) => {
    alert(`Mengirim perintah Test Print Thermal ke [${printer.name}] (${printer.type} - ${printer.paperWidth})...`);
  };

  const handleToggleActive = (id: string) => {
    setPrinters(printers.map((p) => (p.id === id ? { ...p, isActive: !p.isActive } : p)));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Manajemen Printer Thermal</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Konfigurasi koneksi Bluetooth ESC/POS dan Network IP Printer untuk Kasir, Dapur, & Bar.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2 bg-[#0D5C53] hover:bg-[#094740] text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Printer</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {printers.map((printer) => (
          <div
            key={printer.id}
            className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-[#0D5C53]/40 transition-colors"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl bg-[#E6F4F1] flex items-center justify-center text-[#0D5C53]">
                  {printer.type === 'BLUETOOTH' ? <Bluetooth className="w-5 h-5" /> : <Wifi className="w-5 h-5" />}
                </div>
                <button
                  onClick={() => handleToggleActive(printer.id)}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full cursor-pointer transition-colors ${
                    printer.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {printer.isActive ? 'Aktif' : 'Non-Aktif'}
                </button>
              </div>

              <h3 className="font-bold text-slate-900 text-sm">{printer.name}</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Peruntukan: <strong className="text-slate-700">{printer.targetRole}</strong>
              </p>

              <div className="mt-3 bg-slate-50 p-3 rounded-xl space-y-1 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Koneksi</span>
                  <span className="font-semibold text-slate-800">{printer.type}</span>
                </div>
                <div className="flex justify-between">
                  <span>Ukuran Kertas</span>
                  <span className="font-semibold text-slate-800">{printer.paperWidth}</span>
                </div>
                {printer.ipAddress && (
                  <div className="flex justify-between font-mono text-[11px]">
                    <span>IP Address</span>
                    <span>{printer.ipAddress}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Auto Cutter</span>
                  <span className="font-semibold text-slate-800">{printer.autoCut ? 'Ya' : 'Tidak'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
              <button
                onClick={() => handleTestPrint(printer)}
                className="flex items-center gap-1.5 text-xs font-semibold text-[#0D5C53] hover:underline cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Test Print</span>
              </button>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleOpenEdit(printer)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(printer.id)}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingPrinter ? 'Edit Printer' : 'Tambah Printer Baru'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="py-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Printer</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Printer Kasir Depan"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tipe Koneksi</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53]"
                  >
                    <option value="BLUETOOTH">Bluetooth</option>
                    <option value="NETWORK">LAN / WiFi (IP)</option>
                    <option value="USB">USB Cable</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Lebar Kertas</label>
                  <select
                    value={formData.paperWidth}
                    onChange={(e) => setFormData({ ...formData, paperWidth: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53]"
                  >
                    <option value="58mm">58 mm (Standard)</option>
                    <option value="80mm">80 mm (Wide)</option>
                  </select>
                </div>
              </div>

              {formData.type === 'NETWORK' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">IP Address Printer</label>
                  <input
                    type="text"
                    required
                    value={formData.ipAddress}
                    onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })}
                    placeholder="192.168.1.200"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53]"
                  />
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Peruntukan Cetak</label>
                <select
                  value={formData.targetRole}
                  onChange={(e) => setFormData({ ...formData, targetRole: e.target.value as any })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53]"
                >
                  <option value="RECEIPT">Struk Pembayaran (Kasir)</option>
                  <option value="KITCHEN">Tiket Dapur (Kitchen Order)</option>
                  <option value="BAR">Tiket Bar (Drink Order)</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="autoCut"
                  checked={formData.autoCut}
                  onChange={(e) => setFormData({ ...formData, autoCut: e.target.checked })}
                  className="w-4 h-4 text-[#0D5C53] rounded"
                />
                <label htmlFor="autoCut" className="text-slate-700 font-medium cursor-pointer">
                  Aktifkan Auto-Cutter Kertas
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
                  Simpan Printer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

