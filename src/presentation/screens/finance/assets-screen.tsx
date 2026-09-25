import React, { useState } from 'react';
import {
  Layers,
  Plus,
  Building2,
  Calendar,
  DollarSign,
  TrendingDown,
  CheckCircle2,
  AlertCircle,
  Archive,
  Info,
} from 'lucide-react';
import { useAuthStore } from '@domain/state/auth-store';
import { useOutlets } from '@domain/hooks';
import {
  useFixedAssets,
  useCreateAssetMutation,
  useDisposeAssetMutation,
  useFinancialAccounts,
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
  FormDatePicker,
  toast,
} from '@presentation/components/ui';
import type { FixedAsset } from '@model/Finance';

const ASSET_CATEGORIES = [
  'Mesin & Peralatan',
  'Elektronik & POS',
  'Furnitur',
  'Kendaraan',
  'Renovasi & Bangunan',
];

export const AssetsScreen: React.FC = () => {
  const currentOutlet = useAuthStore((state) => state.currentOutlet);
  const { data: outlets = [] } = useOutlets();
  const [selectedOutletId, setSelectedOutletId] = useState<string>('ALL');

  const effectiveOutletId = selectedOutletId === 'ALL' ? undefined : selectedOutletId;

  const { data: assets = [], isLoading: assetsLoading } = useFixedAssets(effectiveOutletId);
  const { data: accounts = [] } = useFinancialAccounts(effectiveOutletId);

  // Modals state
  const [isAddAssetOpen, setIsAddAssetOpen] = useState<boolean>(false);
  const [disposeTargetAsset, setDisposeTargetAsset] = useState<FixedAsset | null>(null);

  // Form Add Asset
  const [name, setName] = useState<string>('');
  const [category, setCategory] = useState<string>(ASSET_CATEGORIES[0]);
  const [purchaseDate, setPurchaseDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [purchaseCost, setPurchaseCost] = useState<number>(0);
  const [financialAccountId, setFinancialAccountId] = useState<string>('');
  const [usefulLifeMonths, setUsefulLifeMonths] = useState<number>(48); // default 4 years
  const [salvageValue, setSalvageValue] = useState<number>(0);
  const [assetOutletId, setAssetOutletId] = useState<string>('');

  // Form Dispose Asset
  const [disposalDate, setDisposalDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [disposalPrice, setDisposalPrice] = useState<number>(0);
  const [disposalNotes, setDisposalNotes] = useState<string>('');

  const createAssetMutation = useCreateAssetMutation();
  const disposeAssetMutation = useDisposeAssetMutation();

  // Calculations
  const totalCost = assets.reduce((sum, a) => sum + Number(a.purchaseCost || 0), 0);
  const totalAccumulatedDepr = assets.reduce(
    (sum, a) => sum + Number(a.accumulatedDepreciation || 0),
    0
  );
  const totalBookValue = assets.reduce((sum, a) => sum + Number(a.bookValue || 0), 0);
  const totalMonthlyDepr = assets
    .filter((a) => a.status === 'ACTIVE')
    .reduce((sum, a) => sum + Number(a.monthlyDepreciation || 0), 0);

  const handleCreateAsset = async () => {
    if (!name.trim()) {
      toast.error('Nama aset wajib diisi.');
      return;
    }
    if (!purchaseCost || purchaseCost <= 0) {
      toast.error('Harga perolehan aset harus lebih besar dari 0.');
      return;
    }
    if (!usefulLifeMonths || usefulLifeMonths <= 0) {
      toast.error('Umur ekonomis minimal 1 bulan.');
      return;
    }

    const targetOutletId =
      assetOutletId || effectiveOutletId || currentOutlet?.id || (outlets.length > 0 ? outlets[0].id : undefined);

    if (!targetOutletId) {
      toast.error('Cabang / outlet penempatan aset wajib dipilih.');
      return;
    }

    try {
      await createAssetMutation.mutateAsync({
        name: name.trim(),
        category,
        purchaseDate,
        purchaseCost,
        financialAccountId: financialAccountId.trim() ? financialAccountId : undefined,
        usefulLifeMonths,
        salvageValue: salvageValue || 0,
        outletId: targetOutletId,
      });

      toast.success('Aset tetap berhasil ditambahkan dan dicatat di neraca.');
      setIsAddAssetOpen(false);
      setName('');
      setCategory(ASSET_CATEGORIES[0]);
      setPurchaseCost(0);
      setUsefulLifeMonths(48);
      setSalvageValue(0);
      setFinancialAccountId('');
      setAssetOutletId('');
    } catch (err: unknown) {
      const resData = (
        err as {
          response?: {
            data?: { message?: string | string[]; errors?: string[]; error?: string };
          };
        }
      )?.response?.data;

      let msg = 'Gagal mencatat aset tetap.';
      if (Array.isArray(resData?.message)) {
        msg = resData.message.join(', ');
      } else if (typeof resData?.message === 'string') {
        msg = resData.message;
      } else if (Array.isArray(resData?.errors)) {
        msg = resData.errors.join(', ');
      } else if (typeof resData?.error === 'string') {
        msg = resData.error;
      } else if ((err as { message?: string })?.message) {
        msg = (err as { message: string }).message;
      }
      toast.error(msg);
    }
  };

  const handleDisposeAsset = async () => {
    if (!disposeTargetAsset) return;

    try {
      await disposeAssetMutation.mutateAsync({
        id: disposeTargetAsset.id,
        payload: {
          disposalDate,
          disposalPrice: disposalPrice || 0,
          disposalNotes: disposalNotes.trim() || undefined,
        },
      });

      toast.success(`Aset "${disposeTargetAsset.name}" berhasil dilepas / dihapusbukukan.`);
      setDisposeTargetAsset(null);
      setDisposalPrice(0);
      setDisposalNotes('');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Gagal melepaskan aset tetap.';
      toast.error(msg);
    }
  };

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#0D5C53]" />
              Aset Tetap & Depresiasi
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Metode Garis Lurus
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Inventaris modal usaha, perhitungan penyusutan otomatis, dan nilai buku aktiva tetap
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
            onClick={() => setIsAddAssetOpen(true)}
            className="font-bold"
          >
            Catat Aset Baru
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Nilai Akuisisi Aset"
          value={`Rp ${totalCost.toLocaleString('id-ID')}`}
          icon={<DollarSign className="w-5 h-5 text-blue-600" />}
          subtitle="Harga beli awal seluruh aset"
        />
        <KpiCard
          title="Akumulasi Penyusutan"
          value={`Rp ${totalAccumulatedDepr.toLocaleString('id-ID')}`}
          icon={<TrendingDown className="w-5 h-5 text-rose-600" />}
          subtitle="Total depresiasi terakumulasi"
        />
        <KpiCard
          title="Nilai Buku Bersih (NBV)"
          value={`Rp ${totalBookValue.toLocaleString('id-ID')}`}
          icon={<Layers className="w-5 h-5 text-emerald-600" />}
          subtitle="Nilai aset saat ini di Neraca"
        />
        <KpiCard
          title="Beban Depresiasi / Bulan"
          value={`Rp ${totalMonthlyDepr.toLocaleString('id-ID')}`}
          icon={<Calendar className="w-5 h-5 text-amber-600" />}
          subtitle="Beban operasional bulanan"
        />
      </div>

      {/* Assets Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-sm text-slate-900">
              Daftar Aset Tetap Perusahaan ({assets.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Penyusutan dihitung otomatis setiap bulan menggunakan metode Garis Lurus (Straight-Line)
            </p>
          </div>
        </div>

        {assetsLoading ? (
          <LoadingState message="Memuat daftar aset tetap..." />
        ) : assets.length === 0 ? (
          <EmptyState
            icon={<Layers className="w-10 h-10 opacity-30 text-slate-400 mx-auto" />}
            title="Belum Ada Aset Tetap"
            description="Tambahkan inventaris modal usaha seperti mesin kopi, POS tablet, freezer, atau renovasi outlet."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase text-[10px]">
                  <th className="pb-3 font-semibold">Nama Aset</th>
                  <th className="pb-3 font-semibold">Kategori</th>
                  <th className="pb-3 font-semibold">Cabang</th>
                  <th className="pb-3 font-semibold">Tgl Beli</th>
                  <th className="pb-3 font-semibold text-right">Harga Perolehan</th>
                  <th className="pb-3 font-semibold text-center">Umur (Bln)</th>
                  <th className="pb-3 font-semibold text-right">Penyusutan/Bln</th>
                  <th className="pb-3 font-semibold text-right">Akumulasi Depr.</th>
                  <th className="pb-3 font-semibold text-right">Nilai Buku</th>
                  <th className="pb-3 font-semibold text-center">Status</th>
                  <th className="pb-3 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {assets.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 font-bold text-slate-900">
                      {a.name}
                    </td>
                    <td className="py-3 text-slate-600">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-medium text-[11px]">
                        {a.category}
                      </span>
                    </td>
                    <td className="py-3 text-slate-600">
                      {a.outlet?.name || 'Seluruh Cabang'}
                    </td>
                    <td className="py-3 text-slate-500 font-medium">
                      {new Date(a.purchaseDate).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3 text-right font-mono font-semibold text-slate-900">
                      Rp {Number(a.purchaseCost || 0).toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 text-center text-slate-600 font-mono">
                      {a.usefulLifeMonths} Bln
                    </td>
                    <td className="py-3 text-right font-mono text-amber-700">
                      Rp {Number(a.monthlyDepreciation || 0).toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 text-right font-mono text-rose-600">
                      -Rp {Number(a.accumulatedDepreciation || 0).toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 text-right font-mono font-bold text-emerald-700">
                      Rp {Number(a.bookValue || 0).toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 text-center">
                      <Badge variant={a.status === 'ACTIVE' ? 'success' : 'danger'} size="sm">
                        {a.status === 'ACTIVE' ? 'Aktif' : 'Disposed'}
                      </Badge>
                    </td>
                    <td className="py-3 text-right">
                      {a.status === 'ACTIVE' ? (
                        <button
                          type="button"
                          onClick={() => setDisposeTargetAsset(a)}
                          className="px-2 py-1 text-[11px] font-semibold text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        >
                          Lepas Aset
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">Terjual/Lepas</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: CATAT ASET BARU */}
      <Modal
        isOpen={isAddAssetOpen}
        onClose={() => setIsAddAssetOpen(false)}
        title="Catat Aset Tetap Baru"
        subtitle="Mencatat pembelian modal usaha dengan penyusutan otomatis garis lurus"
        maxWidth="md"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button variant="outline" size="sm" onClick={() => setIsAddAssetOpen(false)}>
              Batal
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleCreateAsset}
              isLoading={createAssetMutation.isPending}
              className="font-bold"
            >
              Simpan Aset
            </Button>
          </div>
        }
      >
        <div className="space-y-3.5">
          {outlets.length > 0 && (
            <FormField label="Cabang / Outlet Penempatan Aset" required>
              <CustomSelect
                value={assetOutletId || effectiveOutletId || currentOutlet?.id || outlets[0]?.id || ''}
                onChange={(val) => setAssetOutletId(val)}
                options={outlets.map((o) => ({ value: o.id, label: o.name }))}
              />
            </FormField>
          )}

          <FormField label="Nama Aset" required>
            <input
              type="text"
              placeholder="Contoh: Mesin Espresso Simonelli Appia II"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53]"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Kategori Aset" required>
              <CustomSelect
                value={category}
                onChange={(val) => setCategory(val as any)}
                options={ASSET_CATEGORIES.map((c) => ({ value: c, label: c }))}
              />
            </FormField>

            <FormDatePicker
              label="Tanggal Perolehan"
              required
              value={purchaseDate}
              onChange={(val) => setPurchaseDate(val)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Harga Beli / Perolehan (Rp)" required>
              <input
                type="number"
                min="0"
                step="100000"
                value={purchaseCost === 0 ? '' : purchaseCost}
                onChange={(e) => setPurchaseCost(Number(e.target.value) || 0)}
                placeholder="0"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53]"
              />
            </FormField>

            <FormField label="Sumber Dana Kas / Bank">
              <CustomSelect
                value={financialAccountId}
                onChange={(val) => setFinancialAccountId(val)}
                placeholder="-- Tanpa Potong Kas (Saldo Awal) --"
                options={[
                  { value: '', label: '-- Tanpa Potong Kas (Saldo Awal) --' },
                  ...accounts.map((a) => ({
                    value: a.id,
                    label: `${a.accountName} (Rp ${Number(a.currentBalance || 0).toLocaleString('id-ID')})`,
                  })),
                ]}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Umur Ekonomis (Bulan)" required>
              <input
                type="number"
                min="1"
                value={usefulLifeMonths}
                onChange={(e) => setUsefulLifeMonths(Number(e.target.value) || 1)}
                placeholder="48"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53]"
              />
            </FormField>

            <FormField label="Nilai Residu / Sisa (Rp)">
              <input
                type="number"
                min="0"
                step="100000"
                value={salvageValue === 0 ? '' : salvageValue}
                onChange={(e) => setSalvageValue(Number(e.target.value) || 0)}
                placeholder="0"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53]"
              />
            </FormField>
          </div>

          <div className="p-3 bg-teal-50 rounded-xl border border-teal-200/80 flex items-start gap-2 text-xs text-teal-800">
            <Info className="w-4 h-4 text-[#0D5C53] shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              Estimasi penyusutan bulanan:{' '}
              <strong className="text-[#0D5C53]">
                Rp{' '}
                {usefulLifeMonths > 0
                  ? Math.round(
                      (Math.max(0, purchaseCost - salvageValue) / usefulLifeMonths)
                    ).toLocaleString('id-ID')
                  : '0'}
                /bulan
              </strong>
              . Akan otomatis dibebankan pada Laporan Laba/Rugi.
            </p>
          </div>
        </div>
      </Modal>

      {/* MODAL 2: PELEPASAN ASET (DISPOSAL) */}
      {disposeTargetAsset && (
        <Modal
          isOpen={!!disposeTargetAsset}
          onClose={() => setDisposeTargetAsset(null)}
          title={`Pelepasan Aset: ${disposeTargetAsset.name}`}
          subtitle="Penjualan atau penghapusan aset dari neraca keuangan"
          maxWidth="sm"
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <Button variant="outline" size="sm" onClick={() => setDisposeTargetAsset(null)}>
                Batal
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleDisposeAsset}
                isLoading={disposeAssetMutation.isPending}
                className="font-bold bg-rose-600 hover:bg-rose-700 border-rose-600"
              >
                Konfirmasi Pelepasan
              </Button>
            </div>
          }
        >
          <div className="space-y-3.5">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 space-y-1">
              <div className="flex justify-between">
                <span>Nilai Buku Saat Ini:</span>
                <span className="font-bold font-mono">
                  Rp {Number(disposeTargetAsset.bookValue || 0).toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            <FormDatePicker
              label="Tanggal Pelepasan"
              required
              value={disposalDate}
              onChange={(val) => setDisposalDate(val)}
            />

            <FormField label="Harga Jual / Nilai Diterima (Rp)">
              <input
                type="number"
                min="0"
                step="50000"
                value={disposalPrice === 0 ? '' : disposalPrice}
                onChange={(e) => setDisposalPrice(Number(e.target.value) || 0)}
                placeholder="0 (Jika rusak/dibuang)"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53]"
              />
            </FormField>

            <FormField label="Catatan / Alasan Pelepasan">
              <textarea
                rows={2}
                value={disposalNotes}
                onChange={(e) => setDisposalNotes(e.target.value)}
                placeholder="Contoh: Dijual second karena upgrade mesin baru"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53]"
              />
            </FormField>
          </div>
        </Modal>
      )}
    </div>
  );
};

