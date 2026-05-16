import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError } from '../lib/firebase';
import { collection, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { Product } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { Package, Plus, Search } from 'lucide-react';
import { motion } from 'motion/react';

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'products'), (snap) => {
      const list: Product[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() } as any));
      setProducts(list);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const filtered = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">Inventory & Stock</h2>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Product Catalog Mgmt</p>
          </div>
        </div>
        <button className="bg-slate-900 text-white px-6 py-3 rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-blue-600 transition-all active:scale-95 shadow-lg">
          + Add New Product
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
             <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Search Catalog</div>
             <div className="relative">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
               <input 
                 type="text" 
                 placeholder="By SKU or Name..." 
                 className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 outline-none"
                 value={search}
                 onChange={e => setSearch(e.target.value)}
               />
             </div>
          </div>
        </div>

        <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
           <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Product Info</th>
                  <th className="px-6 py-4">SKU Code</th>
                  <th className="px-6 py-4 text-right">Unit cost</th>
                  <th className="px-6 py-4 text-right">Retail Prce</th>
                  <th className="px-6 py-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="text-xs text-slate-700 divide-y divide-slate-50">
                 {loading ? (
                   <tr><td colSpan={5} className="px-6 py-20 text-center text-slate-400">Loading catalog...</td></tr>
                 ) : filtered.length === 0 ? (
                   <tr><td colSpan={5} className="px-6 py-20 text-center text-slate-400">No products found</td></tr>
                 ) : filtered.map(p => (
                   <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                     <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">{p.name}</div>
                        <div className="text-[10px] text-slate-500 uppercase font-black">{p.category_name || 'General'}</div>
                     </td>
                     <td className="px-6 py-4 font-mono font-bold text-blue-600">{p.sku}</td>
                     <td className="px-6 py-4 text-right font-medium">{formatCurrency(p.cost)}</td>
                     <td className="px-6 py-4 text-right font-black text-slate-900">{formatCurrency(p.price)}</td>
                     <td className="px-6 py-4 text-center">
                        <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-[9px] font-bold">ACTIVE</span>
                     </td>
                   </tr>
                 ))}
              </tbody>
           </table>
        </div>
      </div>
    </div>
  );
}
