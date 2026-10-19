import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Tenant } from '@model/Auth';
import { useAuthStore } from '@domain/state/auth-store';
import { useUiStore } from '@domain/state/ui-store';
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
  Sun,
  Moon,
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
  const { theme, toggleTheme } = useUiStore();

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
        tenant: data.tenant || (data.user as unknown as { tenant?: Tenant })?.tenant,
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


  return (
    <div className="min-h-screen w-full flex flex-col justify-between items-center p-4 sm:p-6 md:p-8 bg-[#F8FAFC] dark:bg-[#060B19] relative overflow-hidden font-sans text-slate-800 dark:text-slate-100 antialiased selection:bg-blue-600 selection:text-white transition-colors duration-200">
      {/* Background Architectural Texture (Subtle dot grid & soft ambient gradient) */}
      <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-gradient-to-b from-blue-600/[0.08] dark:from-blue-500/[0.15] to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar / Status & Theme Toggle */}
      <header className="relative z-10 w-full max-w-[420px] flex items-center justify-between py-2 text-[11px] text-slate-400 dark:text-slate-400 font-medium">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-sky-400 animate-pulse" />
          Terminal POS Siap
        </span>
        <div className="flex items-center gap-3">
          <span>v1.0 Enterprise</span>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Ganti Tema Tampilan"
            title={theme === 'dark' ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-amber-300 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800/80 transition-all cursor-pointer"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Card Utama (Centered Studio Workstation) */}
      <main className="relative z-10 w-full max-w-[420px] my-auto">
        <div className="bg-white dark:bg-[#101828] border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-[0_12px_40px_rgba(15,23,42,0.06)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.4)] p-7 sm:p-9 transition-all">
          {/* Brand Header */}
          <div className="flex flex-col items-center text-center mb-7">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-b from-[#2563EB] to-[#1D4ED8] text-white flex items-center justify-center shadow-md shadow-blue-500/20 mb-3.5 ring-4 ring-blue-500/10 font-black text-2xl tracking-wider">
              S
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Masuk ke SAJI
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
              Kasir Lancar, Stok Teratur, Keuangan Terukur
            </p>
            <span className="text-[10px] text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 rounded-full font-semibold mt-2 border border-blue-200/60 dark:border-blue-800/60">
              by Agilix Tech Solution
            </span>
          </div>

          {/* Banner Error */}
          {error && (
            <div className="mb-5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200/90 dark:border-rose-800/60 rounded-xl p-3 flex items-start gap-2.5 text-rose-800 dark:text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
              <div className="leading-relaxed font-medium">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Input Email */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Email Staf / Pengelola
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="kasir@toko.com"
                  className="w-full h-11 bg-white dark:bg-[#151F32] border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-3.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            {/* Input Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Kata Sandi
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-11 bg-white dark:bg-[#151F32] border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-10 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 focus:outline-none rounded-lg transition-colors cursor-pointer"
                  title={showPassword ? 'Sembunyikan sandi' : 'Lihat sandi'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Opsi Ingat Saya */}
            <div className="pt-1 flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-slate-600 dark:text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500/30 cursor-pointer"
                />
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Ingat email di perangkat ini</span>
              </label>
            </div>

            {/* Tombol Masuk */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-gradient-to-b from-[#2563EB] to-[#1D4ED8] hover:from-[#3B82F6] hover:to-[#2563EB] active:scale-[0.99] disabled:opacity-70 text-white font-semibold text-xs rounded-xl shadow-sm shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer border border-blue-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Memverifikasi akun...</span>
                  </>
                ) : (
                  <>
                    <span>Masuk ke Sistem Kasir</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick Fill / Akses Demo Pengujian */}
         
        </div>
      </main>

      {/* Footer Bawah */}
      <footer className="relative z-10 w-full max-w-[420px] text-center text-[11px] text-slate-400 dark:text-slate-500 py-3 space-y-1">
        <div>Lupa kata sandi? Hubungi Supervisor atau Administrator Toko.</div>
        <div className="text-[10px] text-slate-400 font-medium">SAJI &bull; Powered by Agilix Tech Solution</div>
      </footer>
    </div>
  );
};
