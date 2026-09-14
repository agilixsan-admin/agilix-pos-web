import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ClipboardCheck,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Boxes,
  Layers,
  ArrowRight,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import {
  useStockOpnameDetail,
  useFinalizeStockOpnameMutation,
} from '@domain/hooks';
import type { StockOpnameItem } from '@model/Inventory';
import {
  Card,
  Badge,
  Button,
  SearchInput,
  KpiCard,
  LoadingState,
  EmptyState,
  Modal,
} from '@presentation/components/ui';

export const OpnameReviewScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Queries & Mutations
  const { data: opname, isLoading, error } = useStockOpnameDetail(id);
  const finalizeMutation = useFinalizeStockOpnameMutation();

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'DIFFERENCE' | 'MATCH' | 'RAW_MATERIAL' | 'PACKAGING'>('ALL');
  const [isFinalizeModalOpen, setIsFinalizeModalOpen] = useState(false);
  const [finalNotes, setFinalNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

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

  // Format Currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // KPI Metrics Calculation
  const metrics = useMemo(() => {
    if (!opname?.items) {
      return {
        totalItems: 0,
        countedItems: 0,
        matchedItems: 0,
        differenceItems: 0,
        totalDifferenceValue: 0,
      };
    }

    const totalItems = opname.items.length;
    let countedItems = 0;
    let matchedItems = 0;
    let differenceItems = 0;
    let totalDifferenceValue = 0;

    opname.items.forEach((item) => {
      if (item.actualStock !== null && item.actualStock !== undefined) {
        countedItems++;
        const actual = Number(item.actualStock);
        const sys = Number(item.systemStock);
        const diff = actual - sys;
        const unitCost = Number(item.inventoryItem?.unitCost || 0);

        if (diff === 0) {
          matchedItems++;
        } else {
          differenceItems++;
          totalDifferenceValue += diff * unitCost;
        }
      }
    });

    return {
      totalItems,
      countedItems,
      matchedItems,
      differenceItems,
      totalDifferenceValue,
    };
  }, [opname?.items]);

  // Tab Item Counts for badge preview
  const tabCounts = useMemo(() => {
    if (!opname?.items) {
      return { all: 0, difference: 0, match: 0, rawMaterial: 0, packaging: 0 };
    }

    let difference = 0;
    let match = 0;
    let rawMaterial = 0;
    let packaging = 0;

    opname.items.forEach((item) => {
      const isCounted = item.actualStock !== null && item.actualStock !== undefined;
      const actual = isCounted ? Number(item.actualStock) : null;
      const sys = Number(item.systemStock);
      const isDiff = actual !== null && actual !== sys;
      const isMatch = actual !== null && actual === sys;
      const itemType = item.inventoryItem?.itemType || 'RAW_MATERIAL';

      if (isDiff) difference++;
      if (isMatch) match++;
      if (itemType === 'RAW_MATERIAL') rawMaterial++;
      if (itemType === 'PACKAGING') packaging++;
    });

    return {
      all: opname.items.length,
      difference,
      match,
      rawMaterial,
      packaging,
    };
  }, [opname?.items]);

  // Filtered Review Items
  const filteredItems = useMemo(() => {
    if (!opname?.items) return [];

    return opname.items.filter((item) => {
      // Search
      const matchesSearch =
        !searchTerm ||
        item.inventoryItem?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.inventoryItem?.sku?.toLowerCase().includes(searchTerm.toLowerCase());

      const isCounted = item.actualStock !== null && item.actualStock !== undefined;
      const actual = isCounted ? Number(item.actualStock) : null;
      const sys = Number(item.systemStock);
      const isDiff = actual !== null && actual !== sys;
      const isMatch = actual !== null && actual === sys;
      const itemType = item.inventoryItem?.itemType || 'RAW_MATERIAL';

      let matchesTab = true;
      if (activeTab === 'DIFFERENCE') {
        matchesTab = isDiff;
      } else if (activeTab === 'MATCH') {
        matchesTab = isMatch;
      } else if (activeTab === 'RAW_MATERIAL') {
        matchesTab = itemType === 'RAW_MATERIAL';
      } else if (activeTab === 'PACKAGING') {
        matchesTab = itemType === 'PACKAGING';
      }

      return matchesSearch && matchesTab;
    });
  }, [opname?.items, searchTerm, activeTab]);

  // Finalize Submission
  const handleFinalize = async () => {
    if (!id) return;
    try {
      setErrorMessage('');
      await finalizeMutation.mutateAsync({
        id,
        notes: finalNotes.trim() || undefined,
      });
      setIsFinalizeModalOpen(false);
      navigate(`/inventory/opname/${id}`);
    } catch (err: any) {
      setErrorMessage(
        err?.response?.data?.message || err?.message || 'Gagal melakukan finalisasi stock opname'
      );
    }
  };

  if (isLoading) {
    return (
      <div className="py-20">
        <LoadingState message="Menyiapkan ringkasan review stock opname..." />
      </div>
    );
  }

  if (error || !opname) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <EmptyState
          icon={<AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />}
          title="Sesi Tidak Ditemukan"
          description="Sesi stock opname tidak ditemukan atau terjadi kendala saat memuat data."
          action={
            <Button variant="primary" onClick={() => navigate('/inventory/opname')}>
              Kembali ke Daftar Opname
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-24">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(`/inventory/opname/${id}/count`)}
            className="p-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-slate-600 transition-colors shadow-xs cursor-pointer"
            title="Kembali ke Lembar Hitung"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Link to="/inventory/opname" className="hover:text-[#0D5C53]">
                Stock Opname
              </Link>
              <span>/</span>
              <span className="text-slate-800 font-semibold">Review & Rekonsiliasi</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight mt-0.5">
              Review Stock Opname
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {opname.opnameNumber} • Periode: {formatDate(opname.opnameDate)} • Outlet:{' '}
              {opname.outlet?.name || 'Utama'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/inventory/opname/${id}/count`)}
          >
            Kembali ke Perhitungan
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsFinalizeModalOpen(true)}
            rightIcon={<CheckCircle2 className="w-4 h-4" />}
          >
            Finalisasi Stock Opname
          </Button>
        </div>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 4 KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="TOTAL ITEM"
          value={metrics.totalItems.toLocaleString('id-ID')}
          subtitle="Cakupan item opname"
          icon={<Boxes className="w-5 h-5" />}
          theme="slate"
        />

        <KpiCard
          title="SUDAH DIHITUNG"
          value={metrics.countedItems.toLocaleString('id-ID')}
          subtitle={`Progress ${
            metrics.totalItems > 0
              ? Math.round((metrics.countedItems / metrics.totalItems) * 100)
              : 0
          }%`}
          icon={<ClipboardCheck className="w-5 h-5" />}
          theme="teal"
        />

        <KpiCard
          title="SESUAI"
          value={metrics.matchedItems.toLocaleString('id-ID')}
          subtitle="Stok riil = sistem"
          icon={<CheckCircle2 className="w-5 h-5" />}
          theme="emerald"
        />

        <KpiCard
          title="SELISIH"
          value={metrics.differenceItems.toLocaleString('id-ID')}
          subtitle={`Nilai: ${formatCurrency(metrics.totalDifferenceValue)}`}
          icon={<AlertTriangle className="w-5 h-5" />}
          theme={metrics.differenceItems > 0 ? 'amber' : 'slate'}
          statusBadge={
            metrics.differenceItems > 0 ? (
              <Badge variant="danger" size="sm" dot>
                Perlu Evaluasi
              </Badge>
            ) : undefined
          }
        />
      </div>

      {/* Tabs & Search Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          <button
            type="button"
            onClick={() => setActiveTab('ALL')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'ALL'
                ? 'bg-[#0D5C53] text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Semua ({tabCounts.all})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('DIFFERENCE')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'DIFFERENCE'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Ada Selisih ({tabCounts.difference})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('MATCH')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'MATCH'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Sesuai ({tabCounts.match})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('RAW_MATERIAL')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'RAW_MATERIAL'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Bahan Baku ({tabCounts.rawMaterial})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('PACKAGING')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'PACKAGING'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Packaging ({tabCounts.packaging})
          </button>
        </div>

        {/* Search */}
        <div className="w-full md:w-72">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            onClear={() => setSearchTerm('')}
            placeholder="Cari item atau SKU..."
          />
        </div>
      </div>

      {/* Review Table Card */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Item & SKU</th>
                <th className="py-3.5 px-4">Jenis</th>
                <th className="py-3.5 px-4 text-right">Stok Sistem</th>
                <th className="py-3.5 px-4 text-right">Stok Fisik</th>
                <th className="py-3.5 px-4 text-center">Selisih Kuantitas</th>
                <th className="py-3.5 px-4 text-right">Nilai Selisih</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4">Catatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <EmptyState
                      icon={<ClipboardCheck className="w-8 h-8 opacity-30 mx-auto text-[#0D5C53]" />}
                      title="Tidak ada item yang sesuai filter"
                      description="Ubah tab filter atau kata kunci pencarian."
                    />
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isCounted = item.actualStock !== null && item.actualStock !== undefined;
                  const sysStock = Number(item.systemStock);
                  const actualStock = isCounted ? Number(item.actualStock) : null;
                  const diff = actualStock !== null ? actualStock - sysStock : 0;
                  const unitCost = Number(item.inventoryItem?.unitCost || 0);
                  const diffValue = diff * unitCost;
                  const itemType = item.inventoryItem?.itemType || 'RAW_MATERIAL';

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/60 transition-colors ${
                        isCounted && diff !== 0 ? 'bg-amber-50/25' : ''
                      }`}
                    >
                      {/* Name & SKU */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 text-xs">
                          {item.inventoryItem?.name || 'Item'}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {item.inventoryItem?.sku && (
                            <span className="font-mono text-[11px] text-slate-500">
                              {item.inventoryItem.sku}
                            </span>
                          )}
                          {item.inventoryItem?.category && (
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                              {item.inventoryItem.category.name}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Jenis */}
                      <td className="py-3.5 px-4">
                        <Badge variant={itemType === 'PACKAGING' ? 'info' : 'neutral'}>
                          {itemType === 'PACKAGING' ? 'Packaging' : 'Bahan Baku'}
                        </Badge>
                      </td>

                      {/* System Stock */}
                      <td className="py-3.5 px-4 text-right">
                        <span className="font-mono font-semibold text-slate-700">
                          {sysStock.toLocaleString('id-ID')}
                        </span>{' '}
                        <span className="text-slate-400 text-[11px]">
                          {item.inventoryItem?.unit || 'unit'}
                        </span>
                      </td>

                      {/* Actual Stock */}
                      <td className="py-3.5 px-4 text-right">
                        {actualStock !== null ? (
                          <>
                            <span className="font-mono font-bold text-slate-900">
                              {actualStock.toLocaleString('id-ID')}
                            </span>{' '}
                            <span className="text-slate-500 text-[11px]">
                              {item.inventoryItem?.unit || 'unit'}
                            </span>
                          </>
                        ) : (
                          <span className="text-slate-400 font-mono">-</span>
                        )}
                      </td>

                      {/* Diff Quantity */}
                      <td className="py-3.5 px-4 text-center">
                        {actualStock === null ? (
                          <span className="text-slate-400 font-mono">-</span>
                        ) : diff === 0 ? (
                          <span className="font-mono font-semibold text-emerald-600">0</span>
                        ) : (
                          <span
                            className={`font-mono font-bold ${
                              diff > 0 ? 'text-blue-600' : 'text-rose-600'
                            }`}
                          >
                            {diff > 0 ? `+${diff.toLocaleString('id-ID')}` : diff.toLocaleString('id-ID')}{' '}
                            {item.inventoryItem?.unit || ''}
                          </span>
                        )}
                      </td>

                      {/* Diff Value */}
                      <td className="py-3.5 px-4 text-right">
                        {actualStock === null || diff === 0 ? (
                          <span className="text-slate-400 font-mono text-xs">Rp 0</span>
                        ) : (
                          <span
                            className={`font-mono font-bold text-xs ${
                              diffValue > 0 ? 'text-blue-600' : 'text-rose-600'
                            }`}
                          >
                            {diffValue > 0
                              ? `+${formatCurrency(diffValue)}`
                              : formatCurrency(diffValue)}
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        {actualStock === null ? (
                          <Badge variant="neutral" size="sm">
                            Belum Dihitung
                          </Badge>
                        ) : diff === 0 ? (
                          <Badge variant="success" size="sm" dot>
                            Sesuai
                          </Badge>
                        ) : (
                          <Badge variant="danger" size="sm">
                            Selisih
                          </Badge>
                        )}
                      </td>

                      {/* Notes */}
                      <td className="py-3.5 px-4 text-slate-500 text-[11px] max-w-[180px] truncate">
                        {item.notes || '-'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Confirmation & Finalize Modal */}
      <Modal
        isOpen={isFinalizeModalOpen}
        onClose={() => setIsFinalizeModalOpen(false)}
        title="Konfirmasi Finalisasi Stock Opname"
        maxWidth="lg"
      >
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Anda akan memfinalisasi sesi stock opname <strong>{opname.opnameNumber}</strong>.
              Setelah difinalisasi, hasil penghitungan dan rekonsiliasi akan dikunci secara permanen sebagai arsip audit.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
            <div>
              <span className="text-[11px] text-slate-500 block">Total Dihitung</span>
              <span className="font-bold text-slate-900 text-sm font-mono mt-0.5 block">
                {metrics.countedItems} / {metrics.totalItems}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">Item Sesuai</span>
              <span className="font-bold text-emerald-600 text-sm font-mono mt-0.5 block">
                {metrics.matchedItems}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">Item Selisih</span>
              <span className="font-bold text-rose-600 text-sm font-mono mt-0.5 block">
                {metrics.differenceItems}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Catatan Kesimpulan Finalisasi (Opsional)
            </label>
            <textarea
              rows={3}
              value={finalNotes}
              onChange={(e) => setFinalNotes(e.target.value)}
              placeholder="Contoh: Selisih pada item kemasan telah diverifikasi akibat kerusakan fisik..."
              className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-1 focus:ring-[#0D5C53] focus:border-[#0D5C53]"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsFinalizeModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              isLoading={finalizeMutation.isPending}
              onClick={handleFinalize}
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              Ya, Finalisasi Opname
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

