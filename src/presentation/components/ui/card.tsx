import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  header,
  footer,
  padding = 'md',
  className = '',
  ...props
}) => {
  const paddingStyles = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const hasOverflowClass = className.includes('overflow-');

  return (
    <div
      className={`bg-white border border-slate-200/80 rounded-2xl shadow-card transition-all duration-200 ${hasOverflowClass ? '' : 'overflow-hidden'} ${className}`}
      {...props}
    >
      {header && (
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between relative z-20">
          {header}
        </div>
      )}
      <div className={`relative z-10 ${paddingStyles[padding]}`}>{children}</div>
      {footer && (
        <div className="px-6 py-3.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-end gap-2.5">
          {footer}
        </div>
      )}
    </div>
  );
};

