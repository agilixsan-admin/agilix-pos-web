import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  SlidersHorizontal,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Layers,
  Boxes,
  Clock,
  User,
  AlertCircle,
  CheckCircle2,
  FileText,
  Printer,
  ExternalLink,
  Building,
} from 'lucide-react';
import { useStockAdjustmentDetail } from '@domain/hooks';
import {
  Card,
  Badge,
  Button,
  LoadingState,
  EmptyState,
} from '@presentation/components/ui';

export const AdjustmentDetailScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: adjustment, isLoading, error } = useStockAdjustmentDetail(id);

  // Format Date & Time
  const formatDateTime = (dateString?: string | null) => {
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

  const formatDate = (dateString?: string | null) => {
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

  if (isLoading) {
    return (
      <div className="py-20">
        <LoadingState message="Memuat rincian stock adjustment..." />
      </div>
    );
  }

  if (error || !adjustment) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <EmptyState
          icon={<AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />}
          title="Adjustment Tidak Ditemukan"
          description="Data penyesuaian stok tidak ditemukan atau terjadi kendala jaringan."
          action={
            <Button variant="primary" onClick={() => navigate('/inventory/adjustments')}>
              Kembali ke Daftar Adjustment
            </Button>
          }
        />
      </div>
    );
  }

  const isIn = adjustment.type === 'IN';
  const item = adjustment.inventoryItem;
  const unit = item?.unit || 'unit';
  const prevStock = Number(adjustment.previousStock || 0);
  const curStock = Number(adjustment.currentStock || 0);
  const qty = Number(adjustment.quantity || 0);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-20">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/inventory/adjustments')}
            className="p-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-slate-600 transition-colors shadow-xs cursor-pointer"
            title="Kembali ke Daftar Adjustment"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Link to="/inventory/adjustments" className="hover:text-[#0D5C53]">
                Stock Adjustment
              </Link>
              <span>/</span>
              <span className="text-slate-800 font-semibold">Detail Penyesuaian</span>
            </div>
            <div className="flex items-center gap-2.5 mt-0.5">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                {adjustment.adjustmentNumber}
              </h1>
              <Badge variant="success" dot>
                {adjustment.status || 'COMPLETED'}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {formatDateTime(adjustment.adjustmentDate)} • Outlet: {adjustment.outlet?.name || 'Utama'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Printer className="w-4 h-4" />}
            onClick={() => window.print()}
          >
            Cetak Label / Bukti
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Item & Stock Changes (Matching Figma Screen 4) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Card 1: Informasi Item */}
          <Card
            header={
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">Informasi Item</h3>
                <Badge variant={item?.itemType === 'PACKAGING' ? 'info' : 'neutral'}>
                  {item?.itemType === 'PACKAGING' ? 'Packaging' : 'Bahan Baku'}
                </Badge>
              </div>
            }
          >
            <div className="space-y-6">
              <div>
                <div className="text-base font-bold text-slate-900">
                  {item?.name || 'Item'}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  {item?.sku && (
                    <span className="font-mono text-xs text-slate-500">
                      SKU: {item.sku}
                    </span>
                  )}
                  {item?.category && (
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                      {item.category.name}
                    </span>
                  )}
                </div>
              </div>

              {/* 3-Way Metric Box (Prev Stock -> Change -> New Stock) */}
              <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50/80 rounded-2xl border border-slate-200 text-center items-center">
                {/* Stok Sebelum */}
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 block uppercase tracking-wider">
                    Stok Sebelum
                  </span>
                  <span className="font-mono font-bold text-lg sm:text-xl text-slate-700 block mt-1">
                    {prevStock.toLocaleString('id-ID')}{' '}
                    <span className="text-xs text-slate-500 font-normal">{unit}</span>
                  </span>
                </div>

                {/* Perubahan (Highlight Box) */}
                <div
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center ${
                    isIn
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                    {isIn ? (
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    ) : (
                      <ArrowDownLeft className="w-3.5 h-3.5" />
                    )}
                    {isIn ? 'Masuk (+)' : 'Keluar (-)'}
                  </span>
                  <span className="font-mono font-bold text-lg sm:text-xl block mt-0.5">
                    {isIn ? `+${qty.toLocaleString('id-ID')}` : `-${qty.toLocaleString('id-ID')}`}
                  </span>
                </div>

                {/* Stok Sesudah */}
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 block uppercase tracking-wider">
                    Stok Sesudah
                  </span>
                  <span className="font-mono font-bold text-lg sm:text-xl text-slate-900 block mt-1">
                    {curStock.toLocaleString('id-ID')}{' '}
                    <span className="text-xs text-slate-500 font-normal">{unit}</span>
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Card 2: Link to Stock Movement */}
          <Card padding="sm" className="bg-slate-50/60 border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-[#0D5C53] shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-slate-900 block">
                    Tercatat di Stock Movement
                  </span>
                  <span className="text-slate-500 text-[11px]">
                    Referensi: {adjustment.adjustmentNumber} • Mutasi {adjustment.type}
                  </span>
                </div>
              </div>

              {item?.id && (
                <Link
                  to={`/inventory/stock/${item.id}`}
                  className="inline-flex items-center gap-1 text-[#0D5C53] font-semibold hover:underline"
                >
                  <span>Lihat Riwayat Stok</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Reasons & Audit Trail (Matching Figma Screen 4) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Alasan & Catatan */}
          <Card header={<h3 className="text-sm font-bold text-slate-900">Alasan & Catatan</h3>}>
            <div className="space-y-4 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Kategori Alasan</span>
                <div className="mt-1">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 text-xs font-semibold">
                    {adjustment.reasonCategory?.name || 'Manual Adjustment'}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block font-medium">Catatan Petugas</span>
                <p className="text-slate-700 italic bg-slate-50 p-2.5 rounded-xl border border-slate-100 mt-1 min-h-[44px]">
                  {adjustment.notes || 'Tidak ada catatan tambahan.'}
                </p>
              </div>

              {adjustment.imageUrl && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-slate-400 block font-medium mb-1.5">Foto Bukti Fisik</span>
                  <a
                    href={adjustment.imageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="block group relative overflow-hidden rounded-xl border border-slate-200"
                  >
                    <img
                      src={adjustment.imageUrl}
                      alt="Foto bukti adjustment"
                      className="w-full max-h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold">
                      Lihat Foto Penuh
                    </div>
                  </a>
                </div>
              )}
            </div>
          </Card>

          {/* Audit Trail */}
          <Card header={<h3 className="text-sm font-bold text-slate-900">Audit Trail</h3>}>
            <div className="space-y-3.5 text-xs">
              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-400 block font-medium">Waktu Transaksi</span>
                  <span className="font-semibold text-slate-800 block">
                    {formatDateTime(adjustment.createdAt)}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <User className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-400 block font-medium">Dibuat Oleh</span>
                  <span className="font-semibold text-slate-800 block">
                    {adjustment.creator?.name || 'Administrator'}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Building className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-400 block font-medium">Outlet</span>
                  <span className="font-semibold text-slate-800 block">
                    {adjustment.outlet?.name || 'Outlet Utama'}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <FileText className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-400 block font-medium">Sumber Entri</span>
                  <span className="font-semibold text-slate-800 block">
                    {adjustment.source === 'STOCK_OPNAME' ? 'Stock Opname' : 'Manual Entry'}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

