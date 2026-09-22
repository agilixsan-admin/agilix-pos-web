import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@domain/state/auth-store';
import { authService } from '@domain/services/auth-service';
import {
  Store,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Loader2,
} from 'lucide-react';

const REMEMBERED_EMAIL_KEY = 'agilix_pos_saved_email';

const getFriendlyErrorMessage = (err: unknown): string => {
  const axiosErr = err as {
    response?: {
      status?: number;
      data?: {
        message?: string | string[];
        code?: string;
      };
    };
    code?: string;
    message?: string;
  };

  const status = axiosErr.response?.status;
  const rawMessage = axiosErr.response?.data?.message;
  const errorCode = axiosErr.response?.data?.code;

  // Network / Connection Error
  if (
    axiosErr.code === 'ERR_NETWORK' ||
    axiosErr.code === 'ECONNABORTED' ||
    (!axiosErr.response && axiosErr.message?.toLowerCase().includes('network'))
  ) {
    return 'Tidak dapat terhubung ke server. Pastikan koneksi internet aktif dan server backend berjalan.';
  }

  if (status === 429) {
    return 'Terlalu banyak percobaan masuk. Mohon tunggu beberapa saat sebelum mencoba kembali.';
  }

  const messageStr = Array.isArray(rawMessage)
    ? rawMessage.join(', ')
    : typeof rawMessage === 'string'
      ? rawMessage
      : '';

  // Mapping known backend codes & messages
  if (
    errorCode === 'INVALID_CREDENTIALS' ||
    messageStr.toLowerCase().includes('invalid credential')
  ) {
    return 'Email atau kata sandi yang Anda masukkan salah. Silakan periksa kembali.';
  }

  if (
    errorCode === 'USER_INACTIVE' ||
    messageStr.toLowerCase().includes('inactive')
  ) {
    return 'Akun pengguna ini berstatus non-aktif. Silakan hubungi pengelola toko.';
  }

  if (
    errorCode === 'TENANT_LOCKED' ||
    messageStr.toLowerCase().includes('locked')
  ) {
    return 'Akses outlet/tenant sedang ditangguhkan. Silakan hubungi pengelola toko.';
  }

  if (status && status >= 500) {
    return 'Terjadi gangguan internal pada server. Silakan coba beberapa saat lagi.';
  }

  if (messageStr) {
    return messageStr;
  }

  return 'Email atau kata sandi yang Anda masukkan salah. Silakan periksa kembali.';
};

export const LoginScreen: React.FC = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load remembered email on mount
  useEffect(() => {
    try {
      const savedEmail = localStorage.getItem(REMEMBERED_EMAIL_KEY);
      if (savedEmail) {
        setEmail(savedEmail);
        setRememberMe(true);
      }
    } catch {
      // Ignore localStorage access issues
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await authService.login({ email, password });

      // Save or remove remembered email
      try {
        if (rememberMe) {
          localStorage.setItem(REMEMBERED_EMAIL_KEY, email);
        } else {
          localStorage.removeItem(REMEMBERED_EMAIL_KEY);
        }
      } catch {
        // Ignore localStorage access issues
      }

      setAuth({
        user: data.user,
        tenant: data.tenant,
        outlets: data.outlets || [],
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });

      navigate('/pos');
    } catch (err: unknown) {
      setError(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="min-h-screen w-full flex bg-white font-sans text-slate-800 antialiased selection:bg-[#0D5C53] selection:text-white">
      {/* ─── SISI KIRI: VISUAL ATMOSFER F&B (DESKTOP & TABLET LANDSCAPE) ─── */}
      <div className="hidden lg:relative lg:flex lg:w-1/2 xl:w-[54%] flex-col justify-between p-12 xl:p-16 overflow-hidden bg-slate-900 text-white select-none">
        {/* Foto Suasana Kafe / Barista Autentik */}
        <img
          src="https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?q=80&w=1600&auto=format&fit=crop"
          alt="Coffee Shop Counter"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />

        {/* Gradasi Gelap Hangat untuk Kontras & Keterbacaan */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/55 pointer-events-none" />

        {/* Identitas Brand di Pojok Kiri Atas */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-sm">
            <Store className="w-5 h-5 text-teal-200" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-white">Agilix POS</span>
            <span className="block text-[10px] text-white/70 font-semibold tracking-wider uppercase">
              Terminal Operasional
            </span>
          </div>
        </div>

        {/* Kutipan / Suasana di Pojok Kiri Bawah */}
        <div className="relative z-10 max-w-lg space-y-3">
          <p className="text-2xl xl:text-3xl font-serif italic text-white/95 leading-snug">
            “Setiap racikan terbaik dan pelayanan berkesan bermula dari operasional yang rapi.”
          </p>
          <div className="pt-2 flex items-center gap-3 text-xs text-white/60 font-medium">
            <span>Sistem Kasir & ERP Multi-Outlet</span>
            <span>•</span>
            <span>Versi 1.0</span>
          </div>
        </div>
      </div>

      {/* ─── SISI KANAN: FORMULIR LOGIN BERSIH & FOKUS ─── */}
      <div className="w-full lg:w-1/2 xl:w-[46%] flex flex-col justify-between p-8 sm:p-12 lg:p-14 xl:p-20 min-h-screen bg-white">
        {/* Header Bagian Atas / Mobile Branding */}
        <div className="w-full max-w-sm mx-auto flex items-center justify-between lg:justify-end">
          <div className="lg:hidden flex items-center gap-2.5">
            <div className="w-9 h-9 bg-[#0D5C53] rounded-xl flex items-center justify-center text-white">
              <Store className="w-5 h-5" />
            </div>
            <span className="text-base font-bold text-slate-900 tracking-tight">Agilix POS</span>
          </div>

          <div className="text-[11px] font-medium text-slate-400">
            Terminal Kasir
          </div>
        </div>

        {/* Konten Utama Formulir */}
        <div className="w-full max-w-sm mx-auto my-auto py-8">
          <div className="space-y-1.5 mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Masuk ke Terminal
            </h1>
            <p className="text-xs text-slate-500">
              Masukkan akun staf atau pengelola untuk membuka sesi kasir.
            </p>
          </div>

          {/* Banner Error */}
          {error && (
            <div className="mb-6 bg-rose-50 border border-rose-200/90 rounded-xl p-3.5 flex items-start gap-3 text-rose-800 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <div className="space-y-0.5">
                <p className="font-semibold text-rose-900">Gagal Masuk</p>
                <p className="text-rose-700 leading-relaxed">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Input Email */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Email Akun
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="kasir@toko.com"
                  className="w-full bg-slate-50/50 hover:bg-slate-50/80 focus:bg-white border border-slate-200 rounded-xl pl-10 pr-3.5 py-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/15 focus:border-[#0D5C53] transition-all"
                />
              </div>
            </div>

            {/* Input Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Kata Sandi
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50/50 hover:bg-slate-50/80 focus:bg-white border border-slate-200 rounded-xl pl-10 pr-10 py-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/15 focus:border-[#0D5C53] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-700 focus:outline-none rounded-lg transition-colors cursor-pointer"
                  title={showPassword ? 'Sembunyikan sandi' : 'Lihat sandi'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Opsi Ingat Saya */}
            <div className="pt-1 flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-slate-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-[#0D5C53] focus:ring-[#0D5C53]/30 cursor-pointer"
                />
                <span className="text-xs font-medium text-slate-600">Ingat email di perangkat ini</span>
              </label>
            </div>

            {/* Tombol Submit */}
            <div className="pt-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#0D5C53] hover:bg-[#094740] active:scale-[0.99] disabled:opacity-70 text-white font-semibold text-xs py-3.5 px-4 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Memverifikasi akun...</span>
                  </>
                ) : (
                  <>
                    <span>Buka Sesi Kasir</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick Fill / Akses Demo Pengujian */}

        </div>

        {/* Footer Bawah */}
        <div className="w-full max-w-sm mx-auto text-center text-[11px] text-slate-400">
          Lupa kata sandi? Hubungi Supervisor atau Administrator Toko.
        </div>
      </div>
    </div>
  );
};
