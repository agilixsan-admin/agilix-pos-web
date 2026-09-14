import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Box,
  AlertTriangle,
  Coins,
  History,
  ShoppingCart,
  Sliders,
  ArrowDownLeft,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '@domain/state/auth-store';
import {
  useStockItemDetail,
  useStockMovements,
} from '@domain/hooks';
import type { StockStatus } from '@model/Inventory';
import {
  Card,
  Badge,
  Button,
  KpiCard,
  EmptyState,
  LoadingState,
} from '@presentation/components/ui';

export const StockDetailScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentOutlet = useAuthStore((state) => state.currentOutlet);

  // Queries
  const { data: item, isLoading: loadingItem } = useStockItemDetail(id, currentOutlet?.id);
  const { data: movements = [], isLoading: loadingMovements } = useStockMovements({
    itemId: id,
    outletId: currentOutlet?.id,
  });

  // Local pagination for movements table
  const [page, setPage] = useState(1);
  const limit = 10;
  const totalMovements = movements.length;
  const totalPages = Math.ceil(totalMovements / limit) || 1;
  const paginatedMovements = movements.slice((page - 1) * limit, page * limit);

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

  const getStatusBadge = (status?: StockStatus | string) => {
    switch (status) {
      case 'OUT_OF_STOCK':
        return (
          <Badge variant="danger" dot>
            OUT OF STOCK
          </Badge>
        );
      case 'LOW_STOCK':
        return (
          <Badge variant="warning" dot>
            LOW STOCK
          </Badge>
        );
      case 'NORMAL':
      default:
        return (
          <Badge variant="success" dot>
            NORMAL
          </Badge>
        );
    }
  };

  if (loadingItem) {
    return <LoadingState message="Memuat detail item stok..." className="min-h-[400px]" />;
  }

  if (!item) {
    return (
      <Card className="max-w-md mx-auto my-12 text-center p-8">
        <EmptyState
          icon={<Box className="w-10 h-10 text-slate-300 mx-auto" />}
          title="Item Stok Tidak Ditemukan"
          description="Data item inventori yang Anda cari tidak tersedia atau telah dihapus."
          action={
            <Link to="/inventory/stock">
              <Button variant="primary" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Kembali ke Daftar Stok
              </Button>
            </Link>
          }
        />
      </Card>
    );
  }

  const isLowStock = item.currentStock <= item.minimumStock && item.currentStock > 0;
  const isOutOfStock = item.currentStock <= 0;
  const itemTypeName = item.itemType === 'PACKAGING' ? 'Packaging' : 'Bahan Baku';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/inventory/stock')}
            className="p-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-slate-600 transition-colors shadow-xs cursor-pointer"
            title="Kembali ke Daftar Stok"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {item.name}
            </h1>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 font-mono">
              <span>SKU: {item.sku || '-'}</span>
              <span>•</span>
              <span className="font-sans">Jenis: {itemTypeName}</span>
              <span>•</span>
              {getStatusBadge(item.stockStatus)}
            </div>
          </div>
        </div>

        {/* Top Right Actions */}
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            leftIcon={<Sliders className="w-4 h-4" />}
            onClick={() => navigate('/inventory/adjustments')}
          >
            Penyesuaian Stok
          </Button>

          <Button
            variant="primary"
            leftIcon={<ShoppingCart className="w-4 h-4" />}
            onClick={() => navigate('/inventory/purchases/create')}
          >
            Buat Pembelian
          </Button>
        </div>
      </div>

      {/* 4 Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="CURRENT STOCK"
          value={`${Number(item.currentStock).toLocaleString('id-ID')} ${item.unit}`}
          icon={<Box className="w-5 h-5" />}
          theme={isOutOfStock || isLowStock ? 'amber' : 'teal'}
          statusBadge={getStatusBadge(item.stockStatus)}
        />

        <KpiCard
          title="MINIMUM STOCK"
          value={`${Number(item.minimumStock).toLocaleString('id-ID')} ${item.unit}`}
          subtitle="Batas peringatan stok"
          icon={<AlertTriangle className="w-5 h-5" />}
          theme="slate"
        />

        <KpiCard
          title="UNIT COST"
          value={`${formatRupiah(item.unitCost)}`}
          unit={`/${item.unit}`}
          subtitle="Moving Average Unit Cost"
          icon={<Coins className="w-5 h-5" />}
          theme="slate"
        />

        <KpiCard
          title="STOCK VALUE"
          value={formatRupiah(item.stockValue)}
          subtitle={`${Number(item.currentStock).toLocaleString('id-ID')} ${item.unit} × ${formatRupiah(item.unitCost)}`}
          icon={<Coins className="w-5 h-5" />}
          theme="emerald"
        />
      </div>

      {/* 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Card: Item Information (1 Col) */}
        <div className="space-y-6">
          <Card header={<h3 className="text-sm font-bold text-slate-900">Item Information</h3>}>
            <div className="space-y-4 text-xs">
              <div>
                <span className="text-slate-400 font-medium block uppercase text-[10px]">
                  ITEM NAME
                </span>
                <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                  {item.name}
                </span>
              </div>

              <div>
                <span className="text-slate-400 font-medium block uppercase text-[10px]">
                  SKU
                </span>
                <span className="font-mono font-semibold text-slate-700 mt-0.5 block">
                  {item.sku || '-'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 font-medium block uppercase text-[10px]">
                  JENIS ITEM
                </span>
                <span className="font-semibold text-slate-800 mt-0.5 block">
                  {itemTypeName}
                </span>
              </div>

              <div>
                <span className="text-slate-400 font-medium block uppercase text-[10px]">
                  BASE UNIT
                </span>
                <span className="font-semibold text-slate-800 mt-0.5 block">
                  {item.unit}
                </span>
              </div>

              <div>
                <span className="text-slate-400 font-medium block uppercase text-[10px]">
                  CURRENT STOCK
                </span>
                <span className="font-bold text-slate-900 mt-0.5 block">
                  {Number(item.currentStock).toLocaleString('id-ID')} {item.unit}
                </span>
              </div>

              <div>
                <span className="text-slate-400 font-medium block uppercase text-[10px]">
                  MINIMUM STOCK
                </span>
                <span className="font-semibold text-slate-700 mt-0.5 block">
                  {Number(item.minimumStock).toLocaleString('id-ID')} {item.unit}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <span className="text-slate-400 font-medium block uppercase text-[10px]">
                  STOCK STATUS
                </span>
                <div className="mt-1">
                  {getStatusBadge(item.stockStatus)}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Card: Pergerakan Stok (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          <Card
            header={
              <div className="flex items-center justify-between w-full">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Pergerakan Stok</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Riwayat perubahan stok item.
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<ShoppingCart className="w-3.5 h-3.5" />}
                  onClick={() => navigate('/inventory/purchases')}
                >
                  Lihat Pembelian
                </Button>
              </div>
            }
            padding="none"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3.5 px-4">Tanggal</th>
                    <th className="py-3.5 px-4">Jenis</th>
                    <th className="py-3.5 px-4">Referensi</th>
                    <th className="py-3.5 px-4 text-right">Masuk</th>
                    <th className="py-3.5 px-4 text-right">Keluar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingMovements ? (
                    <tr>
                      <td colSpan={5}>
                        <LoadingState message="Memuat pergerakan stok..." />
                      </td>
                    </tr>
                  ) : movements.length === 0 ? (
                    <tr>
                      <td colSpan={5}>
                        <EmptyState
                          icon={<History className="w-8 h-8 opacity-30 mx-auto" />}
                          title="Belum ada riwayat pergerakan stok"
                          description="Setiap pembelian, penjualan POS, dan penyesuaian stok akan tercatat di sini."
                        />
                      </td>
                    </tr>
                  ) : (
                    paginatedMovements.map((m) => {
                      const isIncoming = m.direction === 'IN' || m.quantity > 0;
                      const movementTypeLabel =
                        m.type === 'IN' || m.referenceType === 'PURCHASE'
                          ? 'Pembelian'
                          : m.type === 'SALE'
                          ? 'Penjualan'
                          : m.type === 'ADJUSTMENT'
                          ? 'Stock Adjustment'
                          : m.type === 'WASTE'
                          ? 'Waste'
                          : m.type || (isIncoming ? 'Masuk' : 'Keluar');

                      const refCode = m.referenceId || m.reason || '-';
                      const isPurchaseRef =
                        refCode.startsWith('PB-') || m.referenceType === 'PURCHASE';

                      return (
                        <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3.5 px-4 font-medium text-slate-700">
                            {formatDate(m.movementDate || m.createdAt)}
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-slate-800">
                            {movementTypeLabel}
                          </td>
                          <td className="py-3.5 px-4 font-mono">
                            {isPurchaseRef ? (
                              <Link
                                to="/inventory/purchases"
                                className="text-[#0D5C53] hover:underline font-semibold"
                              >
                                {refCode}
                              </Link>
                            ) : (
                              <span className="text-slate-600">{refCode}</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold font-mono">
                            {isIncoming ? (
                              <span className="text-emerald-600">
                                +{Number(Math.abs(m.quantity)).toLocaleString('id-ID')} {item.unit}
                              </span>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold font-mono">
                            {!isIncoming ? (
                              <span className="text-rose-600">
                                -{Number(Math.abs(m.quantity)).toLocaleString('id-ID')} {item.unit}
                              </span>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            {totalMovements > limit && (
              <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <div>
                  Showing {(page - 1) * limit + 1} to {Math.min(page * limit, totalMovements)} of{' '}
                  {totalMovements} entries
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
                  >
                    Previous
                  </Button>
                  <span className="font-semibold text-slate-700 px-2">
                    {page} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

