import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Order, QueryOrderParams } from '@model/Order';
import { useAuthStore } from '@domain/state/auth-store';
import { useOrderHistory, useDebounce, useOutlets } from '@domain/hooks';
import { TransactionDetailView } from './transaction-detail-view';
import { ReceiptModal } from '../pos/receipt-modal';
import {
  History,
  Printer,
  Eye,
  CheckCircle2,
  Clock,
  Ban,
  Download,
  Search,
  Filter,
  Calendar,
  X,
  ChevronLeft,
  ChevronRight,
  Receipt,
  Utensils,
  ShoppingBag,
  Banknote,
  QrCode,
  Store,
} from 'lucide-react';
import {
  Button,
  Badge,
  Card,
  SearchInput,
  LoadingState,
  EmptyState,
} from '@presentation/components/ui';

export const TransactionsScreen: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentOutlet = useAuthStore((state) => state.currentOutlet);
  const { data: outlets = [] } = useOutlets();

  // Multi-Outlet Scoping: 'ALL' or specific outletId
  const queryOutletId = searchParams.get('outletId');
  const [selectedOutletId, setSelectedOutletId] = useState<string>(queryOutletId || 'ALL');

  const isAllBranches = selectedOutletId === 'ALL' || !selectedOutletId;
  const effectiveOutletId = isAllBranches ? undefined : selectedOutletId;
  const activeOutlet = isAllBranches
    ? null
    : (outlets.find((o) => o.id === effectiveOutletId) || currentOutlet);
  const activeBranchName = isAllBranches
    ? 'Semua Cabang'
    : (activeOutlet?.name || 'Cabang Terpilih');

  // View state: selected order for full detail view, or null for history table list
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [orderTypeFilter, setOrderTypeFilter] = useState<string>('ALL');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [datePreset, setDatePreset] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;

  // Calculate Date Ranges
  const getDateRange = (preset: string): { startDate?: string; endDate?: string } => {
    const now = new Date();
    if (preset === 'TODAY') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return { startDate: start.toISOString() };
    }
    if (preset === 'LAST_7_DAYS') {
      const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return { startDate: start.toISOString() };
    }
    if (preset === 'LAST_30_DAYS') {
      const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return { startDate: start.toISOString() };
    }
    return {};
  };

  const { startDate, endDate } = getDateRange(datePreset);

  const queryParams: QueryOrderParams = {
    outletId: effectiveOutletId || undefined,
    page: currentPage,
    limit: pageSize,
    search: debouncedSearch || undefined,
    orderType: orderTypeFilter !== 'ALL' ? orderTypeFilter : undefined,
    status: statusFilter !== 'ALL' ? statusFilter : undefined,
    startDate,
    endDate,
  };

  const { data, isLoading: loading } = useOrderHistory(queryParams);
  const orders = data?.items || [];
  const meta = data?.meta || { page: 1, limit: pageSize, total: orders.length, totalPages: 1 };

  // Filter Client-side fallback if payment method filter is selected
  const displayOrders = orders.filter((o) => {
    if (paymentMethodFilter === 'ALL') return true;
    const method = o.payments?.[0]?.paymentMethod || o.paymentMethod || 'CASH';
    return method === paymentMethodFilter;
  });

  const handleResetFilters = () => {
    setSearchQuery('');
    setOrderTypeFilter('ALL');
    setPaymentMethodFilter('ALL');
    setStatusFilter('ALL');
    setDatePreset('ALL');
    setCurrentPage(1);
  };

  // CSV Export Handler
  const handleExportCSV = () => {
    if (orders.length === 0) {
      alert('Tidak ada data transaksi untuk diekspor.');
      return;
    }

    const headers = [
      'No. Transaksi',
      'No. Order',
      'Cabang',
      'Waktu',
      'Tipe Layanan',
      'Nomor Meja',
      'Pelanggan',
      'Kasir',
      'Metode Pembayaran',
      'Subtotal',
      'Diskon',
      'Pajak',
      'Total',
      'Status',
    ];

    const rows = orders.map((o) => [
      `"${o.transaction?.transactionNumber || `TRX-${o.id.slice(0, 8).toUpperCase()}`}"`,
      `"${o.orderNumber || o.id.slice(0, 8)}"`,
      `"${o.outlet?.name || activeBranchName}"`,
      `"${new Date(o.createdAt).toLocaleString('id-ID')}"`,
      `"${o.orderType}"`,
      `"${o.tableName || o.tableNumber || '-'}"`,
      `"${o.customerName || 'Umum'}"`,
      `"${o.creator?.name || o.cashierName || '-'}"`,
      `"${o.payments?.[0]?.paymentMethod || o.paymentMethod || 'CASH'}"`,
      Number(o.subtotal || o.totalAmount),
      Number(o.discountAmount || 0),
      Number(o.taxAmount || 0),
      Number(o.totalAmount),
      `"${o.status}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `riwayat-transaksi-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <Badge variant="success" dot>
            Selesai
          </Badge>
        );
      case 'PENDING':
        return (
          <Badge variant="warning" dot>
            Berjalan
          </Badge>
        );
      case 'VOID':
      case 'CANCELLED':
        return (
          <Badge variant="danger" dot>
            Dibatalkan
          </Badge>
        );
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  // If an order is selected, show Dedicated Detail View (Figma Frame 2)
  if (selectedOrder) {
    return (
      <TransactionDetailView
        order={selectedOrder}
        onBack={() => setSelectedOrder(null)}
        activeBranchName={selectedOrder.outlet?.name || activeBranchName}
      />
    );
  }

  return (
    <div className="space-y-5 pb-12">
      {/* Page Header with Outlet Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <History className="w-5 h-5 text-[#0D5C53]" />
              Riwayat Transaksi
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Multi-Outlet
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Daftar transaksi kasir, rincian pembayaran, dan faktur penjualan{' '}
            {isAllBranches ? (
              <span className="font-semibold text-slate-700">seluruh cabang</span>
            ) : (
              <>
                cabang <span className="font-semibold text-slate-700">{activeBranchName}</span>
              </>
            )}
            .
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-3">
          {/* Outlet Switcher Dropdown */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 shadow-xs">
            <Store className="w-4 h-4 text-[#0D5C53] shrink-0" />
            <span className="text-xs font-medium text-slate-600 shrink-0">Cabang:</span>
            <select
              aria-label="Pilih Filter Cabang"
              value={selectedOutletId}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedOutletId(val);
                if (val === 'ALL') {
                  searchParams.delete('outletId');
                  setSearchParams(searchParams);
                } else {
                  setSearchParams({ outletId: val });
                }
                setCurrentPage(1);
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
            variant="outline"
            size="sm"
            leftIcon={<Download className="w-4 h-4 text-slate-600" />}
            onClick={handleExportCSV}
          >
            Ekspor Laporan (CSV)
          </Button>
        </div>
      </div>

      {/* Filter & Search Bar Card */}
      <Card padding="md" className="space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="flex-1 max-w-md">
            <SearchInput
              value={searchQuery}
              onChange={(q) => {
                setSearchQuery(q);
                setCurrentPage(1);
              }}
              placeholder="Cari no. transaksi, order, meja, kasir, pelanggan..."
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Date Preset */}
            <select
              aria-label="Rentang Waktu"
              value={datePreset}
              onChange={(e) => {
                setDatePreset(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53] cursor-pointer"
            >
              <option value="ALL">Semua Waktu</option>
              <option value="TODAY">Hari Ini</option>
              <option value="LAST_7_DAYS">7 Hari Terakhir</option>
              <option value="LAST_30_DAYS">30 Hari Terakhir</option>
            </select>

            {/* Order Type */}
            <select
              aria-label="Tipe Layanan"
              value={orderTypeFilter}
              onChange={(e) => {
                setOrderTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53] cursor-pointer"
            >
              <option value="ALL">Semua Tipe Layanan</option>
              <option value="DINE_IN">Dine In (Makan di Tempat)</option>
              <option value="TAKE_AWAY">Take Away (Bungkus)</option>
            </select>

            {/* Payment Method */}
            <select
              aria-label="Metode Pembayaran"
              value={paymentMethodFilter}
              onChange={(e) => {
                setPaymentMethodFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53] cursor-pointer"
            >
              <option value="ALL">Semua Metode Bayar</option>
              <option value="CASH">Uang Tunai (Cash)</option>
              <option value="QRIS">QRIS / E-Wallet</option>
            </select>

            {/* Status Filter */}
            <select
              aria-label="Status Transaksi"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53] cursor-pointer"
            >
              <option value="ALL">Semua Status</option>
              <option value="COMPLETED">Selesai (Completed)</option>
              <option value="PENDING">Berjalan (Pending)</option>
              <option value="VOID">Dibatalkan (Void)</option>
            </select>

            {(searchQuery || orderTypeFilter !== 'ALL' || paymentMethodFilter !== 'ALL' || statusFilter !== 'ALL' || datePreset !== 'ALL') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="text-rose-600 hover:text-rose-700 text-xs px-2"
              >
                Reset Filter
              </Button>
            )}
          </div>
        </div>

        {/* Active Search Alert Banner (Matching Figma Frame 3) */}
        {debouncedSearch && (
          <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-xl text-xs text-[#0D5C53] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-[#0D5C53]" />
              <span>
                Menampilkan hasil pencarian untuk: <strong className="font-bold">"{debouncedSearch}"</strong>
              </span>
            </div>
            <button
              onClick={() => setSearchQuery('')}
              className="text-[11px] font-semibold text-[#0D5C53] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              Hapus Pencarian
            </button>
          </div>
        )}
      </Card>

      {/* Transactions Table Card */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">No. Transaksi</th>
                <th className="py-3.5 px-4">No. Order</th>
                {isAllBranches && <th className="py-3.5 px-4">Cabang</th>}
                <th className="py-3.5 px-4">Waktu</th>
                <th className="py-3.5 px-4">Layanan / Meja</th>
                <th className="py-3.5 px-4">Pelanggan</th>
                <th className="py-3.5 px-4">Kasir</th>
                <th className="py-3.5 px-4 text-center">Metode</th>
                <th className="py-3.5 px-4 text-right">Total Tagihan</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={isAllBranches ? 11 : 10}>
                    <LoadingState message="Memuat riwayat transaksi..." />
                  </td>
                </tr>
              ) : displayOrders.length === 0 ? (
                <tr>
                  <td colSpan={isAllBranches ? 11 : 10}>
                    <EmptyState
                      icon={<History className="w-8 h-8 opacity-30 mx-auto" />}
                      title="Transaksi Tidak Ditemukan"
                      description="Coba ubah kata kunci pencarian atau sesuaikan filter."
                    />
                  </td>
                </tr>
              ) : (
                displayOrders.map((order) => {
                  const trxNumber = order.transaction?.transactionNumber || `TRX-${order.id.slice(0, 8).toUpperCase()}`;
                  const orderNumber = order.orderNumber || order.id.slice(0, 8);
                  const paymentMethod = order.payments?.[0]?.paymentMethod || order.paymentMethod || 'CASH';

                  return (
                    <tr
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      className="hover:bg-teal-50/30 transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 group-hover:text-[#0D5C53]">
                        {trxNumber}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">
                        {orderNumber}
                      </td>
                      {isAllBranches && (
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md text-[11px] whitespace-nowrap">
                            <Store className="w-3 h-3 text-[#0D5C53]" />
                            {order.outlet?.name || '-'}
                          </span>
                        </td>
                      )}
                      <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px] whitespace-nowrap">
                        {new Date(order.createdAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant={order.orderType === 'DINE_IN' ? 'success' : 'info'} size="sm">
                          {order.orderType === 'DINE_IN' ? `Dine In • Meja ${order.tableName || order.tableNumber || '-'}` : 'Take Away'}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-800 truncate max-w-[120px]">
                        {order.customerName || 'Umum'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 truncate max-w-[100px]">
                        {order.creator?.name || order.cashierName || '-'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                          {paymentMethod === 'CASH' ? (
                            <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <QrCode className="w-3.5 h-3.5 text-teal-600" />
                          )}
                          {paymentMethod}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-[#0D5C53] font-mono whitespace-nowrap">
                        Rp {Number(order.totalAmount).toLocaleString('id-ID')}
                      </td>
                      <td className="py-3.5 px-4 text-center">{getStatusBadge(order.status)}</td>
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedOrder(order)}
                            leftIcon={<Eye className="w-3.5 h-3.5" />}
                          >
                            Detail
                          </Button>
                          {order.status === 'COMPLETED' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setReceiptOrder(order)}
                              leftIcon={<Printer className="w-3.5 h-3.5 text-teal-600" />}
                            >
                              Struk
                            </Button>
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

        {/* Table Pagination Footer */}
        {meta.total > 0 && (
          <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div>
              Menampilkan{' '}
              <strong className="font-semibold text-slate-800">
                {(meta.page - 1) * meta.limit + 1} - {Math.min(meta.page * meta.limit, meta.total)}
              </strong>{' '}
              dari <strong className="font-semibold text-slate-800">{meta.total}</strong> transaksi
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={meta.page <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
              >
                Sebelumnya
              </Button>

              <div className="flex items-center px-2 font-semibold text-slate-700">
                Hal {meta.page} dari {meta.totalPages}
              </div>

              <Button
                variant="outline"
                size="sm"
                disabled={meta.page >= meta.totalPages}
                onClick={() => setCurrentPage((p) => Math.min(meta.totalPages, p + 1))}
                rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
              >
                Selanjutnya
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Printable Receipt Modal */}
      {receiptOrder && (
        <ReceiptModal
          order={receiptOrder}
          isOpen={!!receiptOrder}
          onClose={() => setReceiptOrder(null)}
        />
      )}
    </div>
  );
};
