import React, { useState, useEffect } from 'react';
import { Modal, Button, FormTextarea } from '@presentation/components/ui';

interface ItemNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemName?: string;
  initialNotes?: string;
  onSaveNotes: (notes: string) => void;
}

export const ItemNoteModal: React.FC<ItemNoteModalProps> = ({
  isOpen,
  onClose,
  itemName,
  initialNotes = '',
  onSaveNotes,
}) => {
  const [notes, setNotes] = useState<string>(initialNotes);

  useEffect(() => {
    setNotes(initialNotes || '');
  }, [initialNotes, isOpen]);

  if (!isOpen) return null;

  const QUICK_TAGS = [
    'Less Sugar',
    'No Sugar',
    'Extra Ice',
    'No Ice',
    'Hot / Panas',
    'Pedas Sedang',
    'Sangat Pedas',
    'Pisah Sambal',
    'Tanpa Bawang',
  ];

  const handleAddTag = (tag: string) => {
    if (!notes) {
      setNotes(tag);
    } else if (!notes.includes(tag)) {
      setNotes(`${notes}, ${tag}`);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Catatan Pesanan"
      subtitle={itemName || 'Instruksi Khusus untuk Barista / Dapur'}
      maxWidth="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              onSaveNotes(notes);
              onClose();
            }}
          >
            Simpan Catatan
          </Button>
        </>
      }
    >
      <div className="space-y-3 py-1">
        {/* Quick Suggestion Tags */}
        <div>
          <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">
            Pilihan Cepat:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleAddTag(tag)}
                className="text-[11px] bg-slate-100 hover:bg-teal-50 hover:text-[#0D5C53] text-slate-600 px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer border border-transparent hover:border-teal-200"
              >
                + {tag}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">
            Tulis Catatan Khusus:
          </span>
          <FormTextarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Contoh: Kurang manis, es sedikit, bungkus terpisah..."
            rows={3}
          />
        </div>
      </div>
    </Modal>
  );
};

