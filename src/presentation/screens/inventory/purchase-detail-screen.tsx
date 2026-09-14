import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Building2,
  Calendar,
  User,
  Store,
  PackageCheck,
  FileText,
  Boxes,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  usePurchaseDetail,
  useDeletePurchaseMutation,
  useReceivePurchaseMutation,
} from '@domain/hooks';
import type { PurchaseStatus } from '@model/Inventory';
import {
  Card,
  Button,
  Badge,
  Modal,
  FormInput,
  FormTextarea,
  EmptyState,
  LoadingState,
} from '@presentation/components/ui';

export const PurchaseDetailScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Queries & Mutations
  const { data: purchase, isLoading, refetch } = usePurchaseDetail(id);
  const deleteMutation = useDeletePurchaseMutation();
  const receiveMutation = useReceivePurchaseMutation();

  // Receive Modal State
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [receiveItems, setReceiveItems] = useState<{ itemId: string; quantityReceived: number }[]>([]);
  const [receiveNotes, setReceiveNotes] = useState<string>('');
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);

  // Format Currency
  const formatRupiah = (val: number) => {
    return `Rp ${new Intl.NumberFormat('id-ID').format(val)}`;
  };

  // Format Date Time
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

  const getStatusBadge = (status: PurchaseStatus | string) => {
    switch (status) {
      case 'RECEIVED':
        return (
          <Badge variant="success" dot>
            Diterima
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

  // Open Receive Modal and initialize items
  const handleOpenReceiveModal = () => {
    if (!purchase) return;
    setReceiveItems(
      purchase.items.map((item) => ({
        itemId: item.id,
        quantityReceived: Number(item.quantityOrdered),
      }))
    );
    setReceiveNotes(purchase.notes || '');
    setIsReceiveModalOpen(true);
  };

  // Handle Qty Received changes inside Receive Modal
  const handleQtyReceivedChange = (itemId: string, qty: number) => {
    setReceiveItems((prev) =>
      prev.map((item) => (item.itemId === itemId ? { ...item, quantityReceived: qty } : item))
    );
  };

  // Submit Receive Purchase
  const handleConfirmReceive = async () => {
    if (!id) return;
    try {
      await receiveMutation.mutateAsync({
        id,
        data: {
          items: receiveItems,
          notes: receiveNotes.trim() || undefined,
        },
      });
      setIsReceiveModalOpen(false);
      refetch();
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Gagal menerima pesanan');
    }
  };

  // Cancel / Delete Draft
  const handleConfirmCancel = async () => {
    if (!id) return;
    try {
      await deleteMutation.mutateAsync(id);
      setIsCancelConfirmOpen(false);
      navigate('/inventory/purchases');
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Gagal membatalkan pembelian');
    }
  };

  if (isLoading) {
    return <LoadingState message="Memuat detail pembelian..." className="min-h-[400px]" />;
  }

  if (!purchase) {
    return (
      <Card className="max-w-md mx-auto my-12 text-center p-8">
        <EmptyState
          icon={<FileText className="w-10 h-10 text-slate-300 mx-auto" />}
          title="Pembelian Tidak Ditemukan"
          description="Data transaksi pembelian yang Anda cari tidak tersedia atau telah dihapus."
          action={
            <Link to="/inventory/purchases">
              <Button variant="primary" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Kembali ke Daftar Pembelian
              </Button>
            </Link>
          }
        />
      </Card>
    );
  }

  const isDraft = purchase.status === 'DRAFT';
  const isReceived = purchase.status === 'RECEIVED';
  const totalAmount = Number(purchase.totalAmount ?? purchase.subtotal ?? 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/inventory/purchases')}
            className="p-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-slate-600 transition-colors shadow-xs cursor-pointer"
            title="Kembali ke Daftar Pembelian"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Link to="/inventory/purchases" className="hover:text-[#0D5C53]">
                Pembelian
              </Link>
              <span>/</span>
              <span className="text-slate-800 font-semibold">{purchase.purchaseNumber}</span>
            </div>
            <div className="flex items-center gap-2.5 mt-0.5">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                {purchase.purchaseNumber}
              </h1>
              {getStatusBadge(purchase.status)}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          {isDraft && (
            <>
              <Button
                variant="outline"
                leftIcon={<Trash2 className="w-4 h-4 text-rose-500" />}
                onClick={() => setIsCancelConfirmOpen(true)}
                className="text-rose-600 hover:bg-rose-50 hover:border-rose-200"
              >
                Batalkan
              </Button>

              <Button
                variant="outline"
                leftIcon={<Edit2 className="w-4 h-4" />}
                onClick={() => navigate(`/inventory/purchases/${id}/edit`)}
              >
                Edit
              </Button>

              <Button
                variant="primary"
                leftIcon={<PackageCheck className="w-4 h-4" />}
                onClick={handleOpenReceiveModal}
              >
                Terima Barang
              </Button>
            </>
          )}

          {isReceived && (
            <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-200 font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Stok & HPP Telah Terupdate</span>
            </div>
          )}
        </div>
      </div>

      {/* Status Notice Banner */}
      {isDraft && (
        <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-xs text-amber-900 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold text-amber-800 block text-sm">
              Pembelian ini belum diterima (stok belum bertambah)
            </span>
            <p className="mt-0.5 text-amber-700">
              Periksa kelengkapan pesanan Anda. Klik tombol{' '}
              <strong className="text-amber-900">"Terima Barang"</strong> untuk memverifikasi
              kuantitas aktual yang diterima dari supplier. Stok dan Moving Average Unit Cost akan
              diperbarui otomatis setelah diterima.
            </p>
          </div>
        </div>
      )}

      {isReceived && (
        <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 text-xs text-emerald-900 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold text-emerald-800 block text-sm">
              Pembelian Selesai Diterima
            </span>
            <p className="mt-0.5 text-emerald-700">
              Barang telah diterima pada{' '}
              <strong>{formatDateTime(purchase.receivedAt)}</strong> oleh{' '}
              <strong>{purchase.receiver?.name || 'Petugas'}</strong>. Stok gudang dan nilai HPP
              barang telah bertambah secara otomatis ke sistem.
            </p>
          </div>
        </div>
      )}

      {/* Main Grid: Informasi & Ringkasan */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Basic Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card header={<h3 className="text-sm font-bold text-slate-900">Informasi Pembelian</h3>}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-xs">
              <div>
                <span className="text-slate-400 font-medium block">No. Pembelian (PO)</span>
                <span className="font-mono font-bold text-slate-800 text-sm mt-0.5 block">
                  {purchase.purchaseNumber}
                </span>
              </div>

              <div>
                <span className="text-slate-400 font-medium block">Tanggal Pembelian</span>
                <span className="font-semibold text-slate-700 mt-0.5 block">
                  {formatDate(purchase.purchaseDate)}
                </span>
              </div>

              <div>
                <span className="text-slate-400 font-medium block">Supplier</span>
                <div className="mt-0.5">
                  <span className="font-bold text-slate-800 text-sm block">
                    {purchase.supplier?.name || '-'}
                  </span>
                  {purchase.supplier?.phone && (
                    <span className="text-slate-500 font-mono text-[11px] block">
                      {purchase.supplier.phone}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <span className="text-slate-400 font-medium block">Outlet Tujuan</span>
                <span className="font-semibold text-slate-700 mt-0.5 block">
                  {purchase.outlet?.name || 'Outlet Utama'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 font-medium block">Dibuat Oleh</span>
                <span className="font-semibold text-slate-700 mt-0.5 block">
                  {purchase.creator?.name || 'Sistem / Administrator'}
                </span>
              </div>

              {isReceived && (
                <div>
                  <span className="text-slate-400 font-medium block">Diterima Oleh</span>
                  <span className="font-semibold text-emerald-700 mt-0.5 block">
                    {purchase.receiver?.name || 'Petugas'} ({formatDateTime(purchase.receivedAt)})
                  </span>
                </div>
              )}

              <div className="sm:col-span-2 pt-3 border-t border-slate-100">
                <span className="text-slate-400 font-medium block">Catatan Pembelian</span>
                <p className="text-slate-700 mt-1 leading-relaxed">
                  {purchase.notes || 'Tidak ada catatan tambahan untuk pembelian ini.'}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Ringkasan Pembayaran */}
        <div className="space-y-6">
          <Card header={<h3 className="text-sm font-bold text-slate-900">Ringkasan Pembayaran</h3>}>
            <div className="space-y-3.5 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>Total Item</span>
                <span className="font-bold text-slate-800">
                  {purchase.totalItems ?? purchase.items?.length ?? 0} item
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-800 font-mono">
                  {formatRupiah(purchase.subtotal ?? totalAmount)}
                </span>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm">Grand Total</span>
                <span className="font-bold text-lg text-[#0D5C53] font-mono">
                  {formatRupiah(totalAmount)}
                </span>
              </div>

              <div className="pt-2">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Status Pembelian:</span>
                  {getStatusBadge(purchase.status)}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Bottom Card: Daftar Item */}
      <Card header={<h3 className="text-sm font-bold text-slate-900">Daftar Item Pembelian</h3>} padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4 w-32">Tipe</th>
                <th className="py-3.5 px-4">Item</th>
                <th className="py-3.5 px-4 text-center">Qty Pesanan</th>
                {isReceived && <th className="py-3.5 px-4 text-center">Qty Diterima</th>}
                <th className="py-3.5 px-4 text-right">Unit Cost (HPP)</th>
                <th className="py-3.5 px-4 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {purchase.items?.map((item) => {
                const itemType =
                  item.inventoryItem?.itemType === 'PACKAGING' ? 'Packaging' : 'Bahan Baku';
                const itemName = item.inventoryItem?.name || 'Item Material';
                const sku = item.inventoryItem?.sku || '-';
                const unit = item.inventoryItem?.unit || 'pcs';
                const qtyOrdered = Number(item.quantityOrdered);
                const qtyReceived = Number(item.quantityReceived);
                const unitCost = Number(item.unitCost);
                const subtotal = Number(item.subtotal);

                return (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <Badge variant={itemType === 'Packaging' ? 'info' : 'neutral'}>
                        {itemType}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900 text-sm block">{itemName}</span>
                      <span className="text-[11px] text-slate-400 font-mono">SKU: {sku}</span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                      {qtyOrdered} {unit}
                    </td>
                    {isReceived && (
                      <td className="py-3.5 px-4 text-center font-bold text-emerald-600">
                        {qtyReceived} {unit}
                      </td>
                    )}
                    <td className="py-3.5 px-4 text-right font-semibold text-slate-800 font-mono">
                      {formatRupiah(unitCost)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900 font-mono">
                      {formatRupiah(subtotal)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* MODAL: Review & Terima Pembelian */}
      <Modal
        isOpen={isReceiveModalOpen}
        onClose={() => setIsReceiveModalOpen(false)}
        title="Review & Terima Pembelian"
        maxWidth="lg"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 flex items-start gap-2.5">
            <Sparkles className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-bold text-blue-800 block">
                Periksa Kuantitas Fisik yang Diterima
              </span>
              <p className="mt-0.5 text-blue-700">
                Stok fisik pada outlet dan HPP (Moving Average Cost) akan dihitung ulang secara
                otomatis berdasarkan kuantitas yang diterima.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <span className="text-slate-400 block text-[11px]">No. Pembelian</span>
              <span className="font-mono font-bold text-slate-800">{purchase.purchaseNumber}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Supplier</span>
              <span className="font-bold text-slate-800">{purchase.supplier?.name}</span>
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Item</th>
                  <th className="py-2.5 px-2 text-center">Qty Pesanan</th>
                  <th className="py-2.5 px-2 text-center w-28">Qty Diterima</th>
                  <th className="py-2.5 px-3 text-right">Unit Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {purchase.items?.map((item) => {
                  const match = receiveItems.find((r) => r.itemId === item.id);
                  const currentQtyReceived =
                    match !== undefined ? match.quantityReceived : Number(item.quantityOrdered);
                  const unit = item.inventoryItem?.unit || 'pcs';

                  return (
                    <tr key={item.id}>
                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-slate-800 block">
                          {item.inventoryItem?.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {item.inventoryItem?.sku || '-'}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-center font-medium text-slate-600">
                        {item.quantityOrdered} {unit}
                      </td>
                      <td className="py-2.5 px-2">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={currentQtyReceived}
                          onChange={(e) =>
                            handleQtyReceivedChange(
                              item.id,
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-900 font-bold text-center focus:outline-none focus:ring-1 focus:ring-[#0D5C53]"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                        {formatRupiah(Number(item.unitCost))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div>
            <FormTextarea
              label="Catatan Penerimaan (Opsional)"
              rows={2}
              value={receiveNotes}
              onChange={(e) => setReceiveNotes(e.target.value)}
              placeholder="Contoh: Barang diterima lengkap dalam kondisi baik..."
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsReceiveModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="primary"
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
              isLoading={receiveMutation.isPending}
              onClick={handleConfirmReceive}
            >
              Konfirmasi & Terima Stok
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL: Cancel / Delete Confirmation */}
      <Modal
        isOpen={isCancelConfirmOpen}
        onClose={() => setIsCancelConfirmOpen(false)}
        title="Batalkan Pembelian"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600 leading-relaxed">
            Apakah Anda yakin ingin membatalkan transaksi pembelian{' '}
            <strong className="text-slate-900 font-mono">{purchase.purchaseNumber}</strong>?
            Draft pembelian ini akan dihapus dari sistem.
          </p>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCancelConfirmOpen(false)}
            >
              Kembali
            </Button>
            <Button
              type="button"
              variant="primary"
              className="bg-rose-600 hover:bg-rose-700"
              isLoading={deleteMutation.isPending}
              onClick={handleConfirmCancel}
            >
              Ya, Batalkan Pembelian
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

