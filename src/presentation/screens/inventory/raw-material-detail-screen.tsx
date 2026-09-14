import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  useRawMaterialDetail,
  useStockMovements,
} from '@domain/hooks';
import {
  ArrowLeft,
  Edit2,
  Package,
  Layers,
  AlertTriangle,
  History,
  ShoppingCart,
  ChefHat,
  Info,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
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

export const RawMaterialDetailScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Query Hooks
  const { data: material = null, isLoading: loading } = useRawMaterialDetail(id);
  const { data: movements = [] } = useStockMovements({ itemId: id });
  const [activeTab, setActiveTab] = useState<string>('overview');
  const purchases: any[] = [];

  if (loading) {
    return <LoadingState message="Memuat detail bahan baku..." className="min-h-[400px]" />;
  }

  if (!material) {
    return (
      <Card className="max-w-md mx-auto my-8 text-center p-8">
        <EmptyState
          icon={<Package className="w-10 h-10 text-slate-300 mx-auto" />}
          title="Bahan Baku Tidak Ditemukan"
          description="Bahan baku yang Anda cari tidak tersedia atau telah dihapus."
          action={
            <Link to="/inventory/raw-materials">
              <Button variant="primary" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Kembali ke Daftar
              </Button>
            </Link>
          }
        />
      </Card>
    );
  }

  const currentStock = Number(material.currentStock ?? 0);
  const minStock = Number(material.minimumStock ?? material.minStock ?? 0);
  const unitCost = Number(material.unitCost ?? material.costPrice ?? 0);
  const stockValue = currentStock * unitCost;
  const isLowStock = currentStock <= minStock;

  const categoryName =
    typeof material.category === 'object' && material.category !== null
      ? (material.category as { name?: string }).name
      : material.categoryName || (typeof material.category === 'string' ? material.category : 'Umum');

  const skuCode = material.sku || material.code || '-';

  return (
    <div className="space-y-6 max-w-6xl pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/inventory/raw-materials')}
            className="p-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-slate-600 transition-colors shadow-xs cursor-pointer"
            title="Kembali ke Daftar"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">{material.name}</h1>
              <Badge variant="neutral">{categoryName}</Badge>
              <Badge
                variant={material.status === 'INACTIVE' ? 'danger' : 'success'}
                dot
              >
                {material.status === 'INACTIVE' ? 'Inactive' : 'Active'}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-mono">
              SKU: <span className="text-slate-700 font-semibold">{skuCode}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link to={`/inventory/raw-materials/${material.id}/edit`}>
            <Button
              variant="primary"
              leftIcon={<Edit2 className="w-4 h-4" />}
            >
              Edit Bahan Baku
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 Reusable KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Stok Saat Ini"
          value={currentStock.toLocaleString('id-ID')}
          unit={material.unit}
          icon={<Package className="w-4 h-4" />}
          theme={isLowStock ? 'amber' : 'emerald'}
          statusBadge={
            isLowStock ? (
              <Badge variant="warning" dot>
                Di bawah batas minimum
              </Badge>
            ) : (
              <Badge variant="success" dot>
                Stok Aman
              </Badge>
            )
          }
        />

        <KpiCard
          title="Batas Stok Minimum"
          value={minStock.toLocaleString('id-ID')}
          unit={material.unit}
          icon={<AlertTriangle className="w-4 h-4" />}
          theme="slate"
          subtitle="Alert peringatan restock bahan"
        />

        <KpiCard
          title="Unit Cost (HPP Satuan)"
          value={`Rp ${unitCost.toLocaleString('id-ID')}`}
          unit={`/ ${material.unit}`}
          icon={<Layers className="w-4 h-4" />}
          theme="teal"
          subtitle="Moving Average dari Purchase Order"
        />

        <KpiCard
          title="Total Nilai Stok"
          value={`Rp ${stockValue.toLocaleString('id-ID')}`}
          icon={<ShoppingCart className="w-4 h-4" />}
          theme="indigo"
          subtitle="Stok saat ini × Unit Cost"
        />
      </div>

      {/* Reusable Tabs Navigation */}
      <Tabs
        activeTab={activeTab}
        onChange={setActiveTab}
        tabs={[
          {
            id: 'overview',
            label: 'Overview & Spesifikasi',
            icon: <Info className="w-4 h-4" />,
          },
          {
            id: 'recipes',
            label: 'Penggunaan Resep (BOM)',
            icon: <ChefHat className="w-4 h-4" />,
          },
          {
            id: 'movements',
            label: 'Mutasi Stok',
            icon: <History className="w-4 h-4" />,
            count: movements.length,
          },
          {
            id: 'purchases',
            label: 'Riwayat Pembelian',
            icon: <ShoppingCart className="w-4 h-4" />,
            count: purchases.length,
          },
        ]}
      />

      {/* Tab Contents */}
      {/* 1. Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card
            className="md:col-span-2 space-y-6"
            header={
              <h3 className="text-sm font-bold text-slate-900">
                Informasi Rinci Bahan Baku
              </h3>
            }
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block mb-1">Nama Bahan Baku</span>
                <span className="font-bold text-slate-800 text-sm">{material.name}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-1">SKU / Kode Sistem</span>
                <span className="font-mono font-semibold text-slate-800">{skuCode}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-1">Kategori Inventori</span>
                <span className="font-semibold text-slate-800">{categoryName}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-1">Satuan Dasar (Base Unit)</span>
                <span className="font-semibold text-slate-800">{material.unit}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-1">Status Operasional</span>
                <span className="font-semibold text-slate-800">
                  {material.status === 'INACTIVE' ? 'Nonaktif' : 'Aktif'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-1">Terakhir Diperbarui</span>
                <span className="text-slate-600">
                  {material.updatedAt
                    ? new Date(material.updatedAt).toLocaleString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '-'}
                </span>
              </div>
            </div>

            <div>
              <span className="text-slate-400 text-xs block mb-1">Deskripsi / Catatan Tambahan</span>
              <p className="text-xs text-slate-700 bg-slate-50 border border-slate-100 rounded-xl p-3 leading-relaxed">
                {material.description || 'Tidak ada deskripsi tambahan untuk bahan baku ini.'}
              </p>
            </div>
          </Card>

          <div className="space-y-6">
            <Card
              header={
                <h3 className="text-sm font-bold text-slate-900">
                  Analisis & Rekomendasi
                </h3>
              }
            >
              <div className="space-y-4 text-xs">
                <div className="p-3 bg-teal-50/70 border border-teal-100 rounded-xl">
                  <div className="flex items-center gap-2 text-[#0D5C53] font-bold mb-1">
                    <Info className="w-4 h-4" />
                    <span>Perhitungan HPP / Resep</span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Setiap menu atau varian yang menggunakan bahan baku ini akan mengalikan takaran resep dengan harga satuan rata-rata <strong>Rp {unitCost.toLocaleString('id-ID')} / {material.unit}</strong>.
                  </p>
                </div>

                {isLowStock ? (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                    <div className="flex items-center gap-2 text-amber-800 font-bold mb-1">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span>Perlu Pengadaan Ulang (Restock)</span>
                    </div>
                    <p className="text-amber-700 text-[11px] leading-relaxed">
                      Stok saat ini ({currentStock.toLocaleString('id-ID')} {material.unit}) berada di bawah atau sama dengan batas aman ({minStock.toLocaleString('id-ID')} {material.unit}).
                    </p>
                  </div>
                ) : (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <div className="flex items-center gap-2 text-emerald-800 font-bold mb-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Kondisi Stok Optimal</span>
                    </div>
                    <p className="text-emerald-700 text-[11px] leading-relaxed">
                      Ketersediaan bahan baku mencukupi untuk operasional harian.
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* 2. Resep Penggunaan (BOM) */}
      {activeTab === 'recipes' && (
        <Card
          padding="none"
          header={
            <div>
              <h3 className="text-sm font-bold text-slate-900">Produk & Menu yang Menggunakan Bahan Ini</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Daftar menu POS dan varian yang terhubung ke bahan baku ini (Bill of Materials).
              </p>
            </div>
          }
        >
          <EmptyState
            icon={<ChefHat className="w-10 h-10 mx-auto opacity-30 text-[#0D5C53]" />}
            title="Integrasi Resep Menu"
            description="Bahan baku ini secara otomatis dipotong saat pesanan menu yang memuatnya berhasil dibayar di POS Kasir."
          />
        </Card>
      )}

      {/* 3. Mutasi Stok */}
      {activeTab === 'movements' && (
        <Card
          padding="none"
          header={
            <div>
              <h3 className="text-sm font-bold text-slate-900">Riwayat Mutasi & Pergerakan Stok</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Log kronologis keluar/masuk bahan baku akibat penjualan POS, PO masuk, maupun penyesuaian opname.
              </p>
            </div>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Tanggal / Waktu</th>
                  <th className="py-3 px-4">Tipe Mutasi</th>
                  <th className="py-3 px-4 text-right">Jumlah</th>
                  <th className="py-3 px-4">Referensi / Alasan</th>
                  <th className="py-3 px-4">Dicatat Oleh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {movements.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <EmptyState
                        icon={<History className="w-8 h-8 mx-auto opacity-30" />}
                        title="Belum ada riwayat mutasi stok"
                        description="Mutasi akan tercatat otomatis saat ada transaksi penjualan, penyesuaian stok, atau pembelian."
                      />
                    </td>
                  </tr>
                ) : (
                  movements.map((m) => {
                    const isIncoming = m.direction === 'IN' || m.quantity > 0;
                    return (
                      <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                          {new Date(m.createdAt).toLocaleString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-3 px-4">
                          <Badge
                            variant={isIncoming ? 'success' : 'danger'}
                          >
                            {isIncoming ? (
                              <ArrowDownLeft className="w-3 h-3 text-emerald-600 mr-1" />
                            ) : (
                              <ArrowUpRight className="w-3 h-3 text-rose-600 mr-1" />
                            )}
                            {m.type || (isIncoming ? 'IN' : 'OUT')}
                          </Badge>
                        </td>
                        <td className={`py-3 px-4 text-right font-bold ${isIncoming ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {isIncoming ? '+' : '-'} {Math.abs(m.quantity).toLocaleString('id-ID')} {material.unit}
                        </td>
                        <td className="py-3 px-4 text-slate-700">
                          {m.notes || m.reason || m.referenceId || '-'}
                        </td>
                        <td className="py-3 px-4 text-slate-500 text-[11px]">
                          {m.createdBy || 'Sistem'}
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

      {/* 4. Riwayat Pembelian (PO) */}
      {activeTab === 'purchases' && (
        <Card
          padding="none"
          header={
            <div>
              <h3 className="text-sm font-bold text-slate-900">Riwayat Pengadaan & Pembelian (Purchase Orders)</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Daftar faktur pembelian supplier yang memuat bahan baku ini.
              </p>
            </div>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">No. PO / Faktur</th>
                  <th className="py-3 px-4">Tanggal Pembelian</th>
                  <th className="py-3 px-4">Supplier</th>
                  <th className="py-3 px-4 text-right">Qty Diterima</th>
                  <th className="py-3 px-4 text-right">Harga Beli / Satuan</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {purchases.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <EmptyState
                        icon={<ShoppingCart className="w-8 h-8 mx-auto opacity-30" />}
                        title="Belum ada riwayat pembelian"
                        description="Riwayat pembelian dari supplier akan muncul saat Purchase Order diterima."
                      />
                    </td>
                  </tr>
                ) : (
                  purchases.map((po) => (
                    <tr key={po.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                        {po.purchaseNumber || po.invoiceNumber || po.id.slice(0, 8)}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {po.purchaseDate || po.createdAt
                          ? new Date(po.purchaseDate || po.createdAt).toLocaleDateString('id-ID')
                          : '-'}
                      </td>
                      <td className="py-3 px-4 text-slate-800 font-medium">
                        {po.supplierName || po.supplier?.name || '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-slate-900">
                        {po.quantity ? `${Number(po.quantity).toLocaleString('id-ID')} ${material.unit}` : '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-[#0D5C53]">
                        {po.unitPrice ? `Rp ${Number(po.unitPrice).toLocaleString('id-ID')}` : '-'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant="success">
                          {po.status || 'RECEIVED'}
                        </Badge>
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
