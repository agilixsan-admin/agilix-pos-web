import React from 'react';
import { create } from 'zustand';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
  duration?: number;
}

interface ToastState {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, 'id'>) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }));

    const duration = toast.duration ?? 3500;
    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      }, duration);
    }
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));

export const toast = {
  success: (message: string, title?: string, duration?: number) => {
    useToastStore.getState().addToast({ type: 'success', message, title, duration });
  },
  error: (message: string, title?: string, duration?: number) => {
    useToastStore.getState().addToast({ type: 'error', message, title, duration });
  },
  warning: (message: string, title?: string, duration?: number) => {
    useToastStore.getState().addToast({ type: 'warning', message, title, duration });
  },
  info: (message: string, title?: string, duration?: number) => {
    useToastStore.getState().addToast({ type: 'info', message, title, duration });
  },
};

const toastConfig: Record<
  ToastType,
  {
    icon: React.ElementType;
    bg: string;
    border: string;
    iconColor: string;
    titleColor: string;
    defaultTitle: string;
  }
> = {
  success: {
    icon: CheckCircle2,
    bg: 'bg-emerald-50/95',
    border: 'border-emerald-200',
    iconColor: 'text-emerald-600',
    titleColor: 'text-emerald-950',
    defaultTitle: 'Berhasil',
  },
  error: {
    icon: AlertCircle,
    bg: 'bg-rose-50/95',
    border: 'border-rose-200',
    iconColor: 'text-rose-600',
    titleColor: 'text-rose-950',
    defaultTitle: 'Terjadi Kesalahan',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-amber-50/95',
    border: 'border-amber-200',
    iconColor: 'text-amber-600',
    titleColor: 'text-amber-950',
    defaultTitle: 'Perhatian',
  },
  info: {
    icon: Info,
    bg: 'bg-teal-50/95',
    border: 'border-teal-200',
    iconColor: 'text-[#0D5C53]',
    titleColor: 'text-[#0D5C53]',
    defaultTitle: 'Informasi',
  },
};

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
    >
      {toasts.map((t) => {
        const config = toastConfig[t.type];
        const IconComponent = config.icon;

        return (
          <div
            key={t.id}
            role="alert"
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-2xl border shadow-lg backdrop-blur-xs transition-all duration-200 animate-in fade-in slide-in-from-top-4 ${config.bg} ${config.border}`}
          >
            <div className="shrink-0 mt-0.5">
              <IconComponent className={`w-5 h-5 ${config.iconColor}`} />
            </div>
            <div className="flex-1 min-w-0 pr-1">
              <h4 className={`text-xs font-bold ${config.titleColor}`}>
                {t.title || config.defaultTitle}
              </h4>
              <p className="text-xs text-slate-700 mt-0.5 leading-relaxed break-words font-medium">
                {t.message}
              </p>
            </div>
            <button
              type="button"
              onClick={() => removeToast(t.id)}
              className="shrink-0 p-1 text-slate-400 hover:text-slate-700 hover:bg-black/5 rounded-lg transition-colors cursor-pointer"
              aria-label="Tutup notifikasi"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

