import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'danger' | 'warning' | 'info' | 'neutral';
  dot?: boolean;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  dot = false,
  size = 'md',
  className = '',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center rounded-full font-medium tracking-tight border shadow-2xs';

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[10px] gap-1',
    md: 'px-2.5 py-0.5 text-[11px] gap-1.5',
  };

  const variantStyles = {
    success: 'bg-emerald-50/90 text-emerald-800 border-emerald-200/80',
    danger: 'bg-rose-50/90 text-rose-800 border-rose-200/80',
    warning: 'bg-amber-50/90 text-amber-800 border-amber-200/80',
    info: 'bg-teal-50/90 text-[#0A574E] border-teal-200/80',
    neutral: 'bg-slate-100/90 text-slate-700 border-slate-200/80',
  };

  const dotColors = {
    success: 'bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.4)]',
    danger: 'bg-rose-500 shadow-[0_0_4px_rgba(244,63,94,0.4)]',
    warning: 'bg-amber-500 shadow-[0_0_4px_rgba(245,158,11,0.4)]',
    info: 'bg-[#0A574E] shadow-[0_0_4px_rgba(10,87,78,0.4)]',
    neutral: 'bg-slate-400',
  };

  return (
    <span
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColors[variant]}`}
        />
      )}
      {children}
    </span>
  );
};

