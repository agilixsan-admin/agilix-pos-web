import React, { useState } from 'react';
import type { AuditLogItem } from '@model/Settings';
import { useAuditLogs, useDebounce } from '@domain/hooks';
import { ShieldAlert, Eye, Calendar, User } from 'lucide-react';
import {
  Button,
  Badge,
  Card,
  SearchInput,
  Modal,
  LoadingState,
  EmptyState,
} from '@presentation/components/ui';

export const AuditLogsScreen: React.FC = () => {
  const [selectedAction, setSelectedAction] = useState('ALL');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 200);
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  const { data, isLoading: loading } = useAuditLogs({
    action: selectedAction === 'ALL' ? undefined : selectedAction,
  });
  const logs = data?.items || [];

  const filteredLogs = logs.filter((log) => {
    const q = debouncedSearch.toLowerCase();
    const actionMatch = log.action?.toLowerCase().includes(q);
    const actorMatch =
      log.actorType?.toLowerCase().includes(q) ||
      log.actorName?.toLowerCase().includes(q);
    return actionMatch || actorMatch;
  });

  const getActionBadge = (action: string) => {
    if (action.includes('LOGIN')) {
      return <Badge variant="info">LOGIN</Badge>;
    }
    if (action.includes('VOID') || action.includes('CANCEL')) {
      return <Badge variant="warning">{action}</Badge>;
    }
    if (action.includes('LOCK') || action.includes('DELETE')) {
      return <Badge variant="danger">{action}</Badge>;
    }
    if (action.includes('CREATE') || action.includes('SETTLED')) {
      return <Badge variant="success">{action}</Badge>;
    }
    return <Badge variant="neutral">{action}</Badge>;
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Audit Log & Rekam Aktivitas</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Log jejak audit keamanan seluruh aktivitas operasional kasir, sistem, dan perubahan data.
          </p>
        </div>

        <div className="w-64">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Cari aksi, pelaku..."
          />
        </div>
      </div>

      <Card padding="none">
        <div className="overflow-x-auto">
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
                  <td colSpan={6}>
                    <LoadingState message="Memuat audit log..." />
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyState
                      icon={<ShieldAlert className="w-8 h-8 opacity-30 mx-auto" />}
                      title="Belum ada catatan audit"
                      description="Aktivitas sistem dan transaksi akan tercatat otomatis di sini."
                    />
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
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
                      <Badge variant="neutral">{log.actorType}</Badge>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {log.actorName || log.actorId || 'Sistem'}
                    </td>
                    <td className="py-3.5 px-4">{getActionBadge(log.action)}</td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 max-w-xs truncate">
                      {JSON.stringify(log.metadata || {})}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedLog(log)}
                        leftIcon={<Eye className="w-3.5 h-3.5" />}
                      >
                        Detail
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Reusable Detail Modal */}
      <Modal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title="Rincian Jejak Audit (Log Detail)"
        maxWidth="md"
      >
        {selectedLog && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <div>
                <span className="text-slate-400 block mb-0.5">Waktu Kejadian</span>
                <span className="font-semibold text-slate-800 font-mono">
                  {new Date(selectedLog.createdAt).toLocaleString('id-ID')}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Aksi / Event</span>
                <span className="font-bold text-slate-900">{selectedLog.action}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Tipe Aktor</span>
                <span className="font-medium text-slate-700">{selectedLog.actorType}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Pelaku / Aktor</span>
                <span className="font-semibold text-slate-800">
                  {selectedLog.actorName || selectedLog.actorId || '-'}
                </span>
              </div>
            </div>

            <div>
              <span className="text-slate-500 font-semibold block mb-1.5">
                Payload / Metadata JSON
              </span>
              <pre className="bg-slate-900 text-slate-100 p-3.5 rounded-xl font-mono text-[11px] overflow-x-auto max-h-60 leading-relaxed">
                {JSON.stringify(selectedLog.metadata, null, 2)}
              </pre>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                variant="outline"
                onClick={() => setSelectedLog(null)}
              >
                Tutup
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
