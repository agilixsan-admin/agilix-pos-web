import React, { useState } from 'react';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';
import { Modal } from './modal';
import { Button } from './button';
import { toast } from './toast';
import { authService } from '@domain/services/auth-service';

export interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUserName?: string;
  onSuccess?: () => void;
}

export const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({
  isOpen,
  onClose,
  targetUserName,
  onSuccess,
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleClose = () => {
    setNewPassword('');
    setConfirmPassword('');
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setErrorMessage(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!newPassword || newPassword.length < 6) {
      setErrorMessage('Password baru harus minimal 6 karakter.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Konfirmasi password tidak cocok dengan password baru.');
      return;
    }

    setIsLoading(true);
    try {
      await authService.changePassword(newPassword);
      toast.success('Password Anda berhasil diperbarui!');
      handleClose();
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'Gagal mengubah password. Silakan coba lagi.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Reset Password"
      subtitle={
        targetUserName
          ? `Ubah kata sandi untuk akun ${targetUserName}`
          : 'Perbarui kata sandi akun Anda untuk menjaga keamanan.'
      }
      maxWidth="md"
      footer={
        <div className="flex items-center justify-end gap-2.5 w-full">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Batal
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleSubmit}
            isLoading={isLoading}
            className="bg-[#0D5C53] hover:bg-[#09423c] text-white"
          >
            Simpan Password Baru
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2.5 animate-in fade-in duration-150">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
            <div className="flex-1 font-medium">{errorMessage}</div>
          </div>
        )}

        {/* Info Box */}
        <div className="p-3 bg-teal-50/60 border border-teal-200/80 rounded-xl text-[#0D5C53] text-xs flex items-start gap-2.5">
          <Lock className="w-4 h-4 shrink-0 mt-0.5 text-[#0D5C53]" />
          <p className="leading-relaxed">
            Pastikan password baru terdiri dari minimal 6 karakter. Gunakan kombinasi huruf dan angka agar akun Anda tetap aman.
          </p>
        </div>

        {/* Input: Password Baru */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700">
            Password Baru <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              type={showNewPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder="Masukkan password baru (min. 6 karakter)"
              disabled={isLoading}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53] focus:bg-white transition-all pr-10"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowNewPassword((prev) => !prev)}
              tabIndex={-1}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Input: Konfirmasi Password Baru */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700">
            Konfirmasi Password Baru <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder="Ulangi password baru"
              disabled={isLoading}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53] focus:bg-white transition-all pr-10"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              tabIndex={-1}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {confirmPassword && newPassword === confirmPassword && (
            <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 mt-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Password cocok
            </p>
          )}
        </div>
      </form>
    </Modal>
  );
};

