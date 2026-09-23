import React, { useState } from 'react';
import {
  Clock,
  Printer,
  Calendar,
  Building2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Receipt,
  User,
  Eye,
  DollarSign,
  ArrowUpRight,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { useAuthStore } from '@domain/state/auth-store';
import { useOutlets } from '@domain/hooks';
import { useShiftReconciliationReport } from '@domain/hooks/queries';
import {
  KpiCard,
  Button,
  Badge,
  Modal,
  LoadingState,
  EmptyState,
  CustomSelect,
} from '@presentation/components/ui';
import type { ShiftReconciliationItem } from '@domain/services/report-service';

export const ShiftReconciliationScreen: React.FC = () => {
  const currentOutlet = useAuthStore((state) => state.currentOutlet);
  const { data: outlets = [] } = useOutlets();
  const [selectedOutletId, setSelectedOutletId] = useState<string>('ALL');

  const effectiveOutletId = selectedOutletId === 'ALL' ? undefined : selectedOutletId;

  // Date Range Presets
  const [datePreset, setDatePreset] = useState<string>('THIS_MONTH');

  const getDateRange = (preset: string) => {
    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).toISOString();
    if (preset === 'TODAY') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).toISOString();
      return { startDate: start, endDate: end };
    }
    if (preset === 'LAST_7_DAYS') {
      const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      return { startDate: start, endDate: end };
    }
    if (preset === 'THIS_MONTH') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0).toISOString();
      return { startDate: start, endDate: end };
    }
    const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    return { startDate: start, endDate: end };
  };

  const { startDate, endDate } = getDateRange(datePreset);

  const { data: reportData, isLoading } = useShiftReconciliationReport({
    startDate,
    endDate,
    outletId: effectiveOutletId,
  });

  const shifts = reportData?.shifts || [];
  const summary = reportData?.summary || {
    totalShifts: 0,
    totalCashSales: 0,
    totalCashOut: 0,
    totalDifference: 0,
    totalShortCount: 0,
    totalSurplusCount: 0,
  };

  // Detail Modal
  const [selectedShift, setSelectedShift] = useState<ShiftReconciliationItem | null>(null);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#0D5C53]" />
              Laporan Rekonsiliasi Shift
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Cash Audit POS
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Audit laci kasir, rekonsiliasi uang fisik vs estimasi sistem, dan deteksi selisih kasir (Over/Short)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Outlet Filter */}
          <div className="w-44">
            <CustomSelect
              options={[
                { value: 'ALL', label: 'Semua Cabang' },
                ...outlets.map((o) => ({ value: o.id, label: o.name })),
              ]}
              value={selectedOutletId}
              onChange={setSelectedOutletId}
            />
          </div>

          {/* Date Filter */}
          <div className="w-40">
            <CustomSelect
              options={[
                { value: 'TODAY', label: 'Hari Ini' },
                { value: 'LAST_7_DAYS', label: '7 Hari Terakhir' },
                { value: 'THIS_MONTH', label: 'Bulan Ini' },
                { value: 'LAST_30_DAYS', label: '30 Hari Terakhir' },
              ]}
              value={datePreset}
              onChange={setDatePreset}
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            leftIcon={<Printer className="w-4 h-4 text-slate-600" />}
            onClick={handlePrint}
            className="font-semibold"
          >
            Cetak / PDF
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Shift Selesai"
          value={summary.totalShifts.toString()}
          icon={<Clock className="w-5 h-5 text-blue-600" />}
          subtitle="Sesi kasir tercatat"
        />
        <KpiCard
          title="Total Penjualan Tunai"
          value={`Rp ${summary.totalCashSales.toLocaleString('id-ID')}`}
          icon={<DollarSign className="w-5 h-5 text-emerald-600" />}
          subtitle="Uang kasir masuk"
        />
        <KpiCard
          title="Total Kas Keluar (Petty)"
          value={`Rp ${summary.totalCashOut.toLocaleString('id-ID')}`}
          icon={<ArrowUpRight className="w-5 h-5 text-rose-600" />}
          subtitle="Pengeluaran darurat laci"
        />
        <KpiCard
          title="Total Selisih Kas"
          value={`${summary.totalDifference > 0 ? '+' : ''}Rp ${summary.totalDifference.toLocaleString('id-ID')}`}
          icon={
            summary.totalDifference < 0 ? (
              <TrendingDown className="w-5 h-5 text-rose-600" />
            ) : (
              <TrendingUp className="w-5 h-5 text-teal-600" />
            )
          }
          subtitle={`${summary.totalShortCount} Shift Kurang • ${summary.totalSurplusCount} Shift Lebih`}
        />
      </div>

      {/* Shifts Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="font-bold text-sm text-slate-900">
            Riwayat Audit Sesi Kasir ({shifts.length})
          </h3>
          <span className="text-xs text-slate-400">
            Hasil Blind Close dihitung otomatis oleh sistem
          </span>
        </div>

        {isLoading ? (
          <LoadingState message="Memuat rekonsiliasi shift..." />
        ) : shifts.length === 0 ? (
          <EmptyState
            icon={<Clock className="w-10 h-10 opacity-30 text-slate-400 mx-auto" />}
            title="Belum Ada Rekap Shift"
            description="Tidak ada data shift kasir pada rentang waktu yang dipilih."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase text-[10px]">
                  <th className="pb-3 font-semibold">Waktu Shift</th>
                  <th className="pb-3 font-semibold">Cabang</th>
                  <th className="pb-3 font-semibold">Kasir</th>
                  <th className="pb-3 font-semibold text-right">Modal Awal</th>
                  <th className="pb-3 font-semibold text-right">Penjualan Tunai</th>
                  <th className="pb-3 font-semibold text-right">Kas Keluar</th>
                  <th className="pb-3 font-semibold text-right">Uang Sistem</th>
                  <th className="pb-3 font-semibold text-right">Uang Fisik</th>
                  <th className="pb-3 font-semibold text-right">Selisih</th>
                  <th className="pb-3 font-semibold text-center">Status</th>
                  <th className="pb-3 font-semibold text-right">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {shifts.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 font-sans text-slate-700">
                      <p className="font-bold text-xs text-slate-900">
                        {new Date(s.openedAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {new Date(s.openedAt).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        -{' '}
                        {s.closedAt
                          ? new Date(s.closedAt).toLocaleTimeString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'Aktif'}
                      </p>
                    </td>
                    <td className="py-3 font-sans font-medium text-slate-800">
                      {s.outletName}
                    </td>
                    <td className="py-3 font-sans font-semibold text-slate-800">
                      {s.cashierName}
                    </td>
                    <td className="py-3 text-right text-slate-700">
                      Rp {s.openingCash.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 text-right text-teal-700 font-semibold">
                      +Rp {s.totalCashSales.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 text-right text-rose-600">
                      {s.totalCashOut > 0 ? `-Rp ${s.totalCashOut.toLocaleString('id-ID')}` : '-'}
                    </td>
                    <td className="py-3 text-right font-bold text-slate-800">
                      Rp {s.expectedCash.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 text-right font-bold text-slate-900">
                      Rp {s.actualCash.toLocaleString('id-ID')}
                    </td>
                    <td
                      className={`py-3 text-right font-black ${
                        s.cashDifference < 0
                          ? 'text-rose-600'
                          : s.cashDifference > 0
                          ? 'text-teal-700'
                          : 'text-slate-700'
                      }`}
                    >
                      {s.cashDifference > 0 ? '+' : ''}
                      Rp {s.cashDifference.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 text-center font-sans">
                      <Badge
                        variant={
                          s.differenceStatus === 'MATCH'
                            ? 'success'
                            : s.differenceStatus === 'SURPLUS'
                            ? 'info'
                            : 'danger'
                        }
                        size="sm"
                      >
                        {s.differenceStatus}
                      </Badge>
                    </td>
                    <td className="py-3 text-right font-sans">
                      <button
                        type="button"
                        onClick={() => setSelectedShift(s)}
                        className="inline-flex items-center gap-1 text-[11px] text-teal-700 hover:text-[#0D5C53] font-semibold bg-teal-50 hover:bg-teal-100 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Rincian</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DETAIL MODAL */}
      {selectedShift && (
        <Modal
          isOpen={!!selectedShift}
          onClose={() => setSelectedShift(null)}
          title={`Detail Rekonsiliasi Shift: ${selectedShift.cashierName}`}
          subtitle={`${selectedShift.outletName} • ${new Date(selectedShift.openedAt).toLocaleString('id-ID')}`}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            {/* Summary Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 font-mono space-y-2">
              <div className="flex justify-between text-slate-700">
                <span>Modal Awal (Float):</span>
                <span>Rp {selectedShift.openingCash.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-teal-700">
                <span>(+) Penjualan Tunai:</span>
                <span>+Rp {selectedShift.totalCashSales.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-rose-600">
                <span>(-) Kas Keluar (Petty Cash):</span>
                <span>-Rp {selectedShift.totalCashOut.toLocaleString('id-ID')}</span>
              </div>
              <div className="pt-2 border-t border-dashed border-slate-300 flex justify-between font-bold text-slate-900">
                <span>Uang Seharusnya (Sistem):</span>
                <span>Rp {selectedShift.expectedCash.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900">
                <span>Uang Fisik Kasir:</span>
                <span>Rp {selectedShift.actualCash.toLocaleString('id-ID')}</span>
              </div>
              <div
                className={`pt-1 border-t border-slate-300 flex justify-between font-black ${
                  selectedShift.cashDifference < 0
                    ? 'text-rose-600'
                    : selectedShift.cashDifference > 0
                    ? 'text-teal-700'
                    : 'text-slate-800'
                }`}
              >
                <span>Selisih Fisik Laci:</span>
                <span>
                  {selectedShift.cashDifference > 0 ? '+' : ''}Rp{' '}
                  {selectedShift.cashDifference.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {selectedShift.notes && (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900">
                <span className="font-bold block mb-0.5">Catatan Kasir:</span>
                <p>{selectedShift.notes}</p>
              </div>
            )}

            {/* Petty Cash List & Receipts */}
            <div>
              <h5 className="font-bold text-slate-800 mb-2">
                Daftar Kas Keluar ({selectedShift.pettyCashList?.length || 0}):
              </h5>
              {!selectedShift.pettyCashList || selectedShift.pettyCashList.length === 0 ? (
                <p className="text-slate-400 italic">Tidak ada kas kecil keluar pada shift ini.</p>
              ) : (
                <div className="space-y-2">
                  {selectedShift.pettyCashList.map((pc) => (
                    <div
                      key={pc.id}
                      className="border border-slate-200 rounded-xl p-2.5 flex items-center justify-between gap-3 bg-white"
                    >
                      <div className="flex items-center gap-2.5">
                        {pc.receiptPhotoUrl ? (
                          <img
                            src={pc.receiptPhotoUrl}
                            alt="Bukti Nota"
                            className="w-10 h-10 object-cover rounded-lg border border-slate-200 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                            <Receipt className="w-4 h-4" />
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-slate-800">{pc.category}</p>
                          <p className="text-[11px] text-slate-500">{pc.notes || 'Operasional'}</p>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-rose-600">
                        -Rp {pc.amount.toLocaleString('id-ID')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

