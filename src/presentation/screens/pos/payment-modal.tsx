import React, { useState } from 'react';
import type { Order, PaymentMethod } from '@model/Order';
import { posService } from '@domain/services/pos-service';
import { X, Banknote, QrCode, Loader2, Check, Delete, ArrowRight } from 'lucide-react';

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

  if (!isOpen) return null;

  const totalAmount = Number(order.totalAmount || 0);
  const changeAmount = Math.max(0, cashGiven - totalAmount);
  const isCashSufficient = cashGiven >= totalAmount;

  // Preset Numpad Values
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

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-800">Pembayaran Kasir</h3>
            <p className="text-xs text-slate-500">Order: {order.orderNumber || order.id.slice(0, 8)}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5">
          {/* Total Box */}
          <div className="bg-[#E6F4F1] border border-[#0D5C53]/20 rounded-2xl p-4 text-center">
            <span className="text-xs font-semibold text-[#0D5C53] uppercase tracking-wider">Total Tagihan</span>
            <div className="text-3xl font-extrabold text-[#0D5C53] mt-0.5">
              Rp {totalAmount.toLocaleString('id-ID')}
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setMethod('CASH')}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-semibold transition-all cursor-pointer ${
                method === 'CASH'
                  ? 'border-[#0D5C53] bg-[#0D5C53] text-white shadow-xs'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Banknote className="w-4 h-4" />
              <span>Tunai (Cash)</span>
            </button>

            <button
              onClick={() => setMethod('QRIS')}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-semibold transition-all cursor-pointer ${
                method === 'QRIS'
                  ? 'border-[#0D5C53] bg-[#0D5C53] text-white shadow-xs'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>QRIS</span>
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-3">
              {error}
            </div>
          )}

          {/* Content by Method */}
          {method === 'CASH' ? (
            <div className="space-y-4">
              {/* Cash input & presets */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-2">
                  Uang Diterima
                </label>
                <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-right text-2xl font-bold text-slate-800">
                  Rp {cashGiven.toLocaleString('id-ID')}
                </div>
              </div>

              {/* Quick Presets */}
              <div className="grid grid-cols-4 gap-2">
                {PRESET_AMOUNTS.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => setCashGiven(preset.value)}
                    className="py-2 px-1 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 rounded-xl text-xs font-semibold text-center transition-colors cursor-pointer truncate"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Touch Numpad Grid */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '000', '0'].map((num) => (
                  <button
                    key={num}
                    onClick={() => handleNumpadPress(num)}
                    className="py-3 bg-white border border-slate-200 hover:bg-slate-50 active:bg-slate-100 rounded-xl text-lg font-bold text-slate-800 transition-colors cursor-pointer"
                  >
                    {num}
                  </button>
                ))}
                <button
                  onClick={handleNumpadBackspace}
                  className="py-3 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-xl flex items-center justify-center text-slate-700 transition-colors cursor-pointer"
                >
                  <Delete className="w-5 h-5" />
                </button>
              </div>

              {/* Change calculation */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">Kembalian:</span>
                <span
                  className={`text-lg font-bold ${
                    isCashSufficient ? 'text-emerald-600' : 'text-slate-400'
                  }`}
                >
                  Rp {changeAmount.toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 space-y-4">
              <div className="w-48 h-48 mx-auto bg-white border-2 border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center shadow-xs">
                <QrCode className="w-36 h-36 text-slate-900" />
                <span className="text-[10px] font-bold text-slate-600 mt-1 uppercase tracking-widest">QRIS STANDAR</span>
              </div>
              <p className="text-xs text-slate-500">
                Arahkan pelanggan untuk memindai QRIS melalui GoPay, OVO, Dana, ShopeePay, atau Mobile Banking.
              </p>
            </div>
          )}
        </div>

        {/* Footer Submit */}
        <div className="p-4 bg-slate-50 border-t border-slate-100">
          <button
            onClick={handleProcessPayment}
            disabled={loading || (method === 'CASH' && !isCashSufficient)}
            className="w-full bg-[#0D5C53] hover:bg-[#094740] active:scale-[0.99] text-white py-3.5 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Memproses Pembayaran...</span>
              </>
            ) : (
              <>
                <span>Selesaikan Transaksi (Rp {totalAmount.toLocaleString('id-ID')})</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

