import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Boxes,
  Box,
  Coins,
  AlertTriangle,
  XCircle,
  Eye,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { useAuthStore } from '@domain/state/auth-store';
import { useStockOverview } from '@domain/hooks';
import type { StockStatus } from '@model/Inventory';
import {
  Card,
  Badge,
  Button,
  SearchInput,
  FormSelect,
  KpiCard,
  EmptyState,
  LoadingState,
} from '@presentation/components/ui';

export const StockScreen: React.FC = () => {
  const navigate = useNavigate();
  const currentOutlet = useAuthStore((state) => state.currentOutlet);

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [itemTypeFilter, setItemTypeFilter] = useState<string>('ALL');
  const [stockStatusFilter, setStockStatusFilter] = useState<string>('ALL');
  const [page, setPage] = useState<number>(1);
  const limit = 10;

  // Query Params
  const queryParams = useMemo(() => {
    return {
      outletId: currentOutlet?.id,
      page,
      limit,
      search: searchTerm.trim() || undefined,
      itemType: itemTypeFilter !== 'ALL' ? itemTypeFilter : undefined,
      stockStatus: stockStatusFilter !== 'ALL' ? stockStatusFilter : undefined,
    };
  }, [currentOutlet?.id, page, limit, searchTerm, itemTypeFilter, stockStatusFilter]);

  const { data: stockResponse, isLoading } = useStockOverview(queryParams);

  const items = stockResponse?.data || [];
  const meta = stockResponse?.meta || {
    page: 1,
    limit: 10,
    total: items.length,
    totalPages: 1,
  };
  const summary = stockResponse?.summary || {
    totalItems: 0,
    totalInventoryValue: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
  };

  // Format Currency
  const formatRupiah = (val: number) => {
    return `Rp ${new Intl.NumberFormat('id-ID').format(val)}`;
  };

  const getStatusBadge = (status: StockStatus | string) => {
    switch (status) {
      case 'OUT_OF_STOCK':
        return (
          <Badge variant="danger" dot>
            Out of Stock
          </Badge>
        );
      case 'LOW_STOCK':
        return (
          <Badge variant="warning" dot>
            Low Stock
          </Badge>
        );
      case 'NORMAL':
      default:
        return (
          <Badge variant="success" dot>
            Normal
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto">
      {/* Top Header & Breadcrumb */}
      <div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link to="/inventory/stock" className="hover:text-[#0D5C53]">
            Inventory
          </Link>
          <span>/</span>
          <span className="text-slate-800 font-semibold">Stok</span>
        </div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight mt-0.5">Stok</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Pantau kondisi stok bahan baku dan packaging secara real-time di {currentOutlet?.name || 'Outlet Utama'}.
        </p>
      </div>

      {/* 4 KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="TOTAL ITEM"
          value={summary.totalItems.toLocaleString('id-ID')}
          subtitle="Active Raw Materials + Packaging"
          icon={<Box className="w-5 h-5" />}
          theme="slate"
        />

        <KpiCard
          title="TOTAL INVENTORY VALUE"
          value={formatRupiah(summary.totalInventoryValue)}
          subtitle="Nilai stok saat ini"
          icon={<Coins className="w-5 h-5" />}
          theme="teal"
        />

        <KpiCard
          title="LOW STOCK"
          value={summary.lowStockCount.toLocaleString('id-ID')}
          subtitle="Items with Current Stock <= Min Stock"
          icon={<AlertTriangle className="w-5 h-5" />}
          theme={summary.lowStockCount > 0 ? 'amber' : 'slate'}
          statusBadge={
            summary.lowStockCount > 0 ? (
              <Badge variant="warning" size="sm" dot>
                Perhatian
              </Badge>
            ) : undefined
          }
        />

        <KpiCard
          title="OUT OF STOCK"
          value={summary.outOfStockCount.toLocaleString('id-ID')}
          subtitle="Items with Current Stock = 0"
          icon={<XCircle className="w-5 h-5" />}
          theme={summary.outOfStockCount > 0 ? 'amber' : 'slate'}
          statusBadge={
            summary.outOfStockCount > 0 ? (
              <Badge variant="danger" size="sm" dot>
                Kritis
              </Badge>
            ) : undefined
          }
        />
      </div>

      {/* Main Stock Table Card */}
      <Card
        header={
          <div className="space-y-3 w-full">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Daftar Stok</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Daftar posisi stok bahan baku dan packaging saat ini.
                </p>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3 pt-2">
              <div className="sm:col-span-2">
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
                  placeholder="Cari Nama/SKU..."
                />
              </div>

              <div>
                <FormSelect
                  value={itemTypeFilter}
                  onChange={(e) => {
                    setItemTypeFilter(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="ALL">Jenis Item: Semua</option>
                  <option value="RAW_MATERIAL">Bahan Baku</option>
                  <option value="PACKAGING">Packaging</option>
                </FormSelect>
              </div>

              <div>
                <FormSelect
                  value={stockStatusFilter}
                  onChange={(e) => {
                    setStockStatusFilter(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="ALL">Status Stok: Semua</option>
                  <option value="NORMAL">Normal</option>
                  <option value="LOW_STOCK">Low Stock</option>
                  <option value="OUT_OF_STOCK">Out of Stock</option>
                </FormSelect>
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
                <th className="py-3.5 px-4">Item</th>
                <th className="py-3.5 px-4">Jenis</th>
                <th className="py-3.5 px-4 font-mono">SKU</th>
                <th className="py-3.5 px-4 text-right">Current Stock</th>
                <th className="py-3.5 px-4">Unit</th>
                <th className="py-3.5 px-4 text-right">Min Stock</th>
                <th className="py-3.5 px-4 text-right">Unit Cost</th>
                <th className="py-3.5 px-4 text-right">Stock Value</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={10}>
                    <LoadingState message="Memuat posisi stok..." />
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={10}>
                    <EmptyState
                      icon={<Boxes className="w-8 h-8 opacity-30 mx-auto text-[#0D5C53]" />}
                      title="Tidak ada item stok"
                      description={
                        searchTerm || itemTypeFilter !== 'ALL' || stockStatusFilter !== 'ALL'
                          ? 'Tidak ada item inventori yang cocok dengan filter pencarian.'
                          : 'Belum ada data stok bahan baku atau packaging pada outlet ini.'
                      }
                    />
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const isOutOfStock = item.currentStock <= 0;
                  const isLowStock =
                    item.currentStock > 0 && item.currentStock <= item.minimumStock;
                  const itemTypeName =
                    item.itemType === 'PACKAGING' ? 'Packaging' : 'Bahan Baku';

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/60 transition-colors group cursor-pointer"
                      onClick={() => navigate(`/inventory/stock/${item.id}`)}
                    >
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {item.name}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-slate-600 font-medium">{itemTypeName}</span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-500 font-semibold">
                        {item.sku || '-'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold">
                        <span
                          className={
                            isOutOfStock
                              ? 'text-rose-600'
                              : isLowStock
                              ? 'text-amber-600'
                              : 'text-slate-900'
                          }
                        >
                          {Number(item.currentStock).toLocaleString('id-ID')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-medium">
                        {item.unit}
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-600 font-medium">
                        {Number(item.minimumStock).toLocaleString('id-ID')}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-700">
                        {formatRupiah(item.unitCost)}/{item.unit}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold font-mono text-slate-900">
                        {formatRupiah(item.stockValue)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {getStatusBadge(item.stockStatus)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          to={`/inventory/stock/${item.id}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-[#0D5C53] hover:bg-[#0D5C53]/10 font-medium"
                          >
                            Lihat Detail
                          </Button>
                        </Link>
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
              dari <span className="font-semibold text-slate-700">{meta.total}</span> item
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
