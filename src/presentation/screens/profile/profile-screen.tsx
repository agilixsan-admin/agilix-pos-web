import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User as UserIcon,
  Shield,
  Building2,
  Store,
  KeyRound,
  Mail,
  Crown,
  CheckCircle2,
  ArrowLeft,
  Calendar,
  Lock,
} from 'lucide-react';
import { useAuthStore } from '@domain/state/auth-store';
import { Card, Button, Badge, ResetPasswordModal } from '@presentation/components/ui';

export const ProfileScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user, tenant, currentOutlet } = useAuthStore();
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const getInitials = (name?: string) => {
    if (!name) return 'AG';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const userName = user?.name || 'Kasir';
  const userEmail = user?.email || '-';
  const roleName = user?.role?.name || user?.roleName || (user?.isSuperAdmin ? 'Super Admin' : 'Staff');
  const outletName = currentOutlet?.name || 'Semua Cabang';
  const tenantName = tenant?.name || 'Agilix POS';

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(-1)}
            className="p-2 text-slate-500 hover:text-slate-800 rounded-xl"
            title="Kembali"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
              <span>Pengaturan</span>
              <span>/</span>
              <span className="text-slate-600 font-semibold">Profil Pengguna</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight mt-0.5">
              Profil Saya
            </h1>
            <p className="text-xs text-slate-500">
              Kelola informasi profil, akses outlet operasional, dan keamanan kata sandi Anda.
            </p>
          </div>
        </div>

        {/* Action Button: Reset Password */}
        <Button
          variant="primary"
          leftIcon={<KeyRound className="w-4 h-4" />}
          onClick={() => setIsResetModalOpen(true)}
          className="bg-[#0D5C53] hover:bg-[#09423c] text-white shadow-xs self-start sm:self-auto"
        >
          Reset Password
        </Button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Avatar & Summary Card */}
        <div className="lg:col-span-1 space-y-6">
          <Card padding="lg" className="border-slate-200 text-center space-y-4">
            {/* Big Avatar */}
            <div className="relative inline-block mt-2">
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-[#0D5C53] to-teal-500 text-white flex items-center justify-center font-bold text-3xl mx-auto shadow-md border-4 border-white">
                {getInitials(userName)}
              </div>
              {user?.isSuperAdmin && (
                <div
                  className="absolute -bottom-1 -right-1 bg-amber-500 text-white p-1.5 rounded-full shadow-sm"
                  title="Super Admin"
                >
                  <Crown className="w-4 h-4" />
                </div>
              )}
            </div>

            {/* User Meta */}
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-900">{userName}</h2>
              <p className="text-xs text-slate-500 font-mono">{userEmail}</p>
              <div className="pt-2 flex flex-wrap items-center justify-center gap-1.5">
                <Badge variant="info" size="sm">
                  {roleName}
                </Badge>
                {user?.isSuperAdmin && (
                  <Badge variant="warning" size="sm">
                    Super Admin
                  </Badge>
                )}
                <Badge variant="success" size="sm" dot>
                  Aktif
                </Badge>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex flex-col gap-2.5 text-xs text-left">
              <div className="flex items-center justify-between text-slate-600">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" /> Bisnis / Tenant
                </span>
                <span className="font-semibold text-slate-800 truncate max-w-[150px]">
                  {tenantName}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5 text-slate-400" /> Cabang Aktif
                </span>
                <span className="font-semibold text-slate-800 truncate max-w-[150px]">
                  {outletName}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" /> Status Akun
                </span>
                <span className="font-semibold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Terverifikasi
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Detailed Cards */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: Informasi Pribadi & Akses */}
          <Card
            header={
              <div className="flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-[#0D5C53]" />
                <h3 className="text-sm font-bold text-slate-900">Informasi Pengguna</h3>
              </div>
            }
            padding="md"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50/70 border border-slate-200/80 rounded-xl space-y-1">
                <span className="text-slate-400 font-medium">Nama Lengkap</span>
                <p className="font-bold text-slate-900 text-sm">{userName}</p>
              </div>

              <div className="p-3 bg-slate-50/70 border border-slate-200/80 rounded-xl space-y-1">
                <span className="text-slate-400 font-medium flex items-center gap-1">
                  <Mail className="w-3 h-3 text-slate-400" /> Alamat Email
                </span>
                <p className="font-bold text-slate-900 text-sm font-mono">{userEmail}</p>
              </div>

              <div className="p-3 bg-slate-50/70 border border-slate-200/80 rounded-xl space-y-1">
                <span className="text-slate-400 font-medium flex items-center gap-1">
                  <Shield className="w-3 h-3 text-slate-400" /> Peran / Role
                </span>
                <p className="font-bold text-slate-900 text-sm">{roleName}</p>
              </div>

              <div className="p-3 bg-slate-50/70 border border-slate-200/80 rounded-xl space-y-1">
                <span className="text-slate-400 font-medium flex items-center gap-1">
                  <Store className="w-3 h-3 text-slate-400" /> Penugasan Outlet
                </span>
                <p className="font-bold text-slate-900 text-sm">{outletName}</p>
              </div>
            </div>
          </Card>

          {/* Card 2: Keamanan Akun & Reset Password */}
          <Card
            header={
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#0D5C53]" />
                <h3 className="text-sm font-bold text-slate-900">Keamanan & Kata Sandi</h3>
              </div>
            }
            padding="md"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-slate-50/80 border border-slate-200/80 rounded-2xl">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">Kata Sandi Akun</span>
                  <Badge variant="success" size="sm">
                    Aman
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 max-w-md">
                  Perbarui kata sandi Anda secara berkala untuk mencegah akses tanpa izin ke data operasional dan kasir.
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                leftIcon={<KeyRound className="w-3.5 h-3.5 text-[#0D5C53]" />}
                onClick={() => setIsResetModalOpen(true)}
                className="shrink-0 border-slate-300 hover:border-[#0D5C53] hover:text-[#0D5C53] bg-white"
              >
                Ganti Password
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Reset Password Modal */}
      <ResetPasswordModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        targetUserName={userName}
      />
    </div>
  );
};

