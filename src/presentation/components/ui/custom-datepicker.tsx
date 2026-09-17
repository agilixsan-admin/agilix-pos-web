import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';

const MONTH_NAMES = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

const DAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

export const formatDateToYMD = (date: Date): string => {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

export const parseYMDToDate = (ymdString?: string): Date | null => {
  if (!ymdString) return null;
  const parts = ymdString.split('-');
  if (parts.length !== 3) return null;
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return null;
  return new Date(y, m, d);
};

export const formatDateDisplay = (ymdString?: string): string => {
  const d = parseYMDToDate(ymdString);
  if (!d) return '';
  return `${d.getDate()} ${MONTH_NAMES[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`;
};

export interface CustomDatePickerProps {
  value?: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  minDate?: string;
  maxDate?: string;
  className?: string;
  compact?: boolean;
  align?: 'left' | 'right' | 'auto';
}

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  value,
  onChange,
  placeholder = 'Pilih Tanggal',
  disabled = false,
  minDate,
  maxDate,
  className = '',
  compact = false,
  align = 'auto',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [popoverAlign, setPopoverAlign] = useState<'left' | 'right'>('left');
  const containerRef = useRef<HTMLDivElement>(null);

  // Dynamic popover positioning to avoid overflow on right screen edge
  useEffect(() => {
    if (align && align !== 'auto') {
      setPopoverAlign(align);
      return;
    }
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      if (rect.left + 290 > window.innerWidth) {
        setPopoverAlign('right');
      } else {
        setPopoverAlign('left');
      }
    }
  }, [isOpen, align]);

  // Current viewing month and year
  const initialDate = parseYMDToDate(value) || new Date();
  const [viewDate, setViewDate] = useState<Date>(
    new Date(initialDate.getFullYear(), initialDate.getMonth(), 1)
  );

  // Synchronize viewDate when value changes
  useEffect(() => {
    if (value) {
      const d = parseYMDToDate(value);
      if (d) setViewDate(new Date(d.getFullYear(), d.getMonth(), 1));
    }
  }, [value]);

  // Click outside to close
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

  const prevMonth = () => {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleSelectDate = (date: Date) => {
    onChange(formatDateToYMD(date));
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  const handleSelectToday = () => {
    const today = new Date();
    onChange(formatDateToYMD(today));
    setViewDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setIsOpen(false);
  };

  // Build month calendar grid
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const todayStr = formatDateToYMD(new Date());

  const days = [];

  // Previous month padding
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const d = new Date(year, month - 1, daysInPrevMonth - i);
    days.push({ date: d, isCurrentMonth: false });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(year, month, d);
    days.push({ date: dateObj, isCurrentMonth: true });
  }

  // Next month padding to fill 35 or 42 grid cells
  const remaining = (7 - (days.length % 7)) % 7;
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(year, month + 1, i);
    days.push({ date: d, isCurrentMonth: false });
  }

  const displayText = value ? formatDateDisplay(value) : '';

  return (
    <div ref={containerRef} className={`relative ${isOpen ? 'z-50' : 'z-10'} ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between gap-2 border rounded-xl transition-all cursor-pointer ${
          compact ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-xs'
        } ${
          disabled
            ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
            : isOpen
              ? 'bg-white border-[#0D5C53] ring-2 ring-[#0D5C53]/15 text-slate-900 shadow-xs'
              : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
        }`}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2 min-w-0 truncate">
          <CalendarIcon className="w-4 h-4 text-[#0D5C53] shrink-0" />
          <span className={`truncate font-medium ${!displayText ? 'text-slate-400' : 'text-slate-800'}`}>
            {displayText || placeholder}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {value && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              className="p-0.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
              title="Hapus tanggal"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
        </div>
      </button>

      {/* Floating Calendar Popover */}
      {isOpen && !disabled && (
        <div className={`absolute z-50 ${popoverAlign === 'right' ? 'right-0' : 'left-0'} top-full mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl p-3.5 w-64 sm:w-72 animate-in fade-in-0 zoom-in-95 duration-100`}>
          {/* Calendar Header: Month/Year and Nav Arrows */}
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Bulan sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="text-xs font-bold text-slate-800">
              {MONTH_NAMES[month]} {year}
            </div>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Bulan berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Weekday Names */}
          <div className="grid grid-cols-7 text-center pt-2 pb-1 text-[11px] font-semibold text-slate-400">
            {DAY_NAMES.map((d, idx) => (
              <div key={idx}>{d}</div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 pt-1 text-xs">
            {days.map(({ date, isCurrentMonth }, idx) => {
              const dateStr = formatDateToYMD(date);
              const isSelected = value === dateStr;
              const isToday = dateStr === todayStr;

              // Check min / max constraints
              const isDisabled =
                Boolean(minDate && dateStr < minDate) ||
                Boolean(maxDate && dateStr > maxDate);

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => handleSelectDate(date)}
                  className={`h-8 w-8 mx-auto flex items-center justify-center rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#0D5C53] text-white font-bold shadow-xs'
                      : isToday
                        ? 'bg-teal-50 text-[#0D5C53] font-bold border border-[#0D5C53]/30'
                        : isCurrentMonth
                          ? 'text-slate-700 hover:bg-slate-100'
                          : 'text-slate-300 hover:bg-slate-50'
                  } ${isDisabled ? 'opacity-30 cursor-not-allowed hover:bg-transparent' : ''}`}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          {/* Quick Footer Action: Hari Ini */}
          <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-100 text-[11px]">
            <button
              type="button"
              onClick={handleSelectToday}
              className="text-[#0D5C53] hover:text-[#094740] font-bold hover:underline cursor-pointer"
            >
              Pilih Hari Ini
            </button>
            {value && (
              <button
                type="button"
                onClick={handleClear}
                className="text-slate-400 hover:text-rose-600 font-medium transition-colors cursor-pointer"
              >
                Kosongkan
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export interface FormDatePickerProps {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  value?: string;
  onChange?: (value: string) => void;
  onEventChange?: (e: { target: { value: string; name?: string } }) => void;
  onValueChange?: (value: string) => void;
  name?: string;
  placeholder?: string;
  disabled?: boolean;
  minDate?: string;
  maxDate?: string;
  className?: string;
  align?: 'left' | 'right' | 'auto';
}

export const FormDatePicker: React.FC<FormDatePickerProps> = ({
  label,
  error,
  helperText,
  required,
  value = '',
  onChange,
  onEventChange,
  onValueChange,
  name,
  placeholder,
  disabled,
  minDate,
  maxDate,
  className = '',
  align = 'auto',
}) => {
  const handleChange = (newVal: string) => {
    if (onValueChange) {
      onValueChange(newVal);
    }
    if (onChange) {
      onChange(newVal);
    }
    if (onEventChange) {
      onEventChange({ target: { value: newVal, name } });
    }
  };

  return (
    <div className={`space-y-1.5 w-full ${className}`}>
      {label && (
        <label className="block text-xs font-semibold text-slate-700">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <CustomDatePicker
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        minDate={minDate}
        maxDate={maxDate}
        align={align}
      />
      {error && <p className="text-[11px] text-rose-600 font-medium">{error}</p>}
      {helperText && !error && <p className="text-[11px] text-slate-400">{helperText}</p>}
    </div>
  );
};

