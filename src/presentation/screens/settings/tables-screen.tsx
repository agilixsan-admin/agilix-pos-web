import React, { useState, useEffect } from 'react';
import type { Table } from '@model/Settings';
import { useAuthStore } from '@domain/state/auth-store';
import {
  useOutlets,
  useSettingsTables,
  useCreateTableMutation,
  useUpdateTableMutation,
  useDeleteTableMutation,
} from '@domain/hooks';
import { LayoutGrid, Plus, Edit2, Trash2, Layers, Store } from 'lucide-react';
import {
  Button,
  Badge,
  Card,
  Modal,
  FormInput,
  LoadingState,
  EmptyState,
  CustomSelect,
} from '@presentation/components/ui';

export const TablesScreen: React.FC = () => {
  const currentOutlet = useAuthStore((state) => state.currentOutlet);
  const { data: outlets = [], isLoading: outletsLoading } = useOutlets();

  const [selectedOutletId, setSelectedOutletId] = useState<string>('');

  // Auto-select outlet on load
  useEffect(() => {
    if (!selectedOutletId && outlets.length > 0) {
      const defaultId = currentOutlet?.id || outlets[0].id;
      setSelectedOutletId(defaultId);
    }
  }, [outlets, currentOutlet, selectedOutletId]);

  const effectiveOutletId = selectedOutletId || currentOutlet?.id || (outlets.length > 0 ? outlets[0].id : '');
  const activeOutlet = outlets.find((o) => o.id === effectiveOutletId) || currentOutlet;

  const { data: tables = [], isLoading: tablesLoading } = useSettingsTables(effectiveOutletId || undefined);
  const createTableMutation = useCreateTableMutation();
  const updateTableMutation = useUpdateTableMutation();
  const deleteTableMutation = useDeleteTableMutation();
  const submitting = createTableMutation.isPending || updateTableMutation.isPending;
  const loading = outletsLoading || tablesLoading;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    capacity: '4',
    section: 'Main Area',
    targetOutletId: '',
  });
  const [selectedSectionFilter, setSelectedSectionFilter] = useState<string>('ALL');

  // Extract unique sections dynamically from existing tables in this outlet
  const dynamicSections = Array.from(
    new Set(tables.map((t) => (t.section?.trim() ? t.section.trim() : 'Main Area')))
  );

  const handleOpenAdd = () => {
    setEditingTable(null);
    setFormData({
      name: '',
      capacity: '4',
      section: dynamicSections.length > 0 ? dynamicSections[0] : 'Main Area',
      targetOutletId: effectiveOutletId,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (t: Table) => {
    setEditingTable(t);
    setFormData({
      name: t.name || t.tableNumber || '',
      capacity: t.capacity.toString(),
      section: t.section || 'Main Area',
      targetOutletId: t.outletId || effectiveOutletId,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const targetOutlet = formData.targetOutletId || effectiveOutletId;
    if (!targetOutlet) {
      alert('Silakan pilih outlet terlebih dahulu sebelum menyimpan meja.');
      return;
    }

    try {
      const sectionName = formData.section.trim() || 'Main Area';
      if (editingTable) {
        await updateTableMutation.mutateAsync({
          id: editingTable.id,
          data: {
            name: formData.name.trim(),
            tableNumber: formData.name.trim(),
            capacity: Number(formData.capacity) || 4,
            section: sectionName,
            status: editingTable.status || 'AVAILABLE',
          },
        });
      } else {
        await createTableMutation.mutateAsync({
          name: formData.name.trim(),
          tableNumber: formData.name.trim(),
          capacity: Number(formData.capacity) || 4,
          section: sectionName,
          outletId: targetOutlet,
          status: 'AVAILABLE',
        });
      }
      setIsModalOpen(false);
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err instanceof Error ? err.message : 'Gagal menyimpan meja.');
      alert(errorMsg);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus meja ini?')) return;
    try {
      await deleteTableMutation.mutateAsync(id);
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err instanceof Error ? err.message : 'Gagal menghapus meja.');
      alert(errorMsg);
    }
  };

  // Filter tables by selected section tab
  const filteredTables = tables.filter((t) => {
    if (selectedSectionFilter === 'ALL') return true;
    const sec = t.section?.trim() || 'Main Area';
    return sec.toLowerCase() === selectedSectionFilter.toLowerCase();
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Outlet Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Manajemen Meja Dine-In</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola denah nomor meja, area/ruangan, & kapasitas kursi per masing-masing outlet.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Outlet Selector Dropdown */}
          <div className="flex items-center gap-2">
            <CustomSelect
              ariaLabel="Pilih Outlet Meja"
              icon={<Store className="w-4 h-4 text-[#0D5C53]" />}
              value={effectiveOutletId}
              onChange={(val) => {
                setSelectedOutletId(val);
                setSelectedSectionFilter('ALL');
              }}
              options={outlets.map((o) => ({
                value: o.id,
                label: o.name,
              }))}
              buttonClassName="bg-white border-slate-200 text-xs py-1.5 px-3 rounded-xl font-bold"
            />
          </div>

          <Button
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={handleOpenAdd}
            disabled={!effectiveOutletId}
          >
            Tambah Meja
          </Button>
        </div>
      </div>

      {/* Dynamic Section Tabs */}
      {dynamicSections.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar border-b border-slate-200">
          <button
            onClick={() => setSelectedSectionFilter('ALL')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedSectionFilter === 'ALL'
                ? 'bg-[#0D5C53] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semua Area ({tables.length})
          </button>
          {dynamicSections.map((sec) => {
            const count = tables.filter(
              (t) => (t.section?.trim() || 'Main Area').toLowerCase() === sec.toLowerCase()
            ).length;
            return (
              <button
                key={sec}
                onClick={() => setSelectedSectionFilter(sec)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedSectionFilter.toLowerCase() === sec.toLowerCase()
                    ? 'bg-[#0D5C53] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {sec} ({count})
              </button>
            );
          })}
        </div>
      )}

      {loading ? (
        <LoadingState message="Memuat data meja..." className="min-h-[200px]" />
      ) : !effectiveOutletId ? (
        <Card>
          <EmptyState
            icon={<Store className="w-10 h-10 opacity-30 mx-auto" />}
            title="Pilih Outlet"
            description="Silakan pilih outlet di atas untuk melihat atau mengelola daftar meja."
          />
        </Card>
      ) : filteredTables.length === 0 ? (
        <Card>
          <EmptyState
            icon={<LayoutGrid className="w-10 h-10 opacity-30 mx-auto" />}
            title="Belum ada meja"
            description={
              selectedSectionFilter === 'ALL'
                ? `Klik tombol "+ Tambah Meja" untuk mendaftarkan meja baru di outlet ${activeOutlet?.name || ''}.`
                : `Tidak ada meja di area "${selectedSectionFilter}".`
            }
            action={
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={handleOpenAdd}
              >
                Tambah Meja
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredTables.map((t) => (
            <Card
              key={t.id}
              className="flex flex-col justify-between hover:border-[#0D5C53]/40 transition-colors p-4"
              padding="none"
            >
              <div className="p-4 flex flex-col justify-between h-full">
                <div className="flex items-center justify-between mb-3">
                  <Badge
                    variant={t.status === 'AVAILABLE' ? 'success' : 'warning'}
                    size="sm"
                    dot
                  >
                    {t.status === 'AVAILABLE' ? 'Kosong' : 'Terisi'}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(t)}
                      className="p-1 text-slate-400 hover:text-slate-700 rounded-md cursor-pointer transition-colors"
                      title="Edit Meja"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(t.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded-md cursor-pointer transition-colors"
                      title="Hapus Meja"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="text-center py-2">
                  <h3 className="font-bold text-slate-900 text-lg">{t.name || t.tableNumber}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{t.capacity} Kursi</p>
                </div>

                {/* Section Badge */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-center">
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md truncate max-w-full">
                    <Layers className="w-3 h-3 text-slate-400" />
                    {t.section || 'Main Area'}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Dynamic Table Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTable ? 'Edit Data Meja' : 'Tambah Meja Baru'}
        maxWidth="sm"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Target Outlet Selector in Modal if adding */}
          {!editingTable && outlets.length > 1 && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pilih Outlet Target
              </label>
              <CustomSelect
                ariaLabel="Pilih Outlet Target"
                value={formData.targetOutletId}
                onChange={(val) => setFormData({ ...formData, targetOutletId: val })}
                options={outlets.map((o) => ({
                  value: o.id,
                  label: o.name,
                }))}
                buttonClassName="w-full bg-slate-50 border-slate-200 text-xs py-2 px-3 rounded-xl font-medium"
              />
            </div>
          )}

          <FormInput
            label="Nomor / Nama Meja"
            required
            autoFocus
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Contoh: Meja 01, Teras 1, VIP 1"
          />

          <div>
            <FormInput
              label="Area / Ruangan (Section)"
              required
              value={formData.section}
              onChange={(e) => setFormData({ ...formData, section: e.target.value })}
              placeholder="Contoh: Main Floor, Outdoor, VIP, Lantai 2"
            />
            {/* Quick Suggestions from existing sections */}
            {dynamicSections.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1.5 items-center">
                <span className="text-[10px] text-slate-600 font-medium">Pilih area:</span>
                {dynamicSections.map((sec) => (
                  <button
                    type="button"
                    key={sec}
                    onClick={() => setFormData({ ...formData, section: sec })}
                    className={`text-[10px] px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                      formData.section === sec
                        ? 'bg-teal-50 border-[#0D5C53] text-[#0D5C53] font-semibold'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {sec}
                  </button>
                ))}
              </div>
            )}
          </div>

          <FormInput
            label="Kapasitas Kursi"
            type="number"
            min="1"
            unit="Orang"
            required
            value={formData.capacity}
            onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
            placeholder="4"
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
              Simpan
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
