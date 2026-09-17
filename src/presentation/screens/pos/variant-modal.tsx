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
          {variants.map((v) => {
            const isVariantOutOfStock = v.isOutOfStock || v.isAvailable === false;

            return (
              <button
                key={v.id || v.name}
                type="button"
                disabled={isVariantOutOfStock}
                onClick={() => {
                  if (isVariantOutOfStock) return;
                  onSelectVariant(product, v);
                  onClose();
                }}
                className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all text-left ${
                  isVariantOutOfStock
                    ? 'border-slate-200 bg-slate-100/60 opacity-60 grayscale cursor-not-allowed select-none'
                    : 'border-slate-200 hover:border-[#0D5C53] hover:bg-teal-50/40 cursor-pointer group bg-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                      isVariantOutOfStock
                        ? 'bg-slate-200 text-slate-400'
                        : 'bg-slate-100 group-hover:bg-[#0D5C53]/10 text-slate-600 group-hover:text-[#0D5C53]'
                    }`}
                  >
                    <Check
                      className={`w-4 h-4 ${
                        isVariantOutOfStock
                          ? 'opacity-0'
                          : 'opacity-0 group-hover:opacity-100 transition-opacity'
                      }`}
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h5
                        className={`font-semibold text-sm ${
                          isVariantOutOfStock ? 'text-slate-500 line-through' : 'text-slate-800'
                        }`}
                      >
                        {v.name}
                      </h5>
                      {isVariantOutOfStock && (
                        <Badge variant="danger" size="sm">
                          Habis
                        </Badge>
                      )}
                    </div>
                    {v.sku && (
                      <span className="text-[11px] text-slate-400 font-mono">SKU: {v.sku}</span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`font-bold text-sm block ${
                      isVariantOutOfStock ? 'text-slate-400' : 'text-[#0D5C53]'
                    }`}
                  >
                    Rp {Number(v.price).toLocaleString('id-ID')}
                  </span>
                  {v.stock !== undefined && !isVariantOutOfStock && (
                    <span className="text-[10px] text-slate-400">
                      Stok: {v.stock}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </Modal>
  );
};

