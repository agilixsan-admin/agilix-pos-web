import React, { useEffect, useState } from 'react';
import type { Role } from '@model/Settings';
import { settingsService } from '@domain/services/settings-service';
import { ShieldCheck } from 'lucide-react';
import { Badge, Card, LoadingState, EmptyState } from '@presentation/components/ui';

export const RolesScreen: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await settingsService.getRoles();
      setRoles(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Role & Hak Akses (RBAC)</h1>
        <p className="text-xs text-slate-500 mt-0.5">Daftar peran pengguna sistem dan izin akses menu operasional.</p>
      </div>

      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Nama Peran (Role)</th>
                <th className="py-3.5 px-4">Deskripsi</th>
                <th className="py-3.5 px-4">Cakupan Permissions</th>
                <th className="py-3.5 px-4">Tipe</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={4}>
                    <LoadingState message="Memuat role & permissions..." />
                  </td>
                </tr>
              ) : roles.length === 0 ? (
                <tr>
                  <td colSpan={4}>
                    <EmptyState
                      icon={<ShieldCheck className="w-8 h-8 opacity-30 mx-auto" />}
                      title="Belum ada role"
                      description="Role sistem akan dimuat otomatis berdasarkan konfigurasi RBAC."
                    />
                  </td>
                </tr>
              ) : (
                roles.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{r.name}</td>
                    <td className="py-3.5 px-4 text-slate-600">{r.description || '-'}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1 max-w-md">
                        {r.permissions?.map((p, idx) => (
                          <span
                            key={idx}
                            className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-mono"
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={r.isSystem ? 'info' : 'neutral'}>
                        {r.isSystem ? 'Sistem' : 'Kustom'}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
