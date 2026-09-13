import React, { useState } from 'react';
import { ConciergeBell } from 'lucide-react';
import { Card, Badge, Button } from '@presentation/components/ui';

export const OrderTypesScreen: React.FC = () => {
  const [orderTypes, setOrderTypes] = useState([
    {
      code: 'DINE_IN',
      name: 'Dine In (Makan di Tempat)',
      desc: 'Memerlukan pemilihan nomor meja dan layanan kasir.',
      active: true,
    },
    {
      code: 'TAKE_AWAY',
      name: 'Take Away (Bungkus)',
      desc: 'Pesanan dibawa pulang langsung tanpa meja.',
      active: true,
    },
    {
      code: 'DELIVERY',
      name: 'Delivery / Ojek Online',
      desc: 'Pesanan pengantaran atau integrasi kurir.',
      active: false,
    },
  ]);

  const handleToggle = (code: string) => {
    setOrderTypes(
      orderTypes.map((ot) => (ot.code === code ? { ...ot, active: !ot.active } : ot))
    );
  };

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Tipe Pesanan (Order Types)</h1>
        <p className="text-xs text-slate-500 mt-0.5">Atur kanal pemesanan aktif pada sistem POS.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {orderTypes.map((ot) => (
          <Card key={ot.code} className="flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center text-[#0D5C53]">
                  <ConciergeBell className="w-5 h-5" />
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle(ot.code)}
                  className="cursor-pointer"
                >
                  <Badge variant={ot.active ? 'success' : 'danger'} dot>
                    {ot.active ? 'Aktif' : 'Nonaktif'}
                  </Badge>
                </button>
              </div>
              <h3 className="font-bold text-slate-900 text-sm">{ot.name}</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">{ot.desc}</p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-400">{ot.code}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleToggle(ot.code)}
              >
                {ot.active ? 'Nonaktifkan' : 'Aktifkan'}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
