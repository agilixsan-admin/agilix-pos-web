import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import type { Supplier } from '@model/Inventory';
import {
  useSuppliers,
  useDeleteSupplierMutation,
  useDebounce,
} from '@domain/hooks';
import {
  Truck,
  Plus,
  Edit2,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail,
  UserCheck,
} from 'lucide-react';
import {
  Button,
  Badge,
  Card,
  SearchInput,
  FormSelect,
  LoadingState,
  EmptyState,
  toast,
  confirmDialog,
} from '@presentation/components/ui';

export const SuppliersScreen: React.FC = () => {
  const navigate = useNavigate();

  // Queries & Mutations
  const { data: suppliers = [], isLoading: loading } = useSuppliers();
  const deleteSupplierMutation = useDeleteSupplierMutation();

  // Filter State
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 200);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Filtered Suppliers
  const filteredSuppliers = useMemo(() => {
    return (Array.isArray(suppliers) ? suppliers : []).filter((s) => {
      if (!s) return false;

      // Status filter
      if (statusFilter !== 'ALL') {
        const isActive = s.status === 'ACTIVE' || s.isActive;
        if (statusFilter === 'ACTIVE' && !isActive) return false;
        if (statusFilter === 'INACTIVE' && isActive) return false;
      }

      // Search
      if (debouncedSearch) {
        const query = debouncedSearch.toLowerCase();
        const code = (s.code || '').toLowerCase();
        const name = (s.name || '').toLowerCase();
        const pic = (s.contactPerson || '').toLowerCase();
        const phone = (s.phone || '').toLowerCase();
        const email = (s.email || '').toLowerCase();
        return (
          code.includes(query) ||
          name.includes(query) ||
          pic.includes(query) ||
          phone.includes(query) ||
          email.includes(query)
        );
      }

      return true;
    });
  }, [suppliers, debouncedSearch, statusFilter]);

  // Pagination
  const totalItems = filteredSuppliers.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedSuppliers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredSuppliers.slice(start, start + pageSize);
  }, [filteredSuppliers, currentPage, pageSize]);

  // Format Date
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const ok = await confirmDialog({
      title: 'Hapus Supplier',
      message: `Apakah Anda yakin ingin menghapus supplier "${name}"?`,
      confirmText: 'Hapus',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await deleteSupplierMutation.mutateAsync(id);
      toast.success(`Supplier "${name}" berhasil dihapus.`);
    } catch (err: unknown) {
      toast.error(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Gagal menghapus supplier.'
      );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Supplier</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola data supplier yang digunakan untuk kebutuhan pembelian bahan baku dan packaging.
          </p>
        </div>

        <Button
          variant="primary"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => navigate('/inventory/suppliers/create')}
        >
          Tambah Supplier
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 border border-slate-200 rounded-2xl shadow-xs">
        <div className="flex-1 max-w-md">
          <SearchInput
            value={search}
            onChange={(val) => {
              setSearch(val);
              setCurrentPage(1);
            }}
            onClear={() => setSearch('')}
            placeholder="Cari supplier / PIC / telepon / email..."
          />
        </div>

        <div className="w-48">
          <FormSelect
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as 'ALL' | 'ACTIVE' | 'INACTIVE');
              setCurrentPage(1);
            }}
          >
            <option value="ALL">Status: Semua</option>
            <option value="ACTIVE">Aktif</option>
            <option value="INACTIVE">Nonaktif</option>
          </FormSelect>
        </div>
      </div>

      {/* Supplier Table */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Kode Supplier</th>
                <th className="py-3.5 px-4">Nama Supplier</th>
                <th className="py-3.5 px-4">PIC</th>
                <th className="py-3.5 px-4">No. Telepon</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4">Updated</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8}>
                    <LoadingState message="Memuat daftar supplier..." />
                  </td>
                </tr>
              ) : paginatedSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <EmptyState
                      icon={<Truck className="w-8 h-8 opacity-30 mx-auto" />}
                      title="Belum ada supplier"
                      description={
                        search || statusFilter !== 'ALL'
                          ? 'Tidak ada supplier yang sesuai dengan pencarian atau filter Anda.'
                          : 'Tambahkan supplier pertama untuk mempermudah pembelian bahan baku dan packaging.'
                      }
                      action={
                        !search && statusFilter === 'ALL' ? (
                          <Button
                            variant="primary"
                            size="sm"
                            leftIcon={<Plus className="w-4 h-4" />}
                            onClick={() => navigate('/inventory/suppliers/create')}
                          >
                            Tambah Supplier
                          </Button>
                        ) : undefined
                      }
                    />
                  </td>
                </tr>
              ) : (
                paginatedSuppliers.map((s) => {
                  const isActive = s.status === 'ACTIVE' || s.isActive !== false;
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">
                        {s.code || '-'}
                      </td>

                      <td className="py-3.5 px-4">
                        <Link
                          to={`/inventory/suppliers/${s.id}`}
                          className="font-bold text-slate-900 hover:text-[#0D5C53] transition-colors"
                        >
                          {s.name}
                        </Link>
                      </td>

                      <td className="py-3.5 px-4 font-medium text-slate-800">
                        {s.contactPerson || '-'}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-700">
                        {s.phone ? (
                          <span className="flex items-center gap-1.5">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {s.phone}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-600">
                        {s.email ? (
                          <span className="flex items-center gap-1.5">
                            <Mail className="w-3 h-3 text-slate-400" />
                            {s.email}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <Badge variant={isActive ? 'success' : 'neutral'} dot>
                          {isActive ? 'Aktif' : 'Nonaktif'}
                        </Badge>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-500">
                        {formatDate(s.updatedAt || s.createdAt)}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link to={`/inventory/suppliers/${s.id}`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-slate-600 hover:text-[#0D5C53]"
                              title="Lihat Detail"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
                          </Link>
                          <Link to={`/inventory/suppliers/${s.id}/edit`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-slate-600 hover:text-blue-600"
                              title="Edit Supplier"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(s.id, s.name)}
                            className="text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                            title="Hapus Supplier"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalItems > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t border-slate-200 gap-3 text-xs text-slate-500">
            <span>
              Menampilkan{' '}
              <strong className="text-slate-700 font-semibold">
                {(currentPage - 1) * pageSize + 1}
              </strong>{' '}
              -{' '}
              <strong className="text-slate-700 font-semibold">
                {Math.min(currentPage * pageSize, totalItems)}
              </strong>{' '}
              dari <strong className="text-slate-700 font-semibold">{totalItems}</strong> supplier
            </span>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
              >
                Sebelumnya
              </Button>

              <div className="flex items-center gap-1 px-2 font-semibold text-slate-700">
                <span>{currentPage}</span>
                <span className="text-slate-400">/</span>
                <span>{totalPages}</span>
              </div>

              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
              >
                Selanjutnya
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
