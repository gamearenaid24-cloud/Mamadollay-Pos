import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { Outlet } from '../types';
import { Building2, MapPin, Phone } from 'lucide-react';

export default function Outlets() {
  const [outlets, setOutlets] = useState<Outlet[]>([]);

  useEffect(() => {
    return onSnapshot(collection(db, 'outlets'), (snap) => {
      const list: Outlet[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() } as any));
      setOutlets(list);
    });
  }, []);

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">Multi-Outlet Management</h2>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Global Store Network</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {outlets.map(outlet => (
          <div key={outlet.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-blue-400 transition-all group">
            <div className="flex items-start justify-between mb-6">
               <div className="p-3 bg-slate-900 rounded-lg text-white group-hover:bg-blue-600 transition-colors">
                  <Building2 className="w-5 h-5" />
               </div>
               <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-[9px] font-bold">OPERATIONAL</span>
            </div>
            <h3 className="text-lg font-black text-slate-900 mb-4">{outlet.name}</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-slate-500">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-medium">{outlet.address}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-500">
                <Phone className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-medium">{outlet.phone}</span>
              </div>
            </div>
            <div className="mt-8 pt-6 border-t border-slate-100 flex gap-2">
              <button className="flex-1 bg-slate-50 hover:bg-slate-100 py-2 rounded font-bold text-[10px] text-slate-600 border border-slate-200 uppercase tracking-widest transition-all">Terminals</button>
              <button className="flex-1 bg-slate-50 hover:bg-slate-100 py-2 rounded font-bold text-[10px] text-slate-600 border border-slate-200 uppercase tracking-widest transition-all">Stocks</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
