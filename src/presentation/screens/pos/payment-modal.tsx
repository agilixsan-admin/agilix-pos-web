import React, { useState } from 'react';
import type { Order, PaymentMethod } from '@model/Order';
import { posService } from '@domain/services/pos-service';
import { Banknote, QrCode, Delete, ArrowRight, AlertCircle } from 'lucide-react';
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Pembayaran Kasir"
      subtitle={`Order: ${order.orderNumber || order.id.slice(0, 8)}`}
      maxWidth="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button
            variant="primary"
            size="lg"
            isLoading={loading}
            rightIcon={<ArrowRight className="w-4 h-4" />}
            onClick={handleProcessPayment}
          >
            Selesaikan Transaksi
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Total Due Banner */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center">
          <span className="text-xs text-slate-500 block mb-1">Total Tagihan</span>
          <div className="text-2xl font-bold text-[#0D5C53]">
            Rp {totalAmount.toLocaleString('id-ID')}
          </div>
        </div>

        {/* Payment Methods */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setMethod('CASH')}
            className={`flex items-center gap-3 p-3.5 rounded-xl border font-bold text-xs transition-all cursor-pointer ${
              method === 'CASH'
                ? 'border-[#0D5C53] bg-teal-50 text-[#0D5C53]'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Banknote className="w-5 h-5" />
            <span>Uang Tunai (Cash)</span>
          </button>

          <button
            type="button"
            onClick={() => setMethod('QRIS')}
            className={`flex items-center gap-3 p-3.5 rounded-xl border font-bold text-xs transition-all cursor-pointer ${
              method === 'QRIS'
                ? 'border-[#0D5C53] bg-teal-50 text-[#0D5C53]'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <QrCode className="w-5 h-5" />
            <span>QRIS / E-Wallet</span>
          </button>
        </div>

        {/* Method = CASH Form & Numpad */}
        {method === 'CASH' ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <span className="text-slate-600 font-semibold">Uang Diterima:</span>
              <span className="text-base font-bold text-slate-900 font-mono">
                Rp {cashGiven.toLocaleString('id-ID')}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs">
              <span className="text-emerald-800 font-semibold">Kembalian:</span>
              <span className="text-base font-bold text-emerald-800 font-mono">
                Rp {changeAmount.toLocaleString('id-ID')}
              </span>
            </div>

            {/* Quick Presets */}
            <div className="grid grid-cols-4 gap-2">
              {PRESET_AMOUNTS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCashGiven(preset.value)}
                  className="py-2 px-1 text-center bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Numpad */}
            <div className="grid grid-cols-3 gap-2">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '000'].map((btn) => (
                <button
                  key={btn}
                  type="button"
                  onClick={() => handleNumpadPress(btn)}
                  className="py-3 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl font-bold text-sm text-slate-800 cursor-pointer shadow-xs active:scale-95 transition-all"
                >
                  {btn}
                </button>
              ))}
              <button
                type="button"
                onClick={handleNumpadBackspace}
                className="py-3 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 rounded-xl font-bold text-sm flex items-center justify-center cursor-pointer shadow-xs active:scale-95 transition-all"
              >
                <Delete className="w-5 h-5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="p-8 border border-dashed border-slate-200 rounded-2xl text-center space-y-3">
            <QrCode className="w-20 h-20 mx-auto text-slate-700" />
            <div className="text-xs text-slate-600 font-medium">
              Arahkan pelanggan untuk scan QRIS statis / dinamis di kasir.
            </div>
            <Badge variant="success">
              Rp {totalAmount.toLocaleString('id-ID')}
            </Badge>
          </div>
        )}
      </div>
    </Modal>
  );
};
