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
  unitCost: number;
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
    return items.reduce((acc, item) => acc + (Number(item.quantityOrdered) || 0) * (Number(item.unitCost) || 0), 0);
  }, [items]);
  const totalAmount = subtotal;

  const formatRupiah = (val: number) => {
    return `Rp ${new Intl.NumberFormat('id-ID').format(val)}`;
  };

  // Add Item Row
  const handleAddItem = () => {
    // Default to first available raw material or packaging
    let defaultItem = rawMaterials[0];
    let type: 'RAW_MATERIAL' | 'PACKAGING' = 'RAW_MATERIAL';

    if (!defaultItem && packagingItems.length > 0) {
      defaultItem = packagingItems[0] as any;
      type = 'PACKAGING';
    }

    const newItem: PurchaseFormItem = {
      tempId: Math.random().toString(36).substring(2, 9),
      itemType: type,
      inventoryItemId: defaultItem?.id || '',
      itemName: defaultItem?.name || '',
      sku: defaultItem?.sku || defaultItem?.code || '',
      unit: defaultItem?.unit || 'pcs',
      systemStock: Number(defaultItem?.currentStock || 0),
      quantityOrdered: 1,
      unitCost: Number(defaultItem?.unitCost || defaultItem?.costPrice || 0),
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
        return {
          ...item,
          itemType: newType,
          inventoryItemId: itemId,
          itemName: firstOption?.name || '',
          sku: firstOption?.sku || (firstOption as any)?.code || '',
          unit: firstOption?.unit || 'pcs',
          systemStock: Number(firstOption?.currentStock || 0),
          quantityOrdered: item.quantityOrdered || 1,
          unitCost: Number(firstOption?.unitCost || (firstOption as any)?.costPrice || 0),
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

        return {
          ...item,
          inventoryItemId: resolvedInventoryItemId,
          itemName: selected.name,
          sku: selected.sku || selected.code || '',
          unit: selected.unit || 'pcs',
          systemStock: Number(selected.currentStock || 0),
          unitCost: Number(selected.unitCost || selected.costPrice || 0),
        };
      })
    );
  };

  // Handle Qty & Unit Cost changes
  const handleItemFieldChange = (
    tempId: string,
    field: 'quantityOrdered' | 'unitCost',
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
        if (item.unitCost < 0) {
          errors[`cost_${index}`] = `Harga baris ${index + 1} tidak boleh negatif`;
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
      alert('Cabang outlet penerima belum dipilih.');
      return;
    }

    try {
      const payload = {
        outletId: effectiveOutletId,
        supplierId,
        purchaseNumber: purchaseNumber.trim() || undefined,
        purchaseDate,
        notes: notes.trim() || undefined,
        items: items.map((item) => ({
          inventoryItemId: item.inventoryItemId,
          quantityOrdered: Number(item.quantityOrdered),
          unitCost: Number(item.unitCost),
        })),
      };

      const result = await createPurchaseMutation.mutateAsync(payload);
      navigate(`/inventory/purchases/${result.id}?outletId=${effectiveOutletId}`);
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.message || err?.message || 'Gagal membuat purchase order';
      alert(errorMsg);
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
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 shadow-xs">
          <Store className="w-4 h-4 text-[#0D5C53] shrink-0" />
          <span className="text-xs font-medium text-slate-600 shrink-0">Cabang Penerima:</span>
          <select
            value={effectiveOutletId}
            onChange={(e) => {
              setSelectedOutletId(e.target.value);
              setSearchParams({ outletId: e.target.value });
            }}
            className="bg-transparent text-xs font-semibold text-slate-800 outline-none cursor-pointer pr-1"
          >
            {outlets.map((outlet) => (
              <option key={outlet.id} value={outlet.id}>
                🏪 {outlet.name}
              </option>
            ))}
          </select>
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
                <FormInput
                  type="date"
                  label="Tanggal Pembelian"
                  required
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
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
                      <th className="py-2.5 px-2 text-center w-20">Stok</th>
                      <th className="py-2.5 px-2 w-24">Qty</th>
                      <th className="py-2.5 px-2 w-32">Unit Cost</th>
                      <th className="py-2.5 px-3 text-right w-32">Subtotal</th>
                      <th className="py-2.5 px-2 text-center w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((item, index) => {
                      const itemSubtotal =
                        (Number(item.quantityOrdered) || 0) * (Number(item.unitCost) || 0);
                      const availableOptions =
                        item.itemType === 'RAW_MATERIAL' ? rawMaterials : packagingItems;

                      return (
                        <tr key={item.tempId} className="hover:bg-slate-50/50">
                          {/* Tipe Selector */}
                          <td className="py-3 px-3 align-top">
                            <select
                              value={item.itemType}
                              onChange={(e) =>
                                handleTypeChange(
                                  item.tempId,
                                  e.target.value as 'RAW_MATERIAL' | 'PACKAGING'
                                )
                              }
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-[#0D5C53]"
                            >
                              <option value="RAW_MATERIAL">Bahan Baku</option>
                              <option value="PACKAGING">Packaging</option>
                            </select>
                          </td>

                          {/* Item Dropdown */}
                          <td className="py-3 px-3 align-top">
                            <select
                              value={item.inventoryItemId}
                              onChange={(e) => handleItemSelect(item.tempId, e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-[#0D5C53]"
                            >
                              <option value="">-- Pilih Item --</option>
                              {availableOptions.map((opt: any) => (
                                <option key={opt.id} value={opt.inventoryItemId || opt.id}>
                                  {opt.name} ({opt.unit || 'pcs'})
                                </option>
                              ))}
                            </select>
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
                              value={item.quantityOrdered}
                              onChange={(e) =>
                                handleItemFieldChange(
                                  item.tempId,
                                  'quantityOrdered',
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-bold text-center focus:outline-none focus:ring-1 focus:ring-[#0D5C53]"
                            />
                            <span className="text-[10px] text-slate-400 text-center block mt-0.5">
                              {item.unit}
                            </span>
                          </td>

                          {/* Unit Cost Input */}
                          <td className="py-3 px-2 align-top">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={item.unitCost}
                              onChange={(e) =>
                                handleItemFieldChange(
                                  item.tempId,
                                  'unitCost',
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-semibold text-right focus:outline-none focus:ring-1 focus:ring-[#0D5C53]"
                            />
                            <span className="text-[10px] text-slate-400 text-right block mt-0.5 font-mono">
                              {formatRupiah(item.unitCost)}
                            </span>
                          </td>

                          {/* Subtotal */}
                          <td className="py-3 px-3 text-right align-top pt-4 font-bold text-slate-900 font-mono">
                            {formatRupiah(itemSubtotal)}
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

