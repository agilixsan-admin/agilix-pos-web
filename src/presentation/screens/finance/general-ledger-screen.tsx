import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  Trash2,
  Calendar,
  Layers,
  ArrowRightLeft,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  ListFilter,
} from 'lucide-react';
import { useAuthStore } from '@domain/state/auth-store';
import { useOutlets } from '@domain/hooks';
import {
  useChartOfAccounts,
  useJournalEntries,
  useCreateManualJournalMutation,
} from '@domain/hooks/queries';
import {
  KpiCard,
  Button,
  Badge,
  Modal,
  FormField,
  LoadingState,
  EmptyState,
  CustomSelect,
  toast,
} from '@presentation/components/ui';
import type { ChartOfAccount, JournalEntry } from '@model/Finance';

interface ManualLineItem {
  accountId: string;
  debit: number;
  credit: number;
  notes?: string;
}

export const GeneralLedgerScreen: React.FC = () => {
  const currentOutlet = useAuthStore((state) => state.currentOutlet);
  const { data: outlets = [] } = useOutlets();
  const [selectedOutletId, setSelectedOutletId] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'JOURNALS' | 'COA'>('JOURNALS');

  const effectiveOutletId = selectedOutletId === 'ALL' ? undefined : selectedOutletId;

  const { data: coaList = [], isLoading: coaLoading } = useChartOfAccounts();
  const { data: journalsResult, isLoading: journalsLoading } = useJournalEntries({
    outletId: effectiveOutletId,
  });

  const journals = journalsResult?.data || [];

  // Modal Jurnal Manual
  const [isManualModalOpen, setIsManualModalOpen] = useState<boolean>(false);
  const [entryDate, setEntryDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [entryDescription, setEntryDescription] = useState<string>('');
  const [manualLines, setManualLines] = useState<ManualLineItem[]>([
    { accountId: '', debit: 0, credit: 0, notes: '' },
    { accountId: '', debit: 0, credit: 0, notes: '' },
  ]);

  const createJournalMutation = useCreateManualJournalMutation();

  const totalDebit = manualLines.reduce((sum, l) => sum + Number(l.debit || 0), 0);
  const totalCredit = manualLines.reduce((sum, l) => sum + Number(l.credit || 0), 0);
  const isBalanced = totalDebit > 0 && Math.round(totalDebit * 100) === Math.round(totalCredit * 100);

  const handleAddLine = () => {
    setManualLines([...manualLines, { accountId: '', debit: 0, credit: 0, notes: '' }]);
  };

  const handleRemoveLine = (index: number) => {
    if (manualLines.length <= 2) {
      toast.error('Jurnal manual minimal memiliki 2 baris (Debit & Kredit).');
      return;
    }
    setManualLines(manualLines.filter((_, i) => i !== index));
  };

  const handleLineChange = (index: number, field: keyof ManualLineItem, value: any) => {
    const updated = [...manualLines];
    updated[index] = { ...updated[index], [field]: value };
    setManualLines(updated);
  };

  const handleCreateManualJournal = async () => {
    if (!entryDescription.trim()) {
      toast.error('Keterangan jurnal umum wajib diisi.');
      return;
    }

    const hasEmptyAccount = manualLines.some((l) => !l.accountId);
    if (hasEmptyAccount) {
      toast.error('Pilih akun perkiraan untuk setiap baris.');
      return;
    }

    if (!isBalanced) {
      toast.error(
        `Total Debit (Rp ${totalDebit.toLocaleString('id-ID')}) dan Total Kredit (Rp ${totalCredit.toLocaleString('id-ID')}) harus seimbang!`
      );
      return;
    }

    try {
      await createJournalMutation.mutateAsync({
        outletId: effectiveOutletId,
        entryDate,
        description: entryDescription.trim(),
        lines: manualLines.map((l) => ({
          accountId: l.accountId,
          debit: Number(l.debit || 0),
          credit: Number(l.credit || 0),
          notes: l.notes?.trim() || undefined,
        })),
      });

      toast.success('Jurnal manual berhasil disimpan.');
      setIsManualModalOpen(false);
      setEntryDescription('');
      setManualLines([
        { accountId: '', debit: 0, credit: 0, notes: '' },
        { accountId: '', debit: 0, credit: 0, notes: '' },
      ]);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Gagal mencatat jurnal manual.';
      toast.error(msg);
    }
  };

  const getSourceBadgeColor = (source: string) => {
    switch (source) {
      case 'ORDER_SALE':
        return 'bg-emerald-100 text-emerald-800';
      case 'ORDER_COGS':
        return 'bg-blue-100 text-blue-800';
      case 'EXPENSE':
      case 'PETTY_CASH':
        return 'bg-rose-100 text-rose-800';
      case 'TRANSFER':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#0D5C53]" />
              Buku Besar & Bagan Akun (COA)
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Double-Entry Accounting
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Penjurnalan otomatis transaksi POS (Omzet & HPP), pengeluaran biaya, serta input jurnal manual
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Outlet Filter */}
          <div className="w-48">
            <CustomSelect
              options={[
                { value: 'ALL', label: 'Semua Cabang' },
                ...outlets.map((o) => ({ value: o.id, label: o.name })),
              ]}
              value={selectedOutletId}
              onChange={setSelectedOutletId}
            />
          </div>

          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setIsManualModalOpen(true)}
            className="font-bold"
          >
            + Jurnal Manual
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-px">
        <button
          onClick={() => setActiveTab('JOURNALS')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
            activeTab === 'JOURNALS'
              ? 'border-[#0D5C53] text-[#0D5C53]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Jurnal Umum ({journals.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('COA')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
            activeTab === 'COA'
              ? 'border-[#0D5C53] text-[#0D5C53]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ListFilter className="w-4 h-4" />
          <span>Bagan Akun / Chart of Accounts ({coaList.length})</span>
        </button>
      </div>

      {/* TAB 1: JURNAL UMUM */}
      {activeTab === 'JOURNALS' && (
        <div className="space-y-4">
          {journalsLoading ? (
            <LoadingState message="Memuat entri jurnal umum..." />
          ) : journals.length === 0 ? (
            <EmptyState
              icon={<BookOpen className="w-10 h-10 opacity-30 text-slate-400 mx-auto" />}
              title="Belum Ada Entri Jurnal"
              description="Entri jurnal akan otomatis terbentuk saat ada transaksi POS selesai atau pengeluaran operasional dicatat."
            />
          ) : (
            journals.map((jrn) => {
              const entryTotalDebit = (jrn.lines || []).reduce(
                (sum, l) => sum + Number(l.debit || 0),
                0
              );
              const entryTotalCredit = (jrn.lines || []).reduce(
                (sum, l) => sum + Number(l.credit || 0),
                0
              );

              return (
                <div
                  key={jrn.id}
                  className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-xs text-slate-800 bg-slate-100 px-2 py-1 rounded-lg">
                        {jrn.entryNumber}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getSourceBadgeColor(
                          jrn.sourceType
                        )}`}
                      >
                        {jrn.sourceType}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        {new Date(jrn.entryDate).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {jrn.outlet?.name && (
                        <span className="text-xs text-slate-500 font-medium">
                          {jrn.outlet.name}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Seimbang
                      </span>
                    </div>
                  </div>

                  <p className="text-xs font-semibold text-slate-800">
                    {jrn.description}
                  </p>

                  {/* Lines Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase text-[10px]">
                          <th className="pb-2 font-semibold">Kode Akun</th>
                          <th className="pb-2 font-semibold">Nama Akun Perkiraan</th>
                          <th className="pb-2 font-semibold">Keterangan</th>
                          <th className="pb-2 font-semibold text-right">Debit (Rp)</th>
                          <th className="pb-2 font-semibold text-right">Kredit (Rp)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono">
                        {jrn.lines?.map((line) => (
                          <tr key={line.id} className="hover:bg-slate-50/50">
                            <td className="py-2 text-slate-500">{line.account?.accountCode || '-'}</td>
                            <td className="py-2 font-sans font-semibold text-slate-800">
                              {line.credit > 0 ? (
                                <span className="pl-6 block text-slate-600">
                                  {line.account?.name || 'Akun'}
                                </span>
                              ) : (
                                <span>{line.account?.name || 'Akun'}</span>
                              )}
                            </td>
                            <td className="py-2 font-sans text-slate-500">{line.notes || '-'}</td>
                            <td className="py-2 text-right font-bold text-slate-900">
                              {Number(line.debit) > 0 ? `Rp ${Number(line.debit).toLocaleString('id-ID')}` : '-'}
                            </td>
                            <td className="py-2 text-right font-bold text-slate-900">
                              {Number(line.credit) > 0 ? `Rp ${Number(line.credit).toLocaleString('id-ID')}` : '-'}
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-slate-50/70 font-bold border-t border-slate-200">
                          <td colSpan={3} className="py-2 text-right pr-4 font-sans text-[11px] text-slate-700">
                            Total Keseimbangan:
                          </td>
                          <td className="py-2 text-right text-emerald-800">
                            Rp {entryTotalDebit.toLocaleString('id-ID')}
                          </td>
                          <td className="py-2 text-right text-emerald-800">
                            Rp {entryTotalCredit.toLocaleString('id-ID')}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 2: CHART OF ACCOUNTS (COA) */}
      {activeTab === 'COA' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                Bagan Akun Standar Industri F&B & Retail Indonesia
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Struktur klasifikasi akun neraca dan laba rugi untuk pelaporan akuntansi otomatis
              </p>
            </div>
          </div>

          {coaLoading ? (
            <LoadingState message="Memuat bagan akun..." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase text-[10px]">
                    <th className="pb-3 font-semibold">Kode Akun</th>
                    <th className="pb-3 font-semibold">Nama Akun</th>
                    <th className="pb-3 font-semibold">Kategori Laporan</th>
                    <th className="pb-3 font-semibold text-center">Saldo Normal</th>
                    <th className="pb-3 font-semibold text-center">Tipe Sistem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {coaList.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2.5 font-mono font-bold text-slate-800">
                        {c.accountCode}
                      </td>
                      <td className="py-2.5 font-semibold text-slate-900">
                        {c.name}
                      </td>
                      <td className="py-2.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                          {c.category}
                        </span>
                      </td>
                      <td className="py-2.5 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                            c.normalBalance === 'DEBIT'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {c.normalBalance}
                        </span>
                      </td>
                      <td className="py-2.5 text-center">
                        {c.isSystem ? (
                          <span className="text-[10px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md">
                            Auto-System
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">Custom</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODAL: INPUT JURNAL MANUAL */}
      <Modal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        title="Input Entri Jurnal Manual"
        subtitle="Entri penyesuaian atau transaksi non-POS dengan validasi keseimbangan Debit = Kredit"
        maxWidth="xl"
        footer={
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2 text-xs">
              {isBalanced ? (
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Seimbang (Rp {totalDebit.toLocaleString('id-ID')})
                </span>
              ) : (
                <span className="text-rose-600 font-bold flex items-center gap-1">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  Selisih: Rp {Math.abs(totalDebit - totalCredit).toLocaleString('id-ID')}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsManualModalOpen(false)}>
                Batal
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleCreateManualJournal}
                isLoading={createJournalMutation.isPending}
                disabled={!isBalanced}
                className="font-bold"
              >
                Posting Jurnal
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Tanggal Jurnal" required>
              <input
                type="date"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53]"
              />
            </FormField>

            <FormField label="Keterangan / Transaksi" required>
              <input
                type="text"
                placeholder="Contoh: Penyesuaian modal pemilik awal bulan"
                value={entryDescription}
                onChange={(e) => setEntryDescription(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53]"
              />
            </FormField>
          </div>

          {/* Lines Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Baris Jurnal (Debit & Kredit)</span>
              <button
                type="button"
                onClick={handleAddLine}
                className="text-xs font-bold text-[#0D5C53] hover:underline flex items-center gap-1 cursor-pointer"
              >
                + Tambah Baris
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
              {manualLines.map((line, idx) => (
                <div key={idx} className="p-3 bg-slate-50/50 flex items-center gap-2.5 text-xs">
                  <div className="w-56 shrink-0">
                    <select
                      value={line.accountId}
                      onChange={(e) => handleLineChange(idx, 'accountId', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0D5C53]"
                    >
                      <option value="">-- Pilih Akun --</option>
                      {coaList.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.accountCode} - {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Catatan baris (opsional)"
                      value={line.notes || ''}
                      onChange={(e) => handleLineChange(idx, 'notes', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0D5C53]"
                    />
                  </div>

                  <div className="w-32 shrink-0">
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      placeholder="Debit (Rp)"
                      value={line.debit === 0 ? '' : line.debit}
                      onChange={(e) => handleLineChange(idx, 'debit', Number(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#0D5C53]"
                    />
                  </div>

                  <div className="w-32 shrink-0">
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      placeholder="Kredit (Rp)"
                      value={line.credit === 0 ? '' : line.credit}
                      onChange={(e) => handleLineChange(idx, 'credit', Number(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#0D5C53]"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveLine(idx)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="p-3 bg-slate-100 rounded-xl flex items-center justify-between text-xs font-bold text-slate-800 font-mono">
              <span>Total Keseimbangan:</span>
              <div className="flex items-center gap-6">
                <span>Debit: Rp {totalDebit.toLocaleString('id-ID')}</span>
                <span>Kredit: Rp {totalCredit.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

