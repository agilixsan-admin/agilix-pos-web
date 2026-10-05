import React, { useState, useEffect, useRef, forwardRef } from 'react';
import { Lock } from 'lucide-react';

export interface RupiahInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  isLocked?: boolean;
  value?: number | string;
  onValueChange?: (val: number) => void;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  showPrefix?: boolean;
  prefix?: string;
  allowZero?: boolean;
  containerClassName?: string;
}

export const formatRupiahString = (val: number | string | undefined | null): string => {
  if (val === undefined || val === null || val === '') return '';
  const num = typeof val === 'string' ? parseInt(val.replace(/\D/g, ''), 10) : Math.round(Number(val));
  if (isNaN(num)) return '';
  return new Intl.NumberFormat('id-ID').format(num);
};

export const parseRupiahString = (val: string): number => {
  if (!val) return 0;
  let cleaned = val.trim().replace(/[,.]00$/, '');
  cleaned = cleaned.replace(/\D/g, '');
  if (!cleaned) return 0;
  return parseInt(cleaned, 10);
};

export const RupiahInput = forwardRef<HTMLInputElement, RupiahInputProps>(({
  label,
  error,
  helperText,
  required,
  isLocked,
  value,
  onValueChange,
  onChange,
  showPrefix = true,
  prefix = 'Rp',
  allowZero = false,
  containerClassName = '',
  className = '',
  placeholder = '0',
  disabled,
  onKeyDown,
  ...props
}, ref) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const cursorRef = useRef<number | null>(null);

  const setRefs = (node: HTMLInputElement | null) => {
    inputRef.current = node;
    if (typeof ref === 'function') {
      ref(node);
    } else if (ref) {
      (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
    }
  };

  const getFormattedValue = (val: number | string | undefined | null) => {
    if (val === undefined || val === null || val === '') return '';
    const num = typeof val === 'number' ? Math.round(val) : parseRupiahString(String(val));
    if (num === 0) return allowZero ? '0' : '';
    return formatRupiahString(num);
  };

  const [displayValue, setDisplayValue] = useState<string>(() => getFormattedValue(value));

  useEffect(() => {
    setDisplayValue(getFormattedValue(value));
  }, [value, allowZero]);

  useEffect(() => {
    if (cursorRef.current !== null && inputRef.current) {
      const pos = Math.min(cursorRef.current, displayValue.length);
      inputRef.current.setSelectionRange(pos, pos);
      cursorRef.current = null;
    }
  }, [displayValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const currentCursor = e.target.selectionStart || 0;

    const digitsBefore = raw.slice(0, currentCursor).replace(/\D/g, '').length;
    const numValue = parseRupiahString(raw);
    const newFormatted =
      raw.trim() === ''
        ? ''
        : numValue === 0 && allowZero
        ? '0'
        : numValue === 0
        ? ''
        : formatRupiahString(numValue);

    let targetPos = 0;
    if (digitsBefore === 0) {
      targetPos = 0;
    } else {
      let seenDigits = 0;
      for (let i = 0; i < newFormatted.length; i++) {
        if (/\d/.test(newFormatted[i])) {
          seenDigits++;
          if (seenDigits === digitsBefore) {
            targetPos = i + 1;
            break;
          }
        }
      }
      if (seenDigits < digitsBefore) {
        targetPos = newFormatted.length;
      }
    }

    cursorRef.current = targetPos;
    setDisplayValue(newFormatted);

    onValueChange?.(numValue);

    if (onChange) {
      const syntheticEvent = {
        ...e,
        target: {
          ...e.target,
          value: String(numValue),
          name: props.name || '',
        },
        currentTarget: {
          ...e.currentTarget,
          value: String(numValue),
          name: props.name || '',
        },
      } as React.ChangeEvent<HTMLInputElement>;
      onChange(syntheticEvent);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      const input = e.currentTarget;
      const start = input.selectionStart || 0;
      const end = input.selectionEnd || 0;
      // If cursor is right after a dot and nothing is selected, delete the digit before the dot
      if (start === end && start > 0 && input.value[start - 1] === '.') {
        e.preventDefault();
        const before = input.value.slice(0, Math.max(0, start - 2));
        const after = input.value.slice(start);
        const combined = before + after;
        const numValue = parseRupiahString(combined);
        const newFormatted =
          combined.trim() === ''
            ? ''
            : numValue === 0 && allowZero
            ? '0'
            : numValue === 0
            ? ''
            : formatRupiahString(numValue);

        const digitsBefore = before.replace(/\D/g, '').length;
        let targetPos = 0;
        if (digitsBefore > 0) {
          let seen = 0;
          for (let i = 0; i < newFormatted.length; i++) {
            if (/\d/.test(newFormatted[i])) {
              seen++;
              if (seen === digitsBefore) {
                targetPos = i + 1;
                break;
              }
            }
          }
        }
        cursorRef.current = targetPos;
        setDisplayValue(newFormatted);
        onValueChange?.(numValue);

        if (onChange) {
          const syntheticEvent = {
            ...e,
            target: {
              ...input,
              value: String(numValue),
              name: props.name || '',
            },
            currentTarget: {
              ...input,
              value: String(numValue),
              name: props.name || '',
            },
          } as unknown as React.ChangeEvent<HTMLInputElement>;
          onChange(syntheticEvent);
        }
      }
    }
    onKeyDown?.(e);
  };

  const hasFormWrapper = Boolean(label || error || helperText);

  const inputElement = (
    <div className="relative w-full">
      {showPrefix && (
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold text-xs select-none">
          {prefix}
        </div>
      )}
      <input
        ref={setRefs}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        disabled={disabled || isLocked}
        value={displayValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`w-full bg-white border border-slate-200 rounded-xl ${
          showPrefix ? 'pl-10 pr-3.5' : 'px-3.5'
        } py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53] transition-all disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed ${
          error ? 'border-rose-300 focus:ring-rose-200 focus:border-rose-500' : ''
        } ${className}`}
        {...props}
      />
      {isLocked && (
        <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
      )}
    </div>
  );

  if (!hasFormWrapper) {
    return containerClassName ? <div className={containerClassName}>{inputElement}</div> : inputElement;
  }

  return (
    <div className={`space-y-1.5 w-full ${containerClassName}`}>
      {label && (
        <label className="block text-xs font-semibold text-slate-700">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      {inputElement}
      {error && <p className="text-[11px] text-rose-600 font-medium">{error}</p>}
      {helperText && !error && <p className="text-[11px] text-slate-400">{helperText}</p>}
    </div>
  );
});

RupiahInput.displayName = 'RupiahInput';
