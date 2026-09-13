import React, { useEffect, useState } from 'react';
import type { AuditLogItem } from '@model/Settings';
import { settingsService } from '@domain/services/settings-service';
import { ShieldAlert, Search, Eye, Loader2, Calendar, User, X, Filter } from 'lucide-react';

export const AuditLogsScreen: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedAction, setSelectedAction] = useState('ALL');
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await settingsService.getAuditLogs({
        action: selectedAction === 'ALL' ? undefined : selectedAction,
      });
      setLogs(res.items);
    } catch (err) {
      console.error('Failed to load audit logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedAction]);

  const filteredLogs = logs.filter((log) => {
    const q = search.toLowerCase();
    const actionMatch = log.action?.toLowerCase().includes(q);
    const actorMatch = log.actorType?.toLowerCase().includes(q) || log.actorName?.toLowerCase().includes(q);
    return actionMatch || actorMatch;
  });

  const getActionBadge = (action: string) => {
    if (action.includes('LOGIN')) {
      return <span className="bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full text-[10px] font-bold">LOGIN</span>;
    }
    if (action.includes('VOID') || action.includes('CANCEL')) {
      return <span className="bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded-full text-[10px] font-bold">{action}</span>;
    }
    if (action.includes('LOCK') || action.includes('DELETE')) {
      return <span className="bg-red-50 text-red-700 px-2.5 py-0.5 rounded-full text-[10px] font-bold">{action}</span>;
    }
    if (action.includes('CREATE') || action.includes('SETTLED')) {
      return <span className="bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full text-[10px] font-bold">{action}</span>;
    }
    return <span className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full text-[10px] font-bold">{action}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Audit Log & Rekam Aktivitas</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Log jejak audit keamanan seluruh aktivitas operasional kasir, sistem, dan perubahan data.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari aksi, pelaku..."
              className="bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53] w-60"
            />
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-3.5 px-4">Waktu</th>
              <th className="py-3.5 px-4">Tipe Aktor</th>
              <th className="py-3.5 px-4">Pelaku / User</th>
              <th className="py-3.5 px-4">Aksi (Event)</th>
              <th className="py-3.5 px-4">Rincian Metadata</th>
              <th className="py-3.5 px-4 text-right">Detail</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#0D5C53]" />
                  <span>Memuat audit log...</span>
                </td>
              </tr>
            ) : filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400">
                  <ShieldAlert className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="font-semibold text-slate-600">Belum ada catatan aktivitas</p>
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4 font-mono text-[11px] text-slate-700">
                    {new Date(log.createdAt).toLocaleString('id-ID', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-semibold">
                      {log.actorType}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-800">
                    {log.actorName || (log.actorId ? log.actorId.slice(0, 8) : 'System')}
                  </td>
                  <td className="py-3.5 px-4">{getActionBadge(log.action)}</td>
                  <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px] max-w-xs truncate">
                    {log.metadata ? JSON.stringify(log.metadata) : '-'}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Metadata Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Detail Audit Log</h3>
              <button onClick={() => setSelectedLog(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Waktu Kejadian</span>
                  <p className="font-semibold text-slate-800">{new Date(selectedLog.createdAt).toLocaleString('id-ID')}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Aktor</span>
                  <p className="font-semibold text-slate-800">{selectedLog.actorType} ({selectedLog.actorId || 'System'})</p>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Aksi (Action)</span>
                <p className="font-bold text-slate-900 text-sm bg-slate-50 p-2.5 rounded-xl border border-slate-100 font-mono">
                  {selectedLog.action}
                </p>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Payload Metadata (JSON)</span>
                <pre className="bg-slate-900 text-emerald-400 p-4 rounded-xl text-[11px] font-mono overflow-x-auto leading-relaxed">
                  {JSON.stringify(selectedLog.metadata || {}, null, 2)}
                </pre>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedLog(null)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

