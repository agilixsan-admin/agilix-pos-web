import React, { useState, useRef, useEffect } from 'react';
import { Utensils, Building2, ChevronDown, Check, Lock } from 'lucide-react';
import type { Table } from '@model/Settings';
import type { Outlet } from '@model/Auth';

interface CustomTableSelectProps {
  tables: Table[];
  selectedTableId: string | null | undefined;
  onSelectTable: (table: { id: string; name: string } | null) => void;
  disabled?: boolean;
  resolvedAppendTableName?: string | null;
  placeholder?: string;
  className?: string;
}

export const CustomTableSelect: React.FC<CustomTableSelectProps> = ({
  tables,
  selectedTableId,
  onSelectTable,
  disabled = false,
  resolvedAppendTableName,
  placeholder = 'Pilih Meja...',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Determine current selected label
  const selectedTable = tables.find((t) => t.id === selectedTableId);
  const displayText = selectedTable
    ? `Meja ${selectedTable.name}`
    : selectedTableId
      ? `Meja ${resolvedAppendTableName || 'Terpilih'}`
      : placeholder;

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between gap-1.5 px-3 py-2 rounded-xl text-xs transition-all border ${
          disabled
            ? 'bg-amber-50/80 border-amber-300/80 text-amber-950 font-semibold cursor-not-allowed opacity-90'
            : isOpen
              ? 'bg-white border-[#0D5C53] ring-2 ring-[#0D5C53]/15 text-slate-900 shadow-xs cursor-pointer'
              : 'bg-slate-50 hover:bg-white border-slate-200 text-slate-800 hover:border-slate-300 cursor-pointer'
        }`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-1.5 min-w-0 truncate">
          {disabled ? (
            <Lock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
          ) : (
            <Utensils className="w-3.5 h-3.5 text-[#0D5C53] shrink-0" />
          )}
          <span className="truncate font-semibold">{displayText}</span>
          {selectedTable && (
            <span className="text-[10px] text-slate-400 font-normal shrink-0">
              ({selectedTable.capacity} Kursi)
            </span>
          )}
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-[#0D5C53]' : ''
          }`}
        />
      </button>

      {/* Floating Menu Popover */}
      {isOpen && !disabled && (
        <div className="absolute z-50 left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl p-1 max-h-60 overflow-y-auto min-w-[200px] animate-in fade-in-0 zoom-in-95 duration-100">
          {/* Option: Kosongkan Meja */}
          <button
            type="button"
            onClick={() => {
              onSelectTable(null);
              setIsOpen(false);
            }}
            className={`w-full flex items-center justify-between px-2.5 py-2 text-xs rounded-lg transition-colors cursor-pointer text-left ${
              !selectedTableId
                ? 'bg-slate-100 text-slate-900 font-bold'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
            }`}
          >
            <span>-- Belum Pilih Meja --</span>
            {!selectedTableId && <Check className="w-3.5 h-3.5 text-slate-600" />}
          </button>

          {/* If append order has custom table not currently in tables list */}
          {selectedTableId && !selectedTable && (
            <div className="flex items-center justify-between px-2.5 py-2 text-xs rounded-lg bg-teal-50 text-[#0D5C53] font-bold">
              <span>Meja {resolvedAppendTableName || 'Terpilih'}</span>
              <Check className="w-3.5 h-3.5 text-[#0D5C53]" />
            </div>
          )}

          {/* Tables List */}
          {tables.map((table) => {
            const isSelected = selectedTableId === table.id;
            return (
              <button
                key={table.id}
                type="button"
                onClick={() => {
                  onSelectTable({ id: table.id, name: table.name });
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-2 text-xs rounded-lg transition-colors cursor-pointer text-left ${
                  isSelected
                    ? 'bg-teal-50/80 text-[#0D5C53] font-bold'
                    : 'text-slate-800 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-semibold">Meja {table.name}</span>
                  <span className="text-[10px] text-slate-400">({table.capacity} Kursi)</span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-[#0D5C53] shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

interface CustomOutletSelectProps {
  outlets: Outlet[];
  selectedOutletId: string | undefined;
  onSelectOutlet: (outlet: Outlet) => void;
  className?: string;
  compact?: boolean;
}

export const CustomOutletSelect: React.FC<CustomOutletSelectProps> = ({
  outlets,
  selectedOutletId,
  onSelectOutlet,
  className = '',
  compact = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const selectedOutlet = outlets.find((o) => o.id === selectedOutletId) || outlets[0];

  return (
    <div ref={containerRef} className={`relative shrink-0 ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center gap-1.5 bg-slate-50 hover:bg-white border border-slate-200 hover:border-slate-300 rounded-xl transition-all cursor-pointer ${
          compact ? 'px-2 py-1 text-xs' : 'px-2.5 py-1.5 text-xs'
        } ${isOpen ? 'ring-2 ring-[#0D5C53]/20 border-[#0D5C53] bg-white' : ''}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <Building2 className="w-3.5 h-3.5 text-[#0D5C53] shrink-0" />
        <span className="font-bold text-slate-800 truncate max-w-[120px] sm:max-w-[180px]">
          {selectedOutlet?.name || 'Pilih Cabang'}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-[#0D5C53]' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 left-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl p-1 min-w-[180px] max-h-60 overflow-y-auto animate-in fade-in-0 zoom-in-95 duration-100">
          <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Pilih Cabang Aktif
          </div>
          {outlets.map((outlet) => {
            const isSelected = outlet.id === selectedOutlet?.id;
            return (
              <button
                key={outlet.id}
                type="button"
                onClick={() => {
                  onSelectOutlet(outlet);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 text-xs rounded-lg transition-colors cursor-pointer text-left ${
                  isSelected
                    ? 'bg-teal-50 text-[#0D5C53] font-bold'
                    : 'text-slate-800 hover:bg-slate-50'
                }`}
              >
                <span className="truncate">{outlet.name}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-[#0D5C53]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export interface CustomSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  badge?: string;
}

export interface CustomSelectProps {
  options: CustomSelectOption[];
  value: string | undefined;
  onChange: (value: string) => void | Promise<void>;
  placeholder?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  className?: string;
  compact?: boolean;
  buttonClassName?: string;
  ariaLabel?: string;
  align?: 'left' | 'right' | 'auto';
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Pilih...',
  icon,
  disabled = false,
  className = '',
  compact = false,
  buttonClassName = '',
  ariaLabel,
  align = 'auto',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [menuAlign, setMenuAlign] = useState<'left' | 'right'>('left');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (align && align !== 'auto') {
      setMenuAlign(align);
      return;
    }
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      if (rect.left + 200 > window.innerWidth) {
        setMenuAlign('right');
      } else {
        setMenuAlign('left');
      }
    }
  }, [isOpen, align]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const selectedOption = options.find((o) => o.value === value);

  return (
    <div ref={containerRef} className={`relative shrink-0 ${isOpen ? 'z-50' : 'z-10'} ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between gap-1.5 border rounded-xl transition-all ${
          compact ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-xs'
        } ${
          disabled
            ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
            : isOpen
              ? 'bg-white border-[#0D5C53] ring-2 ring-[#0D5C53]/15 text-slate-900 shadow-xs cursor-pointer'
              : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800 cursor-pointer'
        } ${buttonClassName}`}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-1.5 min-w-0 truncate">
          {icon && <span className="shrink-0 text-[#0D5C53]">{icon}</span>}
          <span className={`truncate font-medium ${!selectedOption ? 'text-slate-400' : 'text-slate-800'}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          {selectedOption?.badge && (
            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full shrink-0">
              {selectedOption.badge}
            </span>
          )}
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-[#0D5C53]' : ''
          }`}
        />
      </button>

      {isOpen && !disabled && (
        <div className={`absolute z-50 ${menuAlign === 'right' ? 'right-0' : 'left-0'} top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl p-1 min-w-[160px] max-h-60 overflow-y-auto animate-in fade-in-0 zoom-in-95 duration-100`}>
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                disabled={opt.disabled}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 text-xs rounded-lg transition-colors cursor-pointer text-left ${
                  isSelected
                    ? 'bg-teal-50 text-[#0D5C53] font-bold'
                    : 'text-slate-800 hover:bg-slate-50'
                } ${opt.disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                <span className="truncate">{opt.label}</span>
                <div className="flex items-center gap-1 shrink-0">
                  {opt.badge && (
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full">
                      {opt.badge}
                    </span>
                  )}
                  {isSelected && <Check className="w-3.5 h-3.5 text-[#0D5C53]" />}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
