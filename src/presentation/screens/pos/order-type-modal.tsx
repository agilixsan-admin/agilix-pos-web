import React from 'react';
import type { OrderType } from '@model/Order';
import { Utensils, ShoppingBag, ArrowRight } from 'lucide-react';
import { Button, Modal } from '@presentation/components/ui';

interface OrderTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedType: OrderType;
  onSelectType: (type: OrderType) => void;
  onContinue: () => void;
}

export const OrderTypeModal: React.FC<OrderTypeModalProps> = ({
  isOpen,
  onClose,
  selectedType,
  onSelectType,
  onContinue,
}) => {
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Pilih Tipe Pesanan"
      subtitle="Tentukan jenis layanan untuk pesanan pelanggan"
      maxWidth="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button
            variant="primary"
            rightIcon={<ArrowRight className="w-4 h-4" />}
            onClick={onContinue}
          >
            Lanjutkan
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
        {/* Dine In Card */}
        <div
          onClick={() => onSelectType('DINE_IN')}
          className={`p-6 rounded-2xl border-2 flex flex-col items-center text-center cursor-pointer transition-all ${
            selectedType === 'DINE_IN'
              ? 'border-[#2563EB] bg-blue-50/60 dark:bg-blue-950/40 shadow-sm ring-1 ring-[#2563EB]'
              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-750'
          }`}
        >
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-colors ${
              selectedType === 'DINE_IN'
                ? 'bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            <Utensils className="w-8 h-8" />
          </div>
          <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">Dine In</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Makan di tempat dengan pemilihan nomor meja dan layanan staf.
          </p>
          <div className="mt-4">
            <span
              className={`text-xs font-semibold px-3 py-1 rounded-full ${
                selectedType === 'DINE_IN'
                  ? 'bg-blue-100 dark:bg-blue-900/60 text-[#2563EB] dark:text-blue-300'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
              }`}
            >
              {selectedType === 'DINE_IN' ? '✓ Dipilih' : 'Pilih'}
            </span>
          </div>
        </div>

        {/* Take Away Card */}
        <div
          onClick={() => onSelectType('TAKE_AWAY')}
          className={`p-6 rounded-2xl border-2 flex flex-col items-center text-center cursor-pointer transition-all ${
            selectedType === 'TAKE_AWAY'
              ? 'border-[#2563EB] bg-blue-50/60 dark:bg-blue-950/40 shadow-sm ring-1 ring-[#2563EB]'
              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-750'
          }`}
        >
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-colors ${
              selectedType === 'TAKE_AWAY'
                ? 'bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">Take Away</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Pesanan dibungkus / dibawa pulang langsung tanpa memilih meja.
          </p>
          <div className="mt-4">
            <span
              className={`text-xs font-semibold px-3 py-1 rounded-full ${
                selectedType === 'TAKE_AWAY'
                  ? 'bg-blue-100 dark:bg-blue-900/60 text-[#2563EB] dark:text-blue-300'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
              }`}
            >
              {selectedType === 'TAKE_AWAY' ? '✓ Dipilih' : 'Pilih'}
            </span>
          </div>
        </div>
      </div>
    </Modal>
  );
};

