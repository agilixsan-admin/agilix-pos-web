import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Shield,
  CheckCircle2,
  AlertCircle,
  Building,
  CheckSquare,
  Square,
  ChevronDown,
  ChevronUp,
  LayoutDashboard,
  Utensils,
  Boxes,
  ShoppingBag,
  Receipt,
  BarChart3,
  Settings,
  Layers,
} from 'lucide-react';
import { useAuthStore } from '@domain/state/auth-store';
import {
  useOutlets,
  usePermissionsCatalog,
  useCreateRoleMutation,
} from '@domain/hooks';
import type { PermissionGroup } from '@model/Settings';
import {
  Card,
  Badge,
  Button,
  FormInput,
  FormSelect,
  FormTextarea,
  LoadingState,
} from '@presentation/components/ui';

// Fallback Permission Groups if backend permissions catalog is still loading
const DEFAULT_PERMISSION_GROUPS: PermissionGroup[] = [
  {
    groupKey: 'transaksi',
    groupTitle: 'POS & Transaksi Kasir',
    description: 'Akses menu kasir POS, input pesanan, proses pembayaran, dan riwayat transaksi',
    subGroups: [
      {
        key: 'pos',
        title: 'POS & Kasir',
        permissions: [
          { code: 'order.read', name: 'Lihat Pesanan & Menu POS', description: 'Melihat antrean pesanan dan menu POS', action: 'read' },
          { code: 'order.create', name: 'Buat Pesanan Baru', description: 'Membuat pesanan baru di kasir POS', action: 'create' },
          { code: 'order.update', name: 'Ubah / Edit Pesanan', description: 'Mengubah item atau catatan pesanan', action: 'update' },
          { code: 'order.void', name: 'Void / Batalkan Pesanan', description: 'Membatalkan item atau seluruh pesanan', action: 'void' },
          { code: 'payment.create', name: 'Proses Pembayaran (Cash / QRIS)', description: 'Menerima pembayaran tunai atau QRIS', action: 'create' },
          { code: 'transaction.read', name: 'Lihat Riwayat Transaksi', description: 'Melihat struk dan rekap transaksi', action: 'read' },
        ],
      },
    ],
  },
  {
    groupKey: 'produk',
    groupTitle: 'Katalog Produk & Resep',
    description: 'Pengelolaan daftar menu, varian harga, HPP, resep bahan baku, dan kategori',
    subGroups: [
      {
        key: 'product',
        title: 'Produk & Resep',
        permissions: [
          { code: 'product.read', name: 'Lihat Katalog Produk', description: 'Melihat daftar menu dan resep', action: 'read' },
          { code: 'product.create', name: 'Tambah Produk & Resep', description: 'Menambah menu baru dan resep HPP', action: 'create' },
          { code: 'product.update', name: 'Ubah Data Produk', description: 'Mengubah harga, varian, dan foto menu', action: 'update' },
          { code: 'product.delete', name: 'Hapus Produk', description: 'Menghapus produk dari katalog', action: 'delete' },
        ],
      },
    ],
  },
  {
    groupKey: 'inventori',
    groupTitle: 'Inventori & Manajemen Stok',
    description: 'Pengelolaan bahan baku, kemasan, supplier, faktur pembelian, stock opname, dan adjustment',
    subGroups: [
      {
        key: 'inventory',
        title: 'Stok & Inventori',
        permissions: [
          { code: 'inventory.read', name: 'Lihat Stok & Nilai Aset', description: 'Melihat ringkasan stok bahan baku dan kemasan', action: 'read' },
          { code: 'inventory.create', name: 'Tambah Bahan Baku / Kemasan', description: 'Menambahkan item bahan atau kemasan baru', action: 'create' },
          { code: 'inventory.update', name: 'Ubah Item Inventori', description: 'Mengubah satuan, alert minimum stok', action: 'update' },
          { code: 'inventory.delete', name: 'Hapus Item Inventori', description: 'Menghapus master bahan baku', action: 'delete' },
          { code: 'inventory.adjust', name: 'Buat Stock Adjustment', description: 'Mencatat penyesuaian stok manual (in/out)', action: 'adjust' },
          { code: 'purchase.read', name: 'Lihat Pembelian Stok', description: 'Melihat riwayat faktur pembelian', action: 'read' },
          { code: 'purchase.create', name: 'Buat Pembelian (PO)', description: 'Membuat purchase order ke supplier', action: 'create' },
          { code: 'purchase.receive', name: 'Penerimaan Barang (Receive)', description: 'Konfirmasi barang masuk dan update stok', action: 'receive' },
          { code: 'stock_opname.read', name: 'Lihat Stock Opname', description: 'Melihat sesi audit hitung fisik', action: 'read' },
          { code: 'stock_opname.create', name: 'Mulai Stock Opname', description: 'Membuat sesi penghitungan fisik baru', action: 'create' },
          { code: 'stock_opname.update', name: 'Input Hasil Hitung Fisik', description: 'Memasukkan kuantitas riil gudang', action: 'update' },
          { code: 'stock_opname.finalize', name: 'Finalisasi Stock Opname', description: 'Mengunci rekonsiliasi hasil audit stok', action: 'finalize' },
        ],
      },
    ],
  },
  {
    groupKey: 'laporan',
    groupTitle: 'Laporan & Analitik',
    description: 'Analisis omzet penjualan harian, laba rugi kotor/bersih, COGS, dan mutasi stok',
    subGroups: [
      {
        key: 'reports',
        title: 'Laporan Operasional',
        permissions: [
          { code: 'report.read', name: 'Lihat Semua Laporan', description: 'Mengakses laporan penjualan, profit, dan mutasi stok', action: 'read' },
        ],
      },
    ],
  },
  {
    groupKey: 'pengaturan',
    groupTitle: 'Pengaturan & Konfigurasi',
    description: 'Manajemen outlet cabang, denah meja, akun staf, role RBAC, dan printer kasir',
    subGroups: [
      {
        key: 'settings',
        title: 'Pengaturan Sistem',
        permissions: [
          { code: 'outlet.read', name: 'Lihat Profil Outlet', description: 'Melihat data informasi cabang', action: 'read' },
          { code: 'table.read', name: 'Lihat Denah Meja', description: 'Melihat status meja dine-in', action: 'read' },
          { code: 'table.update', name: 'Kelola Meja', description: 'Menambah dan mengubah posisi meja', action: 'update' },
          { code: 'user.read', name: 'Lihat Daftar Karyawan', description: 'Melihat staf yang terdaftar', action: 'read' },
          { code: 'user.create', name: 'Tambah Akun Karyawan', description: 'Mendaftarkan staf baru', action: 'create' },
          { code: 'user.update', name: 'Ubah Data Karyawan', description: 'Mengubah profil, PIN, atau role staf', action: 'update' },
          { code: 'role.read', name: 'Lihat Role & Hak Akses', description: 'Melihat daftar wewenang role', action: 'read' },
          { code: 'role.create', name: 'Buat & Kelola Role', description: 'Menambah atau mengedit wewenang role', action: 'create' },
          { code: 'printer.read', name: 'Lihat Konfigurasi Printer', description: 'Melihat printer struk kasir / dapur', action: 'read' },
          { code: 'printer.update', name: 'Kelola Printer Thermal', description: 'Menghubungkan printer bluetooth / LAN', action: 'update' },
          { code: 'audit_log.read', name: 'Lihat Audit Trail', description: 'Melihat log aktivitas operasional penting', action: 'read' },
        ],
      },
    ],
  },
];

export const RoleCreateScreen: React.FC = () => {
  const navigate = useNavigate();
  const currentOutlet = useAuthStore((state) => state.currentOutlet);

  // Queries
  const { data: outlets = [] } = useOutlets();
  const { data: catalogGroups = [], isLoading: loadingCatalog } = usePermissionsCatalog();

  // Active Groups (Backend Catalog with fallback)
  const permissionGroups: PermissionGroup[] = useMemo(() => {
    return catalogGroups.length > 0 ? catalogGroups : DEFAULT_PERMISSION_GROUPS;
  }, [catalogGroups]);

  // Mutations
  const createRoleMutation = useCreateRoleMutation();

  // Form State
  const [name, setName] = useState('');
  const [outletId, setOutletId] = useState(currentOutlet?.id || '');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([
    'order.read',
    'order.create',
    'payment.create',
    'transaction.read',
  ]);
  const [formError, setFormError] = useState('');

  // Collect all permission codes flat
  const allPermissionCodes = useMemo(() => {
    const codes: string[] = [];
    permissionGroups.forEach((group) => {
      group.subGroups.forEach((sub) => {
        sub.permissions.forEach((p) => {
          codes.push(p.code);
        });
      });
    });
    return codes;
  }, [permissionGroups]);

  // Toggle single permission
  const handleTogglePermission = (code: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  // Toggle group permissions
  const handleToggleGroup = (group: PermissionGroup) => {
    const groupCodes: string[] = [];
    group.subGroups.forEach((sub) => {
      sub.permissions.forEach((p) => groupCodes.push(p.code));
    });

    const allSelected = groupCodes.every((c) => selectedPermissions.includes(c));

    if (allSelected) {
      // Unselect all in group
      setSelectedPermissions((prev) => prev.filter((c) => !groupCodes.includes(c)));
    } else {
      // Select all in group
      setSelectedPermissions((prev) => Array.from(new Set([...prev, ...groupCodes])));
    }
  };

  // Select all permissions in entire system
  const handleSelectAll = () => {
    if (selectedPermissions.length === allPermissionCodes.length) {
      setSelectedPermissions([]);
    } else {
      setSelectedPermissions(allPermissionCodes);
    }
  };

  // Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim()) {
      setFormError('Nama role wajib diisi.');
      return;
    }

    if (!outletId) {
      setFormError('Silakan pilih outlet penugasan role.');
      return;
    }

    if (selectedPermissions.length === 0) {
      setFormError('Permission Required: Minimal pilih satu izin akses untuk role ini.');
      return;
    }

    try {
      const payload = {
        name: name.trim(),
        outletId,
        description: description.trim() || undefined,
        permissions: selectedPermissions,
        status,
      };

      const result = await createRoleMutation.mutateAsync(payload);
      navigate(`/settings/roles/${result.id}`);
    } catch (err: any) {
      setFormError(
        err?.response?.data?.message || err?.message || 'Gagal membuat role baru'
      );
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-24">
      {/* Top Header & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/settings/roles')}
          className="p-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-slate-600 transition-colors shadow-xs cursor-pointer"
          title="Kembali"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Link to="/settings/roles" className="hover:text-[#0D5C53]">
              Roles
            </Link>
            <span>/</span>
            <span className="text-slate-800 font-semibold">Buat Role</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight mt-0.5">
            Create Role
          </h1>
        </div>
      </div>

      {formError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Card 1: Role Details (Informasi Dasar) */}
        <Card header={<h3 className="text-sm font-bold text-slate-900">Detail Role</h3>}>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <FormInput
                  label="Nama Role"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Store Manager, Kasir Utama, Barista..."
                />
              </div>

              <div>
                <FormSelect
                  label="Pilih Outlet Penugasan"
                  required
                  value={outletId}
                  onChange={(e) => setOutletId(e.target.value)}
                >
                  <option value="">-- Pilih Outlet --</option>
                  {outlets.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </FormSelect>
              </div>
            </div>

            <div>
              <FormTextarea
                label="Deskripsi Wewenang (Opsional)"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Jelaskan cakupan tugas, tanggung jawab, dan batasan operasional untuk role ini..."
              />
            </div>

            {/* Status Switch */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div>
                <span className="font-bold text-slate-900 block">Status Role</span>
                <span className="text-[11px] text-slate-500">
                  Role yang aktif dapat langsung ditetapkan pada akun karyawan
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStatus((s) => (s === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'))}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    status === 'ACTIVE' ? 'bg-[#0D5C53]' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition duration-200 ease-in-out ${
                      status === 'ACTIVE' ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
                <span className="font-semibold text-slate-800 text-xs w-14">
                  {status === 'ACTIVE' ? 'Aktif' : 'Nonaktif'}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Card 2: Menu Access Permissions (Matching Figma Screen 2) */}
        <Card
          header={
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Menu Access Permissions
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Centang modul dan fitur yang diizinkan untuk diakses oleh role ini.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold text-[#0D5C53] bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-100">
                  {selectedPermissions.length} / {allPermissionCodes.length} Izin Dipilih
                </span>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                >
                  {selectedPermissions.length === allPermissionCodes.length
                    ? 'Hapus Semua'
                    : 'Pilih Semua'}
                </Button>
              </div>
            </div>
          }
        >
          <div className="space-y-5">
            {permissionGroups.map((group) => {
              const groupCodes: string[] = [];
              group.subGroups.forEach((sub) => {
                sub.permissions.forEach((p) => groupCodes.push(p.code));
              });

              const selectedInGroup = groupCodes.filter((c) =>
                selectedPermissions.includes(c)
              ).length;
              const isAllInGroupSelected =
                groupCodes.length > 0 && selectedInGroup === groupCodes.length;

              return (
                <div
                  key={group.groupKey}
                  className="rounded-xl border border-slate-200 bg-white overflow-hidden"
                >
                  {/* Group Header Bar */}
                  <div className="p-3.5 bg-slate-50/90 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => handleToggleGroup(group)}
                        className="text-[#0D5C53] hover:opacity-80 transition-opacity cursor-pointer"
                      >
                        {isAllInGroupSelected ? (
                          <CheckSquare className="w-5 h-5 text-[#0D5C53]" />
                        ) : selectedInGroup > 0 ? (
                          <div className="w-5 h-5 rounded bg-[#0D5C53]/20 border border-[#0D5C53] flex items-center justify-center">
                            <div className="w-2.5 h-1 bg-[#0D5C53] rounded-xs" />
                          </div>
                        ) : (
                          <Square className="w-5 h-5 text-slate-400" />
                        )}
                      </button>

                      <div>
                        <span className="font-bold text-slate-900 text-xs block">
                          {group.groupTitle}
                        </span>
                        <span className="text-[11px] text-slate-500 line-clamp-1">
                          {group.description}
                        </span>
                      </div>
                    </div>

                    <span className="text-[11px] font-semibold text-slate-500 font-mono">
                      {selectedInGroup} / {groupCodes.length}
                    </span>
                  </div>

                  {/* Group Permissions List */}
                  <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {group.subGroups.flatMap((sub) =>
                      sub.permissions.map((perm) => {
                        const isChecked = selectedPermissions.includes(perm.code);

                        return (
                          <label
                            key={perm.code}
                            className={`flex items-start gap-2.5 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                              isChecked
                                ? 'bg-teal-50/40 border-[#0D5C53]/40 ring-1 ring-[#0D5C53]/20 shadow-xs'
                                : 'bg-slate-50/30 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleTogglePermission(perm.code)}
                              className="mt-0.5 rounded text-[#0D5C53] focus:ring-[#0D5C53] cursor-pointer"
                            />
                            <div className="space-y-0.5">
                              <span
                                className={`text-xs font-bold block ${
                                  isChecked ? 'text-slate-900' : 'text-slate-700'
                                }`}
                              >
                                {perm.name}
                              </span>
                              <p className="text-[11px] text-slate-500 leading-snug">
                                {perm.description}
                              </p>
                              <span className="text-[10px] font-mono text-slate-400 block pt-0.5">
                                {perm.code}
                              </span>
                            </div>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Bottom Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/settings/roles')}
          >
            Batal
          </Button>

          <Button
            type="submit"
            variant="primary"
            isLoading={createRoleMutation.isPending}
            leftIcon={<CheckCircle2 className="w-4 h-4" />}
          >
            Buat Role
          </Button>
        </div>
      </form>
    </div>
  );
};

