import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@domain/state/auth-store';
import { authService } from '@domain/services/auth-service';
import { Store, Lock, Mail, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await authService.login({ email, password });
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

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full">
        {/* Brand Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-[#0D5C53] rounded-2xl flex items-center justify-center text-white mx-auto shadow-md mb-4">
            <Store className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Agilix POS</h1>
          <p className="text-sm text-slate-500 mt-1">Sistem Kasir & Operasional Multi-Outlet</p>
        </div>

        {/* Login Card */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8">
          <h2 className="text-lg font-semibold text-slate-800 mb-6">Masuk ke Sistem Kasir</h2>

          {error && (
            <div className="mb-5 bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-3 text-red-700 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="kasir@toko.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53] transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-[#0D5C53] hover:bg-[#094740] active:scale-[0.99] text-white py-3 px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <span>Masuk Sekarang</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-slate-400 mt-6">
          © {new Date().getFullYear()} Agilix POS. Terintegrasi dengan Agilix Console.
        </p>
      </div>
    </div>
  );
};

