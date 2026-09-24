import React, { useState, useEffect } from 'react';
import type { Outlet } from '@model/Auth';
import {
  useOutlets,
  useOutletQuota,
  useUpdateOutletMutation,
  useCreateOutletMutation,
} from '@domain/hooks';
import { useAuthStore } from '@domain/state/auth-store';
import {
  Building2,
  Save,
  CheckCircle2,
  Plus,
  Phone,
  Mail,
  MapPin,
} from 'lucide-react';
import {
  Button,
  Card,
  FormInput,
  Modal,
  LoadingState,
} from '@presentation/components/ui';

export const OutletsScreen: React.FC = () => {
  // Global auth state
  const currentOutlet = useAuthStore((state) => state.currentOutlet);
  const setCurrentOutlet = useAuthStore((state) => state.setCurrentOutlet);

  // Queries & Mutations
  const { data: outlets = [], isLoading: loading, refetch } = useOutlets();
  const { data: quota, refetch: refetchQuota } = useOutletQuota();
  const updateOutletMutation = useUpdateOutletMutation();
  const createOutletMutation = useCreateOutletMutation();

  const maxQuota = quota?.max ?? Math.max(1, outlets.length);
  const usedQuota = quota?.used ?? outlets.length;
  const isQuotaReached = usedQuota >= maxQuota;

  // Selected Outlet for editing
  const [selectedOutletId, setSelectedOutletId] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Create Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newOutletData, setNewOutletData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
  });

  // Sync selected outlet on load
  useEffect(() => {
    if (outlets.length > 0) {
      const active = outlets.find((o) => o.id === selectedOutletId) ||
        outlets.find((o) => o.id === currentOutlet?.id) ||
        outlets[0];

      if (active) {
        setSelectedOutletId(active.id);
        setFormData({
          name: active.name || '',
          address: active.address || '',
          phone: active.phone || '',
          email: active.email || '',
        });
      }
    }
  }, [outlets, selectedOutletId, currentOutlet?.id]);

  const handleSelectOutlet = (outlet: Outlet) => {
    setSelectedOutletId(outlet.id);
    setFormData({
      name: outlet.name || '',
      address: outlet.address || '',
      phone: outlet.phone || '',
      email: outlet.email || '',
    });
    setErrors({});
  };

  const validate = () => {
    const err: Record<string, string> = {};
    if (!formData.name.trim()) err.name = 'Outlet name is required';
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      err.email = 'Please enter a valid email address';
    }
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOutletId || !validate()) return;

    try {
      const updated = await updateOutletMutation.mutateAsync({
        id: selectedOutletId,
        data: {
          name: formData.name.trim(),
          address: formData.address.trim() || undefined,
          phone: formData.phone.trim() || undefined,
        },
      });

      // Update current outlet in authStore if editing current outlet
      if (currentOutlet?.id === selectedOutletId) {
        setCurrentOutlet({
          ...currentOutlet,
          name: formData.name.trim(),
          address: formData.address.trim() || undefined,
          phone: formData.phone.trim() || undefined,
        });
      }

      setSuccessToast('Outlet details updated successfully.');
      setTimeout(() => setSuccessToast(null), 4000);
      refetch();
    } catch (err: unknown) {
      alert(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Failed to update outlet details.'
      );
    }
  };

  const handleCreateNewOutlet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOutletData.name.trim()) return;

    try {
      const created = await createOutletMutation.mutateAsync({
        name: newOutletData.name.trim(),
        address: newOutletData.address.trim() || undefined,
        phone: newOutletData.phone.trim() || undefined,
      });

      setIsAddModalOpen(false);
      setNewOutletData({ name: '', address: '', phone: '', email: '' });
      setSelectedOutletId(created.id);
      setSuccessToast(`New branch "${created.name}" created successfully.`);
      setTimeout(() => setSuccessToast(null), 4000);
      refetch();
      refetchQuota();
    } catch (err: unknown) {
      alert(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Failed to create new outlet.'
      );
    }
  };

  if (loading && outlets.length === 0) {
    return <LoadingState message="Loading outlet details..." />;
  }

  const activeOutlet = outlets.find((o) => o.id === selectedOutletId) || outlets[0];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
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
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Outlet Identity</h1>
            <span
              className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold border ${
                isQuotaReached
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-teal-50 text-teal-700 border-teal-200'
              }`}
            >
              Kuota: {usedQuota} / {maxQuota} Cabang
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your business contact details and location.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isQuotaReached ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                alert(
                  `Batas kuota cabang telah tercapai (${usedQuota}/${maxQuota}). Silakan upgrade kuota cabang melalui Agilix Console.`
                )
              }
              leftIcon={<Plus className="w-4 h-4" />}
              className="self-start sm:self-auto rounded-xl border-amber-300 text-amber-700 hover:bg-amber-50"
            >
              Add New Branch
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddModalOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
              className="self-start sm:self-auto rounded-xl"
            >
              Add New Branch
            </Button>
          )}
        </div>
      </div>

      {/* Multi-Branch Selector Tabs (if multiple outlets exist) */}
      {outlets.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {outlets.map((outlet) => {
            const isSelected = outlet.id === selectedOutletId;
            return (
              <button
                key={outlet.id}
                type="button"
                onClick={() => handleSelectOutlet(outlet)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer whitespace-nowrap border ${
                  isSelected
                    ? 'bg-[#0D5C53] text-white border-[#0D5C53] shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Building2 className={`w-3.5 h-3.5 ${isSelected ? 'text-teal-200' : 'text-slate-400'}`} />
                <span>{outlet.name}</span>
                {outlet.id === currentOutlet?.id && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                      isSelected ? 'bg-teal-800 text-teal-100' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    Current
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Outlet Identity Main Card (Matching Figma Mockup) */}
      {outlets.length === 0 ? (
        <Card padding="lg" className="border-slate-200 shadow-xs text-center py-12 space-y-4">
          <div className="w-14 h-14 bg-teal-50 text-[#0D5C53] rounded-2xl flex items-center justify-center mx-auto border border-teal-100">
            <Building2 className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">Belum Ada Cabang Terdaftar</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Anda memiliki kuota <strong>{maxQuota} cabang</strong> dari paket Console. Daftarkan cabang pertama Anda untuk mulai operasional POS.
            </p>
          </div>
          <Button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
            className="rounded-xl px-5 py-2 mx-auto bg-[#0D5C53] hover:bg-[#09423C] text-white"
          >
            Buat Cabang Pertama
          </Button>
        </Card>
      ) : (
        <Card padding="lg" className="border-slate-200 shadow-xs">
          <form onSubmit={handleSave} className="space-y-6">
          {/* Outlet Name Field */}
          <div className="space-y-1.5">
            <FormInput
              label="Outlet Name"
              required
              placeholder="e.g. Bistro POS - Downtown"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                if (errors.name) setErrors({ ...errors, name: '' });
              }}
              error={errors.name}
            />
          </div>

          {/* Address Field */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Address
            </label>
            <div className="relative">
              <textarea
                rows={3}
                placeholder="123 Culinary Ave, Suite 400&#10;Metropolis, NY 10001"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53] transition-all resize-y"
              />
            </div>
            <p className="text-[11px] text-slate-400 flex items-center gap-1">
              <MapPin className="w-3 h-3" /> Will appear on printed customer sales receipts
            </p>
          </div>

          {/* 2-Columns Row: Phone Number & Contact Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <FormInput
                label="Phone Number"
                placeholder="+1 (555) 123-4567"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
              <p className="text-[11px] text-slate-400 flex items-center gap-1">
                <Phone className="w-3 h-3" /> Branch contact number
              </p>
            </div>

            <div className="space-y-1.5">
              <FormInput
                label="Contact Email"
                type="email"
                placeholder="hello@bistropos.com"
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value });
                  if (errors.email) setErrors({ ...errors, email: '' });
                }}
                error={errors.email}
              />
              <p className="text-[11px] text-slate-400 flex items-center gap-1">
                <Mail className="w-3 h-3" /> Official outlet inquiries email
              </p>
            </div>
          </div>

          {/* Bottom Divider & Action Button */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
            <Button
              type="submit"
              variant="primary"
              isLoading={updateOutletMutation.isPending}
              leftIcon={<Save className="w-4 h-4" />}
              className="bg-[#0D5C53] hover:bg-[#09423C] text-white px-6 py-2.5 rounded-xl font-medium"
            >
              Save Changes
            </Button>
          </div>
        </form>
      </Card>
      )}

      {/* Modal Add New Branch */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Branch / Outlet"
        maxWidth="md"
      >
        <form onSubmit={handleCreateNewOutlet} className="space-y-4 py-1">
          <FormInput
            label="Outlet Name"
            required
            autoFocus
            placeholder="e.g. Bistro POS - Uptown"
            value={newOutletData.name}
            onChange={(e) => setNewOutletData({ ...newOutletData, name: e.target.value })}
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">Address</label>
            <textarea
              rows={3}
              placeholder="Branch street address, city, zip code"
              value={newOutletData.address}
              onChange={(e) => setNewOutletData({ ...newOutletData, address: e.target.value })}
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53] transition-all resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput
              label="Phone Number"
              placeholder="+1 (555) 000-0000"
              value={newOutletData.phone}
              onChange={(e) => setNewOutletData({ ...newOutletData, phone: e.target.value })}
            />

            <FormInput
              label="Contact Email"
              type="email"
              placeholder="branch@bistropos.com"
              value={newOutletData.email}
              onChange={(e) => setNewOutletData({ ...newOutletData, email: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddModalOpen(false)}
              disabled={createOutletMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={createOutletMutation.isPending}
              className="bg-[#0D5C53] hover:bg-[#09423C] text-white"
            >
              Create Branch
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
