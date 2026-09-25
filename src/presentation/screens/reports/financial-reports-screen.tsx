import React, { useState } from 'react';
import {
  FileSpreadsheet,
  TrendingUp,
  Scale,
  ArrowRightLeft,
  Printer,
  Calendar,
  Building2,
  DollarSign,
  PieChart,
  Percent,
} from 'lucide-react';
import { useAuthStore } from '@domain/state/auth-store';
import { useOutlets } from '@domain/hooks';
import {
  useIncomeStatement,
  useBalanceSheet,
  useCashFlowStatement,
} from '@domain/hooks/queries';
import {
  KpiCard,
  Button,
  Badge,
  LoadingState,
  CustomSelect,
} from '@presentation/components/ui';

export const FinancialReportsScreen: React.FC = () => {
  const currentOutlet = useAuthStore((state) => state.currentOutlet);
  const { data: outlets = [] } = useOutlets();
  const [selectedOutletId, setSelectedOutletId] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'INCOME' | 'BALANCE' | 'CASH_FLOW'>('INCOME');

  const effectiveOutletId = selectedOutletId === 'ALL' ? undefined : selectedOutletId;

  // Date Range
  const [datePreset, setDatePreset] = useState<string>('THIS_MONTH');

  const getDateRange = (preset: string) => {
    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).toISOString();
    if (preset === 'THIS_MONTH') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0).toISOString();
      return { startDate: start, endDate: end };
    }
    if (preset === 'LAST_MONTH') {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0).toISOString();
      const endPrev = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999).toISOString();
      return { startDate: start, endDate: endPrev };
    }
    if (preset === 'THIS_YEAR') {
      const start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0).toISOString();
      return { startDate: start, endDate: end };
    }
    const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    return { startDate: start, endDate: end };
  };

  const { startDate, endDate } = getDateRange(datePreset);

  // Queries
  const { data: incomeData, isLoading: incomeLoading } = useIncomeStatement({
    startDate,
    endDate,
    outletId: effectiveOutletId,
  });

  const { data: balanceData, isLoading: balanceLoading } = useBalanceSheet({
    outletId: effectiveOutletId,
    asOfDate: endDate ? endDate.slice(0, 10) : undefined,
  });

  const { data: cashFlowData, isLoading: cashFlowLoading } = useCashFlowStatement({
    startDate,
    endDate,
    outletId: effectiveOutletId,
  });

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
              <FileSpreadsheet className="w-5 h-5 text-[#0D5C53]" />
              Laporan Keuangan Standar Akuntansi
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Standar PSAK
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Laba Rugi Bersih Komprehensif, Neraca Keuangan Posisi Saldo, dan Laporan Arus Kas
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
                { value: 'THIS_MONTH', label: 'Bulan Ini' },
                { value: 'LAST_MONTH', label: 'Bulan Lalu' },
                { value: 'THIS_YEAR', label: 'Tahun Ini' },
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

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-px">
        <button
          onClick={() => setActiveTab('INCOME')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
            activeTab === 'INCOME'
              ? 'border-[#0D5C53] text-[#0D5C53]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>1. Laba / Rugi Bersih (Income Statement)</span>
        </button>
        <button
          onClick={() => setActiveTab('BALANCE')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
            activeTab === 'BALANCE'
              ? 'border-[#0D5C53] text-[#0D5C53]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>2. Neraca Keuangan (Balance Sheet)</span>
        </button>
        <button
          onClick={() => setActiveTab('CASH_FLOW')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
            activeTab === 'CASH_FLOW'
              ? 'border-[#0D5C53] text-[#0D5C53]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ArrowRightLeft className="w-4 h-4" />
          <span>3. Arus Kas (Cash Flow Statement)</span>
        </button>
      </div>

      {/* TAB 1: LABA / RUGI (INCOME STATEMENT) */}
      {activeTab === 'INCOME' && (
        <div className="space-y-4">
          {incomeLoading ? (
            <LoadingState message="Menghitung laporan laba rugi..." />
          ) : !incomeData ? (
            <div className="p-8 text-center text-slate-400 text-xs">Data tidak tersedia.</div>
          ) : (
            <>
              {/* Summary KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard
                  title="Penjualan Bersih (Net Sales)"
                  value={`Rp ${incomeData.revenue.netSales.toLocaleString('id-ID')}`}
                  icon={<DollarSign className="w-5 h-5 text-blue-600" />}
                  subtitle={`Gross: Rp ${incomeData.revenue.grossSales.toLocaleString('id-ID')}`}
                />
                <KpiCard
                  title="Total HPP Bahan Baku"
                  value={`Rp ${incomeData.cogs.totalCogs.toLocaleString('id-ID')}`}
                  icon={<PieChart className="w-5 h-5 text-amber-600" />}
                  subtitle="Terkalkulasi otomatis dari resep"
                />
                <KpiCard
                  title="Laba Kotor (Gross Profit)"
                  value={`Rp ${incomeData.grossProfit.toLocaleString('id-ID')}`}
                  icon={<Percent className="w-5 h-5 text-teal-600" />}
                  subtitle={`Margin Laba Kotor: ${incomeData.marginPercentage}%`}
                />
                <KpiCard
                  title="Laba / (Rugi) Bersih"
                  value={`Rp ${incomeData.netProfit.toLocaleString('id-ID')}`}
                  icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
                  subtitle={incomeData.netProfit >= 0 ? 'Surplus Operasional' : 'Defisit Operasional'}
                />
              </div>

              {/* Financial Statement Sheet Format */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs max-w-4xl mx-auto space-y-6">
                <div className="text-center pb-4 border-b border-slate-200 space-y-1">
                  <h3 className="font-extrabold text-base uppercase tracking-tight text-slate-900">
                    LAPORAN LABA / RUGI BERSIH (INCOME STATEMENT)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Periode:{' '}
                    {new Date(startDate).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}{' '}
                    s/d{' '}
                    {new Date(endDate).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>

                <div className="space-y-4 text-xs font-mono">
                  {/* Bagian 1: Pendapatan */}
                  <div className="space-y-1.5">
                    <h4 className="font-sans font-bold text-slate-900 text-sm uppercase">1. PENDAPATAN OPERASIONAL</h4>
                    <div className="pl-4 space-y-1 text-slate-700">
                      <div className="flex justify-between">
                        <span>Penjualan Kotor (Gross Sales)</span>
                        <span>Rp {incomeData.revenue.grossSales.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between text-rose-600">
                        <span>Potongan Diskon Penjualan (-)</span>
                        <span>-Rp {incomeData.revenue.discounts.toLocaleString('id-ID')}</span>
                      </div>
                    </div>
                    <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200">
                      <span className="font-sans">TOTAL PENJUALAN BERSIH (NET REVENUE)</span>
                      <span>Rp {incomeData.revenue.netSales.toLocaleString('id-ID')}</span>
                    </div>
                  </div>

                  {/* Bagian 2: Beban Pokok Penjualan (HPP) */}
                  <div className="space-y-1.5 pt-2">
                    <h4 className="font-sans font-bold text-slate-900 text-sm uppercase">2. HARGA POKOK PENJUALAN (HPP)</h4>
                    <div className="pl-4 space-y-1 text-slate-700">
                      <div className="flex justify-between">
                        <span>HPP Bahan Baku & Bahan Minuman</span>
                        <span>Rp {incomeData.cogs.rawMaterialCogs.toLocaleString('id-ID')}</span>
                      </div>
                    </div>
                    <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200">
                      <span className="font-sans">TOTAL BEBAN POKOK PENJUALAN (COGS)</span>
                      <span className="text-rose-600">-Rp {incomeData.cogs.totalCogs.toLocaleString('id-ID')}</span>
                    </div>
                  </div>

                  {/* Laba Kotor Highlight */}
                  <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl flex justify-between font-extrabold text-sm text-[#0D5C53]">
                    <span className="font-sans">LABA KOTOR (GROSS PROFIT) — Margin {incomeData.marginPercentage}%</span>
                    <span>Rp {incomeData.grossProfit.toLocaleString('id-ID')}</span>
                  </div>

                  {/* Bagian 3: Biaya Operasional (Opex) */}
                  <div className="space-y-1.5 pt-2">
                    <h4 className="font-sans font-bold text-slate-900 text-sm uppercase">3. BEBAN OPERASIONAL (OPEX)</h4>
                    <div className="pl-4 space-y-1 text-slate-700">
                      {incomeData.operatingExpenses.breakdown.map((b, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span>{b.category}</span>
                          <span>Rp {b.amount.toLocaleString('id-ID')}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200">
                      <span className="font-sans">TOTAL BEBAN OPERASIONAL</span>
                      <span className="text-rose-600">
                        -Rp {incomeData.operatingExpenses.totalExpenses.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>

                  {/* Laba Bersih Akhir */}
                  <div
                    className={`p-4 rounded-xl border flex justify-between font-extrabold text-base ${
                      incomeData.netProfit >= 0
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                        : 'bg-rose-50 border-rose-300 text-rose-900'
                    }`}
                  >
                    <span className="font-sans">LABA / (RUGI) BERSIH OPERASIONAL (NET PROFIT)</span>
                    <span>Rp {incomeData.netProfit.toLocaleString('id-ID')}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 2: NERACA KEUANGAN (BALANCE SHEET) */}
      {activeTab === 'BALANCE' && (
        <div className="space-y-4">
          {balanceLoading ? (
            <LoadingState message="Menghitung neraca keuangan..." />
          ) : !balanceData ? (
            <div className="p-8 text-center text-slate-400 text-xs">Data tidak tersedia.</div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs max-w-4xl mx-auto space-y-6">
              <div className="text-center pb-4 border-b border-slate-200 space-y-1">
                <h3 className="font-extrabold text-base uppercase tracking-tight text-slate-900">
                  NERACA KEUANGAN (BALANCE SHEET)
                </h3>
                <p className="text-xs text-slate-500">
                  Posisi Per Tanggal:{' '}
                  {new Date(balanceData.asOfDate).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-mono">
                {/* Kolom Kiri: AKTIVA / ASET */}
                <div className="space-y-4 border-r border-slate-100 pr-0 md:pr-4">
                  <h4 className="font-sans font-black text-sm uppercase text-slate-900 border-b pb-1 text-[#0D5C53]">
                    AKTIVA / ASET
                  </h4>

                  {/* Aset Lancar */}
                  <div className="space-y-1.5">
                    <p className="font-sans font-bold text-slate-800 uppercase text-[11px]">Aset Lancar (Current Assets):</p>
                    <div className="pl-2 space-y-1 text-slate-700">
                      <div className="flex justify-between">
                        <span>Kas Tunai di Laci Kasir</span>
                        <span>Rp {balanceData.assets.currentAssets.cashInDrawer.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Bank & Saldo QRIS</span>
                        <span>Rp {balanceData.assets.currentAssets.bankAndEwallet.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Persediaan Bahan Baku (Stok Fisik)</span>
                        <span>Rp {balanceData.assets.currentAssets.inventoryValuation.toLocaleString('id-ID')}</span>
                      </div>
                    </div>
                    <div className="flex justify-between font-bold text-slate-900 pt-1 border-t">
                      <span>Total Aset Lancar:</span>
                      <span>Rp {balanceData.assets.currentAssets.totalCurrentAssets.toLocaleString('id-ID')}</span>
                    </div>
                  </div>

                  {/* Aset Tetap */}
                  <div className="space-y-1.5 pt-2">
                    <p className="font-sans font-bold text-slate-800 uppercase text-[11px]">Aset Tetap (Fixed Assets):</p>
                    <div className="pl-2 space-y-1 text-slate-700">
                      <div className="flex justify-between">
                        <span>Biaya Perolehan Peralatan & Mesin</span>
                        <span>Rp {balanceData.assets.fixedAssets.totalAssetCost.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between text-rose-600">
                        <span>Akumulasi Penyusutan (-)</span>
                        <span>-Rp {balanceData.assets.fixedAssets.totalAccumulatedDepreciation.toLocaleString('id-ID')}</span>
                      </div>
                    </div>
                    <div className="flex justify-between font-bold text-slate-900 pt-1 border-t">
                      <span>Nilai Buku Bersih (NBV):</span>
                      <span>Rp {balanceData.assets.fixedAssets.netFixedAssets.toLocaleString('id-ID')}</span>
                    </div>
                  </div>

                  {/* Total Aktiva */}
                  <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl flex justify-between font-extrabold text-sm text-[#0D5C53]">
                    <span className="font-sans">TOTAL AKTIVA (ASET)</span>
                    <span>Rp {balanceData.assets.totalAssets.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                {/* Kolom Kanan: KEWAJIBAN & EKUITAS */}
                <div className="space-y-4">
                  <h4 className="font-sans font-black text-sm uppercase text-slate-900 border-b pb-1 text-[#0D5C53]">
                    KEWAJIBAN & EKUITAS
                  </h4>

                  {/* Kewajiban */}
                  <div className="space-y-1.5">
                    <p className="font-sans font-bold text-slate-800 uppercase text-[11px]">Kewajiban Lancar (Liabilities):</p>
                    <div className="pl-2 space-y-1 text-slate-700">
                      <div className="flex justify-between">
                        <span>Hutang Pajak PB1 / PPN POS</span>
                        <span>Rp {balanceData.liabilities.taxPayables.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Hutang Usaha (Supplier)</span>
                        <span>Rp {balanceData.liabilities.accountsPayable.toLocaleString('id-ID')}</span>
                      </div>
                    </div>
                    <div className="flex justify-between font-bold text-slate-900 pt-1 border-t">
                      <span>Total Kewajiban:</span>
                      <span>Rp {balanceData.liabilities.totalLiabilities.toLocaleString('id-ID')}</span>
                    </div>
                  </div>

                  {/* Ekuitas */}
                  <div className="space-y-1.5 pt-2">
                    <p className="font-sans font-bold text-slate-800 uppercase text-[11px]">Ekuitas Pemilik (Equity):</p>
                    <div className="pl-2 space-y-1 text-slate-700">
                      <div className="flex justify-between">
                        <span>Modal Usaha & Laba Ditahan</span>
                        <span>Rp {balanceData.equity.retainedEarnings.toLocaleString('id-ID')}</span>
                      </div>
                    </div>
                    <div className="flex justify-between font-bold text-slate-900 pt-1 border-t">
                      <span>Total Ekuitas:</span>
                      <span>Rp {balanceData.equity.totalEquity.toLocaleString('id-ID')}</span>
                    </div>
                  </div>

                  {/* Total Pasiva */}
                  <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl flex justify-between font-extrabold text-sm text-[#0D5C53]">
                    <span className="font-sans">TOTAL KEWAJIBAN & EKUITAS</span>
                    <span>
                      Rp {(balanceData.liabilities.totalLiabilities + balanceData.equity.totalEquity).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ARUS KAS (CASH FLOW) */}
      {activeTab === 'CASH_FLOW' && (
        <div className="space-y-4">
          {cashFlowLoading ? (
            <LoadingState message="Menghitung laporan arus kas..." />
          ) : !cashFlowData ? (
            <div className="p-8 text-center text-slate-400 text-xs">Data tidak tersedia.</div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs max-w-4xl mx-auto space-y-6">
              <div className="text-center pb-4 border-b border-slate-200 space-y-1">
                <h3 className="font-extrabold text-base uppercase tracking-tight text-slate-900">
                  LAPORAN ARUS KAS (CASH FLOW STATEMENT)
                </h3>
                <p className="text-xs text-slate-500">
                  Periode:{' '}
                  {new Date(startDate).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}{' '}
                  s/d{' '}
                  {new Date(endDate).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>

              <div className="space-y-4 text-xs font-mono">
                {/* 1. Arus Kas Operasional */}
                <div className="space-y-1.5">
                  <h4 className="font-sans font-bold text-slate-900 text-sm uppercase">1. ARUS KAS DARI AKTIVITAS OPERASIONAL</h4>
                  <div className="pl-4 space-y-1 text-slate-700">
                    <div className="flex justify-between text-teal-700">
                      <span>Penerimaan Kas dari Pelanggan POS (+)</span>
                      <span>+Rp {cashFlowData.operatingActivities.cashFromSales.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between text-rose-600">
                      <span>Pembayaran Kas untuk Biaya Operasional (-)</span>
                      <span>-Rp {cashFlowData.operatingActivities.cashPaidForExpenses.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                  <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200">
                    <span className="font-sans">ARUS KAS BERSIH DARI OPERASIONAL</span>
                    <span className={cashFlowData.operatingActivities.netOperatingCash >= 0 ? 'text-emerald-700' : 'text-rose-600'}>
                      Rp {cashFlowData.operatingActivities.netOperatingCash.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                {/* 2. Arus Kas Investasi */}
                <div className="space-y-1.5 pt-2">
                  <h4 className="font-sans font-bold text-slate-900 text-sm uppercase">2. ARUS KAS DARI AKTIVITAS INVESTASI</h4>
                  <div className="pl-4 space-y-1 text-slate-700">
                    <div className="flex justify-between text-rose-600">
                      <span>Pembelian Aset Tetap / Peralatan Usaha (-)</span>
                      <span>-Rp {cashFlowData.investingActivities.cashPaidForAssets.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                  <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200">
                    <span className="font-sans">ARUS KAS BERSIH DARI INVESTASI</span>
                    <span className="text-rose-600">
                      Rp {cashFlowData.investingActivities.netInvestingCash.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                {/* 3. Arus Kas Pendanaan */}
                <div className="space-y-1.5 pt-2">
                  <h4 className="font-sans font-bold text-slate-900 text-sm uppercase">3. ARUS KAS DARI AKTIVITAS PENDANAAN</h4>
                  <div className="pl-4 space-y-1 text-slate-700">
                    <div className="flex justify-between text-teal-700">
                      <span>Penerimaan Modal Pemilik / Investor (+)</span>
                      <span>
                        +Rp {(cashFlowData.financingActivities.cashFromCapitalInjections || 0).toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="flex justify-between text-teal-700">
                      <span>Pencairan Pinjaman Bank / Modal Usaha (+)</span>
                      <span>
                        +Rp {(cashFlowData.financingActivities.cashFromLoans || 0).toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="flex justify-between text-rose-600">
                      <span>Penarikan Prive / Dividen Pemilik (-)</span>
                      <span>
                        -Rp {(cashFlowData.financingActivities.cashPaidForDrawings || 0).toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="flex justify-between text-rose-600">
                      <span>Pembayaran Pokok Pinjaman Bank (-)</span>
                      <span>
                        -Rp {(cashFlowData.financingActivities.cashPaidForLoanRepayments || 0).toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200">
                    <span className="font-sans">ARUS KAS BERSIH DARI PENDANAAN</span>
                    <span
                      className={
                        cashFlowData.financingActivities.netFinancingCash >= 0
                          ? 'text-emerald-700'
                          : 'text-rose-600'
                      }
                    >
                      {cashFlowData.financingActivities.netFinancingCash > 0 ? '+' : ''}Rp{' '}
                      {cashFlowData.financingActivities.netFinancingCash.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                {/* Perubahan Kas Bersih */}
                <div
                  className={`p-4 rounded-xl border flex justify-between font-extrabold text-base ${
                    cashFlowData.netCashChange >= 0
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                      : 'bg-rose-50 border-rose-300 text-rose-900'
                  }`}
                >
                  <span className="font-sans">KENAIKAN / (PENURUNAN) BERSIH KAS & BANK</span>
                  <span>
                    {cashFlowData.netCashChange > 0 ? '+' : ''}Rp {cashFlowData.netCashChange.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

