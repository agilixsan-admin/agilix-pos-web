import React from 'react';
import { Loader2 } from 'lucide-react';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div className={`p-12 text-center text-slate-400 flex flex-col items-center justify-center ${className}`}>
      {icon && <div className="mb-3 text-slate-300">{icon}</div>}
      <h4 className="font-bold text-slate-700 text-sm">{title}</h4>
      {description && (
        <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};

export interface LoadingStateProps {
  message?: string;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Memuat data...',
  className = '',
}) => {
  return (
    <div className={`py-12 flex flex-col items-center justify-center text-slate-400 ${className}`}>
      <Loader2 className="w-6 h-6 animate-spin text-[#0D5C53] mb-2" />
      <span className="text-xs font-medium text-slate-500">{message}</span>
    </div>
  );
};

