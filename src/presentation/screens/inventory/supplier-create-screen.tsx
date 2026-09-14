import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCreateSupplierMutation } from '@domain/hooks';
import {
  ArrowLeft,
  Truck,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  FileText,
  User,
} from 'lucide-react';
import {
  Button,
  Card,
  FormInput,
  FormTextarea,
} from '@presentation/components/ui';

export const SupplierCreateScreen: React.FC = () => {
  const navigate = useNavigate();
  const createSupplierMutation = useCreateSupplierMutation();
  const submitting = createSupplierMutation.isPending;

  // Form State
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');

  // Auto Generate Supplier Code
  const handleGenerateCode = () => {
    const rand = Math.floor(100 + Math.random() * 900);
    setCode(`SUP-${rand}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Nama supplier wajib diisi.');
      return;
    }

    try {
      await createSupplierMutation.mutateAsync({
        code: code.trim() || undefined,
        name: name.trim(),
        contactPerson: contactPerson.trim() || undefined,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        city: city.trim() || undefined,
        province: province.trim() || undefined,
        postalCode: postalCode.trim() || undefined,
        notes: notes.trim() || undefined,
        status,
      });

      navigate('/inventory/suppliers');
    } catch (err: unknown) {
      alert(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Gagal menyimpan data supplier.'
      );
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Top Header with Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/inventory/suppliers')}
            className="p-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-slate-600 transition-colors shadow-xs cursor-pointer"
            title="Kembali ke Daftar Supplier"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
              <Link to="/inventory/suppliers" className="hover:text-slate-600">
                Inventory
              </Link>
              <span>/</span>
              <Link to="/inventory/suppliers" className="hover:text-slate-600">
                Supplier
              </Link>
              <span>/</span>
              <span className="text-slate-700">Tambah Supplier</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight mt-0.5">
              Tambah Supplier
            </h1>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/inventory/suppliers')}
          >
            Batal
          </Button>
          <Button
            type="submit"
            form="create-supplier-form"
            variant="primary"
            isLoading={submitting}
          >
            Simpan Supplier
          </Button>
        </div>
      </div>

      {/* Main Form */}
      <form id="create-supplier-form" onSubmit={handleSubmit} className="space-y-6">
        {/* Card 1: Informasi Supplier */}
        <Card title="Informasi Supplier">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700">
                    Kode Supplier
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateCode}
                    className="text-[11px] font-semibold text-[#0D5C53] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" /> Auto Generate
                  </button>
                </div>
                <FormInput
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g., SUP-001"
                />
              </div>

              <FormInput
                label="Nama Supplier"
                required
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: PT Sumber Makmur"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormInput
                label="Nama PIC (Person in Charge)"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="Contoh: Budi Santoso"
              />
            </div>

            <FormTextarea
              label="Catatan"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Tambahkan catatan khusus tentang supplier ini..."
              rows={3}
            />
          </div>
        </Card>

        {/* Card 2: Kontak */}
        <Card title="Kontak">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput
              label="Nomor Telepon"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Contoh: 081234567890"
            />

            <FormInput
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contact@supplier.com"
            />
          </div>
        </Card>

        {/* Card 3: Alamat */}
        <Card title="Alamat">
          <div className="space-y-4">
            <FormTextarea
              label="Alamat Lengkap"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Jl. Sudirman No. 123..."
              rows={2}
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormInput
                label="Kota"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Contoh: Jakarta"
              />

              <FormInput
                label="Provinsi"
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                placeholder="Contoh: DKI Jakarta"
              />

              <FormInput
                label="Kode Pos"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                placeholder="Contoh: 12190"
              />
            </div>
          </div>
        </Card>

        {/* Card 4: Status Supplier */}
        <Card title="Status Supplier">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-slate-800">Status Operasional</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Tentukan apakah supplier ini aktif untuk transaksi pengadaan.
              </p>
            </div>

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                <input
                  type="radio"
                  name="supplier-status"
                  checked={status === 'ACTIVE'}
                  onChange={() => setStatus('ACTIVE')}
                  className="w-4 h-4 text-[#0D5C53] focus:ring-[#0D5C53]"
                />
                <span>Aktif</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                <input
                  type="radio"
                  name="supplier-status"
                  checked={status === 'INACTIVE'}
                  onChange={() => setStatus('INACTIVE')}
                  className="w-4 h-4 text-[#0D5C53] focus:ring-[#0D5C53]"
                />
                <span>Nonaktif</span>
              </label>
            </div>
          </div>
        </Card>
      </form>
    </div>
  );
};

