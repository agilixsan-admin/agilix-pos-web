import React, { useState } from 'react';
import { Modal, Button, FormSelect, FormTextarea } from '@presentation/components/ui';
import { AlertTriangle } from 'lucide-react';

interface VoidItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemName?: string;
  onConfirmVoid: (reason: string) => Promise<void>;
}

export const VoidItemModal: React.FC<VoidItemModalProps> = ({
  isOpen,
  onClose,
  itemName,
  onConfirmVoid,
}) => {
  const [reasonCategory, setReasonCategory] = useState<string>('Pelanggan Membatalkan');
  const [customReason, setCustomReason] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  if (!isOpen) return null;

  const VOID_REASONS = [
    'Pelanggan Membatalkan (Customer Changed Mind)',
    'Salah Input Menu (Wrong Entry)',
    'Stok Menu Habis (Out of Stock)',
    'Kualitas Menu Tidak Sesuai (Quality Issue)',
    'Alasan Lainnya (Other)',
  ];

  const handleSubmit = async () => {
    const finalReason = customReason
      ? `${reasonCategory}: ${customReason}`
      : reasonCategory;

    setLoading(true);
    try {
      await onConfirmVoid(finalReason);
      onClose();
    } catch {
      // Handled by parent
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
      </div>
    </Modal>
  );
};

