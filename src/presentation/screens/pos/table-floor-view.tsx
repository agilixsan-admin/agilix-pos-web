import React, { useState } from 'react';
import type { Table } from '@model/Settings';
import type { Order } from '@model/Order';
import { useAuthStore } from '@domain/state/auth-store';
import { useOutlets } from '@domain/hooks';
import {
  Plus,
  Utensils,
  Clock,
  Users,
  Search,
  Coffee,
  Layers,
  Building2,
} from 'lucide-react';
import { Button, Badge, LoadingState, EmptyState } from '@presentation/components/ui';

interface TableFloorViewProps {
  tables: Table[];
  openOrders: Order[];
  loading: boolean;
  onSelectTableForOrder: (table: Table) => void;
  onSelectOpenOrderForPayment: (order: Order) => void;
  onSelectOpenOrderForAppend: (order: Order) => void;
  onNewOrderClick: () => void;
}

export const TableFloorView: React.FC<TableFloorViewProps> = ({
  tables,
  openOrders,
  loading,
  onSelectTableForOrder,
  onSelectOpenOrderForPayment,
  onSelectOpenOrderForAppend,
  onNewOrderClick,
}) => {
  const { user, currentOutlet, setCurrentOutlet } = useAuthStore();
  const { data: rawOutlets = [] } = useOutlets();
  const outlets = Array.isArray(rawOutlets) && rawOutlets.length > 0
    ? rawOutlets
    : useAuthStore.getState().outlets || [];
  const effectiveOutlet = currentOutlet || (outlets.length > 0 ? outlets[0] : null);
  const [selectedFloor, setSelectedFloor] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'AVAILABLE' | 'OCCUPIED' | 'RESERVED'>('ALL');
  const [searchTable, setSearchTable] = useState<string>('');

  // Dynamically extract unique custom sections from the actual table list in this outlet
  const dynamicSections = Array.from(
    new Set(tables.map((t) => (t.section?.trim() ? t.section.trim() : 'Main Area')))
  );

  // Filter Tables by Search, Status, and Dynamic Section
  const filteredTables = tables.filter((t) => {
    const tableName = t.name || t.tableNumber || '';
    const matchesSearch = tableName.toLowerCase().includes(searchTable.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    const tableSec = t.section?.trim() || 'Main Area';
    const matchesFloor = selectedFloor === 'ALL' || tableSec.toLowerCase() === selectedFloor.toLowerCase();
    return matchesSearch && matchesStatus && matchesFloor;
  });

  // Calculate Stats
  const availableCount = tables.filter((t) => t.status === 'AVAILABLE').length;
  const occupiedCount = tables.filter((t) => t.status === 'OCCUPIED').length;
  const reservedCount = tables.filter((t) => t.status === 'RESERVED').length;

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-6rem)] overflow-hidden bg-slate-50 p-4 space-y-4">
      {/* Top POS Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0D5C53] text-white flex items-center justify-center font-bold text-base shadow-xs">
            {effectiveOutlet?.name?.charAt(0) || 'A'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">{effectiveOutlet?.name || 'Agilix Outlet'}</h2>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                Online • Kasir Aktif
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Kasir: <span className="font-semibold text-slate-700">{user?.name || user?.email}</span> •{' '}
              {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {outlets && outlets.length > 1 && (
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 shadow-2xs">
              <Building2 className="w-4 h-4 text-[#0D5C53]" />
              <span className="text-xs text-slate-500 font-medium">Cabang:</span>
              <select
                aria-label="Pilih Cabang POS"
                value={effectiveOutlet?.id || ''}
                onChange={(e) => {
                  const found = outlets.find((o) => o.id === e.target.value);
                  if (found) setCurrentOutlet(found);
                }}
                className="bg-transparent text-xs font-bold text-slate-800 focus:outline-hidden cursor-pointer"
              >
                {outlets.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <Button
            variant="primary"
            size="md"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={onNewOrderClick}
            className="w-full sm:w-auto font-bold shadow-md shadow-teal-900/10"
          >
            + Buat Pesanan Baru
          </Button>
        </div>
      </div>

      {/* Main Split Grid: Active Orders Banner & Table Floor Grid */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 overflow-hidden">
        {/* Left / Main Floor Grid */}
        <div className="flex-1 flex flex-col bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          {/* Controls Bar */}
          <div className="p-4 border-b border-slate-100 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Dynamic Floor / Section Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                <button
                  onClick={() => setSelectedFloor('ALL')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    selectedFloor === 'ALL'
                      ? 'bg-[#0D5C53] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Semua Area ({tables.length})
                </button>
                {dynamicSections.map((sec) => {
                  const count = tables.filter(
                    (t) => (t.section?.trim() || 'Main Area').toLowerCase() === sec.toLowerCase()
                  ).length;
                  return (
                    <button
                      key={sec}
                      onClick={() => setSelectedFloor(sec)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                        selectedFloor.toLowerCase() === sec.toLowerCase()
                          ? 'bg-[#0D5C53] text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {sec} ({count})
                    </button>
                  );
                })}
              </div>

              {/* Search */}
              <div className="flex items-center gap-2">
                <div className="relative w-44">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari meja..."
                    value={searchTable}
                    onChange={(e) => setSearchTable(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#0D5C53]/20 focus:border-[#0D5C53]"
                  />
                </div>
              </div>
            </div>

            {/* Status Counts Legend */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  statusFilter === 'ALL'
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Semua ({tables.length})
              </button>
              <button
                onClick={() => setStatusFilter('AVAILABLE')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  statusFilter === 'AVAILABLE'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Tersedia ({availableCount})
              </button>
              <button
                onClick={() => setStatusFilter('OCCUPIED')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  statusFilter === 'OCCUPIED'
                    ? 'bg-[#0D5C53] text-white'
                    : 'bg-teal-50 text-[#0D5C53] hover:bg-teal-100'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-[#0D5C53]" />
                Terisi ({occupiedCount})
              </button>
              <button
                onClick={() => setStatusFilter('RESERVED')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  statusFilter === 'RESERVED'
                    ? 'bg-amber-600 text-white'
                    : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Reservasi ({reservedCount})
              </button>
            </div>
          </div>

          {/* Tables Grid */}
          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <LoadingState message="Memuat denah meja..." className="h-full" />
            ) : filteredTables.length === 0 ? (
              <EmptyState
                icon={<Utensils className="w-10 h-10 opacity-30 text-slate-400 mx-auto" />}
                title="Tidak Ada Meja Ditemukan"
                description={
                  selectedFloor === 'ALL'
                    ? 'Coba ubah filter status atau kata kunci pencarian.'
                    : `Tidak ada meja pada area "${selectedFloor}".`
                }
                className="h-full"
              />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3.5">
                {filteredTables.map((table) => {
                  const activeOrder = openOrders.find((o) => o.tableId === table.id);
                  const isOccupied = table.status === 'OCCUPIED' || Boolean(activeOrder);

                  if (isOccupied && activeOrder) {
                    // Occupied Table Card
                    return (
                      <div
                        key={table.id}
                        onClick={() => onSelectOpenOrderForPayment(activeOrder)}
                        className="bg-[#0D5C53] text-white rounded-2xl p-4 flex flex-col justify-between shadow-md hover:shadow-lg transition-all cursor-pointer group hover:scale-[1.02] border border-teal-700"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-bold text-sm text-teal-100">
                              Meja {table.name || table.tableNumber}
                            </span>
                            <span className="text-[10px] bg-teal-800/80 text-teal-200 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                              <Users className="w-2.5 h-2.5" />
                              {table.capacity} Kursi
                            </span>
                          </div>

                          <div className="mb-2">
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-teal-200/80 bg-teal-900/40 px-2 py-0.5 rounded-md">
                              <Layers className="w-2.5 h-2.5" />
                              {table.section || 'Main Area'}
                            </span>
                          </div>

                          <div className="text-xs text-teal-100/90 font-medium truncate mb-1">
                            {activeOrder.customerName || 'Tamu Dine-In'}
                          </div>

                          <div className="text-[10px] text-teal-200/70 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            <span>
                              {activeOrder.items?.length || 0} Menu •{' '}
                              {new Date(activeOrder.createdAt || Date.now()).toLocaleTimeString('id-ID', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        </div>

                        <div className="mt-4 pt-2.5 border-t border-teal-700/60 flex items-center justify-between">
                          <span className="text-xs font-extrabold text-white">
                            Rp {Number(activeOrder.totalAmount || 0).toLocaleString('id-ID')}
                          </span>
                          <span className="text-[10px] bg-white text-[#0D5C53] px-2 py-1 rounded-lg font-bold group-hover:bg-teal-50 transition-colors">
                            Bayar →
                          </span>
                        </div>
                      </div>
                    );
                  }

                  // Available or Reserved Table Card
                  const isReserved = table.status === 'RESERVED';

                  return (
                    <div
                      key={table.id}
                      onClick={() => {
                        if (!isReserved) {
                          onSelectTableForOrder(table);
                        }
                      }}
                      className={`rounded-2xl p-4 flex flex-col justify-between transition-all border-2 ${
                        isReserved
                          ? 'bg-amber-50/50 border-amber-200 cursor-not-allowed opacity-80'
                          : 'bg-white border-slate-200 hover:border-[#0D5C53] hover:shadow-md cursor-pointer group active:scale-[0.98]'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-bold text-sm text-slate-800">
                            Meja {table.name || table.tableNumber}
                          </span>
                          <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                            <Users className="w-2.5 h-2.5" />
                            {table.capacity} Kursi
                          </span>
                        </div>

                        <div className="mb-2">
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                            <Layers className="w-2.5 h-2.5 text-slate-400" />
                            {table.section || 'Main Area'}
                          </span>
                        </div>

                        <div className="text-xs text-slate-400">
                          {isReserved ? 'Meja Dipesan' : 'Siap Digunakan'}
                        </div>
                      </div>

                      <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-between">
                        <Badge variant={isReserved ? 'warning' : 'success'} size="sm">
                          {isReserved ? 'Reservasi' : 'Tersedia'}
                        </Badge>

                        {!isReserved && (
                          <span className="text-[11px] text-[#0D5C53] font-bold group-hover:underline flex items-center gap-0.5">
                            Pilih Meja +
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Open Orders / Pesanan Berjalan */}
        <div className="w-full lg:w-80 bg-white border border-slate-200 rounded-2xl shadow-xs flex flex-col overflow-hidden shrink-0">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <h3 className="font-bold text-slate-800 text-sm">Pesanan Berjalan</h3>
            </div>
            <Badge variant="warning" size="sm">
              {openOrders.length} Aktif
            </Badge>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {openOrders.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <Coffee className="w-10 h-10 opacity-30 text-slate-300 mb-2" />
                <p className="text-xs font-semibold text-slate-600">Tidak Ada Pesanan Aktif</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Semua transaksi telah diselesaikan atau belum ada pesanan baru.
                </p>
              </div>
            ) : (
              openOrders.map((order) => (
                <div
                  key={order.id}
                  className="p-3.5 bg-slate-50 hover:bg-teal-50/40 border border-slate-200 hover:border-teal-300 rounded-xl transition-all space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">
                      {order.tableName ? `Meja ${order.tableName}` : order.orderType}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {order.orderNumber || order.id.slice(0, 8)}
                    </span>
                  </div>

                  <div className="text-xs text-slate-500">
                    Pelanggan: <span className="font-semibold text-slate-800">{order.customerName || 'Umum'}</span>
                  </div>

                  {/* Items preview */}
                  <div className="text-[11px] text-slate-600 space-y-0.5 bg-white p-2 rounded-lg border border-slate-100">
                    {order.items?.slice(0, 3).map((item, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span className="truncate pr-1">{item.quantity}x {item.productName}</span>
                        <span className="font-mono text-slate-700">
                          Rp {(Number(item.price) * item.quantity).toLocaleString('id-ID')}
                        </span>
                      </div>
                    ))}
                    {(order.items?.length || 0) > 3 && (
                      <div className="text-[10px] text-slate-400 italic">
                        + {(order.items?.length || 0) - 3} item lainnya...
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Total Tagihan</span>
                      <span className="text-xs font-bold text-[#0D5C53]">
                        Rp {Number(order.totalAmount || 0).toLocaleString('id-ID')}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onSelectOpenOrderForAppend(order)}
                        className="text-[11px] px-2 py-1"
                      >
                        + Menu
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => onSelectOpenOrderForPayment(order)}
                        className="text-[11px] px-2.5 py-1"
                      >
                        Bayar
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
