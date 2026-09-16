import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  usePackagingDetail,
  useStockMovements,
  useProducts,
} from '@domain/hooks';
import {
  ArrowLeft,
  Edit2,
  Box,
  Layers,
  AlertTriangle,
  History,
  ShoppingCart,
  Coffee,
  Info,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  Sliders,
  Package,
} from 'lucide-react';
import {
  Button,
  Badge,
  KpiCard,
  Tabs,
  Card,
  EmptyState,
  LoadingState,
} from '@presentation/components/ui';

export const PackagingDetailScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Queries
  const { data: packaging, isLoading: loadingItem } = usePackagingDetail(id);
  const effectiveItemId = packaging?.inventoryItemId || id;
  const { data: movements = [], isLoading: loadingMovements } = useStockMovements({
    itemId: effectiveItemId,
  });
  const { data: products = [] } = useProducts();

  // Tab State ('overview' | 'movements' | 'linked-products')
  const [activeTab, setActiveTab] = useState<string>('overview');

  // Format Currency
  const formatRupiah = (val: number) => {
    return `Rp ${new Intl.NumberFormat('id-ID').format(val)}`;
  };

  // Format Date Time
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

  // Linked Products calculation (products that use this packaging in BOM / recipes)
  const linkedProducts = useMemo(() => {
    if (!id || !products.length) return [];
    return products.filter((prod) => {
      // Check variants recipes/packagings or product packagings
      const hasInVariants = prod.variants?.some((v: any) =>
        v.packagings?.some((p: any) => p.packagingId === id || p.materialId === id)
      );
      const hasInDirect = (prod as any).packagings?.some(
        (p: any) => p.packagingId === id || p.materialId === id
      );
      return hasInVariants || hasInDirect;
    });
  }, [id, products]);

  if (loadingItem) {
    return <LoadingState message="Memuat detail packaging..." className="min-h-[400px]" />;
  }

  if (!packaging) {
    return (
      <Card className="max-w-md mx-auto my-12 text-center p-8">
        <EmptyState
          icon={<Package className="w-10 h-10 text-slate-300 mx-auto" />}
          title="Packaging Tidak Ditemukan"
          description="Material packaging yang Anda cari tidak tersedia atau telah dihapus."
          action={
            <Link to="/inventory/packaging">
              <Button variant="primary" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Kembali ke Daftar
              </Button>
            </Link>
          }
        />
      </Card>
    );
  }

  const currentStock = Number(packaging.currentStock ?? 0);
  const minStock = Number(packaging.minimumStock ?? packaging.minStock ?? 0);
  const unitCost = Number(packaging.unitCost ?? packaging.costPrice ?? 0);
  const stockValue = currentStock * unitCost;
  const isLowStock = currentStock <= minStock;
  const unit = packaging.unit || 'pcs';

  const categoryName =
    typeof packaging.category === 'object' && packaging.category !== null
      ? (packaging.category as { name?: string }).name
      : packaging.categoryName || (typeof packaging.category === 'string' ? packaging.category : 'Umum');

  const skuCode = packaging.sku || packaging.code || '-';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/inventory/packaging')}
            className="p-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-slate-600 transition-colors shadow-xs cursor-pointer"
            title="Kembali ke Daftar Packaging"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                {packaging.name}
              </h1>
              <Badge variant="neutral">{categoryName}</Badge>
              <Badge
                variant={packaging.status === 'INACTIVE' ? 'neutral' : 'success'}
                dot
              >
                {packaging.status === 'INACTIVE' ? 'Nonaktif' : 'Aktif'}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-mono">
              SKU: <span className="font-semibold text-slate-700">{skuCode}</span>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
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
            leftIcon={<Edit2 className="w-4 h-4" />}
            onClick={() => navigate(`/inventory/packaging/${id}/edit`)}
          >
            Edit Packaging
          </Button>
        </div>
      </div>

      {/* 4 Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="CURRENT STOCK"
          value={currentStock.toLocaleString('id-ID')}
          unit={unit}
          icon={<Box className="w-5 h-5" />}
          theme={isLowStock ? 'amber' : 'teal'}
          statusBadge={
            currentStock === 0 ? (
              <Badge variant="danger" dot>Stok Habis</Badge>
            ) : isLowStock ? (
              <Badge variant="warning" dot>Stok Menipis</Badge>
            ) : (
              <Badge variant="success" dot>Stok Aman</Badge>
            )
          }
        />

        <KpiCard
          title="MINIMUM STOCK"
          value={minStock.toLocaleString('id-ID')}
          unit={unit}
          icon={<AlertTriangle className="w-5 h-5" />}
          theme="slate"
          subtitle="Batas peringatan stok"
        />

        <KpiCard
          title="UNIT COST"
          value={formatRupiah(unitCost)}
          unit={`/ ${unit}`}
          icon={<Layers className="w-5 h-5" />}
          theme="slate"
          subtitle="Estimasi HPP per satuan"
        />

        <KpiCard
          title="TOTAL NILAI STOK"
          value={formatRupiah(stockValue)}
          icon={<CheckCircle2 className="w-5 h-5" />}
          theme="emerald"
          subtitle={`${currentStock} ${unit} × ${formatRupiah(unitCost)}`}
        />
      </div>

      {/* Detail Tabs */}
      <Tabs
        activeTab={activeTab}
        onChange={setActiveTab}
        tabs={[
          {
            id: 'overview',
            label: 'Overview',
            icon: <Info className="w-4 h-4" />,
          },
          {
            id: 'movements',
            label: 'Riwayat Pergerakan Stok',
            icon: <History className="w-4 h-4" />,
            count: movements.length,
          },
          {
            id: 'linked-products',
            label: 'Produk Terkait (Menu)',
            icon: <Coffee className="w-4 h-4" />,
            count: linkedProducts.length,
          },
        ]}
      />

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Basic Information */}
          <div className="lg:col-span-2 space-y-6">
            <Card title="Informasi Dasar Material">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-xs">
                <div>
                  <span className="text-slate-400 font-medium block">Nama Packaging</span>
                  <span className="font-bold text-slate-800 text-sm mt-0.5 block">
                    {packaging.name}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 font-medium block">SKU / Kode</span>
                  <span className="font-mono font-semibold text-slate-700 mt-0.5 block">
                    {skuCode}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 font-medium block">Kategori</span>
                  <span className="font-semibold text-slate-700 mt-0.5 block">
                    {categoryName}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 font-medium block">Unit / Satuan</span>
                  <span className="font-semibold text-slate-700 mt-0.5 block">
                    {unit}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 font-medium block">Supplier Terkait</span>
                  <span className="font-semibold text-slate-700 mt-0.5 block">
                    {packaging.supplierName || 'PT. Global Packaging Solution'}
                  </span>
                </div>

                <div className="sm:col-span-2 pt-3 border-t border-slate-100">
                  <span className="text-slate-400 font-medium block">Deskripsi & Catatan Khusus</span>
                  <p className="text-slate-700 mt-1 leading-relaxed">
                    {packaging.description || 'Tidak ada deskripsi tambahan untuk material packaging ini.'}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column: Recent Activity Logs */}
          <div className="space-y-6">
            <Card title="Aktivitas Terbaru">
              {loadingMovements ? (
                <LoadingState message="Memuat aktivitas..." />
              ) : movements.length === 0 ? (
                <EmptyState
                  icon={<History className="w-8 h-8 opacity-30 mx-auto" />}
                  title="Belum ada riwayat stok"
                  description="Pergerakan stok packaging akan dicatat otomatis di sini."
                />
              ) : (
                <div className="space-y-3.5">
                  {movements.slice(0, 5).map((m) => {
                    const typeStr = (m.movementType || m.type || '') as string;
                    const refType = (m.referenceType || '') as string;
                    const refId = m.referenceId || '';

                    const normType = typeStr.toUpperCase();
                    const normRef = refType.toUpperCase();
                    const isIncoming =
                      m.direction === 'IN' ||
                      normType === 'IN' ||
                      normType === 'PURCHASE' ||
                      normType === 'PURCHASE_RECEIPT' ||
                      normType === 'INITIAL' ||
                      normType === 'TRANSFER_IN' ||
                      normType === 'ADJUSTMENT_IN' ||
                      normRef === 'PURCHASE' ||
                      refId.startsWith('PB-') ||
                      refId.startsWith('PO-');

                    return (
                      <div
                        key={m.id}
                        className="flex items-start justify-between p-2.5 rounded-xl bg-slate-50/80 border border-slate-100 text-xs"
                      >
                        <div className="flex items-start gap-2.5">
                          <div
                            className={`p-1.5 rounded-lg shrink-0 ${
                              isIncoming
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-rose-100 text-rose-700'
                            }`}
                          >
                            {isIncoming ? (
                              <ArrowDownLeft className="w-3.5 h-3.5" />
                            ) : (
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-slate-800 block">
                              {m.reason || (isIncoming ? 'Stock Masuk / Pembelian' : 'Pengurangan Pesanan POS')}
                            </span>
                            <span className="text-[11px] text-slate-400 mt-0.5 block font-mono">
                              {formatDateTime(m.movementDate || m.createdAt)}
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span
                            className={`font-bold ${
                              isIncoming ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            {isIncoming ? '+' : '-'}
                            {Math.abs(m.quantity)} {unit}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: RIWAYAT PERGERAKAN STOK */}
      {activeTab === 'movements' && (
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Tanggal & Waktu</th>
                  <th className="py-3.5 px-4">Tipe Pergerakan</th>
                  <th className="py-3.5 px-4">Arah</th>
                  <th className="py-3.5 px-4 text-right">Jumlah</th>
                  <th className="py-3.5 px-4">Referensi / Catatan</th>
                  <th className="py-3.5 px-4 text-right">Operator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loadingMovements ? (
                  <tr>
                    <td colSpan={6}>
                      <LoadingState message="Memuat riwayat pergerakan stok..." />
                    </td>
                  </tr>
                ) : movements.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <EmptyState
                        icon={<History className="w-8 h-8 opacity-30 mx-auto" />}
                        title="Belum ada riwayat pergerakan stok"
                        description="Seluruh penyesuaian, pembelian, dan pengurangan pesanan akan tercatat di tabel ini."
                      />
                    </td>
                  </tr>
                ) : (
                  movements.map((m) => {
                    const typeStr = (m.movementType || m.type || '') as string;
                    const refType = (m.referenceType || '') as string;
                    const refId = m.referenceId || '';

                    let refDisplay = m.referenceId || m.reason || m.notes || '-';
                    const orderMatch = m.notes?.match(/ORD-[A-Za-z0-9-]+/i);
                    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(refId);
                    if (orderMatch && (isUuid || !m.referenceId)) {
                      refDisplay = orderMatch[0];
                    }

                    const normType = typeStr.toUpperCase();
                    const normRef = refType.toUpperCase();
                    const isIncoming =
                      m.direction === 'IN' ||
                      normType === 'IN' ||
                      normType === 'PURCHASE' ||
                      normType === 'PURCHASE_RECEIPT' ||
                      normType === 'INITIAL' ||
                      normType === 'TRANSFER_IN' ||
                      normType === 'ADJUSTMENT_IN' ||
                      normRef === 'PURCHASE' ||
                      refDisplay.startsWith('PB-') ||
                      refDisplay.startsWith('PO-');

                    let label = isIncoming ? 'Masuk' : 'Keluar';
                    if (
                      normRef === 'STOCK_ADJUSTMENT' ||
                      normType === 'ADJUSTMENT_IN'
                    ) {
                      label = 'Penyesuaian Masuk';
                    } else if (
                      normRef === 'PURCHASE' ||
                      normType === 'PURCHASE_RECEIPT' ||
                      normType === 'PURCHASE' ||
                      refDisplay.startsWith('PB-') ||
                      refDisplay.startsWith('PO-')
                    ) {
                      label = 'Penerimaan PO';
                    } else if (
                      normRef === 'ORDER' ||
                      normType === 'SALE' ||
                      normType === 'ORDER_USAGE' ||
                      refDisplay.startsWith('ORD-')
                    ) {
                      label = 'Penjualan POS';
                    } else if (normRef === 'VOID' || normType === 'VOID') {
                      label = 'Void Pesanan';
                    } else if (normType === 'WASTE') {
                      label = 'Waste / Rusak';
                    } else if (
                      normRef === 'STOCK_ADJUSTMENT' ||
                      normType === 'ADJUSTMENT_OUT'
                    ) {
                      label = 'Penyesuaian Keluar';
                    }

                    return (
                      <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4 font-mono text-slate-700">
                          {formatDateTime(m.movementDate || m.createdAt)}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800">
                          {label}
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge variant={isIncoming ? 'success' : 'danger'}>
                            {isIncoming ? 'Masuk' : 'Keluar'}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold">
                          <span className={isIncoming ? 'text-emerald-600' : 'text-rose-600'}>
                            {isIncoming ? '+' : '-'}
                            {Math.abs(m.quantity)} {unit}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 font-mono">
                          {refDisplay}
                        </td>
                        <td className="py-3.5 px-4 text-right font-medium text-slate-700">
                          {m.createdBy || 'Kasir / Sistem'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 3: PRODUK TERKAIT */}
      {activeTab === 'linked-products' && (
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Nama Menu / Produk</th>
                  <th className="py-3.5 px-4">Kategori</th>
                  <th className="py-3.5 px-4 text-right">Harga Jual</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {linkedProducts.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <EmptyState
                        icon={<Coffee className="w-8 h-8 opacity-30 mx-auto" />}
                        title="Belum ada menu yang menggunakan packaging ini"
                        description="Packaging ini dapat dihubungkan ke resep atau BOM kemasan produk pada menu POS."
                      />
                    </td>
                  </tr>
                ) : (
                  linkedProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {p.name}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant="neutral">{p.categoryName || 'Menu'}</Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold text-slate-900">
                        {formatRupiah(p.price || 0)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <Badge variant={p.status === 'INACTIVE' ? 'neutral' : 'success'} dot>
                          {p.status === 'INACTIVE' ? 'Nonaktif' : 'Aktif'}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link to={`/products`}>
                          <Button variant="ghost" size="sm" className="text-[#0D5C53]">
                            Lihat Menu
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

