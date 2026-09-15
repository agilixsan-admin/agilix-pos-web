import React from 'react';
import type { Product, Variant } from '@model/Product';
import { Modal, Button, Badge } from '@presentation/components/ui';
import { Check } from 'lucide-react';

interface VariantModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onSelectVariant: (product: Product, variant: Variant) => void;
}

export const VariantModal: React.FC<VariantModalProps> = ({
  isOpen,
  onClose,
  product,
  onSelectVariant,
}) => {
  if (!isOpen || !product) return null;

  const variants = product.variants || [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Pilih Varian Menu"
      subtitle={product.name}
      maxWidth="md"
      footer={
        <Button variant="outline" onClick={onClose}>
          Tutup
        </Button>
      }
    >
      <div className="space-y-3 py-1">
        <p className="text-xs text-slate-500">
          Silakan pilih ukuran, level, atau tipe varian yang diinginkan:
        </p>

        <div className="grid grid-cols-1 gap-2.5 max-h-[50vh] overflow-y-auto pr-1">
          {variants.map((v) => (
            <button
              key={v.id || v.name}
              onClick={() => {
                onSelectVariant(product, v);
                onClose();
              }}
              className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-[#0D5C53] hover:bg-teal-50/40 transition-all cursor-pointer text-left group bg-white"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-[#0D5C53]/10 flex items-center justify-center text-slate-600 group-hover:text-[#0D5C53] transition-colors">
                  <Check className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div>
                  <h5 className="font-semibold text-slate-800 text-sm">{v.name}</h5>
                  {v.sku && (
                    <span className="text-[11px] text-slate-400 font-mono">SKU: {v.sku}</span>
                  )}
                </div>
              </div>

              <div className="text-right">
                <span className="font-bold text-[#0D5C53] text-sm block">
                  Rp {Number(v.price).toLocaleString('id-ID')}
                </span>
                {v.stock !== undefined && (
                  <span className="text-[10px] text-slate-400">
                    Stok: {v.stock}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
};

