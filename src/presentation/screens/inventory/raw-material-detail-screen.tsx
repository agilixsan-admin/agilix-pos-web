import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import type { RawMaterial, StockMovement } from '@model/Inventory';
import { inventoryService } from '@domain/services/inventory-service';
import { httpClient } from '@domain/services/http-client';
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
  Loader2,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

export const RawMaterialDetailScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [material, setMaterial] = useState<RawMaterial | null>(null);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'recipes' | 'movements' | 'purchases'>('overview');

  const loadDetail = async () => {
    if (!id) return;
    setLoading(true);
    try {
      // 1. Load Raw Material Detail
      const data = await inventoryService.getRawMaterialById(id);
      setMaterial(data);

      // 2. Load Stock Movements for this item
      try {
        const moves = await inventoryService.getStockMovements({ itemId: id });
        setMovements(Array.isArray(moves) ? moves : []);
      } catch (err) {
        console.warn('Could not load movements:', err);
      }

      // 3. Load Purchases (PO) history if any
      try {
        const res = await httpClient.get('/purchases', { params: { itemId: id } });
        const poList = res.data?.items || res.data?.data || (Array.isArray(res.data) ? res.data : []);
        setPurchases(poList);
      } catch (err) {
        console.warn('Could not load purchases:', err);
      }
    } catch (err) {
      console.error('Failed to load raw material details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-[#0D5C53] mb-2" />
        <p className="text-xs font-medium">Memuat detail bahan baku...</p>
      </div>
    );
  }

  if (!material) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-md mx-auto my-8">
        <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-800">Bahan Baku Tidak Ditemukan</h3>
        <p className="text-xs text-slate-500 mt-1 mb-6">
          Bahan baku yang Anda cari tidak tersedia atau telah dihapus.
        </p>
        <Link
          to="/inventory/raw-materials"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#0D5C53] text-white rounded-xl text-xs font-semibold hover:bg-[#094740] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Daftar</span>
        </Link>
      </div>
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
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
                {categoryName}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold flex items-center gap-1 ${
                  material.status === 'INACTIVE'
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    material.status === 'INACTIVE' ? 'bg-rose-500' : 'bg-emerald-500'
                  }`}
                />
                {material.status === 'INACTIVE' ? 'Inactive' : 'Active'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-mono">
              SKU: <span className="text-slate-700 font-semibold">{skuCode}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to={`/inventory/raw-materials/${material.id}/edit`}
            className="flex items-center gap-2 px-4 py-2 bg-[#0D5C53] hover:bg-[#094740] text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Edit2 className="w-4 h-4" />
            <span>Edit Bahan Baku</span>
          </Link>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Current Stock */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Stok Saat Ini</span>
            <div className={`p-2 rounded-xl ${isLowStock ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-slate-900">
                {currentStock.toLocaleString('id-ID')}
              </span>
              <span className="text-xs font-semibold text-slate-500">{material.unit}</span>
            </div>
            <div className="mt-1 flex items-center gap-1.5">
              {isLowStock ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                  <AlertTriangle className="w-3 h-3" />
                  Di bawah batas minimum
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                  <CheckCircle2 className="w-3 h-3" />
                  Stok Aman
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 2. Minimum Stock */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Batas Stok Minimum</span>
            <div className="p-2 rounded-xl bg-slate-50 text-slate-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-slate-900">
                {minStock.toLocaleString('id-ID')}
              </span>
              <span className="text-xs font-semibold text-slate-500">{material.unit}</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Alert peringatan restock bahan</p>
          </div>
        </div>

        {/* 3. Unit Cost */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Unit Cost (HPP Satuan)</span>
            <div className="p-2 rounded-xl bg-teal-50 text-[#0D5C53]">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-[#0D5C53]">
                Rp {unitCost.toLocaleString('id-ID')}
              </span>
              <span className="text-xs font-semibold text-slate-500">/ {material.unit}</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Moving Average dari Purchase Order</p>
          </div>
        </div>

        {/* 4. Total Stock Value */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Nilai Stok</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-slate-900">
                Rp {stockValue.toLocaleString('id-ID')}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Stok saat ini × Unit Cost</p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-slate-200 flex items-center gap-8">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 text-xs font-bold transition-all relative cursor-pointer ${
            activeTab === 'overview'
              ? 'text-[#0D5C53] border-b-2 border-[#0D5C53]'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4" />
            <span>Overview & Spesifikasi</span>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('recipes')}
          className={`pb-3 text-xs font-bold transition-all relative cursor-pointer ${
            activeTab === 'recipes'
              ? 'text-[#0D5C53] border-b-2 border-[#0D5C53]'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <ChefHat className="w-4 h-4" />
            <span>Penggunaan Resep (BOM)</span>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('movements')}
          className={`pb-3 text-xs font-bold transition-all relative cursor-pointer ${
            activeTab === 'movements'
              ? 'text-[#0D5C53] border-b-2 border-[#0D5C53]'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <History className="w-4 h-4" />
            <span>Mutasi Stok ({movements.length})</span>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('purchases')}
          className={`pb-3 text-xs font-bold transition-all relative cursor-pointer ${
            activeTab === 'purchases'
              ? 'text-[#0D5C53] border-b-2 border-[#0D5C53]'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4" />
            <span>Riwayat Pembelian ({purchases.length})</span>
          </div>
        </button>
      </div>

      {/* Tab Contents */}
      {/* 1. Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
              Informasi Rinci Bahan Baku
            </h3>

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
          </div>

          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4">
                Analisis & Rekomendasi
              </h3>
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
            </div>
          </div>
        </div>
      )}

      {/* 2. Resep Penggunaan (BOM) */}
      {activeTab === 'recipes' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Produk & Menu yang Menggunakan Bahan Ini</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Daftar menu POS dan varian yang terhubung ke bahan baku ini (Bill of Materials).
              </p>
            </div>
          </div>

          <div className="p-8 text-center text-slate-400">
            <ChefHat className="w-10 h-10 mx-auto mb-2 opacity-30 text-[#0D5C53]" />
            <h4 className="font-semibold text-slate-700 text-xs">Integrasi Resep Menu</h4>
            <p className="text-[11px] text-slate-400 max-w-md mx-auto mt-1">
              Bahan baku ini secara otomatis dipotong saat pesanan menu yang memuatnya berhasil dibayar di POS Kasir.
            </p>
          </div>
        </div>
      )}

      {/* 3. Mutasi Stok */}
      {activeTab === 'movements' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Riwayat Mutasi & Pergerakan Stok</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Log kronologis keluar/masuk bahan baku akibat penjualan POS, PO masuk, maupun penyesuaian opname.
              </p>
            </div>
          </div>

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
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      <History className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="font-semibold text-slate-600">Belum ada riwayat mutasi stok</p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Mutasi akan tercatat otomatis saat ada transaksi penjualan, penyesuaian stok, atau pembelian.
                      </p>
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
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              isIncoming
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {isIncoming ? (
                              <ArrowDownLeft className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <ArrowUpRight className="w-3 h-3 text-rose-600" />
                            )}
                            {m.type || (isIncoming ? 'IN' : 'OUT')}
                          </span>
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
        </div>
      )}

      {/* 4. Riwayat Pembelian (PO) */}
      {activeTab === 'purchases' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Riwayat Pengadaan & Pembelian (Purchase Orders)</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Daftar faktur pembelian supplier yang memuat bahan baku ini.
              </p>
            </div>
          </div>

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
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="font-semibold text-slate-600">Belum ada riwayat pembelian</p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Riwayat pembelian dari supplier akan muncul saat Purchase Order diterima.
                      </p>
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
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {po.status || 'RECEIVED'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

