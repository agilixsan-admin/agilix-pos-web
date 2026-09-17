import React, { useState, useRef, useEffect } from 'react';
import { Lock, ChevronDown, Check } from 'lucide-react';

export interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  isLocked?: boolean;
  unit?: string;
}

export const FormInput: React.FC<FormInputProps> = ({
  label,
  error,
  helperText,
  required,
  isLocked,
  unit,
  className = '',
  disabled,
  ...props
}) => {
  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label className="block text-xs font-semibold text-slate-700">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          disabled={disabled || isLocked}
          className={`w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53] transition-all disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed ${
            error ? 'border-rose-300 focus:ring-rose-200 focus:border-rose-500' : ''
          } ${className}`}
          {...props}
        />
        {isLocked && (
          <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        )}
        {unit && !isLocked && (
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 uppercase pointer-events-none">
            {unit}
          </span>
        )}
      </div>
      {error && <p className="text-[11px] text-rose-600 font-medium">{error}</p>}
      {helperText && !error && <p className="text-[11px] text-slate-400">{helperText}</p>}
    </div>
  );
};

export interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  placeholder?: string;
}

export const FormSelect: React.FC<FormSelectProps> = ({
  label,
  error,
  helperText,
  required,
  children,
  className = '',
  value,
  onChange,
  disabled,
  name,
  id,
  placeholder = 'Pilih...',
  ...props
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

  // Extract options from children (<option> elements)
  const options: Array<{ value: string; label: string; disabled?: boolean }> = [];
  React.Children.forEach(children, (child) => {
    if (React.isValidElement(child) && child.type === 'option') {
      const childProps = child.props as { value?: string | number; children?: React.ReactNode; disabled?: boolean };
      const val = childProps.value !== undefined ? String(childProps.value) : '';
      const lbl = typeof childProps.children === 'string' ? childProps.children : String(childProps.children || val);
      options.push({ value: val, label: lbl, disabled: childProps.disabled });
    }
  });

  const stringVal = value !== undefined ? String(value) : '';
  const selectedOption = options.find((o) => o.value === stringVal);

  const handleSelect = (val: string) => {
    if (onChange) {
      const syntheticEvent = {
        target: { value: val, name: name || '' },
        currentTarget: { value: val, name: name || '' },
      } as React.ChangeEvent<HTMLSelectElement>;
      onChange(syntheticEvent);
    }
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`space-y-1.5 w-full relative ${className}`}>
      {label && (
        <label className="block text-xs font-semibold text-slate-700">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      {/* Custom Dropdown Trigger */}
      <button
        type="button"
        disabled={disabled}
        id={id}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full bg-white border rounded-xl px-3.5 py-2.5 text-xs text-left flex items-center justify-between gap-2 transition-all cursor-pointer ${
          error
            ? 'border-rose-300 ring-2 ring-rose-100'
            : isOpen
              ? 'border-[#0D5C53] ring-2 ring-[#0D5C53]/15'
              : 'border-slate-200 hover:border-slate-300'
        } ${disabled ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'text-slate-900'}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className={`truncate font-medium ${!selectedOption?.value && !selectedOption?.label ? 'text-slate-400' : 'text-slate-800'}`}>
          {selectedOption ? selectedOption.label : String(placeholder || 'Pilih...')}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-[#0D5C53]' : ''
          }`}
        />
      </button>

      {/* Floating Options Menu */}
      {isOpen && !disabled && (
        <div className="absolute z-50 left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl p-1 max-h-60 overflow-y-auto animate-in fade-in-0 zoom-in-95 duration-100">
          {options.map((opt, idx) => {
            const isSelected = opt.value === stringVal;
            return (
              <button
                key={`${opt.value}-${idx}`}
                type="button"
                disabled={opt.disabled}
                onClick={() => handleSelect(opt.value)}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-xs rounded-lg transition-colors cursor-pointer text-left ${
                  isSelected
                    ? 'bg-teal-50 text-[#0D5C53] font-bold'
                    : 'text-slate-800 hover:bg-slate-50'
                } ${opt.disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                <span className="truncate">{opt.label}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-[#0D5C53] shrink-0" />}
              </button>
            );
          })}
        </div>
      )}

      {error && <p className="text-[11px] text-rose-600 font-medium">{error}</p>}
      {helperText && !error && <p className="text-[11px] text-slate-400">{helperText}</p>}
    </div>
  );
};

export interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
}

export const FormTextarea: React.FC<FormTextareaProps> = ({
  label,
  error,
  helperText,
  required,
  className = '',
  ...props
}) => {
  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label className="block text-xs font-semibold text-slate-700">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <textarea
        className={`w-full bg-white border border-slate-200 rounded-xl p-3.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53] transition-all ${
          error ? 'border-rose-300 focus:ring-rose-200 focus:border-rose-500' : ''
        } ${className}`}
        {...props}
      />
      {error && <p className="text-[11px] text-rose-600 font-medium">{error}</p>}
      {helperText && !error && <p className="text-[11px] text-slate-400">{helperText}</p>}
    </div>
  );
};

