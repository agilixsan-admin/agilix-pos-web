import React, { useEffect, useState } from 'react';
import type { UserManagementItem, Role } from '@model/Settings';
import type { Outlet } from '@model/Auth';
import { settingsService } from '@domain/services/settings-service';
import { Users, Plus, Edit2 } from 'lucide-react';
import {
  Button,
  Badge,
  Card,
  Modal,
  FormInput,
  FormSelect,
  LoadingState,
  EmptyState,
} from '@presentation/components/ui';

export const UsersScreen: React.FC = () => {
  const [users, setUsers] = useState<UserManagementItem[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserManagementItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    roleId: '',
    outletId: '',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [uData, rData, oData] = await Promise.all([
        settingsService.getUsers(),
        settingsService.getRoles(),
        settingsService.getOutlets(),
      ]);
      setUsers(uData);
      setRoles(rData);
      setOutlets(oData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      roleId: roles[0]?.id || '',
      outletId: outlets[0]?.id || '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (u: UserManagementItem) => {
    setEditingUser(u);
    setFormData({
      name: u.name,
      email: u.email,
      password: '',
      roleId: u.roleId,
      outletId: u.outletId || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingUser) {
        await settingsService.updateUser(editingUser.id, {
          name: formData.name,
          email: formData.email,
          roleId: formData.roleId,
          outletId: formData.outletId || undefined,
        });
      } else {
        await settingsService.createUser({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          roleId: formData.roleId,
          outletId: formData.outletId || undefined,
          isActive: true,
        });
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: unknown) {
      alert(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Gagal menyimpan user.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Manajemen Pengguna (Staff & Kasir)</h1>
          <p className="text-xs text-slate-500 mt-0.5">Kelola akun kasir, manajer outlet, dan peran hak akses operasional.</p>
        </div>

        <Button
          variant="primary"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={handleOpenAdd}
        >
          Tambah Pengguna
        </Button>
      </div>

      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Nama Lengkap</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4">Peran (Role)</th>
                <th className="py-3.5 px-4">Outlet Penugasan</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6}>
                    <LoadingState message="Memuat daftar pengguna..." />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyState
                      icon={<Users className="w-8 h-8 opacity-30 mx-auto" />}
                      title="Belum ada pengguna"
                      description='Klik tombol "+ Tambah Pengguna" untuk mendaftarkan akun baru.'
                    />
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{u.name}</td>
                    <td className="py-3.5 px-4 text-slate-600">{u.email}</td>
                    <td className="py-3.5 px-4">
                      <Badge variant="info">
                        {u.role?.name || u.roleName || 'Staff'}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">
                      {u.outlet?.name || u.outletName || 'Semua Outlet (Head Office)'}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <Badge variant={u.isActive ? 'success' : 'danger'} dot>
                        {u.isActive ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEdit(u)}
                        leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                      >
                        Edit
                      </Button>
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
        title={editingUser ? 'Edit Akun Pengguna' : 'Tambah Pengguna Baru'}
        maxWidth="sm"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormInput
            label="Nama Lengkap"
            required
            autoFocus
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Contoh: Budi Pratama"
          />

          <FormInput
            label="Email Login"
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="kasir1@agilix.com"
          />

          {!editingUser && (
            <FormInput
              label="Kata Sandi (Password)"
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Minimal 6 karakter"
            />
          )}

          <FormSelect
            label="Hak Akses (Role)"
            required
            value={formData.roleId}
            onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
          >
            <option value="">Pilih Role...</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </FormSelect>

          <FormSelect
            label="Outlet Penugasan"
            value={formData.outletId}
            onChange={(e) => setFormData({ ...formData, outletId: e.target.value })}
          >
            <option value="">Semua Outlet (Head Office / Global)</option>
            {outlets.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </FormSelect>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={submitting}
            >
              Simpan
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
