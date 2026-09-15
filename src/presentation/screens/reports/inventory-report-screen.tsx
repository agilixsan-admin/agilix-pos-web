import React, { useState } from 'react';
import {
  ScrollText,
  DollarSign,
  AlertTriangle,
  Store,
  Search,
  Boxes,
  Package,
} from 'lucide-react';
import { useAuthStore } from '@domain/state/auth-store';
import { useOutlets, useInventoryReport, useDebounce } from '@domain/hooks';
import {
  KpiCard,
  Badge,
  Card,
  SearchInput,
  LoadingState,
  EmptyState,
} from '@presentation/components/ui';

export const InventoryReportScreen: React.FC = () => {
  const currentOutlet = useAuthStore((state) => state.currentOutlet);
  const { data: outlets = [] } = useOutlets();

  // Multi-Outlet Filter State
  const [selectedOutletId, setSelectedOutletId] = useState<string>('ALL');
  const isAllBranches = selectedOutletId === 'ALL';
  const effectiveOutletId = isAllBranches ? undefined : selectedOutletId;
  const activeBranchName = isAllBranches
    ? 'Semua Cabang'
    : outlets.find((o) => o.id === selectedOutletId)?.name || currentOutlet?.name || 'Cabang Terpilih';

  // Search filter
  const [search, setSearch] = useState<string>('');
  const debouncedSearch = useDebounce(search, 300);

  const { data: reportData, isLoading } = useInventoryReport({
    outletId: effectiveOutletId,
    search: debouncedSearch || undefined,
  });

  const summary = reportData?.summary || {
    totalItems: 0,
    lowStockItems: 0,
    totalValuation: 0,
  };

  const items = reportData?.items || [];

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto">
      {/* Top Header with Multi-Outlet Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <ScrollText className="w-5 h-5 text-[#0D5C53]" />
              Laporan Inventori & Valuasi Stok
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Multi-Outlet
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Analisis nilai aset gudang, ketersediaan stok fisik, dan peringatan stok menipis{' '}
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
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 shadow-xs">
            <Store className="w-4 h-4 text-[#0D5C53] shrink-0" />
            <span className="text-xs font-medium text-slate-600 shrink-0">Cabang:</span>
            <select
              aria-label="Pilih Outlet Inventori"
              value={selectedOutletId}
              onChange={(e) => setSelectedOutletId(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-800 outline-none cursor-pointer pr-1"
            >
              <option value="ALL">🏢 Semua Cabang</option>
              {outlets.map((outlet) => (
                <option key={outlet.id} value={outlet.id}>
                  🏪 {outlet.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <LoadingState message="Memuat valuasi inventori gudang..." className="h-64" />
      ) : (
        <>
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <KpiCard
              title="Total Valuasi Aset Stok"
              value={`Rp ${Number(summary.totalValuation || 0).toLocaleString('id-ID')}`}
              icon={<DollarSign className="w-5 h-5 text-emerald-600" />}
              theme="emerald"
              subtitle="Estimasi nilai modal bahan baku"
            />

            <KpiCard
              title="Total Item Terdata"
              value={`${summary.totalItems || 0} Bahan / Kemasan`}
              icon={<Boxes className="w-5 h-5 text-teal-600" />}
              theme="teal"
              subtitle="Dalam sistem inventory"
            />

            <KpiCard
              title="Peringatan Stok Menipis"
              value={`${summary.lowStockItems || 0} Item Kritis`}
              icon={<AlertTriangle className="w-5 h-5 text-amber-600" />}
              theme="amber"
              subtitle="Perlu re-order / restock segera"
            />
          </div>

          {/* Table Card */}
          <Card padding="none">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-[#0D5C53]" />
                <h3 className="font-bold text-sm text-slate-900">Daftar Bahan Baku & Valuasi Stok</h3>
              </div>

              <div className="w-full sm:w-72">
                <SearchInput
                  value={search}
                  onChange={setSearch}
                  placeholder="Cari bahan atau SKU..."
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Nama Bahan / Item</th>
                    <th className="py-3 px-4">SKU / Kode</th>
                    <th className="py-3 px-4">Kategori</th>
                    <th className="py-3 px-4 text-center">Stok Saat Ini</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Nilai Valuasi Aset</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={6}>
                        <EmptyState
                          icon={<ScrollText className="w-8 h-8 opacity-30 mx-auto text-[#0D5C53]" />}
                          title="Item Inventori Tidak Ditemukan"
                          description="Coba sesuaikan kata kunci pencarian atau cabang outlet."
                        />
                      </td>
                    </tr>
                  ) : (
                    items.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          {item.name}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-500">
                          {item.sku || '-'}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {item.category || 'Umum'}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-slate-800">
                          {Number(item.currentStock || 0).toLocaleString('id-ID')} {item.unit}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {item.isLowStock ? (
                            <Badge variant="danger" size="sm" dot>
                              Stok Kritis
                            </Badge>
                          ) : (
                            <Badge variant="success" size="sm" dot>
                              Aman
                            </Badge>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-[#0D5C53]">
                          Rp {Number(item.valuation || 0).toLocaleString('id-ID')}
                        </td>
                      </tr>
                    ))
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
