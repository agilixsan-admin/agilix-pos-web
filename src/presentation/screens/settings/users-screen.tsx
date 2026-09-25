import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { UserItem } from '@model/Settings';
import {
  useUsers,
  useRoles,
  useOutlets,
  useResendInvitationMutation,
  useDeleteUserMutation,
} from '@domain/hooks';
import {
  Users,
  Plus,
  Search,
  RotateCcw,
  Eye,
  Edit2,
  Mail,
  UserX,
  AlertTriangle,
  CheckCircle2,
  Building2,
  Shield,
  Crown,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
} from 'lucide-react';
import {
  Button,
  Badge,
  Card,
  Modal,
  LoadingState,
  EmptyState,
  CustomSelect,
  toast,
} from '@presentation/components/ui';

export const UsersScreen: React.FC = () => {
  const navigate = useNavigate();

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOutlet, setSelectedOutlet] = useState('ALL');
  const [selectedRole, setSelectedRole] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modals & action states
  const [deactivatingUser, setDeactivatingUser] = useState<UserItem | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [activeActionMenuId, setActiveActionMenuId] = useState<string | null>(null);

  // Queries
  const { data: outlets = [], isLoading: outletsLoading } = useOutlets();
  const { data: roles = [], isLoading: rolesLoading } = useRoles();

  const queryParams = useMemo(() => {
    return {
      page: currentPage,
      limit: pageSize,
      search: searchTerm.trim() || undefined,
      outletId: selectedOutlet !== 'ALL' ? selectedOutlet : undefined,
      roleId: selectedRole !== 'ALL' ? selectedRole : undefined,
      status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
    };
  }, [currentPage, pageSize, searchTerm, selectedOutlet, selectedRole, selectedStatus]);

  const { data: usersResponse, isLoading: usersLoading, refetch } = useUsers(queryParams);
  const users = usersResponse?.data || [];
  const meta = usersResponse?.meta || { page: 1, limit: pageSize, total: users.length, totalPages: 1 };

  const loading = usersLoading || outletsLoading || rolesLoading;

  // Mutations
  const resendInvitationMutation = useResendInvitationMutation();
  const deleteUserMutation = useDeleteUserMutation();

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedOutlet('ALL');
    setSelectedRole('ALL');
    setSelectedStatus('ALL');
    setCurrentPage(1);
  };

  const isFiltered =
    searchTerm !== '' ||
    selectedOutlet !== 'ALL' ||
    selectedRole !== 'ALL' ||
    selectedStatus !== 'ALL';

  const handleResendInvitation = async (user: UserItem) => {
    try {
      await resendInvitationMutation.mutateAsync(user.id);
      setSuccessToast(`Tautan undangan berhasil dikirim ulang ke ${user.email}`);
      setTimeout(() => setSuccessToast(null), 4000);
      setActiveActionMenuId(null);
    } catch (err: unknown) {
      toast.error(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Gagal mengirim ulang undangan.'
      );
    }
  };

  const handleConfirmDeactivate = async () => {
    if (!deactivatingUser) return;
    try {
      await deleteUserMutation.mutateAsync(deactivatingUser.id);
      setDeactivatingUser(null);
      setSuccessToast(`Pengguna ${deactivatingUser.name} berhasil dinonaktifkan.`);
      setTimeout(() => setSuccessToast(null), 4000);
      refetch();
    } catch (err: unknown) {
      toast.error(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Gagal menonaktifkan pengguna.'
      );
    }
  };

  // Avatar helper with nice color gradients
  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-amber-500 text-white',
      'bg-teal-600 text-white',
      'bg-blue-600 text-white',
      'bg-indigo-600 text-white',
      'bg-rose-500 text-white',
      'bg-emerald-600 text-white',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 bg-emerald-800 text-white px-4 py-3 rounded-xl shadow-xl text-xs font-medium animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Users</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage users, outlet assignments, roles, and account status.
          </p>
        </div>

        <Button
          variant="primary"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => navigate('/settings/users/create')}
          className="bg-[#0D5C53] hover:bg-[#09423C] text-white"
        >
          + Add User
        </Button>
      </div>

      {/* Filter Bar */}
      <Card padding="sm" className="bg-white border-slate-200 relative z-30 overflow-visible">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search users..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53] transition-all"
              />
            </div>

            {/* Outlet Filter */}
            <div className="min-w-[150px]">
              <CustomSelect
                ariaLabel="Filter Outlet"
                value={selectedOutlet}
                onChange={(val) => {
                  setSelectedOutlet(val);
                  setCurrentPage(1);
                }}
                options={[
                  { value: 'ALL', label: 'ALL OUTLETS' },
                  ...outlets.map((o) => ({
                    value: o.id,
                    label: o.name,
                  })),
                ]}
                buttonClassName="w-full bg-slate-50 border-slate-200 text-xs py-2 px-3 rounded-xl font-medium uppercase"
              />
            </div>

            {/* Role Filter */}
            <div className="min-w-[140px]">
              <CustomSelect
                ariaLabel="Filter Role"
                value={selectedRole}
                onChange={(val) => {
                  setSelectedRole(val);
                  setCurrentPage(1);
                }}
                options={[
                  { value: 'ALL', label: 'ALL ROLES' },
                  ...roles.map((r) => ({
                    value: r.id,
                    label: r.name,
                  })),
                ]}
                buttonClassName="w-full bg-slate-50 border-slate-200 text-xs py-2 px-3 rounded-xl font-medium uppercase"
              />
            </div>

            {/* Status Filter */}
            <div className="min-w-[140px]">
              <CustomSelect
                ariaLabel="Filter Status"
                value={selectedStatus}
                onChange={(val) => {
                  setSelectedStatus(val);
                  setCurrentPage(1);
                }}
                options={[
                  { value: 'ALL', label: 'STATUS: ALL' },
                  { value: 'ACTIVE', label: 'ACTIVE' },
                  { value: 'INACTIVE', label: 'INACTIVE' },
                ]}
                buttonClassName="w-full bg-slate-50 border-slate-200 text-xs py-2 px-3 rounded-xl font-medium uppercase"
              />
            </div>
          </div>

          {/* Reset Filters */}
          {isFiltered && (
            <button
              onClick={handleResetFilters}
              className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors font-medium self-start md:self-auto cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Filters
            </button>
          )}
        </div>
      </Card>

      {/* Users Table */}
      <Card padding="none" className="overflow-hidden border-slate-200 relative z-10">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4">Outlet</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4 text-center">Super Admin</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7}>
                    <LoadingState message="Memuat daftar pengguna..." />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <EmptyState
                      icon={<Users className="w-8 h-8 opacity-30 mx-auto" />}
                      title="No users found"
                      description={
                        isFiltered
                          ? 'No users match your filter criteria. Try resetting filters.'
                          : 'Click "+ Add User" to invite your first staff member.'
                      }
                    />
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isActive = u.status === 'ACTIVE';
                  const roleName = u.role?.name || (u.isSuperAdmin ? 'Super Admin' : 'Staff');
                  const outletName = u.isSuperAdmin
                    ? 'Semua Outlet'
                    : u.outlet?.name || 'Belum Ditugaskan';

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition-colors group">
                      {/* USER Column */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-xs ${getAvatarColor(
                              u.name
                            )}`}
                          >
                            {getInitials(u.name)}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">{u.name}</div>
                            {u.isSuperAdmin && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 font-medium">
                                <Crown className="w-2.5 h-2.5" /> Full Access
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* EMAIL Column */}
                      <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">
                        {u.email}
                      </td>

                      {/* OUTLET Column */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-medium">{outletName}</span>
                        </div>
                      </td>

                      {/* ROLE Column */}
                      <td className="py-3.5 px-4">
                        <Badge variant={u.isSuperAdmin ? 'warning' : 'info'}>
                          <Shield className="w-3 h-3 mr-1" />
                          {roleName}
                        </Badge>
                      </td>

                      {/* SUPER ADMIN Column */}
                      <td className="py-3.5 px-4 text-center">
                        <Badge variant={u.isSuperAdmin ? 'info' : 'neutral'}>
                          {u.isSuperAdmin ? 'Yes' : 'No'}
                        </Badge>
                      </td>

                      {/* STATUS Column */}
                      <td className="py-3.5 px-4 text-center">
                        <Badge variant={isActive ? 'success' : 'neutral'} dot>
                          {isActive ? 'ACTIVE' : 'INACTIVE'}
                        </Badge>
                      </td>

                      {/* ACTIONS Column */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            title="View Details"
                            onClick={() => navigate(`/settings/users/${u.id}`)}
                            className="p-1.5 text-slate-500 hover:text-slate-800"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Edit User"
                            onClick={() => navigate(`/settings/users/${u.id}/edit`)}
                            className="p-1.5 text-slate-500 hover:text-slate-800"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>

                          {/* More dropdown / menu */}
                          <div className="relative">
                            <Button
                              variant="ghost"
                              size="sm"
                              title="More Options"
                              onClick={() =>
                                setActiveActionMenuId(activeActionMenuId === u.id ? null : u.id)
                              }
                              className="p-1.5 text-slate-400 hover:text-slate-700"
                            >
                              <MoreVertical className="w-3.5 h-3.5" />
                            </Button>

                            {activeActionMenuId === u.id && (
                              <div
                                className="absolute right-0 top-full mt-1 w-44 bg-white border border-slate-200 rounded-xl shadow-lg z-20 py-1 text-left animate-in fade-in zoom-in-95 duration-100"
                                onMouseLeave={() => setActiveActionMenuId(null)}
                              >
                                <button
                                  onClick={() => handleResendInvitation(u)}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                                >
                                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                                  Resend Invitation
                                </button>
                                {isActive && (
                                  <button
                                    onClick={() => {
                                      setActiveActionMenuId(null);
                                      setDeactivatingUser(u);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                  >
                                    <UserX className="w-3.5 h-3.5 text-rose-500" />
                                    Deactivate User
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {!loading && users.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t border-slate-200 gap-3 text-xs text-slate-500 bg-slate-50/50">
            <div>
              Showing <span className="font-semibold text-slate-700">{(meta.page - 1) * meta.limit + 1}</span> to{' '}
              <span className="font-semibold text-slate-700">
                {Math.min(meta.page * meta.limit, meta.total)}
              </span>{' '}
              of <span className="font-semibold text-slate-700">{meta.total}</span> entries
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={meta.page <= 1}
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                className="px-2.5 py-1 text-xs"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </Button>

              {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((p) => (
                <Button
                  key={p}
                  variant={p === meta.page ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setCurrentPage(p)}
                  className={`min-w-[32px] px-2.5 py-1 text-xs font-semibold ${
                    p === meta.page ? 'bg-[#0D5C53] text-white hover:bg-[#09423C]' : ''
                  }`}
                >
                  {p}
                </Button>
              ))}

              <Button
                variant="outline"
                size="sm"
                disabled={meta.page >= meta.totalPages}
                onClick={() => setCurrentPage((p) => Math.min(p + 1, meta.totalPages))}
                className="px-2.5 py-1 text-xs"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Deactivate Confirmation Modal (Matching Figma Screen 5) */}
      <Modal
        isOpen={Boolean(deactivatingUser)}
        onClose={() => setDeactivatingUser(null)}
        title="Deactivate User?"
        maxWidth="sm"
      >
        <div className="space-y-4 py-2">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>

          <div className="text-center space-y-1.5">
            <h4 className="text-sm font-bold text-slate-900">
              Deactivate {deactivatingUser?.name}?
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Are you sure you want to deactivate <span className="font-semibold text-slate-800">{deactivatingUser?.name}</span>? 
              They will no longer be able to log in or perform any actions until reactivated.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeactivatingUser(null)}
              disabled={deleteUserMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleConfirmDeactivate}
              isLoading={deleteUserMutation.isPending}
            >
              Deactivate
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
