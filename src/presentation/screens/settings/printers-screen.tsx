import React, { useState, useEffect } from 'react';
import type {
  PrinterSetting,
  PrinterType,
  PrinterConnectionType,
  PrinterPaperSize,
  PrinterRoutingRule,
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
  usePosSettings,
  useUpdatePosSettingsMutation,
  useUploadBillLogoMutation,
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
  Receipt,
  UploadCloud,
  Image as ImageIcon,
  Globe,
  Save,
  RotateCcw,
  Sparkles,
  Eye,
} from 'lucide-react';
import {
  Button,
  Badge,
  Card,
  Modal,
  FormInput,
  FormSelect,
  CustomSelect,
  LoadingState,
  EmptyState,
  Tabs,
} from '@presentation/components/ui';

export const PrintersScreen: React.FC = () => {
  const currentOutlet = useAuthStore((state) => state.currentOutlet);
  const { data: rawOutlets = [], isLoading: outletsLoading } = useOutlets();
  const outlets = Array.isArray(rawOutlets) ? rawOutlets : [];

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
    data: rawPrinters,
    isLoading: printersLoading,
    refetch,
  } = usePrinters(effectiveOutletId || undefined);
  const printers: PrinterSetting[] = Array.isArray(rawPrinters)
    ? rawPrinters
    : Array.isArray((rawPrinters as unknown as { printers?: PrinterSetting[] })?.printers)
    ? ((rawPrinters as unknown as { printers: PrinterSetting[] }).printers)
    : [];

  const {
    data: rawRoutingRules,
    isLoading: routingLoading,
    refetch: refetchRouting,
  } = usePrinterRoutingRules(effectiveOutletId || undefined);
  const routingRules: PrinterRoutingRule[] = Array.isArray(rawRoutingRules)
    ? rawRoutingRules
    : Array.isArray((rawRoutingRules as unknown as { rules?: PrinterRoutingRule[] })?.rules)
    ? ((rawRoutingRules as unknown as { rules: PrinterRoutingRule[] }).rules)
    : [];

  const { data: rawCategories = [] } = useCategories();
  const categories = Array.isArray(rawCategories) ? rawCategories : [];
  const configuredRules = routingRules.filter((r) => Boolean(r && r.printerId && r.printerName));

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

  // Active Tab & Global Format Struk State
  const tenant = useAuthStore((state) => state.tenant);
  const [activeTab, setActiveTab] = useState<'devices' | 'routing' | 'format'>('devices');

  const { data: posSettings } = usePosSettings();
  const updatePosSettingsMutation = useUpdatePosSettingsMutation();
  const uploadLogoMutation = useUploadBillLogoMutation();

  const [billLogoUrl, setBillLogoUrl] = useState<string | null>(null);
  const [isFooterEnabled, setIsFooterEnabled] = useState<boolean>(true);
  const [billFooterText, setBillFooterText] = useState<string>('Terima kasih atas kunjungan Anda!');
  const [isUploadingLogo, setIsUploadingLogo] = useState<boolean>(false);
  const [isSavingFormat, setIsSavingFormat] = useState<boolean>(false);
  const [previewPaperSize, setPreviewPaperSize] = useState<'58mm' | '80mm'>('58mm');
  const logoFileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Sync with fetched posSettings
  useEffect(() => {
    if (posSettings) {
      setBillLogoUrl(posSettings.billLogoUrl || null);
      if (posSettings.billFooterText !== undefined) {
        const text = posSettings.billFooterText || '';
        setBillFooterText(text);
        setIsFooterEnabled(Boolean(text && text.trim().length > 0));
      }
    }
  }, [posSettings]);

  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Ukuran file logo maksimal 2MB.');
      return;
    }

    setIsUploadingLogo(true);
    try {
      const res = await uploadLogoMutation.mutateAsync(file);
      setBillLogoUrl(res.url);
      showToast('Logo berhasil diunggah! Klik "Simpan Format Struk" untuk menerapkan.');
    } catch (err: unknown) {
      alert(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Gagal mengunggah logo toko.'
      );
    } finally {
      setIsUploadingLogo(false);
      if (logoFileInputRef.current) {
        logoFileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveLogo = () => {
    setBillLogoUrl(null);
    showToast('Logo dihapus dari pratinjau. Klik "Simpan Format Struk" untuk menerapkan.');
  };

  const handleSaveReceiptFormat = async () => {
    setIsSavingFormat(true);
    try {
      await updatePosSettingsMutation.mutateAsync({
        outletId: null,
        billLogoUrl: billLogoUrl || null,
        billFooterText: isFooterEnabled ? (billFooterText.trim() || null) : null,
      });
      showToast('Format struk & logo toko berhasil disimpan secara global!');
    } catch (err: unknown) {
      alert(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Gagal menyimpan format struk.'
      );
    } finally {
      setIsSavingFormat(false);
    }
  };

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
    if (Array.isArray(routingRules)) {
      routingRules.forEach((r) => {
        if (r && r.categoryId && r.printerId) {
          map[r.categoryId] = r.printerId;
        }
      });
    }
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
          <div className="flex items-center gap-2">
            <CustomSelect
              ariaLabel="Pilih Cabang Printer"
              icon={<Store className="w-4 h-4 text-[#0D5C53]" />}
              value={effectiveOutletId}
              onChange={(val) => setSelectedOutletId(val)}
              options={outlets.map((outlet) => ({
                value: outlet.id,
                label: outlet.name,
              }))}
              buttonClassName="bg-slate-50 border-slate-200 text-xs py-2 px-3 rounded-xl font-semibold"
            />
          </div>

          {activeTab === 'devices' && (
            <>
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
            </>
          )}

          {activeTab === 'routing' && (
            <Button
              variant="primary"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={handleOpenAdd}
              className="bg-[#0D5C53] hover:bg-[#09423c] text-white shadow-sm"
            >
              + Tambah Printer
            </Button>
          )}

          {activeTab === 'format' && (
            <Button
              variant="primary"
              leftIcon={<Save className="w-4 h-4" />}
              onClick={handleSaveReceiptFormat}
              isLoading={isSavingFormat || updatePosSettingsMutation.isPending}
              className="bg-[#0D5C53] hover:bg-[#09423c] text-white shadow-sm font-bold"
            >
              Simpan Format Struk
            </Button>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white p-2 sm:px-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <Tabs
          tabs={[
            {
              id: 'devices',
              label: 'Perangkat Printer',
              icon: <Printer className="w-4 h-4" />,
              count: printers.length,
            },
            {
              id: 'routing',
              label: 'Routing Kategori',
              icon: <SlidersHorizontal className="w-4 h-4" />,
              count: configuredRules.length,
            },
            {
              id: 'format',
              label: 'Format Struk & Logo Toko',
              icon: <Receipt className="w-4 h-4" />,
            },
          ]}
          activeTab={activeTab}
          onChange={(id) => setActiveTab(id as 'devices' | 'routing' | 'format')}
        />
      </div>

      {/* Tab 1: Perangkat Printer */}
      {activeTab === 'devices' && (
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
                {configuredRules.length} Dikonfigurasi
              </Badge>
            </div>

            <div className="space-y-2.5 text-xs">
              {configuredRules.length === 0 ? (
                <div className="text-slate-400 text-xs py-2 italic">
                  Default: Semua pesanan diarahkan ke printer default.
                </div>
              ) : (
                configuredRules.map((rule) => (
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
      )}

      {/* Tab 2: Routing Kategori */}
      {activeTab === 'routing' && (
        <Card padding="lg" className="border-slate-200 bg-white shadow-2xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Aturan Routing Kategori Pesanan
                </h2>
                <Badge variant="info">{activeOutlet?.name || 'Cabang Terpilih'}</Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Tentukan printer tujuan (Dapur, Bar, atau Kasir) untuk setiap kategori menu saat pesanan dikirim.
              </p>
            </div>
            <Button
              variant="primary"
              onClick={handleOpenRouting}
              leftIcon={<SlidersHorizontal className="w-4 h-4" />}
              className="bg-[#0D5C53] hover:bg-[#09423C] text-white self-start sm:self-auto text-xs font-semibold"
            >
              Ubah Konfigurasi Routing
            </Button>
          </div>

          {categories.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              Belum ada kategori produk terdaftar di sistem. Silakan tambahkan kategori di menu Produk.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {categories.map((cat) => {
                const matchedRule = routingRules.find((r) => r.categoryId === cat.id);
                return (
                  <div
                    key={cat.id}
                    className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between gap-3"
                  >
                    <div>
                      <span className="text-xs font-bold text-slate-900">{cat.name}</span>
                      <p className="text-[11px] text-slate-500">Tiket pesanan kategori</p>
                    </div>
                    {matchedRule?.printerName ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-teal-50 text-[#0D5C53] border border-teal-200">
                        <Printer className="w-3.5 h-3.5" />
                        {matchedRule.printerName}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-200/70 text-slate-600">
                        Printer Default
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {/* Tab 3: Format Struk & Logo Bisnis */}
      {activeTab === 'format' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Form Settings (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            {/* Global Scope Banner */}
            <div className="p-4 bg-teal-50/80 border border-teal-200/80 rounded-2xl flex items-start gap-3.5 shadow-2xs">
              <div className="w-9 h-9 rounded-xl bg-teal-100 text-[#0D5C53] flex items-center justify-center shrink-0 mt-0.5">
                <Globe className="w-5 h-5" />
              </div>
              <div className="space-y-1 text-xs">
                <div className="font-bold text-[#0D5C53] flex items-center gap-2">
                  <span>Logo Bisnis & Pengaturan Struk Global</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                    Berlaku Semua Cabang
                  </span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Logo resmi bisnis berlaku secara global untuk seluruh cabang outlet. Setiap struk transaksi di cabang mana pun akan mencetak logo ini di posisi teratas, diikuti oleh nama cabang, alamat, dan kontak telepon cabang terkait secara otomatis.
                </p>
              </div>
            </div>

            {/* Card 1: Logo Toko */}
            <Card padding="lg" className="border-slate-200 bg-white shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-[#0D5C53]" />
                    Logo Bisnis / Toko Resmi
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Dicetak di posisi paling atas pada setiap struk kasir pembayaran.
                  </p>
                </div>
                {billLogoUrl ? (
                  <Badge variant="success">Logo Aktif</Badge>
                ) : (
                  <Badge variant="neutral">Belum Ada Logo</Badge>
                )}
              </div>

              {/* Hidden File Input */}
              <input
                type="file"
                ref={logoFileInputRef}
                accept="image/png,image/jpeg,image/webp"
                onChange={handleLogoFileChange}
                className="hidden"
              />

              {billLogoUrl ? (
                <div className="space-y-4">
                  <div className="p-6 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-col items-center justify-center gap-2.5">
                    <div className="p-3 bg-white rounded-xl shadow-xs border border-slate-200/80">
                      <img
                        src={billLogoUrl}
                        alt="Logo Toko"
                        className="max-h-24 max-w-[220px] object-contain"
                      />
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium">
                      Pratinjau Logo Bisnis Aktif
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => logoFileInputRef.current?.click()}
                      isLoading={isUploadingLogo}
                      leftIcon={<UploadCloud className="w-3.5 h-3.5" />}
                      className="text-xs font-semibold border-slate-200 hover:bg-slate-50"
                    >
                      Ganti Logo
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleRemoveLogo}
                      leftIcon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
                      className="text-xs font-semibold text-rose-600 hover:bg-rose-50 border-rose-200"
                    >
                      Hapus Logo
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => logoFileInputRef.current?.click()}
                  className="p-8 border-2 border-dashed border-slate-300 hover:border-[#0D5C53] rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer bg-slate-50/50 hover:bg-teal-50/20 transition-all group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-teal-50 text-[#0D5C53] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform shadow-xs">
                    {isUploadingLogo ? (
                      <div className="w-5 h-5 border-2 border-[#0D5C53] border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <UploadCloud className="w-6 h-6" />
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-slate-800">
                    {isUploadingLogo ? 'Mengunggah logo...' : 'Klik untuk Unggah Logo Bisnis'}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1 max-w-sm">
                    Mendukung format gambar PNG, JPG, atau WebP (Maks. 2MB). Disarankan berlatar belakang transparan atau putih polos.
                  </p>
                </div>
              )}
            </Card>

            {/* Card 2: Catatan Kaki (Footer Struk) */}
            <Card padding="lg" className="border-slate-200 bg-white shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-[#0D5C53]" />
                    Catatan Kaki Struk (Footer)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Pesan penutup di bagian paling bawah struk kasir pembayaran.
                  </p>
                </div>

                {/* Toggle Switch */}
                <div className="flex items-center gap-2.5">
                  <span className={`text-xs font-semibold ${isFooterEnabled ? 'text-[#0D5C53]' : 'text-slate-400'}`}>
                    {isFooterEnabled ? 'Footer Aktif' : 'Footer Nonaktif'}
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isFooterEnabled}
                    onClick={() => setIsFooterEnabled(!isFooterEnabled)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                      isFooterEnabled ? 'bg-[#0D5C53]' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        isFooterEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {isFooterEnabled ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Isi Pesan Catatan Kaki
                    </label>
                    <textarea
                      rows={3}
                      value={billFooterText}
                      onChange={(e) => setBillFooterText(e.target.value)}
                      placeholder="Contoh: Terima kasih atas kunjungan Anda!&#10;Barang yang sudah dibeli tidak dapat ditukar.&#10;Follow IG: @tokocoffee"
                      className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53] transition-all resize-y font-mono"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Tips: Tekan tombol Enter pada keyboard untuk memisahkan baris baru pada struk cetak.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setBillFooterText('Terima kasih atas kunjungan Anda!')}
                      className="text-[11px] text-[#0D5C53] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" /> Gunakan Contoh Standar
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => setBillFooterText('')}
                      className="text-[11px] text-slate-500 hover:text-slate-800 hover:underline font-medium cursor-pointer"
                    >
                      Kosongkan Teks
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 rounded-xl text-center text-xs text-slate-500 italic">
                  Catatan kaki saat ini dinonaktifkan. Struk kasir akan dicetak tanpa teks penutup tambahan.
                </div>
              )}
            </Card>

            {/* Bottom Save Action Bar */}
            <div className="flex items-center justify-between bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="text-xs text-slate-500 max-w-sm">
                Perubahan logo dan catatan kaki akan langsung berlaku saat kasir mencetak struk transaksi berikutnya.
              </div>
              <Button
                type="button"
                variant="primary"
                onClick={handleSaveReceiptFormat}
                isLoading={isSavingFormat || updatePosSettingsMutation.isPending}
                leftIcon={<Save className="w-4 h-4" />}
                className="bg-[#0D5C53] hover:bg-[#09423C] text-white shadow-sm font-bold px-6"
              >
                Simpan Format Struk
              </Button>
            </div>
          </div>

          {/* Right Column: Live Thermal Receipt Simulator (5 cols) */}
          <div className="lg:col-span-5 sticky top-6 space-y-4">
            <Card padding="md" className="border-slate-200 bg-white shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-[#0D5C53]" />
                  <h3 className="text-xs font-bold text-slate-900">Simulasi Struk Kasir</h3>
                </div>
                {/* Paper Width Toggle */}
                <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-[10px] font-bold">
                  <button
                    type="button"
                    onClick={() => setPreviewPaperSize('58mm')}
                    className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                      previewPaperSize === '58mm'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    58mm
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewPaperSize('80mm')}
                    className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                      previewPaperSize === '80mm'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    80mm
                  </button>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 flex items-center justify-between">
                <span>Simulasi Cabang:</span>
                <span className="font-semibold text-slate-800">{activeOutlet?.name || 'Outlet Utama'}</span>
              </div>

              {/* Thermal Paper Look Container */}
              <div className="bg-slate-100 p-4 sm:p-5 rounded-2xl flex justify-center">
                <div
                  className={`bg-white border border-slate-200/90 p-5 font-mono text-slate-900 text-xs leading-relaxed transition-all duration-200 rounded-lg ${
                    previewPaperSize === '58mm' ? 'w-[260px]' : 'w-[320px]'
                  }`}
                  style={{
                    boxShadow: '0 6px 18px 0 rgba(0, 0, 0, 0.08)',
                  }}
                >
                  {/* Receipt Header */}
                  <div className="text-center pb-3 border-b border-dashed border-slate-300">
                    {billLogoUrl ? (
                      <div className="flex justify-center mb-2">
                        <img
                          src={billLogoUrl}
                          alt="Logo Toko"
                          className="max-h-12 max-w-[130px] object-contain"
                        />
                      </div>
                    ) : (
                      <div className="p-1 mb-1.5 border border-dashed border-slate-200 rounded text-[9px] text-slate-400 italic">
                        [ Belum Ada Logo Bisnis ]
                      </div>
                    )}
                    <h4 className="font-bold text-xs tracking-wider uppercase">
                      {tenant?.businessName || tenant?.name || 'AGILIX POS'}
                    </h4>
                    <p className="text-[10px] text-slate-600 font-sans font-medium">
                      {activeOutlet?.name || 'Outlet Utama'}
                    </p>
                    <p className="text-[9px] text-slate-500">
                      {activeOutlet?.address || 'Alamat Cabang Outlet'}
                    </p>
                    {activeOutlet?.phone && (
                      <p className="text-[9px] text-slate-500">Telp: {activeOutlet.phone}</p>
                    )}
                  </div>

                  {/* Order Info */}
                  <div className="py-2 border-b border-dashed border-slate-300 text-[10px] space-y-0.5">
                    <div className="flex justify-between">
                      <span>No. Order:</span>
                      <span className="font-semibold">ORD-2026-0042</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Waktu:</span>
                      <span>22/09/2026, 12:30</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tipe:</span>
                      <span className="font-semibold">Dine-In (Meja 04)</span>
                    </div>
                  </div>

                  {/* Sample Items */}
                  <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1.5 text-[10px]">
                    <div>
                      <div className="flex justify-between font-semibold">
                        <span>Kopi Susu Gula Aren</span>
                        <span>Rp 22.000</span>
                      </div>
                      <div className="text-[9px] text-slate-400 flex justify-between">
                        <span>1 x Rp 22.000</span>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between font-semibold">
                        <span>Croissant Butter</span>
                        <span>Rp 28.000</span>
                      </div>
                      <div className="text-[9px] text-slate-400 flex justify-between">
                        <span>1 x Rp 28.000</span>
                      </div>
                    </div>
                  </div>

                  {/* Totals */}
                  <div className="py-2 border-b border-dashed border-slate-300 text-[10px] space-y-1">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>Rp 50.000</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>PB1 (10%)</span>
                      <span>Rp 5.000</span>
                    </div>
                    <div className="flex justify-between font-bold text-xs pt-1 border-t border-slate-100">
                      <span>TOTAL</span>
                      <span>Rp 55.000</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-600">
                      <span>Bayar (QRIS)</span>
                      <span>Rp 55.000</span>
                    </div>
                  </div>

                  {/* Footer */}
                  {isFooterEnabled && billFooterText && billFooterText.trim() ? (
                    <div className="text-center pt-3 text-[9px] text-slate-600 space-y-0.5">
                      <p className="whitespace-pre-line">{billFooterText.trim()}</p>
                      <p className="text-[8px] text-slate-400 pt-1">Powered by Agilix POS</p>
                    </div>
                  ) : (
                    <div className="text-center pt-2 text-[8px] text-slate-400">
                      <p>Powered by Agilix POS</p>
                    </div>
                  )}

                  {/* Jagged Bottom Tear Effect */}
                  <div className="mt-4 pt-2 border-b-2 border-dotted border-slate-300" />
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

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
                    <CustomSelect
                      ariaLabel="Pilih Printer Kategori"
                      value={routingState[cat.id] || ''}
                      onChange={(val) =>
                        setRoutingState({ ...routingState, [cat.id]: val })
                      }
                      options={[
                        { value: '', label: '-- Printer Default --' },
                        ...printers.map((p) => ({
                          value: p.id,
                          label: `${p.name} (${p.type})`,
                        })),
                      ]}
                      buttonClassName="w-full bg-white border-slate-200 text-xs py-1.5 px-3 rounded-lg font-medium"
                    />
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
