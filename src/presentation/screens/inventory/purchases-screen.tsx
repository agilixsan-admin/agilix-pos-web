import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import {
  ShoppingBag,
  Plus,
  Calendar,
  Building2,
  Eye,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Store,
} from 'lucide-react';
import { useAuthStore } from '@domain/state/auth-store';
import {
  usePurchases,
  useSuppliers,
  useOutlets,
} from '@domain/hooks';
import type { PurchaseStatus } from '@model/Inventory';
import {
  Card,
  Badge,
  Button,
  SearchInput,
  FormSelect,
  FormInput,
  EmptyState,
  LoadingState,
  CustomSelect,
  CustomDatePicker,
} from '@presentation/components/ui';

export const PurchasesScreen: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentOutlet = useAuthStore((state) => state.currentOutlet);
  const { data: outlets = [] } = useOutlets();

  // Multi-Outlet Scoping
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
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [supplierFilter, setSupplierFilter] = useState<string>('ALL');
  const [startDateFilter, setStartDateFilter] = useState<string>('');
  const [endDateFilter, setEndDateFilter] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const limit = 10;

  // Fetch Suppliers for dropdown
  const { data: suppliers = [] } = useSuppliers();

  // Query Params for Purchases
  const queryParams = useMemo(() => {
    return {
      outletId: effectiveOutletId || undefined,
      page,
      limit,
      search: searchTerm.trim() || undefined,
      status: statusFilter !== 'ALL' ? (statusFilter as PurchaseStatus) : undefined,
      supplierId: supplierFilter !== 'ALL' ? supplierFilter : undefined,
      startDate: startDateFilter || undefined,
      endDate: endDateFilter || undefined,
    };
  }, [effectiveOutletId, page, limit, searchTerm, statusFilter, supplierFilter, startDateFilter, endDateFilter]);

  const { data: purchaseData, isLoading } = usePurchases(queryParams);

  const purchases = purchaseData?.data || [];
  const meta = purchaseData?.meta || {
    page: 1,
    limit: 10,
    total: purchases.length,
    totalPages: 1,
  };

  // Format Currency
  const formatRupiah = (val: number) => {
    return `Rp ${new Intl.NumberFormat('id-ID').format(val)}`;
  };

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

  const getStatusBadge = (status: PurchaseStatus | string) => {
    switch (status) {
      case 'RECEIVED':
        return (
          <Badge variant="success" dot>
            Diterima
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
          <Badge variant="neutral" dot>
            Draft
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto">
      {/* Top Header & Breadcrumb with Outlet Switcher */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Link to="/inventory/stock" className="hover:text-[#0D5C53]">
              Inventory
            </Link>
            <span>/</span>
            <span className="text-slate-800 font-semibold">Pembelian</span>
          </div>
          <div className="flex items-center gap-2.5 mt-0.5">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Pembelian Bahan & Kemasan (Purchase Orders)
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Multi-Outlet
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Kelola pengadaan stok bahan baku dan packaging khusus untuk cabang <span className="font-semibold text-slate-700">{activeBranchName}</span>.
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
            onClick={() => navigate(`/inventory/purchases/create?outletId=${effectiveOutletId}`)}
            className="bg-[#0D5C53] hover:bg-[#09423c] text-white shadow-sm"
          >
            + Buat Pembelian
          </Button>
        </div>
      </div>

      {/* Main Table Card */}
      <Card
        header={
          <div className="space-y-3 w-full">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Daftar Pesanan Pembelian (PO) — {activeBranchName}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Daftar seluruh riwayat pemesanan stok dan pengadaan ke supplier pada cabang ini.
                </p>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
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
                  placeholder="Cari No. PO atau Supplier..."
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
                  <option value="ALL">Status: Semua</option>
                  <option value="DRAFT">Draft</option>
                  <option value="RECEIVED">Diterima</option>
                  <option value="CANCELLED">Dibatalkan</option>
                </FormSelect>
              </div>

              {/* Supplier Filter */}
              <div>
                <FormSelect
                  value={supplierFilter}
                  onChange={(e) => {
                    setSupplierFilter(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="ALL">Supplier: Semua</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </FormSelect>
              </div>

              {/* Date Filter */}
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
                <th className="py-3.5 px-4 font-mono">No. Pembelian</th>
                <th className="py-3.5 px-4">Tanggal</th>
                <th className="py-3.5 px-4">Supplier</th>
                <th className="py-3.5 px-4 text-center">Cabang Penerima</th>
                <th className="py-3.5 px-4 text-center">Item</th>
                <th className="py-3.5 px-4 text-right">Total Tagihan</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8}>
                    <LoadingState message="Memuat daftar pembelian..." />
                  </td>
                </tr>
              ) : purchases.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <EmptyState
                      icon={<ShoppingBag className="w-8 h-8 opacity-30 mx-auto text-[#0D5C53]" />}
                      title="Tidak Ada Pembelian"
                      description={
                        searchTerm || statusFilter !== 'ALL' || supplierFilter !== 'ALL' || startDateFilter
                          ? 'Tidak ada pesanan pembelian yang cocok dengan filter pencarian.'
                          : `Belum ada pesanan pembelian yang dibuat untuk ${activeBranchName}.`
                      }
                      action={
                        <Button
                          variant="primary"
                          size="sm"
                          leftIcon={<Plus className="w-4 h-4" />}
                          onClick={() => navigate(`/inventory/purchases/create?outletId=${effectiveOutletId}`)}
                          className="mt-2"
                        >
                          Buat Pembelian Sekarang
                        </Button>
                      }
                    />
                  </td>
                </tr>
              ) : (
                purchases.map((purchase) => {
                  const detailUrl = `/inventory/purchases/${purchase.id}?outletId=${effectiveOutletId}`;

                  return (
                    <tr
                      key={purchase.id}
                      className="hover:bg-slate-50/60 transition-colors group cursor-pointer"
                      onClick={() => navigate(detailUrl)}
                    >
                      {/* No. PO */}
                      <td className="py-3.5 px-4 font-mono font-bold text-[#0D5C53]">
                        <Link
                          to={detailUrl}
                          className="hover:underline flex items-center gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <FileText className="w-3.5 h-3.5 text-slate-400" />
                          {purchase.purchaseNumber}
                        </Link>
                      </td>

                      {/* Tanggal */}
                      <td className="py-3.5 px-4 text-slate-700 font-medium">
                        {formatDate(purchase.purchaseDate)}
                      </td>

                      {/* Supplier */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-900">
                          {purchase.supplier?.name || '-'}
                        </span>
                      </td>

                      {/* Cabang Penerima */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Store className="w-3 h-3" />
                          {purchase.outlet?.name || activeBranchName}
                        </span>
                      </td>

                      {/* Jumlah Item */}
                      <td className="py-3.5 px-4 text-center font-medium">
                        {purchase.totalItems || purchase.items?.length || 0} macam
                      </td>

                      {/* Total Biaya */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                        {formatRupiah(purchase.totalAmount || purchase.subtotal || 0)}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        {getStatusBadge(purchase.status)}
                      </td>

                      {/* Aksi */}
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
