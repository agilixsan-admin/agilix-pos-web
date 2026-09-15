import React, { useState } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
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
  Store,
} from 'lucide-react';
import { useAuthStore } from '@domain/state/auth-store';
import {
  useStockItemDetail,
  useStockMovements,
  useOutlets,
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
  const [searchParams, setSearchParams] = useSearchParams();
  const currentOutlet = useAuthStore((state) => state.currentOutlet);
  const { data: outlets = [] } = useOutlets();

  const queryOutletId = searchParams.get('outletId');
  const effectiveOutletId =
    queryOutletId ||
    currentOutlet?.id ||
    (outlets.length > 0 ? outlets[0].id : '');
  const activeOutlet =
    outlets.find((o) => o.id === effectiveOutletId) || currentOutlet;
  const activeBranchName = activeOutlet?.name || 'Cabang Utama';

  // Queries
  const { data: item, isLoading: loadingItem } = useStockItemDetail(
    id,
    effectiveOutletId,
  );
  const { data: movements = [], isLoading: loadingMovements } = useStockMovements({
    itemId: id,
    outletId: effectiveOutletId,
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

  const getMovementTypeBadge = (type?: string) => {
    const isPositive =
      type === 'PURCHASE_RECEIPT' ||
      type === 'TRANSFER_IN' ||
      type === 'ADJUSTMENT_IN' ||
      type === 'INITIAL';

    if (isPositive) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
          <ArrowDownLeft className="w-3 h-3 text-emerald-600" />
          {type === 'PURCHASE_RECEIPT'
            ? 'Penerimaan PO'
            : type === 'ADJUSTMENT_IN'
            ? 'Penyesuaian Masuk'
            : type === 'TRANSFER_IN'
            ? 'Transfer Masuk'
            : 'Stok Awal'}
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
        <ArrowUpRight className="w-3 h-3 text-rose-600" />
        {type === 'ORDER_USAGE'
          ? 'Pemakaian POS'
          : type === 'ADJUSTMENT_OUT'
          ? 'Penyesuaian Keluar'
          : type === 'WASTE'
          ? 'Waste / Rusak'
          : type === 'TRANSFER_OUT'
          ? 'Transfer Keluar'
          : 'Keluar'}
      </span>
    );
  };

  if (loadingItem) {
    return <LoadingState message="Memuat rincian stok item..." />;
  }

  if (!item) {
    return (
      <Card className="max-w-md mx-auto my-12 text-center p-8">
        <EmptyState
          icon={<Box className="w-10 h-10 text-slate-300 mx-auto" />}
          title="Item Stok Tidak Ditemukan"
          description="Data item inventori yang Anda cari tidak tersedia atau telah dihapus."
          action={
            <Link to={`/inventory/stock?outletId=${effectiveOutletId}`}>
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(`/inventory/stock?outletId=${effectiveOutletId}`)}
            className="p-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-slate-600 transition-colors shadow-xs cursor-pointer"
            title="Kembali ke Daftar Stok"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                {item.name}
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {activeBranchName}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 font-mono">
              <span>SKU: {item.sku || '-'}</span>
              <span>•</span>
              <span className="font-sans">Jenis: {itemTypeName}</span>
              <span>•</span>
              {getStatusBadge(item.stockStatus)}
            </div>
          </div>
        </div>

        {/* Top Right Actions with Branch Switcher */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Branch Switcher Dropdown */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 shadow-xs">
            <Store className="w-4 h-4 text-[#0D5C53] shrink-0" />
            <span className="text-xs font-medium text-slate-600 shrink-0">Cabang:</span>
            <select
              value={effectiveOutletId}
              onChange={(e) => {
                setSearchParams({ outletId: e.target.value });
                setPage(1);
              }}
              className="bg-transparent text-xs font-semibold text-slate-800 outline-none cursor-pointer pr-1"
            >
              {outlets.map((outlet) => (
                <option key={outlet.id} value={outlet.id}>
                  🏪 {outlet.name}
                </option>
              ))}
            </select>
          </div>

          <Button
            variant="outline"
            leftIcon={<Sliders className="w-4 h-4" />}
            onClick={() => navigate(`/inventory/adjustments?outletId=${effectiveOutletId}`)}
          >
            Penyesuaian Stok
          </Button>

          <Button
            variant="primary"
            leftIcon={<ShoppingCart className="w-4 h-4" />}
            onClick={() => navigate(`/inventory/purchases/create?outletId=${effectiveOutletId}`)}
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
          subtitle={`Stok fisik di ${activeBranchName}`}
          icon={<Box className="w-5 h-5" />}
          theme={isOutOfStock || isLowStock ? 'amber' : 'teal'}
          statusBadge={getStatusBadge(item.stockStatus)}
        />

        <KpiCard
          title="MINIMUM STOCK"
          value={`${Number(item.minimumStock).toLocaleString('id-ID')} ${item.unit}`}
          subtitle="Batas peringatan restock"
          icon={<AlertTriangle className="w-5 h-5" />}
          theme="slate"
        />

        <KpiCard
          title="UNIT COST"
          value={formatRupiah(item.unitCost)}
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
                  KATEGORI
                </span>
                <span className="font-semibold text-slate-800 mt-0.5 block">
                  {item.category?.name || '-'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 font-medium block uppercase text-[10px]">
                  CABANG AKTIF
                </span>
                <span className="font-semibold text-emerald-700 mt-0.5 block">
                  🏪 {activeBranchName}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <span className="text-slate-400 font-medium block uppercase text-[10px]">
                  DESKRIPSI
                </span>
                <p className="text-slate-600 mt-0.5 text-xs leading-relaxed">
                  {item.description || 'Tidak ada deskripsi.'}
                </p>
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
                  <h3 className="text-sm font-bold text-slate-900">
                    Pergerakan Stok — {activeBranchName}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Riwayat mutasi keluar/masuk stok item pada cabang terpilih.
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<ShoppingCart className="w-3.5 h-3.5" />}
                  onClick={() => navigate(`/inventory/purchases?outletId=${effectiveOutletId}`)}
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
                          icon={<History className="w-8 h-8 opacity-30 mx-auto text-[#0D5C53]" />}
                          title="Belum Ada Pergerakan Stok"
                          description={`Belum ada mutasi keluar/masuk untuk item ini di ${activeBranchName}.`}
                        />
                      </td>
                    </tr>
                  ) : (
                    paginatedMovements.map((movement) => (
                      <tr key={movement.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4 font-mono text-slate-600">
                          {formatDate(movement.createdAt)}
                        </td>
                        <td className="py-3.5 px-4">
                          {getMovementTypeBadge(movement.movementType || (movement.type as string))}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-600">
                          {movement.referenceId || movement.reason || movement.notes || '-'}
                        </td>
                        <td className="py-3.5 px-4 text-right font-semibold text-emerald-600">
                          {movement.quantity > 0 ? `+${Number(movement.quantity).toLocaleString('id-ID')}` : '-'}
                        </td>
                        <td className="py-3.5 px-4 text-right font-semibold text-rose-600">
                          {movement.quantity < 0 ? Number(movement.quantity).toLocaleString('id-ID') : '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            {totalPages > 1 && (
              <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <div>
                  Menampilkan{' '}
                  <span className="font-semibold text-slate-700">{(page - 1) * limit + 1}</span>-
                  <span className="font-semibold text-slate-700">
                    {Math.min(page * limit, totalMovements)}
                  </span>{' '}
                  dari <span className="font-semibold text-slate-700">{totalMovements}</span> riwayat
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
                    {page} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                  >
                    Selanjutnya
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
