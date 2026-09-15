import React, { useState } from 'react';
import type { Order, PaymentMethod } from '@model/Order';
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
} from 'lucide-react';
import { Button, Modal, Badge } from '@presentation/components/ui';

interface PaymentModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: (completedOrder: Order) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  order,
  isOpen,
  onClose,
  onPaymentSuccess,
}) => {
  const [method, setMethod] = useState<PaymentMethod>('CASH');
  const [cashGiven, setCashGiven] = useState<number>(order.totalAmount);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingQris, setCheckingQris] = useState<boolean>(false);

  if (!isOpen) return null;

  const totalAmount = Number(order.totalAmount || 0);
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

  const handleProcessPayment = async () => {
    if (method === 'CASH' && !isCashSufficient) {
      setError('Uang yang diterima kurang dari total tagihan.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await posService.processPayment({
        orderId: order.id,
        paymentMethod: method,
        amount: totalAmount,
        cashGiven: method === 'CASH' ? cashGiven : totalAmount,
      });

      const completedOrder: Order = {
        ...order,
        status: 'COMPLETED',
        paymentMethod: method,
        paymentStatus: 'SETTLED',
        paidAmount: method === 'CASH' ? cashGiven : totalAmount,
        changeAmount: method === 'CASH' ? changeAmount : 0,
      };

      onPaymentSuccess(res.order || completedOrder);
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
        orderId: order.id,
        paymentMethod: 'QRIS',
        amount: totalAmount,
      });

      const completedOrder: Order = {
        ...order,
        status: 'COMPLETED',
        paymentMethod: 'QRIS',
        paymentStatus: 'SETTLED',
        paidAmount: totalAmount,
        changeAmount: 0,
      };

      onPaymentSuccess(res.order || completedOrder);
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Checkout & Pembayaran"
      subtitle={`No. Order: ${order.orderNumber || order.id.slice(0, 8)} • ${
        order.orderType === 'DINE_IN' ? `Meja ${order.tableName || '-'}` : 'Take Away'
      }`}
      maxWidth="2xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading || checkingQris}>
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
              <span className="text-xs font-bold text-slate-700 block mb-2">
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
                      ? 'border-[#0D5C53] bg-teal-50/50 text-[#0D5C53] shadow-xs'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      method === 'CASH' ? 'bg-[#0D5C53] text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <Banknote className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <span>Uang Tunai (Cash)</span>
                    <span className="text-[10px] text-slate-400 block font-normal">
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
                      ? 'border-[#0D5C53] bg-teal-50/50 text-[#0D5C53] shadow-xs'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      method === 'QRIS' ? 'bg-[#0D5C53] text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <span>QRIS / E-Wallet</span>
                    <span className="text-[10px] text-slate-400 block font-normal">
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
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-semibold block">
                      Uang Diterima:
                    </span>
                    <span className="text-lg font-bold text-slate-900 font-mono">
                      Rp {cashGiven.toLocaleString('id-ID')}
                    </span>
                  </div>

                  <div
                    className={`p-3 rounded-xl border transition-all ${
                      isCashSufficient
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-rose-50 border-rose-200 text-rose-800'
                    }`}
                  >
                    <span className="text-[10px] font-semibold block">
                      {isCashSufficient ? 'Kembalian:' : 'Uang Kurang:'}
                    </span>
                    <span className="text-lg font-bold font-mono">
                      Rp {Math.abs(changeAmount).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                {/* Quick Presets */}
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">
                    Pecahan Cepat:
                  </span>
                  <div className="grid grid-cols-4 gap-2">
                    {PRESET_AMOUNTS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setCashGiven(preset.value)}
                        className={`py-2 px-1 text-center rounded-xl text-xs font-bold cursor-pointer transition-all border ${
                          cashGiven === preset.value
                            ? 'bg-[#0D5C53] text-white border-[#0D5C53] shadow-xs'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
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
                      className="py-3 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl font-bold text-base text-slate-800 cursor-pointer shadow-xs active:scale-95 transition-all"
                    >
                      {btn}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={handleNumpadBackspace}
                    className="py-3 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 rounded-xl font-bold text-base flex items-center justify-center cursor-pointer shadow-xs active:scale-95 transition-all"
                  >
                    <Delete className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* QRIS PAYMENT SECTION */}
            {method === 'QRIS' && (
              <div className="p-6 border-2 border-dashed border-teal-200 bg-teal-50/30 rounded-2xl text-center space-y-4">
                <div className="w-44 h-44 bg-white p-3 rounded-2xl shadow-sm border border-slate-200 mx-auto flex flex-col items-center justify-center">
                  <QrCode className="w-32 h-32 text-slate-800" />
                  <span className="text-[10px] font-bold text-[#0D5C53] tracking-widest mt-1">
                    QRIS RESMI
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-800">
                    Arahkan Pelanggan untuk Scan QR
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Mendukung GoPay, OVO, Dana, ShopeePay, BCA, Mandiri & Mobile Banking lainnya.
                  </p>
                </div>

                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold">
                  <span>Nominal: Rp {totalAmount.toLocaleString('id-ID')}</span>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel: Order Summary & Bill Preview (5 Cols) */}
          <div className="md:col-span-5 bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                  <Receipt className="w-4 h-4 text-slate-500" />
                  Ringkasan Tagihan
                </span>
                <Badge variant={order.orderType === 'DINE_IN' ? 'success' : 'info'} size="sm">
                  {order.orderType === 'DINE_IN' ? `Dine In • Meja ${order.tableName || '-'}` : 'Take Away'}
                </Badge>
              </div>

              {/* Items List Preview */}
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 divide-y divide-slate-100 text-xs">
                {order.items?.map((item, idx) => (
                  <div key={idx} className="pt-1.5 first:pt-0 flex justify-between text-slate-700">
                    <div>
                      <span className="font-semibold">{item.quantity}x {item.productName}</span>
                      {item.variantName && (
                        <span className="text-[10px] text-slate-400 block font-normal">
                          ({item.variantName})
                        </span>
                      )}
                      {item.notes && (
                        <span className="text-[10px] text-amber-700 bg-amber-50 px-1 py-0.5 rounded block w-fit mt-0.5">
                          {item.notes}
                        </span>
                      )}
                    </div>
                    <span className="font-mono font-bold text-slate-800">
                      Rp {Number(item.subtotal ?? (Number(item.unitPrice || item.price || 0) * item.quantity)).toLocaleString('id-ID')}
                    </span>
                  </div>
                ))}
              </div>

              {/* Financial Calculation */}
              <div className="pt-3 border-t border-slate-200 space-y-1.5 text-xs text-slate-500">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-800">
                    Rp {Number(order.subtotal || totalAmount).toLocaleString('id-ID')}
                  </span>
                </div>
                {Number(order.discountAmount || 0) > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Diskon</span>
                    <span>-Rp {Number(order.discountAmount).toLocaleString('id-ID')}</span>
                  </div>
                )}
                {Number(order.taxAmount || 0) > 0 && (
                  <div className="flex justify-between">
                    <span>Pajak (PB1)</span>
                    <span className="font-semibold text-slate-800">
                      Rp {Number(order.taxAmount).toLocaleString('id-ID')}
                    </span>
                  </div>
                )}
                {Number(order.serviceCharge || 0) > 0 && (
                  <div className="flex justify-between">
                    <span>Service Charge</span>
                    <span className="font-semibold text-slate-800">
                      Rp {Number(order.serviceCharge).toLocaleString('id-ID')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Total Grand Banner */}
            <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">
                Total Pembayaran
              </span>
              <div className="text-xl font-extrabold text-[#0D5C53]">
                Rp {totalAmount.toLocaleString('id-ID')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
