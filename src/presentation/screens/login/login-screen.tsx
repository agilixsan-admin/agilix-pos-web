import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@domain/state/auth-store';
import { authService } from '@domain/services/auth-service';
import { Store, ArrowRight, AlertCircle } from 'lucide-react';
import { Button, Card, FormInput } from '@presentation/components/ui';

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
      <div className="max-w-md w-full space-y-6">
        {/* Brand Logo */}
        <div className="text-center">
          <div className="w-14 h-14 bg-[#0D5C53] rounded-2xl flex items-center justify-center text-white mx-auto shadow-md mb-4">
            <Store className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Agilix POS</h1>
          <p className="text-sm text-slate-500 mt-1">Sistem Kasir & Operasional Multi-Outlet</p>
        </div>

        {/* Login Card */}
        <Card className="p-8 shadow-sm">
          <h2 className="text-base font-bold text-slate-800 mb-6">Masuk ke Sistem Kasir</h2>

          {error && (
            <div className="mb-5 bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-start gap-2.5 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <FormInput
              label="Email Kasir / Staff"
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="kasir@toko.com"
            />

            <FormInput
              label="Kata Sandi (Password)"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={loading}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="w-full"
              >
                Masuk ke Aplikasi
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};
