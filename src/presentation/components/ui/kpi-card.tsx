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
    teal: 'bg-teal-50 text-[#0D5C53]',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    slate: 'bg-slate-50 text-slate-600',
  };

  const valueThemes = {
    teal: 'text-[#0D5C53]',
    emerald: 'text-emerald-700',
    amber: 'text-amber-700',
    indigo: 'text-indigo-700',
    slate: 'text-slate-900',
  };

  return (
    <div className={`bg-white border border-slate-200 rounded-2xl p-4 shadow-xs ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500">{title}</span>
        {icon && <div className={`p-2 rounded-xl ${iconThemes[theme]}`}>{icon}</div>}
      </div>
      <div className="mt-3">
        <div className="flex items-baseline gap-1.5">
          <span className={`text-2xl font-bold tracking-tight ${valueThemes[theme]}`}>
            {value}
          </span>
          {unit && <span className="text-xs font-semibold text-slate-500">{unit}</span>}
        </div>
        {statusBadge && <div className="mt-1.5">{statusBadge}</div>}
        {subtitle && <p className="text-[11px] text-slate-400 mt-1">{subtitle}</p>}
      </div>
    </div>
  );
};

