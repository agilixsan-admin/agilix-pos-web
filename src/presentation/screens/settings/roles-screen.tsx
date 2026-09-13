import React, { useEffect, useState } from 'react';
import type { Role } from '@model/Settings';
import { settingsService } from '@domain/services/settings-service';
import { ShieldCheck, Loader2 } from 'lucide-react';

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
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Role & Hak Akses (RBAC)</h1>
        <p className="text-xs text-slate-500 mt-0.5">Daftar peran pengguna sistem dan izin akses menu operasional.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
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
                <td colSpan={4} className="py-12 text-center text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#0D5C53]" />
                  <span>Memuat role & permissions...</span>
                </td>
              </tr>
            ) : roles.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-12 text-center text-slate-400">
                  <ShieldCheck className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="font-semibold text-slate-600">Belum ada role</p>
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
                        <span key={idx} className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-mono">
                          {p}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold">
                      {r.isSystem ? 'Sistem' : 'Kustom'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

