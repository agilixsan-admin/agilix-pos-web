import React, { useState, useEffect } from 'react';
import type {
  PrinterSetting,
  PrinterType,
  PrinterConnectionType,
  PrinterPaperSize,
} from '@model/Settings';
import {
  usePrinters,
  usePrinterRoutingRules,
  useCreatePrinterMutation,
  useUpdatePrinterMutation,
  useDeletePrinterMutation,
  useTestPrintMutation,
  useUpdatePrinterRoutingRulesMutation,
  useCategories,
  useOutlets,
} from '@domain/hooks';
import { useAuthStore } from '@domain/state/auth-store';
import {
  Printer,
  Plus,
  Edit2,
  Power,
  Wifi,
  Bluetooth,
  Usb,
  Info,
  CheckCircle2,
  Trash2,
  Radio,
  SlidersHorizontal,
  Monitor,
  PrinterCheck,
  AlertCircle,
  Store,
} from 'lucide-react';
import {
  Button,
  Badge,
  Card,
  Modal,
  FormInput,
  FormSelect,
  LoadingState,
  EmptyState,
} from '@presentation/components/ui';

export const PrintersScreen: React.FC = () => {
  const currentOutlet = useAuthStore((state) => state.currentOutlet);
  const { data: outlets = [], isLoading: outletsLoading } = useOutlets();

  // Selected Outlet state
  const [selectedOutletId, setSelectedOutletId] = useState<string>('');

  // Auto-select outlet on load
  useEffect(() => {
    if (!selectedOutletId && (currentOutlet?.id || outlets[0]?.id)) {
      setSelectedOutletId(currentOutlet?.id || outlets[0]?.id || '');
    }
  }, [currentOutlet, outlets, selectedOutletId]);

  const effectiveOutletId = selectedOutletId || currentOutlet?.id || (outlets.length > 0 ? outlets[0].id : '');
  const activeOutlet = outlets.find((o) => o.id === effectiveOutletId) || currentOutlet;

  // Queries
  const {
    data: printers = [],
    isLoading: printersLoading,
    refetch,
  } = usePrinters(effectiveOutletId || undefined);

  const {
    data: routingRules = [],
    isLoading: routingLoading,
    refetch: refetchRouting,
  } = usePrinterRoutingRules(effectiveOutletId || undefined);

  const { data: categories = [] } = useCategories();

  // Mutations
  const createPrinterMutation = useCreatePrinterMutation();
  const updatePrinterMutation = useUpdatePrinterMutation();
  const deletePrinterMutation = useDeletePrinterMutation();
  const testPrintMutation = useTestPrintMutation();
  const updateRoutingMutation = useUpdatePrinterRoutingRulesMutation();

  // Modals & State
  const [isPrinterModalOpen, setIsPrinterModalOpen] = useState(false);
  const [isRoutingModalOpen, setIsRoutingModalOpen] = useState(false);
  const [editingPrinter, setEditingPrinter] = useState<PrinterSetting | null>(null);
  const [testingPrinterId, setTestingPrinterId] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Printer Form State
  const [formData, setFormData] = useState({
    name: '',
    type: 'RECEIPT' as PrinterType,
    connectionType: 'BLUETOOTH' as PrinterConnectionType,
    paperSize: '58mm' as PrinterPaperSize,
    ipAddress: '',
    port: 9100,
    bluetoothMac: '',
    isDefault: false,
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Routing Rules Form State
  const [routingState, setRoutingState] = useState<Record<string, string>>({});

  const showToast = (message: string) => {
    setSuccessToast(message);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const handleOpenAdd = () => {
    setEditingPrinter(null);
    setFormData({
      name: '',
      type: 'RECEIPT',
      connectionType: 'BLUETOOTH',
      paperSize: '58mm',
      ipAddress: '',
      port: 9100,
      bluetoothMac: '',
      isDefault: printers.length === 0,
    });
    setFormErrors({});
    setIsPrinterModalOpen(true);
  };

  const handleOpenEdit = (p: PrinterSetting) => {
    setEditingPrinter(p);
    setFormData({
      name: p.name,
      type: p.type || 'RECEIPT',
      connectionType: p.connectionType || 'BLUETOOTH',
      paperSize: p.paperSize || '58mm',
      ipAddress: p.ipAddress || '',
      port: p.port || 9100,
      bluetoothMac: p.bluetoothMac || '',
      isDefault: p.isDefault || false,
    });
    setFormErrors({});
    setIsPrinterModalOpen(true);
  };

  const validatePrinterForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = 'Nama printer wajib diisi';
    if (formData.connectionType === 'NETWORK' && !formData.ipAddress.trim()) {
      errors.ipAddress = 'IP Address wajib diisi untuk printer jaringan (LAN)';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSavePrinter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePrinterForm() || !effectiveOutletId) return;

    try {
      if (editingPrinter) {
        await updatePrinterMutation.mutateAsync({
          id: editingPrinter.id,
          data: {
            name: formData.name.trim(),
            type: formData.type,
            connectionType: formData.connectionType,
            paperSize: formData.paperSize,
            ipAddress: formData.connectionType === 'NETWORK' ? formData.ipAddress.trim() : undefined,
            port: formData.connectionType === 'NETWORK' ? Number(formData.port) : undefined,
            bluetoothMac: formData.connectionType === 'BLUETOOTH' ? formData.bluetoothMac.trim() : undefined,
            isDefault: formData.isDefault,
          },
        });
        showToast(`Printer "${formData.name}" berhasil diperbarui.`);
      } else {
        await createPrinterMutation.mutateAsync({
          outletId: effectiveOutletId,
          name: formData.name.trim(),
          type: formData.type,
          connectionType: formData.connectionType,
          paperSize: formData.paperSize,
          ipAddress: formData.connectionType === 'NETWORK' ? formData.ipAddress.trim() : undefined,
          port: formData.connectionType === 'NETWORK' ? Number(formData.port) : undefined,
          bluetoothMac: formData.connectionType === 'BLUETOOTH' ? formData.bluetoothMac.trim() : undefined,
          isDefault: formData.isDefault,
        });
        showToast(`Printer "${formData.name}" berhasil ditambahkan ke cabang ${activeOutlet?.name || ''}.`);
      }

      setIsPrinterModalOpen(false);
      refetch();
    } catch (err: unknown) {
      alert(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Gagal menyimpan konfigurasi printer.'
      );
    }
  };

  const handleToggleStatus = async (printer: PrinterSetting) => {
    const nextStatus = printer.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await updatePrinterMutation.mutateAsync({
        id: printer.id,
        data: { status: nextStatus },
      });
      showToast(`Printer "${printer.name}" kini ${nextStatus === 'ACTIVE' ? 'Aktif' : 'Nonaktif'}.`);
      refetch();
    } catch (err: unknown) {
      alert('Gagal mengubah status printer.');
    }
  };

  const handleDeletePrinter = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus printer "${name}"?`)) return;
    try {
      await deletePrinterMutation.mutateAsync(id);
      setIsPrinterModalOpen(false);
      showToast(`Printer "${name}" berhasil dihapus.`);
      refetch();
    } catch (err: unknown) {
      alert('Gagal menghapus printer.');
    }
  };

  const handleTestPrint = async (printer: PrinterSetting) => {
    setTestingPrinterId(printer.id);
    try {
      await testPrintMutation.mutateAsync(printer.id);
      showToast(`Test print berhasil dikirim ke "${printer.name}".`);
    } catch (err: unknown) {
      alert(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          `Gagal menjalankan test print pada "${printer.name}". Periksa koneksi perangkat.`
      );
    } finally {
      setTestingPrinterId(null);
    }
  };

  const handleOpenRouting = () => {
    const map: Record<string, string> = {};
    routingRules.forEach((r) => {
      map[r.categoryId] = r.printerId;
    });
    setRoutingState(map);
    setIsRoutingModalOpen(true);
  };

  const handleSaveRouting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectiveOutletId) return;

    try {
      const routings = Object.entries(routingState)
        .filter(([_, pId]) => Boolean(pId))
        .map(([cId, pId]) => ({ categoryId: cId, printerId: pId }));

      await updateRoutingMutation.mutateAsync({
        outletId: effectiveOutletId,
        routings,
      });

      setIsRoutingModalOpen(false);
      showToast(`Aturan routing printer cabang ${activeOutlet?.name || ''} berhasil disimpan.`);
      refetchRouting();
    } catch (err: unknown) {
      alert('Gagal memperbarui aturan routing printer.');
    }
  };

  const getConnectionIcon = (type: PrinterConnectionType) => {
    switch (type) {
      case 'BLUETOOTH':
        return <Bluetooth className="w-3.5 h-3.5" />;
      case 'NETWORK':
        return <Wifi className="w-3.5 h-3.5" />;
      case 'USB':
        return <Usb className="w-3.5 h-3.5" />;
    }
  };

  const getStationLabel = (type: PrinterType) => {
    switch (type) {
      case 'KITCHEN':
        return 'Station: Kitchen / Dapur';
      case 'BAR':
        return 'Station: Bar / Minuman';
      case 'RECEIPT':
      default:
        return 'Station: Receipt / Kasir';
    }
  };

  const isLoading = printersLoading || outletsLoading;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 bg-emerald-800 text-white px-4 py-3 rounded-xl shadow-xl text-xs font-medium animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Page Header with Outlet Switcher */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Pengaturan Printer & Routing</h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Multi-Outlet
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Kelola perangkat printer fisik (kasir, bar, dapur) dan aturan routing pesanan khusus per cabang outlet.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-3">
          {/* Outlet Switcher Dropdown */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 shadow-xs">
            <Store className="w-4 h-4 text-[#0D5C53] shrink-0" />
            <span className="text-xs font-medium text-slate-600 shrink-0">Cabang:</span>
            <select
              value={effectiveOutletId}
              onChange={(e) => setSelectedOutletId(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-800 outline-none cursor-pointer pr-1"
            >
              {outlets.map((outlet) => (
                <option key={outlet.id} value={outlet.id}>
                  🏪 {outlet.name}
                </option>
              ))}
            </select>
          </div>

          <Button
            variant="outline"
            leftIcon={<SlidersHorizontal className="w-4 h-4" />}
            onClick={handleOpenRouting}
            className="text-xs font-semibold border-slate-200 hover:bg-slate-50"
          >
            Routing Kategori
          </Button>

          <Button
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={handleOpenAdd}
            className="bg-[#0D5C53] hover:bg-[#09423c] text-white shadow-sm"
          >
            + Tambah Printer
          </Button>
        </div>
      </div>

      {/* 2-Column Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Printer Cards (8 Cols) */}
        <div className="lg:col-span-8 space-y-3.5">
          <div className="flex items-center justify-between px-1">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Daftar Perangkat Printer — Cabang {activeOutlet?.name || ''}
              </h2>
              <p className="text-xs text-slate-500">
                Semua tiket pesanan di outlet ini akan dicetak sesuai station masing-masing printer.
              </p>
            </div>
            <Badge variant="info">
              {printers.length} Printer Terhubung
            </Badge>
          </div>

          {isLoading ? (
            <Card padding="lg" className="border-slate-200 text-center">
              <LoadingState message={`Memindai printer di cabang ${activeOutlet?.name || ''}...`} />
            </Card>
          ) : printers.length === 0 ? (
            <Card padding="lg" className="border-slate-200 text-center py-12">
              <EmptyState
                icon={<Printer className="w-10 h-10 text-slate-300 mx-auto" />}
                title={`Belum ada printer di cabang ${activeOutlet?.name || ''}`}
                description="Hubungkan printer thermal ESC/POS via Bluetooth, Ethernet LAN, atau USB untuk mencetak struk kasir dan tiket pesanan dapur secara otomatis."
                action={
                  <Button
                    variant="primary"
                    onClick={handleOpenAdd}
                    leftIcon={<Plus className="w-4 h-4" />}
                    className="bg-[#0D5C53] text-white"
                  >
                    Tambah Printer Pertama
                  </Button>
                }
              />
            </Card>
          ) : (
            printers.map((printer) => {
              const isConnected = printer.status === 'ACTIVE';
              const isTesting = testingPrinterId === printer.id;

              return (
                <div
                  key={printer.id}
                  className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs hover:shadow-xs transition-shadow"
                >
                  {/* Left: Icon & Info */}
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                        isConnected ? 'bg-slate-100 text-slate-700' : 'bg-slate-100/70 text-slate-400'
                      }`}
                    >
                      <Printer className="w-6 h-6" />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900">{printer.name}</h3>
                        {printer.isDefault && (
                          <span className="text-[10px] bg-teal-50 text-[#0D5C53] border border-teal-200 px-2 py-0.5 rounded-full font-semibold">
                            Default
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        {/* Station Tag */}
                        <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-medium text-[11px]">
                          {getStationLabel(printer.type)}
                        </span>

                        {/* Connection Status Pill */}
                        <span
                          className={`inline-flex items-center gap-1 font-semibold text-[11px] ${
                            isConnected ? 'text-emerald-700' : 'text-slate-400'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                            }`}
                          />
                          {isConnected ? 'Connected' : 'Offline'}
                        </span>

                        {/* Connection Type */}
                        <span className="inline-flex items-center gap-1 text-slate-500 text-[11px]">
                          {getConnectionIcon(printer.connectionType)}
                          <span className="capitalize">{printer.connectionType.toLowerCase()}</span>
                        </span>

                        {/* IP or MAC address if present */}
                        {printer.ipAddress && (
                          <span className="text-[11px] text-slate-400 font-mono">
                            {printer.ipAddress}:{printer.port || 9100}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Action Buttons */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {isConnected ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTestPrint(printer)}
                          isLoading={isTesting}
                          leftIcon={<PrinterCheck className="w-3.5 h-3.5" />}
                          className="text-xs font-semibold px-3 py-1.5 rounded-xl border-slate-200 hover:bg-slate-50"
                        >
                          Test Print
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEdit(printer)}
                          title="Edit Konfigurasi"
                          className="p-2 text-slate-500 hover:text-slate-800 rounded-xl border-slate-200"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleStatus(printer)}
                          title="Putuskan / Nonaktifkan"
                          className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl border-slate-200"
                        >
                          <Power className="w-3.5 h-3.5" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleToggleStatus(printer)}
                          className="bg-[#0D5C53] hover:bg-[#09423C] text-white text-xs font-semibold px-4 py-1.5 rounded-xl"
                        >
                          Hubungkan
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEdit(printer)}
                          title="Edit Konfigurasi"
                          className="p-2 text-slate-500 hover:text-slate-800 rounded-xl border-slate-200"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Widgets (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Card 1: Connection Info Card */}
          <Card padding="md" className="border-slate-200 space-y-3 bg-white shadow-2xs">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
              <div className="w-6 h-6 rounded-full bg-teal-50 text-[#0D5C53] flex items-center justify-center shrink-0">
                <Info className="w-3.5 h-3.5" />
              </div>
              <span>Konektivitas Printer Cabang</span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Pastikan printer Bluetooth berada dalam jangkauan 10 meter dari tablet/terminal POS di kasir cabang <strong>{activeOutlet?.name}</strong>.
            </p>

            {/* Schematic Illustration Box */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 flex items-center justify-center text-slate-400 py-6">
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 rounded-lg bg-teal-100 text-[#0D5C53] flex items-center justify-center shadow-xs">
                    <Monitor className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-semibold text-slate-600">POS Terminal</span>
                </div>

                <div className="flex items-center gap-1 text-[#0D5C53]">
                  <span className="w-2 h-0.5 bg-teal-300 rounded-full animate-pulse" />
                  <Radio className="w-4 h-4 text-teal-600 animate-bounce" />
                  <span className="w-2 h-0.5 bg-teal-300 rounded-full animate-pulse" />
                </div>

                <div className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-xs">
                    <Printer className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-semibold text-slate-600">ESC/POS</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Card 2: Routing Rules Card */}
          <Card padding="md" className="border-slate-200 space-y-4 bg-white shadow-2xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Routing Kategori</h3>
                <p className="text-[11px] text-slate-400">Pengalihan tiket stasiun pesanan</p>
              </div>
              <Badge variant="info">
                {routingRules.length} Dikonfigurasi
              </Badge>
            </div>

            <div className="space-y-2.5 text-xs">
              {routingRules.length === 0 ? (
                <div className="text-slate-400 text-xs py-2 italic">
                  Default: Semua pesanan diarahkan ke printer default.
                </div>
              ) : (
                routingRules.map((rule) => (
                  <div
                    key={rule.categoryId}
                    className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0"
                  >
                    <span className="font-medium text-slate-700">{rule.categoryName}</span>
                    <span className="font-bold text-slate-900 text-right">{rule.printerName}</span>
                  </div>
                ))
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenRouting}
              leftIcon={<SlidersHorizontal className="w-3.5 h-3.5" />}
              className="w-full text-xs font-semibold py-2 rounded-xl border-slate-200 hover:bg-slate-50"
            >
              Kelola Routing Kategori
            </Button>
          </Card>
        </div>
      </div>

      {/* Modal: Add / Edit Printer */}
      <Modal
        isOpen={isPrinterModalOpen}
        onClose={() => setIsPrinterModalOpen(false)}
        title={editingPrinter ? 'Edit Printer' : 'Tambah Printer Baru'}
        maxWidth="md"
      >
        <form onSubmit={handleSavePrinter} className="space-y-4 py-1">
          {/* Outlet Target Badge */}
          <div className="p-3 bg-teal-50 border border-teal-200/80 rounded-xl flex items-center gap-2 text-xs text-[#0D5C53] font-medium">
            <Store className="w-4 h-4 text-[#0D5C53] shrink-0" />
            <span>
              Cabang Penempatan: <strong>{activeOutlet?.name || 'Cabang Terpilih'}</strong>
            </span>
          </div>

          <FormInput
            label="Nama Perangkat Printer"
            required
            autoFocus
            placeholder="Contoh: Printer Kasir Depan, Thermal Dapur, Bar Printer"
            value={formData.name}
            onChange={(e) => {
              setFormData({ ...formData, name: e.target.value });
              if (formErrors.name) setFormErrors({ ...formErrors, name: '' });
            }}
            error={formErrors.name}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormSelect
              label="Station / Peran Target"
              required
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as PrinterType })}
            >
              <option value="RECEIPT">RECEIPT (Kasir & Struk Pelanggan)</option>
              <option value="KITCHEN">KITCHEN (Dapur & Makanan)</option>
              <option value="BAR">BAR (Minuman & Counter)</option>
            </FormSelect>

            <FormSelect
              label="Tipe Sambungan"
              required
              value={formData.connectionType}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  connectionType: e.target.value as PrinterConnectionType,
                })
              }
            >
              <option value="BLUETOOTH">Bluetooth (Wireless)</option>
              <option value="NETWORK">Ethernet / LAN (IP Address)</option>
              <option value="USB">USB Cable</option>
            </FormSelect>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormSelect
              label="Ukuran Kertas Thermal"
              value={formData.paperSize}
              onChange={(e) =>
                setFormData({ ...formData, paperSize: e.target.value as PrinterPaperSize })
              }
            >
              <option value="58mm">58mm (Kecil / Standar Portabel)</option>
              <option value="80mm">80mm (Lebar / Standar Kasir POS)</option>
            </FormSelect>

            {formData.connectionType === 'NETWORK' && (
              <FormInput
                label="Port Socket"
                type="number"
                value={formData.port}
                onChange={(e) => setFormData({ ...formData, port: Number(e.target.value) })}
              />
            )}
          </div>

          {/* Conditional Connection Details */}
          {formData.connectionType === 'NETWORK' && (
            <FormInput
              label="IP Address Printer"
              required
              placeholder="192.168.1.200"
              value={formData.ipAddress}
              onChange={(e) => {
                setFormData({ ...formData, ipAddress: e.target.value });
                if (formErrors.ipAddress) setFormErrors({ ...formErrors, ipAddress: '' });
              }}
              error={formErrors.ipAddress}
              helperText="Alamat IP statis printer pada jaringan Wi-Fi/LAN lokal cabang."
            />
          )}

          {formData.connectionType === 'BLUETOOTH' && (
            <FormInput
              label="Bluetooth MAC / Nama Perangkat (Opsional)"
              placeholder="Contoh: 00:11:22:33:44:55 atau RPP02N"
              value={formData.bluetoothMac}
              onChange={(e) => setFormData({ ...formData, bluetoothMac: e.target.value })}
              helperText="Lakukan pairing perangkat di Bluetooth OS sebelum melakukan tes cetak."
            />
          )}

          {/* Default Toggle */}
          <div className="pt-2">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={formData.isDefault}
                onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                className="w-4 h-4 rounded text-[#0D5C53] focus:ring-[#0D5C53]/20"
              />
              <span className="text-xs font-semibold text-slate-700">
                Jadikan sebagai Printer Default di Cabang Ini
              </span>
            </label>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            {editingPrinter ? (
              <button
                type="button"
                onClick={() => handleDeletePrinter(editingPrinter.id, editingPrinter.name)}
                className="text-xs text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1 font-medium cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Hapus Printer
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2.5">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPrinterModalOpen(false)}
                disabled={createPrinterMutation.isPending || updatePrinterMutation.isPending}
              >
                Batal
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={createPrinterMutation.isPending || updatePrinterMutation.isPending}
                className="bg-[#0D5C53] hover:bg-[#09423C] text-white px-5"
              >
                {editingPrinter ? 'Simpan Perubahan' : 'Tambah Printer'}
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Modal: Manage Routing Rules */}
      <Modal
        isOpen={isRoutingModalOpen}
        onClose={() => setIsRoutingModalOpen(false)}
        title="Aturan Routing Kategori Pesanan"
        subtitle={`Arahkan tiket pesanan per kategori menu ke printer dapur atau bar khusus cabang ${activeOutlet?.name || ''}.`}
        maxWidth="lg"
      >
        <form onSubmit={handleSaveRouting} className="space-y-4 py-2">
          {categories.length === 0 ? (
            <div className="text-center py-6 text-slate-500 text-xs">
              Belum ada kategori produk. Buat kategori terlebih dahulu di Manajemen Produk.
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-4 text-xs"
                >
                  <div className="font-semibold text-slate-900">{cat.name}</div>
                  <div className="min-w-[200px]">
                    <select
                      value={routingState[cat.id] || ''}
                      onChange={(e) =>
                        setRoutingState({ ...routingState, [cat.id]: e.target.value })
                      }
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20"
                    >
                      <option value="">-- Printer Default --</option>
                      {printers.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.type})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsRoutingModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={updateRoutingMutation.isPending}
              className="bg-[#0D5C53] hover:bg-[#09423C] text-white"
            >
              Simpan Aturan Routing
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
