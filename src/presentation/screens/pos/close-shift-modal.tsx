import React, { useState } from 'react';
import {
  Lock,
  Printer,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Receipt,
  Clock,
  User,
  Store,
  Banknote,
  ArrowDownRight,
  ArrowUpRight,
} from 'lucide-react';
import { Modal, Button, FormField, Badge, toast } from '@presentation/components/ui';
import { useCloseShiftMutation } from '@domain/hooks/queries';
import { shiftService } from '@domain/services/shift-service';
import type { PosShift, ShiftSummaryData } from '@model/Shift';
import type { Order } from '@model/Order';

interface CloseShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentShift: PosShift;
  openOrders: Order[];
  onShiftClosedSuccess?: () => void;
}

export const CloseShiftModal: React.FC<CloseShiftModalProps> = ({
  isOpen,
  onClose,
  currentShift,
  openOrders,
  onShiftClosedSuccess,
}) => {
  const [actualCash, setActualCash] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [summaryData, setSummaryData] = useState<ShiftSummaryData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const closeShiftMutation = useCloseShiftMutation();
  const hasOpenOrders = openOrders.length > 0;

  const handleConfirmClose = async () => {
    if (hasOpenOrders) {
      toast.error(
        `Masih ada ${openOrders.length} pesanan yang belum diselesaikan atau dibayar. Selesaikan semua pesanan sebelum menutup shift!`
      );
      return;
    }

    if (actualCash < 0) {
      toast.error('Jumlah uang fisik tidak boleh negatif.');
      return;
    }

    setIsSubmitting(true);
    try {
      const closed = await closeShiftMutation.mutateAsync({
        shiftId: currentShift.id,
        payload: {
          actualCash,
          notes: notes.trim() || undefined,
        },
      });

      // Fetch complete summary for receipt preview
      const summary = await shiftService.getShiftSummary(closed.id);
      setSummaryData(summary);
      toast.success('Shift kasir berhasil ditutup!');
      if (onShiftClosedSuccess) {
        onShiftClosedSuccess();
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Gagal menutup shift kasir.';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  // If summaryData is set, render the Summary / Thermal Receipt view
  if (summaryData) {
    const diff = summaryData.cashDifference;
    const isMatch = summaryData.differenceStatus === 'MATCH' || diff === 0;
    const isSurplus = summaryData.differenceStatus === 'SURPLUS' || diff > 0;
    const isShort = summaryData.differenceStatus === 'SHORT' || diff < 0;

    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Ringkasan Tutup Shift Kasir"
        subtitle="Rekapitulasi fisik laci dan audit penjualan shift"
        maxWidth="md"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Printer className="w-4 h-4 text-slate-600" />}
              onClick={handlePrintReceipt}
            >
              Cetak Struk Rekap
            </Button>
            <Button variant="primary" size="sm" onClick={onClose} className="font-bold">
              Selesai & Keluar
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {/* Status Badge */}
          <div
            className={`p-3.5 rounded-2xl border flex items-center justify-between ${
              isMatch
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : isSurplus
                ? 'bg-teal-50 border-teal-200 text-teal-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {isMatch ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              ) : isSurplus ? (
                <CheckCircle2 className="w-5 h-5 text-teal-600" />
              ) : (
                <XCircle className="w-5 h-5 text-rose-600" />
              )}
              <div>
                <p className="text-xs font-bold">
                  {isMatch
                    ? 'Uang Kas Sesuai (Balance)'
                    : isSurplus
                    ? `Surplus Kas (+Rp ${Math.abs(diff).toLocaleString('id-ID')})`
                    : `Selisih Kurang (-Rp ${Math.abs(diff).toLocaleString('id-ID')})`}
                </p>
                <p className="text-[11px] opacity-80">
                  {isMatch
                    ? 'Uang fisik di laci cocok dengan catatan sistem.'
                    : isSurplus
                    ? 'Uang fisik di laci lebih banyak dari sistem.'
                    : 'Uang fisik di laci kurang dari catatan sistem.'}
                </p>
              </div>
            </div>
            <span
              className={`text-xs font-black px-2.5 py-1 rounded-full ${
                isMatch
                  ? 'bg-emerald-200 text-emerald-900'
                  : isSurplus
                  ? 'bg-teal-200 text-teal-900'
                  : 'bg-rose-200 text-rose-900'
              }`}
            >
              {summaryData.differenceStatus}
            </span>
          </div>

          {/* Printable Thermal Receipt Style Box */}
          <div
            id="shift-thermal-receipt"
            className="bg-slate-50 border border-slate-200 rounded-2xl p-4 font-mono text-xs space-y-3"
          >
            {/* Header */}
            <div className="text-center pb-2 border-b border-dashed border-slate-300 space-y-0.5">
              <h4 className="font-extrabold text-sm uppercase text-slate-800">
                {summaryData.outletName}
              </h4>
              <p className="text-[10px] text-slate-500 font-sans">REKAPITULASI SHIFT KASIR</p>
              <div className="text-[10px] text-slate-600 pt-1">
                <span>Kasir: {summaryData.cashierName}</span> •{' '}
                <span>Durasi: {summaryData.durationHours} Jam</span>
              </div>
              <div className="text-[10px] text-slate-400">
                Buka: {new Date(summaryData.openedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} • Tutup:{' '}
                {new Date(summaryData.closedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>

            {/* Calculations Breakdown */}
            <div className="space-y-1.5 text-slate-700">
              <div className="flex justify-between">
                <span>Modal Awal (Float)</span>
                <span>Rp {summaryData.openingCash.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-teal-700">
                <span>(+) Penjualan Tunai</span>
                <span>+Rp {summaryData.totalCashSales.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-rose-600">
                <span>(-) Kas Keluar (Petty Cash)</span>
                <span>-Rp {summaryData.totalCashOut.toLocaleString('id-ID')}</span>
              </div>
              <div className="pt-1.5 border-t border-dashed border-slate-300 flex justify-between font-bold text-slate-900">
                <span>Uang Seharusnya (Sistem)</span>
                <span>Rp {summaryData.expectedCash.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900">
                <span>Uang Fisik Dihitung</span>
                <span>Rp {summaryData.actualCash.toLocaleString('id-ID')}</span>
              </div>
              <div
                className={`pt-1 border-t border-slate-300 flex justify-between font-extrabold ${
                  diff < 0 ? 'text-rose-600' : diff > 0 ? 'text-teal-700' : 'text-slate-800'
                }`}
              >
                <span>Selisih Kas</span>
                <span>
                  {diff > 0 ? '+' : ''}Rp {diff.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* Petty Cash List if any */}
            {summaryData.pettyCashList && summaryData.pettyCashList.length > 0 && (
              <div className="pt-2 border-t border-dashed border-slate-300">
                <p className="text-[10px] font-bold text-slate-600 uppercase mb-1">
                  Rincian Kas Keluar ({summaryData.pettyCashList.length}):
                </p>
                <div className="space-y-1">
                  {summaryData.pettyCashList.map((pc, idx) => (
                    <div key={pc.id || idx} className="flex justify-between text-[11px] text-slate-600">
                      <span className="truncate pr-2">• {pc.category} ({pc.notes || 'Operasional'})</span>
                      <span className="shrink-0">-Rp {pc.amount.toLocaleString('id-ID')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </Modal>
    );
  }

  // Otherwise, render the Blind Close input form
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Tutup Shift Kasir"
      subtitle="Hitung uang fisik di laci kasir dan selesaikan pergantian shift"
      maxWidth="md"
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Batal
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleConfirmClose}
            isLoading={isSubmitting}
            disabled={hasOpenOrders}
            leftIcon={<Lock className="w-4 h-4" />}
            className="font-bold bg-[#0D5C53]"
          >
            Tutup Shift & Hitung Selisih
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Open Orders Warning */}
        {hasOpenOrders && (
          <div className="p-3.5 bg-rose-50 border-2 border-rose-300 rounded-2xl flex items-start gap-2.5 text-xs text-rose-900">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm">Tidak Dapat Menutup Shift!</p>
              <p className="text-[11px] mt-0.5 text-rose-700 leading-relaxed">
                Masih terdapat <strong>{openOrders.length} pesanan berjalan / meja belum dibayar</strong>.
                Semua pesanan harus diselesaikan pembayarannya atau dibatalkan sebelum shift dapat ditutup.
              </p>
            </div>
          </div>
        )}

        {/* Blind Close Explanation Card */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5 text-xs text-slate-600">
          <div className="flex items-center gap-1.5 font-bold text-slate-800">
            <HelpCircle className="w-4 h-4 text-[#0D5C53]" />
            <span>SOP Blind Close Kasir:</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            Hitung seluruh uang kertas dan koin yang ada di dalam laci kasir secara jujur tanpa melihat estimasi sistem. Sistem akan menghitung otomatis selisih kas setelah tombol ditekan.
          </p>
        </div>

        {/* Input Uang Fisik Di Laci */}
        <FormField label="Total Uang Fisik di Laci Kasir (Rp)" required>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#0D5C53] font-bold text-xs">
              Rp
            </div>
            <input
              type="number"
              min="0"
              step="1000"
              value={actualCash === 0 ? '' : actualCash}
              onChange={(e) => setActualCash(Number(e.target.value) || 0)}
              placeholder="0"
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53]"
            />
          </div>
        </FormField>

        {/* Catatan Penutupan */}
        <FormField label="Catatan Penutupan Shift (Opsional)">
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Contoh: Shift berjalan lancar, uang fisik pecahan lengkap"
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53]"
          />
        </FormField>
      </div>
    </Modal>
  );
};

