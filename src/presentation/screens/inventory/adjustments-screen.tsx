import React, { useEffect, useState } from 'react';
import type { RawMaterial, PackagingItem, StockAdjustment } from '@model/Inventory';
import { inventoryService } from '@domain/services/inventory-service';
import { useAuthStore } from '@domain/state/auth-store';
import { SlidersHorizontal, Plus } from 'lucide-react';
import {
  Button,
  Badge,
  Card,
  Modal,
  FormInput,
  FormSelect,
  FormTextarea,
  LoadingState,
  EmptyState,
} from '@presentation/components/ui';

export const AdjustmentsScreen: React.FC = () => {
  const currentOutlet = useAuthStore((state) => state.currentOutlet);
  const [adjustments, setAdjustments] = useState<StockAdjustment[]>([]);
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [packagings, setPackagings] = useState<PackagingItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Create Adjustment Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [itemType, setItemType] = useState<'RAW_MATERIAL' | 'PACKAGING'>('RAW_MATERIAL');
  const [actualStock, setActualStock] = useState('');
  const [reasonCategory, setReasonCategory] = useState<
    'DAMAGED' | 'EXPIRED' | 'LOST' | 'COUNTING_ERROR' | 'OTHER'
  >('DAMAGED');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [adjRes, matRes, packRes] = await Promise.allSettled([
        inventoryService.getAdjustments({ outletId: currentOutlet?.id }),
        inventoryService.getRawMaterials({ outletId: currentOutlet?.id }),
        inventoryService.getPackagingItems({ outletId: currentOutlet?.id }),
      ]);
      setAdjustments(adjRes.status === 'fulfilled' && Array.isArray(adjRes.value) ? adjRes.value : []);
      setMaterials(matRes.status === 'fulfilled' && Array.isArray(matRes.value) ? matRes.value : []);
      setPackagings(packRes.status === 'fulfilled' && Array.isArray(packRes.value) ? packRes.value : []);
    } catch (err) {
      console.error('Failed to load adjustments data:', err);
      setAdjustments([]);
      setMaterials([]);
      setPackagings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentOutlet?.id]);

  const selectedItem =
    itemType === 'RAW_MATERIAL'
      ? materials.find((m) => m.id === selectedItemId)
      : packagings.find((p) => p.id === selectedItemId);

  const systemStock = Number(selectedItem?.currentStock || 0);
  const diff = actualStock !== '' ? Number(actualStock) - systemStock : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) {
      alert('Pilih item terlebih dahulu.');
      return;
    }

    setSubmitting(true);
    try {
      await inventoryService.createAdjustment({
        outletId: currentOutlet?.id || '',
        adjustmentDate: new Date().toISOString(),
        items: [
          {
            itemId: selectedItem.id,
            itemName: selectedItem.name,
            itemType,
            systemStock,
            actualStock: Number(actualStock),
            reasonCategory,
            notes,
          },
        ],
        notes,
      });

      setIsModalOpen(false);
      loadData();
    } catch (err: unknown) {
      alert(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Gagal menyimpan penyesuaian stok.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Stock Adjustment (Penyesuaian Stok)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Catat koreksi stok barang rusak, kadaluwarsa, hilang, atau selisih hitung.
          </p>
        </div>

        <Button
          variant="primary"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => {
            setSelectedItemId(materials[0]?.id || packagings[0]?.id || '');
            setActualStock('');
            setNotes('');
            setIsModalOpen(true);
          }}
        >
          Buat Penyesuaian
        </Button>
      </div>

      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Tanggal</th>
                <th className="py-3.5 px-4">Nama Item</th>
                <th className="py-3.5 px-4 text-right">Stok Sistem</th>
                <th className="py-3.5 px-4 text-right">Stok Aktual</th>
                <th className="py-3.5 px-4 text-right">Selisih</th>
                <th className="py-3.5 px-4">Alasan</th>
                <th className="py-3.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7}>
                    <LoadingState message="Memuat riwayat penyesuaian..." />
                  </td>
                </tr>
              ) : adjustments.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <EmptyState
                      icon={<SlidersHorizontal className="w-8 h-8 opacity-30 mx-auto" />}
                      title="Belum ada penyesuaian stok"
                      description='Klik tombol "+ Buat Penyesuaian" untuk merekam koreksi stok manual.'
                    />
                  </td>
                </tr>
              ) : (
                adjustments.flatMap((adj) =>
                  (adj.items || []).map((item, idx) => (
                    <tr key={`${adj.id}-${idx}`} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                        {new Date(adj.adjustmentDate || adj.createdAt).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">{item.itemName}</td>
                      <td className="py-3.5 px-4 text-right text-slate-600 font-semibold">
                        {item.systemStock}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                        {item.actualStock}
                      </td>
                      <td
                        className={`py-3.5 px-4 text-right font-bold ${
                          item.difference >= 0 ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {item.difference > 0 ? `+${item.difference}` : item.difference}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">
                        <Badge variant="neutral">{item.reasonCategory}</Badge>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <Badge variant="success" dot>
                          {adj.status || 'CONFIRMED'}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Reusable Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Buat Penyesuaian Stok (Adjustment)"
        maxWidth="sm"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormSelect
            label="Tipe Inventori"
            value={itemType}
            onChange={(e) => {
              const type = e.target.value as 'RAW_MATERIAL' | 'PACKAGING';
              setItemType(type);
              setSelectedItemId(
                type === 'RAW_MATERIAL' ? materials[0]?.id || '' : packagings[0]?.id || ''
              );
            }}
          >
            <option value="RAW_MATERIAL">Bahan Baku (Raw Material)</option>
            <option value="PACKAGING">Kemasan (Packaging)</option>
          </FormSelect>

          <FormSelect
            label="Pilih Item"
            required
            value={selectedItemId}
            onChange={(e) => setSelectedItemId(e.target.value)}
          >
            {itemType === 'RAW_MATERIAL'
              ? materials.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} (Stok Sistem: {m.currentStock || 0} {m.unit})
                  </option>
                ))
              : packagings.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Stok Sistem: {p.currentStock || 0} {p.unit})
                  </option>
                ))}
          </FormSelect>

          {selectedItem && (
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
              <span className="text-slate-500">Stok Sistem Saat Ini:</span>{' '}
              <span className="font-bold text-slate-900">
                {systemStock} {selectedItem.unit}
              </span>
            </div>
          )}

          <FormInput
            label="Stok Fisik Aktual"
            type="number"
            min="0"
            step="any"
            unit={selectedItem?.unit}
            required
            value={actualStock}
            onChange={(e) => setActualStock(e.target.value)}
            placeholder="0"
          />

          {actualStock !== '' && (
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs flex justify-between items-center">
              <span className="text-slate-500">Selisih Stok:</span>
              <span
                className={`font-bold ${
                  diff >= 0 ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                {diff > 0 ? `+${diff}` : diff} {selectedItem?.unit}
              </span>
            </div>
          )}

          <FormSelect
            label="Kategori Alasan Penyesuaian"
            value={reasonCategory}
            onChange={(e) =>
              setReasonCategory(
                e.target.value as 'DAMAGED' | 'EXPIRED' | 'LOST' | 'COUNTING_ERROR' | 'OTHER'
              )
            }
          >
            <option value="DAMAGED">Rusak / Pecah (Damaged)</option>
            <option value="EXPIRED">Kadaluwarsa (Expired / Basi)</option>
            <option value="LOST">Hilang / Selisih Fisik (Lost)</option>
            <option value="COUNTING_ERROR">Salah Hitung Sebelumnya (Counting Error)</option>
            <option value="OTHER">Lainnya (Other)</option>
          </FormSelect>

          <FormTextarea
            label="Catatan Tambahan (Opsional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Contoh: Kemasan sobek saat pengiriman"
            rows={2}
          />

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={submitting}
            >
              Simpan Penyesuaian
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
