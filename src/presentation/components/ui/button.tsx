import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium tracking-tight rounded-xl transition-all duration-150 cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.97]';

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-xs gap-2',
    lg: 'px-5 py-2.5 text-sm gap-2.5',
  };

  const variantStyles = {
    primary:
      'bg-gradient-to-b from-[#0E6D62] to-[#0A574E] hover:from-[#10776B] hover:to-[#0C5F55] active:from-[#084840] active:to-[#063B34] text-white shadow-[0_1px_2px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.15)] border border-[#08453E] focus:ring-2 focus:ring-[#0D5C53]/25',
    secondary:
      'bg-slate-100 hover:bg-slate-200/80 active:bg-slate-200 text-slate-700 border border-slate-200/60 shadow-2xs focus:ring-2 focus:ring-slate-200',
    outline:
      'bg-white hover:bg-slate-50/90 active:bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs hover:border-slate-300 focus:ring-2 focus:ring-slate-200',
    danger:
      'bg-gradient-to-b from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 active:from-rose-700 active:to-rose-800 text-white shadow-[0_1px_2px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.15)] border border-rose-700/30 focus:ring-2 focus:ring-rose-400',
    ghost:
      'bg-transparent hover:bg-slate-100/80 active:bg-slate-200/70 text-slate-600 hover:text-slate-900',
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}
      {children}
      {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
};

