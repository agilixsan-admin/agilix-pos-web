import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Building2,
  Calendar,
  AlertCircle,
  FileText,
  Boxes,
  CheckCircle2,
  Store,
} from 'lucide-react';
import { useAuthStore } from '@domain/state/auth-store';
import {
  useSuppliers,
  useRawMaterials,
  usePackagingItems,
  useCreatePurchaseMutation,
  useOutlets,
} from '@domain/hooks';
import {
  Card,
  Button,
  FormInput,
  FormSelect,
  FormTextarea,
  Badge,
  CustomSelect,
  FormDatePicker,
  toast,
} from '@presentation/components/ui';

interface PurchaseFormItem {
  tempId: string;
  itemType: 'RAW_MATERIAL' | 'PACKAGING';
  inventoryItemId: string;
  itemName: string;
  sku: string;
  unit: string;
  systemStock: number;
  quantityOrdered: number;
  totalPrice: number;
}

export const PurchaseCreateScreen: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentOutlet = useAuthStore((state) => state.currentOutlet);
  const { data: outlets = [] } = useOutlets();

  // Multi-Outlet Scoping
  const queryOutletId = searchParams.get('outletId');
  const [selectedOutletId, setSelectedOutletId] = useState<string>(queryOutletId || '');

  useEffect(() => {
    if (!selectedOutletId && (currentOutlet?.id || outlets[0]?.id)) {
      setSelectedOutletId(currentOutlet?.id || outlets[0]?.id || '');
    }
  }, [currentOutlet, outlets, selectedOutletId]);

  const effectiveOutletId =
    selectedOutletId ||
    currentOutlet?.id ||
    (outlets.length > 0 ? outlets[0].id : '');
  const activeOutlet =
    outlets.find((o) => o.id === effectiveOutletId) || currentOutlet;
  const activeBranchName = activeOutlet?.name || 'Cabang Utama';

  // Queries (Scoped to effectiveOutletId)
  const { data: suppliers = [], isLoading: loadingSuppliers } = useSuppliers({ status: 'ACTIVE' });
  const { data: rawMaterials = [] } = useRawMaterials({ outletId: effectiveOutletId });
  const { data: packagingItems = [] } = usePackagingItems({ outletId: effectiveOutletId });

  // Mutation
  const createPurchaseMutation = useCreatePurchaseMutation();

  // Form State
  const [purchaseNumber, setPurchaseNumber] = useState<string>('');
  const [purchaseDate, setPurchaseDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [supplierId, setSupplierId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [items, setItems] = useState<PurchaseFormItem[]>([]);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // Calculations
  const totalItemsCount = items.length;
  const subtotal = useMemo(() => {
    return items.reduce((acc, item) => acc + (Number(item.totalPrice) || 0), 0);
  }, [items]);
  const totalAmount = subtotal;

  const formatRupiah = (val: number) => {
    return `Rp ${new Intl.NumberFormat('id-ID').format(val)}`;
  };

  // Add Item Row
  const handleAddItem = () => {
    let defaultItem = rawMaterials[0];
    let type: 'RAW_MATERIAL' | 'PACKAGING' = 'RAW_MATERIAL';

    if (!defaultItem && packagingItems.length > 0) {
      defaultItem = packagingItems[0] as any;
      type = 'PACKAGING';
    }

    const defaultUnitCost = Number(defaultItem?.unitCost || defaultItem?.costPrice || 0);
    const defaultItemId = defaultItem
      ? (defaultItem as any).inventoryItemId || defaultItem.id
      : '';
    const defaultUnit = defaultItem?.unit || (defaultItem as any)?.inventoryItem?.unit || 'pcs';

    const newItem: PurchaseFormItem = {
      tempId: Math.random().toString(36).substring(2, 9),
      itemType: type,
      inventoryItemId: defaultItemId,
      itemName: defaultItem?.name || '',
      sku: defaultItem?.sku || defaultItem?.code || '',
      unit: defaultUnit,
      systemStock: Number(defaultItem?.currentStock || 0),
      quantityOrdered: 1,
      totalPrice: defaultUnitCost,
    };

    setItems([...items, newItem]);
    if (formErrors.items) {
      setFormErrors((prev) => ({ ...prev, items: '' }));
    }
  };

  // Remove Item Row
  const handleRemoveItem = (tempId: string) => {
    setItems(items.filter((item) => item.tempId !== tempId));
  };

  // Handle Type Change for a row
  const handleTypeChange = (tempId: string, newType: 'RAW_MATERIAL' | 'PACKAGING') => {
    const list = newType === 'RAW_MATERIAL' ? rawMaterials : packagingItems;
    const firstOption = list[0];

    setItems(
      items.map((item) => {
        if (item.tempId !== tempId) return item;
        const itemId = firstOption ? ((firstOption as any).inventoryItemId || firstOption.id) : '';
        const defaultCost = Number(firstOption?.unitCost || (firstOption as any)?.costPrice || 0);
        const resolvedUnit = firstOption?.unit || (firstOption as any)?.inventoryItem?.unit || 'pcs';
        return {
          ...item,
          itemType: newType,
          inventoryItemId: itemId,
          itemName: firstOption?.name || '',
          sku: firstOption?.sku || (firstOption as any)?.code || '',
          unit: resolvedUnit,
          systemStock: Number(firstOption?.currentStock || 0),
          quantityOrdered: item.quantityOrdered || 1,
          totalPrice: (item.quantityOrdered || 1) * defaultCost,
        };
      })
    );
  };

  // Handle Item Selection for a row
  const handleItemSelect = (tempId: string, selectedId: string) => {
    setItems(
      items.map((item) => {
        if (item.tempId !== tempId) return item;

        let selected: any = null;
        if (item.itemType === 'RAW_MATERIAL') {
          selected = rawMaterials.find((m) => m.id === selectedId);
        } else {
          selected = packagingItems.find(
            (p) => p.id === selectedId || (p as any).inventoryItemId === selectedId
          );
        }

        if (!selected) return item;

        const resolvedInventoryItemId = (selected as any).inventoryItemId || selected.id;
        const defaultCost = Number(selected.unitCost || selected.costPrice || 0);
        const resolvedUnit = selected.unit || (selected as any).inventoryItem?.unit || 'pcs';

        return {
          ...item,
          inventoryItemId: resolvedInventoryItemId,
          itemName: selected.name,
          sku: selected.sku || selected.code || '',
          unit: resolvedUnit,
          systemStock: Number(selected.currentStock || (selected as any).inventoryItem?.stocks?.[0]?.quantity || 0),
          totalPrice: (item.quantityOrdered || 1) * defaultCost,
        };
      })
    );
  };

  // Handle Qty & Total Price changes
  const handleItemFieldChange = (
    tempId: string,
    field: 'quantityOrdered' | 'totalPrice',
    value: number
  ) => {
    setItems(
      items.map((item) => {
        if (item.tempId !== tempId) return item;
        return {
          ...item,
          [field]: value,
        };
      })
    );
  };

  // Validation
  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    if (!supplierId) {
      errors.supplierId = 'Supplier wajib dipilih';
    }

    if (items.length === 0) {
      errors.items = 'Minimal harus menambahkan 1 item pembelian';
    } else {
      items.forEach((item, index) => {
        if (!item.inventoryItemId) {
          errors[`item_${index}`] = `Item pada baris ${index + 1} belum dipilih`;
        }
        if (item.quantityOrdered <= 0) {
          errors[`qty_${index}`] = `Jumlah baris ${index + 1} harus lebih dari 0`;
        }
        if (item.totalPrice < 0) {
          errors[`cost_${index}`] = `Total harga baris ${index + 1} tidak boleh negatif`;
        }
      });
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (!effectiveOutletId) {
      toast.warning('Cabang outlet penerima belum dipilih.');
      return;
    }

    try {
      const payload = {
        outletId: effectiveOutletId,
        supplierId,
        purchaseNumber: purchaseNumber.trim() || undefined,
        purchaseDate,
        notes: notes.trim() || undefined,
        items: items.map((item) => {
          const qty = Number(item.quantityOrdered) || 0;
          const total = Number(item.totalPrice) || 0;
          const computedUnitCost = qty > 0 ? total / qty : 0;
          return {
            inventoryItemId: item.inventoryItemId,
            quantityOrdered: qty,
            subtotal: total,
            totalPrice: total,
            unitCost: computedUnitCost,
          };
        }),
      };

      const result = await createPurchaseMutation.mutateAsync(payload);
      toast.success('Purchase order berhasil dibuat.');
      navigate(`/inventory/purchases/${result.id}?outletId=${effectiveOutletId}`);
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.message || err?.message || 'Gagal membuat purchase order';
      toast.error(errorMsg);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Breadcrumb & Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(`/inventory/purchases?outletId=${effectiveOutletId}`)}
            className="p-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-slate-600 transition-colors shadow-xs cursor-pointer"
            title="Kembali ke Daftar Pembelian"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Link to={`/inventory/purchases?outletId=${effectiveOutletId}`} className="hover:text-[#0D5C53]">
                Pembelian
              </Link>
              <span>/</span>
              <span className="text-slate-800 font-semibold">Buat Pembelian (PO)</span>
            </div>
            <div className="flex items-center gap-2.5 mt-0.5">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Buat Pesanan Pembelian
              </h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {activeBranchName}
              </span>
            </div>
          </div>
        </div>

        {/* Branch Switcher Dropdown */}
        <div className="flex items-center gap-2">
          <CustomSelect
            ariaLabel="Cabang Penerima"
            icon={<Store className="w-4 h-4 text-[#0D5C53]" />}
            value={effectiveOutletId}
            onChange={(val) => {
              setSelectedOutletId(val);
              setSearchParams({ outletId: val });
            }}
            options={outlets.map((outlet) => ({
              value: outlet.id,
              label: outlet.name,
            }))}
            buttonClassName="bg-slate-50 border-slate-200 text-xs py-2 px-3 rounded-xl font-semibold"
          />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Main Form - 2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: Informasi Pembelian */}
          <Card header={<h3 className="text-sm font-bold text-slate-900">Informasi Pembelian</h3>}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <FormInput
                  label="No. Pembelian"
                  value={purchaseNumber}
                  onChange={(e) => setPurchaseNumber(e.target.value)}
                  placeholder="Otomatis dibuat sistem (PB-2026-xxx)"
                  helperText="Kosongkan untuk penomoran otomatis"
                />
              </div>

              <div>
                <FormDatePicker
                  label="Tanggal Pembelian"
                  required
                  value={purchaseDate}
                  onChange={(val) => setPurchaseDate(val)}
                />
              </div>

              <div className="sm:col-span-2">
                <FormSelect
                  label="Supplier"
                  required
                  value={supplierId}
                  onChange={(e) => {
                    setSupplierId(e.target.value);
                    if (formErrors.supplierId) {
                      setFormErrors((prev) => ({ ...prev, supplierId: '' }));
                    }
                  }}
                  error={formErrors.supplierId}
                >
                  <option value="">-- Pilih Supplier --</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.phone ? `(${s.phone})` : ''}
                    </option>
                  ))}
                </FormSelect>
                {suppliers.length === 0 && !loadingSuppliers && (
                  <p className="text-[11px] text-amber-600 mt-1">
                    Belum ada supplier terdaftar.{' '}
                    <Link to="/inventory/suppliers/create" className="underline font-semibold">
                      Tambah supplier baru
                    </Link>
                  </p>
                )}
              </div>

              <div className="sm:col-span-2">
                <FormTextarea
                  label="Catatan Pembelian"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Tambahkan catatan pembelian, nomor referensi supplier, dll..."
                />
              </div>
            </div>
          </Card>

          {/* Card 2: Item Pembelian */}
          <Card
            header={
              <div className="flex items-center justify-between w-full">
                <h3 className="text-sm font-bold text-slate-900">Item Pembelian</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                  onClick={handleAddItem}
                >
                  Tambah Item
                </Button>
              </div>
            }
          >
            {formErrors.items && (
              <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formErrors.items}</span>
              </div>
            )}

            {items.length === 0 ? (
              <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                <Boxes className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-700">Belum ada item ditambahkan</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Klik tombol "+ Tambah Item" di atas untuk menambahkan bahan baku atau packaging.
                </p>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                  onClick={handleAddItem}
                  className="mt-3.5"
                >
                  Tambah Item Pertama
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-6 -my-4 sm:mx-0 sm:my-0">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3 w-28">Tipe</th>
                      <th className="py-2.5 px-3 min-w-[200px]">Item</th>
                      <th className="py-2.5 px-2 text-center w-24">Stok Saat Ini</th>
                      <th className="py-2.5 px-2 w-28 text-center">Qty Dibeli</th>
                      <th className="py-2.5 px-3 text-right w-36">Total Harga (Rp)</th>
                      <th className="py-2.5 px-2 text-center w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((item, index) => {
                      const availableOptions =
                        item.itemType === 'RAW_MATERIAL' ? rawMaterials : packagingItems;

                      return (
                        <tr key={item.tempId} className="hover:bg-slate-50/50">
                          {/* Tipe Selector */}
                          <td className="py-3 px-3 align-top min-w-[130px]">
                            <CustomSelect
                              value={item.itemType}
                              onChange={(val) =>
                                handleTypeChange(
                                  item.tempId,
                                  val as 'RAW_MATERIAL' | 'PACKAGING'
                                )
                              }
                              options={[
                                { value: 'RAW_MATERIAL', label: 'Bahan Baku' },
                                { value: 'PACKAGING', label: 'Packaging' },
                              ]}
                              buttonClassName="w-full text-xs py-1.5 px-2 bg-slate-50 border-slate-200"
                            />
                          </td>

                          {/* Item Dropdown */}
                          <td className="py-3 px-3 align-top min-w-[200px]">
                            <CustomSelect
                              value={item.inventoryItemId}
                              placeholder="-- Pilih Item --"
                              onChange={(val) => handleItemSelect(item.tempId, val)}
                              options={availableOptions.map((opt: any) => ({
                                value: opt.inventoryItemId || opt.id,
                                label: `${opt.name} (${opt.unit || opt.inventoryItem?.unit || 'pcs'})`,
                              }))}
                              buttonClassName="w-full text-xs py-1.5 px-2.5 bg-white border-slate-200 font-semibold"
                            />
                            {item.sku && (
                              <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                                SKU: {item.sku}
                              </span>
                            )}
                          </td>

                          {/* Stok Sistem */}
                          <td className="py-3 px-2 text-center align-top pt-4">
                            <span className="text-slate-600 font-medium">
                              {item.systemStock} {item.unit}
                            </span>
                          </td>

                          {/* Qty Input */}
                          <td className="py-3 px-2 align-top">
                            <input
                              type="number"
                              min="0.01"
                              step="any"
                              value={item.quantityOrdered || ''}
                              onChange={(e) =>
                                handleItemFieldChange(
                                  item.tempId,
                                  'quantityOrdered',
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              placeholder="0"
                              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-bold text-center focus:outline-none focus:ring-1 focus:ring-[#0D5C53]"
                            />
                            <span className="text-[10px] text-slate-400 text-center block mt-0.5">
                              {item.unit}
                            </span>
                          </td>

                          {/* Total Harga (Rp) Input */}
                          <td className="py-3 px-3 align-top">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={item.totalPrice || ''}
                              onChange={(e) =>
                                handleItemFieldChange(
                                  item.tempId,
                                  'totalPrice',
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              placeholder="0"
                              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-bold text-right focus:outline-none focus:ring-1 focus:ring-[#0D5C53]"
                            />
                            <span className="text-[10px] text-slate-400 text-right block mt-0.5 font-mono">
                              {formatRupiah(item.totalPrice || 0)}
                            </span>
                          </td>

                          {/* Action Delete */}
                          <td className="py-3 px-2 text-center align-top pt-3.5">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.tempId)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Hapus baris"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        {/* Right Column (Payment Summary & Actions - 1 Col) */}
        <div className="space-y-6">
          <Card header={<h3 className="text-sm font-bold text-slate-900">Ringkasan Pembayaran</h3>}>
            <div className="space-y-3.5 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>Total Item</span>
                <span className="font-bold text-slate-800">{totalItemsCount} item</span>
              </div>

              <div className="flex items-center justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-800 font-mono">
                  {formatRupiah(subtotal)}
                </span>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm">Grand Total</span>
                <span className="font-bold text-lg text-[#0D5C53] font-mono">
                  {formatRupiah(totalAmount)}
                </span>
              </div>

              {/* Informational Alert */}
              <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/80 text-[11px] text-amber-800 flex items-start gap-2.5 mt-4">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <span className="font-bold">Status Awal: DRAFT</span>
                  <p className="mt-0.5 text-amber-700">
                    Stok barang dan HPP belum bertambah hingga Anda melakukan verifikasi dan konfirmasi penerimaan barang.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 space-y-2.5">
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full justify-center"
                  isLoading={createPurchaseMutation.isPending}
                  disabled={items.length === 0}
                >
                  Simpan Draft Pembelian
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-center"
                  onClick={() => navigate('/inventory/purchases')}
                >
                  Batal
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </form>
    </div>
  );
};

