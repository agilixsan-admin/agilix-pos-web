import React from 'react';
import { Modal, Button } from '@presentation/components/ui';
import { AlertCircle, RotateCw, Printer } from 'lucide-react';

interface PrintErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRetry: () => void;
  onBrowserPrintFallback: () => void;
  errorMessage?: string;
}

export const PrintErrorModal: React.FC<PrintErrorModalProps> = ({
  isOpen,
  onClose,
  onRetry,
  onBrowserPrintFallback,
  errorMessage,
}) => {
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      maxWidth="sm"
    >
      <div className="text-center py-3 space-y-4">
        {/* Red Alert Circle Icon */}
        <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-xs">
          <AlertCircle className="w-9 h-9" />
        </div>

        <div>
          <h3 className="text-base font-bold text-slate-900">Gagal Mencetak Struk (Print Failed)</h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed px-2">
            {errorMessage ||
              'Tidak dapat terhubung ke printer thermal outlet. Transaksi tetap tersimpan dan selesai dengan aman.'}
          </p>
        </div>

        <div className="space-y-2 pt-2">
          <Button
            variant="primary"
            size="md"
            leftIcon={<RotateCw className="w-4 h-4" />}
            onClick={onRetry}
            className="w-full font-bold shadow-xs"
          >
            Coba Lagi (Retry Print)
          </Button>

          <Button
            variant="outline"
            size="md"
            leftIcon={<Printer className="w-4 h-4" />}
            onClick={onBrowserPrintFallback}
            className="w-full"
          >
            Cetak via Browser
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="w-full text-slate-500"
          >
            Tutup
          </Button>
        </div>
      </div>
    </Modal>
  );
};

