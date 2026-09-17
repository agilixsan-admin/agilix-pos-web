import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import {
  SlidersHorizontal,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Eye,
  FileText,
  AlertTriangle,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  Store,
} from 'lucide-react';
import { useAuthStore } from '@domain/state/auth-store';
import { useStockAdjustments, useReasonCategories, useOutlets } from '@domain/hooks';
import type { StockAdjustment } from '@model/Inventory';
import {
  Card,
  Badge,
  Button,
  SearchInput,
  FormSelect,
  FormInput,
  KpiCard,
  EmptyState,
  LoadingState,
  CustomSelect,
  CustomDatePicker,
} from '@presentation/components/ui';

export const AdjustmentsScreen: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentOutlet = useAuthStore((state) => state.currentOutlet);
  const { data: outlets = [] } = useOutlets();

  // Selected Outlet state (Multi-Outlet Scoping)
  const queryOutletId = searchParams.get('outletId');
  const [selectedOutletId, setSelectedOutletId] = useState<string>(queryOutletId || '');

  // Auto-select outlet on load
  useEffect(() => {
    if (!selectedOutletId && (currentOutlet?.id || outlets[0]?.id)) {
      setSelectedOutletId(currentOutlet?.id || outlets[0]?.id || '');
    }
  }, [currentOutlet, outlets, selectedOutletId]);

  const effectiveOutletId =
    selectedOutletId ||
    currentOutlet?.id ||
    (outlets.length > 0 ? outlets[0].id : '');
  const activeOutlet =
    outlets.find((o) => o.id === effectiveOutletId) || currentOutlet;
  const activeBranchName = activeOutlet?.name || 'Cabang Utama';

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [reasonFilter, setReasonFilter] = useState<string>('ALL');
  const [startDateFilter, setStartDateFilter] = useState<string>('');
  const [endDateFilter, setEndDateFilter] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const limit = 10;

  // Reason Categories Query
  const { data: reasonCategories = [] } = useReasonCategories();

  // Adjustments Query Params
  const queryParams = useMemo(() => {
    return {
      outletId: effectiveOutletId || undefined,
      page,
      limit,
      search: searchTerm.trim() || undefined,
      type: typeFilter !== 'ALL' ? (typeFilter as 'IN' | 'OUT') : undefined,
      reasonCategoryId: reasonFilter !== 'ALL' ? reasonFilter : undefined,
      startDate: startDateFilter || undefined,
      endDate: endDateFilter || undefined,
    };
  }, [effectiveOutletId, page, limit, searchTerm, typeFilter, reasonFilter, startDateFilter, endDateFilter]);

  const { data: adjustmentData, isLoading } = useStockAdjustments(queryParams);

  const adjustments: StockAdjustment[] = adjustmentData?.data || [];
  const meta = adjustmentData?.meta || {
    page: 1,
    limit: 10,
    total: adjustments.length,
    totalPages: 1,
  };
  const summary = adjustmentData?.summary || {
    totalAdjustments: adjustments.length,
    totalIn: adjustments.filter((a: StockAdjustment) => a.type === 'IN').length,
    totalOut: adjustments.filter((a: StockAdjustment) => a.type === 'OUT').length,
    totalLossValue: 0,
  };

  // Format Date & Time
  const formatDateTime = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  // Format Currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto">
      {/* Top Header & Navigation with Outlet Switcher */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Link to="/inventory/stock" className="hover:text-[#0D5C53]">
              Inventory
            </Link>
            <span>/</span>
            <span className="text-slate-800 font-semibold">Stock Adjustment</span>
          </div>
          <div className="flex items-center gap-2.5 mt-0.5">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Penyesuaian Stok (Stock Adjustment)
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Multi-Outlet
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Catat mutasi manual dan opname stok gudang di <span className="font-semibold text-slate-700">{activeBranchName}</span>.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-3">
          {/* Outlet Switcher Dropdown */}
          <div className="flex items-center gap-2">
            <CustomSelect
              ariaLabel="Pilih Cabang"
              icon={<Store className="w-4 h-4 text-[#0D5C53]" />}
              value={effectiveOutletId}
              onChange={(val) => {
                setSelectedOutletId(val);
                setSearchParams({ outletId: val });
                setPage(1);
              }}
              options={outlets.map((outlet) => ({
                value: outlet.id,
                label: outlet.name,
              }))}
              buttonClassName="bg-slate-50 border-slate-200 text-xs py-2 px-3 rounded-xl font-semibold"
            />
          </div>

          <Button
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => navigate(`/inventory/adjustments/create?outletId=${effectiveOutletId}`)}
            className="bg-[#0D5C53] hover:bg-[#09423c] text-white shadow-sm"
          >
            + Buat Adjustment
          </Button>
        </div>
      </div>

      {/* 4 KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="TOTAL ADJUSTMENT"
          value={summary.totalAdjustments.toLocaleString('id-ID')}
          subtitle={`Riwayat penyesuaian di ${activeBranchName}`}
          icon={<SlidersHorizontal className="w-5 h-5" />}
          theme="slate"
        />

        <KpiCard
          title="ADJUSTMENT IN"
          value={summary.totalIn.toLocaleString('id-ID')}
          subtitle="Penambahan stok manual"
          icon={<ArrowUpRight className="w-5 h-5" />}
          theme="emerald"
        />

        <KpiCard
          title="ADJUSTMENT OUT"
          value={summary.totalOut.toLocaleString('id-ID')}
          subtitle="Pengurangan stok manual"
          icon={<ArrowDownLeft className="w-5 h-5" />}
          theme="amber"
        />

        <KpiCard
          title="TOTAL NILAI LOSS"
          value={formatCurrency(summary.totalLossValue)}
          subtitle="Valuasi penyusutan / keluar"
          icon={<TrendingDown className="w-5 h-5" />}
          theme={summary.totalLossValue > 0 ? 'amber' : 'slate'}
        />
      </div>

      {/* Filter Bar */}
      <Card
        header={
          <div className="space-y-3 w-full">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Daftar Penyesuaian Stok — {activeBranchName}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Daftar seluruh riwayat penyesuaian stok manual pada cabang terpilih.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
              {/* Search Bar */}
              <div className="lg:col-span-2">
                <SearchInput
                  value={searchTerm}
                  onChange={(val) => {
                    setSearchTerm(val);
                    setPage(1);
                  }}
                  onClear={() => {
                    setSearchTerm('');
                    setPage(1);
                  }}
                  placeholder="Cari No. Adjustment / Item / Alasan..."
                />
              </div>

              {/* Type Filter */}
              <div>
                <FormSelect
                  value={typeFilter}
                  onChange={(e) => {
                    setTypeFilter(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="ALL">Jenis: Semua (IN/OUT)</option>
                  <option value="IN">IN (Penambahan Stok)</option>
                  <option value="OUT">OUT (Pengurangan Stok)</option>
                </FormSelect>
              </div>

              {/* Reason Category Filter */}
              <div>
                <FormSelect
                  value={reasonFilter}
                  onChange={(e) => {
                    setReasonFilter(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="ALL">Alasan: Semua</option>
                  {reasonCategories.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </FormSelect>
              </div>

              {/* Date Filters */}
              <div className="flex items-center gap-2">
                <CustomDatePicker
                  value={startDateFilter}
                  onChange={(val) => {
                    setStartDateFilter(val);
                    setPage(1);
                  }}
                  placeholder="Dari"
                  className="w-full text-xs"
                />
                <span className="text-slate-400 text-xs">-</span>
                <CustomDatePicker
                  value={endDateFilter}
                  onChange={(val) => {
                    setEndDateFilter(val);
                    setPage(1);
                  }}
                  placeholder="Sampai"
                  className="w-full text-xs"
                />
              </div>
            </div>
          </div>
        }
        padding="none"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4 font-mono">No. Adjustment</th>
                <th className="py-3.5 px-4">Waktu</th>
                <th className="py-3.5 px-4">Item & Detail</th>
                <th className="py-3.5 px-4 text-center">Jenis</th>
                <th className="py-3.5 px-4 text-right">Jumlah</th>
                <th className="py-3.5 px-4">Alasan</th>
                <th className="py-3.5 px-4 text-center">Sumber</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={9}>
                    <LoadingState message="Memuat riwayat penyesuaian stok..." />
                  </td>
                </tr>
              ) : adjustments.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <EmptyState
                      icon={<SlidersHorizontal className="w-8 h-8 opacity-30 mx-auto text-[#0D5C53]" />}
                      title="Belum Ada Penyesuaian Stok"
                      description={
                        searchTerm || typeFilter !== 'ALL' || reasonFilter !== 'ALL' || startDateFilter
                          ? 'Tidak ada riwayat penyesuaian stok yang cocok dengan kriteria filter.'
                          : `Belum ada riwayat penyesuaian stok manual yang dicatat pada ${activeBranchName}.`
                      }
                      action={
                        <Button
                          variant="primary"
                          size="sm"
                          leftIcon={<Plus className="w-4 h-4" />}
                          onClick={() => navigate(`/inventory/adjustments/create?outletId=${effectiveOutletId}`)}
                          className="mt-2"
                        >
                          Catat Adjustment Sekarang
                        </Button>
                      }
                    />
                  </td>
                </tr>
              ) : (
                adjustments.map((adj) => {
                  const isIn = adj.type === 'IN';
                  const item = adj.inventoryItem;
                  const unit = item?.unit || 'unit';
                  const qtyNumber = Number(adj.quantity || 0);
                  const detailUrl = `/inventory/adjustments/${adj.id}?outletId=${effectiveOutletId}`;

                  return (
                    <tr
                      key={adj.id}
                      className="hover:bg-slate-50/60 transition-colors group cursor-pointer"
                      onClick={() => navigate(detailUrl)}
                    >
                      {/* Adjustment Number */}
                      <td className="py-3.5 px-4 font-mono font-bold text-[#0D5C53]">
                        <Link
                          to={detailUrl}
                          className="hover:underline flex items-center gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <FileText className="w-3.5 h-3.5 text-slate-400" />
                          {adj.adjustmentNumber}
                        </Link>
                      </td>

                      {/* Date & Time */}
                      <td className="py-3.5 px-4 text-slate-700 font-medium">
                        {formatDateTime(adj.adjustmentDate)}
                      </td>

                      {/* Item details */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 text-xs">
                          {item?.name || 'Item'}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {item?.sku && (
                            <span className="font-mono text-[11px] text-slate-500">
                              {item.sku}
                            </span>
                          )}
                          {item?.category && (
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                              {item.category.name}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Type Badge */}
                      <td className="py-3.5 px-4 text-center">
                        <Badge variant={isIn ? 'success' : 'danger'} size="sm" dot>
                          {isIn ? 'IN' : 'OUT'}
                        </Badge>
                      </td>

                      {/* Quantity */}
                      <td className="py-3.5 px-4 text-right">
                        <span
                          className={`font-mono font-bold text-xs ${
                            isIn ? 'text-emerald-700' : 'text-rose-700'
                          }`}
                        >
                          {isIn ? `+${qtyNumber.toLocaleString('id-ID')}` : `-${qtyNumber.toLocaleString('id-ID')}`}{' '}
                          <span className="text-[11px] text-slate-500 font-normal">{unit}</span>
                        </span>
                      </td>

                      {/* Reason */}
                      <td className="py-3.5 px-4 text-slate-700">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 text-[11px] font-medium">
                          {adj.reasonCategory?.name || 'Manual'}
                        </span>
                      </td>

                      {/* Source */}
                      <td className="py-3.5 px-4 text-center text-slate-500 text-[11px]">
                        {adj.source === 'STOCK_OPNAME' ? 'Stock Opname' : 'Manual'}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <Badge variant="success" size="sm">
                          Completed
                        </Badge>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <div
                          className="flex items-center justify-end"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Link to={detailUrl}>
                            <Button
                              variant="ghost"
                              size="sm"
                              leftIcon={<Eye className="w-3.5 h-3.5" />}
                              className="text-[#0D5C53] hover:bg-[#0D5C53]/10 font-medium"
                            >
                              Detail
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {meta.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div>
              Menampilkan <span className="font-semibold text-slate-700">{(page - 1) * limit + 1}</span>-
              <span className="font-semibold text-slate-700">
                {Math.min(page * limit, meta.total)}
              </span>{' '}
              dari <span className="font-semibold text-slate-700">{meta.total}</span> data
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
              >
                Sebelumnya
              </Button>
              <span className="font-semibold text-slate-700 px-2">
                {page} / {meta.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= meta.totalPages}
                onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
              >
                Selanjutnya
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
