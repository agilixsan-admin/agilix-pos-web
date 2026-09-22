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
  Zap,
  Boxes,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Mail,
  HelpCircle,
} from 'lucide-react';
import { Button, FormInput } from '@presentation/components/ui';

const REMEMBERED_EMAIL_KEY = 'agilix_pos_saved_email';

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
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Email atau password salah. Silakan coba lagi.';
      setError(errorMsg);
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
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#F8FAFC]">
      {/* ─── LEFT BRANDING & FEATURE SHOWCASE (DESKTOP / TABLET LANDSCAPE) ─── */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[52%] flex-col justify-between p-10 xl:p-14 relative overflow-hidden bg-gradient-to-br from-[#073631] via-[#0D5C53] to-[#126D63] text-white shadow-2xl">
        {/* Subtle Ambient Background Lighting */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-teal-400/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-teal-300/10 rounded-full blur-2xl pointer-events-none" />

        {/* Top Branding */}
        <div className="relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl flex items-center justify-center text-white shadow-inner">
              <Store className="w-6 h-6 text-teal-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black tracking-tight text-white">Agilix POS</span>
                <span className="bg-teal-400/20 text-teal-200 border border-teal-300/30 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Enterprise
                </span>
              </div>
              <p className="text-xs text-teal-100/75 font-medium">
                Point of Sale & Operational ERP Engine
              </p>
            </div>
          </div>
        </div>

        {/* Center Hero Value Proposition */}
        <div className="relative z-10 my-auto py-8 space-y-8 max-w-lg">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-teal-100 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
              Sistem Kasir & Operasional Cerdas
            </div>
            <h1 className="text-3xl xl:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Akselerasi Transaksi & Kendali Penuh Outlet Anda.
            </h1>
            <p className="text-sm xl:text-base text-teal-100/80 leading-relaxed font-normal">
              Kelola pesanan dine-in & takeaway, integrasi QRIS dinamis, potongan stok bahan otomatis, hingga rekap laporan laba rugi dalam satu platform terpadu.
            </p>
          </div>

          {/* Key POS Feature Badges */}
          <div className="space-y-3.5 pt-2">
            <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm transition-all hover:bg-white/10">
              <div className="w-9 h-9 rounded-lg bg-teal-400/20 border border-teal-300/30 flex items-center justify-center text-teal-200 shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">Kasir Cepat & Meja Interaktif</h2>
                <p className="text-xs text-teal-100/70 mt-0.5 leading-relaxed">
                  Pemesanan langsung bayar, manajemen meja dine-in, split bill, cetak struk thermal & dapur otomatis.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm transition-all hover:bg-white/10">
              <div className="w-9 h-9 rounded-lg bg-emerald-400/20 border border-emerald-300/30 flex items-center justify-center text-emerald-200 shrink-0">
                <Boxes className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">Resep & Pemotongan Stok Bahan Otomatis</h2>
                <p className="text-xs text-teal-100/70 mt-0.5 leading-relaxed">
                  Stok bahan baku & packaging langsung berkurang akurat per transaksi tanpa perlu rekap manual.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm transition-all hover:bg-white/10">
              <div className="w-9 h-9 rounded-lg bg-teal-400/20 border border-teal-300/30 flex items-center justify-center text-teal-200 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">Keamanan & Hak Akses Bertingkat (RBAC)</h2>
                <p className="text-xs text-teal-100/70 mt-0.5 leading-relaxed">
                  Verifikasi void supervisor, shift kasir, dan isolasi data per cabang outlet yang aman.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Social Proof / Trust Footnote */}
        <div className="relative z-10 pt-6 border-t border-white/10 flex items-center justify-between text-xs text-teal-100/60 font-medium">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-teal-400" />
            Terpercaya untuk F&B, Kafe, & Resto Multi-Outlet
          </span>
          <span>© 2026 Agilix Technology</span>
        </div>
      </div>

      {/* ─── RIGHT LOGIN FORM AREA (RESPONSIVE) ─── */}
      <div className="w-full lg:w-1/2 xl:w-[48%] flex flex-col justify-center items-center p-6 sm:p-10 lg:p-12 xl:p-16 min-h-screen">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile / Tablet Header (shown when left hero is hidden) */}
          <div className="lg:hidden text-center pb-2">
            <div className="w-13 h-13 bg-[#0D5C53] rounded-2xl flex items-center justify-center text-white mx-auto shadow-md mb-3">
              <Store className="w-6 h-6 text-teal-100" />
            </div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Agilix POS</h1>
            <p className="text-xs text-slate-500 mt-1">Sistem Kasir & Operasional Multi-Outlet</p>
          </div>

          {/* Form Card */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-7 sm:p-9 shadow-xl shadow-slate-200/50">
            {/* Form Title & Instruction */}
            <div className="mb-6">
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Masuk ke Sistem Kasir
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Masukkan email dan kata sandi staff atau pengelola untuk membuka terminal kasir.
              </p>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="mb-5 bg-rose-50 border border-rose-200 rounded-xl p-3.5 flex items-start gap-3 text-rose-700 text-xs animate-in fade-in-50 duration-200">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <div className="space-y-0.5">
                  <p className="font-semibold">Gagal Masuk</p>
                  <p className="text-rose-600 leading-relaxed">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Email Kasir / Staff <span className="text-rose-500">*</span>
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
                    className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53] transition-all"
                  />
                </div>
              </div>

              {/* Password Input with Show/Hide Toggle */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Kata Sandi (Password) <span className="text-rose-500">*</span>
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
                    className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 focus:outline-none rounded-lg transition-colors cursor-pointer"
                    title={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Help Row */}
              <div className="pt-1 flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 text-slate-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-[#0D5C53] focus:ring-[#0D5C53]/30 cursor-pointer"
                  />
                  <span className="font-medium text-[11px] sm:text-xs">Ingat email saya</span>
                </label>

                <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Perlu akses? Hubungi Admin</span>
                </span>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={loading}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                  className="w-full bg-[#0D5C53] hover:bg-[#094740] active:scale-[0.99] text-white font-bold py-3 shadow-md shadow-[#0D5C53]/20 transition-all cursor-pointer"
                >
                  Masuk ke Aplikasi
                </Button>
              </div>
            </form>

            {/* Quick Fill / Demo Helper (Helpful for quick testing & development) */}
            <div className="mt-6 pt-5 border-t border-slate-100">
              <p className="text-[11px] text-slate-400 font-semibold mb-2">Akses Cepat Uji Coba (Demo):</p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickFill('owner@testcafe.com', 'Password123!')}
                  className="px-2.5 py-1.5 rounded-lg bg-teal-50 border border-teal-200/60 text-[#0D5C53] text-[11px] font-semibold hover:bg-teal-100/80 transition-colors cursor-pointer"
                >
                  Owner Test Cafe
                </button>
              </div>
            </div>
          </div>

          {/* Footer Security Note */}
          <div className="text-center text-[11px] text-slate-400 space-y-1">
            <p className="flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
              Koneksi aman terenkripsi dengan standar Agilix POS
            </p>
            <p>© 2026 Agilix Technology • v1.0 Enterprise</p>
          </div>
        </div>
      </div>
    </div>
  );
};

