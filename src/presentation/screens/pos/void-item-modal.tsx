import React, { useState, useEffect } from 'react';
import { Modal, Button, FormSelect, FormTextarea, FormInput } from '@presentation/components/ui';
import { AlertTriangle, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '@domain/state/auth-store';
import { useGlobalTaxConfig } from '@domain/hooks';

interface VoidItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemName?: string;
  onConfirmVoid: (reason: string, password?: string) => Promise<void>;
}

export const VoidItemModal: React.FC<VoidItemModalProps> = ({
  isOpen,
  onClose,
  itemName,
  onConfirmVoid,
}) => {
  const currentOutlet = useAuthStore((state) => state.currentOutlet);
  const currentUser = useAuthStore((state) => state.user);
  const { data: globalConfig } = useGlobalTaxConfig(currentOutlet?.id);

  const verificationMode = globalConfig?.voidVerificationMode ?? 'SUPERVISOR_APPROVAL';

  const isAlreadyApprover = Boolean(
    currentUser?.isSuperAdmin ||
      currentUser?.role?.menuAccess?.includes('*') ||
      currentUser?.role?.menuAccess?.includes('order.void.approve')
  );

  const isPasswordRequired =
    verificationMode === 'SELF_PASSWORD' ||
    (verificationMode === 'SUPERVISOR_APPROVAL' && !isAlreadyApprover);

  const [reasonCategory, setReasonCategory] = useState<string>('Pelanggan Membatalkan');
  const [customReason, setCustomReason] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setPasswordError('');
      setCustomReason('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const VOID_REASONS = [
    'Pelanggan Membatalkan (Customer Changed Mind)',
    'Salah Input Menu (Wrong Entry)',
    'Stok Menu Habis (Out of Stock)',
    'Kualitas Menu Tidak Sesuai (Quality Issue)',
    'Alasan Lainnya (Other)',
  ];

  const handleSubmit = async () => {
    setPasswordError('');
    if (isPasswordRequired && !password.trim()) {
      setPasswordError(
        verificationMode === 'SUPERVISOR_APPROVAL'
          ? 'Password atasan wajib diisi untuk otorisasi void'
          : 'Password kasir wajib diisi untuk konfirmasi'
      );
      return;
    }

    const finalReason = customReason
      ? `${reasonCategory}: ${customReason}`
      : reasonCategory;

    setLoading(true);
    try {
      await onConfirmVoid(finalReason, password ? password.trim() : undefined);
      onClose();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      const msg = error.response?.data?.message || error.message || 'Gagal membatalkan menu';
      setPasswordError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Batalkan Item (Void Menu)"
      subtitle={itemName ? `Menu: ${itemName}` : 'Konfirmasi pembatalan item pesanan'}
      maxWidth="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Batal
          </Button>
          <Button
            variant="danger"
            isLoading={loading}
            onClick={handleSubmit}
          >
            Konfirmasi Void
          </Button>
        </>
      }
    >
      <div className="space-y-4 py-1">
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>
            Menu yang telah disimpan/dikirim ke dapur akan dibatalkan dan dicatat dalam riwayat audit pembatalan.
          </span>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">
            Pilih Kategori Alasan:
          </label>
          <FormSelect
            value={reasonCategory}
            onChange={(e) => setReasonCategory(e.target.value)}
          >
            {VOID_REASONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </FormSelect>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">
            Catatan Tambahan (Opsional):
          </label>
          <FormTextarea
            value={customReason}
            onChange={(e) => setCustomReason(e.target.value)}
            placeholder="Jelaskan alasan pembatalan jika diperlukan..."
            rows={2}
          />
        </div>

        {/* Password Authorization Input - 1 Single Column */}
        {isPasswordRequired && (
          <div className="pt-2 border-t border-slate-100">
            <FormInput
              type="password"
              label={
                verificationMode === 'SUPERVISOR_APPROVAL'
                  ? 'Password Otorisasi Atasan'
                  : 'Password Kasir'
              }
              placeholder={
                verificationMode === 'SUPERVISOR_APPROVAL'
                  ? 'Masukkan password atasan...'
                  : 'Masukkan password Anda...'
              }
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (passwordError) setPasswordError('');
              }}
              error={passwordError}
              helperText={
                verificationMode === 'SUPERVISOR_APPROVAL'
                  ? 'Password dari akun yang berwenang (Supervisor/Manager/Owner).'
                  : 'Masukkan password kasir yang sedang aktif untuk konfirmasi.'
              }
              required
              autoFocus
            />
          </div>
        )}

        {verificationMode === 'SUPERVISOR_APPROVAL' && isAlreadyApprover && (
          <div className="p-2.5 bg-teal-50/70 border border-teal-200 rounded-xl text-[11px] text-[#0D5C53] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#0D5C53] shrink-0" />
            <span>
              Akun Anda ({currentUser?.name}) memiliki wewenang approval langsung.
            </span>
          </div>
        )}
      </div>
    </Modal>
  );
};
