import React, { useState, useRef } from 'react';
import {
  Receipt,
  Plus,
  Trash2,
  Calendar,
  Building2,
  Wallet,
  ArrowUpRight,
  DollarSign,
  Tag,
  Camera,
  Image as ImageIcon,
  ExternalLink,
} from 'lucide-react';
import { useAuthStore } from '@domain/state/auth-store';
import { useOutlets } from '@domain/hooks';
import {
  useExpenses,
  useExpenseCategories,
  useCreateExpenseMutation,
  useCreateExpenseCategoryMutation,
  useDeleteExpenseMutation,
  useFinancialAccounts,
} from '@domain/hooks/queries';
import { shiftService } from '@domain/services/shift-service';
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
import type { Expense, ExpenseCategory } from '@model/Finance';

export const ExpensesScreen: React.FC = () => {
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

  const { data: expenses = [], isLoading: expensesLoading } = useExpenses({
    outletId: effectiveOutletId,
    startDate,
    endDate,
  });

  const { data: categories = [] } = useExpenseCategories();
  const { data: accounts = [] } = useFinancialAccounts(effectiveOutletId);

  // Modals state
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState<boolean>(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState<boolean>(false);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);

  // Add Expense form state
  const [formOutletId, setFormOutletId] = useState<string>('');
  const [formCategoryId, setFormCategoryId] = useState<string>('');
  const [formAccountId, setFormAccountId] = useState<string>('');
  const [formAmount, setFormAmount] = useState<number>(0);
  const [formDate, setFormDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [formRecipient, setFormRecipient] = useState<string>('');
  const [formNotes, setFormNotes] = useState<string>('');
  const [formReceiptUrl, setFormReceiptUrl] = useState<string>('');
  const [uploading, setUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Add Category form state
  const [newCatName, setNewCatName] = useState<string>('');
  const [newCatDesc, setNewCatDesc] = useState<string>('');

  const createExpenseMutation = useCreateExpenseMutation();
  const createCategoryMutation = useCreateExpenseCategoryMutation();
  const deleteExpenseMutation = useDeleteExpenseMutation();

  // KPIs
  const totalExpense = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const pettyCashExpense = expenses
    .filter((e) => Boolean(e.pettyCashId))
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const regularExpense = totalExpense - pettyCashExpense;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const res = await shiftService.uploadReceipt(file);
      setFormReceiptUrl(res.url);
      toast.success('Bukti nota berhasil diunggah.');
    } catch {
      toast.error('Gagal mengunggah foto nota.');
    } finally {
      setUploading(false);
    }
  };

  const handleCreateExpense = async () => {
    const targetOutlet = formOutletId || effectiveOutletId || currentOutlet?.id || (outlets.length > 0 ? outlets[0].id : '');
    if (!targetOutlet) {
      toast.error('Pilih cabang outlet terlebih dahulu.');
      return;
    }
    if (!formCategoryId) {
      toast.error('Pilih kategori biaya.');
      return;
    }
    if (!formAccountId) {
      toast.error('Pilih akun kas/bank sumber pemotongan dana.');
      return;
    }
    if (!formAmount || formAmount <= 0) {
      toast.error('Nominal biaya harus lebih besar dari 0.');
      return;
    }

    try {
      await createExpenseMutation.mutateAsync({
        outletId: targetOutlet,
        categoryId: formCategoryId,
        financialAccountId: formAccountId,
        amount: formAmount,
        expenseDate: formDate,
        recipient: formRecipient.trim() || undefined,
        notes: formNotes.trim() || undefined,
        receiptUrl: formReceiptUrl || undefined,
      });

      toast.success('Biaya operasional berhasil dicatat.');
      setIsAddExpenseOpen(false);
      // Reset form
      setFormAmount(0);
      setFormNotes('');
      setFormRecipient('');
      setFormReceiptUrl('');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Gagal mencatat biaya operasional.';
      toast.error(msg);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCatName.trim()) {
      toast.error('Nama kategori wajib diisi.');
      return;
    }

    try {
      await createCategoryMutation.mutateAsync({
        name: newCatName.trim(),
        description: newCatDesc.trim() || undefined,
      });

      toast.success('Kategori biaya berhasil ditambahkan.');
      setIsAddCategoryOpen(false);
      setNewCatName('');
      setNewCatDesc('');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Gagal membuat kategori biaya.';
      toast.error(msg);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm('Yakin ingin menghapus transaksi biaya ini?')) return;
    try {
      await deleteExpenseMutation.mutateAsync(id);
      toast.success('Biaya operasional berhasil dihapus.');
    } catch {
      toast.error('Gagal menghapus biaya.');
    }
  };

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Receipt className="w-5 h-5 text-[#0D5C53]" />
              Biaya Operasional (Opex)
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Pengeluaran Bisnis
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Pencatatan beban operasional, tagihan listrik/sewa, pembelian darurat, dan kas kecil POS
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
            leftIcon={<Tag className="w-4 h-4 text-slate-600" />}
            onClick={() => setIsAddCategoryOpen(true)}
            className="font-semibold"
          >
            + Kategori
          </Button>

          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setIsAddExpenseOpen(true)}
            className="font-bold"
          >
            Catat Biaya
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Biaya Operasional"
          value={`Rp ${totalExpense.toLocaleString('id-ID')}`}
          icon={<Receipt className="w-5 h-5 text-rose-600" />}
          subtitle="Semua beban operasional"
        />
        <KpiCard
          title="Beban Langsung (Direct)"
          value={`Rp ${regularExpense.toLocaleString('id-ID')}`}
          icon={<ArrowUpRight className="w-5 h-5 text-blue-600" />}
          subtitle="Listrik, sewa, gaji, supplier"
        />
        <KpiCard
          title="Kas Kecil POS (Petty Cash)"
          value={`Rp ${pettyCashExpense.toLocaleString('id-ID')}`}
          icon={<Wallet className="w-5 h-5 text-amber-600" />}
          subtitle="Pengeluaran darurat kasir"
        />
        <KpiCard
          title="Total Transaksi Biaya"
          value={expenses.length.toString()}
          icon={<DollarSign className="w-5 h-5 text-teal-600" />}
          subtitle="Kuitansi tercatat"
        />
      </div>

      {/* Expense List Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <span>Daftar Pengeluaran ({expenses.length})</span>
          </h3>
          <span className="text-xs text-slate-400">
            Terhubung otomatis dengan Buku Besar & Jurnal Pengeluaran
          </span>
        </div>

        {expensesLoading ? (
          <LoadingState message="Memuat daftar biaya operasional..." />
        ) : expenses.length === 0 ? (
          <EmptyState
            icon={<Receipt className="w-10 h-10 opacity-30 text-slate-400 mx-auto" />}
            title="Tidak Ada Biaya Operasional"
            description="Belum ada pengeluaran operasional yang dicatat pada rentang tanggal ini."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase text-[10px]">
                  <th className="pb-3 font-semibold">Tanggal</th>
                  <th className="pb-3 font-semibold">Cabang</th>
                  <th className="pb-3 font-semibold">Kategori Biaya</th>
                  <th className="pb-3 font-semibold">Keperluan / Keterangan</th>
                  <th className="pb-3 font-semibold">Sumber Dana</th>
                  <th className="pb-3 font-semibold text-center">Bukti Nota</th>
                  <th className="pb-3 font-semibold text-right">Nominal (Rp)</th>
                  <th className="pb-3 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenses.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 text-slate-600 font-medium">
                      {new Date(e.expenseDate || e.createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3 text-slate-700 font-medium">
                      {e.outlet?.name || 'Outlet Utama'}
                    </td>
                    <td className="py-3">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
                        <Tag className="w-3 h-3 text-slate-400" />
                        {e.category?.name || 'Operasional'}
                      </span>
                    </td>
                    <td className="py-3 text-slate-800 max-w-xs">
                      <p className="font-semibold">{e.recipient ? `${e.recipient} - ` : ''}{e.notes || 'Pengeluaran Operasional'}</p>
                      {e.pettyCashId && (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                          Petty Cash Kasir POS
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-slate-600">
                      <span className="font-mono text-[11px] flex items-center gap-1">
                        <Wallet className="w-3.5 h-3.5 text-slate-400" />
                        {e.financialAccount?.accountName || 'Kas Laci'}
                      </span>
                    </td>
                    <td className="py-3 text-center">
                      {e.receiptUrl ? (
                        <button
                          type="button"
                          onClick={() => setPreviewPhotoUrl(e.receiptUrl || null)}
                          className="inline-flex items-center gap-1 text-[11px] text-teal-700 hover:text-[#0D5C53] font-semibold bg-teal-50 hover:bg-teal-100 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                          <span>Lihat</span>
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-300">-</span>
                      )}
                    </td>
                    <td className="py-3 text-right font-mono font-bold text-rose-600">
                      -Rp {Number(e.amount || 0).toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 text-right">
                      {!e.pettyCashId && (
                        <button
                          type="button"
                          onClick={() => handleDeleteExpense(e.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Hapus biaya"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: CATAT BIAYA OPERASIONAL */}
      <Modal
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
        title="Catat Biaya Operasional Baru"
        subtitle="Mencatat pengeluaran operasional dan langsung memotong saldo kas/bank terkait"
        maxWidth="md"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button variant="outline" size="sm" onClick={() => setIsAddExpenseOpen(false)}>
              Batal
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleCreateExpense}
              isLoading={createExpenseMutation.isPending}
              disabled={uploading}
              className="font-bold bg-rose-600 hover:bg-rose-700 border-rose-600"
            >
              Simpan Pengeluaran
            </Button>
          </div>
        }
      >
        <div className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Cabang Outlet" required>
              <select
                value={formOutletId || effectiveOutletId || ''}
                onChange={(e) => setFormOutletId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53]"
              >
                {outlets.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Tanggal Biaya" required>
              <input
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53]"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Kategori Biaya" required>
              <select
                value={formCategoryId}
                onChange={(e) => setFormCategoryId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53]"
              >
                <option value="">-- Pilih Kategori --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Sumber Kas / Bank" required>
              <select
                value={formAccountId}
                onChange={(e) => setFormAccountId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53]"
              >
                <option value="">-- Pilih Akun Sumber --</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.accountName} (Rp {Number(a.currentBalance || 0).toLocaleString('id-ID')})
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          <FormField label="Nominal Pengeluaran (Rp)" required>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-rose-500 font-bold text-xs">
                Rp
              </div>
              <input
                type="number"
                min="0"
                step="1000"
                value={formAmount === 0 ? '' : formAmount}
                onChange={(e) => setFormAmount(Number(e.target.value) || 0)}
                placeholder="0"
                className="w-full pl-11 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
            </div>
          </FormField>

          <FormField label="Penerima Dana / Vendor (Opsional)">
            <input
              type="text"
              placeholder="Contoh: PLN / Pemilik Gedung / Toko Sumber Makmur"
              value={formRecipient}
              onChange={(e) => setFormRecipient(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53]"
            />
          </FormField>

          <FormField label="Keterangan / Keperluan">
            <textarea
              rows={2}
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              placeholder="Contoh: Pembayaran tagihan listrik operasional bulan September"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53]"
            />
          </FormField>

          {/* Upload Nota Bukti */}
          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
              Foto Kuitansi / Nota Bukti (Opsional)
            </label>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
            />
            {formReceiptUrl ? (
              <div className="flex items-center gap-3 p-2 bg-teal-50 border border-teal-200 rounded-xl">
                <img src={formReceiptUrl} alt="Nota" className="w-12 h-12 object-cover rounded-lg" />
                <span className="text-xs font-semibold text-teal-900 flex-1 truncate">
                  Bukti Nota Terlampir
                </span>
                <button
                  type="button"
                  onClick={() => setFormReceiptUrl('')}
                  className="text-rose-500 hover:text-rose-700 text-xs font-bold"
                >
                  Hapus
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full py-2 px-3 border border-dashed border-slate-300 hover:border-[#0D5C53] rounded-xl text-xs font-medium text-slate-600 hover:text-[#0D5C53] flex items-center justify-center gap-2 bg-slate-50 cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                <span>{uploading ? 'Mengunggah foto...' : 'Unggah Foto Kuitansi / Struk'}</span>
              </button>
            )}
          </div>
        </div>
      </Modal>

      {/* MODAL 2: TAMBAH KATEGORI BIAYA */}
      <Modal
        isOpen={isAddCategoryOpen}
        onClose={() => setIsAddCategoryOpen(false)}
        title="Tambah Kategori Biaya Operasional"
        subtitle="Klasifikasikan pos beban bisnis Anda (Listrik, Gaji, Sewa, Bahan Darurat)"
        maxWidth="sm"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button variant="outline" size="sm" onClick={() => setIsAddCategoryOpen(false)}>
              Batal
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleCreateCategory}
              isLoading={createCategoryMutation.isPending}
              className="font-bold"
            >
              Simpan Kategori
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <FormField label="Nama Kategori" required>
            <input
              type="text"
              placeholder="Contoh: Utilitas Listrik & Air"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53]"
            />
          </FormField>
          <FormField label="Deskripsi (Opsional)">
            <textarea
              rows={2}
              placeholder="Penjelasan beban..."
              value={newCatDesc}
              onChange={(e) => setNewCatDesc(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53]"
            />
          </FormField>
        </div>
      </Modal>

      {/* MODAL 3: PREVIEW FOTO NOTA */}
      {previewPhotoUrl && (
        <Modal
          isOpen={!!previewPhotoUrl}
          onClose={() => setPreviewPhotoUrl(null)}
          title="Bukti Nota / Kuitansi"
          maxWidth="md"
        >
          <div className="flex justify-center p-2">
            <img
              src={previewPhotoUrl}
              alt="Bukti Nota Pengeluaran"
              className="max-h-[70vh] rounded-xl object-contain border border-slate-200 shadow-md"
            />
          </div>
        </Modal>
      )}
    </div>
  );
};

