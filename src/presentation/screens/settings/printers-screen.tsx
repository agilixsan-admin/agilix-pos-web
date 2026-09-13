import React, { useState } from 'react';
import type { PrinterSetting } from '@model/Settings';
import { Printer, Plus, Edit2, Wifi, Bluetooth, Play, Trash2 } from 'lucide-react';
import {
  Button,
  Badge,
  Card,
  Modal,
  FormInput,
  FormSelect,
  EmptyState,
} from '@presentation/components/ui';

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

  const handleToggleActive = (id: string) => {
    setPrinters(printers.map((p) => (p.id === id ? { ...p, isActive: !p.isActive } : p)));
  };

  const handleDelete = (id: string) => {
    if (!confirm('Hapus konfigurasi printer ini?')) return;
    setPrinters(printers.filter((p) => p.id !== id));
  };

  const handleTestPrint = (name: string) => {
    alert(`Mengirim tes cetak (ESC/POS) ke printer "${name}"...`);
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Printer Struk & Dapur</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Konfigurasi konektivitas printer thermal (Bluetooth, Ethernet IP, USB) untuk cetak struk kasir & tiket dapur.
          </p>
        </div>

        <Button
          variant="primary"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={handleOpenAdd}
        >
          Tambah Printer
        </Button>
      </div>

      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Nama Printer</th>
                <th className="py-3.5 px-4">Koneksi</th>
                <th className="py-3.5 px-4">Ukuran Kertas</th>
                <th className="py-3.5 px-4">Fungsi / Target</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {printers.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyState
                      icon={<Printer className="w-8 h-8 opacity-30 mx-auto" />}
                      title="Belum ada printer"
                      description='Klik tombol "+ Tambah Printer" untuk menghubungkan printer struk.'
                    />
                  </td>
                </tr>
              ) : (
                printers.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        <Printer className="w-4 h-4 text-slate-400" />
                        <span>{p.name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 font-medium text-slate-700">
                        {p.type === 'BLUETOOTH' ? (
                          <Bluetooth className="w-3.5 h-3.5 text-blue-500" />
                        ) : (
                          <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                        )}
                        <span>{p.type} {p.ipAddress ? `(${p.ipAddress})` : ''}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-600">
                      {p.paperWidth}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant="neutral">
                        {p.targetRole === 'RECEIPT'
                          ? 'Kasir / Struk'
                          : p.targetRole === 'KITCHEN'
                          ? 'Dapur / Makanan'
                          : 'Bar / Minuman'}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleToggleActive(p.id)}
                        className="cursor-pointer"
                      >
                        <Badge variant={p.isActive ? 'success' : 'danger'} dot>
                          {p.isActive ? 'Aktif' : 'Nonaktif'}
                        </Badge>
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleTestPrint(p.name)}
                          leftIcon={<Play className="w-3.5 h-3.5 text-teal-600" />}
                          title="Tes Print Struk"
                        >
                          Tes
                        </Button>
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
        title={editingPrinter ? 'Edit Printer' : 'Tambah Printer Baru'}
        maxWidth="sm"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormInput
            label="Nama Printer"
            required
            autoFocus
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Contoh: Printer Kasir 1"
          />

          <FormSelect
            label="Tipe Koneksi"
            value={formData.type}
            onChange={(e) =>
              setFormData({
                ...formData,
                type: e.target.value as 'BLUETOOTH' | 'NETWORK' | 'USB',
              })
            }
          >
            <option value="BLUETOOTH">Bluetooth Thermal</option>
            <option value="NETWORK">Ethernet LAN / WiFi (TCP/IP)</option>
            <option value="USB">USB Direct</option>
          </FormSelect>

          {formData.type === 'NETWORK' && (
            <FormInput
              label="Alamat IP Printer"
              required
              value={formData.ipAddress}
              onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })}
              placeholder="192.168.1.200"
            />
          )}

          <FormSelect
            label="Ukuran Lebar Kertas"
            value={formData.paperWidth}
            onChange={(e) =>
              setFormData({
                ...formData,
                paperWidth: e.target.value as '58mm' | '80mm',
              })
            }
          >
            <option value="58mm">58 mm (Standar Portable)</option>
            <option value="80mm">80 mm (Standar Kasir & Dapur)</option>
          </FormSelect>

          <FormSelect
            label="Fungsi / Target Cetak"
            value={formData.targetRole}
            onChange={(e) =>
              setFormData({
                ...formData,
                targetRole: e.target.value as 'RECEIPT' | 'KITCHEN' | 'BAR',
              })
            }
          >
            <option value="RECEIPT">Struk Pelanggan & Kasir (Receipt)</option>
            <option value="KITCHEN">Tiket Dapur (Kitchen Order Ticket)</option>
            <option value="BAR">Tiket Bar Minuman</option>
          </FormSelect>

          <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={formData.autoCut}
              onChange={(e) => setFormData({ ...formData, autoCut: e.target.checked })}
              className="rounded-md text-[#0D5C53] focus:ring-[#0D5C53]"
            />
            <span>Auto Cutter (Potong kertas otomatis)</span>
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
