import React from 'react';
import { ConciergeBell, Check } from 'lucide-react';

export const OrderTypesScreen: React.FC = () => {
  const orderTypes = [
    { code: 'DINE_IN', name: 'Dine In (Makan di Tempat)', desc: 'Memerlukan pemilihan nomor meja dan layanan kasir.', active: true },
    { code: 'TAKE_AWAY', name: 'Take Away (Bungkus)', desc: 'Pesanan dibawa pulang langsung tanpa meja.', active: true },
    { code: 'DELIVERY', name: 'Delivery / Ojek Online', desc: 'Pesanan pengantaran atau integrasi kurir.', active: false },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Tipe Pesanan (Order Types)</h1>
        <p className="text-xs text-slate-500 mt-0.5">Atur kanal pemesanan aktif pada sistem POS.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {orderTypes.map((ot) => (
          <div key={ot.code} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl bg-[#E6F4F1] flex items-center justify-center text-[#0D5C53]">
                  <ConciergeBell className="w-5 h-5" />
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ot.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                  {ot.active ? 'Aktif' : 'Non-Aktif'}
                </span>
              </div>
              <h3 className="font-bold text-slate-900 text-sm">{ot.name}</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">{ot.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

