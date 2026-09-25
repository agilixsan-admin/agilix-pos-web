import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  useUserDetail,
  useUpdateUserMutation,
  useOutlets,
  useRoles,
} from '@domain/hooks';
import {
  ArrowLeft,
  Crown,
  Building2,
  Shield,
  Lock,
} from 'lucide-react';
import {
  Button,
  Card,
  FormInput,
  FormSelect,
  LoadingState,
  EmptyState,
  toast,
} from '@presentation/components/ui';

export const UserEditScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Queries
  const { data: user, isLoading: userLoading, error } = useUserDetail(id);
  const { data: outlets = [], isLoading: outletsLoading } = useOutlets();
  const { data: roles = [], isLoading: rolesLoading } = useRoles();

  // Mutation
  const updateUserMutation = useUpdateUserMutation();

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    isSuperAdmin: false,
    outletId: '',
    roleId: '',
    status: 'ACTIVE',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        password: '',
        isSuperAdmin: Boolean(user.isSuperAdmin),
        outletId: user.outletId || '',
        roleId: user.roleId || '',
        status: user.status || 'ACTIVE',
      });
    }
  }, [user]);

  const validate = () => {
    const err: Record<string, string> = {};
    if (!formData.name.trim()) err.name = 'Full name is required';
    if (formData.password && formData.password.length < 6) {
      err.password = 'Password must be at least 6 characters long';
    }

    if (!formData.isSuperAdmin) {
      if (!formData.outletId) err.outletId = 'Assigned outlet is required';
      if (!formData.roleId) err.roleId = 'Role selection is required';
    }

    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !validate()) return;

    try {
      await updateUserMutation.mutateAsync({
        id,
        data: {
          name: formData.name.trim(),
          password: formData.password.trim() || undefined,
          isSuperAdmin: formData.isSuperAdmin,
          outletId: formData.isSuperAdmin ? undefined : formData.outletId || undefined,
          roleId: formData.isSuperAdmin ? undefined : formData.roleId || undefined,
          status: formData.status,
        },
      });

      toast.success('Profil pengguna berhasil diperbarui.');
      navigate(`/settings/users/${id}`);
    } catch (err: unknown) {
      toast.error(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Gagal memperbarui profil pengguna.'
      );
    }
  };

  if (userLoading) {
    return <LoadingState message="Memuat data pengguna..." />;
  }

  if (error || !user) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <EmptyState
          title="Pengguna tidak ditemukan"
          description="Data pengguna yang ingin diubah tidak ditemukan."
          action={
            <Button
              variant="outline"
              onClick={() => navigate('/settings/users')}
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              Kembali ke Pengguna
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16">
      {/* Header & Back Navigation */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/settings/users/${id}`)}
          className="p-2 text-slate-500 hover:text-slate-800 rounded-xl"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Edit User</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Update staff credentials, outlet assignment, and role permissions.
          </p>
        </div>
      </div>

      {/* Main Form Card */}
      <Card padding="lg" className="border-slate-200">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info Section */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Basic Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormInput
                label="Full Name"
                placeholder="e.g. Ahmad Mubarok"
                required
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (errors.name) setErrors({ ...errors, name: '' });
                }}
                error={errors.name}
              />

              <FormInput
                label="Email Address"
                type="email"
                value={formData.email}
                disabled
                isLocked
                helperText="Email address cannot be modified after registration."
              />
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Permissions & Access Section */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Permissions & Access
            </h3>

            {/* Super Admin Toggle Box */}
            <div
              onClick={() =>
                setFormData((prev) => ({
                  ...prev,
                  isSuperAdmin: !prev.isSuperAdmin,
                  outletId: !prev.isSuperAdmin ? '' : prev.outletId,
                  roleId: !prev.isSuperAdmin ? '' : prev.roleId,
                }))
              }
              className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                formData.isSuperAdmin
                  ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-300'
                  : 'bg-slate-50 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    formData.isSuperAdmin
                      ? 'bg-amber-500 text-white'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  <Crown className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                    Super Admin Access
                    {formData.isSuperAdmin && (
                      <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full font-semibold">
                        Full Access
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Grants full access to all outlets and all system settings.
                  </p>
                </div>
              </div>

              {/* Toggle Switch */}
              <div
                className={`w-11 h-6 flex items-center rounded-full p-1 duration-200 ease-in-out shrink-0 ${
                  formData.isSuperAdmin ? 'bg-amber-500' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-200 ease-in-out ${
                    formData.isSuperAdmin ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </div>
            </div>

            {/* Outlets & Roles Selection */}
            {formData.isSuperAdmin ? (
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3 text-slate-600">
                <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-xs font-medium">
                  Super Admin has unrestricted access to <strong>all outlets</strong> and system features. Outlet and role assignment is optional.
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="space-y-1.5">
                  <FormSelect
                    label="Assigned Outlet"
                    required
                    value={formData.outletId}
                    onChange={(e) => {
                      setFormData({ ...formData, outletId: e.target.value });
                      if (errors.outletId) setErrors({ ...errors, outletId: '' });
                    }}
                    error={errors.outletId}
                    disabled={outletsLoading}
                  >
                    <option value="">-- Select Outlet --</option>
                    {outlets.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name}
                      </option>
                    ))}
                  </FormSelect>
                  <p className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Building2 className="w-3 h-3" /> Branch location where user operates
                  </p>
                </div>

                <div className="space-y-1.5">
                  <FormSelect
                    label="Role"
                    required
                    value={formData.roleId}
                    onChange={(e) => {
                      setFormData({ ...formData, roleId: e.target.value });
                      if (errors.roleId) setErrors({ ...errors, roleId: '' });
                    }}
                    error={errors.roleId}
                    disabled={rolesLoading}
                  >
                    <option value="">-- Select Role --</option>
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </FormSelect>
                  <p className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Shield className="w-3 h-3" /> Defines POS and management permissions
                  </p>
                </div>
              </div>
            )}
          </div>

          <hr className="border-slate-100" />

          {/* Account Status & Password Section */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Account Status & Credentials
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormSelect
                label="Account Status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="ACTIVE">ACTIVE (Can log in & operate)</option>
                <option value="INACTIVE">INACTIVE (Deactivated / blocked)</option>
              </FormSelect>

              <FormInput
                label="Reset Password (Optional)"
                type="password"
                placeholder="Leave blank to keep current"
                value={formData.password}
                onChange={(e) => {
                  setFormData({ ...formData, password: e.target.value });
                  if (errors.password) setErrors({ ...errors, password: '' });
                }}
                error={errors.password}
                helperText="Enter at least 6 characters only if you wish to override the user password."
              />
            </div>
          </div>

          {/* Form Actions Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`/settings/users/${id}`)}
              disabled={updateUserMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={updateUserMutation.isPending}
              className="bg-[#0D5C53] hover:bg-[#09423C] text-white px-6"
            >
              Save Changes
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

