import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Shield,
  Edit2,
  Trash2,
  Building,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  AlertTriangle,
  Lock,
  UserCheck,
  ExternalLink,
} from 'lucide-react';
import {
  useRoleDetail,
  usePermissionsCatalog,
  useUsers,
  useDeleteRoleMutation,
} from '@domain/hooks';
import type { PermissionGroup } from '@model/Settings';
import {
  Card,
  Badge,
  Button,
  LoadingState,
  EmptyState,
  Modal,
} from '@presentation/components/ui';

// Fallback Permission Catalog
const DEFAULT_PERMISSION_GROUPS: PermissionGroup[] = [
  {
    groupKey: 'transaksi',
    groupTitle: 'POS & Transaksi Kasir',
    description: 'Akses menu kasir POS, pesanan, pembayaran, dan riwayat transaksi',
    subGroups: [
      {
        key: 'pos',
        title: 'POS & Kasir',
        permissions: [
          { code: 'order.read', name: 'Lihat Pesanan & Menu POS', description: 'Melihat antrean pesanan dan menu POS', action: 'read' },
          { code: 'order.create', name: 'Buat Pesanan Baru', description: 'Membuat pesanan baru di kasir POS', action: 'create' },
          { code: 'order.update', name: 'Ubah / Edit Pesanan', description: 'Mengubah item atau catatan pesanan', action: 'update' },
          { code: 'order.void', name: 'Void / Batalkan Pesanan', description: 'Membatalkan item atau seluruh pesanan', action: 'void' },
          { code: 'order.void.approve', name: 'Otorisasi Persetujuan Void', description: 'Menyetujui pembatalan menu dengan password atasan', action: 'approve' },
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
    description: 'Pengelolaan bahan baku, kemasan, supplier, pembelian, opname, dan adjustment',
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

export const RoleDetailScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Queries
  const { data: role, isLoading, error } = useRoleDetail(id);
  const { data: catalogGroups = [] } = usePermissionsCatalog();
  const { data: usersResponse } = useUsers();
  const allUsers = usersResponse?.data || [];

  // Mutations
  const deleteRoleMutation = useDeleteRoleMutation();

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState('');

  // Active Groups
  const permissionGroups: PermissionGroup[] = useMemo(() => {
    return catalogGroups.length > 0 ? catalogGroups : DEFAULT_PERMISSION_GROUPS;
  }, [catalogGroups]);

  // Users assigned to this role
  const assignedUsers = useMemo(() => {
    if (!id) return [];
    return allUsers.filter((u) => u.roleId === id || u.role?.id === id);
  }, [allUsers, id]);

  // Role permissions set
  const rolePermissions = useMemo(() => {
    return new Set(role?.menuAccess || role?.permissions || []);
  }, [role]);

  // Format Date
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const handleConfirmDelete = async () => {
    if (!id) return;
    try {
      setDeleteErrorMessage('');
      await deleteRoleMutation.mutateAsync(id);
      setIsDeleteModalOpen(false);
      navigate('/settings/roles');
    } catch (err: any) {
      setDeleteErrorMessage(
        err?.response?.data?.message || err?.message || 'Gagal menghapus role'
      );
    }
  };

  if (isLoading) {
    return (
      <div className="py-20">
        <LoadingState message="Memuat detail role & wewenang hak akses..." />
      </div>
    );
  }

  if (error || !role) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <EmptyState
          icon={<AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />}
          title="Role Tidak Ditemukan"
          description="Data role tidak ditemukan atau telah dihapus."
          action={
            <Button variant="primary" onClick={() => navigate('/settings/roles')}>
              Kembali ke Daftar Roles
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-24">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/settings/roles')}
            className="p-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-slate-600 transition-colors shadow-xs cursor-pointer"
            title="Kembali ke Daftar Role"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Link to="/settings/roles" className="hover:text-[#0D5C53]">
                Roles
              </Link>
              <span>/</span>
              <span className="text-slate-800 font-semibold">{role.name}</span>
            </div>
            <div className="flex items-center gap-2.5 mt-0.5">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                {role.name}
              </h1>
              <Badge variant={role.status === 'ACTIVE' ? 'success' : 'neutral'} dot>
                {role.status === 'ACTIVE' ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Dibuat pada: {formatDate(role.createdAt)} • Outlet: {role.outlet?.name || 'Semua Cabang'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            className="text-rose-600 border-rose-200 hover:bg-rose-50"
            leftIcon={<Trash2 className="w-3.5 h-3.5" />}
            onClick={() => setIsDeleteModalOpen(true)}
          >
            Hapus Role
          </Button>

          <Button
            variant="primary"
            size="sm"
            leftIcon={<Edit2 className="w-3.5 h-3.5" />}
            onClick={() => navigate(`/settings/roles/${role.id}/edit`)}
          >
            Edit Role
          </Button>
        </div>
      </div>

      {/* Main 2-Column Layout (Matching Figma Screen 3) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Role Details & Assigned Users */}
        <div className="lg:col-span-4 space-y-6">
          {/* Card: Role Details */}
          <Card header={<h3 className="text-sm font-bold text-slate-900">Role Details</h3>}>
            <div className="space-y-4 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">NAMA ROLE</span>
                <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                  {role.name}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block font-medium">DESKRIPSI WEWENANG</span>
                <p className="text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100 mt-1 leading-relaxed">
                  {role.description || 'Tidak ada deskripsi wewenang tambahan.'}
                </p>
              </div>

              <div>
                <span className="text-slate-400 block font-medium">PENUGASAN OUTLET</span>
                <div className="flex items-center gap-1.5 font-semibold text-slate-800 mt-1">
                  <Building className="w-4 h-4 text-slate-400" />
                  <span>{role.outlet?.name || 'Semua Outlet Cabang'}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <span className="text-slate-400 block font-medium">TOTAL HAK AKSES</span>
                <span className="font-mono font-bold text-sm text-[#0D5C53] mt-0.5 block">
                  {rolePermissions.size} Izin Akses Aktif
                </span>
              </div>
            </div>
          </Card>

          {/* Card: Assigned Users */}
          <Card
            header={
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">Pengguna Terdaftar</h3>
                <Badge variant="info" size="sm">
                  {assignedUsers.length} Pengguna
                </Badge>
              </div>
            }
          >
            <div className="space-y-3">
              {assignedUsers.length === 0 ? (
                <div className="text-center py-4 text-slate-400 text-xs">
                  <Users className="w-8 h-8 opacity-30 mx-auto mb-1 text-slate-400" />
                  <span>Belum ada karyawan yang ditugaskan ke role ini.</span>
                </div>
              ) : (
                assignedUsers.map((u) => (
                  <div
                    key={u.id}
                    className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-teal-100 text-[#0D5C53] flex items-center justify-center font-bold text-[11px]">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 block">{u.name}</span>
                        <span className="text-[11px] text-slate-500 font-mono block">
                          {u.email}
                        </span>
                      </div>
                    </div>

                    <Badge
                      variant={u.status === 'ACTIVE' || u.isActive ? 'success' : 'neutral'}
                      size="sm"
                    >
                      {u.status === 'ACTIVE' || u.isActive ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Menu Access Permissions (Matching Figma Screen 3) */}
        <div className="lg:col-span-8 space-y-4">
          <Card
            header={
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Menu Access Permissions
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Rincian izin hak akses modul yang aktif untuk role {role.name}.
                  </p>
                </div>

                <Badge variant="success" size="sm">
                  {rolePermissions.size} Fitur Diizinkan
                </Badge>
              </div>
            }
          >
            <div className="space-y-5">
              {permissionGroups.map((group) => {
                const activeInGroup = group.subGroups.flatMap((sub) =>
                  sub.permissions.filter((p) => rolePermissions.has(p.code))
                );

                if (activeInGroup.length === 0) return null;

                return (
                  <div
                    key={group.groupKey}
                    className="rounded-xl border border-slate-200 bg-white overflow-hidden"
                  >
                    {/* Module Title */}
                    <div className="p-3 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-900 text-xs block">
                          {group.groupTitle}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {group.description}
                        </span>
                      </div>
                      <span className="text-[11px] font-semibold text-emerald-700 font-mono">
                        {activeInGroup.length} Izin
                      </span>
                    </div>

                    {/* Permissions Grid */}
                    <div className="p-3.5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {activeInGroup.map((perm) => (
                        <div
                          key={perm.code}
                          className="p-3 rounded-xl border border-emerald-100 bg-emerald-50/30 flex items-start gap-2.5"
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <div className="space-y-0.5">
                            <span className="font-bold text-slate-900 text-xs block">
                              {perm.name}
                            </span>
                            <p className="text-[11px] text-slate-600 leading-snug">
                              {perm.description}
                            </p>
                            <span className="text-[10px] font-mono text-slate-400 block pt-0.5">
                              {perm.code}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>

      {/* Delete / Protection Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title={
          assignedUsers.length > 0
            ? 'Role Tidak Dapat Dihapus'
            : 'Konfirmasi Hapus Role'
        }
        maxWidth="md"
      >
        <div className="space-y-4">
          {assignedUsers.length > 0 ? (
            /* Deletion Protection View (Figma Screen 5) */
            <div className="space-y-4 text-center py-2">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600 mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>

              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-900">
                  Cannot Delete Role
                </h4>
                <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                  Role <strong>{role.name}</strong> saat ini sedang digunakan oleh{' '}
                  <span className="font-bold text-rose-600">{assignedUsers.length} pengguna aktif</span>.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 text-left">
                <p className="text-[11px] leading-relaxed text-slate-500">
                  💡 <strong>Solusi:</strong> Pindahkan pengguna tersebut ke role lain di menu{' '}
                  <Link to="/settings/users" className="text-[#0D5C53] font-semibold hover:underline">
                    Manajemen Pengguna
                  </Link>{' '}
                  terlebih dahulu sebelum menghapus role ini.
                </p>
              </div>

              <div className="flex justify-center pt-2">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  className="px-6"
                  onClick={() => setIsDeleteModalOpen(false)}
                >
                  Mengerti
                </Button>
              </div>
            </div>
          ) : (
            /* Safe to Delete View */
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Apakah Anda yakin ingin menghapus role <strong>{role.name}</strong>?
                  Tindakan ini permanen dan tidak dapat dibatalkan.
                </p>
              </div>

              {deleteErrorMessage && (
                <div className="p-3 rounded-lg bg-rose-100 text-rose-900 text-xs font-medium">
                  {deleteErrorMessage}
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsDeleteModalOpen(false)}
                >
                  Batal
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  isLoading={deleteRoleMutation.isPending}
                  onClick={handleConfirmDelete}
                >
                  Hapus Role
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

