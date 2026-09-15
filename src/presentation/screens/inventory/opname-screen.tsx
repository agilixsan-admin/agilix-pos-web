import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ClipboardCheck,
  Plus,
  Calendar,
  Eye,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  PlayCircle,
  ChevronLeft,
  ChevronRight,
  Store,
} from 'lucide-react';
import { useAuthStore } from '@domain/state/auth-store';
import { useStockOpnames, useOutlets } from '@domain/hooks';
import type { StockOpnameStatus } from '@model/Inventory';
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
} from '@presentation/components/ui';

export const OpnameScreen: React.FC = () => {
  const navigate = useNavigate();
  const currentOutlet = useAuthStore((state) => state.currentOutlet);
  const { data: outlets = [] } = useOutlets();

  // Multi-Outlet Filter State
  const [selectedOutletId, setSelectedOutletId] = useState<string>('ALL');
  const isAllBranches = selectedOutletId === 'ALL';
  const effectiveOutletId = isAllBranches ? undefined : selectedOutletId;
  const activeBranchName = isAllBranches
    ? 'Semua Cabang'
    : outlets.find((o) => o.id === selectedOutletId)?.name || currentOutlet?.name || 'Cabang Terpilih';

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [startDateFilter, setStartDateFilter] = useState<string>('');
  const [endDateFilter, setEndDateFilter] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const limit = 10;

  // Query Params
  const queryParams = useMemo(() => {
    return {
      outletId: effectiveOutletId,
      page,
      limit,
      search: searchTerm.trim() || undefined,
      status: statusFilter !== 'ALL' ? (statusFilter as StockOpnameStatus) : undefined,
      startDate: startDateFilter || undefined,
      endDate: endDateFilter || undefined,
    };
  }, [effectiveOutletId, page, limit, searchTerm, statusFilter, startDateFilter, endDateFilter]);

  const { data: opnameData, isLoading } = useStockOpnames(queryParams);

  const opnames = opnameData?.data || [];
  const meta = opnameData?.meta || {
    page: 1,
    limit: 10,
    total: opnames.length,
    totalPages: 1,
  };

  // KPI aggregates from fetched data
  const totalOpnames = meta.total || opnames.length;
  const inProgressCount = opnames.filter((o) => o.status === 'IN_PROGRESS' || o.status === 'DRAFT').length;
  const completedCount = opnames.filter((o) => o.status === 'COMPLETED').length;
  const cancelledCount = opnames.filter((o) => o.status === 'CANCELLED').length;

  // Format Date
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const getStatusBadge = (status: StockOpnameStatus | string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <Badge variant="success" dot>
            Finalized
          </Badge>
        );
      case 'IN_PROGRESS':
        return (
          <Badge variant="info" dot>
            Counting
          </Badge>
        );
      case 'CANCELLED':
        return (
          <Badge variant="danger" dot>
            Dibatalkan
          </Badge>
        );
      case 'DRAFT':
      default:
        return (
          <Badge variant="warning" dot>
            Draft
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto">
      {/* Top Header with In-Screen Outlet Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Link to="/inventory/stock" className="hover:text-[#0D5C53]">
              Inventory
            </Link>
            <span>/</span>
            <span className="text-slate-800 font-semibold">Stock Opname</span>
          </div>
          <div className="flex items-center gap-2.5 mt-1">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-[#0D5C53]" />
              Stock Opname
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Multi-Outlet
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Lakukan pencatatan stok fisik dan bandingkan dengan stok sistem{' '}
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
              aria-label="Pilih Outlet Opname"
              value={selectedOutletId}
              onChange={(e) => {
                setSelectedOutletId(e.target.value);
                setPage(1);
              }}
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

          <Button
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => navigate('/inventory/opname/create')}
          >
            Mulai Stock Opname
          </Button>
        </div>
      </div>

      {/* 4 KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="TOTAL OPNAME"
          value={totalOpnames.toLocaleString('id-ID')}
          subtitle="Riwayat sesi opname"
          icon={<ClipboardCheck className="w-5 h-5" />}
          theme="slate"
        />

        <KpiCard
          title="COUNTING"
          value={inProgressCount.toLocaleString('id-ID')}
          subtitle="Sesi sedang berlangsung"
          icon={<Clock className="w-5 h-5" />}
          theme={inProgressCount > 0 ? 'amber' : 'slate'}
          statusBadge={
            inProgressCount > 0 ? (
              <Badge variant="warning" size="sm" dot>
                Aktif
              </Badge>
            ) : undefined
          }
        />

        <KpiCard
          title="FINALIZED"
          value={completedCount.toLocaleString('id-ID')}
          subtitle="Selesai & terekonsiliasi"
          icon={<CheckCircle2 className="w-5 h-5" />}
          theme="emerald"
        />

        <KpiCard
          title="CANCELLED"
          value={cancelledCount.toLocaleString('id-ID')}
          subtitle="Sesi dibatalkan"
          icon={<XCircle className="w-5 h-5" />}
          theme="slate"
        />
      </div>

      {/* Filter Bar */}
      <Card padding="sm" className="bg-white">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-center">
          {/* Search */}
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
              placeholder="Cari No. Opname, catatan..."
            />
          </div>

          {/* Status Filter */}
          <div>
            <FormSelect
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="ALL">Semua Status</option>
              <option value="IN_PROGRESS">Counting (In Progress)</option>
              <option value="COMPLETED">Finalized (Completed)</option>
              <option value="CANCELLED">Dibatalkan</option>
            </FormSelect>
          </div>

          {/* Date Filter */}
          <div>
            <FormInput
              type="date"
              value={startDateFilter}
              onChange={(e) => {
                setStartDateFilter(e.target.value);
                setPage(1);
              }}
              placeholder="Pilih Tanggal"
            />
          </div>
        </div>
      </Card>

      {/* Opname Table Card */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">No. Opname</th>
                {isAllBranches && <th className="py-3.5 px-4">Cabang</th>}
                <th className="py-3.5 px-4">Tanggal / Periode</th>
                <th className="py-3.5 px-4 text-center">Total Item</th>
                <th className="py-3.5 px-4">Progress Perhitungan</th>
                <th className="py-3.5 px-4 text-center">Difference</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={isAllBranches ? 8 : 7}>
                    <LoadingState message="Memuat daftar stock opname..." />
                  </td>
                </tr>
              ) : opnames.length === 0 ? (
                <tr>
                  <td colSpan={isAllBranches ? 8 : 7}>
                    <EmptyState
                      icon={<ClipboardCheck className="w-8 h-8 opacity-30 mx-auto text-[#0D5C53]" />}
                      title="Belum ada sesi stock opname"
                      description={
                        searchTerm || statusFilter !== 'ALL' || startDateFilter
                          ? 'Tidak ada sesi opname yang cocok dengan filter pencarian.'
                          : 'Mulai sesi penghitungan fisik gudang berkala untuk memverifikasi stok sistem.'
                      }
                      action={
                        !searchTerm && statusFilter === 'ALL' ? (
                          <Button
                            variant="primary"
                            size="sm"
                            leftIcon={<Plus className="w-3.5 h-3.5" />}
                            onClick={() => navigate('/inventory/opname/create')}
                          >
                            Mulai Stock Opname
                          </Button>
                        ) : undefined
                      }
                    />
                  </td>
                </tr>
              ) : (
                opnames.map((opname) => {
                  const total = opname.totalItems || opname.items?.length || 0;
                  const counted = opname.countedItems || 0;
                  const percentage = total > 0 ? Math.round((counted / total) * 100) : 0;
                  const hasDifference = (opname.deficitItems || 0) + (opname.surplusItems || 0) > 0;
                  const isInProgress = opname.status === 'IN_PROGRESS' || opname.status === 'DRAFT';

                  return (
                    <tr
                      key={opname.id}
                      className="hover:bg-slate-50/60 transition-colors group cursor-pointer"
                      onClick={() =>
                        navigate(
                          isInProgress
                            ? `/inventory/opname/${opname.id}/count`
                            : `/inventory/opname/${opname.id}`
                        )
                      }
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-[#0D5C53]">
                        <Link
                          to={
                            isInProgress
                              ? `/inventory/opname/${opname.id}/count`
                              : `/inventory/opname/${opname.id}`
                          }
                          className="hover:underline flex items-center gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <FileText className="w-3.5 h-3.5 text-slate-400" />
                          {opname.opnameNumber}
                        </Link>
                      </td>

                      {isAllBranches && (
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md text-[11px] whitespace-nowrap">
                            <Store className="w-3 h-3 text-[#0D5C53]" />
                            {opname.outlet?.name || '-'}
                          </span>
                        </td>
                      )}

                      <td className="py-3.5 px-4 text-slate-700 font-medium">
                        {formatDate(opname.opnameDate)}
                      </td>

                      <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                        {total} item
                      </td>

                      {/* Progress bar */}
                      <td className="py-3.5 px-4 min-w-[160px]">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-semibold text-slate-700">
                              {counted} / {total} item
                            </span>
                            <span className="text-slate-500 font-mono">{percentage}%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                percentage === 100 ? 'bg-emerald-500' : 'bg-[#0D5C53]'
                              }`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Difference */}
                      <td className="py-3.5 px-4 text-center">
                        {hasDifference ? (
                          <span className="text-rose-600 font-bold text-xs">
                            {(opname.deficitItems || 0) + (opname.surplusItems || 0)} Selisih
                          </span>
                        ) : counted > 0 ? (
                          <span className="text-emerald-600 font-semibold text-xs">Sesuai</span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {getStatusBadge(opname.status)}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div
                          className="flex items-center justify-end gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {isInProgress ? (
                            <Link to={`/inventory/opname/${opname.id}/count`}>
                              <Button
                                variant="primary"
                                size="sm"
                                leftIcon={<PlayCircle className="w-3.5 h-3.5" />}
                              >
                                Lanjut Hitung
                              </Button>
                            </Link>
                          ) : (
                            <Link to={`/inventory/opname/${opname.id}`}>
                              <Button
                                variant="ghost"
                                size="sm"
                                leftIcon={<Eye className="w-3.5 h-3.5" />}
                                className="text-[#0D5C53] hover:bg-[#0D5C53]/10"
                              >
                                Lihat Detail
                              </Button>
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div>
              Menampilkan <span className="font-semibold text-slate-700">{(page - 1) * limit + 1}</span> -{' '}
              <span className="font-semibold text-slate-700">
                {Math.min(page * limit, meta.total)}
              </span>{' '}
              dari <span className="font-semibold text-slate-700">{meta.total}</span> sesi
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
