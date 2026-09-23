import React, { useState } from 'react';
import {
  Wallet,
  Landmark,
  ArrowRightLeft,
  Plus,
  Building2,
  CreditCard,
  QrCode,
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import { useAuthStore } from '@domain/state/auth-store';
import { useOutlets } from '@domain/hooks';
import {
  useFinancialAccounts,
  useCreateAccountMutation,
  useFinancialTransfers,
  useCreateTransferMutation,
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
import type { FinancialAccount, FinancialAccountType } from '@model/Finance';

export const AccountsScreen: React.FC = () => {
  const currentOutlet = useAuthStore((state) => state.currentOutlet);
  const { data: outlets = [] } = useOutlets();
  const [selectedOutletId, setSelectedOutletId] = useState<string>('ALL');

  const effectiveOutletId = selectedOutletId === 'ALL' ? undefined : selectedOutletId;

  const { data: accounts = [], isLoading: accountsLoading } = useFinancialAccounts(effectiveOutletId);
  const { data: transfers = [], isLoading: transfersLoading } = useFinancialTransfers();

  // Modals state
  const [isAddAccountOpen, setIsAddAccountOpen] = useState<boolean>(false);
  const [isTransferOpen, setIsTransferOpen] = useState<boolean>(false);

  // Add Account form state
  const [newCode, setNewCode] = useState<string>('');
  const [newName, setNewName] = useState<string>('');
  const [newType, setNewType] = useState<FinancialAccountType>('BANK');
  const [newBankName, setNewBankName] = useState<string>('');
  const [newAccountNumber, setNewAccountNumber] = useState<string>('');
  const [newInitialBalance, setNewInitialBalance] = useState<number>(0);
  const [newAccountOutletId, setNewAccountOutletId] = useState<string>('');

  // Transfer form state
  const [fromAccountId, setFromAccountId] = useState<string>('');
  const [toAccountId, setToAccountId] = useState<string>('');
  const [transferAmount, setTransferAmount] = useState<number>(0);
  const [transferNotes, setTransferNotes] = useState<string>('');

  const createAccountMutation = useCreateAccountMutation();
  const createTransferMutation = useCreateTransferMutation();

  // Calculate totals
  const totalBalance = accounts.reduce((sum, a) => sum + Number(a.currentBalance || 0), 0);
  const cashBalance = accounts
    .filter((a) => a.accountType === 'CASH')
    .reduce((sum, a) => sum + Number(a.currentBalance || 0), 0);
  const bankBalance = accounts
    .filter((a) => a.accountType === 'BANK')
    .reduce((sum, a) => sum + Number(a.currentBalance || 0), 0);
  const ewalletBalance = accounts
    .filter((a) => a.accountType === 'EWALLET' || a.accountType === 'PAYMENT_GATEWAY')
    .reduce((sum, a) => sum + Number(a.currentBalance || 0), 0);

  const handleCreateAccount = async () => {
    if (!newCode.trim() || !newName.trim()) {
      toast.error('Kode akun dan nama akun wajib diisi.');
      return;
    }

    try {
      await createAccountMutation.mutateAsync({
        accountCode: newCode.trim(),
        accountName: newName.trim(),
        accountType: newType,
        bankName: newBankName.trim() || undefined,
        accountNumber: newAccountNumber.trim() || undefined,
        initialBalance: newInitialBalance || 0,
        outletId: newAccountOutletId || undefined,
      });

      toast.success('Akun kas/bank berhasil ditambahkan.');
      setIsAddAccountOpen(false);
      // Reset form
      setNewCode('');
      setNewName('');
      setNewType('BANK');
      setNewBankName('');
      setNewAccountNumber('');
      setNewInitialBalance(0);
      setNewAccountOutletId('');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Gagal menambahkan akun kas/bank.';
      toast.error(msg);
    }
  };

  const handleCreateTransfer = async () => {
    if (!fromAccountId || !toAccountId) {
      toast.error('Pilih akun sumber dan akun tujuan transfer.');
      return;
    }
    if (fromAccountId === toAccountId) {
      toast.error('Akun asal dan akun tujuan tidak boleh sama.');
      return;
    }
    if (!transferAmount || transferAmount <= 0) {
      toast.error('Nominal transfer harus lebih besar dari 0.');
      return;
    }

    const sourceAcc = accounts.find((a) => a.id === fromAccountId);
    if (sourceAcc && Number(sourceAcc.currentBalance) < transferAmount) {
      toast.error(`Saldo ${sourceAcc.accountName} tidak mencukupi (Tersedia: Rp ${Number(sourceAcc.currentBalance).toLocaleString('id-ID')}).`);
      return;
    }

    try {
      await createTransferMutation.mutateAsync({
        fromAccountId,
        toAccountId,
        amount: transferAmount,
        notes: transferNotes.trim() || undefined,
      });

      toast.success('Transfer antar kas/bank berhasil dieksekusi.');
      setIsTransferOpen(false);
      setFromAccountId('');
      setToAccountId('');
      setTransferAmount(0);
      setTransferNotes('');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Gagal memproses transfer kas/bank.';
      toast.error(msg);
    }
  };

  const getAccountTypeIcon = (type: FinancialAccountType) => {
    switch (type) {
      case 'CASH':
        return <Wallet className="w-5 h-5 text-emerald-600" />;
      case 'BANK':
        return <Landmark className="w-5 h-5 text-blue-600" />;
      case 'EWALLET':
        return <CreditCard className="w-5 h-5 text-purple-600" />;
      case 'PAYMENT_GATEWAY':
        return <QrCode className="w-5 h-5 text-amber-600" />;
      default:
        return <DollarSign className="w-5 h-5 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Wallet className="w-5 h-5 text-[#0D5C53]" />
              Kas & Bank (Dompet Bisnis)
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              ERP Keuangan
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Monitoring saldo likuid, rekening operasional, serta mutasi transfer antar kas
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
            variant="outline"
            size="sm"
            leftIcon={<ArrowRightLeft className="w-4 h-4 text-[#0D5C53]" />}
            onClick={() => setIsTransferOpen(true)}
            className="font-semibold"
          >
            Transfer Antar Kas
          </Button>

          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setIsAddAccountOpen(true)}
            className="font-bold"
          >
            Tambah Akun
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Saldo Likuid"
          value={`Rp ${totalBalance.toLocaleString('id-ID')}`}
          icon={<DollarSign className="w-5 h-5 text-emerald-600" />}
          subtitle="Konsolidasi seluruh dompet"
        />
        <KpiCard
          title="Kas Tunai (Laci)"
          value={`Rp ${cashBalance.toLocaleString('id-ID')}`}
          icon={<Wallet className="w-5 h-5 text-teal-600" />}
          subtitle="Total fisik di laci kasir"
        />
        <KpiCard
          title="Rekening Bank"
          value={`Rp ${bankBalance.toLocaleString('id-ID')}`}
          icon={<Landmark className="w-5 h-5 text-blue-600" />}
          subtitle="Saldo rekening operasional"
        />
        <KpiCard
          title="QRIS & E-Wallet"
          value={`Rp ${ewalletBalance.toLocaleString('id-ID')}`}
          icon={<QrCode className="w-5 h-5 text-purple-600" />}
          subtitle="Penampungan settlement gateway"
        />
      </div>

      {/* Accounts Cards Grid */}
      <div className="space-y-3">
        <h3 className="font-bold text-sm text-slate-800 flex items-center justify-between">
          <span>Daftar Akun Kas & Bank ({accounts.length})</span>
          <span className="text-xs text-slate-400 font-normal">Real-time update dari transaksi POS</span>
        </h3>

        {accountsLoading ? (
          <LoadingState message="Memuat daftar akun kas & bank..." />
        ) : accounts.length === 0 ? (
          <EmptyState
            icon={<Wallet className="w-10 h-10 opacity-30 text-slate-400 mx-auto" />}
            title="Belum Ada Akun Kas/Bank"
            description="Tambahkan kas laci outlet atau rekening bank operasional bisnis Anda."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map((acc) => (
              <div
                key={acc.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between shadow-xs hover:border-[#0D5C53]/50 hover:shadow-md transition-all space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shadow-xs">
                        {getAccountTypeIcon(acc.accountType)}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 leading-tight">{acc.accountName}</h4>
                        <span className="text-[11px] font-mono text-slate-400 block mt-0.5">
                          Kode: {acc.accountCode}
                        </span>
                      </div>
                    </div>
                    <Badge variant={acc.accountType === 'CASH' ? 'success' : 'info'} size="sm">
                      {acc.accountType}
                    </Badge>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>
                      {acc.outlet?.name ? (
                        <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          {acc.outlet.name}
                        </span>
                      ) : (
                        <span className="italic text-slate-400">Akun Global Tenant</span>
                      )}
                    </span>
                    {acc.accountNumber && (
                      <span className="font-mono font-medium text-slate-600">
                        {acc.bankName ? `${acc.bankName} - ` : ''}
                        {acc.accountNumber}
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-end justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Saldo Saat Ini</span>
                    <span className="text-lg font-black text-slate-900 font-mono">
                      Rp {Number(acc.currentBalance || 0).toLocaleString('id-ID')}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFromAccountId(acc.id);
                      setIsTransferOpen(true);
                    }}
                    className="text-xs px-2.5 py-1"
                  >
                    Transfer →
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Riwayat Transfer Antar Kas */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-[#0D5C53]" />
              Riwayat Mutasi Transfer Antar Kas / Bank
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Catatan pemindahan dana antar laci kasir, setoran ke bank, atau pengisian saldo
            </p>
          </div>
        </div>

        {transfersLoading ? (
          <LoadingState message="Memuat mutasi transfer..." />
        ) : transfers.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            Belum ada mutasi transfer antar kas yang tercatat.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase text-[10px]">
                  <th className="pb-3 font-semibold">Tanggal</th>
                  <th className="pb-3 font-semibold">Dari Akun (Sumber)</th>
                  <th className="pb-3 font-semibold">Ke Akun (Tujuan)</th>
                  <th className="pb-3 font-semibold">Catatan</th>
                  <th className="pb-3 font-semibold text-right">Nominal Transfer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transfers.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 text-slate-600 font-medium">
                      {new Date(tx.transferDate || tx.createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3">
                      <span className="font-semibold text-rose-700 flex items-center gap-1.5">
                        <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                        {tx.fromAccount?.accountName || 'Akun Sumber'}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className="font-semibold text-emerald-700 flex items-center gap-1.5">
                        <ArrowDownLeft className="w-3.5 h-3.5 shrink-0" />
                        {tx.toAccount?.accountName || 'Akun Tujuan'}
                      </span>
                    </td>
                    <td className="py-3 text-slate-500 max-w-xs truncate">
                      {tx.notes || '-'}
                    </td>
                    <td className="py-3 text-right font-mono font-bold text-slate-900">
                      Rp {Number(tx.amount || 0).toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: TAMBAH AKUN KAS / BANK */}
      <Modal
        isOpen={isAddAccountOpen}
        onClose={() => setIsAddAccountOpen(false)}
        title="Tambah Akun Kas & Bank Baru"
        subtitle="Registrasikan dompet bisnis (Kas Laci, Bank Operasional, QRIS Gateway)"
        maxWidth="md"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button variant="outline" size="sm" onClick={() => setIsAddAccountOpen(false)}>
              Batal
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleCreateAccount}
              isLoading={createAccountMutation.isPending}
              className="font-bold"
            >
              Simpan Akun
            </Button>
          </div>
        }
      >
        <div className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Kode Akun" required>
              <input
                type="text"
                placeholder="Misal: 1-1102"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53]"
              />
            </FormField>

            <FormField label="Tipe Dompet" required>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as FinancialAccountType)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53]"
              >
                <option value="CASH">CASH (Kas Laci Tunai)</option>
                <option value="BANK">BANK (Rekening Bank)</option>
                <option value="EWALLET">EWALLET (GoPay/OVO/ShopeePay)</option>
                <option value="PAYMENT_GATEWAY">PAYMENT GATEWAY (Midtrans/Xendit)</option>
              </select>
            </FormField>
          </div>

          <FormField label="Nama Akun Dompet" required>
            <input
              type="text"
              placeholder="Contoh: BCA Operasional Cabang Sudirman"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53]"
            />
          </FormField>

          {newType === 'BANK' && (
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Nama Bank">
                <input
                  type="text"
                  placeholder="Misal: BCA / Mandiri / BRI"
                  value={newBankName}
                  onChange={(e) => setNewBankName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53]"
                />
              </FormField>
              <FormField label="Nomor Rekening">
                <input
                  type="text"
                  placeholder="Misal: 8830129381"
                  value={newAccountNumber}
                  onChange={(e) => setNewAccountNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53]"
                />
              </FormField>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Saldo Awal (Rp)">
              <input
                type="number"
                min="0"
                step="1000"
                value={newInitialBalance === 0 ? '' : newInitialBalance}
                onChange={(e) => setNewInitialBalance(Number(e.target.value) || 0)}
                placeholder="0"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53]"
              />
            </FormField>

            <FormField label="Cabang / Outlet (Opsional)">
              <select
                value={newAccountOutletId}
                onChange={(e) => setNewAccountOutletId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53]"
              >
                <option value="">Semua Cabang (Global Tenant)</option>
                {outlets.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </FormField>
          </div>
        </div>
      </Modal>

      {/* MODAL 2: TRANSFER ANTAR KAS */}
      <Modal
        isOpen={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
        title="Transfer Antar Kas & Bank"
        subtitle="Pindahkan dana antar kas laci, setoran bank, atau penarikan tunai"
        maxWidth="md"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button variant="outline" size="sm" onClick={() => setIsTransferOpen(false)}>
              Batal
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleCreateTransfer}
              isLoading={createTransferMutation.isPending}
              className="font-bold"
            >
              Eksekusi Transfer
            </Button>
          </div>
        }
      >
        <div className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Akun Asal (Sumber Dana)" required>
              <select
                value={fromAccountId}
                onChange={(e) => setFromAccountId(e.target.value)}
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

            <FormField label="Akun Tujuan" required>
              <select
                value={toAccountId}
                onChange={(e) => setToAccountId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53]"
              >
                <option value="">-- Pilih Akun Tujuan --</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.accountName}
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          <FormField label="Nominal Transfer (Rp)" required>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold text-xs">
                Rp
              </div>
              <input
                type="number"
                min="0"
                step="1000"
                value={transferAmount === 0 ? '' : transferAmount}
                onChange={(e) => setTransferAmount(Number(e.target.value) || 0)}
                placeholder="0"
                className="w-full pl-11 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53]"
              />
            </div>
          </FormField>

          <FormField label="Catatan / Keperluan">
            <textarea
              rows={2}
              value={transferNotes}
              onChange={(e) => setTransferNotes(e.target.value)}
              placeholder="Contoh: Setoran hasil penjualan tunai harian ke rekening BCA"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53]"
            />
          </FormField>
        </div>
      </Modal>
    </div>
  );
};

