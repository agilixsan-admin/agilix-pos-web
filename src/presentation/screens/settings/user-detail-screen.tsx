import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  useUserDetail,
  useResendInvitationMutation,
  useDeleteUserMutation,
} from '@domain/hooks';
import {
  ArrowLeft,
  Edit2,
  Mail,
  UserX,
  AlertTriangle,
  CheckCircle2,
  Building2,
  Shield,
  Crown,
  Calendar,
  Clock,
  KeyRound,
  Lock,
} from 'lucide-react';
import {
  Button,
  Badge,
  Card,
  Modal,
  LoadingState,
  EmptyState,
  toast,
} from '@presentation/components/ui';

export const UserDetailScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Queries
  const { data: user, isLoading, error, refetch } = useUserDetail(id);

  // Mutations
  const resendInvitationMutation = useResendInvitationMutation();
  const deleteUserMutation = useDeleteUserMutation();

  // State
  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const handleResendInvite = async () => {
    if (!id || !user) return;
    try {
      await resendInvitationMutation.mutateAsync(id);
      setSuccessToast(`Tautan undangan berhasil dikirim ulang ke ${user.email}`);
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err: unknown) {
      toast.error(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Gagal mengirim ulang undangan.'
      );
    }
  };

  const handleConfirmDeactivate = async () => {
    if (!id || !user) return;
    try {
      await deleteUserMutation.mutateAsync(id);
      setIsDeactivateModalOpen(false);
      setSuccessToast(`Pengguna ${user.name} berhasil dinonaktifkan.`);
      setTimeout(() => setSuccessToast(null), 4000);
      refetch();
    } catch (err: unknown) {
      toast.error(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Gagal menonaktifkan pengguna.'
      );
    }
  };

  if (isLoading) {
    return <LoadingState message="Memuat profil pengguna..." />;
  }

  if (error || !user) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <EmptyState
          icon={<UserX className="w-10 h-10 text-slate-300 mx-auto" />}
          title="Pengguna tidak ditemukan"
          description="Data pengguna yang Anda cari tidak ditemukan atau telah dihapus."
          action={
            <Button
              variant="outline"
              onClick={() => navigate('/settings/users')}
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              Kembali ke Daftar Pengguna
            </Button>
          }
        />
      </div>
    );
  }

  const isActive = user.status === 'ACTIVE';
  const roleName = user.role?.name || (user.isSuperAdmin ? 'Super Admin' : 'Staff');
  const outletName = user.isSuperAdmin
    ? 'Semua Outlet (Full Access)'
    : user.outlet?.name || 'Belum Ditugaskan';

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 bg-emerald-800 text-white px-4 py-3 rounded-xl shadow-xl text-xs font-medium animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/settings/users')}
            className="p-2 text-slate-500 hover:text-slate-800 rounded-xl"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
              <span>Settings</span>
              <span>/</span>
              <span>Users</span>
              <span>/</span>
              <span className="text-slate-600 font-semibold">User Details</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight mt-0.5">User Profile</h1>
            <p className="text-xs text-slate-500">
              Manage detail of branch access for this staff member.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleResendInvite}
            isLoading={resendInvitationMutation.isPending}
            leftIcon={<Mail className="w-3.5 h-3.5" />}
          >
            Resend Invitation
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate(`/settings/users/${id}/edit`)}
            leftIcon={<Edit2 className="w-3.5 h-3.5" />}
            className="bg-[#0D5C53] hover:bg-[#09423C] text-white"
          >
            Edit User
          </Button>

          {isActive && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDeactivateModalOpen(true)}
              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
              leftIcon={<UserX className="w-3.5 h-3.5" />}
            >
              Deactivate
            </Button>
          )}
        </div>
      </div>

      {/* Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <Card padding="lg" className="border-slate-200 text-center space-y-4">
            {/* Avatar */}
            <div className="relative inline-block">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-teal-700 to-emerald-500 text-white flex items-center justify-center font-bold text-2xl mx-auto shadow-md border-4 border-white">
                {getInitials(user.name)}
              </div>
              {user.isSuperAdmin && (
                <div className="absolute -bottom-1 -right-1 bg-amber-500 text-white p-1 rounded-full shadow-sm" title="Super Admin">
                  <Crown className="w-3.5 h-3.5" />
                </div>
              )}
            </div>

            {/* Name & Badges */}
            <div className="space-y-1.5">
              <h2 className="text-base font-bold text-slate-900">{user.name}</h2>
              <p className="text-xs text-slate-500 font-mono">{user.email}</p>
              <div className="flex items-center justify-center gap-1.5 pt-1">
                <Badge variant={isActive ? 'success' : 'neutral'} dot>
                  {isActive ? 'ACTIVE' : 'INACTIVE'}
                </Badge>
                {user.isSuperAdmin && (
                  <Badge variant="warning">
                    <Crown className="w-3 h-3 mr-1" /> Super Admin
                  </Badge>
                )}
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* Meta Info List */}
            <div className="space-y-2.5 text-left text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <Calendar className="w-3.5 h-3.5" /> Joined Date
                </span>
                <span className="font-medium text-slate-800">{formatDate(user.createdAt)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <Clock className="w-3.5 h-3.5" /> Last Updated
                </span>
                <span className="font-medium text-slate-800">{formatDate(user.updatedAt)}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Information Cards */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: Assigned Outlet */}
          <Card padding="md" className="border-slate-200 space-y-3">
            <div className="flex items-center gap-2 text-slate-700">
              <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                <Building2 className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Outlet Assignment
              </h3>
            </div>

            <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-bold text-slate-900">{outletName}</div>
                {user.outlet?.address ? (
                  <p className="text-[11px] text-slate-500 mt-0.5">{user.outlet.address}</p>
                ) : user.isSuperAdmin ? (
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    User has global supervisory privileges across all store outlets.
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-400 mt-0.5">No specific outlet assigned.</p>
                )}
              </div>
              <Badge variant={user.isSuperAdmin ? 'warning' : 'info'}>
                {user.isSuperAdmin ? 'All Locations' : 'Branch Scope'}
              </Badge>
            </div>
          </Card>

          {/* Card 2: Role & System Permissions */}
          <Card padding="md" className="border-slate-200 space-y-3">
            <div className="flex items-center gap-2 text-slate-700">
              <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                <Shield className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Role & Access Permissions
              </h3>
            </div>

            <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900">{roleName}</div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {user.role?.description ||
                      (user.isSuperAdmin
                        ? 'Full administrative privileges across all POS features and settings.'
                        : 'Standard operational permissions assigned to this user role.')}
                  </p>
                </div>
                <Badge variant={user.isSuperAdmin ? 'warning' : 'info'}>
                  {user.isSuperAdmin ? 'Super Admin' : 'Assigned Role'}
                </Badge>
              </div>

              {user.role?.permissions && user.role.permissions.length > 0 && (
                <div className="pt-2 border-t border-slate-200/70 space-y-1.5">
                  <div className="text-[11px] font-semibold text-slate-600 flex items-center gap-1.5">
                    <KeyRound className="w-3 h-3 text-slate-400" />
                    Granted Permissions ({user.role.permissions.length}):
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pt-1">
                    {user.role.permissions.map((p) => (
                      <span
                        key={p}
                        className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-mono text-slate-700 shadow-2xs"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Card 3: Security & Invitation Status */}
          <Card padding="md" className="border-slate-200 space-y-3">
            <div className="flex items-center gap-2 text-slate-700">
              <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                <Lock className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Account Security & Invitation
              </h3>
            </div>

            <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold text-slate-800">
                  Invitation Email Setup
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  If the staff member has not set their password or lost the invitation link, you can resend it.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleResendInvite}
                isLoading={resendInvitationMutation.isPending}
                className="shrink-0"
                leftIcon={<Mail className="w-3.5 h-3.5" />}
              >
                Resend Link
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Deactivate Confirmation Modal (Matching Figma Screen 5) */}
      <Modal
        isOpen={isDeactivateModalOpen}
        onClose={() => setIsDeactivateModalOpen(false)}
        title="Deactivate User?"
        maxWidth="sm"
      >
        <div className="space-y-4 py-2">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>

          <div className="text-center space-y-1.5">
            <h4 className="text-sm font-bold text-slate-900">
              Deactivate {user.name}?
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Are you sure you want to deactivate <span className="font-semibold text-slate-800">{user.name}</span>? 
              They will no longer be able to log in or perform any actions until reactivated.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDeactivateModalOpen(false)}
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

