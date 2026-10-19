import React, { useState, useEffect } from 'react';
import type { Order, PaymentMethod, PaymentInfo } from '@model/Order';
import { posService } from '@domain/services/pos-service';
import {
  Banknote,
  QrCode,
  Delete,
  ArrowRight,
  AlertCircle,
  Clock,
  RotateCw,
  Receipt,
  Utensils,
  ShoppingBag,
  Tag,
} from 'lucide-react';
import { Button, Modal, Badge } from '@presentation/components/ui';
import { DiscountModal } from './discount-modal';

interface PaymentModalProps {
  order: Order;
  isOpen: boolean;
  onClose: (latestOrder?: Order) => void;
  onPaymentSuccess: (completedOrder: Order) => void;
  taxName?: string | null;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  order,
  isOpen,
  onClose,
  onPaymentSuccess,
  taxName,
}) => {
  const [currentOrder, setCurrentOrder] = useState<Order>(order);
  const [method, setMethod] = useState<PaymentMethod>('CASH');
  const [cashGiven, setCashGiven] = useState<number>(Number(order.totalAmount || 0));
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingQris, setCheckingQris] = useState<boolean>(false);
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState<boolean>(false);
  const [isApplyingDiscount, setIsApplyingDiscount] = useState<boolean>(false);

  useEffect(() => {
    setCurrentOrder(order);
    setCashGiven(Number(order.totalAmount || 0));
  }, [order]);

  if (!isOpen) return null;

  const totalAmount = Number(currentOrder.totalAmount || 0);
  const changeAmount = Math.max(0, cashGiven - totalAmount);
  const isCashSufficient = cashGiven >= totalAmount;

  // Preset Cash Values
  const PRESET_AMOUNTS = [
    { label: 'Uang Pas', value: totalAmount },
    { label: '20.000', value: 20000 },
    { label: '50.000', value: 50000 },
    { label: '100.000', value: 100000 },
  ];

  const handleNumpadPress = (num: string) => {
    const currentStr = cashGiven === 0 ? '' : cashGiven.toString();
    if (num === '000') {
      setCashGiven(Number(currentStr + '000'));
    } else {
      setCashGiven(Number(currentStr + num));
    }
  };

  const handleNumpadBackspace = () => {
    const currentStr = cashGiven.toString();
    if (currentStr.length <= 1) {
      setCashGiven(0);
    } else {
      setCashGiven(Number(currentStr.slice(0, -1)));
    }
  };

  const handleApplyDiscount = async ({
    id,
    name,
    amount,
  }: {
    id: string | null;
    name: string | null;
    amount: number;
  }) => {
    setIsApplyingDiscount(true);
    setError(null);
    try {
      const updated = await posService.applyOrderDiscount(currentOrder.id, {
        discountId: id,
        discountAmount: amount,
      });
      const updatedWithDiscountName: Order = {
        ...updated,
        discountName: name || updated.discountName,
      };
      setCurrentOrder(updatedWithDiscountName);
      setCashGiven(Number(updatedWithDiscountName.totalAmount || 0));
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Gagal menerapkan diskon.';
      setError(errorMsg);
    } finally {
      setIsApplyingDiscount(false);
    }
  };

  const handleRemoveDiscount = async () => {
    setIsApplyingDiscount(true);
    setError(null);
    try {
      const updated = await posService.applyOrderDiscount(currentOrder.id, {
        discountId: null,
        discountAmount: 0,
      });
      const updatedWithoutDiscount: Order = {
        ...updated,
        discountName: null,
      };
      setCurrentOrder(updatedWithoutDiscount);
      setCashGiven(Number(updatedWithoutDiscount.totalAmount || 0));
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Gagal menghapus diskon.';
      setError(errorMsg);
    } finally {
      setIsApplyingDiscount(false);
    }
  };

  const handleProcessPayment = async () => {
    if (method === 'CASH' && !isCashSufficient) {
      setError('Uang yang diterima kurang dari total tagihan.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const paid = method === 'CASH' ? cashGiven : totalAmount;
      const res = await posService.processPayment({
        orderId: currentOrder.id,
        paymentMethod: method,
        amount: paid,
        cashGiven: method === 'CASH' ? cashGiven : undefined,
      });

      const paymentData = (res as unknown as { payment?: { amount?: number; changeAmount?: number; paymentMethod?: PaymentMethod } })?.payment;
      const finalPaidAmount =
        paymentData?.amount !== undefined
          ? Number(paymentData.amount)
          : method === 'CASH'
          ? cashGiven
          : totalAmount;
      const finalChangeAmount =
        paymentData?.changeAmount !== undefined
          ? Number(paymentData.changeAmount)
          : method === 'CASH'
          ? changeAmount
          : 0;

      const completedOrder: Order = {
        ...(res.order || currentOrder),
        status: 'COMPLETED',
        paymentMethod: method,
        paymentStatus: 'SETTLED',
        paidAmount: finalPaidAmount,
        changeAmount: finalChangeAmount,
        transaction: (res as unknown as { transaction?: unknown })?.transaction as unknown as Order['transaction'] || (res.order as unknown as { transaction?: unknown })?.transaction as unknown as Order['transaction'],
        payments: paymentData ? [paymentData as unknown as PaymentInfo] : undefined,
      };

      onPaymentSuccess(completedOrder);
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Gagal memproses pembayaran. Coba lagi.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckQrisStatus = async () => {
    setCheckingQris(true);
    setError(null);
    try {
      // Check status via payment service
      const res = await posService.processPayment({
        orderId: currentOrder.id,
        paymentMethod: 'QRIS',
        amount: totalAmount,
      });

      const paymentData = (res as unknown as { payment?: { amount?: number; changeAmount?: number; paymentMethod?: PaymentMethod } })?.payment;
      const completedOrder: Order = {
        ...(res.order || currentOrder),
        status: 'COMPLETED',
        paymentMethod: 'QRIS',
        paymentStatus: 'SETTLED',
        paidAmount: totalAmount,
        changeAmount: 0,
        transaction: (res as unknown as { transaction?: unknown })?.transaction as unknown as Order['transaction'] || (res.order as unknown as { transaction?: unknown })?.transaction as unknown as Order['transaction'],
        payments: paymentData ? [paymentData as unknown as PaymentInfo] : undefined,
      };

      onPaymentSuccess(completedOrder);
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Status QRIS belum terbayar. Silakan coba beberapa saat lagi.';
      setError(errorMsg);
    } finally {
      setCheckingQris(false);
    }
  };

  return (
    <>
      <Modal
      isOpen={isOpen}
      onClose={() => onClose(currentOrder)}
      title="Checkout & Pembayaran"
      subtitle={`No. Order: ${currentOrder.orderNumber || currentOrder.id.slice(0, 8)} • ${
        currentOrder.orderType === 'DINE_IN'
          ? `Meja ${currentOrder.tableName || currentOrder.tableNumber || currentOrder.table?.name || '-'}`
          : 'Take Away'
      }`}
      maxWidth="2xl"
      footer={
        <>
          <Button variant="outline" onClick={() => onClose(currentOrder)} disabled={loading || checkingQris}>
            Batal
          </Button>
          {method === 'QRIS' ? (
            <Button
              variant="primary"
              size="lg"
              isLoading={checkingQris}
              leftIcon={<RotateCw className="w-4 h-4" />}
              onClick={handleCheckQrisStatus}
            >
              Cek Status & Selesaikan
            </Button>
          ) : (
            <Button
              variant="primary"
              size="lg"
              isLoading={loading}
              disabled={!isCashSufficient}
              rightIcon={<ArrowRight className="w-4 h-4" />}
              onClick={handleProcessPayment}
            >
              Selesaikan Transaksi (Bayar)
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-4 py-1">
        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Split Screen Layout: Left Payment Methods & Right Order Details */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left Panel: Payment Mode Selector & Forms (7 Cols) */}
          <div className="md:col-span-7 space-y-4">
            {/* Payment Method Switcher */}
            <div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
                Pilih Metode Pembayaran:
              </span>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setMethod('CASH');
                    setError(null);
                  }}
                  className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 font-bold text-xs transition-all cursor-pointer ${
                    method === 'CASH'
                      ? 'border-[#2563EB] bg-blue-50/70 dark:bg-blue-950/40 text-[#2563EB] dark:text-blue-400 shadow-2xs'
                      : 'border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-xs ${
                      method === 'CASH' ? 'bg-[#2563EB] text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <Banknote className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <span className="text-slate-800 dark:text-slate-100">Uang Tunai (Cash)</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-normal">
                      Pecahan & Numpad Kasir
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMethod('QRIS');
                    setError(null);
                  }}
                  className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 font-bold text-xs transition-all cursor-pointer ${
                    method === 'QRIS'
                      ? 'border-[#2563EB] bg-blue-50/70 dark:bg-blue-950/40 text-[#2563EB] dark:text-blue-400 shadow-2xs'
                      : 'border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-xs ${
                      method === 'QRIS' ? 'bg-[#2563EB] text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <span className="text-slate-800 dark:text-slate-100">QRIS / E-Wallet</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-normal">
                      Scan QR Dinamis / Statis
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* CASH PAYMENT SECTION */}
            {method === 'CASH' && (
              <div className="space-y-3">
                {/* Cash Received & Kembalian Bar */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 bg-slate-50/80 dark:bg-slate-800/60 rounded-xl border border-slate-200/90 dark:border-slate-700 shadow-2xs">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block">
                      Uang Diterima:
                    </span>
                    <span className="text-lg font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                      Rp {cashGiven.toLocaleString('id-ID')}
                    </span>
                  </div>

                  <div
                    className={`p-3.5 rounded-xl border transition-all shadow-2xs ${
                      isCashSufficient
                        ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-200/90 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300'
                        : 'bg-rose-50/90 dark:bg-rose-950/40 border-rose-200/90 dark:border-rose-800/60 text-rose-800 dark:text-rose-300'
                    }`}
                  >
                    <span className="text-[10px] font-semibold block">
                      {isCashSufficient ? 'Kembalian:' : 'Uang Kurang:'}
                    </span>
                    <span className="text-lg font-bold tabular-nums">
                      Rp {Math.abs(changeAmount).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                {/* Quick Presets */}
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1.5">
                    Pecahan Cepat:
                  </span>
                  <div className="grid grid-cols-4 gap-2">
                    {PRESET_AMOUNTS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setCashGiven(preset.value)}
                        className={`py-2 px-1 text-center rounded-xl text-xs font-bold cursor-pointer transition-all border tabular-nums ${
                          cashGiven === preset.value
                            ? 'bg-gradient-to-b from-[#2563EB] to-[#1D4ED8] text-white border-blue-600 shadow-xs'
                            : 'bg-slate-100/80 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-700'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Virtual Numpad */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '000'].map((btn) => (
                    <button
                      key={btn}
                      type="button"
                      onClick={() => handleNumpadPress(btn)}
                      className="py-3 bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60 rounded-xl font-bold text-base text-slate-800 dark:text-slate-100 cursor-pointer shadow-2xs active:scale-95 transition-all tabular-nums"
                    >
                      {btn}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={handleNumpadBackspace}
                    className="py-3 bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-800/50 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 rounded-xl font-bold text-base flex items-center justify-center cursor-pointer shadow-2xs active:scale-95 transition-all"
                  >
                    <Delete className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* QRIS PAYMENT SECTION */}
            {method === 'QRIS' && (
              <div className="p-6 border-2 border-dashed border-blue-200 dark:border-blue-800/60 bg-blue-50/30 dark:bg-blue-950/20 rounded-2xl text-center space-y-4">
                <div className="w-44 h-44 bg-white p-3 rounded-2xl shadow-sm border border-slate-200 mx-auto flex flex-col items-center justify-center">
                  <QrCode className="w-32 h-32 text-slate-800" />
                  <span className="text-[10px] font-bold text-[#2563EB] tracking-widest mt-1">
                    QRIS RESMI
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    Arahkan Pelanggan untuk Scan QR
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Mendukung GoPay, OVO, Dana, ShopeePay, BCA, Mandiri & Mobile Banking lainnya.
                  </p>
                </div>

                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-full text-xs font-bold">
                  <span>Nominal: Rp {totalAmount.toLocaleString('id-ID')}</span>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel: Order Summary & Bill Preview (5 Cols) */}
          <div className="md:col-span-5 bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-4 shadow-2xs">
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-slate-800">
                <span className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Receipt className="w-4 h-4 text-slate-500" />
                  Ringkasan Tagihan
                </span>
                <Badge variant={currentOrder.orderType === 'DINE_IN' ? 'success' : 'info'} size="sm">
                  {currentOrder.orderType === 'DINE_IN'
                    ? `Dine In • Meja ${currentOrder.tableName || currentOrder.tableNumber || currentOrder.table?.name || '-'}`
                    : 'Take Away'}
                </Badge>
              </div>

              {/* Items List Preview */}
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {currentOrder.items?.map((item, idx) => (
                  <div key={idx} className="pt-1.5 first:pt-0 flex justify-between text-slate-700 dark:text-slate-300">
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{item.quantity}x {item.productName}</span>
                      {item.variantName && !item.variantName.trim().toLowerCase().includes('default') && (
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-normal">
                          ({item.variantName})
                        </span>
                      )}
                      {item.notes && (
                        <span className="text-[10px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-1 py-0.5 rounded block w-fit mt-0.5">
                          {item.notes}
                        </span>
                      )}
                    </div>
                    <span className="font-bold text-slate-800 dark:text-slate-100 tabular-nums">
                      Rp {Number(item.subtotal ?? (Number(item.unitPrice || item.price || 0) * item.quantity)).toLocaleString('id-ID')}
                    </span>
                  </div>
                ))}
              </div>

              {/* Financial Calculation */}
              <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800 space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 tabular-nums">
                    Rp {Number(currentOrder.subtotal || totalAmount).toLocaleString('id-ID')}
                  </span>
                </div>

                {/* Step Penambahan Diskon di Pop-Up Pembayaran */}
                {Number(currentOrder.discountAmount || 0) > 0 ? (
                  <div className="flex justify-between items-center bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 px-2 py-1.5 rounded-lg">
                    <div className="flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span className="font-medium text-xs">
                        {currentOrder.discountName || 'Diskon'}
                      </span>
                      <button
                        type="button"
                        disabled={isApplyingDiscount || loading}
                        onClick={handleRemoveDiscount}
                        className="text-[10px] text-rose-600 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300 font-semibold underline ml-1 cursor-pointer"
                      >
                        Hapus
                      </button>
                    </div>
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums">
                      -Rp {Number(currentOrder.discountAmount).toLocaleString('id-ID')}
                    </span>
                  </div>
                ) : (
                  <div className="flex justify-between items-center py-0.5">
                    <button
                      type="button"
                      disabled={isApplyingDiscount || loading}
                      onClick={() => setIsDiscountModalOpen(true)}
                      className="text-xs text-[#2563EB] dark:text-blue-400 hover:underline flex items-center gap-1.5 font-medium cursor-pointer"
                    >
                      <Tag className="w-3.5 h-3.5" />
                      <span>+ Tambah Diskon / Promo</span>
                    </button>
                  </div>
                )}

                {Number(currentOrder.packagingFee || 0) > 0 && (
                  <div className="flex justify-between">
                    <span>Biaya Kemasan</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 tabular-nums">
                      Rp {Number(currentOrder.packagingFee).toLocaleString('id-ID')}
                    </span>
                  </div>
                )}
                {Number(currentOrder.serviceCharge || 0) > 0 && (
                  <div className="flex justify-between">
                    <span>Service Charge</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 tabular-nums">
                      Rp {Number(currentOrder.serviceCharge).toLocaleString('id-ID')}
                    </span>
                  </div>
                )}
                {Number(currentOrder.taxAmount || 0) > 0 && (
                  <div className="flex justify-between">
                    <span>{currentOrder.taxName || taxName || 'Pajak'}</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 tabular-nums">
                      Rp {Number(currentOrder.taxAmount).toLocaleString('id-ID')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Total Grand Banner */}
            <div className="p-4 bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 rounded-xl shadow-2xs">
              <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">
                Total Pembayaran
              </span>
              <div className="text-2xl font-bold text-[#2563EB] dark:text-blue-400 tabular-nums mt-0.5 tracking-tight">
                Rp {totalAmount.toLocaleString('id-ID')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>

    {/* DISCOUNT SELECTION MODAL FROM PAYMENT POP UP */}
    <DiscountModal
      isOpen={isDiscountModalOpen}
      onClose={() => setIsDiscountModalOpen(false)}
      subtotal={Number(currentOrder.subtotal || totalAmount)}
      selectedDiscountId={currentOrder.discountId || null}
      onApplyDiscount={handleApplyDiscount}
    />
  </>
  );
};
