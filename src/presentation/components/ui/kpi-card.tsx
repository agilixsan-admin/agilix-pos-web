import React from 'react';

export interface KpiCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon?: React.ReactNode;
  subtitle?: string;
  statusBadge?: React.ReactNode;
  theme?: 'teal' | 'emerald' | 'amber' | 'indigo' | 'slate';
  className?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  unit,
  icon,
  subtitle,
  statusBadge,
  theme = 'slate',
  className = '',
}) => {
  const iconThemes = {
    teal: 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400',
    emerald: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400',
    amber: 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400',
    indigo: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400',
    slate: 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300',
  };

  const valueThemes = {
    teal: 'text-blue-600 dark:text-blue-400',
    emerald: 'text-emerald-700 dark:text-emerald-400',
    amber: 'text-amber-700 dark:text-amber-400',
    indigo: 'text-indigo-700 dark:text-indigo-400',
    slate: 'text-slate-900 dark:text-white',
  };

  return (
    <div className={`bg-white dark:bg-[#101828] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-card hover:shadow-card-hover transition-all duration-200 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 tracking-tight">{title}</span>
        {icon && <div className={`p-2.5 rounded-xl ring-1 ring-black/5 dark:ring-white/10 ${iconThemes[theme]}`}>{icon}</div>}
      </div>
      <div className="mt-3.5">
        <div className="flex items-baseline gap-1.5">
          <span className={`text-2xl font-bold tracking-tight tabular-nums ${valueThemes[theme]}`}>
            {value}
          </span>
          {unit && <span className="text-xs font-semibold text-slate-500">{unit}</span>}
        </div>
        {statusBadge && <div className="mt-2">{statusBadge}</div>}
        {subtitle && <p className="text-[11px] text-slate-400 mt-1">{subtitle}</p>}
      </div>
    </div>
  );
};

