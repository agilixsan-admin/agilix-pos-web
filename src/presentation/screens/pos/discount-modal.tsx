import React, { useState } from 'react';
import type { DiscountItem } from '@model/Settings';
import { Modal, Button, Badge, RupiahInput } from '@presentation/components/ui';
import { Tag, Check, Percent, DollarSign } from 'lucide-react';
import { useDiscounts } from '@domain/hooks/queries/use-settings-query';
import { useAuthStore } from '@domain/state/auth-store';

interface DiscountModalProps {
  isOpen: boolean;
  onClose: () => void;
  subtotal: number;
  selectedDiscountId: string | null;
  onApplyDiscount: (discount: { id: string | null; name: string | null; amount: number }) => void;
}

export const DiscountModal: React.FC<DiscountModalProps> = ({
  isOpen,
  onClose,
  subtotal,
  selectedDiscountId,
  onApplyDiscount,
}) => {
  const currentOutlet = useAuthStore((state) => state.currentOutlet);
  const { data: discounts = [], isLoading } = useDiscounts({
    outletId: currentOutlet?.id,
    status: 'ACTIVE',
  });

  const [customType, setCustomType] = useState<'PERCENT' | 'FIXED'>('PERCENT');
  const [customValue, setCustomValue] = useState<string>('');

  if (!isOpen) return null;

  const calculateDiscountAmount = (item: DiscountItem) => {
    if (item.minOrderAmount && subtotal < item.minOrderAmount) {
      return 0;
    }
    if (item.type === 'PERCENTAGE') {
      const calculated = Math.round((subtotal * item.value) / 100);
      return item.maxDiscountAmount ? Math.min(calculated, item.maxDiscountAmount) : calculated;
    }
    return Math.min(item.value, subtotal);
  };

  const handleApplyCustom = () => {
    const val = parseFloat(customValue) || 0;
    if (val <= 0) return;

    let amount = 0;
    if (customType === 'PERCENT') {
      amount = Math.round((subtotal * Math.min(val, 100)) / 100);
    } else {
      amount = Math.min(val, subtotal);
    }

    onApplyDiscount({
      id: null,
      name: customType === 'PERCENT' ? `Diskon Manual (${val}%)` : `Potongan Manual (Rp ${val.toLocaleString('id-ID')})`,
      amount,
    });
    onClose();
  };

  const handleRemoveDiscount = () => {
    onApplyDiscount({
      id: null,
      name: null,
      amount: 0,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Pilih Diskon / Promo"
      subtitle={`Subtotal Pesanan: Rp ${subtotal.toLocaleString('id-ID')}`}
      maxWidth="md"
      footer={
        <div className="flex items-center justify-between w-full">
          {selectedDiscountId ? (
            <Button variant="danger" size="sm" onClick={handleRemoveDiscount}>
              Hapus Diskon
            </Button>
          ) : (
            <div />
          )}
          <Button variant="outline" onClick={onClose}>
            Tutup
          </Button>
        </div>
      }
    >
      <div className="space-y-4 py-1">
        {/* Active Promotions List */}
        <div>
          <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Promo & Diskon Aktif
          </h5>

          {isLoading ? (
            <div className="text-center py-6 text-xs text-slate-400">
              Memuat promo aktif...
            </div>
          ) : discounts.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
              Belum ada promo outlet aktif.
            </div>
          ) : (
            <div className="space-y-2 max-h-[35vh] overflow-y-auto pr-1">
              {discounts.map((d) => {
                const discountAmount = calculateDiscountAmount(d);
                const isEligible = !d.minOrderAmount || subtotal >= d.minOrderAmount;
                const isSelected = selectedDiscountId === d.id;

                return (
                  <button
                    key={d.id}
                    disabled={!isEligible}
                    onClick={() => {
                      if (isEligible) {
                        onApplyDiscount({
                          id: d.id,
                          name: d.name,
                          amount: discountAmount,
                        });
                        onClose();
                      }
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-[#2563EB] bg-blue-50/70 dark:bg-blue-950/40 ring-1 ring-[#2563EB]'
                        : isEligible
                        ? 'border-slate-200 dark:border-slate-700 hover:border-[#2563EB] dark:hover:border-blue-500 bg-white dark:bg-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-750'
                        : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 opacity-60 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                          isSelected
                            ? 'bg-[#2563EB] text-white'
                            : 'bg-blue-50 dark:bg-blue-950/60 text-[#2563EB] dark:text-blue-300'
                        }`}
                      >
                        <Tag className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h6 className="font-semibold text-slate-900 dark:text-slate-100 text-xs">{d.name}</h6>
                          <Badge variant={d.type === 'PERCENTAGE' ? 'info' : 'success'} size="sm">
                            {d.type === 'PERCENTAGE' ? `${d.value}%` : `Rp ${d.value.toLocaleString('id-ID')}`}
                          </Badge>
                        </div>
                        {d.minOrderAmount ? (
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                            Min. Belanja: Rp {d.minOrderAmount.toLocaleString('id-ID')}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="text-right">
                      {isEligible ? (
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                          -Rp {discountAmount.toLocaleString('id-ID')}
                        </span>
                      ) : (
                        <span className="text-[10px] text-rose-500 font-medium">
                          Belum memenuhi min. belanja
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Custom Discount Input */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
          <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
            Diskon Manual Kasir
          </h5>
          <div className="flex items-center gap-2">
            <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setCustomType('PERCENT')}
                className={`p-1.5 rounded text-xs font-semibold cursor-pointer ${
                  customType === 'PERCENT' ? 'bg-white dark:bg-slate-700 text-[#2563EB] dark:text-blue-400 shadow-xs' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                <Percent className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setCustomType('FIXED')}
                className={`p-1.5 rounded text-xs font-semibold cursor-pointer ${
                  customType === 'FIXED' ? 'bg-white dark:bg-slate-700 text-[#2563EB] dark:text-blue-400 shadow-xs' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                <DollarSign className="w-3.5 h-3.5" />
              </button>
            </div>

            {customType === 'FIXED' ? (
              <RupiahInput
                showPrefix={false}
                placeholder="Nominal (Rp)"
                value={customValue}
                onValueChange={(val) => setCustomValue(val ? String(val) : '')}
                className="flex-1 py-1.5 px-3 rounded-lg"
              />
            ) : (
              <input
                type="number"
                min="0"
                max="100"
                placeholder="Persen (%)"
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
                className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
              />
            )}

            <Button
              variant="primary"
              size="sm"
              disabled={!customValue || parseFloat(customValue) <= 0}
              onClick={handleApplyCustom}
            >
              Terapkan
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

