import React from 'react';
import { create } from 'zustand';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { Modal } from './modal';
import { Button } from './button';

export interface ConfirmDialogOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
}

interface ConfirmDialogState {
  isOpen: boolean;
  options: ConfirmDialogOptions | null;
  resolve: ((value: boolean) => void) | null;
  open: (options: ConfirmDialogOptions) => Promise<boolean>;
  confirm: () => void;
  cancel: () => void;
}

export const useConfirmDialogStore = create<ConfirmDialogState>((set, get) => ({
  isOpen: false,
  options: null,
  resolve: null,
  open: (options: ConfirmDialogOptions) => {
    return new Promise<boolean>((resolve) => {
      set({ isOpen: true, options, resolve });
    });
  },
  confirm: () => {
    const { resolve } = get();
    if (resolve) resolve(true);
    set({ isOpen: false, options: null, resolve: null });
  },
  cancel: () => {
    const { resolve } = get();
    if (resolve) resolve(false);
    set({ isOpen: false, options: null, resolve: null });
  },
}));

export const confirmDialog = (options: ConfirmDialogOptions | string): Promise<boolean> => {
  const opts: ConfirmDialogOptions =
    typeof options === 'string'
      ? { message: options }
      : options;
  return useConfirmDialogStore.getState().open(opts);
};

export const ConfirmDialogContainer: React.FC = () => {
  const { isOpen, options, confirm, cancel } = useConfirmDialogStore();

  if (!isOpen || !options) return null;

  const {
    title = 'Konfirmasi Tindakan',
    message,
    confirmText = 'Ya, Lanjutkan',
    cancelText = 'Batal',
    variant = 'danger',
  } = options;

  const getIcon = () => {
    switch (variant) {
      case 'danger':
        return <AlertTriangle className="w-5 h-5 text-rose-600" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-amber-600" />;
      default:
        return <Info className="w-5 h-5 text-teal-600" />;
    }
  };

  const getIconBg = () => {
    switch (variant) {
      case 'danger':
        return 'bg-rose-50 border-rose-200';
      case 'warning':
        return 'bg-amber-50 border-amber-200';
      default:
        return 'bg-teal-50 border-teal-200';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={cancel}
      title={title}
      maxWidth="sm"
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <Button variant="outline" size="sm" onClick={cancel}>
            {cancelText}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            size="sm"
            onClick={confirm}
            className="font-bold"
          >
            {confirmText}
          </Button>
        </div>
      }
    >
      <div className="flex items-start gap-3.5 py-2">
        <div
          className={`p-2.5 rounded-xl border shrink-0 flex items-center justify-center shadow-xs ${getIconBg()}`}
        >
          {getIcon()}
        </div>
        <div className="flex-1 pt-0.5">
          <p className="text-xs text-slate-700 leading-relaxed font-medium">
            {message}
          </p>
        </div>
      </div>
    </Modal>
  );
};
