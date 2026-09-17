import React, { useState } from 'react';
import {
  CircleDollarSign,
  TrendingUp,
  DollarSign,
  Calendar,
  Store,
  Package,
  Percent,
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

export const ProfitReportScreen: React.FC = () => {
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
  const [datePreset, setDatePreset] = useState<string>('THIS_MONTH');

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
    const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    return { startDate: start, endDate: end };
  };

  const { startDate, endDate } = getDateRange(datePreset);

  const { data: reportData, isLoading } = useSalesReport({
    startDate,
    endDate,
    outletId: effectiveOutletId,
  });

  const totalRevenue = Number(reportData?.summary?.totalRevenue || 0);
  const byProduct = reportData?.byProduct || [];

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto">
      {/* Top Header with Multi-Outlet Switcher & Date Range */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <CircleDollarSign className="w-5 h-5 text-[#0D5C53]" />
              Laporan Profit & Margin Penjualan
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Multi-Outlet
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Analisis margin keuntungan dan perputaran pendapatan{' '}
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
            icon={<Store className="w-4 h-4 text-[#0D5C53]" />}
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
              { value: 'THIS_MONTH', label: 'Bulan Ini' },
            ]}
          />
        </div>
      </div>

      {isLoading ? (
        <LoadingState message="Memuat data margin dan profitabilitas..." className="h-64" />
      ) : (
        <>
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <KpiCard
              title="Total Omzet Penjualan"
              value={`Rp ${totalRevenue.toLocaleString('id-ID')}`}
              icon={<DollarSign className="w-5 h-5 text-emerald-600" />}
              theme="emerald"
              subtitle="Dari transaksi yang berhasil diselesaikan"
            />

            <KpiCard
              title="Menu Terlaris"
              value={byProduct[0]?.productName || '-'}
              icon={<Package className="w-5 h-5 text-teal-600" />}
              theme="teal"
              subtitle={byProduct[0] ? `${byProduct[0].quantitySold} porsi terjual` : 'Belum ada data'}
            />

            <KpiCard
              title="Cakupan Operasional"
              value={activeBranchName}
              icon={<Store className="w-5 h-5 text-indigo-600" />}
              theme="indigo"
              subtitle={isAllBranches ? `${outlets.length} outlet terdaftar` : 'Cabang terisolasi'}
            />
          </div>

          {/* Per Product Revenue Contribution Table */}
          <Card padding="none">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#0D5C53]" />
                <h3 className="font-bold text-sm text-slate-900">Kontribusi Penjualan & Margin Produk</h3>
              </div>
              <Badge variant="info" size="sm">
                {byProduct.length} Menu Terjual
              </Badge>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Nama Menu</th>
                    <th className="py-3 px-4">Varian</th>
                    <th className="py-3 px-4 text-center">Jumlah Terjual</th>
                    <th className="py-3 px-4 text-right">Total HPP</th>
                    <th className="py-3 px-4 text-right">Total Nilai Omzet</th>
                    <th className="py-3 px-4 text-right">% Margin</th>
                    <th className="py-3 px-4 text-right">% Kontribusi Omzet</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {byProduct.length === 0 ? (
                    <tr>
                      <td colSpan={7}>
                        <EmptyState
                          icon={<CircleDollarSign className="w-8 h-8 opacity-30 mx-auto text-[#0D5C53]" />}
                          title="Belum Ada Transaksi Produk"
                          description="Belum ada data penjualan pada rentang waktu ini."
                        />
                      </td>
                    </tr>
                  ) : (
                    byProduct.map((item, idx) => {
                      const itemRev = Number(item.revenue || 0);
                      const itemHpp = Number(item.totalCogs || 0);
                      const percentContrib = totalRevenue > 0
                        ? ((itemRev / totalRevenue) * 100).toFixed(1)
                        : '0.0';
                      const marginPercent = item.marginPercentage !== undefined
                        ? Number(item.marginPercentage).toFixed(1)
                        : itemRev > 0
                          ? (((itemRev - itemHpp) / itemRev) * 100).toFixed(1)
                          : '0.0';
                      const numMargin = Number(marginPercent);

                      return (
                        <tr key={`${item.productId}-${item.variantId || idx}`} className="hover:bg-slate-50/70">
                          <td className="py-3 px-4 font-semibold text-slate-900">
                            {item.productName}
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            {item.variantName && !item.variantName.trim().toLowerCase().includes('default') ? item.variantName : '-'}
                          </td>
                          <td className="py-3 px-4 text-center font-bold text-slate-800">
                            {Number(item.quantitySold || 0).toLocaleString('id-ID')}
                          </td>
                          <td className="py-3 px-4 text-right font-medium text-slate-700">
                            Rp {itemHpp.toLocaleString('id-ID')}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-[#0D5C53]">
                            Rp {itemRev.toLocaleString('id-ID')}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                                numMargin >= 40
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : numMargin > 0
                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                    : 'bg-rose-50 text-rose-700 border-rose-200'
                              }`}
                            >
                              {marginPercent}%
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-teal-50 text-[#0D5C53] border border-teal-200">
                              {percentContrib}%
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
};
