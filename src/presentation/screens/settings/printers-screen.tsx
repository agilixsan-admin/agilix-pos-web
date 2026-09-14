import React, { useState } from 'react';
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
  const outletId = currentOutlet?.id;

  // Queries
  const { data: printers = [], isLoading: printersLoading, refetch } = usePrinters(outletId);
  const { data: routingRules = [], isLoading: routingLoading, refetch: refetchRouting } = usePrinterRoutingRules(outletId);
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
    if (!formData.name.trim()) errors.name = 'Printer name is required';
    if (formData.connectionType === 'NETWORK' && !formData.ipAddress.trim()) {
      errors.ipAddress = 'IP address is required for network printers';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSavePrinter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePrinterForm() || !outletId) return;

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
        showToast(`Printer "${formData.name}" updated successfully.`);
      } else {
        await createPrinterMutation.mutateAsync({
          outletId,
          name: formData.name.trim(),
          type: formData.type,
          connectionType: formData.connectionType,
          paperSize: formData.paperSize,
          ipAddress: formData.connectionType === 'NETWORK' ? formData.ipAddress.trim() : undefined,
          port: formData.connectionType === 'NETWORK' ? Number(formData.port) : undefined,
          bluetoothMac: formData.connectionType === 'BLUETOOTH' ? formData.bluetoothMac.trim() : undefined,
          isDefault: formData.isDefault,
        });
        showToast(`Printer "${formData.name}" added successfully.`);
      }

      setIsPrinterModalOpen(false);
      refetch();
    } catch (err: unknown) {
      alert(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Failed to save printer configuration.'
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
      showToast(`Printer "${printer.name}" is now ${nextStatus === 'ACTIVE' ? 'connected' : 'offline'}.`);
      refetch();
    } catch (err: unknown) {
      alert('Failed to update printer status.');
    }
  };

  const handleDeletePrinter = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete printer "${name}"?`)) return;
    try {
      await deletePrinterMutation.mutateAsync(id);
      setIsPrinterModalOpen(false);
      showToast(`Printer "${name}" deleted.`);
      refetch();
    } catch (err: unknown) {
      alert('Failed to delete printer.');
    }
  };

  const handleTestPrint = async (printer: PrinterSetting) => {
    setTestingPrinterId(printer.id);
    try {
      await testPrintMutation.mutateAsync(printer.id);
      showToast(`Test print sent to "${printer.name}" successfully.`);
    } catch (err: unknown) {
      alert(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          `Failed to execute test print on "${printer.name}". Check connection.`
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
    if (!outletId) return;

    try {
      const routings = Object.entries(routingState)
        .filter(([_, pId]) => Boolean(pId))
        .map(([cId, pId]) => ({ categoryId: cId, printerId: pId }));

      await updateRoutingMutation.mutateAsync({
        outletId,
        routings,
      });

      setIsRoutingModalOpen(false);
      showToast('Printer routing rules updated successfully.');
      refetchRouting();
    } catch (err: unknown) {
      alert('Failed to update routing rules.');
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
        return 'Station: Kitchen';
      case 'BAR':
        return 'Station: Bar';
      case 'RECEIPT':
      default:
        return 'Station: Receipt / Kasir';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 bg-emerald-800 text-white px-4 py-3 rounded-xl shadow-xl text-xs font-medium animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Printers & Routing</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage station printers and connectivity.
          </p>
        </div>

        <Button
          variant="primary"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={handleOpenAdd}
          className="bg-[#0D5C53] hover:bg-[#09423C] text-white self-start sm:self-auto rounded-xl font-medium"
        >
          Add Printer
        </Button>
      </div>

      {/* 2-Column Grid Layout (Matching Figma Mockup) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Printer Cards (8 Cols) */}
        <div className="lg:col-span-8 space-y-3.5">
          {printersLoading ? (
            <Card padding="lg" className="border-slate-200 text-center">
              <LoadingState message="Scanning configured printers..." />
            </Card>
          ) : printers.length === 0 ? (
            <Card padding="lg" className="border-slate-200 text-center py-12">
              <EmptyState
                icon={<Printer className="w-10 h-10 text-slate-300 mx-auto" />}
                title="No printers connected"
                description="Connect thermal ESC/POS printers via Bluetooth, Ethernet LAN, or USB to automate receipt and kitchen ticket printing."
                action={
                  <Button
                    variant="primary"
                    onClick={handleOpenAdd}
                    leftIcon={<Plus className="w-4 h-4" />}
                    className="bg-[#0D5C53] text-white"
                  >
                    Add First Printer
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
                          title="Edit Configuration"
                          className="p-2 text-slate-500 hover:text-slate-800 rounded-xl border-slate-200"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleStatus(printer)}
                          title="Disconnect / Power Off"
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
                          Connect
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEdit(printer)}
                          title="Edit Configuration"
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
          {/* Card 1: Bluetooth & Connection Info Card */}
          <Card padding="md" className="border-slate-200 space-y-3 bg-white shadow-2xs">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
              <div className="w-6 h-6 rounded-full bg-teal-50 text-[#0D5C53] flex items-center justify-center shrink-0">
                <Info className="w-3.5 h-3.5" />
              </div>
              <span>Bluetooth Connectivity</span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Ensure printers are within 30 feet of this terminal. Metal surfaces may interfere with the signal.
            </p>

            {/* Schematic Illustration Box */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 flex items-center justify-center text-slate-400 py-6">
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 rounded-lg bg-teal-100 text-[#0D5C53] flex items-center justify-center shadow-xs">
                    <Monitor className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-semibold text-slate-600">Terminal</span>
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
                  <span className="text-[10px] font-semibold text-slate-600">Printer</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Card 2: Routing Rules Card */}
          <Card padding="md" className="border-slate-200 space-y-4 bg-white shadow-2xs">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Routing Rules</h3>
              <Badge variant="info">
                {routingRules.length} Configured
              </Badge>
            </div>

            <div className="space-y-2.5 text-xs">
              {routingRules.length === 0 ? (
                <div className="text-slate-400 text-xs py-2 italic">
                  Default: All orders route to default printer.
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
              Manage Routing
            </Button>
          </Card>
        </div>
      </div>

      {/* Modal: Add / Edit Printer */}
      <Modal
        isOpen={isPrinterModalOpen}
        onClose={() => setIsPrinterModalOpen(false)}
        title={editingPrinter ? 'Edit Printer' : 'Add New Printer'}
        maxWidth="md"
      >
        <form onSubmit={handleSavePrinter} className="space-y-4 py-1">
          <FormInput
            label="Printer Name"
            required
            autoFocus
            placeholder="e.g. Kitchen Printer, Bar Thermal"
            value={formData.name}
            onChange={(e) => {
              setFormData({ ...formData, name: e.target.value });
              if (formErrors.name) setFormErrors({ ...formErrors, name: '' });
            }}
            error={formErrors.name}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormSelect
              label="Station / Target Role"
              required
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as PrinterType })}
            >
              <option value="RECEIPT">RECEIPT (Kasir & Struk Pelanggan)</option>
              <option value="KITCHEN">KITCHEN (Dapur & Makanan)</option>
              <option value="BAR">BAR (Minuman & Counter)</option>
            </FormSelect>

            <FormSelect
              label="Connection Type"
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
              label="Paper Size"
              value={formData.paperSize}
              onChange={(e) =>
                setFormData({ ...formData, paperSize: e.target.value as PrinterPaperSize })
              }
            >
              <option value="58mm">58mm (Small Thermal)</option>
              <option value="80mm">80mm (Standard POS Thermal)</option>
            </FormSelect>

            {formData.connectionType === 'NETWORK' && (
              <FormInput
                label="Port"
                type="number"
                value={formData.port}
                onChange={(e) => setFormData({ ...formData, port: Number(e.target.value) })}
              />
            )}
          </div>

          {/* Conditional Connection Details */}
          {formData.connectionType === 'NETWORK' && (
            <FormInput
              label="IP Address"
              required
              placeholder="192.168.1.200"
              value={formData.ipAddress}
              onChange={(e) => {
                setFormData({ ...formData, ipAddress: e.target.value });
                if (formErrors.ipAddress) setFormErrors({ ...formErrors, ipAddress: '' });
              }}
              error={formErrors.ipAddress}
              helperText="Static IP address assigned to the printer on the local network."
            />
          )}

          {formData.connectionType === 'BLUETOOTH' && (
            <FormInput
              label="Bluetooth MAC / Device Name (Optional)"
              placeholder="e.g. 00:11:22:33:44:55 or RPP02N"
              value={formData.bluetoothMac}
              onChange={(e) => setFormData({ ...formData, bluetoothMac: e.target.value })}
              helperText="Pair device in OS Settings before testing print."
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
                Set as Default Terminal Printer
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
                <Trash2 className="w-3.5 h-3.5" /> Delete Printer
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
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={createPrinterMutation.isPending || updatePrinterMutation.isPending}
                className="bg-[#0D5C53] hover:bg-[#09423C] text-white px-5"
              >
                {editingPrinter ? 'Save Changes' : 'Add Printer'}
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Modal: Manage Routing Rules */}
      <Modal
        isOpen={isRoutingModalOpen}
        onClose={() => setIsRoutingModalOpen(false)}
        title="Manage Print Routing Rules"
        subtitle="Direct order items from specific categories to designated kitchen or bar printers."
        maxWidth="lg"
      >
        <form onSubmit={handleSaveRouting} className="space-y-4 py-2">
          {categories.length === 0 ? (
            <div className="text-center py-6 text-slate-500 text-xs">
              No categories found. Create categories first in Product Management.
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
                      <option value="">-- Default Printer --</option>
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
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={updateRoutingMutation.isPending}
              className="bg-[#0D5C53] hover:bg-[#09423C] text-white"
            >
              Save Routing Rules
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
