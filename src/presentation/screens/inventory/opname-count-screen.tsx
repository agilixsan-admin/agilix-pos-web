import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ClipboardCheck,
  Search,
  Save,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ArrowRight,
  AlertCircle,
  FileText,
  RotateCcw,
} from 'lucide-react';
import {
  useStockOpnameDetail,
  useUpdateStockOpnameCountsMutation,
  useCancelStockOpnameMutation,
} from '@domain/hooks';
import type { StockOpnameItem, StockOpnameItemStatus } from '@model/Inventory';
import {
  Card,
  Badge,
  Button,
  SearchInput,
  FormSelect,
  FormInput,
  LoadingState,
  EmptyState,
  Modal,
} from '@presentation/components/ui';

interface LocalItemCount {
  inventoryItemId: string;
  actualStock: string; // string for input control
  notes: string;
  isModified: boolean;
}

export const OpnameCountScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Queries & Mutations
  const { data: opname, isLoading, error } = useStockOpnameDetail(id);
  const updateCountsMutation = useUpdateStockOpnameCountsMutation();
  const cancelMutation = useCancelStockOpnameMutation();

  // Local Counting State
  const [countsMap, setCountsMap] = useState<Record<string, LocalItemCount>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'RAW_MATERIAL' | 'PACKAGING'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UNCOUNTED' | 'MATCH' | 'DIFFERENCE'>('ALL');

  // Cancel Modal State
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelNotes, setCancelNotes] = useState('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Initialize local counts state when opname detail is loaded
  useEffect(() => {
    if (opname?.items) {
      const initialMap: Record<string, LocalItemCount> = {};
      opname.items.forEach((item) => {
        initialMap[item.inventoryItemId] = {
          inventoryItemId: item.inventoryItemId,
          actualStock: item.actualStock !== null && item.actualStock !== undefined ? String(item.actualStock) : '',
          notes: item.notes || '',
          isModified: false,
        };
      });
      setCountsMap(initialMap);
    }
  }, [opname]);

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

  // Handle count change
  const handleCountChange = (itemId: string, val: string) => {
    setCountsMap((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        actualStock: val,
        isModified: true,
      },
    }));
  };

  // Handle note change
  const handleNoteChange = (itemId: string, val: string) => {
    setCountsMap((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        notes: val,
        isModified: true,
      },
    }));
  };

  // Filtered Items
  const filteredItems = useMemo(() => {
    if (!opname?.items) return [];

    return opname.items.filter((item) => {
      const currentCount = countsMap[item.inventoryItemId];
      const actualVal = currentCount?.actualStock !== '' && currentCount?.actualStock !== undefined
        ? Number(currentCount.actualStock)
        : null;

      // Text search
      const matchesSearch =
        !searchTerm ||
        item.inventoryItem?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.inventoryItem?.sku?.toLowerCase().includes(searchTerm.toLowerCase());

      // Type filter
      const itemType = item.inventoryItem?.itemType || 'RAW_MATERIAL';
      const matchesType =
        typeFilter === 'ALL' ||
        (typeFilter === 'RAW_MATERIAL' && itemType === 'RAW_MATERIAL') ||
        (typeFilter === 'PACKAGING' && itemType === 'PACKAGING');

      // Status filter (live calculated based on local input)
      let matchesStatus = true;
      if (statusFilter === 'UNCOUNTED') {
        matchesStatus = actualVal === null;
      } else if (statusFilter === 'MATCH') {
        matchesStatus = actualVal !== null && actualVal === Number(item.systemStock);
      } else if (statusFilter === 'DIFFERENCE') {
        matchesStatus = actualVal !== null && actualVal !== Number(item.systemStock);
      }

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [opname?.items, countsMap, searchTerm, typeFilter, statusFilter]);

  // Summary Metrics (live calculated)
  const metrics = useMemo(() => {
    if (!opname?.items) {
      return { total: 0, counted: 0, matched: 0, difference: 0, percentage: 0 };
    }

    const total = opname.items.length;
    let counted = 0;
    let matched = 0;
    let difference = 0;

    opname.items.forEach((item) => {
      const currentCount = countsMap[item.inventoryItemId];
      if (currentCount && currentCount.actualStock !== '' && currentCount.actualStock !== undefined) {
        counted++;
        const actual = Number(currentCount.actualStock);
        const sys = Number(item.systemStock);
        if (actual === sys) {
          matched++;
        } else {
          difference++;
        }
      }
    });

    const percentage = total > 0 ? Math.round((counted / total) * 100) : 0;
    return { total, counted, matched, difference, percentage };
  }, [opname?.items, countsMap]);

  // Save Progress
  const handleSaveProgress = async (): Promise<boolean> => {
    if (!id || !opname) return false;

    // Collect all items that have a defined count input
    const itemsToUpdate: { inventoryItemId: string; actualStock: number; notes?: string }[] = [];

    opname.items.forEach((item) => {
      const countData = countsMap[item.inventoryItemId];
      if (countData && countData.actualStock !== '' && countData.actualStock !== undefined) {
        itemsToUpdate.push({
          inventoryItemId: item.inventoryItemId,
          actualStock: Math.max(0, Number(countData.actualStock) || 0),
          notes: countData.notes ? countData.notes.trim() : undefined,
        });
      }
    });

    if (itemsToUpdate.length === 0) {
      setErrorMessage('Belum ada item yang diisi stok fisiknya.');
      return false;
    }

    try {
      setErrorMessage('');
      setSaveSuccessMsg('');
      await updateCountsMutation.mutateAsync({
        id,
        data: { items: itemsToUpdate },
      });
      setSaveSuccessMsg('Progres perhitungan fisik berhasil disimpan.');
      setTimeout(() => setSaveSuccessMsg(''), 3500);
      return true;
    } catch (err: any) {
      setErrorMessage(
        err?.response?.data?.message || err?.message || 'Gagal menyimpan progres stock opname'
      );
      return false;
    }
  };

  // Review & Finalisasi
  const handleProceedToReview = async () => {
    const success = await handleSaveProgress();
    if (success) {
      navigate(`/inventory/opname/${id}/review`);
    }
  };

  // Cancel Session
  const handleCancelSession = async () => {
    if (!id) return;
    try {
      setErrorMessage('');
      await cancelMutation.mutateAsync({
        id,
        notes: cancelNotes.trim() || undefined,
      });
      setIsCancelModalOpen(false);
      navigate('/inventory/opname');
    } catch (err: any) {
      setErrorMessage(
        err?.response?.data?.message || err?.message || 'Gagal membatalkan sesi stock opname'
      );
    }
  };

  if (isLoading) {
    return (
      <div className="py-20">
        <LoadingState message="Memuat lembar perhitungan stock opname..." />
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

  const isFinalized = opname.status === 'COMPLETED' || opname.status === 'CANCELLED';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-28">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/inventory/opname')}
            className="p-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-slate-600 transition-colors shadow-xs cursor-pointer"
            title="Kembali"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Link to="/inventory/opname" className="hover:text-[#0D5C53]">
                Stock Opname
              </Link>
              <span>/</span>
              <span className="text-slate-800 font-semibold">Perhitungan Fisik</span>
            </div>
            <div className="flex items-center gap-2.5 mt-0.5">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                {opname.opnameNumber}
              </h1>
              <Badge variant={isFinalized ? 'neutral' : 'info'} dot>
                {opname.status === 'COMPLETED'
                  ? 'Finalized'
                  : opname.status === 'CANCELLED'
                  ? 'Dibatalkan'
                  : 'Counting'}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Periode: {formatDate(opname.opnameDate)} • Outlet: {opname.outlet?.name || 'Utama'}
            </p>
          </div>
        </div>

        {!isFinalized && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-rose-600 border-rose-200 hover:bg-rose-50"
              leftIcon={<XCircle className="w-3.5 h-3.5" />}
              onClick={() => setIsCancelModalOpen(true)}
            >
              Batalkan Sesi
            </Button>
          </div>
        )}
      </div>

      {/* Alerts */}
      {saveSuccessMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Progress & Live Counting Summary Card */}
      <Card padding="md" className="bg-white">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Progress Bar Area */}
          <div className="lg:col-span-8 space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                  Progres Perhitungan
                </span>
                <span className="text-[11px] text-slate-500">
                  Hitung dan masukkan kuantitas fisik riil di gudang / outlet
                </span>
              </div>
              <div className="text-right">
                <span className="text-base font-bold text-slate-900 font-mono">
                  {metrics.counted} <span className="text-xs text-slate-400 font-sans">/ {metrics.total} item</span>
                </span>
                <span className="text-xs text-[#0D5C53] font-bold ml-2 font-mono">
                  ({metrics.percentage}%)
                </span>
              </div>
            </div>

            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="h-full rounded-full bg-[#0D5C53] transition-all duration-300"
                style={{ width: `${metrics.percentage}%` }}
              />
            </div>
          </div>

          {/* Sesuai & Selisih Counters */}
          <div className="lg:col-span-4 flex items-center gap-3">
            <div className="flex-1 p-3 rounded-xl bg-emerald-50/70 border border-emerald-100 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-emerald-700 block">Sesuai</span>
                <span className="text-lg font-bold text-emerald-800 font-mono">
                  {metrics.matched}
                </span>
              </div>
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            </div>

            <div className="flex-1 p-3 rounded-xl bg-rose-50/70 border border-rose-100 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-rose-700 block">Selisih</span>
                <span className="text-lg font-bold text-rose-800 font-mono">
                  {metrics.difference}
                </span>
              </div>
              <AlertTriangle className="w-5 h-5 text-rose-500" />
            </div>
          </div>
        </div>
      </Card>

      {/* Filter Bar */}
      <Card padding="sm" className="bg-white">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-center">
          <div className="lg:col-span-2">
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              onClear={() => setSearchTerm('')}
              placeholder="Cari nama item, SKU..."
            />
          </div>

          <div>
            <FormSelect
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
            >
              <option value="ALL">Semua Jenis Item</option>
              <option value="RAW_MATERIAL">Bahan Baku Saja</option>
              <option value="PACKAGING">Packaging Saja</option>
            </FormSelect>
          </div>

          <div>
            <FormSelect
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
            >
              <option value="ALL">Semua Status Hitung</option>
              <option value="UNCOUNTED">Belum Dihitung</option>
              <option value="MATCH">Sesuai (Match)</option>
              <option value="DIFFERENCE">Ada Selisih</option>
            </FormSelect>
          </div>
        </div>
      </Card>

      {/* Counting Table Card */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4 w-[28%]">Item & SKU</th>
                <th className="py-3.5 px-4 w-[12%]">Jenis</th>
                <th className="py-3.5 px-4 w-[15%] text-right">Sistem Stok</th>
                <th className="py-3.5 px-4 w-[18%] text-center">Stok Fisik (Riil)</th>
                <th className="py-3.5 px-4 w-[12%] text-center">Selisih</th>
                <th className="py-3.5 px-4 w-[15%]">Catatan Item</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyState
                      icon={<ClipboardCheck className="w-8 h-8 opacity-30 mx-auto text-[#0D5C53]" />}
                      title="Tidak ada item yang sesuai"
                      description="Ubah kata kunci pencarian atau filter status untuk menemukan item."
                    />
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const currentCount = countsMap[item.inventoryItemId] || {
                    inventoryItemId: item.inventoryItemId,
                    actualStock: '',
                    notes: '',
                    isModified: false,
                  };

                  const actualVal =
                    currentCount.actualStock !== '' && currentCount.actualStock !== undefined
                      ? Number(currentCount.actualStock)
                      : null;

                  const sysStock = Number(item.systemStock);
                  const isCounted = actualVal !== null;
                  const diff = isCounted ? actualVal - sysStock : 0;
                  const itemType = item.inventoryItem?.itemType || 'RAW_MATERIAL';

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/60 transition-colors ${
                        isCounted && diff !== 0 ? 'bg-amber-50/20' : ''
                      }`}
                    >
                      {/* Item info */}
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
                        <span className="font-mono font-bold text-slate-800 text-xs">
                          {sysStock.toLocaleString('id-ID')}
                        </span>{' '}
                        <span className="text-slate-500 text-[11px]">
                          {item.inventoryItem?.unit || 'unit'}
                        </span>
                      </td>

                      {/* Actual Stock Input */}
                      <td className="py-2.5 px-4">
                        <div className="flex items-center justify-center gap-1.5 max-w-[150px] mx-auto">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            disabled={isFinalized}
                            value={currentCount.actualStock}
                            onChange={(e) =>
                              handleCountChange(item.inventoryItemId, e.target.value)
                            }
                            placeholder="0"
                            className="w-full text-center px-2.5 py-1.5 text-xs font-mono font-bold border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/30 focus:border-[#0D5C53] bg-white transition-all"
                          />
                          <span className="text-[11px] text-slate-500 shrink-0 font-medium">
                            {item.inventoryItem?.unit || 'unit'}
                          </span>
                        </div>
                      </td>

                      {/* Difference */}
                      <td className="py-3.5 px-4 text-center">
                        {!isCounted ? (
                          <span className="text-slate-400 font-mono text-[11px]">Belum dihitung</span>
                        ) : diff === 0 ? (
                          <Badge variant="success" size="sm" dot>
                            Sesuai (0)
                          </Badge>
                        ) : (
                          <Badge variant="danger" size="sm">
                            {diff > 0 ? `+${diff.toLocaleString('id-ID')}` : diff.toLocaleString('id-ID')}
                          </Badge>
                        )}
                      </td>

                      {/* Notes */}
                      <td className="py-2.5 px-4">
                        <input
                          type="text"
                          disabled={isFinalized}
                          value={currentCount.notes}
                          onChange={(e) =>
                            handleNoteChange(item.inventoryItemId, e.target.value)
                          }
                          placeholder="Catatan item..."
                          className="w-full px-2.5 py-1.5 text-[11px] border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0D5C53] bg-white"
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Floating Bottom Action Bar */}
      {!isFinalized && (
        <div className="fixed bottom-0 left-0 right-0 z-20 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-xl py-3.5 px-6">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <span className="font-semibold text-slate-900">
                {metrics.counted} dari {metrics.total}
              </span>{' '}
              item terisi • Klik <strong>Review & Finalisasi</strong> saat verifikasi fisik selesai.
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                leftIcon={<Save className="w-4 h-4" />}
                onClick={handleSaveProgress}
                isLoading={updateCountsMutation.isPending}
              >
                Simpan Progres
              </Button>

              <Button
                type="button"
                variant="primary"
                size="sm"
                rightIcon={<ArrowRight className="w-4 h-4" />}
                onClick={handleProceedToReview}
                isLoading={updateCountsMutation.isPending}
              >
                Review & Finalisasi
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        title="Batalkan Sesi Stock Opname"
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Apakah Anda yakin ingin membatalkan sesi stock opname <strong>{opname.opnameNumber}</strong>?
              Sesi yang dibatalkan tidak dapat dilanjutkan kembali.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Alasan Pembatalan (Opsional)
            </label>
            <textarea
              rows={3}
              value={cancelNotes}
              onChange={(e) => setCancelNotes(e.target.value)}
              placeholder="Contoh: Kesalahan pemilihan cakupan kategori item..."
              className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-1 focus:ring-rose-500 focus:border-rose-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCancelModalOpen(false)}
            >
              Kembali
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              isLoading={cancelMutation.isPending}
              onClick={handleCancelSession}
            >
              Konfirmasi Batalkan
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
