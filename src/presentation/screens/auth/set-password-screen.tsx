import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '@domain/services/auth-service';
import { useAuthStore } from '@domain/state/auth-store';
import type { InvitationVerification } from '@model/Auth';
import {
  Store,
  CheckCircle2,
  AlertCircle,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Building2,
  UserCheck,
} from 'lucide-react';
import {
  Button,
  Card,
  FormInput,
  LoadingState,
} from '@presentation/components/ui';

export const SetPasswordScreen: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = (searchParams.get('token') || '').trim();

  const setAuth = useAuthStore((state) => state.setAuth);

  // States
  const [verifying, setVerifying] = useState(true);
  const [invitationData, setInvitationData] = useState<InvitationVerification | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);

  // Form States
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Verify token on mount
  useEffect(() => {
    if (!token) {
      setVerifying(false);
      setTokenError('Tautan aktivasi tidak valid atau tidak menyertakan token.');
      return;
    }

    const verify = async () => {
      try {
        setVerifying(true);
        const data = await authService.verifyInvitation(token);
        if (data.valid) {
          setInvitationData(data);
        } else {
          setTokenError('Tautan aktivasi tidak valid atau sudah kedaluwarsa.');
        }
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Tautan aktivasi tidak valid atau sudah kedaluwarsa. Silakan hubungi admin toko.';
        setTokenError(msg);
      } finally {
        setVerifying(false);
      }
    };

    verify();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!password || password.length < 6) {
      setFormError('Kata sandi minimal harus 6 karakter.');
      return;
    }

    if (password !== confirmPassword) {
      setFormError('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    try {
      setSubmitting(true);
      const data = await authService.setPassword({
        token,
        password,
      });

      // Set user session automatically
      if (data.accessToken && data.user) {
        setAuth({
          user: data.user,
          tenant: data.tenant,
          outlets: data.outlets || [],
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        });
      }

      setIsSuccess(true);
      setTimeout(() => {
        navigate('/pos');
      }, 1800);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Gagal mengaktifkan akun. Silakan coba lagi.';
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Brand Header */}
        <div className="text-center">
          <div className="w-14 h-14 bg-[#0D5C53] rounded-2xl flex items-center justify-center text-white mx-auto shadow-md mb-4">
            <Store className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Agilix POS</h1>
          <p className="text-sm text-slate-500 mt-1">Aktivasi Akun & Pembuatan Kata Sandi</p>
        </div>

        {/* Loading State */}
        {verifying && (
          <Card className="p-8 text-center shadow-sm">
            <LoadingState message="Memverifikasi tautan aktivasi akun Anda..." />
          </Card>
        )}

        {/* Invalid / Expired Token Error */}
        {!verifying && tokenError && (
          <Card className="p-8 text-center space-y-5 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-base font-bold text-slate-900">Tautan Tidak Valid</h2>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                {tokenError}
              </p>
            </div>

            <div className="pt-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate('/login')}
              >
                Kembali ke Halaman Login
              </Button>
            </div>
          </Card>
        )}

        {/* Success State */}
        {!verifying && isSuccess && (
          <Card className="p-8 text-center space-y-4 shadow-sm animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center mx-auto border-2 border-teal-100">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-base font-bold text-slate-900">Aktivasi Berhasil!</h2>
              <p className="text-xs text-slate-500">
                Akun Anda telah aktif. Mengarahkan Anda ke sistem kasir POS...
              </p>
            </div>
          </Card>
        )}

        {/* Password Setup Form */}
        {!verifying && !tokenError && !isSuccess && invitationData && (
          <Card className="p-8 shadow-sm space-y-6">
            {/* User Profile Meta Header */}
            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2 text-xs">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <UserCheck className="w-4 h-4 text-teal-700" />
                <span>{invitationData.name}</span>
              </div>
              <div className="text-slate-600 font-mono text-[11px]">
                {invitationData.email}
              </div>
              <div className="pt-1.5 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-2 text-slate-500 text-[11px]">
                <span className="flex items-center gap-1 font-medium text-slate-700">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  {invitationData.businessName} - {invitationData.outletName || 'Semua Outlet'}
                </span>
                <span className="bg-teal-100 text-teal-800 font-semibold px-2 py-0.5 rounded-full text-[10px]">
                  {invitationData.roleName || 'Staff'}
                </span>
              </div>
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-800">Buat Kata Sandi Baru</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Atur kata sandi untuk masuk ke terminal kasir dan dashboard Agilix.
              </p>
            </div>

            {formError && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-start gap-2.5 text-rose-700 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* New Password */}
              <div className="space-y-1.5 relative">
                <FormInput
                  label="Kata Sandi Baru"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoFocus
                  autoComplete="new-password"
                  className="text-base sm:text-xs"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  helperText="Gunakan kombinasi huruf dan angka untuk keamanan optimal."
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-8 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5 relative">
                <FormInput
                  label="Konfirmasi Kata Sandi"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  className="text-base sm:text-xs"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ketik ulang kata sandi baru"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-8 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Security Hint */}
              <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-1">
                <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
                <span>Kata sandi akan dienkripsi secara aman dengan algoritma bcrypt.</span>
              </div>

              {/* Submit */}
              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={submitting}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                  className="w-full bg-[#0D5C53] hover:bg-[#09423C] text-white"
                >
                  Aktivasi Akun & Masuk
                </Button>
              </div>
            </form>
          </Card>
        )}
      </div>
    </div>
  );
};

