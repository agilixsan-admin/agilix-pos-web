import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSupplierDetail } from '@domain/hooks';
import {
  ArrowLeft,
  Edit2,
  Truck,
  Phone,
  Mail,
  MapPin,
  FileText,
  User,
  ShoppingCart,
  Calendar,
  ArrowRight,
  ShieldCheck,
  Package,
} from 'lucide-react';
import {
  Button,
  Badge,
  Card,
  EmptyState,
  LoadingState,
} from '@presentation/components/ui';

export const SupplierDetailScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Query
  const { data: supplier, isLoading: loading } = useSupplierDetail(id);

  // Format Date Time
  const formatDateTime = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return <LoadingState message="Memuat detail supplier..." className="min-h-[400px]" />;
  }

  if (!supplier) {
    return (
      <Card className="max-w-md mx-auto my-12 text-center p-8">
        <EmptyState
          icon={<Truck className="w-10 h-10 text-slate-300 mx-auto" />}
          title="Supplier Tidak Ditemukan"
          description="Data supplier yang Anda cari tidak tersedia atau telah dihapus."
          action={
            <Link to="/inventory/suppliers">
              <Button variant="primary" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Kembali ke Daftar
              </Button>
            </Link>
          }
        />
      </Card>
    );
  }

  const isActive = supplier.status === 'ACTIVE' || supplier.isActive !== false;
  const fullAddress = [
    supplier.address,
    supplier.city,
    supplier.province,
    supplier.postalCode,
  ]
    .filter(Boolean)
    .join(', ') || '-';

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                {supplier.name}
              </h1>
              <Badge variant={isActive ? 'success' : 'neutral'} dot>
                {isActive ? 'Aktif' : 'Nonaktif'}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-mono">
              Kode: <span className="font-semibold text-slate-700">{supplier.code || '-'}</span>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            leftIcon={<ShoppingCart className="w-4 h-4" />}
            onClick={() => navigate('/inventory/purchases')}
          >
            Buat PO Baru
          </Button>

          <Button
            variant="primary"
            leftIcon={<Edit2 className="w-4 h-4" />}
            onClick={() => navigate(`/inventory/suppliers/${id}/edit`)}
          >
            Edit Supplier
          </Button>
        </div>
      </div>

      {/* Main 2-Column Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Supplier Information & Contacts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: Informasi Supplier */}
          <Card title="Informasi Supplier">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-xs">
              <div>
                <span className="text-slate-400 font-medium block">KODE SUPPLIER</span>
                <span className="font-mono font-bold text-slate-800 text-sm mt-0.5 block">
                  {supplier.code || '-'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 font-medium block">NAMA SUPPLIER</span>
                <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                  {supplier.name}
                </span>
              </div>

              <div className="sm:col-span-2 pt-2">
                <span className="text-slate-400 font-medium block mb-1.5">KATEGORI PENGADAAN</span>
                <div className="flex items-center gap-2">
                  <Badge variant="neutral">Bahan Baku</Badge>
                  <Badge variant="neutral">Kemasan</Badge>
                </div>
              </div>
            </div>
          </Card>

          {/* Card 2: Kontak & Alamat */}
          <Card title="Kontak & Alamat">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-xs">
              <div>
                <span className="text-slate-400 font-medium block">PIC (PERSON IN CHARGE)</span>
                <div className="flex items-center gap-2 mt-1">
                  <div className="p-1.5 bg-slate-100 rounded-lg text-slate-600">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-semibold text-slate-800">
                    {supplier.contactPerson || '-'}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 font-medium block">NO. TELEPON</span>
                <div className="flex items-center gap-2 mt-1">
                  <div className="p-1.5 bg-slate-100 rounded-lg text-slate-600">
                    <Phone className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-mono font-semibold text-slate-800">
                    {supplier.phone || '-'}
                  </span>
                </div>
              </div>

              <div className="sm:col-span-2">
                <span className="text-slate-400 font-medium block">EMAIL</span>
                <div className="flex items-center gap-2 mt-1">
                  <div className="p-1.5 bg-slate-100 rounded-lg text-slate-600">
                    <Mail className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-medium text-slate-800">
                    {supplier.email || '-'}
                  </span>
                </div>
              </div>

              <div className="sm:col-span-2 pt-3 border-t border-slate-100">
                <span className="text-slate-400 font-medium block">ALAMAT LENGKAP</span>
                <div className="flex items-start gap-2 mt-1.5">
                  <div className="p-1.5 bg-slate-100 rounded-lg text-slate-600 shrink-0 mt-0.5">
                    <MapPin className="w-3.5 h-3.5" />
                  </div>
                  <p className="text-slate-700 leading-relaxed">
                    {fullAddress}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Card 3: Catatan Internal */}
          <Card title="Catatan Internal">
            <div className="p-4 bg-slate-50/80 border border-slate-100 rounded-xl text-xs text-slate-700 leading-relaxed">
              {supplier.notes ||
                'Supplier utama untuk pengadaan material. Pengiriman biasanya memakan waktu 2-3 hari kerja setelah Purchase Order (PO) disetujui.'}
            </div>
          </Card>
        </div>

        {/* Right Column: Purchases & Entity Meta */}
        <div className="space-y-6">
          {/* Card 4: Digunakan pada Pembelian */}
          <Card title="Digunakan pada Pembelian">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 bg-teal-50/60 border border-teal-100 rounded-2xl">
                <div>
                  <span className="text-[11px] font-semibold text-teal-700 uppercase tracking-wider block">
                    TOTAL PEMBELIAN
                  </span>
                  <span className="text-xl font-bold text-[#0D5C53] mt-0.5 block">
                    {supplier.totalPurchases ?? 0} Transaksi
                  </span>
                </div>
                <div className="p-2.5 bg-white text-[#0D5C53] rounded-xl shadow-xs">
                  <ShoppingCart className="w-5 h-5" />
                </div>
              </div>

              <div className="text-xs space-y-2">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="text-slate-400">Pembelian Terakhir:</span>
                  <span className="font-semibold text-slate-800">
                    {supplier.lastPurchaseDate ? formatDateTime(supplier.lastPurchaseDate) : 'Belum ada'}
                  </span>
                </div>
              </div>

              <Link
                to="/inventory/purchases"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0D5C53] hover:underline pt-2 border-t border-slate-100 w-full"
              >
                <span>Lihat Riwayat Pembelian</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </Card>

          {/* Card 5: Informasi Entitas */}
          <Card title="Informasi Entitas">
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Status Entitas:</span>
                <Badge variant={isActive ? 'success' : 'neutral'} dot>
                  {isActive ? 'Aktif' : 'Nonaktif'}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">Dibuat Oleh:</span>
                <span className="font-medium text-slate-700">
                  {supplier.createdByName || 'Admin Utama'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">Tanggal Dibuat:</span>
                <span className="font-mono text-slate-700">
                  {formatDateTime(supplier.createdAt)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">Terakhir Diubah:</span>
                <span className="font-mono text-slate-700">
                  {formatDateTime(supplier.updatedAt || supplier.createdAt)}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

