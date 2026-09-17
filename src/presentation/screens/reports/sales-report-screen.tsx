import React, { useState } from 'react';
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Store,
  Calendar,
  CreditCard,
  Banknote,
  QrCode,
  Package,
} from 'lucide-react';
import { useAuthStore } from '@domain/state/auth-store';
import { useOutlets, useSalesReport } from '@domain/hooks';
import {
  KpiCard,
  Badge,
  Card,
  LoadingState,
  EmptyState,
  CustomSelect,
} from '@presentation/components/ui';

export const SalesReportScreen: React.FC = () => {
  const currentOutlet = useAuthStore((state) => state.currentOutlet);
  const { data: outlets = [] } = useOutlets();

  // Multi-Outlet Filter State
  const [selectedOutletId, setSelectedOutletId] = useState<string>('ALL');
  const isAllBranches = selectedOutletId === 'ALL';
  const effectiveOutletId = isAllBranches ? undefined : selectedOutletId;
  const activeBranchName = isAllBranches
    ? 'Semua Cabang'
    : outlets.find((o) => o.id === selectedOutletId)?.name || currentOutlet?.name || 'Cabang Terpilih';

  // Date Range State
  const [datePreset, setDatePreset] = useState<string>('LAST_30_DAYS');

  const getDateRange = (preset: string): { startDate: string; endDate: string } => {
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
    // LAST_30_DAYS default
    const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    return { startDate: start, endDate: end };
  };

  const { startDate, endDate } = getDateRange(datePreset);

  const { data: reportData, isLoading } = useSalesReport({
    startDate,
    endDate,
    outletId: effectiveOutletId,
  });

  const summary = reportData?.summary || {
    totalRevenue: 0,
    totalOrders: 0,
    totalTransactions: 0,
    averageOrderValue: 0,
  };

  const byProduct = reportData?.byProduct || [];
  const byPaymentMethod = reportData?.byPaymentMethod || [];
  const byDate = reportData?.byDate || [];

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto">
      {/* Top Header with Multi-Outlet Switcher & Date Range */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#0D5C53]" />
              Laporan Penjualan
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Multi-Outlet
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Analisis omzet penjualan, volume transaksi, dan menu terlaris{' '}
            {isAllBranches ? (
              <strong className="text-slate-700 font-semibold">seluruh cabang</strong>
            ) : (
              <>
                cabang <strong className="text-slate-700 font-semibold">{activeBranchName}</strong>
              </>
            )}
            .
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          {/* Outlet Switcher Dropdown */}
          <CustomSelect
            icon={<Store className="w-4 h-4" />}
            value={selectedOutletId}
            onChange={(val) => setSelectedOutletId(val)}
            options={[
              { value: 'ALL', label: 'Semua Cabang' },
              ...outlets.map((o) => ({ value: o.id, label: o.name })),
            ]}
          />

          {/* Date Preset Filter */}
          <CustomSelect
            icon={<Calendar className="w-4 h-4 text-slate-500" />}
            value={datePreset}
            onChange={(val) => setDatePreset(val)}
            options={[
              { value: 'TODAY', label: 'Hari Ini' },
              { value: 'LAST_7_DAYS', label: '7 Hari Terakhir' },
              { value: 'LAST_30_DAYS', label: '30 Hari Terakhir' },
              { value: 'THIS_MONTH', label: 'Bulan Ini' },
            ]}
          />
        </div>
      </div>

      {isLoading ? (
        <LoadingState message="Memuat data laporan penjualan..." className="h-64" />
      ) : (
        <>
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              title="Total Pendapatan (Omzet)"
              value={`Rp ${Number(summary.totalRevenue || 0).toLocaleString('id-ID')}`}
              icon={<DollarSign className="w-5 h-5 text-emerald-600" />}
              theme="emerald"
              subtitle="Dari transaksi selesai"
            />

            <KpiCard
              title="Total Pesanan Selesai"
              value={`${summary.totalOrders || 0} Order`}
              icon={<ShoppingCart className="w-5 h-5 text-teal-600" />}
              theme="teal"
              subtitle={`${summary.totalTransactions || 0} transaksi berhasil`}
            />

            <KpiCard
              title="Rata-rata Transaksi (AOV)"
              value={`Rp ${Number(summary.averageOrderValue || 0).toLocaleString('id-ID')}`}
              icon={<TrendingUp className="w-5 h-5 text-indigo-600" />}
              theme="indigo"
              subtitle="Per struk pesanan"
            />

            <KpiCard
              title="Cakupan Operasional"
              value={activeBranchName}
              icon={<Store className="w-5 h-5 text-amber-600" />}
              theme="amber"
              subtitle={isAllBranches ? `${outlets.length} outlet terdaftar` : 'Spesifik cabang'}
            />
          </div>

          {/* Section: Product Sales Breakdown & Payment Methods */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Left 2 Cols: Top Selling Products */}
            <div className="lg:col-span-2">
              <Card padding="none">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-[#0D5C53]" />
                    <h3 className="font-bold text-sm text-slate-900">Performa Penjualan Menu / Produk</h3>
                  </div>
                  <Badge variant="info" size="sm">
                    {byProduct.length} Produk Terjual
                  </Badge>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="py-3 px-4">Nama Menu</th>
                        <th className="py-3 px-4">Varian</th>
                        <th className="py-3 px-4 text-center">Terjual</th>
                        <th className="py-3 px-4 text-right">Kontribusi Omzet</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {byProduct.length === 0 ? (
                        <tr>
                          <td colSpan={4}>
                            <EmptyState
                              icon={<Package className="w-8 h-8 opacity-30 mx-auto" />}
                              title="Belum Ada Penjualan Produk"
                              description="Tidak ada data penjualan produk pada rentang waktu ini."
                            />
                          </td>
                        </tr>
                      ) : (
                        byProduct.map((item, idx) => (
                          <tr key={`${item.productId}-${item.variantId || idx}`} className="hover:bg-slate-50/70">
                            <td className="py-3 px-4 font-semibold text-slate-900">
                              {item.productName}
                            </td>
                            <td className="py-3 px-4 text-slate-600">
                              {item.variantName && item.variantName.trim().toLowerCase() !== 'default' ? item.variantName : '-'}
                            </td>
                            <td className="py-3 px-4 text-center font-bold text-slate-800">
                              {Number(item.quantitySold || 0).toLocaleString('id-ID')}
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-[#0D5C53]">
                              Rp {Number(item.revenue || 0).toLocaleString('id-ID')}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>

            {/* Right 1 Col: Payment Methods Breakdown */}
            <div>
              <Card padding="none">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-[#0D5C53]" />
                    <h3 className="font-bold text-sm text-slate-900">Metode Pembayaran</h3>
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  {byPaymentMethod.length === 0 ? (
                    <EmptyState
                      icon={<CreditCard className="w-8 h-8 opacity-30 mx-auto" />}
                      title="Belum Ada Transaksi"
                      description="Data metode pembayaran belum tersedia."
                    />
                  ) : (
                    byPaymentMethod.map((pm) => {
                      const isCash = pm.method === 'CASH';
                      const totalVal = Number(pm.total || 0);
                      const percent = summary.totalRevenue > 0
                        ? Math.round((totalVal / summary.totalRevenue) * 100)
                        : 0;

                      return (
                        <div
                          key={pm.method}
                          className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {isCash ? (
                                <Banknote className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <QrCode className="w-4 h-4 text-indigo-600" />
                              )}
                              <span className="font-bold text-xs text-slate-800">
                                {isCash ? 'Uang Tunai (Cash)' : 'QRIS / Non-Tunai'}
                              </span>
                            </div>
                            <span className="text-xs font-bold text-slate-700">
                              {percent}%
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-xs text-slate-500">
                            <span>{pm.count} transaksi</span>
                            <span className="font-bold text-[#0D5C53]">
                              Rp {totalVal.toLocaleString('id-ID')}
                            </span>
                          </div>

                          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${isCash ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </Card>
            </div>
          </div>

          {/* Section: Daily Sales Trend Table */}
          {byDate.length > 0 && (
            <Card padding="none">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#0D5C53]" />
                  <h3 className="font-bold text-sm text-slate-900">Rincian Penjualan Harian</h3>
                </div>
                <Badge variant="info" size="sm">
                  {byDate.length} Hari Aktif
                </Badge>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Tanggal</th>
                      <th className="py-3 px-4 text-center">Jumlah Transaksi</th>
                      <th className="py-3 px-4 text-right">Omzet Harian</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {byDate.map((row) => (
                      <tr key={row.date} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          {new Date(row.date).toLocaleDateString('id-ID', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-slate-700">
                          {row.transactions}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-[#0D5C53]">
                          Rp {Number(row.revenue || 0).toLocaleString('id-ID')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
};
