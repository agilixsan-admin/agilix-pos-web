import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
} from 'lucide-react';
import { useAuthStore } from '@domain/state/auth-store';
import {
  usePurchases,
  useSuppliers,
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
} from '@presentation/components/ui';

export const PurchasesScreen: React.FC = () => {
  const navigate = useNavigate();
  const currentOutlet = useAuthStore((state) => state.currentOutlet);

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
      outletId: currentOutlet?.id,
      page,
      limit,
      search: searchTerm.trim() || undefined,
      status: statusFilter !== 'ALL' ? (statusFilter as PurchaseStatus) : undefined,
      supplierId: supplierFilter !== 'ALL' ? supplierFilter : undefined,
      startDate: startDateFilter || undefined,
      endDate: endDateFilter || undefined,
    };
  }, [currentOutlet?.id, page, limit, searchTerm, statusFilter, supplierFilter, startDateFilter, endDateFilter]);

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
          <Badge variant="warning" dot>
            Draft
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Pembelian</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola pembelian bahan baku dan packaging dari supplier di {currentOutlet?.name || 'Outlet Utama'}.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => navigate('/inventory/purchases/create')}
          >
            Buat Pembelian
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <Card padding="sm" className="bg-white">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-center">
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
              placeholder="Cari no. PO, supplier..."
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
              <option value="ALL">Semua Supplier</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
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

      {/* Purchases Table Card */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">No. Pembelian</th>
                <th className="py-3.5 px-4">Tanggal</th>
                <th className="py-3.5 px-4">Supplier</th>
                <th className="py-3.5 px-4 text-center">Total Item</th>
                <th className="py-3.5 px-4 text-right">Total Biaya</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7}>
                    <LoadingState message="Memuat daftar pembelian..." />
                  </td>
                </tr>
              ) : purchases.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <EmptyState
                      icon={<ShoppingBag className="w-8 h-8 opacity-30 mx-auto text-[#0D5C53]" />}
                      title="Belum ada transaksi pembelian"
                      description={
                        searchTerm || statusFilter !== 'ALL' || supplierFilter !== 'ALL' || startDateFilter
                          ? 'Tidak ada pembelian yang sesuai dengan kriteria filter.'
                          : 'Mulai buat pesanan pembelian pertama untuk menambah stok inventori.'
                      }
                      action={
                        !searchTerm && statusFilter === 'ALL' && supplierFilter === 'ALL' ? (
                          <Button
                            variant="primary"
                            size="sm"
                            leftIcon={<Plus className="w-3.5 h-3.5" />}
                            onClick={() => navigate('/inventory/purchases/create')}
                          >
                            Buat Pembelian Baru
                          </Button>
                        ) : undefined
                      }
                    />
                  </td>
                </tr>
              ) : (
                purchases.map((purchase) => {
                  const itemCount = purchase.totalItems ?? purchase.items?.length ?? 0;
                  const totalCost = Number(purchase.totalAmount ?? purchase.subtotal ?? 0);
                  const supplierName = purchase.supplier?.name || '-';

                  return (
                    <tr
                      key={purchase.id}
                      className="hover:bg-slate-50/60 transition-colors group cursor-pointer"
                      onClick={() => navigate(`/inventory/purchases/${purchase.id}`)}
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-[#0D5C53]">
                        <Link
                          to={`/inventory/purchases/${purchase.id}`}
                          className="hover:underline flex items-center gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <FileText className="w-3.5 h-3.5 text-slate-400" />
                          {purchase.purchaseNumber}
                        </Link>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-medium">
                        {formatDate(purchase.purchaseDate)}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{supplierName}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center font-medium text-slate-700">
                        {itemCount} item
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                        {formatRupiah(totalCost)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {getStatusBadge(purchase.status)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div
                          className="flex items-center justify-end gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Link to={`/inventory/purchases/${purchase.id}`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              leftIcon={<Eye className="w-3.5 h-3.5" />}
                              className="text-[#0D5C53] hover:bg-[#0D5C53]/10"
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

        {/* Pagination */}
        {meta.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div>
              Menampilkan <span className="font-semibold text-slate-700">{(page - 1) * limit + 1}</span> -{' '}
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
