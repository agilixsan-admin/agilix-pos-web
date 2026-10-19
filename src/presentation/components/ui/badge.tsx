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
    success: 'bg-emerald-50/90 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/60',
    danger: 'bg-rose-50/90 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border-rose-200/80 dark:border-rose-800/60',
    warning: 'bg-amber-50/90 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/60',
    info: 'bg-sky-50/90 dark:bg-sky-950/50 text-sky-800 dark:text-sky-300 border-sky-200/80 dark:border-sky-800/60',
    neutral: 'bg-slate-100/90 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-700/80',
  };

  const dotColors = {
    success: 'bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.4)]',
    danger: 'bg-rose-500 shadow-[0_0_4px_rgba(244,63,94,0.4)]',
    warning: 'bg-amber-500 shadow-[0_0_4px_rgba(245,158,11,0.4)]',
    info: 'bg-sky-500 shadow-[0_0_4px_rgba(14,165,233,0.4)]',
    neutral: 'bg-slate-400 dark:bg-slate-500',
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

