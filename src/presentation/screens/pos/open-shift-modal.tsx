import React, { useState } from 'react';
import { Store, Banknote, ShieldAlert } from 'lucide-react';
import { Modal, Button, FormField, toast } from '@presentation/components/ui';
import { useOpenShiftMutation } from '@domain/hooks/queries';
import { useAuthStore } from '@domain/state/auth-store';

interface OpenShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  outletId: string;
  outletName: string;
}

const QUICK_AMOUNTS = [100000, 200000, 300000, 500000];

export const OpenShiftModal: React.FC<OpenShiftModalProps> = ({
  isOpen,
  onClose,
  outletId,
  outletName,
}) => {
  const user = useAuthStore((state) => state.user);
  const [openingCash, setOpeningCash] = useState<number>(200000);
  const [notes, setNotes] = useState<string>('');
  const openShiftMutation = useOpenShiftMutation();

  const handleOpen = async () => {
    if (openingCash < 0) {
      toast.error('Modal awal tidak boleh negatif.');
      return;
    }

    try {
      await openShiftMutation.mutateAsync({
        outletId,
        openingCash,
        notes: notes.trim() || undefined,
      });
      toast.success('Shift kasir berhasil dibuka!');
      onClose();
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Gagal membuka shift kasir.';
      toast.error(errorMsg);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        // Prevent accidental closing if shift is required, but allow close if needed
        onClose();
      }}
      title="Buka Shift Kasir Baru"
      subtitle="Siapkan modal uang tunai di laci sebelum memulai transaksi"
      maxWidth="md"
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <Button variant="outline" size="sm" onClick={onClose} disabled={openShiftMutation.isPending}>
            Batal
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpen}
            isLoading={openShiftMutation.isPending}
            leftIcon={<Banknote className="w-4 h-4" />}
            className="font-bold"
          >
            Buka Shift Sekarang
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Info Banner */}
        <div className="p-3.5 bg-teal-50/70 border border-teal-200/80 rounded-xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0D5C53] text-white flex items-center justify-center font-bold text-xs shadow-xs">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-slate-800">{outletName || 'Cabang POS'}</p>
              <p className="text-[11px] text-slate-500">
                Kasir: <strong className="text-slate-700">{user?.name || user?.email}</strong>
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full">
            Shift Baru
          </span>
        </div>

        {/* Input Modal Awal */}
        <FormField label="Modal Awal Kasir / Float (Rp)" required>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold text-xs">
              Rp
            </div>
            <input
              type="number"
              min="0"
              step="1000"
              value={openingCash === 0 ? '' : openingCash}
              onChange={(e) => setOpeningCash(Number(e.target.value) || 0)}
              placeholder="0"
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53]"
            />
          </div>
        </FormField>

        {/* Quick Amount Suggestion Chips */}
        <div>
          <label className="text-[11px] font-semibold text-slate-500 mb-1.5 block">
            Pilihan Nominal Cepat:
          </label>
          <div className="grid grid-cols-4 gap-2">
            {QUICK_AMOUNTS.map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setOpeningCash(amt)}
                className={`py-1.5 px-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer text-center ${
                  openingCash === amt
                    ? 'bg-[#0D5C53] text-white border-[#0D5C53] shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                Rp {(amt / 1000).toLocaleString('id-ID')}rb
              </button>
            ))}
          </div>
        </div>

        {/* Catatan */}
        <FormField label="Catatan Kasir (Opsional)">
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Contoh: Pecahan Rp 50.000 x 4 lembar"
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53]"
          />
        </FormField>

        <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 flex items-start gap-2 text-xs text-amber-800">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed">
            Pastikan uang fisik di laci telah dihitung dengan tepat. Selisih kas akan terekam otomatis saat Anda melakukan Tutup Shift.
          </p>
        </div>
      </div>
    </Modal>
  );
};

