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
              ? 'border-[#0D5C53] bg-teal-50/50 shadow-sm ring-1 ring-[#0D5C53]'
              : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
          }`}
        >
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-colors ${
              selectedType === 'DINE_IN'
                ? 'bg-[#0D5C53] text-white'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            <Utensils className="w-8 h-8" />
          </div>
          <h4 className="text-base font-bold text-slate-900 mb-1">Dine In</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Makan di tempat dengan pemilihan nomor meja dan layanan staf.
          </p>
          <div className="mt-4">
            <span
              className={`text-xs font-semibold px-3 py-1 rounded-full ${
                selectedType === 'DINE_IN'
                  ? 'bg-teal-100 text-[#0D5C53]'
                  : 'bg-slate-100 text-slate-500'
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
              ? 'border-[#0D5C53] bg-teal-50/50 shadow-sm ring-1 ring-[#0D5C53]'
              : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
          }`}
        >
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-colors ${
              selectedType === 'TAKE_AWAY'
                ? 'bg-[#0D5C53] text-white'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h4 className="text-base font-bold text-slate-900 mb-1">Take Away</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Pesanan dibungkus / dibawa pulang langsung tanpa memilih meja.
          </p>
          <div className="mt-4">
            <span
              className={`text-xs font-semibold px-3 py-1 rounded-full ${
                selectedType === 'TAKE_AWAY'
                  ? 'bg-teal-100 text-[#0D5C53]'
                  : 'bg-slate-100 text-slate-500'
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

