import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  Plus,
  Search,
  Building,
  Users,
  Eye,
  Edit2,
  Trash2,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Shield,
  Lock,
} from 'lucide-react';
import { useAuthStore } from '@domain/state/auth-store';
import {
  useRoles,
  useOutlets,
  useUsers,
  useDeleteRoleMutation,
} from '@domain/hooks';
import type { Role, UserManagementItem } from '@model/Settings';
import {
  Card,
  Badge,
  Button,
  SearchInput,
  FormSelect,
  LoadingState,
  EmptyState,
  Modal,
} from '@presentation/components/ui';

export const RolesScreen: React.FC = () => {
  const navigate = useNavigate();
  const currentOutlet = useAuthStore((state) => state.currentOutlet);

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOutletFilter, setSelectedOutletFilter] = useState<string>('ALL');

  // Queries
  const { data: outlets = [] } = useOutlets();
  const effectiveOutletId = selectedOutletFilter !== 'ALL' ? selectedOutletFilter : undefined;
  const { data: roles = [], isLoading } = useRoles(
    effectiveOutletId ? { outletId: effectiveOutletId } : undefined
  );
  const { data: usersResponse } = useUsers();
  const allUsers = usersResponse?.data || [];

  // Mutations
  const deleteRoleMutation = useDeleteRoleMutation();

  // Delete / Protection Modal State
  const [selectedRoleForDelete, setSelectedRoleForDelete] = useState<Role | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState('');

  // Map user counts per roleId
  const userCountMap = useMemo(() => {
    const map = new Map<string, number>();
    allUsers.forEach((u) => {
      const rId = u.roleId || u.role?.id;
      if (rId) {
        map.set(rId, (map.get(rId) || 0) + 1);
      }
    });
    return map;
  }, [allUsers]);

  // Filtered Roles
  const filteredRoles = useMemo(() => {
    return roles.filter((r) => {
      const matchesSearch =
        !searchTerm ||
        r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.description && r.description.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesOutlet =
        selectedOutletFilter === 'ALL' || r.outletId === selectedOutletFilter;

      return matchesSearch && matchesOutlet;
    });
  }, [roles, searchTerm, selectedOutletFilter]);

  // Handle Delete Click
  const handleDeleteClick = (role: Role) => {
    setSelectedRoleForDelete(role);
    setDeleteErrorMessage('');
    setIsDeleteModalOpen(true);
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!selectedRoleForDelete) return;
    try {
      setDeleteErrorMessage('');
      await deleteRoleMutation.mutateAsync(selectedRoleForDelete.id);
      setIsDeleteModalOpen(false);
      setSelectedRoleForDelete(null);
    } catch (err: any) {
      setDeleteErrorMessage(
        err?.response?.data?.message || err?.message || 'Gagal menghapus role'
      );
    }
  };

  const assignedUsersCount = selectedRoleForDelete
    ? userCountMap.get(selectedRoleForDelete.id) || 0
    : 0;

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto">
      {/* Top Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Link to="/settings/outlets" className="hover:text-[#0D5C53]">
              Pengaturan
            </Link>
            <span>/</span>
            <span className="text-slate-800 font-semibold">Roles & Permissions</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight mt-0.5">
            Roles
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Atur peran staf, wewenang hak akses menu, serta proteksi operasional kasir.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => navigate('/settings/roles/create')}
          >
            Buat Role
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <Card padding="sm" className="bg-white">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-center">
          <div className="lg:col-span-3">
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              onClear={() => setSearchTerm('')}
              placeholder="Cari nama role, deskripsi wewenang..."
            />
          </div>

          <div>
            <FormSelect
              value={selectedOutletFilter}
              onChange={(e) => setSelectedOutletFilter(e.target.value)}
            >
              <option value="ALL">Semua Outlet Cabang</option>
              {outlets.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </FormSelect>
          </div>
        </div>
      </Card>

      {/* Roles Table Card */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4 w-[32%]">Nama Role</th>
                <th className="py-3.5 px-4 w-[22%]">Outlet</th>
                <th className="py-3.5 px-4 w-[16%] text-center">Pengguna</th>
                <th className="py-3.5 px-4 w-[14%] text-center">Status</th>
                <th className="py-3.5 px-4 w-[16%] text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5}>
                    <LoadingState message="Memuat daftar role & hak akses..." />
                  </td>
                </tr>
              ) : filteredRoles.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState
                      icon={<ShieldCheck className="w-8 h-8 opacity-30 mx-auto text-[#0D5C53]" />}
                      title="Belum ada role terdaftar"
                      description={
                        searchTerm || selectedOutletFilter !== 'ALL'
                          ? 'Tidak ada role yang cocok dengan filter pencarian.'
                          : 'Buat role baru untuk membatasi hak akses modul staf kasir & manajer.'
                      }
                      action={
                        !searchTerm && selectedOutletFilter === 'ALL' ? (
                          <Button
                            variant="primary"
                            size="sm"
                            leftIcon={<Plus className="w-3.5 h-3.5" />}
                            onClick={() => navigate('/settings/roles/create')}
                          >
                            Buat Role Baru
                          </Button>
                        ) : undefined
                      }
                    />
                  </td>
                </tr>
              ) : (
                filteredRoles.map((role) => {
                  const userCount = userCountMap.get(role.id) || 0;
                  const permissionsCount =
                    role.menuAccess?.length || role.permissions?.length || 0;

                  return (
                    <tr
                      key={role.id}
                      className="hover:bg-slate-50/60 transition-colors group cursor-pointer"
                      onClick={() => navigate(`/settings/roles/${role.id}`)}
                    >
                      {/* Name & Avatar */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-[#0D5C53] shrink-0 mt-0.5">
                            <Shield className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-xs">
                              {role.name}
                            </div>
                            <p className="text-slate-500 text-[11px] line-clamp-1 mt-0.5">
                              {role.description || `${permissionsCount} modul izin akses`}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Outlet */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <Building className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-medium text-xs">
                            {role.outlet?.name || 'Semua Cabang'}
                          </span>
                        </div>
                      </td>

                      {/* Users Count */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-semibold">
                          <Users className="w-3 h-3 text-slate-500" />
                          {userCount} {userCount === 1 ? 'Pengguna' : 'Pengguna'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <Badge
                          variant={role.status === 'ACTIVE' ? 'success' : 'neutral'}
                          size="sm"
                          dot
                        >
                          {role.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div
                          className="flex items-center justify-end gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Link to={`/settings/roles/${role.id}`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Lihat Detail"
                              className="text-[#0D5C53] hover:bg-[#0D5C53]/10 px-2"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
                          </Link>

                          <Link to={`/settings/roles/${role.id}/edit`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Edit Role"
                              className="text-slate-600 hover:bg-slate-100 px-2"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </Button>
                          </Link>

                          <Button
                            variant="ghost"
                            size="sm"
                            title="Hapus Role"
                            className="text-rose-600 hover:bg-rose-50 px-2"
                            onClick={() => handleDeleteClick(role)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ========================================================================= */}
      {/* DELETION MODAL (With Deletion Protection matching Figma Screen 5)          */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title={
          assignedUsersCount > 0
            ? 'Role Tidak Dapat Dihapus'
            : 'Konfirmasi Hapus Role'
        }
        maxWidth="md"
      >
        {selectedRoleForDelete && (
          <div className="space-y-4">
            {assignedUsersCount > 0 ? (
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
                    Role <strong>{selectedRoleForDelete.name}</strong> saat ini sedang digunakan oleh{' '}
                    <span className="font-bold text-rose-600">{assignedUsersCount} pengguna aktif</span>.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 text-left">
                  <p className="text-[11px] leading-relaxed text-slate-500">
                    💡 <strong>Solusi:</strong> Ubah role pengguna yang bersangkutan ke role lain di menu{' '}
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
              /* Safe to Delete Confirmation View */
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    Apakah Anda yakin ingin menghapus role <strong>{selectedRoleForDelete.name}</strong>?
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
        )}
      </Modal>
    </div>
  );
};
