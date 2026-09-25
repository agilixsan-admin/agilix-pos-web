import React, { useState } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
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
  CreditCard,
  Wallet,
  Receipt,
  History,
  CheckCheck,
} from 'lucide-react';
import {
  usePurchaseDetail,
  useDeletePurchaseMutation,
  useReceivePurchaseMutation,
  usePurchasePayments,
  useCreatePurchasePaymentMutation,
  useFinancialAccounts,
} from '@domain/hooks';
import type { PurchaseStatus, PurchasePaymentStatus } from '@model/Inventory';
import {
  Card,
  Button,
  Badge,
  Modal,
  FormInput,
  FormTextarea,
  EmptyState,
  LoadingState,
  CustomSelect,
  FormDatePicker,
} from '@presentation/components/ui';
import { toast } from '@presentation/components/ui/toast';

export const PurchaseDetailScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Queries & Mutations
  const { data: purchase, isLoading, refetch } = usePurchaseDetail(id);
  const { data: accounts = [] } = useFinancialAccounts(purchase?.outletId);
  const { data: payments = [], refetch: refetchPayments } = usePurchasePayments(id);
  const deleteMutation = useDeletePurchaseMutation();
  const receiveMutation = useReceivePurchaseMutation();
  const createPaymentMutation = useCreatePurchasePaymentMutation();

  const queryOutletId = searchParams.get('outletId');
  const effectiveOutletId = queryOutletId || purchase?.outletId || '';
  const backUrl = effectiveOutletId
    ? `/inventory/purchases?outletId=${effectiveOutletId}`
    : '/inventory/purchases';

  // Receive Modal State
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [receiveItems, setReceiveItems] = useState<{ itemId: string; quantityReceived: number }[]>([]);
  const [receiveNotes, setReceiveNotes] = useState<string>('');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);

  // Payment Modal State (Bayar Hutang)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAccountId, setPaymentAccountId] = useState<string>('');
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [paymentNotes, setPaymentNotes] = useState<string>('');

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

  const getPaymentStatusBadge = (status?: PurchasePaymentStatus | string) => {
    const effectiveStatus =
      status || (remainingDebt === 0 ? 'PAID' : paidAmount > 0 ? 'PARTIAL' : 'UNPAID');
    switch (effectiveStatus) {
      case 'PAID':
        return (
          <Badge variant="success" dot>
            Lunas
          </Badge>
        );
      case 'PARTIAL':
        return (
          <Badge variant="warning" dot>
            Sebagian (Dicicil)
          </Badge>
        );
      case 'UNPAID':
      default:
        return (
          <Badge variant="danger" dot>
            Hutang / Belum Lunas
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
    setSelectedAccountId('');
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
          financialAccountId: selectedAccountId || undefined,
        },
      });
      setIsReceiveModalOpen(false);
      refetch();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Gagal menerima pesanan');
    }
  };

  // Open Payment Modal
  const handleOpenPaymentModal = () => {
    if (!purchase) return;
    const defaultAcc = accounts.length > 0 ? accounts[0].id : '';
    setPaymentAccountId(defaultAcc);
    setPaymentAmount(remainingDebt);
    setPaymentDate(new Date().toISOString().slice(0, 10));
    setPaymentNotes('');
    setIsPaymentModalOpen(true);
  };

  // Submit Payment
  const handleConfirmPayment = async () => {
    if (!id || !paymentAccountId || paymentAmount <= 0) return;
    try {
      await createPaymentMutation.mutateAsync({
        purchaseId: id,
        data: {
          financialAccountId: paymentAccountId,
          amount: Number(paymentAmount),
          paymentDate: paymentDate || undefined,
          notes: paymentNotes.trim() || undefined,
        },
      });
      toast.success('Pembayaran hutang berhasil dicatat.');
      setIsPaymentModalOpen(false);
      refetch();
      refetchPayments();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || err?.message || 'Gagal mencatat pembayaran hutang'
      );
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
      toast.error(err?.response?.data?.message || err?.message || 'Gagal membatalkan pembelian');
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
  const paidAmount = Number(purchase.paidAmount ?? 0);
  const remainingDebt = Math.max(0, Math.round((totalAmount - paidAmount) * 100) / 100);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(backUrl)}
            className="p-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-slate-600 transition-colors shadow-xs cursor-pointer"
            title="Kembali ke Daftar Pembelian"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Link to={backUrl} className="hover:text-[#0D5C53]">
                Pembelian
              </Link>
              <span>/</span>
              <span className="text-slate-800 font-semibold">{purchase.purchaseNumber}</span>
            </div>
            <div className="flex items-center gap-2.5 mt-0.5 flex-wrap">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                {purchase.purchaseNumber}
              </h1>
              {getStatusBadge(purchase.status)}
              {isReceived &&
                getPaymentStatusBadge(
                  purchase.paymentStatus || (remainingDebt === 0 ? 'PAID' : 'UNPAID')
                )}
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Store className="w-3 h-3" />
                {purchase.outlet?.name || 'Cabang Utama'}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
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
                onClick={() => navigate(`/inventory/purchases/${id}/edit?outletId=${effectiveOutletId}`)}
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
            <>
              {remainingDebt > 0 && (
                <Button
                  variant="primary"
                  className="bg-amber-600 hover:bg-amber-700 text-white shadow-xs"
                  leftIcon={<Wallet className="w-4 h-4" />}
                  onClick={handleOpenPaymentModal}
                >
                  Bayar Hutang
                </Button>
              )}
              <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-200 font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {remainingDebt === 0 ? 'Lunas & Stok Terupdate' : 'Stok Terupdate'}
                </span>
              </div>
            </>
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

        {/* Right Column: Ringkasan Pembayaran & Finansial */}
        <div className="space-y-6">
          <Card header={<h3 className="text-sm font-bold text-slate-900">Ringkasan Finansial</h3>}>
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

              {isReceived && (
                <div className="pt-2 border-t border-slate-100 space-y-2.5">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Sudah Dibayar</span>
                    <span className="font-semibold text-emerald-600 font-mono">
                      {formatRupiah(paidAmount)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-700">Sisa Hutang Usaha</span>
                    <span
                      className={`font-bold font-mono text-sm ${
                        remainingDebt > 0 ? 'text-rose-600' : 'text-emerald-700'
                      }`}
                    >
                      {formatRupiah(remainingDebt)}
                    </span>
                  </div>

                  <div className="pt-1 flex items-center justify-between">
                    <span className="text-slate-500">Status Bayar:</span>
                    {getPaymentStatusBadge(
                      purchase.paymentStatus || (remainingDebt === 0 ? 'PAID' : 'UNPAID')
                    )}
                  </div>

                  {remainingDebt > 0 && (
                    <Button
                      type="button"
                      variant="primary"
                      className="w-full mt-2 bg-amber-600 hover:bg-amber-700 text-white shadow-xs justify-center"
                      leftIcon={<Wallet className="w-4 h-4" />}
                      onClick={handleOpenPaymentModal}
                    >
                      Bayar Hutang Sekarang
                    </Button>
                  )}
                </div>
              )}

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
                <th className="py-3.5 px-4 text-right">Total Harga</th>
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
                const subtotal = Number(item.subtotal || (qtyOrdered * Number(item.unitCost || 0)));

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

      {/* Riwayat Pembayaran Hutang (Hanya jika pembelian sudah diterima) */}
      {isReceived && (
        <Card
          header={
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-[#0D5C53]" />
                <h3 className="text-sm font-bold text-slate-900">Riwayat Pembayaran Hutang</h3>
              </div>
              {remainingDebt > 0 && (
                <Button
                  size="sm"
                  variant="primary"
                  className="bg-amber-600 hover:bg-amber-700 text-white text-xs px-3 py-1.5"
                  leftIcon={<Wallet className="w-3.5 h-3.5" />}
                  onClick={handleOpenPaymentModal}
                >
                  Bayar Hutang
                </Button>
              )}
            </div>
          }
          padding="none"
        >
          {payments.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              <Receipt className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-slate-700">Belum ada catatan pembayaran hutang</p>
              <p className="text-slate-400 mt-0.5">
                {remainingDebt > 0
                  ? 'Gunakan tombol "Bayar Hutang" untuk mencatat pelunasan atau cicilan hutang ke supplier.'
                  : 'Seluruh pembayaran telah lunas saat penerimaan barang.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">#</th>
                    <th className="py-3 px-4">No. Bukti Bayar</th>
                    <th className="py-3 px-4">Tanggal</th>
                    <th className="py-3 px-4">Sumber Dana (Akun Kas/Bank)</th>
                    <th className="py-3 px-4">Dicatat Oleh</th>
                    <th className="py-3 px-4">Catatan</th>
                    <th className="py-3 px-4 text-right">Jumlah Bayar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payments.map((payment, idx) => (
                    <tr key={payment.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 text-center font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {payment.paymentNumber}
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {formatDate(payment.paymentDate)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 font-medium">
                          <CreditCard className="w-3 h-3 text-slate-500" />
                          {payment.financialAccount?.accountName || 'Kas / Bank'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {payment.creator?.name || 'Petugas'}
                      </td>
                      <td className="py-3 px-4 text-slate-500 italic max-w-xs truncate">
                        {payment.notes || '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-600 font-mono">
                        {formatRupiah(Number(payment.amount))}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 border-t border-slate-200 font-bold text-xs text-slate-800">
                  <tr>
                    <td colSpan={6} className="py-3 px-4 text-right">
                      Total Dibayar:
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-700">
                      {formatRupiah(paidAmount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </Card>
      )}

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
                  <th className="py-2.5 px-3 text-right">Total Harga</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {purchase.items?.map((item) => {
                  const match = receiveItems.find((r) => r.itemId === item.id);
                  const currentQtyReceived =
                    match !== undefined ? match.quantityReceived : Number(item.quantityOrdered);
                  const unit = item.inventoryItem?.unit || 'pcs';
                  const itemTotal = Number(item.subtotal || (Number(item.quantityOrdered) * Number(item.unitCost || 0)));

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
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800">
                        {formatRupiah(itemTotal)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {(() => {
            const totalReceiveAmount = purchase.items.reduce((sum, item) => {
              const match = receiveItems.find((r) => r.itemId === item.id);
              const qty =
                match !== undefined ? match.quantityReceived : Number(item.quantityOrdered);
              return sum + qty * Number(item.unitCost || 0);
            }, 0);
            const selectedAccount = accounts.find((a) => a.id === selectedAccountId);
            const isBalanceInsufficient = selectedAccount
              ? Number(selectedAccount.currentBalance) < totalReceiveAmount
              : false;

            return (
              <>
                {/* Sumber Pembayaran & Auto-Journal */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-[#0D5C53]" />
                      Metode / Sumber Pembayaran
                    </label>
                    <span className="text-[11px] font-bold text-slate-700">
                      Total Diterima: <span className="font-mono text-[#0D5C53]">{formatRupiah(totalReceiveAmount)}</span>
                    </span>
                  </div>

                  <CustomSelect
                    value={selectedAccountId}
                    onChange={(val) => setSelectedAccountId(val)}
                    placeholder="Hutang Usaha / Supplier (Tempo / Belum Lunas)"
                    options={[
                      { value: '', label: 'Hutang Usaha / Supplier (Tempo / Belum Lunas)' },
                      ...accounts.map((acc) => ({
                        value: acc.id,
                        label: `${acc.accountName} (${acc.accountType === 'CASH' ? 'Kas Laci' : 'Bank'}) - Saldo: ${formatRupiah(Number(acc.currentBalance))}`,
                      })),
                    ]}
                  />

                  {/* Ringkasan Jurnal Akuntansi Otomatis */}
                  <div className="text-[11px] leading-relaxed rounded-lg p-2.5 bg-white border border-slate-200/60 text-slate-600">
                    {selectedAccountId ? (
                      <div>
                        <div className="font-semibold text-slate-800 flex items-center gap-1 mb-1">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                          Auto-Journal Pembukuan (Bayar Langsung):
                        </div>
                        <div>• <strong className="text-emerald-700">Debit:</strong> Persediaan Bahan Baku / Kemasan (1-1300 / 1-1400)</div>
                        <div>• <strong className="text-slate-700">Kredit:</strong> {selectedAccount?.accountName} ({selectedAccount?.accountType === 'CASH' ? '1-1100' : '1-1200'})</div>
                        {isBalanceInsufficient && (
                          <div className="text-rose-600 font-semibold mt-1.5 flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" />
                            Saldo akun {selectedAccount?.accountName} tidak mencukupi untuk pembayaran ini!
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        <div className="font-semibold text-slate-800 flex items-center gap-1 mb-1">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                          Auto-Journal Pembukuan (Hutang Usaha):
                        </div>
                        <div>• <strong className="text-emerald-700">Debit:</strong> Persediaan Bahan Baku / Kemasan (1-1300 / 1-1400)</div>
                        <div>• <strong className="text-amber-700">Kredit:</strong> Hutang Usaha / Supplier (2-1100)</div>
                      </div>
                    )}
                  </div>
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
                    disabled={isBalanceInsufficient || receiveMutation.isPending}
                    onClick={handleConfirmReceive}
                  >
                    Konfirmasi & Terima Stok
                  </Button>
                </div>
              </>
            );
          })()}
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

      {/* MODAL: Bayar Hutang Pembelian (Pelunasan / Cicilan) */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title="Bayar Hutang Pembelian"
        maxWidth="lg"
      >
        <div className="space-y-4 text-xs">
          {/* Info Card Hutang */}
          <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200/80 text-amber-900 flex items-start gap-2.5">
            <Wallet className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-bold text-amber-800 block">
                Pelunasan / Pembayaran Hutang Supplier
              </span>
              <p className="mt-0.5 text-amber-700 text-[11px]">
                Pembayaran ini akan memotong saldo akun Kas/Bank yang dipilih dan otomatis mencatat jurnal akuntansi debit Hutang Usaha (2-1100).
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">No. Pembelian</span>
              <span className="font-mono font-bold text-slate-800">{purchase.purchaseNumber}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Supplier</span>
              <span className="font-bold text-slate-800">{purchase.supplier?.name}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Sisa Hutang Saat Ini</span>
              <span className="font-mono font-bold text-rose-600 text-sm">{formatRupiah(remainingDebt)}</span>
            </div>
          </div>

          {/* Form Pembayaran */}
          <div className="space-y-3.5">
            <FormDatePicker
              label="Tanggal Pembayaran"
              value={paymentDate}
              onChange={(val) => setPaymentDate(val)}
            />

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Sumber Dana (Akun Kas / Bank) <span className="text-rose-500">*</span>
              </label>
              <CustomSelect
                value={paymentAccountId}
                onChange={(val) => setPaymentAccountId(val)}
                placeholder="-- Pilih Akun Pembayaran --"
                options={[
                  { value: '', label: '-- Pilih Akun Pembayaran --' },
                  ...accounts.map((acc) => ({
                    value: acc.id,
                    label: `${acc.accountName} (${acc.accountType === 'CASH' ? 'Kas Laci' : 'Bank'}) - Saldo: ${formatRupiah(Number(acc.currentBalance))}`,
                  })),
                ]}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Jumlah Pembayaran <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setPaymentAmount(remainingDebt)}
                  className="text-[11px] font-bold text-[#0D5C53] hover:underline cursor-pointer"
                >
                  Bayar Lunas ({formatRupiah(remainingDebt)})
                </button>
              </div>
              <FormInput
                type="number"
                min="1"
                max={remainingDebt}
                step="any"
                value={paymentAmount || ''}
                onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                placeholder="Masukkan nominal bayar..."
              />
            </div>

            {/* Validasi Saldo & Peringatan */}
            {(() => {
              const selectedAcc = accounts.find((a) => a.id === paymentAccountId);
              const isInsufficient = selectedAcc ? Number(selectedAcc.currentBalance) < paymentAmount : false;
              const isExceeding = paymentAmount > remainingDebt;

              return (
                <>
                  {isExceeding && (
                    <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[11px] flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>Nominal pembayaran tidak boleh melebihi sisa hutang ({formatRupiah(remainingDebt)}).</span>
                    </div>
                  )}

                  {isInsufficient && (
                    <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[11px] flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>
                        Saldo akun {selectedAcc?.accountName} ({formatRupiah(Number(selectedAcc?.currentBalance || 0))}) tidak mencukupi untuk pembayaran ini!
                      </span>
                    </div>
                  )}

                  {/* Auto-Journal Preview */}
                  {selectedAcc && paymentAmount > 0 && !isExceeding && (
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1">
                      <div className="font-semibold text-slate-800 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        Jurnal Akuntansi Otomatis:
                      </div>
                      <div>• <strong className="text-emerald-700">Debit:</strong> Hutang Usaha / Supplier (2-1100) sebesar {formatRupiah(paymentAmount)}</div>
                      <div>• <strong className="text-slate-700">Kredit:</strong> {selectedAcc.accountName} ({selectedAcc.accountType === 'CASH' ? '1-1100' : '1-1200'}) sebesar {formatRupiah(paymentAmount)}</div>
                    </div>
                  )}
                </>
              );
            })()}

            <div>
              <FormTextarea
                label="Catatan Pembayaran (Opsional)"
                rows={2}
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                placeholder="Contoh: Pembayaran transfer pelunasan..."
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsPaymentModalOpen(false)}
            >
              Batal
            </Button>
            {(() => {
              const selectedAcc = accounts.find((a) => a.id === paymentAccountId);
              const isInsufficient = selectedAcc ? Number(selectedAcc.currentBalance) < paymentAmount : false;
              const isExceeding = paymentAmount > remainingDebt;
              const isInvalid = !paymentAccountId || paymentAmount <= 0 || isExceeding || isInsufficient;

              return (
                <Button
                  type="button"
                  variant="primary"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  leftIcon={<CheckCircle2 className="w-4 h-4" />}
                  isLoading={createPaymentMutation.isPending}
                  disabled={isInvalid || createPaymentMutation.isPending}
                  onClick={handleConfirmPayment}
                >
                  Konfirmasi Pembayaran
                </Button>
              );
            })()}
          </div>
        </div>
      </Modal>
    </div>
  );
};

