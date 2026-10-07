import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Building2, ChevronDown, Check, X } from 'lucide-react';
import { useFloatingPortal } from './use-floating-portal';

export interface OutletOption {
  id: string;
  name: string;
}

export interface MultiOutletSelectProps {
  label?: string;
  outlets: OutletOption[];
  selectedOutletIds: string[];
  onChange: (selectedIds: string[]) => void;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  helperText?: React.ReactNode;
  placeholder?: string;
  className?: string;
}

export const MultiOutletSelect: React.FC<MultiOutletSelectProps> = ({
  label,
  outlets,
  selectedOutletIds,
  onChange,
  disabled = false,
  required = false,
  error,
  helperText,
  placeholder = 'Pilih Cabang...',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { triggerRef, menuRef, coords } = useFloatingPortal({
    isOpen,
    onClose: () => setIsOpen(false),
    minWidth: 260,
    matchWidth: true,
    expectedHeight: 320,
  });

  const selectedOutlets = outlets.filter((o) => selectedOutletIds.includes(o.id));
  const isAllSelected = outlets.length > 0 && selectedOutletIds.length === outlets.length;

  const handleToggle = (id: string) => {
    if (disabled) return;
    if (selectedOutletIds.includes(id)) {
      onChange(selectedOutletIds.filter((item) => item !== id));
    } else {
      onChange([...selectedOutletIds, id]);
    }
  };

  const handleSelectAll = () => {
    if (disabled) return;
    if (isAllSelected) {
      onChange([]);
    } else {
      onChange(outlets.map((o) => o.id));
    }
  };

  const handleRemove = (id: string) => {
    if (disabled) return;
    onChange(selectedOutletIds.filter((item) => item !== id));
  };

  const getDisplayText = () => {
    if (selectedOutletIds.length === 0) {
      return placeholder;
    }
    if (isAllSelected && outlets.length > 1) {
      return `Semua Cabang (${outlets.length} Terpilih)`;
    }
    if (selectedOutletIds.length === 1) {
      return selectedOutlets[0]?.name || placeholder;
    }
    return `${selectedOutletIds.length} Cabang Dipilih`;
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="block text-xs font-semibold text-slate-700">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      {/* Trigger Button */}
      <div className="relative">
        <button
          ref={triggerRef}
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen((prev) => !prev)}
          className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs transition-all border ${
            disabled
              ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
              : error
                ? 'bg-white border-rose-300 ring-2 ring-rose-100 text-slate-900 cursor-pointer'
                : isOpen
                  ? 'bg-white border-[#0D5C53] ring-2 ring-[#0D5C53]/15 text-slate-900 shadow-xs cursor-pointer'
                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800 cursor-pointer'
          }`}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <div className="flex items-center gap-2 min-w-0 truncate">
            <Building2 className={`w-3.5 h-3.5 shrink-0 ${disabled ? 'text-slate-400' : 'text-[#0D5C53]'}`} />
            <span
              className={`truncate font-medium ${
                selectedOutletIds.length === 0 ? 'text-slate-400' : 'text-slate-800'
              }`}
            >
              {getDisplayText()}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {selectedOutletIds.length > 1 && !isAllSelected && (
              <span className="text-[10px] bg-teal-50 text-[#0D5C53] font-bold px-2 py-0.5 rounded-full border border-teal-200/80">
                {selectedOutletIds.length} Cabang
              </span>
            )}
            {isAllSelected && outlets.length > 1 && (
              <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full border border-emerald-200/80">
                Semua
              </span>
            )}
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                isOpen ? 'rotate-180 text-[#0D5C53]' : ''
              }`}
            />
          </div>
        </button>
      </div>

      {/* Selected Outlets Badges / Chips */}
      {selectedOutlets.length > 0 && !disabled && (
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {selectedOutlets.map((o) => (
            <span
              key={o.id}
              className="inline-flex items-center gap-1 text-[11px] bg-teal-50/80 text-[#0D5C53] font-medium px-2 py-0.5 rounded-lg border border-teal-200/60 shadow-2xs"
            >
              <Building2 className="w-3 h-3 text-[#0D5C53]" />
              <span className="truncate max-w-[180px]">{o.name}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(o.id);
                }}
                className="hover:text-rose-600 hover:bg-rose-50 rounded-full p-0.5 transition-colors cursor-pointer"
                title={`Hapus ${o.name}`}
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Error / Helper text */}
      {error && <p className="text-[11px] text-rose-500 font-medium">{error}</p>}
      {!error && helperText && (
        <div className="text-[11px] text-slate-400 flex items-center gap-1">
          {helperText}
        </div>
      )}

      {/* Dropdown Menu Portaled to document.body */}
      {isOpen && !disabled && coords && createPortal(
        <div
          ref={menuRef}
          style={{
            position: 'fixed',
            top: coords.top !== undefined ? `${coords.top}px` : 'auto',
            bottom: coords.bottom !== undefined ? `${coords.bottom}px` : 'auto',
            left: coords.left !== undefined ? `${coords.left}px` : 'auto',
            right: coords.right !== undefined ? `${coords.right}px` : 'auto',
            width: coords.width ? `${coords.width}px` : 'auto',
            minWidth: `${coords.minWidth}px`,
            maxHeight: `${coords.maxHeight}px`,
            zIndex: 99999,
          }}
          className="bg-white border border-slate-200 rounded-xl shadow-2xl p-1.5 overflow-hidden flex flex-col animate-in fade-in-0 zoom-in-95 duration-100"
        >
          {/* Menu Header with Quick Action */}
          <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-slate-100 mb-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Pilih Cabang ({selectedOutletIds.length}/{outlets.length})
            </span>
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-[11px] text-[#0D5C53] hover:text-[#09423C] font-semibold hover:underline cursor-pointer"
            >
              {isAllSelected ? 'Kosongkan Semua' : 'Pilih Semua'}
            </button>
          </div>

          {/* Outlets List */}
          <div className="overflow-y-auto space-y-0.5 max-h-[220px] px-0.5 py-0.5">
            {outlets.length === 0 ? (
              <div className="p-3 text-center text-xs text-slate-400">
                Tidak ada cabang yang tersedia.
              </div>
            ) : (
              outlets.map((outlet) => {
                const isChecked = selectedOutletIds.includes(outlet.id);
                return (
                  <button
                    key={outlet.id}
                    type="button"
                    onClick={() => handleToggle(outlet.id)}
                    className={`w-full flex items-center justify-between gap-2.5 px-2.5 py-2 text-xs rounded-lg transition-colors cursor-pointer text-left ${
                      isChecked
                        ? 'bg-teal-50/90 text-[#0D5C53] font-semibold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Custom Checkbox visual */}
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center border transition-colors shrink-0 ${
                          isChecked
                            ? 'bg-[#0D5C53] border-[#0D5C53] text-white'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span className="truncate">{outlet.name}</span>
                    </div>

                    {isChecked && (
                      <span className="text-[10px] font-medium text-[#0D5C53] shrink-0">
                        Dipilih
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer Close Button */}
          <div className="pt-1.5 border-t border-slate-100 mt-1 flex justify-end px-1">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3 py-1 bg-[#0D5C53] text-white text-[11px] font-semibold rounded-lg hover:bg-[#09423C] transition-colors cursor-pointer"
            >
              Selesai
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
