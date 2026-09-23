import React, { useState, useRef } from 'react';
import { ArrowUpRight, Camera, Upload, Trash2, ShieldAlert, Image as ImageIcon } from 'lucide-react';
import { Modal, Button, FormField, toast } from '@presentation/components/ui';
import { usePettyCashMutation } from '@domain/hooks/queries';
import { shiftService } from '@domain/services/shift-service';

interface PettyCashModalProps {
  isOpen: boolean;
  onClose: () => void;
  outletId: string;
}

const CATEGORIES = [
  'Beli Bahan Darurat',
  'Parkir & Operasional',
  'Kebersihan',
  'Lainnya',
];

export const PettyCashModal: React.FC<PettyCashModalProps> = ({
  isOpen,
  onClose,
  outletId,
}) => {
  const [amount, setAmount] = useState<number>(0);
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [notes, setNotes] = useState<string>('');
  const [receiptPhotoUrl, setReceiptPhotoUrl] = useState<string>('');
  const [uploading, setUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const pettyCashMutation = usePettyCashMutation();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('File harus berupa foto/gambar nota (JPG, PNG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran foto maksimal 5 MB.');
      return;
    }

    setUploading(true);
    try {
      const res = await shiftService.uploadReceipt(file);
      setReceiptPhotoUrl(res.url);
      toast.success('Foto nota berhasil diunggah.');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Gagal mengunggah foto nota.';
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!amount || amount <= 0) {
      toast.error('Nominal kas keluar harus lebih besar dari 0.');
      return;
    }

    if (!notes.trim()) {
      toast.error('Keterangan / keperluan kas keluar wajib diisi.');
      return;
    }

    if (!receiptPhotoUrl) {
      toast.error('Foto nota / bukti pembayaran wajib diunggah sesuai SOP.');
      return;
    }

    try {
      await pettyCashMutation.mutateAsync({
        outletId,
        amount,
        category,
        notes: notes.trim(),
        receiptPhotoUrl,
      });

      toast.success('Pengeluaran kas kecil berhasil dicatat.');
      // Reset form
      setAmount(0);
      setCategory(CATEGORIES[0]);
      setNotes('');
      setReceiptPhotoUrl('');
      onClose();
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Gagal mencatat kas keluar.';
      toast.error(errorMsg);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Catat Kas Keluar (Petty Cash)"
      subtitle="Pengeluaran operasional darurat langsung dari laci kasir"
      maxWidth="md"
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <Button variant="outline" size="sm" onClick={onClose} disabled={pettyCashMutation.isPending || uploading}>
            Batal
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            isLoading={pettyCashMutation.isPending}
            disabled={uploading}
            leftIcon={<ArrowUpRight className="w-4 h-4" />}
            className="font-bold bg-rose-600 hover:bg-rose-700 border-rose-600"
          >
            Simpan Kas Keluar
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Nominal Pengeluaran */}
        <FormField label="Nominal Kas Keluar (Rp)" required>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-rose-500 font-bold text-xs">
              Rp
            </div>
            <input
              type="number"
              min="0"
              step="1000"
              value={amount === 0 ? '' : amount}
              onChange={(e) => setAmount(Number(e.target.value) || 0)}
              placeholder="0"
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            />
          </div>
        </FormField>

        {/* Kategori Pengeluaran */}
        <FormField label="Kategori Pengeluaran" required>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53]"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </FormField>

        {/* Keperluan / Catatan */}
        <FormField label="Keterangan / Keperluan" required>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Contoh: Beli es batu kristal 2 kantong di Alfamart karena stok habis"
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53]"
          />
        </FormField>

        {/* Upload Foto Nota (Wajib) */}
        <div>
          <label className="text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
            <span>
              Foto Nota / Bukti Struk <span className="text-rose-500">*</span>
            </span>
            <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              Wajib SOP
            </span>
          </label>

          <input
            type="file"
            accept="image/*"
            capture="environment"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />

          {receiptPhotoUrl ? (
            <div className="relative border-2 border-emerald-300 bg-emerald-50/50 rounded-2xl p-2.5 flex items-center gap-3">
              <img
                src={receiptPhotoUrl}
                alt="Bukti Nota"
                className="w-16 h-16 object-cover rounded-xl border border-emerald-200 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-emerald-900 truncate">Foto Nota Terlampir</p>
                <p className="text-[10px] text-emerald-700">Tersimpan di server bukti transaksi</p>
              </div>
              <button
                type="button"
                onClick={() => setReceiptPhotoUrl('')}
                className="p-1.5 text-rose-500 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                title="Hapus foto"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-slate-300 hover:border-[#0D5C53] rounded-2xl p-4 flex flex-col items-center justify-center gap-1.5 text-slate-500 hover:text-[#0D5C53] bg-slate-50 hover:bg-teal-50/40 transition-colors cursor-pointer"
            >
              {uploading ? (
                <div className="text-xs font-semibold text-teal-700 animate-pulse">
                  Mengunggah foto bukti...
                </div>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-[#0D5C53] shadow-xs">
                    <Camera className="w-5 h-5 text-teal-700" />
                  </div>
                  <span className="text-xs font-bold text-slate-700">Ambil Foto / Unggah Nota</span>
                  <span className="text-[10px] text-slate-400">Kamera atau galeri ponsel/tablet (Maks. 5 MB)</span>
                </>
              )}
            </button>
          )}
        </div>

        <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 flex items-start gap-2 text-xs text-amber-800">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed">
            Pengeluaran ini akan langsung memotong uang laci shift berjalan dan otomatis tercatat pada Buku Kas & Jurnal Pengeluaran Operasional back-office.
          </p>
        </div>
      </div>
    </Modal>
  );
};

