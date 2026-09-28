import React from 'react';
import {
  ConciergeBell,
  ShoppingBag,
  Bike,
  CalendarClock,
  Sparkles,
  Clock,
  CheckCircle2,
  Printer,
  Receipt,
  Layers,
} from 'lucide-react';
import { Card, Badge } from '@presentation/components/ui';

interface OrderTypeChannel {
  code: string;
  name: string;
  desc: string;
  status: 'active' | 'coming_soon';
  icon: React.ElementType;
  badgeLabel: string;
  badgeVariant: 'success' | 'warning' | 'info';
  details: string;
}

export const OrderTypesScreen: React.FC = () => {
  const channels: OrderTypeChannel[] = [
    {
      code: 'DINE_IN',
      name: 'Dine In (Makan di Tempat)',
      desc: 'Pesanan makan di tempat dengan integrasi pemilihan nomor meja kasir.',
      status: 'active',
      icon: ConciergeBell,
      badgeLabel: 'Default Sistem (Aktif)',
      badgeVariant: 'success',
      details: 'Tersedia di layar kasir POS utama dengan pemilihan meja & cetak struk.',
    },
    {
      code: 'TAKE_AWAY',
      name: 'Take Away (Bungkus)',
      desc: 'Pesanan dibawa pulang langsung oleh pelanggan tanpa reservasi meja.',
      status: 'active',
      icon: ShoppingBag,
      badgeLabel: 'Default Sistem (Aktif)',
      badgeVariant: 'success',
      details: 'Tersedia di layar kasir POS utama dengan nomor antrean pesanan langsung.',
    },
    {
      code: 'DELIVERY',
      name: 'Delivery / Ojek Online',
      desc: 'Pesanan pengantaran kurir outlet atau integrasi mitra agregator online.',
      status: 'coming_soon',
      icon: Bike,
      badgeLabel: 'Will Be Coming Soon',
      badgeVariant: 'warning',
      details: 'Sinkronisasi otomatis order GoFood, GrabFood, & ShopeeFood langsung ke POS.',
    },
    {
      code: 'CATERING',
      name: 'Catering & Pre-Order',
      desc: 'Pesanan terjadwal (booking/DP) dengan pengiriman khusus dalam jumlah besar.',
      status: 'coming_soon',
      icon: CalendarClock,
      badgeLabel: 'Will Be Coming Soon',
      badgeVariant: 'warning',
      details: 'Pencatatan uang muka (DP), jadwal produksi dapur, dan pelunasan bertahap.',
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Tipe Pesanan (Order Types)</h1>
            <Badge variant="warning" size="sm" className="font-semibold gap-1">
              <Clock className="w-3 h-3" />
              Will Be Coming Soon
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Konfigurasi kanal penjualan dan pemetaan alur operasional pesanan kasir.
          </p>
        </div>
      </div>

      {/* Notice / Informational Banner */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200/80 rounded-2xl p-5 shadow-xs">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="space-y-1.5 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-bold text-amber-950">
                Fitur Kustomisasi Tipe Pesanan Sedang Disiapkan (Will Be Coming Soon)
              </h2>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                In Development
              </span>
            </div>
            <p className="text-xs text-amber-900/80 leading-relaxed">
              Saat ini kasir Agilix POS secara otomatis beroperasi menggunakan 2 kanal standar:{' '}
              <strong className="font-semibold text-slate-900">Dine In (Makan di Tempat)</strong> dan{' '}
              <strong className="font-semibold text-slate-900">Take Away (Bawa Pulang)</strong>.
              Pengaturan kustomisasi tipe pesanan, penambahan biaya layanan per channel (surcharge/take away fee),
              pemisahan rute printer dapur, serta integrasi pemesanan online sedang dalam tahap penyempurnaan dan akan segera hadir.
            </p>
          </div>
        </div>
      </div>

      {/* Grid of Channels */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Kanal Pemesanan Sistem
          </h2>
          <span className="text-[11px] text-slate-400">
            2 Aktif • 2 Segera Hadir
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {channels.map((ch) => {
            const Icon = ch.icon;
            const isComingSoon = ch.status === 'coming_soon';

            return (
              <Card
                key={ch.code}
                className={`relative flex flex-col justify-between transition-all duration-200 ${
                  isComingSoon
                    ? 'border-dashed border-amber-200/90 bg-amber-50/20 hover:border-amber-300'
                    : 'border-slate-200 hover:border-teal-300 hover:shadow-xs'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                        isComingSoon
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-teal-50 text-[#0D5C53]'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <Badge variant={ch.badgeVariant} size="sm" dot={!isComingSoon}>
                      {ch.badgeLabel}
                    </Badge>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm">{ch.name}</h3>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{ch.desc}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100/80 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-mono text-slate-400">{ch.code}</span>
                    <span
                      className={`font-semibold ${
                        isComingSoon ? 'text-amber-600' : 'text-emerald-600'
                      }`}
                    >
                      {isComingSoon ? 'Segera Hadir' : 'Siap Digunakan'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 bg-slate-50 rounded-lg p-2 leading-snug">
                    {ch.details}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Feature Capabilities / Roadmap Preview */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#0D5C53]" />
            Rencana Kemampuan Fitur Tipe Pesanan (Roadmap Preview)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Berikut fitur yang akan dapat dikonfigurasi saat modul ini resmi dirilis:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-teal-100 text-[#0D5C53] flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-slate-800">Biaya Kemasan & Layanan (Surcharge)</h3>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Atur biaya pembungkus otomatis untuk Take Away atau biaya penanganan kurir untuk pesanan delivery.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-teal-100 text-[#0D5C53] flex items-center justify-center">
              <Printer className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-slate-800">Routing Printer Dapur & Bar</h3>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Tiket pesanan otomatis diarahkan ke printer dapur khusus berdasarkan tipe pesanan dan outlet aktif.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-teal-100 text-[#0D5C53] flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-slate-800">Integrasi Agregator Ojol</h3>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Terima pesanan GoFood, GrabFood, dan ShopeeFood langsung di kasir tanpa perlu input manual.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
