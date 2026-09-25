import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Trash2,
  AlertCircle,
  Boxes,
  FileText,
  Store,
} from 'lucide-react';
import { useAuthStore } from '@domain/state/auth-store';
import {
  usePurchaseDetail,
  useSuppliers,
  useRawMaterials,
  usePackagingItems,
  useUpdatePurchaseMutation,
} from '@domain/hooks';
import {
  Card,
  Button,
  FormInput,
  FormSelect,
  FormTextarea,
  LoadingState,
  EmptyState,
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

export const PurchaseEditScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const currentOutlet = useAuthStore((state) => state.currentOutlet);

  // Queries
  const { data: purchase, isLoading: loadingPurchase } = usePurchaseDetail(id);
  const targetOutletId = purchase?.outletId || searchParams.get('outletId') || currentOutlet?.id;

  const { data: suppliers = [] } = useSuppliers({ status: 'ACTIVE' });
  const { data: rawMaterials = [] } = useRawMaterials({ outletId: targetOutletId });
  const { data: packagingItems = [] } = usePackagingItems({ outletId: targetOutletId });

  // Mutation
  const updatePurchaseMutation = useUpdatePurchaseMutation();

  // Form State
  const [purchaseDate, setPurchaseDate] = useState<string>('');
  const [supplierId, setSupplierId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [items, setItems] = useState<PurchaseFormItem[]>([]);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize form state when purchase data loads
  useEffect(() => {
    if (purchase && !isInitialized) {
      setPurchaseDate(
        purchase.purchaseDate
          ? new Date(purchase.purchaseDate).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0]
      );
      setSupplierId(purchase.supplierId || '');
      setNotes(purchase.notes || '');

      if (purchase.items && purchase.items.length > 0) {
        setItems(
          purchase.items.map((item) => {
            const qty = Number(item.quantityOrdered) || 0;
            const itemTotal =
              Number(item.subtotal) || (qty * Number(item.unitCost || 0));
            return {
              tempId: item.id || Math.random().toString(36).substring(2, 9),
              itemType:
                item.inventoryItem?.itemType === 'PACKAGING' ? 'PACKAGING' : 'RAW_MATERIAL',
              inventoryItemId: item.inventoryItemId,
              itemName: item.inventoryItem?.name || '',
              sku: item.inventoryItem?.sku || '',
              unit: item.inventoryItem?.unit || 'pcs',
              systemStock: 0,
              quantityOrdered: qty,
              totalPrice: itemTotal,
            };
          })
        );
      }
      setIsInitialized(true);
    }
  }, [purchase, isInitialized]);

  // Calculations
  const totalItemsCount = items.length;
  const subtotal = useMemo(() => {
    return items.reduce(
      (acc, item) => acc + (Number(item.totalPrice) || 0),
      0
    );
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

    const defaultCost = Number(defaultItem?.unitCost || defaultItem?.costPrice || 0);
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
      totalPrice: defaultCost,
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
    if (!validateForm() || !id) return;

    try {
      const payload = {
        outletId: targetOutletId,
        supplierId,
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

      await updatePurchaseMutation.mutateAsync({ id, data: payload });
      toast.success('Purchase order berhasil diperbarui.');
      const returnUrl = `/inventory/purchases/${id}${targetOutletId ? `?outletId=${targetOutletId}` : ''}`;
      navigate(returnUrl);
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.message || err?.message || 'Gagal memperbarui purchase order';
      toast.error(errorMsg);
    }
  };

  if (loadingPurchase) {
    return <LoadingState message="Memuat data pembelian..." className="min-h-[400px]" />;
  }

  if (!purchase) {
    return (
      <Card className="max-w-md mx-auto my-12 text-center p-8">
        <EmptyState
          icon={<FileText className="w-10 h-10 text-slate-300 mx-auto" />}
          title="Pembelian Tidak Ditemukan"
          description="Data transaksi pembelian yang Anda cari tidak tersedia."
          action={
            <Link to="/inventory/purchases">
              <Button variant="primary" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Kembali ke Daftar Pembelian
              </Button>
            </Link>
          }
        />
      </Card>
    );
  }

  if (purchase.status !== 'DRAFT') {
    const returnUrl = `/inventory/purchases/${id}${targetOutletId ? `?outletId=${targetOutletId}` : ''}`;
    return (
      <Card className="max-w-md mx-auto my-12 text-center p-8">
        <EmptyState
          icon={<AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />}
          title="Tidak Dapat Mengedit Pembelian"
          description={`Pembelian ini berstatus ${purchase.status}. Hanya pembelian berstatus DRAFT yang dapat diedit.`}
          action={
            <Link to={returnUrl}>
              <Button variant="primary" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Kembali ke Detail Pembelian
              </Button>
            </Link>
          }
        />
      </Card>
    );
  }

  const returnUrl = `/inventory/purchases/${id}${targetOutletId ? `?outletId=${targetOutletId}` : ''}`;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Breadcrumb & Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(returnUrl)}
            className="p-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-slate-600 transition-colors shadow-xs cursor-pointer"
            title="Kembali ke Detail Pembelian"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Link to={targetOutletId ? `/inventory/purchases?outletId=${targetOutletId}` : '/inventory/purchases'} className="hover:text-[#0D5C53]">
                Pembelian
              </Link>
              <span>/</span>
              <Link to={returnUrl} className="hover:text-[#0D5C53]">
                {purchase.purchaseNumber}
              </Link>
              <span>/</span>
              <span className="text-slate-800 font-semibold">Edit</span>
            </div>
            <div className="flex items-center gap-2.5 mt-0.5">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Edit Pembelian ({purchase.purchaseNumber})
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Store className="w-3 h-3" />
                {purchase.outlet?.name || 'Cabang Utama'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Main Form) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: Informasi Pembelian */}
          <Card header={<h3 className="text-sm font-bold text-slate-900">Informasi Pembelian</h3>}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <FormInput
                  label="No. Pembelian"
                  value={purchase.purchaseNumber}
                  disabled
                  helperText="Nomor pembelian tidak dapat diubah"
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
              </div>

              <div className="sm:col-span-2">
                <FormTextarea
                  label="Catatan Pembelian"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Tambahkan catatan pembelian..."
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
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                  onClick={handleAddItem}
                  className="mt-3.5"
                >
                  Tambah Item
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
                    {items.map((item) => {
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

        {/* Right Column (Payment Summary & Actions) */}
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

              {/* Action Buttons */}
              <div className="pt-4 space-y-2.5">
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full justify-center"
                  isLoading={updatePurchaseMutation.isPending}
                  disabled={items.length === 0}
                >
                  Simpan Perubahan
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-center"
                  onClick={() => navigate(`/inventory/purchases/${id}`)}
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

