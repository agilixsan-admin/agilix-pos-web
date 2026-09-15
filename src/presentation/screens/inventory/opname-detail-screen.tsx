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
  Clock,
  User,
  Calendar,
  AlertCircle,
  Printer,
  PlayCircle,
  Store,
} from 'lucide-react';
import { useStockOpnameDetail } from '@domain/hooks';
import type { StockOpnameItem } from '@model/Inventory';
import {
  Card,
  Badge,
  Button,
  SearchInput,
  FormSelect,
  KpiCard,
  LoadingState,
  EmptyState,
} from '@presentation/components/ui';

export const OpnameDetailScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Queries
  const { data: opname, isLoading, error } = useStockOpnameDetail(id);

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'MATCH' | 'DIFFERENCE'>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'RAW_MATERIAL' | 'PACKAGING'>('ALL');

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

  // Status Badge
  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <Badge variant="success" dot>
            Finalized
          </Badge>
        );
      case 'IN_PROGRESS':
        return (
          <Badge variant="info" dot>
            Counting
          </Badge>
        );
      case 'CANCELLED':
        return (
          <Badge variant="danger" dot>
            Dibatalkan
          </Badge>
        );
      case 'DRAFT':
      default:
        return (
          <Badge variant="warning" dot>
            Draft
          </Badge>
        );
    }
  };

  // Filtered Items
  const filteredItems = useMemo(() => {
    if (!opname?.items) return [];

    return opname.items.filter((item) => {
      const isCounted = item.actualStock !== null && item.actualStock !== undefined;
      const actual = isCounted ? Number(item.actualStock) : null;
      const sys = Number(item.systemStock);
      const isDiff = actual !== null && actual !== sys;
      const isMatch = actual !== null && actual === sys;
      const itemType = item.inventoryItem?.itemType || 'RAW_MATERIAL';

      // Search
      const matchesSearch =
        !searchTerm ||
        item.inventoryItem?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.inventoryItem?.sku?.toLowerCase().includes(searchTerm.toLowerCase());

      // Type filter
      const matchesType =
        typeFilter === 'ALL' ||
        (typeFilter === 'RAW_MATERIAL' && itemType === 'RAW_MATERIAL') ||
        (typeFilter === 'PACKAGING' && itemType === 'PACKAGING');

      // Status filter
      let matchesStatus = true;
      if (statusFilter === 'MATCH') {
        matchesStatus = isMatch;
      } else if (statusFilter === 'DIFFERENCE') {
        matchesStatus = isDiff;
      }

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [opname?.items, searchTerm, typeFilter, statusFilter]);

  if (isLoading) {
    return (
      <div className="py-20">
        <LoadingState message="Memuat detail arsip stock opname..." />
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

  const isInProgress = opname.status === 'IN_PROGRESS' || opname.status === 'DRAFT';
  const totalItems = opname.totalItems || opname.items?.length || 0;
  const matchedItems = opname.matchedItems || 0;
  const diffItems = (opname.deficitItems || 0) + (opname.surplusItems || 0);
  const diffValue = Number(opname.totalDifferenceValue || 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/inventory/opname')}
            className="p-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-slate-600 transition-colors shadow-xs cursor-pointer"
            title="Kembali ke Daftar Opname"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Link to="/inventory/opname" className="hover:text-[#0D5C53]">
                Stock Opname
              </Link>
              <span>/</span>
              <span className="text-slate-800 font-semibold">Detail Sesi</span>
            </div>
            <div className="flex items-center gap-2.5 mt-0.5">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                {opname.opnameNumber}
              </h1>
              {getStatusBadge(opname.status)}
            </div>
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
              <span>Periode: {formatDate(opname.opnameDate)}</span>
              <span>•</span>
              <span className="inline-flex items-center gap-1 font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                <Store className="w-3 h-3 text-[#0D5C53]" />
                {opname.outlet?.name || 'Utama'}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {isInProgress ? (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<PlayCircle className="w-4 h-4" />}
              onClick={() => navigate(`/inventory/opname/${opname.id}/count`)}
            >
              Lanjut Hitung
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Printer className="w-4 h-4" />}
              onClick={() => window.print()}
            >
              Cetak Laporan
            </Button>
          )}
        </div>
      </div>

      {/* 4 KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="TOTAL ITEM"
          value={totalItems.toLocaleString('id-ID')}
          subtitle="Item dalam cakupan"
          icon={<Boxes className="w-5 h-5" />}
          theme="slate"
        />

        <KpiCard
          title="SESUAI"
          value={matchedItems.toLocaleString('id-ID')}
          subtitle="Stok fisik cocok"
          icon={<CheckCircle2 className="w-5 h-5" />}
          theme="emerald"
        />

        <KpiCard
          title="SELISIH"
          value={diffItems.toLocaleString('id-ID')}
          subtitle="Item selisih fisik"
          icon={<AlertTriangle className="w-5 h-5" />}
          theme={diffItems > 0 ? 'amber' : 'slate'}
          statusBadge={
            diffItems > 0 ? (
              <Badge variant="danger" size="sm">
                {diffItems} Item
              </Badge>
            ) : undefined
          }
        />

        <KpiCard
          title="TOTAL NILAI SELISIH"
          value={formatCurrency(diffValue)}
          subtitle="Valuasi selisih stok"
          icon={<ClipboardCheck className="w-5 h-5" />}
          theme={diffValue < 0 ? 'amber' : 'slate'}
        />
      </div>

      {/* Audit Meta Information Card */}
      <Card padding="sm" className="bg-white border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div className="space-y-1">
            <span className="text-slate-400 block font-medium">Dibuat Oleh</span>
            <div className="font-semibold text-slate-800 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" />
              {opname.creator?.name || 'Administrator'}
            </div>
            <span className="text-[11px] text-slate-400 block">
              {formatDateTime(opname.createdAt)}
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 block font-medium">Difinalisasi Oleh</span>
            <div className="font-semibold text-slate-800 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              {opname.finalizer?.name || (opname.status === 'COMPLETED' ? 'Petugas Gudang' : '-')}
            </div>
            <span className="text-[11px] text-slate-400 block">
              {formatDateTime(opname.finalizedAt)}
            </span>
          </div>

          <div className="md:col-span-2 space-y-1">
            <span className="text-slate-400 block font-medium">Catatan Sesi</span>
            <p className="text-slate-700 italic bg-slate-50 p-2.5 rounded-lg border border-slate-100 min-h-[38px]">
              {opname.notes || 'Tidak ada catatan tambahan untuk sesi ini.'}
            </p>
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
              placeholder="Cari item atau SKU..."
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
              <option value="ALL">Semua Status Hasil</option>
              <option value="MATCH">Sesuai (Match)</option>
              <option value="DIFFERENCE">Ada Selisih</option>
            </FormSelect>
          </div>
        </div>
      </Card>

      {/* Table of Items */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Item & SKU</th>
                <th className="py-3.5 px-4">Jenis</th>
                <th className="py-3.5 px-4 text-right">Stok Sistem</th>
                <th className="py-3.5 px-4 text-right">Stok Fisik</th>
                <th className="py-3.5 px-4 text-center">Selisih</th>
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
                      title="Tidak ada item yang sesuai"
                      description="Ubah kata kunci pencarian atau filter status."
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
                  const diffVal = diff * unitCost;
                  const itemType = item.inventoryItem?.itemType || 'RAW_MATERIAL';

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/60 transition-colors ${
                        isCounted && diff !== 0 ? 'bg-amber-50/20' : ''
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

                      {/* Difference */}
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

                      {/* Difference Value */}
                      <td className="py-3.5 px-4 text-right">
                        {actualStock === null || diff === 0 ? (
                          <span className="text-slate-400 font-mono text-xs">Rp 0</span>
                        ) : (
                          <span
                            className={`font-mono font-bold text-xs ${
                              diffVal > 0 ? 'text-blue-600' : 'text-rose-600'
                            }`}
                          >
                            {diffVal > 0
                              ? `+${formatCurrency(diffVal)}`
                              : formatCurrency(diffVal)}
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
    </div>
  );
};

